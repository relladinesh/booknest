import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "../../supa/Supabaseclient";

type AuthContextType = {
  session: any;
  signupNewUser: (email: string, password: string) => Promise<{ success: boolean; error?: any; data?: any }>;
  signOut: () => Promise<void>;
  SigninUser: ({ email, password }: { email: string; password: string }) => Promise<{ success: boolean; error?: any; data?: any }>;
  signInWithGoogle: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<any>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => {
      authListener.subscription?.unsubscribe();
    };
  }, []);

  const signupNewUser = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      // Return error for UI to handle
      return { success: false, error };
    } else {
      return { success: true, data };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
    }
  };

  const SigninUser = async ({ email, password }: { email: string; password: string }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        // Show user-friendly error for invalid credentials or missing fields
        if (
          error.message.toLowerCase().includes("invalid login credentials") ||
          error.status === 400
        ) {
          return { success: false, error: { message: "Invalid email or password. Please try again." } };
        }
        return { success: false, error };
      } else {
        return { success: true, data };
      }
    } catch (error: any) {
      return { success: false, error: { message: error.message || "Sign in failed." } };
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/dashboard" },
    });
    if (error) {
      console.error("Error with Google sign-in:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ session, signupNewUser, signOut, SigninUser, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthContextProvider");
  return context;
};