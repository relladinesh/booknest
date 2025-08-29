import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";

const PALETTE = {
  primary: "#6D28D9",         // Violet
  primaryLight: "#B7A1E2",    // Light Violet
  accent: "#FFC107",          // Amber (Google button)
  background: "#F3F6FF",      // Page background
  cardBg: "#FFFFFFE6",        // Card background
  cardBorder: "#E5E7EB",      // Light border
  textMain: "#232946",        // Main text
  textMuted: "#78716C",       // Muted
  buttonGoogle: "#FFFDEB",    // Google button bg
  buttonGoogleText: "#232946" // Google button text
};

const Signup: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const { session, signupNewUser, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      toast.success("Signup successful!", {
        style: {
          border: `1px solid ${PALETTE.primary}`,
          color: PALETTE.primary,
          fontWeight: 600,
          padding: '16px'
        },
        iconTheme: {
          primary: PALETTE.primary,
          secondary: '#fff',
        },
      });
      navigate("/dashboard");
    }
  }, [session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.", {
        style: {
          border: '1px solid #B91C1C',
          color: '#B91C1C',
          fontWeight: 600,
        },
        iconTheme: {
          primary: '#B91C1C',
          secondary: '#FFF',
        },
      });
      return;
    }
    setLoading(true);
    try {
      const result = await signupNewUser(email, password);
      if (result && result.success) {
        toast.success("Signup successful!", {
          style: {
            border: `1px solid ${PALETTE.primary}`,
            color: PALETTE.primary,
            fontWeight: 600,
            padding: '16px'
          },
          iconTheme: {
            primary: PALETTE.primary,
            secondary: '#fff',
          },
        });
        navigate("/dashboard");
      } else if (result && result.error) {
        toast.error(result.error.message || "Signup failed.", {
          style: {
            border: '1px solid #B91C1C',
            color: '#B91C1C',
            fontWeight: 600,
          },
          iconTheme: {
            primary: '#B91C1C',
            secondary: '#FFF',
          },
        });
      }
    } catch (error) {
      toast.error("Error signing up. Please try again.", {
        style: {
          border: '1px solid #B91C1C',
          color: '#B91C1C',
          fontWeight: 600,
        },
        iconTheme: {
          primary: '#B91C1C',
          secondary: '#FFF',
        },
      });
      console.error("Sign up error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    } catch (error) {
      toast.error("Google sign-up failed. Please try again.", {
        style: {
          border: '1px solid #B91C1C',
          color: '#B91C1C',
          fontWeight: 600,
        },
        iconTheme: {
          primary: '#B91C1C',
          secondary: '#FFF',
        },
      });
      console.error("Google sign-up error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{
        background: `linear-gradient(100deg, #E9EAFE 0%, ${PALETTE.background} 60%, ${PALETTE.buttonGoogle} 100%)`
      }}
    >
      <div
        className="w-full max-w-md p-8 rounded-2xl shadow-2xl flex flex-col items-center"
        style={{
          background: PALETTE.cardBg,
          border: `1px solid ${PALETTE.cardBorder}`
        }}
      >
        <div className="mb-6 text-center">
          <div className="flex justify-center mb-2">
            <span
              className="inline-flex items-center justify-center w-16 h-16 rounded-full shadow"
              style={{ background: "#E9EAFE" }}
            >
              <svg className="w-10 h-10" fill="none" stroke={PALETTE.primary} strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 4.5c-7.073 0-11 6.5-11 6.5s3.927 6.5 11 6.5 11-6.5 11-6.5-3.927-6.5-11-6.5z" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>
          <h2 className="text-3xl font-extrabold" style={{ color: PALETTE.primary }}>Sign Up</h2>
          <p className="mt-1 text-sm" style={{ color: PALETTE.textMuted }}>Create your Book Sharing account</p>
        </div>
        <form className="w-full" onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1 font-medium" style={{ color: PALETTE.textMain }}>Email</label>
            <input
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 transition"
              style={{
                borderColor: PALETTE.primaryLight,
                background: PALETTE.background,
                color: PALETTE.textMain,
                outline: "none"
              }}
              type="email"
              placeholder="Your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium" style={{ color: PALETTE.textMain }}>Password</label>
            <div className="relative">
              <input
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 transition"
                style={{
                  borderColor: PALETTE.primaryLight,
                  background: PALETTE.background,
                  color: PALETTE.textMain,
                  outline: "none"
                }}
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center px-3"
                style={{ color: PALETTE.textMuted }}
                onClick={() => setShowPassword(v => !v)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke={PALETTE.primary} strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.364.268-2.668.758-3.825M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.243-2.243A9.969 9.969 0 0022 9c0 5.523-4.477 10-10 10-1.364 0-2.668-.268-3.825-.758" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke={PALETTE.primaryLight} strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 4.5c-7.073 0-11 6.5-11 6.5s3.927 6.5 11 6.5 11-6.5 11-6.5-3.927-6.5-11-6.5z" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div className="mb-6">
            <label className="block mb-1 font-medium" style={{ color: PALETTE.textMain }}>Confirm Password</label>
            <div className="relative">
              <input
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 transition"
                style={{
                  borderColor: PALETTE.primaryLight,
                  background: PALETTE.background,
                  color: PALETTE.textMain,
                  outline: "none"
                }}
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center px-3"
                style={{ color: PALETTE.textMuted }}
                onClick={() => setShowConfirmPassword(v => !v)}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke={PALETTE.primary} strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.364.268-2.668.758-3.825M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.243-2.243A9.969 9.969 0 0022 9c0 5.523-4.477 10-10 10-1.364 0-2.668-.268-3.825-.758" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke={PALETTE.primaryLight} strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 4.5c-7.073 0-11 6.5-11 6.5s3.927 6.5 11 6.5 11-6.5 11-6.5-3.927-6.5-11-6.5z" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded font-semibold text-lg shadow transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            style={{
              background: loading ? PALETTE.primaryLight : `linear-gradient(90deg,${PALETTE.primary},${PALETTE.primaryLight})`,
              color: "#fff"
            }}
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null}
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>
        <div className="w-full flex items-center my-4">
          <div className="flex-1 h-px" style={{ background: PALETTE.cardBorder }}></div>
          <span className="mx-2 text-sm" style={{ color: PALETTE.primaryLight }}>or</span>
          <div className="flex-1 h-px" style={{ background: PALETTE.cardBorder }}></div>
        </div>
        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={loading}
          className="w-full flex items-center justify-center py-2 rounded font-semibold text-lg border shadow transition disabled:opacity-70"
          style={{
            background: PALETTE.buttonGoogle,
            color: PALETTE.buttonGoogleText,
            borderColor: PALETTE.primaryLight
          }}
        >
          {loading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : (
            <svg className="h-6 w-6 mr-2" viewBox="0 0 48 48">
              <g>
                <path
                  d="M44.5 20H24v8.5h11.7C34.7 32.8 30.1 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.8 0 5.4.9 7.5 2.6l6.3-6.3C34.6 6.2 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10.6 0 19.5-7.7 19.5-20 0-1.3-.1-2.7-.3-4z"
                  fill={PALETTE.accent}
                />
                <path
                  d="M6.3 14.7l6.9 5.1C15.7 16.1 19.6 13 24 13c2.8 0 5.4.9 7.5 2.6l6.3-6.3C34.6 6.2 29.6 4 24 4c-7.2 0-13.4 3.8-17 9.7z"
                  fill="#FF3D00"
                />
                <path
                  d="M24 44c5.5 0 10.5-1.8 14.2-5l-6.5-5.3C29.5 35.7 26.9 36.5 24 36.5c-6.1 0-10.8-4-12.6-9.5l-6.9 5.3C6.5 41.6 14.7 44 24 44z"
                  fill="#4CAF50"
                />
                <path
                  d="M44.5 20H24v8.5h11.7c-1.2 3.2-3.8 5.9-7.2 7.2l6.5 5.3C41.9 37 44.5 30.6 44.5 24c0-1.3-.1-2.7-.3-4z"
                  fill="#1976D2"
                />
              </g>
            </svg>
          )}
          {loading ? "Signing up..." : "Sign up with Google"}
        </button>
        <div className="mt-6 text-sm text-center">
          <span style={{ color: PALETTE.textMain }}>Already have an account?</span>{" "}
          <Link className="hover:underline font-semibold" style={{ color: PALETTE.primary }} to="/">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;