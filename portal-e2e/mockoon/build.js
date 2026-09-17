/**
 * 把 mockoon/routes/*.json（人／AI 好讀好寫的簡化規格）
 * 組成 Mockoon 正式環境檔 mockoon/newpay-backend.json。
 *
 * 用法：node mockoon/build.js   （npm run mock:build）
 *
 * 簡化規格格式（每個檔案一組相關 route）：
 * {
 *   "description": "說明",
 *   "routes": [
 *     {
 *       "method": "GET" | "POST",
 *       "path": "sa/report/trans",            // 不含開頭斜線
 *       "documentation": "對應 FSD 4.6.1",
 *       "responses": [
 *         {
 *           "label": "有資料（預設）",
 *           "default": true,                  // 沒有任何 rule 命中時回這個；每個 route 恰好一個
 *           "status": 200,
 *           "contentType": "text/html;charset=UTF-8",
 *           "bodyFile": "report-trans-rows.html"   // 相對 mockoon/bodies/；或直接給 "body": "..."
 *         },
 *         {
 *           "label": "查無資料",
 *           "rules": [ { "target": "query", "key": "merchantId", "operator": "equals", "value": "E000002" } ],
 *           "rulesOperator": "AND",           // 預設 OR
 *           "status": 200,
 *           "bodyFile": "report-empty.html"
 *         }
 *       ]
 *     }
 *   ]
 * }
 *
 * rule.target：query | body | header | params | cookie
 * rule.operator：equals | regex | null | empty_array | array_includes（Mockoon 原生）
 * body target 可對 form-urlencoded 欄位（Portal 的 $.post 就是這種）
 */
const fs = require('fs');
const path = require('path');
const {
  BuildEnvironment, BuildHTTPRoute, BuildRouteResponse, BuildResponseRule, BuildHeader,
} = require('@mockoon/commons');

const ROOT = __dirname;
const routesDir = path.join(ROOT, 'routes');
const bodiesDir = path.join(ROOT, 'bodies');
const outFile = path.join(ROOT, 'newpay-backend.json');

const env = BuildEnvironment({ hasDefaultRoute: false, hasContentTypeHeader: false, hasCorsHeaders: true });
env.name = 'new-pay backend (mock for portal-e2e)';
env.port = 8099;
env.hostname = '';

// 健康檢查 route：Playwright webServer 會等它回 200
addRoute(env, {
  method: 'GET', path: 'health', documentation: 'portal-e2e 用的健康檢查',
  responses: [{ label: 'OK', default: true, status: 200, contentType: 'text/plain', body: 'OK' }],
});

const specFiles = fs.readdirSync(routesDir).filter((f) => f.endsWith('.json')).sort();
let routeCount = 0;
for (const file of specFiles) {
  const spec = JSON.parse(fs.readFileSync(path.join(routesDir, file), 'utf8'));
  for (const r of spec.routes || []) {
    validateRoute(r, file);
    addRoute(env, r);
    routeCount++;
  }
}

fs.writeFileSync(outFile, JSON.stringify(env, null, 2) + '\n');
console.log(`[mockoon] ${specFiles.length} spec files → ${routeCount + 1} routes → ${path.relative(process.cwd(), outFile)}`);

// ---------------------------------------------------------------------------

function addRoute(env, r) {
  const route = BuildHTTPRoute(false);
  route.method = r.method.toLowerCase();
  route.endpoint = r.path.replace(/^\//, '');
  route.documentation = r.documentation || '';
  route.responseMode = null; // null = 依 rules 分流，沒命中就用 default
  route.responses = r.responses.map((res) => buildResponse(res));
  env.routes.push(route);
  env.rootChildren.push({ type: 'route', uuid: route.uuid });
}

function buildResponse(res) {
  const out = BuildRouteResponse();
  out.label = res.label || '';
  out.statusCode = res.status ?? 200;
  out.default = !!res.default;
  out.disableTemplating = true; // 內容原樣回，不要被 {{ }} 樣板解析
  out.headers = [BuildHeader('Content-Type', res.contentType || guessContentType(res))];
  out.body = res.body !== undefined ? res.body : fs.readFileSync(path.join(bodiesDir, res.bodyFile), 'utf8');
  out.rulesOperator = res.rulesOperator || 'OR';
  out.rules = (res.rules || []).map((rule) => {
    const built = BuildResponseRule();
    built.target = rule.target;
    built.modifier = rule.key;
    built.operator = rule.operator || 'equals';
    built.value = rule.value ?? '';
    built.invert = !!rule.invert;
    return built;
  });
  return out;
}

function guessContentType(res) {
  const name = res.bodyFile || '';
  if (name.endsWith('.json')) return 'application/json';
  if (name.endsWith('.html')) return 'text/html;charset=UTF-8';
  return 'text/plain;charset=UTF-8';
}

function validateRoute(r, file) {
  const where = `${file} → ${r.method} /${r.path}`;
  if (!r.method || !r.path || !Array.isArray(r.responses) || r.responses.length === 0) {
    throw new Error(`[mockoon] ${where}: 需要 method / path / responses[]`);
  }
  const defaults = r.responses.filter((x) => x.default);
  if (defaults.length !== 1) throw new Error(`[mockoon] ${where}: 必須恰好一個 default:true 的 response（目前 ${defaults.length}）`);
  for (const res of r.responses) {
    if (res.body === undefined && !res.bodyFile) throw new Error(`[mockoon] ${where} [${res.label}]: 需要 body 或 bodyFile`);
    if (res.bodyFile && !fs.existsSync(path.join(bodiesDir, res.bodyFile))) {
      throw new Error(`[mockoon] ${where} [${res.label}]: 找不到 bodies/${res.bodyFile}`);
    }
    if (!res.default && (!res.rules || res.rules.length === 0)) {
      throw new Error(`[mockoon] ${where} [${res.label}]: 非 default 的 response 需要至少一條 rule`);
    }
  }
}
