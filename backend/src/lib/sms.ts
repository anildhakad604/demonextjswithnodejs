// Pluggable SMS sender for the mobile+OTP login flow. Mirrors lib/email.ts's
// dev-fallback pattern: with no provider configured, the OTP is just logged
// to the console (and returned in the API response in non-production) so the
// flow can be tested end-to-end without a real SMS account. Drop in a real
// provider (Twilio, MSG91, 2Factor, ...) by implementing sendSms below and
// reading its credentials from env vars — no other code needs to change.

const isProd = process.env.NODE_ENV === "production";

export async function sendOtpSms(phone: string, code: string): Promise<void> {
  const hasProvider = Boolean(process.env.SMS_PROVIDER_API_KEY);

  if (!hasProvider) {
    console.log(`[sms] No SMS provider configured — OTP for ${phone} is ${code} (dev mode, not actually sent)`);
    return;
  }

  // Placeholder for a real integration. Example shape for most providers:
  //   await fetch(process.env.SMS_PROVIDER_URL!, {
  //     method: "POST",
  //     headers: { Authorization: `Bearer ${process.env.SMS_PROVIDER_API_KEY}` },
  //     body: JSON.stringify({ to: phone, message: `Your SweetyNX OTP is ${code}` }),
  //   });
  console.log(`[sms] SMS_PROVIDER_API_KEY is set but no provider integration is wired up yet for ${phone}`);
}

export function otpDebugValue(code: string): string | undefined {
  // Only ever exposed in the API response outside production, so a
  // developer can complete the login flow without reading server logs.
  return isProd ? undefined : code;
}
