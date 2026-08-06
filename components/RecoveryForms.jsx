import { useState } from "react";

export const ForgotPasswordForm = ({ onSubmitEmail, onBackToLogin, loading, error }) => {
    return (
        <form onSubmit={onSubmitEmail} className="space-y-6">
            {error && (
                <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm flex items-center gap-3">
                    <span>⚠️</span>
                    <p>{error}</p>
                </div>
            )}

            <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">আপনার ইমেইল এড্রেস</label>
                <input
                    type="email"
                    name="email"
                    required
                    placeholder="email@example.com"
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-zinc-100 placeholder-zinc-600 transition-all duration-200"
                />
                <p className="text-[10px] text-zinc-500">আপনার অ্যাকাউন্টের রেজিস্টার্ড ইমেইলটি দিন। আমরা এই ইমেইলে একটি ৬-সংখ্যার OTP কোড পাঠাবো।</p>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl text-sm font-semibold tracking-wide text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 flex justify-center items-center gap-2 border border-blue-500/20 active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
            >
                {loading ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    "OTP পাঠান (Send Reset Code)"
                )}
            </button>

            <div className="text-center text-xs">
                <button
                    type="button"
                    onClick={onBackToLogin}
                    className="text-blue-400 hover:text-blue-300 font-semibold focus:outline-none underline underline-offset-4"
                >
                    লগইন পেজে ফিরে যান (Back to Login)
                </button>
            </div>
        </form>
    );
};

export const ResetPasswordForm = ({ onSubmitReset, email, onBackToLogin, loading, error }) => {
    return (
        <form onSubmit={onSubmitReset} className="space-y-6">
            {error && (
                <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm flex items-center gap-3">
                    <span>⚠️</span>
                    <p>{error}</p>
                </div>
            )}

            <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">ইমেইল এড্রেস</label>
                <input
                    type="email"
                    name="email"
                    required
                    defaultValue={email}
                    placeholder="email@example.com"
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-zinc-100 placeholder-zinc-650 transition-all duration-200"
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">৬-সংখ্যার OTP কোড</label>
                <input
                    type="text"
                    name="otp"
                    required
                    maxLength="6"
                    placeholder="123456"
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-zinc-100 placeholder-zinc-600 tracking-widest text-center font-mono font-bold transition-all duration-200"
                />
                <p className="text-[10px] text-zinc-500">আপনার ইমেইলে পাঠানো OTP কোডটি এখানে দিন (ডেভেলপমেন্ট মোডে এটি ব্যাকএন্ড টার্মিনালেও লগ করা হয়েছে)।</p>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">নতুন পাসওয়ার্ড</label>
                <input
                    type="password"
                    name="newPassword"
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
                    "পাসওয়ার্ড রিসেট করুন (Reset Password)"
                )}
            </button>

            <div className="text-center text-xs">
                <button
                    type="button"
                    onClick={onBackToLogin}
                    className="text-blue-400 hover:text-blue-300 font-semibold focus:outline-none underline underline-offset-4"
                >
                    লগইন পেজে ফিরে যান (Back to Login)
                </button>
            </div>
        </form>
    );
};
