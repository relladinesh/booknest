import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";

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

const TOASTER_TOAST_OPTIONS = {
  style: {
    borderRadius: '8px',
    padding: '16px',
    fontSize: '1rem',
    fontWeight: 500,
    minWidth: '270px'
  },
  success: {
    style: {
      background: '#21ba45',
      color: '#fff',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#21ba45',
    },
  },
  error: {
    style: {
      background: '#ff4d4f',
      color: '#fff',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#ff4d4f',
    },
  },
  info: {
    style: {
      background: '#f4f4f4',
      color: '#333',
    },
    iconTheme: {
      primary: '#333',
      secondary: '#f4f4f4',
    },
  },
  loading: {
    style: {
      background: '#ffca28',
      color: '#222',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#ffca28',
    },
  },
};

const Signin: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const { session, SigninUser, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if session is available and user is in users table
    const checkProfile = async () => {
      if (session?.user?.email) {
        // @ts-expect-error: supabase is attached to window at runtime
        const { data } = await window.supabase
          .from("users")
          .select("id")
          .eq("email", session.user.email)
          .single();
        if (data && data.id) {
          navigate("/dashboard");
        }
      }
    };
    checkProfile();
    // eslint-disable-next-line
  }, [session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!email || !password) {
        toast.error("Please enter both email and password.");
        setLoading(false);
        return;
      }
      const result = await SigninUser({ email, password });
      if (result && result.success) {
        toast.success("Signed in successfully!");
        // session will update, useEffect will handle redirect if user is in users table
      } else {
        toast.error(
          result && result.error && result.error.message
            ? result.error.message
            : "Failed to sign in."
        );
      }
    } catch (error: any) {
      toast.error(error?.message || "Sign in error.");
      console.error("Sign in error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      // session will update, useEffect will handle redirect if user is in users table
    } catch (error: any) {
      toast.error("Google sign-in failed.");
      console.error("Google sign-in error:", error);
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
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={TOASTER_TOAST_OPTIONS}
      />
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
                <path d="M8 16v2a2 2 0 002 2h4a2 2 0 002-2v-2M16 12V8a4 4 0 10-8 0v4m12 0a8 8 0 11-16 0 8 8 0 0116 0z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>
          <h2 className="text-3xl font-extrabold" style={{ color: PALETTE.primary }}>Sign In</h2>
          <p className="mt-1 text-sm" style={{ color: PALETTE.textMuted }}>Sign in to your BookNest account</p>
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
          <div className="mb-6">
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
                autoComplete="current-password"
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
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded font-semibold text-lg shadow transition disabled:opacity-70 disabled:cursor-not-allowed"
            style={{
              background: loading ? PALETTE.primaryLight : `linear-gradient(90deg,${PALETTE.primary},${PALETTE.primaryLight})`,
              color: "#fff"
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div className="w-full flex items-center my-4">
          <div className="flex-1 h-px" style={{ background: PALETTE.cardBorder }}></div>
          <span className="mx-2 text-sm" style={{ color: PALETTE.primaryLight }}>or</span>
          <div className="flex-1 h-px" style={{ background: PALETTE.cardBorder }}></div>
        </div>
        <button
          type="button"
          onClick={handleGoogleSignin}
          disabled={loading}
          className="w-full flex items-center justify-center py-2 rounded font-semibold text-lg border shadow transition disabled:opacity-70"
          style={{
            background: PALETTE.buttonGoogle,
            color: PALETTE.buttonGoogleText,
            borderColor: PALETTE.primaryLight
          }}
        >
          <svg className="h-6 w-6 mr-2" viewBox="0 0 48 48">
            <g>
              <path
                d="M44.5 20H24v8.5h11.7C34.7 32.8 30.1 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.8 0 5.4.9 7.5 2.6l6.3-6.3C34.6 6.2 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10.6 0 19.5-7.7 19.5-20 0-1.3-.1-2.7-.3-4z"
                fill="#FFC107"
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
          Sign in with Google
        </button>
        <div className="mt-6 text-sm text-center">
          <span style={{ color: PALETTE.textMain }}>Don't have an account?</span>{" "}
          <Link className="hover:underline font-semibold" style={{ color: PALETTE.primary }} to="/Signup">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signin;
