/**
 * 對「正在跑的」Mockoon（預設 http://localhost:8099）逐一打每個 route 的每個 response，
 * 確認 rule 分流正確。用法：先 npm run mock:start，另開終端機 npm run mock:check
 *
 * 每個 response 可選填 "example"：{ "query": {...}, "form": {...} }，沒填就用空請求（只驗 default）。
 * 判定方式：回應狀態碼要等於 response.status，且 body 前 40 字要跟預期 body 一致。
 */
const fs = require('fs');
const path = require('path');

const BASE = process.env.MOCK_URL || 'http://localhost:8099';
const routesDir = path.join(__dirname, 'routes');
const bodiesDir = path.join(__dirname, 'bodies');

(async () => {
  let pass = 0, fail = 0;
  const specs = fs.readdirSync(routesDir).filter((f) => f.endsWith('.json')).sort();
  for (const file of specs) {
    const spec = JSON.parse(fs.readFileSync(path.join(routesDir, file), 'utf8'));
    for (const r of spec.routes) {
      for (const res of r.responses) {
        const example = res.example || exampleFromRules(res);
        const url = new URL(`${BASE}/${r.path}`);
        for (const [k, v] of Object.entries(example.query || {})) url.searchParams.set(k, v);
        const init = { method: r.method };
        if (example.form) {
          init.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
          init.body = new URLSearchParams(example.form).toString();
        }
        const expectedBody = res.body !== undefined ? res.body : fs.readFileSync(path.join(bodiesDir, res.bodyFile), 'utf8');
        let ok = false, detail = '';
        try {
          const resp = await fetch(url, init);
          const text = await resp.text();
          ok = resp.status === (res.status ?? 200) && norm(text).startsWith(norm(expectedBody).slice(0, 40));
          detail = `${resp.status} ${norm(text).slice(0, 50)}`;
        } catch (e) {
          detail = e.message;
        }
        ok ? pass++ : fail++;
        console.log(`${ok ? '✓' : '✗'} ${r.method} /${r.path} [${res.label}] → ${detail}`);
      }
    }
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();

/** 沒有 example 時，從 rules 反推一組會命中的請求（equals 直接用值、regex 用原字串去掉 ^） */
function exampleFromRules(res) {
  const ex = { query: {}, form: {} };
  for (const rule of res.rules || []) {
    const value = rule.operator === 'regex' ? rule.value.replace(/^\^/, '') : rule.value;
    if (rule.target === 'query') ex.query[rule.key] = value;
    if (rule.target === 'body') ex.form[rule.key] = value;
  }
  if (Object.keys(ex.form).length === 0) delete ex.form;
  return ex;
}

function norm(s) {
  return String(s).replace(/\s+/g, ' ').trim();
}
