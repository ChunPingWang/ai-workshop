package com.telco.mwp.servlet;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.telco.mwp.util.CommonUtil;
import com.telco.mwp.util.DBUtil;

/**
 * SDK API: cancelGPSTransaction (SD 4.3.6)
 * Com.telco.mwp.servlet.CancelGPSTX
 */
@RestController
public class CancelGPSTX {

    @PostMapping(value = "/servlet/CancelGPSTX", produces = "text/xml;charset=UTF-8")
    public String cancel(@RequestBody String body) {
        String merchantID = CommonUtil.cut(body, "merchantID");
        String merchantPassword = CommonUtil.cut(body, "merchantPassword");
        String txid = CommonUtil.cut(body, "TXID");

        if (merchantID.length() == 0 || txid.length() == 0) {
            return out("E30010000", "Invalid XML string (merchantID/TXID)");
        }
        // 商家帳密驗證 (TODO 先寫死, 之後接商家主檔)
        if (!("E000001".equals(merchantID) && "password1".equals(merchantPassword))) {
            return out("E30010100", "Not authorized to use the API");
        }
        try {
            List<Map<String, Object>> txs = DBUtil.jdbc
                    .queryForList("SELECT * FROM MWP_PAY_TRANS WHERE TXID='" + txid + "'");
            if (txs.size() == 0) {
                return out("E30010002", "Transaction NOT found");
            }
            String status = (String) txs.get(0).get("TX_STATUS");
            if ("D".equals(status)) {
                return out("E30010003", "The Transaction has already been charged");
            }
            if ("F".equals(status)) {
                return out("E30010004", "The Transaction has already been canceled");
            }
            DBUtil.jdbc.update("UPDATE MWP_PAY_TRANS SET TX_STATUS='F', RETURN_CODE='Request Cancel', MODIFY_DATE='"
                    + CommonUtil.now14() + "' WHERE TXID='" + txid + "'");
            return out("E00000000", "Success");
        } catch (Exception e) {
            e.printStackTrace();
            return out("E30019900", "System errors|" + e.getMessage());
        }
    }

    private String out(String code, String desc) {
        return "<MWPSDKOutput><returnCode>" + code + "</returnCode><description>" + desc
                + "</description></MWPSDKOutput>";
    }
}
