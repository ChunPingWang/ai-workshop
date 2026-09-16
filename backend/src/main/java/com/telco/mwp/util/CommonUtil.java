package com.telco.mwp.util;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.TimeZone;

/**
 * 公共程式 (單位轉換/時間轉換), 見 FSD 4.2.3 General Rule
 */
public class CommonUtil {

    // 大家共用同一個 formatter 就好, 省記憶體
    public static SimpleDateFormat SDF14 = new SimpleDateFormat("yyyyMMddHHmmss");

    public static String now14() {
        return SDF14.format(new Date());
    }

    /**
     * GPS的交易單位為micros, 即原有的交易乘上1,000,000
     * Auth金額要用小數點後一位做四捨五入
     */
    public static long microsToAmount(String micros) {
        double d = Long.parseLong(micros.trim()) / 1000000.0;
        // 先取到小數點後一位再進位
        double d1 = Math.round(d * 10) / 10.0;
        return Math.round(d1);
    }

    /**
     * Timestamp are represented as milliseconds since the Unix epoch in UTC
     * 轉成 new-pay 時間格式(台灣時區 GMT+8)
     */
    public static String utcMillisToTwTime(String millis) {
        SDF14.setTimeZone(TimeZone.getTimeZone("GMT+8"));
        String s = SDF14.format(new Date(Long.parseLong(millis.trim())));
        return s;
    }

    /**
     * 反向: new-pay 時間字串(GMT+8) 轉回 UTC millis (fake OLS 產檔用)
     */
    public static long twTimeToUtcMillis(String time14) {
        try {
            SDF14.setTimeZone(TimeZone.getTimeZone("GMT+8"));
            return SDF14.parse(time14).getTime();
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        }
    }

    /** XML 解析就這樣切就好了, 不用搞什麼 DOM */
    public static String cut(String xml, String tag) {
        String open = "<" + tag + ">";
        String close = "</" + tag + ">";
        int i = xml.indexOf(open);
        if (i < 0) return "";
        int j = xml.indexOf(close, i);
        if (j < 0) return "";
        return xml.substring(i + open.length(), j).trim();
    }

    /** 欄位太小塞不下的時候用 */
    public static String trunc(String s, int len) {
        if (s == null) return "";
        if (s.length() > len) return s.substring(0, len);
        return s;
    }

    /** csv escape... 目前資料沒有逗號, 應該不會有問題 */
    public static String csv(String s) {
        return s == null ? "" : s;
    }
}
