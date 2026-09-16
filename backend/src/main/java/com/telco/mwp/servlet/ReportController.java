package com.telco.mwp.servlet;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.telco.mwp.util.DBUtil;

/**
 * 報表 (FSD 4.6) - SA/CP/CSR portal 先共用這一支, 誰要用誰自己打
 */
@RestController
public class ReportController {

    /**
     * 4.6.1 交易報表查詢: 時間可到小時(yyyyMMddHH), timeType=auth 用授權時間(只限OLS)
     */
    @GetMapping(value = "/sa/report/trans", produces = "text/html;charset=UTF-8")
    public String transReport(@RequestParam String from, @RequestParam String to,
            @RequestParam(required = false) String merchantId,
            @RequestParam(required = false) String timeType) {
        String col = "TX_DT";
        if ("auth".equals(timeType)) col = "AUTH_DT";
        String sql = "SELECT TXID, MERCHANT_ID, ACC_ID, AMOUNT, CURRENCY, TX_STATUS, TX_DT, AUTH_DT, BILL_CSPTIME, MEMO, MERCHANDIZE_NAME, REFERENCE FROM MWP_PAY_TRANS WHERE "
                + col + " >= '" + from + "0000' AND " + col + " <= '" + to + "5959'";
        if (merchantId != null && merchantId.length() > 0) {
            sql += " AND MERCHANT_ID='" + merchantId + "'";
        }
        sql += " ORDER BY TX_DT";
        return html(sql);
    }

    /** 4.6.2 退款交易報表查詢 */
    @GetMapping(value = "/sa/report/refund", produces = "text/html;charset=UTF-8")
    public String refundReport(@RequestParam String from, @RequestParam String to) {
        String sql = "SELECT R.TXID, R.AMOUNT, R.REFUND_STATUS, R.REFUND_DATE, T.MEMO, T.AUTH_DT FROM MWP_PAY_REFUND R, MWP_PAY_TRANS T WHERE R.TXID=T.TXID AND R.REFUND_DATE >= '"
                + from + "0000' AND R.REFUND_DATE <= '" + to + "5959' ORDER BY R.REFUND_DATE";
        return html(sql);
    }

    /** 4.6.3 OLS每日對帳結果查詢 */
    @GetMapping(value = "/sa/report/reconDaily", produces = "text/html;charset=UTF-8")
    public String reconDaily(@RequestParam String from, @RequestParam String to) {
        return html("SELECT * FROM MWP_CP_RECON_DAILY_SUMMARY WHERE CP_TX_DT >= '" + from + "' AND CP_TX_DT <= '" + to
                + "' ORDER BY CP_TX_DT");
    }

    /** 對帳差異明細 */
    @GetMapping(value = "/sa/report/reconDailyDetail", produces = "text/html;charset=UTF-8")
    public String reconDailyDetail(@RequestParam String reconId) {
        return html("SELECT * FROM MWP_CP_RECON_DAILY_DETAIL WHERE RECON_ID='" + reconId
                + "' AND RECON_RESULT <> '000' ORDER BY SQE_NUM");
    }

    /** 4.6.4 OLS每月對帳結果查詢 */
    @GetMapping(value = "/sa/report/reconMonthly", produces = "text/html;charset=UTF-8")
    public String reconMonthly(@RequestParam String from, @RequestParam String to) {
        return html("SELECT * FROM MWP_CP_RECON_MONTHLY_SUMMARY WHERE CP_TX_DT >= '" + from + "' AND CP_TX_DT <= '"
                + to + "' ORDER BY CP_TX_DT");
    }

    /** 4.6.5 CSR 查詢交易紀錄(含退款), CSR 要看得到 PaymentDescription & MerchantContact */
    @GetMapping(value = "/csr/trans", produces = "text/html;charset=UTF-8")
    public String csrTrans(@RequestParam String msisdn) {
        String sql = "SELECT T.TXID, T.AMOUNT, T.TX_STATUS, T.TX_DT, T.AUTH_DT, T.MERCHANDIZE_NAME, T.REFERENCE, T.RETURN_CODE FROM MWP_PAY_TRANS T WHERE T.ACC_ID='"
                + msisdn + "' ORDER BY T.TX_DT DESC";
        return html(sql) + "<hr/>Refunds:" + html("SELECT * FROM MWP_PAY_REFUND WHERE TXID IN (SELECT TXID FROM MWP_PAY_TRANS WHERE ACC_ID='" + msisdn + "')");
    }

    /** 4.6.6 商家銀行帳戶註冊 (先放這裡, 之後再搬去對的地方) 幣別支援 NTD/USD, 支援外國銀行 */
    @org.springframework.web.bind.annotation.PostMapping("/cp/bankacc/save")
    public String bankAccSave(@RequestParam String merchantId, @RequestParam String bankCode,
            @RequestParam String bankAcc, @RequestParam String currency,
            @RequestParam(required = false) String isDomestic) {
        try {
            if (isDomestic == null) isDomestic = "Y";
            DBUtil.jdbc.update("INSERT INTO MWP_MERCHANT_BANK_ACC (MERCHANT_ID, BANK_CODE, BANK_ACC, CURRENCY, IS_DOMESTIC, STATUS) VALUES ('"
                    + merchantId + "','" + bankCode + "','" + bankAcc + "','" + currency + "','" + isDomestic + "','W')");
            // STATUS W = 待Finance審核 (4.6.7), 審核功能還沒做, 先都掛W
            return "OK";
        } catch (Exception e) {
            e.printStackTrace();
            return "FAIL " + e.getMessage();
        }
    }

    @GetMapping("/cp/bankacc/list")
    public Object bankAccList(@RequestParam String merchantId) {
        return DBUtil.jdbc.queryForList("SELECT * FROM MWP_MERCHANT_BANK_ACC WHERE MERCHANT_ID='" + merchantId + "'");
    }

    // 直接把 query 結果拼成 table, portal 那邊 iframe 進去就好
    private String html(String sql) {
        StringBuilder sb = new StringBuilder();
        try {
            List<Map<String, Object>> rows = DBUtil.jdbc.queryForList(sql);
            sb.append("<table border=1 cellspacing=0><tr>");
            if (rows.size() > 0) {
                for (String k : rows.get(0).keySet()) sb.append("<th>").append(k).append("</th>");
            }
            sb.append("</tr>");
            int i = 0;
            for (Map<String, Object> r : rows) {
                sb.append("<tr>");
                for (Object v : r.values()) sb.append("<td>").append(v).append("</td>");
                sb.append("</tr>");
                i++;
                if (i >= 10) break; // 畫面僅顯示10筆資料, 其餘透過背景處理匯出CSV (匯出還沒做)
            }
            sb.append("</table><p>total rows: ").append(rows.size()).append("</p>");
        } catch (Exception e) {
            e.printStackTrace();
            sb.append("query error: ").append(e.getMessage()).append("<br/>SQL=").append(sql);
        }
        return sb.toString();
    }
}
