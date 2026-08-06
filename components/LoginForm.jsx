import { useState } from "react";

export const LoginForm = ({ onSubmit, loading, error }) => {
    const [showForgotMsg, setShowForgotMsg] = useState(false);

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm flex items-center gap-3">
                    <span>⚠️</span>
                    <p>{error}</p>
                </div>
            )}

            {showForgotMsg && (
                <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 text-blue-300 text-xs flex items-start gap-3 animate-pulse">
                    <span>ℹ️</span>
                    <p>পাসওয়ার্ড রিসেট করার জন্য আপনার ডিপার্টমেন্ট কো-অর্ডিনেটর অথবা শ্রেণী শিক্ষকের সাথে সরাসরি যোগাযোগ করুন। (Contact coordinator to reset password)</p>
                </div>
            )}

            <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">ইমেইল এড্রেস</label>
                <input
                    type="email"
                    name="email"
                    required
                    placeholder="email@example.com"
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-zinc-100 placeholder-zinc-600 transition-all duration-200"
                />
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">পাসওয়ার্ড</label>
                    <button
                        type="button"
                        onClick={() => setShowForgotMsg(!showForgotMsg)}
                        className="text-xs text-blue-400 hover:text-blue-300 underline focus:outline-none"
                    >
                        পাসওয়ার্ড ভুলে গেছেন?
                    </button>
                </div>
                <input
                    type="password"
                    name="password"
                    required
                    placeholder="••••••••"
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-zinc-100 placeholder-zinc-600 transition-all duration-200"
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl text-sm font-semibold tracking-wide text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 flex justify-center items-center gap-2 border border-blue-500/20 active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
            >
                {loading ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    "লগইন করুন (Sign In)"
                )}
            </button>
        </form>
    );
};