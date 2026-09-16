package com.telco.mwp.batch;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.FileWriter;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Map;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.telco.mwp.util.CommonUtil;
import com.telco.mwp.util.DBUtil;

/**
 * GPS 相關批次全部在這 (SD 4.4 Batch調整)
 * getGPSRequest / ProcessGPSReqFiles / BuildGPSResFiles / putGPSResponse /
 * GPSChargeMonitor / reconGPSDaily / reconGPSMonthly / reconGPSSummary / BuildDeductionCSPFile
 *
 * 注意: 排程間隔先拉長, demo 都用 /batch/run?job=xxx 手動觸發
 */
@Component
public class GpsBatchJobs {

    // 路徑都先寫死, 上線前記得改 (2013/4)
    static String SFTP_REQ_DIR = "data/gps-sftp/request";
    static String SFTP_INCOMING_DIR = "data/gps-sftp/incoming";
    static String SFTP_RECON_DIR = "data/gps-sftp/recon";
    static String SFTP_MONTHLY_DIR = "data/gps-sftp/monthly";
    static String WORK_REQ_DIR = "data/gps-work/request";
    static String WORK_RESP_DIR = "data/gps-work/response";
    static String NAS_DAILY_DIR = "data/nas/daily";
    static String NAS_MONTHLY_DIR = "data/nas/monthly";
    static String CSP_DIR = "data/csp";

    static String BILLING_AGREEMENT = "TELCO_TW"; // GpsSoapController 也有一份, 要改要一起改
    static String MERCHANT = "E000001";

    static int reqSeq = 0; // REQ_ID 流水號

    // ==================== 4.4.3 getGPSRequest 每小時 ====================

