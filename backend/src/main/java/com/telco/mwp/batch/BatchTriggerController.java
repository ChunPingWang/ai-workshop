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
    private OlsBatchJobs jobs;

    @GetMapping("/batch/run")
    public String run(@RequestParam String job) {
        long t0 = System.currentTimeMillis();
        try {
            if ("getOLSRequest".equals(job)) jobs.getOLSRequest();
            else if ("processOLSReqFiles".equals(job)) jobs.processOLSReqFiles();
            else if ("buildOLSResFiles".equals(job)) jobs.buildOLSResFiles();
            else if ("putOLSResponse".equals(job)) jobs.putOLSResponse();
            else if ("buildDeductionCSPFile".equals(job)) jobs.buildDeductionCSPFile();
            else if ("olsChargeMonitor".equals(job)) jobs.olsChargeMonitor();
            else if ("reconOLSDaily".equals(job)) jobs.reconOLSDaily();
            else if ("reconOLSMonthly".equals(job)) jobs.reconOLSMonthly();
            else if ("reconOLSSummary".equals(job)) jobs.reconOLSSummary();
            else if ("all".equals(job)) {
                // 照順序全部跑一輪
                jobs.getOLSRequest();
                jobs.processOLSReqFiles();
                jobs.buildOLSResFiles();
                jobs.putOLSResponse();
                jobs.buildDeductionCSPFile();
                jobs.olsChargeMonitor();
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
