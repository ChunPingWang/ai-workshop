package com.telco.mwp.fake;

import java.io.File;
import java.io.FileWriter;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.telco.mwp.util.CommonUtil;
import com.telco.mwp.util.DBUtil;

/**
 * OLS DCB 模擬器 (測試/demo 用, 模擬 OLS 那端的行為)
 * - /fakeols/associate : Carrier Billing API
 * - /fakeols/genRequestFile : 產生 batch request file (Charge/Cancel/Refund)
 * - /fakeols/genReconFile : 依 new-pay DB 現況產生日對帳檔
 * - /fakeols/genMonthlyFile : 依 new-pay DB 現況產生月對帳明細檔
 */
@RestController
public class FakeOlsController {

    static int fileSeq = 1000;

    /** Carrier Billing API: sut 帶 BAD 開頭就模擬失敗 */
    @RequestMapping("/fakeols/associate")
    public ResponseEntity<String> associate(@RequestParam String out, @RequestParam String sut) {
        System.out.println("[FakeOls] associate out=" + out + " sut=" + sut);
        if (sut.startsWith("BAD404")) return ResponseEntity.status(404).body("not found");
        if (sut.startsWith("BAD403")) return ResponseEntity.status(403).body("forbidden");
        if (sut.startsWith("BAD503")) return ResponseEntity.status(503).body("service unavailable");
        return ResponseEntity.ok("{\"result\":\"ok\"}");
    }

    /**
     * 產生 batch request file, type=Charge/Cancel/Refund
     * priceMicros 不給的話從 MWP_OLS_SOAP_AUTH 撈該筆 Auth 的原始金額
     */
    @GetMapping("/fakeols/genRequestFile")
    public String genRequestFile(@RequestParam String type, @RequestParam String correlationId,
            @RequestParam(required = false) String priceMicros) {
        try {
            if (priceMicros == null) {
                List<Map<String, Object>> a = DBUtil.jdbc.queryForList(
                        "SELECT PRICE FROM MWP_OLS_SOAP_AUTH WHERE CORRELATION_ID='" + correlationId + "'");
                priceMicros = a.size() > 0 ? (String) a.get(0).get("PRICE") : "99000000";
            }
            fileSeq++;
            String ts = new SimpleDateFormat("yyyyMMddHHmmss").format(new Date());
            String fn = "request_TELCO_TW_DCB_" + ts + "0800_" + fileSeq + ".csv";
            FileWriter fw = new FileWriter(new File("data/ols-sftp/request", fn));
            fw.write("Type,CorrelationId,TimestampMillis,BillingAgreementId,PriceMicros,Currency\n");
            fw.write(type + "," + correlationId + "," + System.currentTimeMillis() + ",TELCO_TW," + priceMicros + ",TWD\n");
            fw.close();
            return "generated " + fn;
        } catch (Exception e) {
            e.printStackTrace();
            return "FAIL " + e.getMessage();
        }
    }

    /**
     * 產生日對帳檔: 依 new-pay DB 的 OLS 交易 (該日 UTC-8 window) 產生
     * mismatch=true 會把第一筆金額多加 1 元, 用來 demo 對帳異常告警
     * date 不給就用現在時間推算 (now - 16 小時的日期)
     */
    @GetMapping("/fakeols/genReconFile")
    public String genReconFile(@RequestParam(required = false) String date,
            @RequestParam(required = false) String mismatch) {
        try {
            SimpleDateFormat d8 = new SimpleDateFormat("yyyyMMdd");
            if (date == null) {
                Calendar c = Calendar.getInstance();
                c.add(Calendar.HOUR_OF_DAY, -16);
                date = d8.format(c.getTime());
            }
            String start = date + "160000";
            Calendar c2 = Calendar.getInstance();
            c2.setTime(d8.parse(date));
            c2.add(Calendar.DAY_OF_MONTH, 1);
            String end = d8.format(c2.getTime()) + "155959";

            String fn = "recon_TELCO_TW_DCB_" + date + ".csv";
            FileWriter fw = new FileWriter(new File("data/ols-sftp/recon", fn));
            fw.write("BillingAgreementId,CorrelationId,Status,ItemPriceMicros,TaxMicros,TotalAmountMicros,Currency,LastEvent,TimestampMillis,EventResponse,EventResponseDesc\n");
            int rows = 0;
            boolean first = true;
            List<Map<String, Object>> charges = DBUtil.jdbc.queryForList(
                    "SELECT * FROM MWP_PAY_TRANS WHERE TX_STATUS='D' AND CHANNEL='0300' AND BILL_CSPTIME >= '" + start
                            + "' AND BILL_CSPTIME <= '" + end + "'");
            for (Map<String, Object> tx : charges) {
                long amount = ((Number) tx.get("AMOUNT")).longValue();
                if (first && "true".equals(mismatch)) {
                    amount = amount + 1; // 故意讓金額對不起來
                    first = false;
                }
                long micros = amount * 1000000L;
                long millis = CommonUtil.twTimeToUtcMillis((String) tx.get("BILL_CSPTIME"));
                fw.write("TELCO_TW," + tx.get("MEMO") + ",Charged," + micros + ",0," + micros + ",TWD,CHARGE," + millis
                        + ",OK,charged\n");
                rows++;
            }
            List<Map<String, Object>> refunds = DBUtil.jdbc.queryForList(
                    "SELECT R.*, T.MEMO FROM MWP_PAY_REFUND R, MWP_PAY_TRANS T WHERE R.TXID=T.TXID AND R.REFUND_STATUS IN ('I','D') AND R.REFUND_DATE >= '"
                            + start + "' AND R.REFUND_DATE <= '" + end + "'");
            for (Map<String, Object> rf : refunds) {
                long micros = ((Number) rf.get("AMOUNT")).longValue() * 1000000L;
                long millis = CommonUtil.twTimeToUtcMillis((String) rf.get("REFUND_DATE"));
                fw.write("TELCO_TW," + rf.get("MEMO") + ",Refunded," + micros + ",0," + micros + ",TWD,REFUND," + millis
                        + ",OK,refunded\n");
                rows++;
            }
            fw.close();
            return "generated " + fn + " rows=" + rows + " (window " + start + "~" + end + ")";
        } catch (Exception e) {
            e.printStackTrace();
            return "FAIL " + e.getMessage();
        }
    }

