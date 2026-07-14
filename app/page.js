'use client'
import { useState } from "react";
import Navbar from "../components/Navbar";
import api from "../components/api";
import { RoleSelector } from "@/components/RoleSelector";
import { RegisterForm } from "@/components/RegisterForm";
import { LoginForm } from "@/components/LoginForm";


// ---------- Main Home Component ----------
export default function Home() {
    const [role, setRole] = useState("student");
    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
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
        setLoading(true);

        const formData = new FormData(e.target);
        const payload = {
            name: formData.get("name"),
            email: formData.get("email"),
            password: formData.get("password"),
            role,
            campus: "Dhaka Campus", // or make it a field
        };

        // Build profileData based on role
        if (role === "student") {
            payload.profileData = {
                studentId: formData.get("studentId"),
                roll: formData.get("roll"),
                class: formData.get("class"),
                section: formData.get("section"),
                guardianContact: {
                    phone: "+8801700000000", // could be made a field
                    email: "guardian@test.com",
                },
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

    return (
        <div className="min-h-screen flex flex-col bg-zinc-950 font-sans text-zinc-100">
            <Navbar />

            <main className="flex-1 flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black">
                {/* Background Blobs */}
                <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-600/10 blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none"></div>

                <div className="w-full max-w-md space-y-8 z-10">
                    <div className="text-center">
                        <h2 className="text-3xl font-extrabold tracking-tight bg-linear-to-r from-blue-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent sm:text-4xl">
                            {isRegister ? "নতুন অ্যাকাউন্ট তৈরি করুন" : "অ্যাটেনডেন্স পোর্টালে স্বাগতম"}
                        </h2>
                        <p className="mt-2 text-sm text-zinc-400">
                            {isRegister ? "আপনার তথ্য দিয়ে ফিলাপ করুন" : "আপনার আইডি এবং পাসওয়ার্ড দিয়ে প্রবেশ করুন"}
                        </p>
                    </div>

                    <RoleSelector
                        role={role}
                        setRole={setRole}
                        isRegister={isRegister}
                        setIsRegister={setIsRegister}
                    />

                    <div className="bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-2xl rounded-2xl p-8 shadow-2xl shadow-black/40">
                        {isRegister ? (
                            <RegisterForm onSubmit={handleRegister} role={role} loading={loading} error={error} />
                        ) : (
                            <LoginForm onSubmit={handleLogin} loading={loading} error={error} />
                        )}

                        {/* Toggle between login and register (only for student/teacher) */}
                        {role !== "parent" && role !== "admin" && (
                            <div className="mt-6 text-center text-xs">
                                <span className="text-zinc-500">
                                    {isRegister ? "ইতিমধ্যে অ্যাকাউন্ট আছে?" : "নতুন অ্যাকাউন্ট প্রয়োজন?"}
                                </span>{" "}
                                <button
                                    type="button"
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