"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const updateHeader = () => {
            const stored = localStorage.getItem("user");
            if (stored) {
                try {
                    setUser(JSON.parse(stored));
                } catch (e) {
                    setUser(null);
                }
            } else {
                setUser(null);
            }
        };

        updateHeader();
        window.addEventListener("storage", updateHeader);
        // Custom event for internal route changes
        window.addEventListener("auth-change", updateHeader);
        return () => {
            window.removeEventListener("storage", updateHeader);
            window.removeEventListener("auth-change", updateHeader);
        };
    }, []);

    const logout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUser(null);
        window.dispatchEvent(new Event("auth-change"));
        window.location.href = "/";
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-zinc-950/70 backdrop-blur-xl transition-all duration-300">
            <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-6 sm:px-8">
                {/* Brand */}
                <Link href="/" className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 font-bold text-white shadow-lg shadow-blue-500/20">
                        ডি
                    </span>
                    <span className="text-md font-bold bg-linear-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent sm:text-2xl">
                        ডিজিটাল Attendance
                    </span>
                </Link>

                {/* User Status / Actions */}
                {user ? (
                    <div className="flex items-center gap-4">
                        <div className="hidden flex-col items-end sm:flex">
                            <span className="text-sm font-semibold text-zinc-100">{user.name}</span>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                                {user.role}
                            </span>
                        </div>
                        <button
                            onClick={logout}
                            className="rounded-full bg-zinc-800 hover:bg-red-900/40 hover:text-red-300 px-4 py-1.5 text-xs font-semibold text-zinc-300 transition-all duration-200 border border-zinc-700 hover:border-red-500/30"
                        >
                            Log Out
                        </button>
                    </div>
                ) : (
                    <Link
                        href="/"
                        className="rounded-full bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-500/10 transition-all duration-200 hover:scale-105"
                    >
                        Sign In
                    </Link>
                )}
            </div>
        </header>
    );
}
