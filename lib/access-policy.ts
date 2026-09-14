export type AccessConfig = {
  allowedEmailDomains: string[];
  allowedEmails: string[];
  isConfigured: boolean;
};

type AccessEnvironment = {
  ACCESS_CONTROL_DEV_BYPASS?: string;
  ALLOWED_EMAIL_DOMAINS?: string;
  ALLOWED_EMAILS?: string;
  NODE_ENV?: string;
};

const INTERNAL_ACCESS_HEADER = "x-media-radar-access";

function parseList(value: string | undefined) {
  return [...new Set((value ?? "").split(",").map((entry) => entry.trim()).filter(Boolean))];
}

export function getAccessConfig(env: AccessEnvironment = process.env): AccessConfig {
  const allowedEmailDomains = [
    ...new Set(
      parseList(env.ALLOWED_EMAIL_DOMAINS).map((domain) =>
        domain.toLowerCase().replace(/^@/, "")
      )
    )
  ];
  const allowedEmails = [
    ...new Set(parseList(env.ALLOWED_EMAILS).map((email) => email.toLowerCase()))
  ];

  return {
    allowedEmailDomains,
    allowedEmails,
    isConfigured: allowedEmailDomains.length > 0 || allowedEmails.length > 0
  };
}

export function isAllowedEmail(
  email: string | null | undefined,
  domains: string[],
  allowedEmails: string[] = []
) {
  if (!email) return false;
  const normalizedEmail = email.trim().toLowerCase();
  const separator = normalizedEmail.lastIndexOf("@");
  if (separator <= 0 || separator === normalizedEmail.length - 1) return false;

  return (
    allowedEmails.includes(normalizedEmail) ||
    domains.includes(normalizedEmail.slice(separator + 1))
  );
}

export function isDevelopmentBypassEnabled(env: AccessEnvironment = process.env) {
  return env.NODE_ENV !== "production" && env.ACCESS_CONTROL_DEV_BYPASS === "true";
}

export function secretsMatch(candidate: string | null, expected: string | undefined) {
  if (!candidate || !expected || candidate.length !== expected.length) return false;

  let difference = 0;
  for (let index = 0; index < candidate.length; index += 1) {
    difference |= candidate.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}

export function isSafeNextPath(value: string | null) {
  return Boolean(
    value?.startsWith("/") &&
      !value.startsWith("//") &&
      !value.includes("\\") &&
      !/[\u0000-\u001f\u007f]/.test(value)
  );
}

export { INTERNAL_ACCESS_HEADER };
