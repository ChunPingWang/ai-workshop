package com.telco.mwp.servlet;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.telco.mwp.util.CommonUtil;
import com.telco.mwp.util.DBUtil;

/**
 * OnlineStore(OLS) SOAP 介接 (getProvisioning / Auth / echo)
 * 依 FSD 4.2.2 / 4.2.3
 *
 * TODO: SD 4.1 說要走 shell/core 分層 + OLSProcessor/State Pattern,
 *       時程來不及, 先全部寫在這裡, 之後再重構 (2013/4 [人員B])
 */
@RestController
public class OlsSoapController {

    // billing agreement 是 OLS 提供專屬電信業者的字串
    public static final String BILLING_AGREEMENT = "TELCO_TW";
    public static final String OLS_MERCHANT = "E000001";
    public static final String OLS_CHANNEL = "0300";
    public static final String OLS_SERVICE_ID = "SVC_OLS_001";

    @GetMapping("/soap/echo")
    public String echo() {
        return "OK " + CommonUtil.now14();
    }

    // ==================== getProvisioning ====================

    @PostMapping(value = "/soap/getProvisioning", produces = "text/xml;charset=UTF-8")
    public String getProvisioning(@RequestBody String xml) {
        long t0 = System.currentTimeMillis();
        String out = CommonUtil.cut(xml, "OperatorUserToken");
        String ba = CommonUtil.cut(xml, "BillingAgreementId");
        String corr = CommonUtil.cut(xml, "CorrelationId");
        String locale = CommonUtil.cut(xml, "UserLocale");
        String id = "P" + System.currentTimeMillis();
        String result = "GENERAL_FAILURE";
        String isProv = "false";
        String resp = "";
        try {
            // 全部 request 存入 MWP_OLS_SOAP_PROVISIONING (XML 欄位只有 256, 先截斷)
            DBUtil.jdbc.update("INSERT INTO MWP_OLS_SOAP_PROVISIONING (ID, CREATE_TIME, REQUEST_XML, CORRELATION_ID, OUT) VALUES ('"
                    + id + "','" + CommonUtil.now14() + "','" + CommonUtil.trunc(xml.replace("'", ""), 250) + "','"
                    + corr + "','" + out + "')");

            if (!BILLING_AGREEMENT.equals(ba)) {
                result = "INVALID_BILLING_AGREEMENT";
                resp = provResp(result, "false", "", locale);
            } else {
                List<Map<String, Object>> users = DBUtil.jdbc
                        .queryForList("SELECT * FROM MWP_USER WHERE CSPUID='" + out + "'");
                if (users.size() == 0) {
                    result = "INVALID_USER";
                    resp = provResp(result, "false", "", locale);
                } else {
                    Map<String, Object> u = users.get(0);
                    String paidType = (String) u.get("CSP_PAID_TYPE");
                    if (paidType == null) paidType = (String) u.get("PAID_TYPE"); // 舊資料沒有 CSP_PAID_TYPE
                    String gsm = (String) u.get("GSM_STATUS");
                    result = "SUCCESS";
                    if (!"8".equals(paidType)) {
                        // 非 postpaid (含 Hybrid) 一律 SUCCESS + isProvisioned=false
                        isProv = "false";
                    } else if (!"active".equals(gsm) && !"bar".equals(gsm) && !"hotline".equals(gsm)) {
                        isProv = "false";
                    } else {
                        isProv = "true";
                        // 4.3.2 Step6: 尚未Provision的要寫 pool 等批次處理 -> 現在沒有批次在跑, 先寫進去再說
                        DBUtil.jdbc.update("INSERT INTO MWP_BATCH_PROVISION_POOL (OUT, CREATE_TIME, STATUS) VALUES ('"
                                + out + "','" + CommonUtil.now14() + "','I')");
                    }
                    long provTxId = DBUtil.jdbc.queryForObject("SELECT OLSPROVTXSEQ.NEXTVAL FROM DUAL", Long.class)
                            .longValue();
                    resp = provResp(result, isProv, String.valueOf(provTxId), locale);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            result = "GENERAL_FAILURE";
            resp = provResp(result, "false", "", locale);
        }
        try {
            DBUtil.jdbc.update("UPDATE MWP_OLS_SOAP_PROVISIONING SET PROV_RESULT='" + result + "', IS_PROVISIONED='"
                    + isProv + "', RESP_XML='" + CommonUtil.trunc(resp.replace("'", ""), 250) + "' WHERE ID='" + id + "'");
        } catch (Exception e2) {
            // 寫 log 失敗不影響交易
            System.out.println("update provisioning log fail: " + e2.getMessage());
        }
        System.out.println("[PROV] out=" + out + " result=" + result + " isProv=" + isProv + " cost="
                + (System.currentTimeMillis() - t0) + "ms");
        return resp;
    }

    private String provResp(String result, String isProv, String provTxId, String locale) {
        // 通過 provisioning 要一併回傳 ToS (DcbTos 及 PiiTos 回覆相同內容)
        String tosVersion = "";
        String tosUrl = "";
        try {
            List<Map<String, Object>> tos = DBUtil.jdbc.queryForList(
                    "SELECT * FROM MWP_OLS_TOS WHERE MERCHANT_ID='" + OLS_MERCHANT + "' ORDER BY TOS_VERSION DESC");
            if (tos.size() > 0) {
                tosVersion = String.valueOf(((Number) tos.get(0).get("TOS_VERSION")).intValue());
                tosUrl = (String) tos.get(0).get("TOS_URL");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        String msg = "ZH-TW".equalsIgnoreCase(locale) ? msgZh(result) : msgEn(result);
        StringBuffer sb = new StringBuffer();
        sb.append("<GetProvisioningResponse>");
        sb.append("<Result>").append(result).append("</Result>");
        sb.append("<Message>").append(msg).append("</Message>");
        sb.append("<IsProvisioned>").append(isProv).append("</IsProvisioned>");
        sb.append("<SubscriberCurrency>TWD</SubscriberCurrency>");
        sb.append("<MaxAmount>9999</MaxAmount>"); // 確認回覆的金額上限為9999, 比照CSP
        sb.append("<GetProvisionTransactionID>").append(provTxId).append("</GetProvisionTransactionID>");
        sb.append("<DcbTos><TosUrl>").append(tosUrl).append("</TosUrl><TosVersion>").append(tosVersion)
                .append("</TosVersion></DcbTos>");
        sb.append("<PiiTos><TosUrl>").append(tosUrl).append("</TosUrl><TosVersion>").append(tosVersion)
                .append("</TosVersion></PiiTos>");
        sb.append("</GetProvisioningResponse>");
        return sb.toString();
    }

    // ==================== Auth ====================

    @PostMapping(value = "/soap/auth", produces = "text/xml;charset=UTF-8")
    public String auth(@RequestBody String xml) {
        String corr = CommonUtil.cut(xml, "CorrelationId");
        String out = CommonUtil.cut(xml, "OperatorUserToken");
        String ba = CommonUtil.cut(xml, "BillingAgreementId");
        String currency = CommonUtil.cut(xml, "Currency");
        String priceMicros = CommonUtil.cut(xml, "PriceMicros");
        String tosVer = CommonUtil.cut(xml, "TosVersion");
        String purchaseTime = CommonUtil.cut(xml, "PurchaseTime");
        String payDesc = CommonUtil.cut(xml, "PaymentDescription");
        String merchantContact = CommonUtil.cut(xml, "MerchantContact");
        String locale = CommonUtil.cut(xml, "UserLocale");

        try {
            // Idempotency: 同 CorrelationId 視為同一個 request, 回傳同樣的 response
            List<Map<String, Object>> dup = DBUtil.jdbc
                    .queryForList("SELECT * FROM MWP_OLS_SOAP_AUTH WHERE CORRELATION_ID='" + corr + "'");
            if (dup.size() > 0) {
                System.out.println("[AUTH] dup correlationId=" + corr + ", return saved response");
                return (String) dup.get(0).get("RESP_XML");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        String id = "A" + System.currentTimeMillis();
        String result;
        String txid = "";
        long amount = 0;
        try {
            amount = CommonUtil.microsToAmount(priceMicros);
        } catch (Exception e) {
            amount = 0;
        }

        try {
            if (!"TWD".equals(currency)) {
                result = "INVALID_CURRENCY";
            } else if (!BILLING_AGREEMENT.equals(ba)) {
                result = "INVALID_BILLING_AGREEMENT";
            } else {
                List<Map<String, Object>> users = DBUtil.jdbc
                        .queryForList("SELECT * FROM MWP_USER WHERE CSPUID='" + out + "'");
                if (users.size() == 0) {
                    result = "INVALID_USER";
                } else {
                    Map<String, Object> u = users.get(0);
                    String paidType = (String) u.get("CSP_PAID_TYPE");
                    String gsm = (String) u.get("GSM_STATUS");
                    String lock = (String) u.get("ACC_LOCK");
                    // ToS version 要與現行最新的 ToS 版次一致
                    int latestTos = DBUtil.jdbc.queryForObject(
                            "SELECT MAX(TOS_VERSION) FROM MWP_OLS_TOS WHERE MERCHANT_ID='" + OLS_MERCHANT + "'",
                            Integer.class).intValue();
                    if (!String.valueOf(latestTos).equals(tosVer)) {
                        result = "INVALID_TOS";
                    } else if ("bar".equals(gsm) || "hotline".equals(gsm) || "Y".equals(lock)) {
                        result = "ACCOUNT_ON_HOLD";
                    } else if (!"8".equals(paidType)) {
                        result = "NO_LONGER_PROVISIONED";
                    } else if (!"active".equals(gsm)) {
                        result = "GENERAL_DECLINE";
                    } else {
                        // 建立交易與TXID
                        txid = "T" + System.currentTimeMillis();
                        String now = CommonUtil.now14();
                        String authDt = CommonUtil.utcMillisToTwTime(purchaseTime);
                        DBUtil.jdbc.update("INSERT INTO MWP_PAY_TRANS (TXID, MERCHANT_ID, ACC_ID, SERVICE_ID, CHANNEL, AMOUNT, CURRENCY, TX_STATUS, TX_DT, AUTH_DT, MEMO, MERCHANDIZE_NAME, REFERENCE, MODIFY_DATE) VALUES ('"
                                + txid + "','" + OLS_MERCHANT + "','" + u.get("ACC_ID") + "','" + OLS_SERVICE_ID + "','"
                                + OLS_CHANNEL + "'," + amount + ",'TWD','A','" + now + "','" + authDt + "','" + corr
                                + "','" + CommonUtil.trunc(payDesc, 60) + "','" + merchantContact + "','" + now + "')");
                        result = "SUCCESS";
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            result = "RETRIABLE_ERROR";
        }

        String resp = "<AuthResponse><Result>" + result + "</Result><Message>"
                + ("ZH-TW".equalsIgnoreCase(locale) ? msgZh(result) : msgEn(result))
                + "</Message><AuthTransactionId>" + txid + "</AuthTransactionId></AuthResponse>";

        try {
            DBUtil.jdbc.update("INSERT INTO MWP_OLS_SOAP_AUTH (ID, CREATE_TIME, REQUEST_XML, CORRELATION_ID, PURCHASE_TIME, OUT, PAYMENT_DESCRIPTION, MERCHANT_CONTACT, PRICE, ROUNDED_PRICE, AUTH_RESULT, AUTH_TXID, RESP_XML) VALUES ('"
                    + id + "','" + CommonUtil.now14() + "','" + CommonUtil.trunc(xml.replace("'", ""), 250) + "','"
                    + corr + "','" + purchaseTime + "','" + out + "','" + payDesc + "','" + merchantContact + "','"
                    + priceMicros + "'," + amount + ",'" + result + "','" + txid + "','"
                    + CommonUtil.trunc(resp.replace("'", ""), 250) + "')");
        } catch (Exception e) {
            e.printStackTrace();
        }
        System.out.println("[AUTH] corr=" + corr + " result=" + result + " txid=" + txid + " amount=" + amount);
        return resp;
    }

    // ==================== message mapping ====================
    // <Telco should provide mapping string to Vendor> 先自己塞, 之後等窗口給正式文案

    static String msgZh(String code) {
        if ("SUCCESS".equals(code)) return "交易成功";
        if ("INVALID_USER".equals(code)) return "查無用戶";
        if ("INVALID_TOS".equals(code)) return "服務條款版本不符";
        if ("INVALID_CURRENCY".equals(code)) return "幣別錯誤";
        if ("ACCOUNT_ON_HOLD".equals(code)) return "帳戶暫停使用";
        if ("INVALID_BILLING_AGREEMENT".equals(code)) return "BILLING AGREEMENT不合";
        return "系統忙碌中請稍後再試";
    }

    static String msgEn(String code) {
        if ("SUCCESS".equals(code)) return "Success";
        if ("INVALID_USER".equals(code)) return "User not found";
        if ("INVALID_TOS".equals(code)) return "ToS version mismatch";
        if ("INVALID_CURRENCY".equals(code)) return "Invalid currency";
        if ("ACCOUNT_ON_HOLD".equals(code)) return "Account on hold";
        if ("INVALID_BILLING_AGREEMENT".equals(code)) return "Invalid billing agreement";
        return "System busy, try again later";
    }
}
