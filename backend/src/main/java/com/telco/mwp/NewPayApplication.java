package com.telco.mwp;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class NewPayApplication {

    // 全域設定, 大家直接拿去用 (TODO: 之後改成讀 application.properties, 先 hardcode)
    public static Map<String, String> CONFIG = new HashMap<String, String>();

    static {
        CONFIG.put("BILLING_AGREEMENT", "TELCO_TW");
        CONFIG.put("GPS_MERCHANT_ID", "E000001");
        CONFIG.put("GPS_SERVICE_ID", "SVC_GPS_001");
        CONFIG.put("GPS_CHANNEL", "0300"); // 新增Channel：GPS (0300, TBD)
        // CONFIG.put("GPS_CHANNEL", "0301"); // 2013/4 說要改 0301? 先不要動
    }

    public static void main(String[] args) {
        // 開機先把模擬 SFTP 的資料夾建好, 不然 batch 會炸
        new File("data/gps-sftp/request").mkdirs();
        new File("data/gps-sftp/incoming").mkdirs();
        new File("data/gps-sftp/recon").mkdirs();
        new File("data/gps-sftp/monthly").mkdirs();
        new File("data/gps-work/request").mkdirs();
        new File("data/gps-work/request/Processed").mkdirs();
        new File("data/gps-work/response").mkdirs();
        new File("data/nas/daily").mkdirs();
        new File("data/nas/monthly").mkdirs();
        new File("data/csp").mkdirs();
        SpringApplication.run(NewPayApplication.class, args);
        System.out.println("=== new-pay started ===");
    }
}
