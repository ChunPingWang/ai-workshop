package com.telco.mwp.servlet;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.telco.mwp.util.CommonUtil;
import com.telco.mwp.util.DBUtil;

/**
 * 服務條款 (FSD 4.5.1)
 */
@RestController
public class ToSController {

    /** 用戶取 ToS 內容, 未輸入 version 回最後版本, 未輸入 merchantID 用 I00000000 */
    @GetMapping(value = "/getToS.jsp", produces = "text/html;charset=UTF-8")
    public String getToS(@RequestParam(required = false) String merchantID,
            @RequestParam(required = false) String version) {
        if (merchantID == null || merchantID.length() == 0) merchantID = "I00000000";
        String sql = "SELECT * FROM MWP_OLS_TOS WHERE MERCHANT_ID='" + merchantID + "'";
        if (version != null && version.length() > 0) {
            sql = sql + " AND TOS_VERSION=" + version;
        }
        sql = sql + " ORDER BY TOS_VERSION DESC";
        try {
            List<Map<String, Object>> rows = DBUtil.jdbc.queryForList(sql);
            if (rows.size() == 0) return "<html><body>NO ToS</body></html>";
            Map<String, Object> r = rows.get(0);
            return "<html><body><h3>服務條款 v" + r.get("TOS_VERSION") + "</h3><pre>" + r.get("TOS_CONTENT")
                    + "</pre></body></html>";
        } catch (Exception e) {
            e.printStackTrace();
            return "<html><body>error:" + e.getMessage() + "</body></html>";
        }
    }

    /** SA Portal PM 建立服務條款, 版次系統控管, 建立後不能改, 要改就開新版次 */
    @PostMapping("/sa/tos/save")
    public String save(@RequestParam String merchantID, @RequestParam String startDate,
            @RequestParam String content, @RequestParam(required = false) String note) {
        try {
            Integer max = DBUtil.jdbc.queryForObject(
                    "SELECT MAX(TOS_VERSION) FROM MWP_OLS_TOS WHERE MERCHANT_ID='" + merchantID + "'", Integer.class);
            int ver = (max == null ? 1 : max.intValue() + 1);
            String url = "http://localhost:8099/getToS.jsp?merchantID=" + merchantID + "&version=" + ver;
            DBUtil.jdbc.update("INSERT INTO MWP_OLS_TOS (MERCHANT_ID, TOS_VERSION, TOS_URL, TOS_CONTENT, TOS_NOTE, TOS_MODIFIED_DATE, TOS_START_DATE) VALUES ('"
                    + merchantID + "'," + ver + ",'" + url + "','" + content + "','" + (note == null ? "" : note)
                    + "','" + CommonUtil.now14() + "','" + startDate + "')");
            return "OK version=" + ver + " url=" + url;
        } catch (Exception e) {
            e.printStackTrace();
            return "FAIL " + e.getMessage();
        }
    }

    /** SA Portal 查詢最新服務條款 */
    @GetMapping("/sa/tos/query")
    public Object query(@RequestParam String merchantID) {
        return DBUtil.jdbc.queryForList(
                "SELECT * FROM MWP_OLS_TOS WHERE MERCHANT_ID='" + merchantID + "' ORDER BY TOS_VERSION DESC");
    }
}