    /** 產生月對帳明細檔 (Event=Charge/Refund), month 不給就推算 */
    @GetMapping("/fakeols/genMonthlyFile")
    public String genMonthlyFile(@RequestParam(required = false) String month,
            @RequestParam(required = false) String mismatch) {
        try {
            SimpleDateFormat d6 = new SimpleDateFormat("yyyyMM");
            if (month == null) {
                Calendar c = Calendar.getInstance();
                c.add(Calendar.HOUR_OF_DAY, -16);
                month = d6.format(c.getTime());
            }
            String start = month + "01160000";
            Calendar c2 = Calendar.getInstance();
            c2.setTime(d6.parse(month));
            c2.add(Calendar.MONTH, 1);
            String end = d6.format(c2.getTime()) + "01155959";

            String fn = "invoice_details_TELCO_TW_DCB_" + month + ".csv";
            FileWriter fw = new FileWriter(new File("data/ols-sftp/monthly", fn));
            fw.write("BillingAgreementId,CorrelationId,Event,ItemPriceMicros,TaxMicros,TotalAmountMicros,Currency,TimestampMillis\n");
            int rows = 0;
            boolean first = true;
            List<Map<String, Object>> charges = DBUtil.jdbc.queryForList(
                    "SELECT * FROM MWP_PAY_TRANS WHERE TX_STATUS='D' AND CHANNEL='0300' AND BILL_CSPTIME >= '" + start
                            + "' AND BILL_CSPTIME <= '" + end + "'");
            for (Map<String, Object> tx : charges) {
                long amount = ((Number) tx.get("AMOUNT")).longValue();
                if (first && "true".equals(mismatch)) {
                    amount = amount + 1;
                    first = false;
                }
                long micros = amount * 1000000L;
                long millis = CommonUtil.twTimeToUtcMillis((String) tx.get("BILL_CSPTIME"));
                fw.write("TELCO_TW," + tx.get("MEMO") + ",Charge," + micros + ",0," + micros + ",TWD," + millis + "\n");
                rows++;
            }
            List<Map<String, Object>> refunds = DBUtil.jdbc.queryForList(
                    "SELECT R.*, T.MEMO FROM MWP_PAY_REFUND R, MWP_PAY_TRANS T WHERE R.TXID=T.TXID AND R.REFUND_STATUS IN ('I','D') AND R.REFUND_DATE >= '"
                            + start + "' AND R.REFUND_DATE <= '" + end + "'");
            for (Map<String, Object> rf : refunds) {
                long micros = ((Number) rf.get("AMOUNT")).longValue() * 1000000L;
                long millis = CommonUtil.twTimeToUtcMillis((String) rf.get("REFUND_DATE"));
                fw.write("TELCO_TW," + rf.get("MEMO") + ",Refund," + micros + ",0," + micros + ",TWD," + millis + "\n");
                rows++;
            }
            fw.close();
            return "generated " + fn + " rows=" + rows + " (window " + start + "~" + end + ")";
        } catch (Exception e) {
            e.printStackTrace();
            return "FAIL " + e.getMessage();
        }
    }
}