    @Scheduled(initialDelay = 120000, fixedDelay = 3600000)
    public void getGPSRequest() {
        List<File> files = new ArrayList<File>();
        walk(new File(SFTP_REQ_DIR), files);
        for (File f : files) {
            try {
                if (!f.getName().endsWith(".csv")) continue;
                int cnt = DBUtil.jdbc.queryForObject(
                        "SELECT COUNT(*) FROM MWP_GPS_REQ_LOG WHERE FILE_NAME='" + f.getName() + "'", Integer.class)
                        .intValue();
                if (cnt > 0) continue; // 抓過了
                copy(f, new File(WORK_REQ_DIR, f.getName()));
                reqSeq++;
                String reqId = System.currentTimeMillis() + "" + reqSeq;
                DBUtil.jdbc.update("INSERT INTO MWP_GPS_REQ_LOG (REQ_ID, CREATE_TIME, FILE_NAME, STATUS, LAST_MOD_TIME) VALUES ('"
                        + reqId + "','" + CommonUtil.now14() + "','" + f.getName() + "','I','" + CommonUtil.now14() + "')");
                System.out.println("[getGPSRequest] got " + f.getName());
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    // ==================== 4.4.1 ProcessGPSReqFiles ====================

    @Scheduled(initialDelay = 180000, fixedDelay = 3600000)
    public void processGPSReqFiles() {
        List<Map<String, Object>> logs = DBUtil.jdbc.queryForList("SELECT * FROM MWP_GPS_REQ_LOG WHERE STATUS='I'");
        for (Map<String, Object> log : logs) {
            String reqId = (String) log.get("REQ_ID");
            String fileName = (String) log.get("FILE_NAME");
            try {
                DBUtil.jdbc.update("UPDATE MWP_GPS_REQ_LOG SET STATUS='P', LAST_MOD_TIME='" + CommonUtil.now14()
                        + "' WHERE REQ_ID='" + reqId + "'");
                File f = new File(WORK_REQ_DIR, fileName);
                BufferedReader br = new BufferedReader(new FileReader(f));
                String line;
                while ((line = br.readLine()) != null) {
                    if (line.trim().length() == 0 || line.startsWith("#") || line.startsWith("Type,")) continue;
                    // CSV: Type,CorrelationId,TimestampMillis,BillingAgreementId,PriceMicros,Currency
                    String[] c = line.split(",");
                    String type = c[0].trim();
                    String corr = c[1].trim();
                    String ts = c[2].trim();
                    String priceMicros = c[4].trim();

                    // Idempotency: orderNo+type 有相同的直接 copy 一份 insert (包括 response 結果, 但 REQ_ID 不同)
                    List<Map<String, Object>> dup = DBUtil.jdbc
                            .queryForList("SELECT * FROM MWP_GPS_REQ_DETAIL WHERE CORRELATION_ID='" + corr
                                    + "' AND REQ_TYPE='" + type + "' AND RESULT_CODE IS NOT NULL");
                    if (dup.size() > 0) {
                        Map<String, Object> d = dup.get(0);
                        DBUtil.jdbc.update("INSERT INTO MWP_GPS_REQ_DETAIL (REQ_ID, REQ_TYPE, REQ_TIMESTAMP, CORRELATION_ID, BILLING_AGREEMENT_ID, RESP_TIMESTAMP, RESULT_CODE, MESSAGE) VALUES ('"
                                + reqId + "','" + type + "','" + ts + "','" + corr + "','" + BILLING_AGREEMENT + "','"
                                + d.get("RESP_TIMESTAMP") + "','" + d.get("RESULT_CODE") + "','" + d.get("MESSAGE") + "')");
                        continue;
                    }

                    DBUtil.jdbc.update("INSERT INTO MWP_GPS_REQ_DETAIL (REQ_ID, REQ_TYPE, REQ_TIMESTAMP, CORRELATION_ID, BILLING_AGREEMENT_ID) VALUES ('"
                            + reqId + "','" + type + "','" + ts + "','" + corr + "','" + BILLING_AGREEMENT + "')");

                    if (type.equalsIgnoreCase("Charge")) {
                        doCharge(reqId, type, corr, ts, priceMicros);
                    } else if (type.equalsIgnoreCase("Cancel")) {
                        doCancel(reqId, type, corr, ts);
                    } else if (type.equalsIgnoreCase("Refund")) {
                        doRefund(reqId, type, corr, ts, priceMicros);
                    } else {
                        setDetailResult(reqId, type, corr, "INVALID_TYPE", "unknown type " + type);
                    }
                }
                br.close();
                DBUtil.jdbc.update("UPDATE MWP_GPS_REQ_LOG SET STATUS='PD', LAST_MOD_TIME='" + CommonUtil.now14()
                        + "' WHERE REQ_ID='" + reqId + "'");
                // 搬到 Processed
                f.renameTo(new File(WORK_REQ_DIR + "/Processed", fileName));
                System.out.println("[processGPSReqFiles] done " + fileName);
            } catch (Exception e) {
                e.printStackTrace();
                DBUtil.jdbc.update("UPDATE MWP_GPS_REQ_LOG SET STATUS='F', LAST_MOD_TIME='" + CommonUtil.now14()
                        + "' WHERE REQ_ID='" + reqId + "'");
            }
        }
    }

    // Charge -> 付款: 有對應已授權交易 -> insert 扣款 record 後即算完成, tx_status='D'
    private void doCharge(String reqId, String type, String corr, String ts, String priceMicros) {
        List<Map<String, Object>> txs = DBUtil.jdbc.queryForList(
                "SELECT * FROM MWP_PAY_TRANS WHERE MEMO='" + corr + "' AND CHANNEL='0300'");
        if (txs.size() == 0) {
            setDetailResult(reqId, type, corr, "INVALID_TRANSACTION", "auth tx not found");
            System.out.println("[ALERT][MAIL to O&M] charge but no auth tx, corr=" + corr);
            return;
        }
        Map<String, Object> tx = txs.get(0);
        String status = (String) tx.get("TX_STATUS");
        String txid = (String) tx.get("TXID");
        if ("D".equals(status)) {
            setDetailResult(reqId, type, corr, "OK", "already charged");
            return;
        }
        if ("F".equals(status)) {
            setDetailResult(reqId, type, corr, "CANNOT_CHARGE", "tx canceled");
            return;
        }
        long amount = ((Number) tx.get("AMOUNT")).longValue();
        String now = CommonUtil.now14();
        DBUtil.jdbc.update("INSERT INTO MWP_BATCH_DEDUCTION_DETAIL (ID, TXID, TYPE, ACC_ID, SERVICE_ID, CHANNEL, AMOUNT, STATUS, CREATE_TIME) VALUES ('"
                + "BD" + System.currentTimeMillis() + "','" + txid + "','Charge','" + tx.get("ACC_ID") + "','"
                + tx.get("SERVICE_ID") + "','0300'," + amount + ",'B','" + now + "')");
        DBUtil.jdbc.update("UPDATE MWP_PAY_TRANS SET TX_STATUS='D', BILL_CSPTIME='" + now + "', MODIFY_DATE='" + now
                + "' WHERE TXID='" + txid + "'");
        setDetailResult(reqId, type, corr, "OK", "charged");
    }

    // Cancel -> 取消交易
    private void doCancel(String reqId, String type, String corr, String ts) {
        List<Map<String, Object>> txs = DBUtil.jdbc.queryForList(
                "SELECT * FROM MWP_PAY_TRANS WHERE MEMO='" + corr + "' AND CHANNEL='0300'");
        if (txs.size() == 0) {
            setDetailResult(reqId, type, corr, "INVALID_TRANSACTION", "auth tx not found");
            return;
        }
        Map<String, Object> tx = txs.get(0);
        String status = (String) tx.get("TX_STATUS");
        String txid = (String) tx.get("TXID");
        if ("D".equals(status)) {
            // 已經Charge不能Cancel
            setDetailResult(reqId, type, corr, "CANNOT_CANCEL", "already charged");
            return;
        }
        if ("F".equals(status)) {
            setDetailResult(reqId, type, corr, "OK", "already canceled");
            return;
        }
        String now = CommonUtil.now14();
        DBUtil.jdbc.update("UPDATE MWP_PAY_TRANS SET TX_STATUS='F', RETURN_CODE='Request Cancel', MODIFY_DATE='" + now
                + "' WHERE TXID='" + txid + "'");
        setDetailResult(reqId, type, corr, "OK", "canceled");
    }

    // Refund -> 退款
    private void doRefund(String reqId, String type, String corr, String ts, String priceMicros) {
        List<Map<String, Object>> txs = DBUtil.jdbc.queryForList(
                "SELECT * FROM MWP_PAY_TRANS WHERE MEMO='" + corr + "' AND CHANNEL='0300'");
        if (txs.size() == 0) {
            setDetailResult(reqId, type, corr, "INVALID_TRANSACTION", "tx not found");
            return;
        }
        Map<String, Object> tx = txs.get(0);
        if (!"D".equals(tx.get("TX_STATUS"))) {
            setDetailResult(reqId, type, corr, "CANNOT_REFUND", "tx not charged");
            return;
        }
        String txid = (String) tx.get("TXID");
        long amount = ((Number) tx.get("AMOUNT")).longValue();
        // refund_date 存 batch request file 中 type=REFUND 的 timestamp (轉 new-pay 時間格式)
        String refundDate = CommonUtil.utcMillisToTwTime(ts);
        // 走 refundTransaction 程序 (簡化: 直接寫 refund 表)
        DBUtil.jdbc.update("INSERT INTO MWP_PAY_REFUND (TXID, MERCHANT_ID, AMOUNT, REFUND_STATUS, REFUND_DATE, CREATE_TIME, RETURN_CODE) VALUES ('"
                + txid + "','" + MERCHANT + "'," + amount + ",'D','" + refundDate + "','" + CommonUtil.now14()
                + "','00000000')");
        setDetailResult(reqId, type, corr, "OK", "refunded");
    }

    private void setDetailResult(String reqId, String type, String corr, String code, String msg) {
        DBUtil.jdbc.update("UPDATE MWP_GPS_REQ_DETAIL SET RESP_TIMESTAMP='" + System.currentTimeMillis()
                + "', RESULT_CODE='" + code + "', MESSAGE='" + msg + "' WHERE REQ_ID='" + reqId
                + "' AND CORRELATION_ID='" + corr + "' AND REQ_TYPE='" + type + "'");
    }

    // ==================== 4.4.2 BuildGPSResFiles ====================

    @Scheduled(initialDelay = 240000, fixedDelay = 3600000)
    public void buildGPSResFiles() {
        List<Map<String, Object>> logs = DBUtil.jdbc.queryForList("SELECT * FROM MWP_GPS_REQ_LOG WHERE STATUS='PD'");
        for (Map<String, Object> log : logs) {
            String reqId = (String) log.get("REQ_ID");
            String fileName = (String) log.get("FILE_NAME");
            try {
                int pending = DBUtil.jdbc.queryForObject("SELECT COUNT(*) FROM MWP_GPS_REQ_DETAIL WHERE REQ_ID='"
                        + reqId + "' AND RESULT_CODE IS NULL", Integer.class).intValue();
                if (pending > 0) continue; // 還沒處理完

                String respName = fileName.replace("request_", "response_");
                FileWriter fw = new FileWriter(new File(WORK_RESP_DIR, respName));
                fw.write("Type,CorrelationId,Timestamp,BillingAgreementId,ReturnCode,Message\n");
                List<Map<String, Object>> details = DBUtil.jdbc
                        .queryForList("SELECT * FROM MWP_GPS_REQ_DETAIL WHERE REQ_ID='" + reqId + "'");
                for (Map<String, Object> d : details) {
                    fw.write(d.get("REQ_TYPE") + "," + d.get("CORRELATION_ID") + "," + d.get("RESP_TIMESTAMP") + ","
                            + BILLING_AGREEMENT + "," + d.get("RESULT_CODE") + "," + d.get("MESSAGE") + "\n");
                }
                fw.close();
                // TODO PGP 加密, key 還沒申請下來, 先傳明文 (2013/4)
                DBUtil.jdbc.update("UPDATE MWP_GPS_REQ_LOG SET STATUS='D', RESP_TIME='" + CommonUtil.now14()
                        + "', RESP_FILE_NAME='" + respName + "', LAST_MOD_TIME='" + CommonUtil.now14()
                        + "' WHERE REQ_ID='" + reqId + "'");
                System.out.println("[buildGPSResFiles] " + respName);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    // ==================== 4.4.4 putGPSResponse ====================

    @Scheduled(initialDelay = 300000, fixedDelay = 3600000)
    public void putGPSResponse() {
        File dir = new File(WORK_RESP_DIR);
        File[] files = dir.listFiles();
        if (files == null) return;
        for (File f : files) {
            try {
                copy(f, new File(SFTP_INCOMING_DIR, f.getName()));
                f.delete();
                System.out.println("[putGPSResponse] upload " + f.getName());
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    // ==================== BuildDeductionCSPFile (每兩小時) ====================

    @Scheduled(initialDelay = 360000, fixedDelay = 7200000)
    public void buildDeductionCSPFile() {
        try {
            List<Map<String, Object>> rows = DBUtil.jdbc
                    .queryForList("SELECT * FROM MWP_BATCH_DEDUCTION_DETAIL WHERE STATUS='B'");
            if (rows.size() == 0) return;
            String fn = "deduction_" + CommonUtil.now14() + ".txt";
            FileWriter fw = new FileWriter(new File(CSP_DIR, fn));
            for (Map<String, Object> r : rows) {
                fw.write(r.get("TXID") + "|" + r.get("ACC_ID") + "|" + r.get("AMOUNT") + "|" + r.get("SERVICE_ID") + "\n");
                DBUtil.jdbc.update("UPDATE MWP_BATCH_DEDUCTION_DETAIL SET STATUS='S', MODIFY_DATE='"
                        + CommonUtil.now14() + "' WHERE ID='" + r.get("ID") + "'");
            }
            fw.close();
            System.out.println("[buildDeductionCSPFile] " + fn + " rows=" + rows.size());

            // CSP 端模擬: 除 GSM Status 是暫停狀態外一律扣款成功
            List<Map<String, Object>> sent = DBUtil.jdbc
                    .queryForList("SELECT * FROM MWP_BATCH_DEDUCTION_DETAIL WHERE STATUS='S'");
            for (Map<String, Object> r : sent) {
                String gsm = "";
                List<Map<String, Object>> us = DBUtil.jdbc
                        .queryForList("SELECT GSM_STATUS FROM MWP_USER WHERE ACC_ID='" + r.get("ACC_ID") + "'");
                if (us.size() > 0) gsm = (String) us.get(0).get("GSM_STATUS");
                String st = "suspend".equals(gsm) ? "F" : "D";
                DBUtil.jdbc.update("UPDATE MWP_BATCH_DEDUCTION_DETAIL SET STATUS='" + st + "', MODIFY_DATE='"
                        + CommonUtil.now14() + "' WHERE ID='" + r.get("ID") + "'");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // ==================== 4.4.5 GPSChargeMonitor (每12小時) ====================

    @Scheduled(initialDelay = 420000, fixedDelay = 43200000)
    public void gpsChargeMonitor() {
        try {
            // CSP 回覆扣款失敗 -> Mail 通知 BPM 群組
            List<Map<String, Object>> fails = DBUtil.jdbc
                    .queryForList("SELECT * FROM MWP_BATCH_DEDUCTION_DETAIL WHERE STATUS='F' AND CHANNEL='0300'");
            for (Map<String, Object> f : fails) {
                System.out.println("[ALERT][MAIL to BPM] CSP deduct fail TXID=" + f.get("TXID"));
            }
            // 逾期未扣款 (超過12小時) -> SMS + Mail O&M/BPM
            Calendar c = Calendar.getInstance();
            c.add(Calendar.HOUR_OF_DAY, -12);
            String limit = CommonUtil.SDF14.format(c.getTime());
            List<Map<String, Object>> lates = DBUtil.jdbc
                    .queryForList("SELECT * FROM MWP_BATCH_DEDUCTION_DETAIL WHERE STATUS IN ('B','S') AND CHANNEL='0300' AND CREATE_TIME < '"
                            + limit + "'");
            for (Map<String, Object> l : lates) {
                System.out.println("[ALERT][SMS+MAIL to O&M/BPM] charge overdue TXID=" + l.get("TXID"));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // ==================== 4.4.6/4.4.8 getGPSReconfiles + reconGPSDaily ====================
    // 抓檔跟對帳先合在同一個 method, 反正都要跑 (TODO 之後拆開)

    @Scheduled(initialDelay = 480000, fixedDelay = 86400000)
    public void reconGPSDaily() {
        List<File> files = new ArrayList<File>();
        walk(new File(SFTP_RECON_DIR), files);
        for (File f : files) {
            String fn = f.getName();
            if (!fn.startsWith("recon_" + BILLING_AGREEMENT + "_DCB_")) continue;
            try {
                int cnt = DBUtil.jdbc.queryForObject(
                        "SELECT COUNT(*) FROM MWP_CP_RECON_DAILY_LOG WHERE FILE_NAME='" + fn + "'", Integer.class)
                        .intValue();
                if (cnt > 0) continue;
                // recon_TELCO_TW_DCB_YYYYMMDD[_00000-of-00003].csv
                String rest = fn.substring(("recon_" + BILLING_AGREEMENT + "_DCB_").length());
                String date = rest.substring(0, 8);
                String seq = "00000";
                if (rest.indexOf("-of-") > 0) {
                    seq = rest.substring(9, 14);
                }
                String reconId = "R" + date;
                DBUtil.jdbc.update("INSERT INTO MWP_CP_RECON_DAILY_LOG (RECON_ID, RECON_SEQ_NUM, MERCHANT_ID, FILE_NAME, CP_TX_DT, CREATE_TIME, STATUS) VALUES ('"
                        + reconId + "','" + seq + "','" + MERCHANT + "','" + fn + "','" + date + "','"
                        + CommonUtil.now14() + "','I')");
                // 放入 nas folder
                File nas = new File(NAS_DAILY_DIR + "/" + MERCHANT + "/" + date.substring(0, 4) + "/"
                        + date.substring(4, 6) + "/" + date.substring(6, 8));
                nas.mkdirs();
                copy(f, new File(nas, fn));

                DBUtil.jdbc.update("UPDATE MWP_CP_RECON_DAILY_LOG SET STATUS='P' WHERE FILE_NAME='" + fn + "'");
                int sqe = 0;
                BufferedReader br = new BufferedReader(new FileReader(f));
                String line;
                while ((line = br.readLine()) != null) {
                    if (line.trim().length() == 0 || line.startsWith("#") || line.startsWith("BillingAgreementId,")) continue;
                    // BillingAgreementId,CorrelationId,Status,ItemPriceMicros,TaxMicros,TotalAmountMicros,Currency,LastEvent,TimestampMillis,EventResponse,EventResponseDesc
                    String[] c = line.split(",", -1);
                    sqe++;
                    String corr = c[1];
                    long round = CommonUtil.microsToAmount(c[5]);
                    // 前置作業: 撈 OrderNo 對應之 TXID
                    String txid = "";
                    List<Map<String, Object>> t = DBUtil.jdbc
                            .queryForList("SELECT TXID FROM MWP_PAY_TRANS WHERE MEMO='" + corr + "'");
                    if (t.size() > 0) txid = (String) t.get(0).get("TXID");
                    DBUtil.jdbc.update("INSERT INTO MWP_CP_RECON_DAILY_DETAIL (RECON_ID, RECON_SEQ_NUM, MERCHANT_ID, BILLING_AGREEMENT_ID, CORRELATION_ID, SQE_NUM, TXID, STATUS, ITEM_PRICE, TAX, TOTAL_AMOUNT, ROUND_AMOUNT, CURRENCY, LAST_EVENT, TIMESTAMP, EVENT_RESPONSE, EVENT_RESPONSE_DESCRIPTION, CREATE_TIME) VALUES ('"
                            + reconId + "','" + seq + "','" + MERCHANT + "','" + c[0] + "','" + corr + "'," + sqe
                            + ",'" + txid + "','" + c[2] + "','" + c[3] + "','" + c[4] + "','" + c[5] + "'," + round
                            + ",'" + c[6] + "','" + c[7] + "','" + c[8] + "','" + c[9] + "','" + c[10] + "','"
                            + CommonUtil.now14() + "')");
                }
                br.close();
                DBUtil.jdbc.update("UPDATE MWP_CP_RECON_DAILY_LOG SET STATUS='PD' WHERE FILE_NAME='" + fn + "'");

                // ============ 對帳 (以OLS為基準) ============
                boolean anyDiff = false;
                List<Map<String, Object>> details = DBUtil.jdbc
                        .queryForList("SELECT * FROM MWP_CP_RECON_DAILY_DETAIL WHERE RECON_ID='" + reconId + "'");
                for (Map<String, Object> d : details) {
                    String st = (String) d.get("STATUS");
                    String result = "000";
                    String msg = "Success";
                    String corr = (String) d.get("CORRELATION_ID");
                    String tsTw = CommonUtil.utcMillisToTwTime((String) d.get("TIMESTAMP"));
                    long round = ((Number) d.get("ROUND_AMOUNT")).longValue();
                    if ("Charged".equals(st)) {
                        List<Map<String, Object>> txs = DBUtil.jdbc
                                .queryForList("SELECT * FROM MWP_PAY_TRANS WHERE MEMO='" + corr + "'");
                        if (txs.size() == 0) {
                            result = "101"; msg = "No new-pay mapping data";
                        } else if (!"D".equals(txs.get(0).get("TX_STATUS"))) {
                            result = "103"; msg = "Status not match";
                        } else if (((Number) txs.get(0).get("AMOUNT")).longValue() != round) {
                            result = "104"; msg = "Amount not match";
                        } else if (!tsTw.equals(txs.get(0).get("BILL_CSPTIME"))) {
                            result = "105"; msg = "Timestamp not match";
                        }
                    } else if ("Refunded".equals(st)) {
                        String txid = (String) d.get("TXID");
                        List<Map<String, Object>> rfs = DBUtil.jdbc.queryForList(
                                "SELECT * FROM MWP_PAY_REFUND WHERE TXID='" + txid + "' AND REFUND_STATUS IN ('I','D')");
                        if (txid.length() == 0 || rfs.size() == 0) {
                            result = "201"; msg = "No new-pay mapping data";
                        } else if (((Number) rfs.get(0).get("AMOUNT")).longValue() != round) {
                            result = "204"; msg = "Amount not match";
                        } else if (!tsTw.equals(rfs.get(0).get("REFUND_DATE"))) {
                            result = "205"; msg = "Timestamp not match";
                        }
                    }
                    if (!"000".equals(result)) {
                        anyDiff = true;
                        System.out.println("[ALERT][MAIL] daily recon diff " + result + " " + msg + " corr=" + corr);
                    }
                    DBUtil.jdbc.update("UPDATE MWP_CP_RECON_DAILY_DETAIL SET RECON_RESULT='" + result
                            + "', RECON_MESSAGE='" + msg + "' WHERE RECON_ID='" + reconId + "' AND SQE_NUM="
                            + d.get("SQE_NUM"));
                }

                // ============ 對帳 (以new-pay為基準) UTC-8 window ============
                String[] win = dailyWindow(date);
                List<Map<String, Object>> myCharges = DBUtil.jdbc.queryForList(
                        "SELECT * FROM MWP_PAY_TRANS WHERE TX_STATUS='D' AND CHANNEL='0300' AND BILL_CSPTIME >= '"
                                + win[0] + "' AND BILL_CSPTIME <= '" + win[1] + "'");
                for (Map<String, Object> tx : myCharges) {
                    int hit = DBUtil.jdbc.queryForObject("SELECT COUNT(*) FROM MWP_CP_RECON_DAILY_DETAIL WHERE RECON_ID='"
                            + reconId + "' AND CORRELATION_ID='" + tx.get("MEMO") + "' AND STATUS='Charged'",
                            Integer.class).intValue();
                    if (hit == 0) {
                        anyDiff = true;
                        sqe++;
                        System.out.println("[ALERT][MAIL] daily recon 102 No GPS data txid=" + tx.get("TXID"));
                        DBUtil.jdbc.update("INSERT INTO MWP_CP_RECON_DAILY_DETAIL (RECON_ID, RECON_SEQ_NUM, MERCHANT_ID, BILLING_AGREEMENT_ID, CORRELATION_ID, SQE_NUM, TXID, STATUS, ROUND_AMOUNT, CURRENCY, TIMESTAMP, EVENT_RESPONSE, EVENT_RESPONSE_DESCRIPTION, CREATE_TIME, RECON_RESULT, RECON_MESSAGE) VALUES ('"
                                + reconId + "','" + seq + "','" + MERCHANT + "','" + BILLING_AGREEMENT + "','"
                                + tx.get("MEMO") + "'," + sqe + ",'" + tx.get("TXID") + "','" + tx.get("TX_STATUS")
                                + "'," + ((Number) tx.get("AMOUNT")).longValue() + ",'TWD','" + tx.get("BILL_CSPTIME")
                                + "','" + tx.get("RETURN_CODE") + "','" + tx.get("RETURN_MSG") + "','"
                                + CommonUtil.now14() + "','102','No GPS data')");
                    }
                }
                List<Map<String, Object>> myRefunds = DBUtil.jdbc.queryForList(
                        "SELECT * FROM MWP_PAY_REFUND WHERE REFUND_STATUS IN ('I','D') AND REFUND_DATE >= '" + win[0]
                                + "' AND REFUND_DATE <= '" + win[1] + "'");
                for (Map<String, Object> rf : myRefunds) {
                    int hit = DBUtil.jdbc.queryForObject("SELECT COUNT(*) FROM MWP_CP_RECON_DAILY_DETAIL WHERE RECON_ID='"
                            + reconId + "' AND TXID='" + rf.get("TXID") + "' AND STATUS='Refunded'", Integer.class)
                            .intValue();
                    if (hit == 0) {
                        anyDiff = true;
                        sqe++;
                        System.out.println("[ALERT][MAIL] daily recon 202 No GPS data txid=" + rf.get("TXID"));
                        DBUtil.jdbc.update("INSERT INTO MWP_CP_RECON_DAILY_DETAIL (RECON_ID, RECON_SEQ_NUM, MERCHANT_ID, BILLING_AGREEMENT_ID, SQE_NUM, TXID, STATUS, ROUND_AMOUNT, CURRENCY, TIMESTAMP, CREATE_TIME, RECON_RESULT, RECON_MESSAGE) VALUES ('"
                                + reconId + "','" + seq + "','" + MERCHANT + "','" + BILLING_AGREEMENT + "'," + sqe
                                + ",'" + rf.get("TXID") + "','" + rf.get("REFUND_STATUS") + "',"
                                + ((Number) rf.get("AMOUNT")).longValue() + ",'TWD','" + rf.get("REFUND_DATE") + "','"
                                + CommonUtil.now14() + "','202','No GPS data')");
                    }
                }

                // ============ Summary ============
                int cpCount = DBUtil.jdbc.queryForObject("SELECT COUNT(*) FROM MWP_CP_RECON_DAILY_DETAIL WHERE RECON_ID='"
                        + reconId + "' AND RECON_RESULT <> '102' AND RECON_RESULT <> '202'", Integer.class).intValue();
                int diffCount = DBUtil.jdbc.queryForObject("SELECT COUNT(*) FROM MWP_CP_RECON_DAILY_DETAIL WHERE RECON_ID='"
                        + reconId + "' AND RECON_RESULT <> '000'", Integer.class).intValue();
                int myCount = myCharges.size() + myRefunds.size();
                DBUtil.jdbc.update("DELETE FROM MWP_CP_RECON_DAILY_SUMMARY WHERE RECON_ID='" + reconId + "'");
                DBUtil.jdbc.update("INSERT INTO MWP_CP_RECON_DAILY_SUMMARY (RECON_ID, MERCHANT_ID, RECON_RESULT_SUMMARY, DIFF_COUNT, CP_TX_DT, CP_TOTAL_CONUT, NEWPAY_TOTAL_COUNT, CP_FILE_NAME) VALUES ('"
                        + reconId + "','" + MERCHANT + "','" + (anyDiff ? "N" : "Y") + "'," + diffCount + ",'" + date
                        + "'," + cpCount + "," + myCount + ",'" + fn + "')");
                DBUtil.jdbc.update("UPDATE MWP_CP_RECON_DAILY_LOG SET STATUS='" + (anyDiff ? "F" : "D")
                        + "' WHERE FILE_NAME='" + fn + "'");
                if (anyDiff) {
                    System.out.println("[ALERT][MAIL to Telco] daily recon " + date + " has diff, count=" + diffCount);
                }
                System.out.println("[reconGPSDaily] " + fn + " done, diff=" + diffCount);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    // recon file 日期為 d, 代表 UTC-8 時區內 d 00:00:00~23:59:59, 換算台灣時區為 d 16:00:00 ~ d+1 15:59:59
    private String[] dailyWindow(String date) throws Exception {
        SimpleDateFormat d8 = new SimpleDateFormat("yyyyMMdd");
        Calendar c = Calendar.getInstance();
        c.setTime(d8.parse(date));
        String start = date + "160000";
        c.add(Calendar.DAY_OF_MONTH, 1);
        String end = d8.format(c.getTime()) + "155959";
        return new String[] { start, end };
    }

    // ==================== 4.4.7/4.4.9 getGPSMonthlyInvoice + reconGPSMonthly ====================
    // 跟 daily 邏輯差不多, 從 daily copy 過來改的 (2013/4 [人員B])

    @Scheduled(initialDelay = 540000, fixedDelay = 86400000)
    public void reconGPSMonthly() {
        List<File> files = new ArrayList<File>();
        walk(new File(SFTP_MONTHLY_DIR), files);
        for (File f : files) {
            String fn = f.getName();
            if (!fn.startsWith("invoice_details_" + BILLING_AGREEMENT + "_DCB_")) continue;
            try {
                int cnt = DBUtil.jdbc.queryForObject(
                        "SELECT COUNT(*) FROM MWP_CP_RECON_MONTHLY_LOG WHERE FILE_NAME='" + fn + "'", Integer.class)
                        .intValue();
                if (cnt > 0) continue;
                String rest = fn.substring(("invoice_details_" + BILLING_AGREEMENT + "_DCB_").length());
                String month = rest.substring(0, 6);
                String seq = "00000";
                String reconId = "M" + month;
                DBUtil.jdbc.update("INSERT INTO MWP_CP_RECON_MONTHLY_LOG (RECON_ID, RECON_SEQ_NUM, MERCHANT_ID, FILE_NAME, CP_TX_DT, CREATE_TIME, STATUS) VALUES ('"
                        + reconId + "','" + seq + "','" + MERCHANT + "','" + fn + "','" + month + "01','"
                        + CommonUtil.now14() + "','I')");
                File nas = new File(NAS_MONTHLY_DIR + "/" + MERCHANT + "/" + month.substring(0, 4) + "/"
                        + month.substring(4, 6));
                nas.mkdirs();
                copy(f, new File(nas, fn));
                DBUtil.jdbc.update("UPDATE MWP_CP_RECON_MONTHLY_LOG SET STATUS='P' WHERE FILE_NAME='" + fn + "'");

                int sqe = 0;
                BufferedReader br = new BufferedReader(new FileReader(f));
                String line;
                while ((line = br.readLine()) != null) {
                    if (line.trim().length() == 0 || line.startsWith("#") || line.startsWith("BillingAgreementId,")) continue;
                    // BillingAgreementId,CorrelationId,Event,ItemPriceMicros,TaxMicros,TotalAmountMicros,Currency,TimestampMillis
                    String[] c = line.split(",", -1);
                    sqe++;
                    String corr = c[1];
                    long round = CommonUtil.microsToAmount(c[5]);
                    String txid = "";
                    List<Map<String, Object>> t = DBUtil.jdbc
                            .queryForList("SELECT TXID FROM MWP_PAY_TRANS WHERE MEMO='" + corr + "'");
                    if (t.size() > 0) txid = (String) t.get(0).get("TXID");
                    DBUtil.jdbc.update("INSERT INTO MWP_CP_RECON_MONTHLY_DETAIL (RECON_ID, RECON_SEQ_NUM, MERCHANT_ID, BILLING_AGREEMENT_ID, CORRELATION_ID, SQE_NUM, TXID, EVENT, ITEM_PRICE, TAX, TOTAL_AMOUNT, ROUND_AMOUNT, CURRENCY, TIMESTAMP, CREATE_TIME) VALUES ('"
                            + reconId + "','" + seq + "','" + MERCHANT + "','" + c[0] + "','" + corr + "'," + sqe
                            + ",'" + txid + "','" + c[2] + "','" + c[3] + "','" + c[4] + "','" + c[5] + "'," + round
                            + ",'" + c[6] + "','" + c[7] + "','" + CommonUtil.now14() + "')");
                }
                br.close();
                DBUtil.jdbc.update("UPDATE MWP_CP_RECON_MONTHLY_LOG SET STATUS='PD' WHERE FILE_NAME='" + fn + "'");

                boolean anyDiff = false;
                List<Map<String, Object>> details = DBUtil.jdbc
                        .queryForList("SELECT * FROM MWP_CP_RECON_MONTHLY_DETAIL WHERE RECON_ID='" + reconId + "'");
                for (Map<String, Object> d : details) {
                    String ev = (String) d.get("EVENT");
                    String result = "000";
                    String msg = "Success";
                    String corr = (String) d.get("CORRELATION_ID");
                    String tsTw = CommonUtil.utcMillisToTwTime((String) d.get("TIMESTAMP"));
                    long round = ((Number) d.get("ROUND_AMOUNT")).longValue();
                    if ("Charge".equals(ev)) {
                        List<Map<String, Object>> txs = DBUtil.jdbc
                                .queryForList("SELECT * FROM MWP_PAY_TRANS WHERE MEMO='" + corr + "'");
                        if (txs.size() == 0) {
                            result = "101"; msg = "No new-pay mapping data";
                        } else if (!"D".equals(txs.get(0).get("TX_STATUS"))) {
                            result = "103"; msg = "Status not match";
                        } else if (((Number) txs.get(0).get("AMOUNT")).longValue() != round) {
                            result = "104"; msg = "Amount not match";
                        } else if (!tsTw.equals(txs.get(0).get("BILL_CSPTIME"))) {
                            result = "105"; msg = "Timestamp not match";
                        }
                    } else if ("Refund".equals(ev)) {
                        String txid = (String) d.get("TXID");
                        List<Map<String, Object>> rfs = DBUtil.jdbc.queryForList(
                                "SELECT * FROM MWP_PAY_REFUND WHERE TXID='" + txid + "' AND REFUND_STATUS IN ('I','D')");
                        if (txid.length() == 0 || rfs.size() == 0) {
                            result = "201"; msg = "No new-pay mapping data";
                        } else if (((Number) rfs.get(0).get("AMOUNT")).longValue() != round) {
                            result = "204"; msg = "Amount not match";
                        } else if (!tsTw.equals(rfs.get(0).get("REFUND_DATE"))) {
                            result = "205"; msg = "Timestamp not match";
                        }
                    }
                    if (!"000".equals(result)) {
                        anyDiff = true;
                        System.out.println("[ALERT][MAIL] monthly recon diff " + result + " " + msg + " corr=" + corr);
                    }
                    DBUtil.jdbc.update("UPDATE MWP_CP_RECON_MONTHLY_DETAIL SET RECON_RESULT='" + result
                            + "', RECON_MESSAGE='" + msg + "' WHERE RECON_ID='" + reconId + "' AND SQE_NUM="
                            + d.get("SQE_NUM"));
                }

                String[] win = monthlyWindow(month);
                List<Map<String, Object>> myCharges = DBUtil.jdbc.queryForList(
                        "SELECT * FROM MWP_PAY_TRANS WHERE TX_STATUS='D' AND CHANNEL='0300' AND BILL_CSPTIME >= '"
                                + win[0] + "' AND BILL_CSPTIME <= '" + win[1] + "'");
                for (Map<String, Object> tx : myCharges) {
                    int hit = DBUtil.jdbc.queryForObject("SELECT COUNT(*) FROM MWP_CP_RECON_MONTHLY_DETAIL WHERE RECON_ID='"
                            + reconId + "' AND CORRELATION_ID='" + tx.get("MEMO") + "' AND EVENT='Charge'",
                            Integer.class).intValue();
                    if (hit == 0) {
                        anyDiff = true;
                        sqe++;
                        System.out.println("[ALERT][MAIL] monthly recon 102 No GPS data txid=" + tx.get("TXID"));
                        DBUtil.jdbc.update("INSERT INTO MWP_CP_RECON_MONTHLY_DETAIL (RECON_ID, RECON_SEQ_NUM, MERCHANT_ID, BILLING_AGREEMENT_ID, CORRELATION_ID, SQE_NUM, TXID, EVENT, ROUND_AMOUNT, CURRENCY, TIMESTAMP, CREATE_TIME, RECON_RESULT, RECON_MESSAGE) VALUES ('"
                                + reconId + "','" + seq + "','" + MERCHANT + "','" + BILLING_AGREEMENT + "','"
                                + tx.get("MEMO") + "'," + sqe + ",'" + tx.get("TXID") + "','" + tx.get("TX_STATUS")
                                + "'," + ((Number) tx.get("AMOUNT")).longValue() + ",'TWD','" + tx.get("BILL_CSPTIME")
                                + "','" + CommonUtil.now14() + "','102','No GPS data')");
                    }
                }
                List<Map<String, Object>> myRefunds = DBUtil.jdbc.queryForList(
                        "SELECT * FROM MWP_PAY_REFUND WHERE REFUND_STATUS IN ('I','D') AND REFUND_DATE >= '" + win[0]
                                + "' AND REFUND_DATE <= '" + win[1] + "'");
                for (Map<String, Object> rf : myRefunds) {
                    int hit = DBUtil.jdbc.queryForObject("SELECT COUNT(*) FROM MWP_CP_RECON_MONTHLY_DETAIL WHERE RECON_ID='"
                            + reconId + "' AND TXID='" + rf.get("TXID") + "' AND EVENT='Refund'", Integer.class)
                            .intValue();
                    if (hit == 0) {
                        anyDiff = true;
                        sqe++;
                        DBUtil.jdbc.update("INSERT INTO MWP_CP_RECON_MONTHLY_DETAIL (RECON_ID, RECON_SEQ_NUM, MERCHANT_ID, BILLING_AGREEMENT_ID, SQE_NUM, TXID, EVENT, ROUND_AMOUNT, CURRENCY, TIMESTAMP, CREATE_TIME, RECON_RESULT, RECON_MESSAGE) VALUES ('"
                                + reconId + "','" + seq + "','" + MERCHANT + "','" + BILLING_AGREEMENT + "'," + sqe
                                + ",'" + rf.get("TXID") + "','" + rf.get("REFUND_STATUS") + "',"
                                + ((Number) rf.get("AMOUNT")).longValue() + ",'TWD','" + rf.get("REFUND_DATE") + "','"
                                + CommonUtil.now14() + "','202','No GPS data')");
                    }
                }

                int cpCount = DBUtil.jdbc.queryForObject("SELECT COUNT(*) FROM MWP_CP_RECON_MONTHLY_DETAIL WHERE RECON_ID='"
                        + reconId + "' AND RECON_RESULT <> '102' AND RECON_RESULT <> '202'", Integer.class).intValue();
                int myCount = myCharges.size() + myRefunds.size();
                DBUtil.jdbc.update("DELETE FROM MWP_CP_RECON_MONTHLY_SUMMARY WHERE RECON_ID='" + reconId + "'");
                DBUtil.jdbc.update("INSERT INTO MWP_CP_RECON_MONTHLY_SUMMARY (RECON_ID, MERCHANT_ID, CP_TX_DT, CP_TOTAL_CONUT, NEWPAY_TOTAL_COUNT, CP_DETAIL_FILE_NAME) VALUES ('"
                        + reconId + "','" + MERCHANT + "','" + month + "01'," + cpCount + "," + myCount + ",'" + fn + "')");
                DBUtil.jdbc.update("UPDATE MWP_CP_RECON_MONTHLY_LOG SET STATUS='" + (anyDiff ? "F" : "D")
                        + "' WHERE FILE_NAME='" + fn + "'");
                System.out.println("[reconGPSMonthly] " + fn + " done, diff=" + anyDiff);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    // monthly file 月份 m, 代表 UTC-8 內 m/01 00:00:00 ~ 月底 23:59:59, 換算台灣時區為 m/01 16:00:00 ~ 次月/01 15:59:59
    private String[] monthlyWindow(String month) throws Exception {
        SimpleDateFormat d6 = new SimpleDateFormat("yyyyMM");
        Calendar c = Calendar.getInstance();
        c.setTime(d6.parse(month));
        String start = month + "01160000";
        c.add(Calendar.MONTH, 1);
        String end = d6.format(c.getTime()) + "01155959";
        return new String[] { start, end };
    }

    // ==================== 4.4.10 reconGPSSummary (月拆帳總表, 抓回來放 nas 供下載) ====================

    @Scheduled(initialDelay = 600000, fixedDelay = 86400000)
    public void reconGPSSummary() {
        List<File> files = new ArrayList<File>();
        walk(new File(SFTP_MONTHLY_DIR), files);
        for (File f : files) {
            if (!f.getName().startsWith("invoice_summary_")) continue;
            try {
                File dest = new File(NAS_MONTHLY_DIR + "/" + MERCHANT, f.getName());
                dest.getParentFile().mkdirs();
                if (!dest.exists()) {
                    copy(f, dest);
                    System.out.println("[reconGPSSummary] fetched " + f.getName());
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    // ==================== helpers ====================

    static void walk(File dir, List<File> out) {
        File[] fs = dir.listFiles();
        if (fs == null) return;
        for (File f : fs) {
            if (f.isDirectory()) walk(f, out);
            else out.add(f);
        }
    }

    static void copy(File src, File dest) throws Exception {
        FileInputStream in = new FileInputStream(src);
        FileOutputStream fout = new FileOutputStream(dest);
        byte[] buf = new byte[4096];
        int n;
        while ((n = in.read(buf)) > 0) {
            fout.write(buf, 0, n);
        }
        in.close();
        fout.close();
    }
}
