package com.telco.mwp.portal;

import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpSession;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.client.RestTemplate;

/**
 * Portal 全部頁面 + ajax proxy 都在這一支 (SA / CP / CSR 共用)
 * 畫面呼叫 portal, portal 再用 RestTemplate 轉打 backend
 */
@Controller
public class PortalController {

    // backend 位置 (application.properties 有一份但沒在讀, 以這裡為準)
    static String BACKEND = "http://localhost:8099";

    // 帳號先寫死, 之後接 LDAP (2013/4)
    static Map<String, String> USERS = new HashMap<String, String>();
    static {
        USERS.put("sa", "sa");     // SA Portal (BO/PM/Finance BO)
        USERS.put("cp", "cp");     // Merchant Portal
        USERS.put("csr", "csr");   // CSR Portal
    }

    // ==================== login ====================

    @GetMapping("/login")
    public String login() {
        return "login";
    }

    @PostMapping("/doLogin")
    public String doLogin(@RequestParam String username, @RequestParam String password, HttpSession session,
            Model model) {
        if (USERS.containsKey(username) && USERS.get(username).equals(password)) {
            session.setAttribute("loginUser", username);
            session.setAttribute("role", username); // 帳號就是角色, 很好記
            return "redirect:/";
        }
        model.addAttribute("err", "帳號或密碼錯誤");
        return "login";
    }

    @GetMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/login";
    }

    // ==================== pages ====================

    @GetMapping("/")
    public String index(HttpSession session, Model model) {
        if (session.getAttribute("loginUser") == null) return "redirect:/login";
        model.addAttribute("user", session.getAttribute("loginUser"));
        model.addAttribute("role", session.getAttribute("role"));
        return "index";
    }

    // 4.6.1 / 4.6.2 交易與退款報表 (SA/CP 共用一頁, 用 type 切)
    @GetMapping("/report")
    public String report(@RequestParam(defaultValue = "trans") String type, HttpSession session, Model model) {
        if (session.getAttribute("loginUser") == null) return "redirect:/login";
        model.addAttribute("type", type);
        model.addAttribute("user", session.getAttribute("loginUser"));
        return "report";
    }

    // 4.6.3 / 4.6.4 對帳結果查詢
    @GetMapping("/recon")
    public String recon(HttpSession session, Model model) {
        if (session.getAttribute("loginUser") == null) return "redirect:/login";
        model.addAttribute("user", session.getAttribute("loginUser"));
        return "recon";
    }

    // 4.5.1 服務條款設定
    @GetMapping("/tos")
    public String tos(HttpSession session, Model model) {
        if (session.getAttribute("loginUser") == null) return "redirect:/login";
        model.addAttribute("user", session.getAttribute("loginUser"));
        return "tos";
    }

    // 4.6.6 商家銀行帳戶註冊
    @GetMapping("/bankacc")
    public String bankacc(HttpSession session, Model model) {
        if (session.getAttribute("loginUser") == null) return "redirect:/login";
        model.addAttribute("user", session.getAttribute("loginUser"));
        return "bankacc";
    }

    // 4.6.5 CSR 查詢交易紀錄
    @GetMapping("/csr")
    public String csr(HttpSession session, Model model) {
        if (session.getAttribute("loginUser") == null) return "redirect:/login";
        model.addAttribute("user", session.getAttribute("loginUser"));
        return "csr";
    }

    // ==================== ajax proxy ====================

    @GetMapping("/report/data")
    @ResponseBody
    public String reportData(@RequestParam String type, @RequestParam String from, @RequestParam String to,
            @RequestParam(required = false) String merchantId, @RequestParam(required = false) String timeType,
            HttpSession session) {
        if (session.getAttribute("loginUser") == null) return "please login";
        String url;
        if ("refund".equals(type)) {
            url = BACKEND + "/sa/report/refund?from=" + from + "&to=" + to;
        } else {
            url = BACKEND + "/sa/report/trans?from=" + from + "&to=" + to;
            if (merchantId != null && merchantId.length() > 0) url += "&merchantId=" + merchantId;
            if (timeType != null) url += "&timeType=" + timeType;
        }
        return relay(url);
    }

    @GetMapping("/recon/data")
    @ResponseBody
    public String reconData(@RequestParam String type, @RequestParam String from, @RequestParam String to,
            HttpSession session) {
        if (session.getAttribute("loginUser") == null) return "please login";
        if ("monthly".equals(type)) {
            return relay(BACKEND + "/sa/report/reconMonthly?from=" + from + "&to=" + to);
        }
        return relay(BACKEND + "/sa/report/reconDaily?from=" + from + "&to=" + to);
    }

    @GetMapping("/recon/detail")
    @ResponseBody
    public String reconDetail(@RequestParam String reconId, HttpSession session) {
        if (session.getAttribute("loginUser") == null) return "please login";
        return relay(BACKEND + "/sa/report/reconDailyDetail?reconId=" + reconId);
    }

    @GetMapping("/tos/data")
    @ResponseBody
    public String tosData(@RequestParam String merchantID, HttpSession session) {
        if (session.getAttribute("loginUser") == null) return "[]";
        return relay(BACKEND + "/sa/tos/query?merchantID=" + merchantID);
    }

    @PostMapping("/tos/save")
    @ResponseBody
    public String tosSave(@RequestParam String merchantID, @RequestParam String startDate,
            @RequestParam String content, @RequestParam(required = false) String note, HttpSession session) {
        if (session.getAttribute("loginUser") == null) return "please login";
        MultiValueMap<String, String> form = new LinkedMultiValueMap<String, String>();
        form.add("merchantID", merchantID);
        form.add("startDate", startDate);
        form.add("content", content);
        form.add("note", note == null ? "" : note);
        try {
            return new RestTemplate().postForObject(BACKEND + "/sa/tos/save", form, String.class);
        } catch (Exception e) {
            e.printStackTrace();
            return "FAIL " + e.getMessage();
        }
    }

    @GetMapping("/bankacc/data")
    @ResponseBody
    public String bankaccData(@RequestParam String merchantId, HttpSession session) {
        if (session.getAttribute("loginUser") == null) return "[]";
        return relay(BACKEND + "/cp/bankacc/list?merchantId=" + merchantId);
    }

    @PostMapping("/bankacc/save")
    @ResponseBody
    public String bankaccSave(@RequestParam String merchantId, @RequestParam String bankCode,
            @RequestParam String bankAcc, @RequestParam String currency,
            @RequestParam(required = false) String isDomestic, HttpSession session) {
        if (session.getAttribute("loginUser") == null) return "please login";
        MultiValueMap<String, String> form = new LinkedMultiValueMap<String, String>();
        form.add("merchantId", merchantId);
        form.add("bankCode", bankCode);
        form.add("bankAcc", bankAcc);
        form.add("currency", currency);
        form.add("isDomestic", isDomestic == null ? "Y" : isDomestic);
        try {
            return new RestTemplate().postForObject(BACKEND + "/cp/bankacc/save", form, String.class);
        } catch (Exception e) {
            e.printStackTrace();
            return "FAIL " + e.getMessage();
        }
    }

    @GetMapping("/csr/data")
    @ResponseBody
    public String csrData(@RequestParam String msisdn, HttpSession session) {
        if (session.getAttribute("loginUser") == null) return "please login";
        return relay(BACKEND + "/csr/trans?msisdn=" + msisdn);
    }

    // 每次 new 一個 RestTemplate, 反正會動
    private String relay(String url) {
        try {
            return new RestTemplate().getForObject(url, String.class);
        } catch (Exception e) {
            e.printStackTrace();
            return "backend error: " + e.getMessage();
        }
    }
}
