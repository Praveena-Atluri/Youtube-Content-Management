import assert from "node:assert/strict";
import test from "node:test";

import {
  getAccessConfig,
  isAllowedEmail,
  isDevelopmentBypassEnabled,
  isSafeNextPath,
  secretsMatch
} from "../lib/access-policy";

test("access configuration normalizes and deduplicates domains and exact emails", () => {
  const config = getAccessConfig({
    ALLOWED_EMAIL_DOMAINS: "@Example.com, example.com,staff.example.com",
    ALLOWED_EMAILS: "Person@Outside.test, person@outside.test,other@example.net"
  });

  assert.deepEqual(config.allowedEmailDomains, ["example.com", "staff.example.com"]);
  assert.deepEqual(config.allowedEmails, ["person@outside.test", "other@example.net"]);
  assert.equal(config.isConfigured, true);
});

test("employee access accepts an allowed domain or an exact allowed email", () => {
  const domains = ["example.com"];
  const emails = ["guest@outside.test"];
  assert.equal(isAllowedEmail("person@example.com", domains, emails), true);
  assert.equal(isAllowedEmail("PERSON@EXAMPLE.COM", domains, emails), true);
  assert.equal(isAllowedEmail("GUEST@OUTSIDE.TEST", domains, emails), true);
  assert.equal(isAllowedEmail("other@outside.test", domains, emails), false);
  assert.equal(isAllowedEmail("person@sub.example.com", domains, emails), false);
  assert.equal(isAllowedEmail("person@example.com.attacker.test", domains, emails), false);
  assert.equal(isAllowedEmail(undefined, domains, emails), false);
});

test("either email allowlist can configure access on its own", () => {
  assert.equal(getAccessConfig({ ALLOWED_EMAIL_DOMAINS: "example.com" }).isConfigured, true);
  assert.equal(getAccessConfig({ ALLOWED_EMAILS: "person@outside.test" }).isConfigured, true);
  assert.equal(getAccessConfig({}).isConfigured, false);
});

test("automation secrets require equal non-empty values", () => {
  assert.equal(secretsMatch("correct-secret", "correct-secret"), true);
  assert.equal(secretsMatch("wrong-secret", "correct-secret"), false);
  assert.equal(secretsMatch(null, "correct-secret"), false);
  assert.equal(secretsMatch("", ""), false);
});

test("development bypass cannot be enabled in production", () => {
  assert.equal(
    isDevelopmentBypassEnabled({ NODE_ENV: "development", ACCESS_CONTROL_DEV_BYPASS: "true" }),
    true
  );
  assert.equal(
    isDevelopmentBypassEnabled({ NODE_ENV: "production", ACCESS_CONTROL_DEV_BYPASS: "true" }),
    false
  );
});

test("post-login redirects only accept local absolute paths", () => {
  assert.equal(isSafeNextPath("/stories?sort=virality"), true);
  assert.equal(isSafeNextPath("//attacker.test"), false);
  assert.equal(isSafeNextPath("/\\attacker.test"), false);
  assert.equal(isSafeNextPath("https://attacker.test"), false);
  assert.equal(isSafeNextPath(null), false);
});
