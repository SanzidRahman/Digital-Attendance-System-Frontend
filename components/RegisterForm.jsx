import { useState } from "react";
import { StudentFields } from "./StudentFields";
import { TeacherFields } from "./TeacherFields";

export const RegisterForm = ({ onSubmit, role, loading, error: serverError }) => {
    const [name, setName] = useState("");
    const [nameError, setNameError] = useState("");
    
    const [roll, setRoll] = useState("");
    
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const handleNameChange = (e) => {
        const val = e.target.value;
        setName(val);
        // Bengali Unicode range check: \u0980 to \u09FF
        if (/[\u0980-\u09FF]/.test(val)) {
            setNameError("ইংরেজিতে আপনার নাম লিখেন");
        } else {
            setNameError("");
        }
    };

    const handleRollChange = (val) => {
        // Allow only English digits
        const cleaned = val.replace(/[^0-9]/g, "");
        setRoll(cleaned);
    };

    const handleRollBlur = () => {
        if (roll) {
            // Auto prepend zeros to pad to 3 digits (e.g. 1 -> 001, 24 -> 024)
            setRoll(roll.padStart(3, "0"));
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        setPasswordError("");

        // Final checks
        if (/[\u0980-\u09FF]/.test(name)) {
            setNameError("ইংরেজিতে আপনার নাম লিখেন");
            return;
        }

        if (password !== confirmPassword) {
            setPasswordError("পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মেলেনি!");
            return;
        }

        // Proceed to submit (name, roll, etc. are captured via the native form elements on submit)
        onSubmit(e);
    };

    return (
        <form onSubmit={handleFormSubmit} className="space-y-6">
            {(serverError || passwordError) && (
                <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm flex items-center gap-3">
                    <span>⚠️</span>
                    <p>{serverError || passwordError}</p>
                </div>
            )}

            {/* Role-specific fields */}
            {role === "student" && (
                <StudentFields
                    name={name}
                    onNameChange={handleNameChange}
                    nameError={nameError}
                    roll={roll}
                    onRollChange={handleRollChange}
                    onRollBlur={handleRollBlur}
                />
            )}
            {role === "teacher" && (
                <TeacherFields
                    name={name}
                    onNameChange={handleNameChange}
                    nameError={nameError}
                />
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

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">পাসওয়ার্ড</label>
                    <input
                        type="password"
                        name="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-zinc-100 placeholder-zinc-600 transition-all duration-200"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">কনফার্ম পাসওয়ার্ড</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-zinc-100 placeholder-zinc-600 transition-all duration-200"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading || !!nameError}
                className="w-full py-3.5 px-4 rounded-xl text-sm font-semibold tracking-wide text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 flex justify-center items-center gap-2 border border-blue-500/20 active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
            >
                {loading ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    "নিবন্ধন করুন (Register)"
                )}
            </button>
        </form>
    );
};