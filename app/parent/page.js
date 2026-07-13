"use client";

import { useState } from "react";
import Navbar from "../../components/Navbar";
import api from "../../components/api";

export default function ParentDashboard() {
    const [search, setSearch] = useState("101"); // Default to Adnan's Roll
    const [student, setStudent] = useState(null);
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState({ total: 0, present: 0, percentage: "0.0" });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSearch = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setStudent(null);
        setLoading(true);
        try {
            const data = await api.get(`/students/parent-view?search=${search}`);
            setStudent(data.student);
            setHistory(data.records);
            setStats({
                total: data.total,
                present: data.present,
                percentage: data.percentage
            });
            setSuccess("Student details and attendance logs loaded successfully!");
        } catch (err) {
            setError(err.message || "Failed to find student. Please verify the Roll number or Student ID.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
            <Navbar />

            <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-purple-600/5 blur-[120px] pointer-events-none"></div>

                {/* Header */}
                <div className="border-b border-zinc-800 pb-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent sm:text-3xl">
                        👪 অভিভাবক পোর্টাল (Parent Portal)
                    </h1>
                    <p className="text-xs text-zinc-400 mt-1">
                        আপনার সন্তানের রোল অথবা আইডি ব্যবহার করে তাদের দৈনিক হাজিরার স্থিতি যাচাই করুন
                    </p>
                </div>

                {/* Search Bar */}
                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl max-w-xl">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">সন্তানের রোল অথবা আইডি লিখুন</label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    required
                                    placeholder="যেমন: 101 অথবা STD101"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-blue-500 transition-all duration-200"
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl px-6 py-3 shadow-lg shadow-blue-500/10 transition-all duration-200 active:scale-98"
                                >
                                    {loading ? (
                                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        "অনুসন্ধান করুন"
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {error && (
                    <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm max-w-xl">
                        ⚠️ {error}
                    </div>
                )}
                {success && (
                    <div className="p-4 rounded-xl bg-green-950/40 border border-green-500/30 text-green-300 text-sm max-w-xl">
                        ✅ {success}
                    </div>
                )}

                {student && (
                    <div className="space-y-8 animate-fade-in">
                        {/* Student Details and Stats */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Profile details */}
                            <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-2xl shadow-lg shadow-blue-500/20">
                                        {student.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-zinc-100">{student.name}</h3>
                                        <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                            শিক্ষার্থী (Student)
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2.5 divide-y divide-zinc-850 text-xs text-zinc-400 pt-2">
                                    <div className="flex justify-between py-2">
                                        <span>শ্রেণী (Class):</span>
                                        <span className="font-bold text-zinc-200">Class {student.class}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span>শাখা (Section):</span>
                                        <span className="font-bold text-zinc-200">Section {student.section}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span>রোল নম্বর (Roll):</span>
                                        <span className="font-bold text-zinc-200">{student.roll}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span>শিক্ষার্থী আইডি (ID):</span>
                                        <span className="font-bold text-zinc-200 font-mono">{student.studentId}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Attendance statistics */}
                            <div className="lg:col-span-2 grid grid-cols-3 gap-6">
                                <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between backdrop-blur-xl">
                                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">মোট ক্লাস হাজিরা</span>
                                    <span className="text-3xl font-extrabold mt-2 text-white">{stats.total}</span>
                                </div>
                                <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between backdrop-blur-xl border-l-green-500/30">
                                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">উপস্থিত ক্লাস সংখ্যা</span>
                                    <span className="text-3xl font-extrabold mt-2 text-green-400">{stats.present}</span>
                                </div>
                                <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between backdrop-blur-xl border-l-blue-500/30">
                                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">হাজিরার শতকরা হার</span>
                                    <span className="text-3xl font-extrabold mt-2 text-blue-400">{stats.percentage}%</span>
                                </div>
                            </div>
                        </div>

                        {/* History Log */}
                        <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-6">
                            <h3 className="text-sm font-bold text-zinc-200">📅 হাজিরার দিনভিত্তিক রিপোর্ট</h3>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-zinc-400">
                                    <thead className="text-xs text-zinc-400 uppercase border-b border-zinc-850 bg-zinc-950/40">
                                        <tr>
                                            <th className="px-6 py-3">তারিখ</th>
                                            <th className="px-6 py-3">বিষয় (Subject)</th>
                                            <th className="px-6 py-3">চেক-ইন সময়</th>
                                            <th className="px-6 py-3">পদ্ধতি</th>
                                            <th className="px-6 py-3">স্ট্যাটাস</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-850">
                                        {history.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-8 text-center text-zinc-500 text-xs">
                                                    কোনো হাজিরা রেকর্ড পাওয়া যায়নি।
                                                </td>
                                            </tr>
                                        ) : (
                                            history.map((log) => (
                                                <tr key={log._id} className="hover:bg-zinc-900/10">
                                                    <td className="px-6 py-4 font-semibold text-zinc-200">{log.date}</td>
                                                    <td className="px-6 py-4">{log.subject}</td>
                                                    <td className="px-6 py-4">
                                                        {log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}
                                                    </td>
                                                    <td className="px-6 py-4 uppercase text-xs font-semibold">{log.method}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                            log.status === "present"
                                                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                                : log.status === "late"
                                                                ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                                                        }`}>
                                                            {log.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
