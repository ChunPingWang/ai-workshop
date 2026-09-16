package com.telco.mwp.batch;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 手動觸發批次用 (O&M 說排程沒跑的時候要能補跑, 先開個 URL 給他們按)
 * 沒有做權限控管, 不要外開!!
 */
@RestController
public class BatchTriggerController {

    @Autowired
    private GpsBatchJobs jobs;

    @GetMapping("/batch/run")
    public String run(@RequestParam String job) {
        long t0 = System.currentTimeMillis();
        try {
            if ("getGPSRequest".equals(job)) jobs.getGPSRequest();
            else if ("processGPSReqFiles".equals(job)) jobs.processGPSReqFiles();
            else if ("buildGPSResFiles".equals(job)) jobs.buildGPSResFiles();
            else if ("putGPSResponse".equals(job)) jobs.putGPSResponse();
            else if ("buildDeductionCSPFile".equals(job)) jobs.buildDeductionCSPFile();
            else if ("gpsChargeMonitor".equals(job)) jobs.gpsChargeMonitor();
            else if ("reconGPSDaily".equals(job)) jobs.reconGPSDaily();
            else if ("reconGPSMonthly".equals(job)) jobs.reconGPSMonthly();
            else if ("reconGPSSummary".equals(job)) jobs.reconGPSSummary();
            else if ("all".equals(job)) {
                // 照順序全部跑一輪
                jobs.getGPSRequest();
                jobs.processGPSReqFiles();
                jobs.buildGPSResFiles();
                jobs.putGPSResponse();
                jobs.buildDeductionCSPFile();
                jobs.gpsChargeMonitor();
            } else {
                return "unknown job: " + job;
            }
            return "OK " + job + " cost=" + (System.currentTimeMillis() - t0) + "ms";
        } catch (Exception e) {
            e.printStackTrace();
            return "FAIL " + job + " " + e; // 直接把 exception 丟給畫面, O&M 才看得到
        }
    }
}
