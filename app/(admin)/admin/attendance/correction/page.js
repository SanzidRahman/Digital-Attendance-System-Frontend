"use client";

import { useState } from "react";
import api from "@/components/api";

export default function AttendanceCorrection() {
    const [updateClass, setUpdateClass] = useState("BEd-2026");
    const [updateSection, setUpdateSection] = useState("All");
    const [updateSubject, setUpdateSubject] = useState("অ্যাডভান্স আইসিটি");
    const [updateFromDate, setUpdateFromDate] = useState(new Date().toISOString().slice(0, 10));
    const [updateToDate, setUpdateToDate] = useState(new Date().toISOString().slice(0, 10));
    const [updateRecords, setUpdateRecords] = useState([]);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const subjects = [
        "অ্যাডভান্স আইসিটি",
        "মাধ্যমিক শিক্ষা",
        "সক্রিয় শিখন পদ্ধতি ও কৌশল",
        "শিখন ও শিখনযাচাই",
        "শিক্ষায় তথ্য ও যোগাযোগ পদ্ধতি"
    ];

    const handleSearchUpdateRecords = async () => {
        setUpdateLoading(true);
        setError("");
        setSuccess("");
        try {
            const res = await api.get(
                `/attendance/daily-report?class=${updateClass}&section=${updateSection}&subject=${encodeURIComponent(updateSubject)}&from=${updateFromDate}&to=${updateToDate}`
            );
            setUpdateRecords(res.records || []);
            if ((res.records || []).length === 0) {
                setSuccess("কোনো হাজিরা রেকর্ড পাওয়া যায়নি।");
            }
        } catch (err) {
            setError(err.message || "হাজিরা রেকর্ড লোড করতে ব্যর্থ হয়েছে।");
        } finally {
            setUpdateLoading(false);
        }
    };

    const handleRecordStatusChange = async (recordId, newStatus) => {
        setError("");
        setSuccess("");
        try {
            await api.patch(`/attendance/${recordId}`, { status: newStatus });

            // Update local state
            setUpdateRecords((prev) =>
                prev.map((r) => (r._id === recordId ? { ...r, status: newStatus } : r))
            );
            setSuccess("হাজিরা সফলভাবে আপডেট করা হয়েছে।");
        } catch (err) {
            setError(err.message || "হাজিরা আপডেট করতে ব্যর্থ হয়েছে।");
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-8 text-zinc-100 font-sans">
            {/* Header */}
            <div className="border-b border-zinc-800/80 pb-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent sm:text-3xl">
                    ✏️ হাজিরা সংশোধন (Attendance Correction)
                </h1>
                <p className="text-xs text-zinc-400 mt-1">
                    শ্রেণী ও বিষয় সিলেক্ট করে যে কোনো দিনের বা সম্পূর্ণ মাসের হাজিরা রেকর্ড সংশোধন করুন
                </p>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm">
                    ⚠️ {error}
                </div>
            )}
            {success && (
                <div className="p-4 rounded-xl bg-green-950/40 border border-green-500/30 text-green-300 text-sm animate-pulse">
                    ✅ {success}
                </div>
            )}

            {/* Filter Card */}
            <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">শ্রেণী (Class)</label>
                        <select
                            value={updateClass}
                            onChange={(e) => setUpdateClass(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
                        >
                            <option value="BEd-2026">BEd-2026</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">শাখা (Section)</label>
                        <select
                            value={updateSection}
                            onChange={(e) => setUpdateSection(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
                        >
                            <option value="All">All Sections</option>
                            <option value="A">Section A</option>
                            <option value="B">Section B</option>
                            <option value="C">Section C</option>
                            <option value="D">Section D</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">বিষয় (Subject)</label>
                        <select
                            value={updateSubject}
                            onChange={(e) => setUpdateSubject(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
                        >
                            {subjects.map((sub, idx) => (
                                <option key={idx} value={sub}>{sub}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">শুরুর তারিখ (Start Date)</label>
                        <input
                            type="date"
                            value={updateFromDate}
                            onChange={(e) => setUpdateFromDate(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">শেষের তারিখ (End Date)</label>
                        <input
                            type="date"
                            value={updateToDate}
                            onChange={(e) => setUpdateToDate(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        onClick={handleSearchUpdateRecords}
                        disabled={updateLoading}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl px-6 py-2.5 shadow-lg shadow-blue-500/10 transition-all duration-200 flex items-center gap-2"
                    >
                        {updateLoading ? (
                            <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : "🔍 হাজিরা খুজুন (Search Records)"}
                    </button>
                </div>
            </div>

            {/* Results Table */}
            <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl overflow-x-auto">
                <table className="w-full text-sm text-left text-zinc-400">
                    <thead className="text-xs text-zinc-400 uppercase border-b border-zinc-800 bg-zinc-900/40">
                        <tr>
                            <th className="px-6 py-3.5">তারিখ</th>
                            <th className="px-6 py-3.5">শিক্ষার্থীর নাম</th>
                            <th className="px-6 py-3.5">রোল</th>
                            <th className="px-6 py-3.5">শাখা (Section)</th>
                            <th className="px-6 py-3.5">বিষয়</th>
                            <th className="px-6 py-3.5">চেক-ইন পদ্ধতি</th>
                            <th className="px-6 py-3.5 text-center">স্ট্যাটাস ও পরিবর্তন করুন</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850">
                        {updateRecords.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-12 text-center text-zinc-500 text-xs">
                                    কোনো হাজিরা রেকর্ড পাওয়া যায়নি। উপরের ফিল্টার ব্যবহার করে সার্চ করুন।
                                </td>
                            </tr>
                        ) : (
                            updateRecords.map((r) => (
                                <tr key={r._id} className="hover:bg-zinc-900/20 transition-all duration-150">
                                    <td className="px-6 py-4 font-mono text-zinc-300">{r.date}</td>
                                    <td className="px-6 py-4 font-semibold text-zinc-200">{r.student?.name || "N/A"}</td>
                                    <td className="px-6 py-4 font-mono text-zinc-300">{r.student?.roll || "N/A"}</td>
                                    <td className="px-6 py-4">{r.section}</td>
                                    <td className="px-6 py-4 text-xs">{r.subject}</td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded font-mono uppercase">
                                            {r.method}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center flex items-center justify-center gap-3">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold inline-block min-w-[70px] ${r.status === "present"
                                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                            : r.status === "late"
                                                ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                                            }`}>
                                            {r.status === "present" ? "Present" : r.status === "late" ? "Late" : "Absent"}
                                        </span>

                                        <select
                                            value={r.status}
                                            onChange={(e) => handleRecordStatusChange(r._id, e.target.value)}
                                            className="bg-zinc-950 border border-zinc-800 text-[11px] rounded-lg px-2 py-1 text-zinc-300 focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="present">Present</option>
                                            <option value="late">Late</option>
                                            <option value="absent">Absent</option>
                                        </select>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}