import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/pages/admin/remote-management/mcp.tsx", "utf8");
const authorizeSource = source.slice(source.indexOf("function MCPAuthorizeDialog("));

test("long-term MCP authorization is opt-in by site settings and defaults on in the form", () => {
  assert.match(source, /long_term_enabled: boolean/);
  assert.match(source, /long_term_expires_at: string/);
  assert.match(authorizeSource, /\[longTerm, setLongTerm\] = useState\(true\)/);
  assert.match(authorizeSource, /const useLongTerm = settings\.long_term_enabled === true && longTerm/);
  assert.match(authorizeSource, /\{settings\.long_term_enabled === true \? \(/);
  assert.match(authorizeSource, /checked=\{longTerm\}/);
  assert.match(authorizeSource, /onChange=\{\(_event, checked\) => setLongTerm\(checked\)\}/);
  assert.match(authorizeSource, /"aria-describedby": "mcp-long-term-hint"/);
});

test("long-term approval hides the temporary editor and sends the compatible default duration", () => {
  assert.match(authorizeSource, /<Box hidden=\{useLongTerm\}>[\s\S]*?mcp\.duration_label[\s\S]*?MCP_DURATION_PRESETS\.map/);
  assert.match(authorizeSource, /const durationMinutes = useLongTerm\s*\? settings\.mcp_default_duration_minutes\s*: preset === "custom"/);
  assert.match(authorizeSource, /const durationError = useLongTerm\s*\? null\s*: preset === "custom"/);
  assert.match(authorizeSource, /parseDurationInput\(customValue, customUnit, settings\.mcp_max_duration_minutes\)/);
  assert.match(authorizeSource, /duration_minutes: durationMinutes,\s*long_term: useLongTerm,/);
  assert.match(authorizeSource, /password: usePasskey \|\| twoFaEnabled \? undefined : secret/);
  assert.match(authorizeSource, /otp: usePasskey \|\| !twoFaEnabled \? undefined : secret/);
  assert.match(authorizeSource, /confirmAdminPasskey\(\)/);
  assert.match(authorizeSource, /canApproveBase && secret/);
});

test("every UI locale explains long-term expiry and provides the checkbox label", () => {
  for (const name of ["en", "zh_CN", "zh_TW", "ja_JP"]) {
    const pack = JSON.parse(readFileSync(`src/i18n/locales/${name}.json`, "utf8"));
    assert.ok(pack.mcp.long_term_authorization);
    assert.match(pack.mcp.long_term_authorization_hint, /2100/);
  }
  const en = JSON.parse(readFileSync("src/i18n/locales/en.json", "utf8"));
  assert.match(en.mcp.long_term_authorization_hint, /revoked/);
  assert.match(en.mcp.long_term_authorization_hint, /browser login expires/);
  assert.match(en.mcp.long_term_authorization_hint, /server restarts/);
  assert.match(en.mcp.long_term_authorization_hint, /Uncheck for temporary/);
});
