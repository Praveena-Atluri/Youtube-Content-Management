import assert from "node:assert/strict";
import test from "node:test";

import {
  getAccessConfig,
  isAllowedEmail,
  isAuthenticationDisabled,
  isDevelopmentBypassEnabled,
  isSafeNextPath,
  secretsMatch
} from "../lib/access-policy";

test("access configuration normalizes and deduplicates exact emails", () => {
  const config = getAccessConfig({
    ALLOWED_EMAILS: "Person@Outside.test, person@outside.test,other@example.net"
  });

  assert.deepEqual(config.allowedEmails, ["person@outside.test", "other@example.net"]);
  assert.equal(config.isConfigured, true);
});

test("employee access requires an exact allowed email", () => {
  const emails = ["guest@outside.test"];
  assert.equal(isAllowedEmail("GUEST@OUTSIDE.TEST", emails), true);
  assert.equal(isAllowedEmail("other@outside.test", emails), false);
  assert.equal(isAllowedEmail(undefined, emails), false);
});

test("an exact email allowlist is required to configure access", () => {
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

test("authentication can only be disabled with an explicit true value", () => {
  assert.equal(isAuthenticationDisabled({ AUTHENTICATION_DISABLED: "true" }), true);
  assert.equal(isAuthenticationDisabled({ AUTHENTICATION_DISABLED: "false" }), false);
  assert.equal(isAuthenticationDisabled({}), false);
});

test("post-login redirects only accept local absolute paths", () => {
  assert.equal(isSafeNextPath("/stories?sort=virality"), true);
  assert.equal(isSafeNextPath("//attacker.test"), false);
  assert.equal(isSafeNextPath("/\\attacker.test"), false);
  assert.equal(isSafeNextPath("https://attacker.test"), false);
  assert.equal(isSafeNextPath(null), false);
});
