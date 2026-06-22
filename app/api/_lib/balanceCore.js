import { createHmac } from "crypto";

function round2(value) {
  return Math.round(value * 100) / 100;
}

export const ADMIN_EMAILS = ["kaban.vershinin@gmail.com", "didig.vershinin@yandex.ru"];

export function isAdminUser(user) {
  return !!(user?.email && ADMIN_EMAILS.some((email) => email.toLowerCase() === user.email.toLowerCase()));
}

export function signBillToken(cost, secret, billingEnabled, extra = {}, now = Date.now()) {
  if (!billingEnabled || !(cost > 0) || !secret) return "";
  const payload = Buffer.from(JSON.stringify({ c: round2(cost), e: now + 3600_000, ...extra })).toString("base64url");
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyBillDataToken(token, secret, billingEnabled, now = Date.now()) {
  if (!billingEnabled || !token || typeof token !== "string" || !secret) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  if (sig !== expected) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!data.e || now > data.e) return null;
    return data;
  } catch {
    return null;
  }
}

export function verifyBillAmount(token, secret, billingEnabled, now = Date.now()) {
  const data = verifyBillDataToken(token, secret, billingEnabled, now);
  return data ? (Number(data.c) || 0) : 0;
}
