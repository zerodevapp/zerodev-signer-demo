"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { Mail, KeyRound, Loader2, Info } from "lucide-react";
import { sha256, type Hex } from "viem";
import { cn } from "./lib/utils";
import { useZeroDevSignerProvider } from "./hooks/useZeroDevSignerProvider";

type OTPStep = 'send' | 'verify';

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState("");

  // OTP specific state
  const [otpStep, setOtpStep] = useState<OTPStep>('send');
  const [otpCode, setOtpCode] = useState("");
  const [otpData, setOtpData] = useState<{
    otpId: string;
    subOrganizationId: string;
  } | null>(null);

  // OAuth state
  const [nonce, setNonce] = useState<string>("");

  const { isReady, auth, getPublicKeys } = useZeroDevSignerProvider();

  // Generate nonce for OAuth
  useEffect(() => {
    const generateNonce = async () => {
      if (isReady) {
        try {
          const { compressedPublicKey } = await getPublicKeys();
          console.log("compressedPublicKey", compressedPublicKey);
          const nonceHash = sha256(compressedPublicKey as Hex);
          setNonce(nonceHash.replace(/^0x/, ""));
        } catch (err) {
          console.error("Failed to generate nonce:", err);
        }
      }
    };
    generateNonce();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  // Optional: Add a "Continue to Dashboard" button if already logged in
  // But don't auto-redirect - let user see the login page

  const handlePasskeyRegister = async () => {
    if (!email.trim()) return;
    setLoadingAction("passkey-register");
    setError("");

    try {
      await auth({
        type: "passkey",
        email,
        mode: "register",
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Passkey registration failed");
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePasskeyLogin = async () => {
    if (!email.trim()) return;
    setLoadingAction("passkey-login");
    setError("");

    try {
      await auth({
        type: "passkey",
        email,
        mode: "login",
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Passkey login failed");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleEmailAuth = async () => {
    if (!email.trim()) return;
    setLoadingAction("email");
    setError("");

    console.log(`${window.location.origin}/verify?bundle=%s`)
    try {
      await auth({
        type: "email",
        email,
        emailCustomization: {
          magicLinkTemplate: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/verify?bundle=%s`
        },
      });
      setError("Magic link sent! Check your email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send magic link");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleOTPSend = async () => {
    if (!email.trim()) return;
    setLoadingAction("otp-send");
    setError("");

    try {
      const data = await auth({
        type: "otp",
        mode: "register",
        email,
        contact: { type: "email", contact: email }
      });
      setOtpData({
        otpId: data.otpId,
        subOrganizationId: data.subOrganizationId
      });
      setOtpStep('verify');
      setError("OTP code sent to your email");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleOTPVerify = async () => {
    if (!otpCode.trim() || !otpData) return;
    setLoadingAction("otp-verify");
    setError("");

    try {
      await auth({
        type: "otp",
        mode: "login",
        otpId: otpData.otpId,
        otpCode: otpCode,
        subOrganizationId: otpData.subOrganizationId
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid OTP code");
    } finally {
      setLoadingAction(null);
    }
  };

  const resetOTP = () => {
    setOtpStep('send');
    setOtpCode("");
    setOtpData(null);
    setError("");
  };

  const handleOAuthSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError("No credential received from Google");
      return;
    }

    setLoadingAction("oauth");
    setError("");

    try {
      await auth({
        type: "oauth",
        credential: credentialResponse.credential,
        provider: "google",
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "OAuth authentication failed");
    } finally {
      setLoadingAction(null);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[450px]">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Logo/Brand - Inside Card */}
          <div className="px-8 pt-10 pb-6 text-center space-y-4">
            <div className="inline-flex items-center justify-center relative">
              <svg
                className="w-12 h-12"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L2 7V17L12 22L22 17V7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 22V12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 7L12 12L2 7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="absolute -top-1 -right-8 text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full font-medium">
                Demo
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">ZeroDev Signer</h1>
              <p className="text-sm text-gray-500 mt-2 font-medium">Log in or sign up</p>
            </div>
          </div>

          {/* Auth Form */}
          <div className="px-8 pb-8 space-y-4">
            {/* Email Input or OTP Code Input */}
            {otpStep === 'send' ? (
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isReady || loadingAction !== null}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg border border-gray-200",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                    "text-gray-900 placeholder:text-gray-400 text-[15px]",
                    "transition-all duration-200",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                />
              </div>
            ) : (
              <>
                <div className="px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Enter the 6-digit code sent to <span className="font-semibold">{email}</span>
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleOTPVerify()}
                  maxLength={9}
                  autoFocus
                  className={cn(
                    "w-full px-4 py-3 rounded-lg border border-gray-200 text-center font-mono text-xl tracking-[0.5em]",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                    "text-gray-900 placeholder:text-gray-300"
                  )}
                />
                <button
                  onClick={resetOTP}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Use a different email
                </button>
              </>
            )}

            {/* Auth Buttons - Only show if not in OTP verify */}
            {otpStep === 'send' && (
              <>
                {/* Passkey Register */}
                <button
                  onClick={handlePasskeyRegister}
                  disabled={!email.trim() || !isReady || loadingAction !== null}
                  className={cn(
                    "w-full py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200",
                    "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "flex items-center justify-center gap-2"
                  )}
                >
                  {loadingAction === "passkey-register" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      Register with passkey
                    </>
                  )}
                </button>

                {/* Passkey Login */}
                <button
                  onClick={handlePasskeyLogin}
                  disabled={!email.trim() || !isReady || loadingAction !== null}
                  className={cn(
                    "w-full py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200",
                    "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "flex items-center justify-center gap-2"
                  )}
                >
                  {loadingAction === "passkey-login" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      Login with existing passkey
                    </>
                  )}
                </button>

                {/* Divider - Only show if not in OTP verify */}
                {otpStep === 'send' && (
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-4 bg-white text-gray-400 text-sm font-medium">OR</span>
                    </div>
                  </div>
                )}

                {/* Email Magic Link */}
                <button
                  onClick={handleEmailAuth}
                  disabled={!email.trim() || !isReady || loadingAction !== null}
                  className={cn(
                    "w-full py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200",
                    "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "flex items-center justify-center gap-2"
                  )}
                >
                  {loadingAction === "email" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Continue with email magic link
                    </>
                  )}
                </button>

                {/* Email OTP */}
                <button
                  onClick={handleOTPSend}
                  disabled={!email.trim() || !isReady || loadingAction !== null}
                  className={cn(
                    "w-full py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200",
                    "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "flex items-center justify-center gap-2"
                  )}
                >
                  {loadingAction === "otp-send" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Continue with email OTP code
                    </>
                  )}
                </button>
              </>
            )}

            {/* OTP Verify Button */}
            {otpStep === 'verify' && (
              <button
                onClick={handleOTPVerify}
                disabled={!otpCode.trim() || loadingAction !== null}
                className={cn(
                  "w-full py-3.5 px-4 rounded-lg font-semibold text-[15px] transition-all duration-200",
                  "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "flex items-center justify-center gap-2.5",
                  "shadow-sm hover:shadow"
                )}
              >
                {loadingAction === "otp-verify" ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify and continue
                  </>
                )}
              </button>
            )}

            {/* Divider - Only show if not in OTP verify */}
            {otpStep === 'send' && (
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-white text-gray-400 text-sm font-medium">OR</span>
                </div>
              </div>
            )}

            {/* OAuth - Only show if not in OTP verify */}
            {otpStep === 'send' && nonce && (
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleOAuthSuccess}
                  onError={() => setError("Google OAuth failed")}
                  nonce={nonce}
                  text="signin_with"
                  shape="rectangular"
                  theme="outline"
                  size="large"
                  width="100%"
                />
              </div>
            )}
          </div>

          {/* Error/Success Messages - Outside card, below */}
          {error && (
            <div className={cn(
              "mx-8 mb-6 px-4 py-3 rounded-lg text-sm text-center",
              error.includes("sent") || error.includes("Magic link")
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            )}>
              {error}
            </div>
          )}

          {/* SDK Status */}
          {!isReady && (
            <div className="mx-8 mb-6 flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
              <Info className="h-4 w-4 flex-shrink-0" />
              <span>
                SDK initializing... Visit <button onClick={() => router.push("/setup")} className="underline font-semibold">setup</button> first
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
