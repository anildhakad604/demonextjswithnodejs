"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ApiRequestError } from "@/lib/api";

const OTP_LENGTH = 4;

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginFlow />
    </Suspense>
  );
}

function LoginFlow() {
  const { requestOtp, verifyOtp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const boxRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step !== "otp" || resendSecondsLeft <= 0) return;
    const timer = setInterval(() => setResendSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [step, resendSecondsLeft]);

  useEffect(() => {
    if (step === "otp") boxRefs.current[0]?.focus();
  }, [step]);

  async function sendOtp() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await requestOtp(phone);
      setResendSecondsLeft(res.resendSecondsLeft);
      setDevOtp(res.devOtp ?? null);
      setDigits(Array(OTP_LENGTH).fill(""));
      setStep("otp");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't send OTP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    await sendOtp();
  }

  async function verify(code: string) {
    setError(null);
    setSubmitting(true);
    try {
      const user = await verifyOtp(phone, code);
      router.push(user.role === "ADMIN" ? "/admin" : searchParams.get("next") || "/");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Incorrect OTP");
      setDigits(Array(OTP_LENGTH).fill(""));
      boxRefs.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  function handleDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    if (digit && index < OTP_LENGTH - 1) {
      boxRefs.current[index + 1]?.focus();
    }
    if (next.every((d) => d !== "")) {
      verify(next.join(""));
    }
  }

  function handleDigitKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      boxRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    boxRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
    if (pasted.length === OTP_LENGTH) verify(pasted);
  }

  return (
    <main className="login-section">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12">
            <div className="login-card">
              <div className="login-card-grid">
                <div className="login-brand-pane">
                  <Image src="/sweetynx/logo.png" alt="SweetyNX" width={160} height={53} className="login-brand-logo" />
                </div>
                <div className={`login-form-pane`}>
                  <div className={`login-form-inner ${step === "otp" ? "otp-layout" : ""}`}>
                    {error && <p className="error-text">{error}</p>}

                    {step === "phone" ? (
                      <>
                        <h2 className="login-title">Login or Sign Up</h2>
                        <form className="login-form" onSubmit={handlePhoneSubmit}>
                          <div className="phone-input">
                            <span className="dial-code">+91</span>
                            <input
                              id="mobile"
                              type="tel"
                              inputMode="numeric"
                              maxLength={10}
                              placeholder="Mobile number"
                              required
                              value={phone}
                              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            />
                          </div>
                          <p className="terms">
                            By continuing, you agree to our Terms of Service and Privacy Policy.
                          </p>
                          <button className="login-btn" type="submit" disabled={submitting}>
                            {submitting ? "Sending OTP..." : "Continue"}
                          </button>
                        </form>
                      </>
                    ) : (
                      <div className="otp-step">
                        <h2 className="login-title">Verify your number</h2>
                        <p className="otp-subtitle">
                          Enter the OTP sent to +91 {phone}
                        </p>
                        <div className="otp-box-row">
                          {digits.map((d, i) => (
                            <input
                              key={i}
                              ref={(el) => {
                                boxRefs.current[i] = el;
                              }}
                              className="otp-box"
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={d}
                              disabled={submitting}
                              onChange={(e) => handleDigitChange(i, e.target.value)}
                              onKeyDown={(e) => handleDigitKeyDown(i, e)}
                              onPaste={handlePaste}
                            />
                          ))}
                        </div>
                        <div className="otp-meta">
                          <button
                            type="button"
                            className="resend-btn"
                            disabled={resendSecondsLeft > 0 || submitting}
                            onClick={sendOtp}
                          >
                            Resend OTP
                          </button>
                          {resendSecondsLeft > 0 && (
                            <span className="otp-countdown">
                              {" "}in {Math.floor(resendSecondsLeft / 60)}:{String(resendSecondsLeft % 60).padStart(2, "0")}
                            </span>
                          )}
                        </div>
                        {devOtp && (
                          <p className="otp-dev-hint">Dev mode — no SMS provider configured, your OTP is {devOtp}</p>
                        )}
                        <button type="button" className="otp-change-number" onClick={() => setStep("phone")}>
                          Change number
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
