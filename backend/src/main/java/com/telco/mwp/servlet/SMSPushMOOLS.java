package com.telco.mwp.servlet;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.telco.mwp.util.CommonUtil;
import com.telco.mwp.util.DBUtil;

/**
 * Association MO event 接收 (FSD 4.2.1)
 * Mpush 收到 DCB_ASSOCIATION 簡訊會打這支
 */
@RestController
public class SMSPushMOOLS {

    // 呼叫 OLS Carrier Billing API 的位置 (先指到內建的 fake OLS)
    static String OLS_API_URL = "http://localhost:8099/fakeols/associate";

    // fake CSP 名單: 不在 MWP_USER 裡但 CSP 查得到的用戶 (msisdn -> cspuid,paidtype)
    static Map<String, String> CSP_USERS = new HashMap<String, String>();
    static {
        CSP_USERS.put("0955555555", "U0005,8"); // CSP postpaid, 會 auto provision
        CSP_USERS.put("0966666666", "U0006,1"); // CSP prepaid
    }

    @RequestMapping("/servlet/SMSPushMOOLS")
    public String onMoEvent(@RequestParam String msisdn, @RequestParam String content) {
        String id = String.valueOf(System.currentTimeMillis());
        String retCode = "00000000";
        String retDesc = "Success";
        String sut = "";
        try {
            DBUtil.jdbc.update("INSERT INTO MWP_SMS_OLS (ID, CREATE_TIME, SOURCE_SMS_CONTENT, SOURCE_MSISDN, STATUS) VALUES ('"
                    + id + "','" + CommonUtil.now14() + "','" + content + "','" + msisdn + "','I')");

            // 簡訊內容: carrier customizable 字串 + 冒號 + 最長50字元 Token
            if (content.indexOf(":") < 0) {
                retCode = "00000004";
                retDesc = "formatError";
            } else {
                sut = content.substring(content.indexOf(":") + 1);
                // 依 SMS 來源 MSISDN 至 MWP_USER 撈取 CSPUID 作為 OUT
                List<Map<String, Object>> users = DBUtil.jdbc
                        .queryForList("SELECT * FROM MWP_USER WHERE MSISDN='" + msisdn + "'");
                String out = null;
                String paidType = null;
                if (users.size() == 0) {
                    // 若MWP_USER無資料, 呼叫CSP API確認是否為CSP User -> createMWPUser auto provision
                    String cspData = CSP_USERS.get(msisdn);
                    if (cspData == null) {
                        retCode = "00000002";
                        retDesc = "nonCSP";
                    } else {
                        String cspuid = cspData.split(",")[0];
                        paidType = cspData.split(",")[1];
                        if ("8".equals(paidType)) {
                            // createMWPUser (E0101) 進行 auto provision
                            DBUtil.jdbc.update("INSERT INTO MWP_USER (ACC_ID, MSISDN, CSPUID, PAID_TYPE, CSP_PAID_TYPE, GSM_STATUS, ACC_LOCK, STATUS) VALUES ('"
                                    + msisdn + "','" + msisdn + "','" + cspuid + "','8','8','active','N','A')");
                            out = cspuid;
                        } else {
                            retCode = "00000001";
                            retDesc = "Nonpostpaid user";
                        }
                    }
                } else {
                    out = (String) users.get(0).get("CSPUID");
                    paidType = (String) users.get(0).get("CSP_PAID_TYPE");
                    if (!"8".equals(paidType)) {
                        // 若User非postpaid user, 則不call Carrier Billing API
                        retCode = "00000001";
                        retDesc = "Nonpostpaid user";
                        out = null;
                    }
                }

                if (out != null) {
                    // 呼叫 Carrier Billing API 完成 Association (JSON + OAuth2)
                    // TODO OAuth2 Service Account 還沒接, 先直接打 (2013/4)
                    int code = callOls(out, sut);
                    if (code == 200) {
                        retCode = "00000000";
                        retDesc = "Success";
                    } else if (code == 503) {
                        // Operators may retry for 503 errors but no more than 3 times
                        int retry = 0;
                        while (retry < 3 && code == 503) {
                            Thread.sleep(1000);
                            code = callOls(out, sut);
                            retry++;
                        }
                        if (code != 200) {
                            retCode = "00000005";
                            retDesc = "DCB Error";
                        }
                    } else {
                        retCode = "00000005";
                        retDesc = "DCB Error " + code;
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            retCode = "00000005";
            retDesc = "DCB Error";
        }

        String status = "00000000".equals(retCode) ? "D" : "F";
        try {
            DBUtil.jdbc.update("UPDATE MWP_SMS_OLS SET STATUS='" + status + "', REQ_CONTENT='" + sut + "', REQ_TIME='"
                    + CommonUtil.now14() + "', RET_CODE='" + retCode + "', RET_DESCRIPTION='" + retDesc
                    + "' WHERE ID='" + id + "'");
        } catch (Exception e) {
            e.printStackTrace();
        }
        System.out.println("[ASSOC] msisdn=" + msisdn + " ret=" + retCode + " " + retDesc);
        return retCode + "|" + retDesc;
    }

    private int callOls(String out, String sut) {
        try {
            URL url = new URL(OLS_API_URL + "?out=" + URLEncoder.encode(out, "UTF-8") + "&sut="
                    + URLEncoder.encode(sut, "UTF-8"));
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setConnectTimeout(5000);
            int code = conn.getResponseCode();
            if (code == 200) {
                BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                br.readLine(); // 內容不重要
            }
            return code;
        } catch (Exception e) {
            System.out.println("call ols fail " + e);
            return -1;
        }
    }
}
