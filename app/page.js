'use client'
import { useState } from "react";
import Navbar from "../components/Navbar";
import api from "../components/api";
import { RoleSelector } from "@/components/RoleSelector";
import { RegisterForm } from "@/components/RegisterForm";
import { LoginForm } from "@/components/LoginForm";
import { ForgotPasswordForm, ResetPasswordForm } from "@/components/RecoveryForms";


// ---------- Main Home Component ----------
export default function Home() {
    const [role, setRole] = useState("student");
    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Recovery State
    const [recoveryStep, setRecoveryStep] = useState("login"); // "login", "forgot", "reset"
    const [recoveryEmail, setRecoveryEmail] = useState("");
    const [recoverySuccessMsg, setRecoverySuccessMsg] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setRecoverySuccessMsg("");
        setLoading(true);

        const formData = new FormData(e.target);
        const email = formData.get("email");
        const password = formData.get("password");

        try {
            const data = await api.post("/auth/login", { email, password });

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify({
                _id: data._id,
                name: data.name,
                email: data.email,
                role: data.role,
                campus: data.campus,
                profile: data.profile,
            }));

            window.dispatchEvent(new Event("auth-change"));

            // Redirect based on role
            const roleMap = {
                admin: "/admin",
                teacher: "/teacher",
                student: "/student",
                parent: "/parent",
            };
            window.location.href = roleMap[data.role] || "/";
        } catch (err) {
            setError(err.message || "Failed to log in. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        setRecoverySuccessMsg("");
        setLoading(true);

        const formData = new FormData(e.target);
        const payload = {
            name: formData.get("name"),
            email: formData.get("email"),
            password: formData.get("password"),
            role,
            campus: "Mymensingh Campus",
        };

        // Build profileData based on role
        if (role === "student") {
            payload.profileData = {
                roll: formData.get("roll"),
                class: formData.get("class"),
                year: formData.get("year"),
                section: formData.get("section"),
            };
        } else if (role === "teacher") {
            payload.profileData = {
                teacherId: `TCH-${Math.floor(100 + Math.random() * 900)}`,
                designation: formData.get("designation"),
                subject: formData.get("subject"),
            };
        }

        try {
            const data = await api.post("/auth/register", payload);

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify({
                _id: data._id,
                name: data.name,
                email: data.email,
                role: data.role,
                profile: data.profile,
            }));

            window.dispatchEvent(new Event("auth-change"));

            const roleMap = {
                admin: "/admin",
                teacher: "/teacher",
                student: "/student",
                parent: "/parent",
            };
            window.location.href = roleMap[data.role] || "/";
        } catch (err) {
            setError(err.message || "Failed to register account.");
        } finally {
            setLoading(false);
        }
    };

    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setError("");
        setRecoverySuccessMsg("");
        setLoading(true);

        const formData = new FormData(e.target);
        const email = formData.get("email");

        try {
            const data = await api.post("/auth/forgot-password", { email });
            setRecoveryEmail(email);
            setRecoverySuccessMsg(data.message || "OTP code sent to email successfully!");
            setRecoveryStep("reset");
        } catch (err) {
            setError(err.message || "Failed to request recovery code. Make sure email is registered.");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPasswordSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setRecoverySuccessMsg("");
        setLoading(true);

        const formData = new FormData(e.target);
        const email = formData.get("email");
        const otp = formData.get("otp");
        const newPassword = formData.get("newPassword");

        try {
            const data = await api.post("/auth/reset-password", { email, otp, newPassword });
            setRecoverySuccessMsg(data.message || "Password reset successfully! Log in now.");
            setRecoveryStep("login");
        } catch (err) {
            setError(err.message || "Failed to reset password. Please check your OTP code.");
        } finally {
            setLoading(false);
        }
    };

    const getHeaderTitle = () => {
        if (isRegister) return "নতুন অ্যাকাউন্ট তৈরি করুন";
        if (recoveryStep === "forgot") return "পাসওয়ার্ড রিকভারি করুন";
        if (recoveryStep === "reset") return "পাসওয়ার্ড রিসেট করুন";
        return "অ্যাটেনডেন্স পোর্টালে স্বাগতম";
    };

    const getHeaderSubtitle = () => {
        if (isRegister) return "আপনার তথ্য দিয়ে ফিলাপ করুন";
        if (recoveryStep === "forgot") return "OTP কোড পাওয়ার জন্য ইমেইল দিন";
        if (recoveryStep === "reset") return "OTP এবং নতুন পাসওয়ার্ড টাইপ করুন";
        return "আপনার আইডি এবং পাসওয়ার্ড দিয়ে প্রবেশ করুন";
    };

    return (
        <div className="min-h-screen flex flex-col bg-zinc-950 font-sans text-zinc-100">
            <Navbar />

            <main className="flex-1 flex items-center justify-center py-4 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black">
                {/* Background Blobs */}
                <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-600/10 blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none"></div>

                <div className="w-full max-w-md space-y-8 z-10">
                    <div className="text-center">
                        <h2 className="text-3xl py-2 font-extrabold tracking-tight bg-linear-to-r from-blue-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent sm:text-3xl">
                            {getHeaderTitle()}
                        </h2>
                        <p className="mt-2 text-sm text-zinc-400">
                            {getHeaderSubtitle()}
                        </p>
                    </div>

                    {recoveryStep === "login" && (
                        <RoleSelector
                            role={role}
                            setRole={setRole}
                            isRegister={isRegister}
                            setIsRegister={setIsRegister}
                        />
                    )}

                    {recoverySuccessMsg && (
                        <div className="mb-6 p-4 rounded-xl bg-green-950/40 border border-green-500/30 text-green-300 text-sm flex items-center gap-3">
                            <span>✅</span>
                            <p>{recoverySuccessMsg}</p>
                        </div>
                    )}

                    <div className="bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-2xl rounded-2xl p-8 shadow-2xl shadow-black/40">
                        {isRegister ? (
                            <RegisterForm onSubmit={handleRegister} role={role} loading={loading} error={error} />
                        ) : recoveryStep === "forgot" ? (
                            <ForgotPasswordForm 
                                onSubmitEmail={handleRequestOTP} 
                                onBackToLogin={() => { setRecoveryStep("login"); setError(""); }} 
                                loading={loading} 
                                error={error} 
                            />
                        ) : recoveryStep === "reset" ? (
                            <ResetPasswordForm 
                                onSubmitReset={handleResetPasswordSubmit} 
                                email={recoveryEmail} 
                                onBackToLogin={() => { setRecoveryStep("login"); setError(""); }} 
                                loading={loading} 
                                error={error} 
                            />
                        ) : (
                            <LoginForm 
                                onSubmit={handleLogin} 
                                onForgotPassword={() => { setRecoveryStep("forgot"); setError(""); setRecoverySuccessMsg(""); }} 
                                loading={loading} 
                                error={error} 
                            />
                        )}

                        {/* Toggle between login and register (only for student/teacher in login view) */}
                        {!isRegister && recoveryStep === "login" && role !== "parent" && role !== "admin" && (
                            <div className="mt-6 text-center text-xs">
                                <span className="text-zinc-500">নতুন অ্যাকাউন্ট প্রয়োজন?</span>{" "}
                                <button
                                    type="button"
                                    onClick={() => setIsRegister(true)}
                                    className="text-blue-400 hover:text-blue-300 font-semibold focus:outline-none underline underline-offset-4"
                                >
                                    রেজিস্টার করুন
                                </button>
                            </div>
                        )}

                        {isRegister && (
                            <div className="mt-6 text-center text-xs">
                                <span className="text-zinc-500">ইতিমধ্যে অ্যাকাউন্ট আছে?</span>{" "}
                                <button
                                    type="button"
                                    onClick={() => setIsRegister(false)}
                                    className="text-blue-400 hover:text-blue-300 font-semibold focus:outline-none underline underline-offset-4"
                                >
                                    লগইন করুন
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
