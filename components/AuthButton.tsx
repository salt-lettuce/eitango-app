"use client";

import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export default function AuthButton() {
  const [email, setEmail] = useState<string | null | undefined>(
    isSupabaseConfigured() ? undefined : null
  );

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured() || email === undefined) return null;

  const handleLogin = () => {
    supabase?.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  const handleLogout = () => {
    supabase?.auth.signOut();
  };

  if (!email) {
    return (
      <button
        onClick={handleLogin}
        className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
      >
        Googleでログイン
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
      <span className="truncate max-w-[10rem]">{email}</span>
      <button
        onClick={handleLogout}
        className="px-3 py-1.5 rounded-full font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
      >
        ログアウト
      </button>
    </div>
  );
}
