"use client";

import { useState } from "react";
import { useDoorwayProvider } from "../hooks/useDoorwayProvider";

type OTPStep = 'register' | 'login';

export function OTPAuthTest() {
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<OTPStep>('register');
  const [loading, setLoading] = useState(false);
  const [registrationData, setRegistrationData] = useState<{
    otpId: string;
    subOrganizationId: string;
    userId: string;
    walletAddress: string;
  } | null>(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState<string>("");

  const { isLoading, error: sdkError, isReady, auth } = useDoorwayProvider();

  const handleRegister = async () => {
    if (!isReady) {
      setError("Doorway SDK not ready. Please ensure you have selected an app first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await auth({
        type: "otp",
        mode: "register",
        email,
        contact: {
          type: "email",
          contact: email
        }
      });

      console.log("Registration data:", data);
      setRegistrationData(data);
      setStep('login');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!isReady || !registrationData) {
      setError("Please complete registration first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await auth({
        type: "otp",
        mode: "login",
        otpId: registrationData.otpId,
        otpCode: otpCode,
        subOrganizationId: registrationData.subOrganizationId
      });

      console.log("Login data:", data);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('register');
    setEmail("");
    setOtpCode("");
    setRegistrationData(null);
    setResult(null);
    setError("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          OTP Authentication Test
        </h2>
        <p className="text-gray-600 mb-6">
          Test the OTP (One-Time Password) authentication flow. This will send an OTP code to your email for verification.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center space-x-4 mb-6">
        <div className={`flex items-center space-x-2 ${step === 'register' ? 'text-blue-600' : 'text-green-600'}`}>
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
            step === 'register' ? 'border-blue-600 bg-blue-50' : 'border-green-600 bg-green-50'
          }`}>
            {step === 'login' ? '✓' : '1'}
          </div>
          <span className="font-medium">Register</span>
        </div>
        <div className="flex-1 h-0.5 bg-gray-300"></div>
        <div className={`flex items-center space-x-2 ${step === 'login' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
            step === 'login' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 bg-gray-50'
          }`}>
            2
          </div>
          <span className="font-medium">Verify OTP</span>
        </div>
      </div>

      {/* SDK Status Display */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-center text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            <span className="text-blue-700">Initializing Doorway SDK...</span>
          </div>
        </div>
      )}

      {sdkError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-center text-sm">
            <svg className="h-4 w-4 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-700">SDK Error: {sdkError}</span>
          </div>
        </div>
      )}

      {isReady && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <div className="flex items-center text-sm">
            <svg className="h-4 w-4 text-green-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-700">Doorway SDK ready for authentication</span>
          </div>
        </div>
      )}

      {!isLoading && !isReady && !sdkError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex items-center text-sm">
            <svg className="h-4 w-4 text-yellow-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-yellow-700">
              Please select an app from the App Management tab first
            </span>
          </div>
        </div>
      )}

      {/* Step 1: Register */}
      {step === 'register' && (
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              placeholder="user@example.com"
            />
          </div>

          <button
            onClick={handleRegister}
            disabled={loading || !isReady || !email.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Sending OTP..."
              : !isReady
              ? "SDK Not Ready"
              : "Send OTP Code"}
          </button>
        </div>
      )}

      {/* Step 2: Login with OTP */}
      {step === 'login' && (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center text-sm">
              <svg className="h-5 w-5 text-blue-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <span className="text-blue-700">
                OTP code has been sent to <strong>{email}</strong>. Please check your email.
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="otpCode"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              OTP Code
            </label>
            <input
              type="text"
              id="otpCode"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 font-mono text-lg tracking-wider text-center"
              placeholder="000000"
              maxLength={9}
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleLogin}
              disabled={loading || !otpCode.trim()}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              onClick={handleReset}
              disabled={loading}
              className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Success Result Display */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                {step === 'register' ? 'Registration Successful' : 'Authentication Successful'}
              </h3>
              <div className="mt-2">
                <pre className="text-sm text-green-700 whitespace-pre-wrap">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">How it works</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ol className="list-decimal list-inside space-y-1">
                <li>Enter your email address and click &quot;Send OTP Code&quot;</li>
                <li>Check your email inbox for the OTP code (6-digit number)</li>
                <li>Enter the OTP code and click &quot;Verify OTP&quot; to complete authentication</li>
                <li>Once verified, you&apos;ll receive a session token for authenticated requests</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
