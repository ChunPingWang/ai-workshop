#!/bin/bash
# new-pay 端到端 demo (先啟動應用: JAVA_HOME=~/.sdkman/candidates/java/8.0.482-zulu mvn spring-boot:run)
set -e
B=http://localhost:8099
NOW=$(date +%s000)

step() { echo; echo "========== $1 =========="; }

step "0. echo"
curl -s "$B/soap/echo"; echo

step "1. Association: postpaid / CSP auto-provision / nonCSP / DCB 404"
curl -s "$B/servlet/SMSPushMOOLS?msisdn=0912345678&content=DCB_ASSOCIATION:SUT123"; echo
curl -s "$B/servlet/SMSPushMOOLS?msisdn=0955555555&content=DCB_ASSOCIATION:SUT555"; echo
curl -s "$B/servlet/SMSPushMOOLS?msisdn=0977777777&content=DCB_ASSOCIATION:SUT777"; echo
curl -s "$B/servlet/SMSPushMOOLS?msisdn=0912345678&content=DCB_ASSOCIATION:BAD404X"; echo

step "2. getProvisioning: postpaid true / prepaid false / hybrid false / unknown INVALID_USER"
for U in U0001 U0002 U0004 U9999; do
  curl -s -X POST $B/soap/getProvisioning -H "Content-Type: text/xml" -d "<GetProvisioningRequest><OperatorUserToken>$U</OperatorUserToken><BillingAgreementId>TELCO_TW</BillingAgreementId><UserLocale>ZH-TW</UserLocale><CorrelationId>P-$U</CorrelationId></GetProvisioningRequest>"; echo
done

step "3. Auth: C001(99.5->100) C002(50) C003(10) + 冪等重送 + bar 用戶"
auth() {
  curl -s -X POST $B/soap/auth -H "Content-Type: text/xml" -d "<AuthRequest><CorrelationId>$1</CorrelationId><OperatorUserToken>$2</OperatorUserToken><BillingAgreementId>TELCO_TW</BillingAgreementId><Currency>TWD</Currency><PriceMicros>$3</PriceMicros><TosVersion>1</TosVersion><PurchaseTime>$NOW</PurchaseTime><PaymentDescription>$4</PaymentDescription><MerchantContact>dev@onlinestore</MerchantContact><UserLocale>ZH-TW</UserLocale></AuthRequest>"; echo
}
auth C001 U0001 99500000 GameCoin
auth C002 U0001 50000000 AppItem
auth C003 U0001 10000000 Book
auth C001 U0001 99500000 GameCoin   # idempotent, 應回同一個 TXID
auth C004 U0003 10000000 X          # bar -> ACCOUNT_ON_HOLD

step "4. Batch: Charge C001/C002, Cancel C003 -> 回應檔"
curl -s "$B/fakeols/genRequestFile?type=Charge&correlationId=C001"; echo
curl -s "$B/fakeols/genRequestFile?type=Charge&correlationId=C002"; echo
curl -s "$B/fakeols/genRequestFile?type=Cancel&correlationId=C003"; echo
curl -s "$B/batch/run?job=all"; echo
echo "--- response files:"; ls backend/data/ols-sftp/incoming/ | tail -3

step "5. Refund C002"
curl -s "$B/fakeols/genRequestFile?type=Refund&correlationId=C002"; echo
curl -s "$B/batch/run?job=all"; echo

step "6. 日對帳 (正常, 應為 Y/diff=0)"
curl -s "$B/fakeols/genReconFile"; echo
curl -s "$B/batch/run?job=reconOLSDaily"; echo
curl -s "$B/sa/report/reconDaily?from=20000101&to=20991231"; echo

step "7. 月對帳 (mismatch=true, 應觸發 104 告警, 看 console log)"
curl -s "$B/fakeols/genMonthlyFile?mismatch=true"; echo
curl -s "$B/batch/run?job=reconOLSMonthly"; echo

step "8. 報表"
curl -s "$B/csr/trans?msisdn=0912345678"; echo

echo; echo "demo done. H2 console: $B/h2-console (jdbc:h2:mem:newpay / sa)"
