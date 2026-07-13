"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../components/api";

const PRESETS = {
    admin: { email: "admin@school.com", password: "admin123" },
    teacher: { email: "teacher@school.com", password: "teacher123" },
    student: { email: "adnan@school.com", password: "student123" },
    parent: { email: "parent@school.com", password: "parent123" }
};

export default function Home() {
    const [role, setRole] = useState("student");
    const [email, setEmail] = useState(PRESETS.student.email);
    const [password, setPassword] = useState(PRESETS.student.password);
    const [isRegister, setIsRegister] = useState(false);

    // Register specific states
    const [name, setName] = useState("");
    const [studentId, setStudentId] = useState("");
    const [roll, setRoll] = useState("");
    const [cls, setCls] = useState("10");
    const [section, setSection] = useState("A");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Update form when role tab changes
    useEffect(() => {
        if (!isRegister && PRESETS[role]) {
            setEmail(PRESETS[role].email);
            setPassword(PRESETS[role].password);
        }
        setError("");
    }, [role, isRegister]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const data = await api.post("/auth/login", { email, password });

            // Save state
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify({
                _id: data._id,
                name: data.name,
                email: data.email,
                role: data.role,
                campus: data.campus,
                profile: data.profile
            }));

            // Dispatch login event for navbar update
            window.dispatchEvent(new Event("auth-change"));

            // Redirect based on role
            if (data.role === "admin") window.location.href = "/admin";
            else if (data.role === "teacher") window.location.href = "/teacher";
            else if (data.role === "student") window.location.href = "/student";
            else if (data.role === "parent") {
                // Parents portal
                window.location.href = "/parent";
            }
        } catch (err) {
            setError(err.message || "Failed to log in. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const payload = {
                name,
                email,
                password,
                role,
                campus: "Dhaka Campus"
            };

            // Include role profile data
            if (role === "student") {
                payload.profileData = {
                    studentId,
                    roll,
                    class: cls,
                    section,
                    guardianContact: {
                        phone: "+8801700000000",
                        email: "guardian@test.com"
                    }
                };
            } else if (role === "teacher") {
                payload.profileData = {
                    teacherId: `TCH-${Math.floor(100 + Math.random() * 900)}`,
                    designation: "Lecturer",
                    subject: ["Mathematics"]
                };
            }

            const data = await api.post("/auth/register", payload);

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify({
                _id: data._id,
                name: data.name,
                email: data.email,
                role: data.role,
                profile: data.profile
            }));

            window.dispatchEvent(new Event("auth-change"));

            if (data.role === "admin") window.location.href = "/admin";
            else if (data.role === "teacher") window.location.href = "/teacher";
            else if (data.role === "student") window.location.href = "/student";
            else if (data.role === "parent") window.location.href = "/parent";
        } catch (err) {
            setError(err.message || "Failed to register account.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-zinc-950 font-sans text-zinc-100">
            <Navbar />

            <main className="flex-1 flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black">
                {/* Background Blobs */}
                <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-600/10 blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none"></div>

                <div className="w-full max-w-md space-y-8 z-10">
                    <div className="text-center">
                        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent sm:text-4xl">
                            {isRegister ? "নতুন অ্যাকাউন্ট তৈরি করুন" : "অ্যাটেনডেন্স পোর্টালে স্বাগতম"}
                        </h2>
                        <p className="mt-2 text-sm text-zinc-400">
                            {isRegister ? "আপনার তথ্য দিয়ে ফিলাপ করুন" : "আপনার আইডি এবং পাসওয়ার্ড দিয়ে প্রবেশ করুন"}
                        </p>
                    </div>

                    {/* Role Selector */}
                    <div className="flex rounded-lg bg-zinc-900/60 p-1 border border-zinc-800 backdrop-blur-md">
                        {["student", "teacher", "parent", "admin"].map((r) => (
                            <button
                                key={r}
                                onClick={() => {
                                    setRole(r);
                                    if (isRegister && r === "parent") {
                                        // Parent can sign up but needs custom flows, block registration for demo parent
                                        setIsRegister(false);
                                    }
                                }}
                                className={`flex-1 rounded-md py-1.5 text-xs font-semibold capitalize tracking-wide transition-all duration-300 ${role === r
                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20"
                                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                                    }`}
                            >
                                {r === "student" ? "ছাত্র" : r === "teacher" ? "শিক্ষক" : r === "parent" ? "অভিভাবক" : "এডমিন"}
                            </button>
                        ))}
                    </div>

                    <div className="bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-2xl rounded-2xl p-8 shadow-2xl shadow-black/40">
                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm flex items-center gap-3">
                                <span>⚠️</span>
                                <p>{error}</p>
                            </div>
                        )}

                        <form className="space-y-6" onSubmit={isRegister ? handleRegister : handleLogin}>
                            {isRegister && (
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">পূর্ণ নাম</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="আপনার নাম লিখুন"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-zinc-100 placeholder-zinc-600 transition-all duration-200"
                                    />
                                </div>
                            )}

                            {isRegister && role === "student" && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">স্টুডেন্ট আইডি</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="STD101"
                                            value={studentId}
                                            onChange={(e) => setStudentId(e.target.value)}
                                            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-zinc-100 placeholder-zinc-600 transition-all duration-200"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">রোল নম্বর</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="101"
                                            value={roll}
                                            onChange={(e) => setRoll(e.target.value)}
                                            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-zinc-100 placeholder-zinc-600 transition-all duration-200"
                                        />
                                    </div>
                                </div>
                            )}

                            {isRegister && role === "student" && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">শ্রেণী (Class)</label>
                                        <select
                                            value={cls}
                                            onChange={(e) => setCls(e.target.value)}
                                            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-zinc-100 placeholder-zinc-600 transition-all duration-200"
                                        >
                                            <option value="8">Class 8</option>
                                            <option value="9">Class 9</option>
                                            <option value="10">Class 10</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">শাখা (Section)</label>
                                        <select
                                            value={section}
                                            onChange={(e) => setSection(e.target.value)}
                                            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-zinc-100 placeholder-zinc-600 transition-all duration-200"
                                        >
                                            <option value="A">Section A</option>
                                            <option value="B">Section B</option>
                                            <option value="C">Section C</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">ইমেইল এড্রেস</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="email@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-zinc-100 placeholder-zinc-600 transition-all duration-200"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">পাসওয়ার্ড</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
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
                                ) : isRegister ? (
                                    "নিবন্ধন করুন (Register)"
                                ) : (
                                    "লগইন করুন (Sign In)"
                                )}
                            </button>
                        </form>

                        {/* Toggle Registration (Only for Student and Teacher) */}
                        {role !== "parent" && role !== "admin" && (
                            <div className="mt-6 text-center text-xs">
                                <span className="text-zinc-500">
                                    {isRegister ? "ইতিমধ্যে অ্যাকাউন্ট আছে?" : "নতুন অ্যাকাউন্ট প্রয়োজন?"}
                                </span>{" "}
                                <button
                                    onClick={() => setIsRegister(!isRegister)}
                                    className="text-blue-400 hover:text-blue-300 font-semibold focus:outline-none underline underline-offset-4"
                                >
                                    {isRegister ? "লগইন করুন" : "রেজিস্টার করুন"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
