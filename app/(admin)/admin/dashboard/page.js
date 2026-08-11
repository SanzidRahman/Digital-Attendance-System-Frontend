"use client";

import { useEffect, useState } from "react";
import io from "socket.io-client";
import api from "@/components/api";

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalStudents: 0,
        todayPresent: 0,
        todayAbsent: 0,
        lateStudents: 0,
        attendanceRate: "0.0"
    });
    const [trendData, setTrendData] = useState([]);
    const [recentLogs, setRecentLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const summary = await api.get("/dashboard/summary");
                setStats(summary);

                const trend = await api.get("/dashboard/monthly");
                const formattedTrend = trend.trend.map(t => ({
                    date: t.date, // full date YYYY-MM-DD
                    presentCount: t.presentCount
                }));
                setTrendData(formattedTrend);
            } catch (err) {
                console.error(err);
                setError("Failed to load dashboard statistics.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();

        // Socket listener for real-time check-in live logs
        const socket = io(
            process.env.NEXT_PUBLIC_SOCKET_URL ||
            "http://localhost:8000"
        );

        socket.on("attendance:new", (log) => {
            setRecentLogs((prev) => [
                {
                    studentName: log.studentName,
                    roll: log.roll,
                    time: log.time,
                    status: log.status,
                    id: Date.now()
                },
                ...prev.slice(0, 9)
            ]);

            // Sync stats
            api.get("/dashboard/summary").then(setStats).catch(console.error);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center font-sans text-zinc-100">
                <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-sm text-zinc-400 font-mono">Loading Admin Panel...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-8 text-zinc-100 font-sans">
            {/* Dashboard Header */}
            <div className="border-b border-zinc-800/80 pb-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent sm:text-3xl">
                    📊 ড্যাশবোর্ড (Dashboard Summary)
                </h1>
                <p className="text-xs text-zinc-400 mt-1">
                    আজকের উপস্থিতির হার এবং রিয়েল-টাইম ক্লাসরুম নোটিফিকেশন লভুন
                </p>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm">
                    ⚠️ {error}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 shadow-lg backdrop-blur-xl">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">👥 মোট শিক্ষার্থী</span>
                    <span className="text-3xl font-extrabold text-white mt-1 block">{stats.totalStudents}</span>
                    <span className="text-[10px] text-zinc-500 mt-1 block">নিবন্ধিত ছাত্র সংখ্যা</span>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 shadow-lg backdrop-blur-xl border-l-green-500/30">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">🟢 আজকের উপস্থিতি</span>
                    <span className="text-3xl font-extrabold text-green-400 mt-1 block">{stats.todayPresent}</span>
                    <span className="text-[10px] text-zinc-500 mt-1 block">আজ ক্লাসে উপস্থিত</span>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 shadow-lg backdrop-blur-xl border-l-red-500/30">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">🔴 আজকের অনুপস্থিত</span>
                    <span className="text-3xl font-extrabold text-red-400 mt-1 block">{stats.todayAbsent}</span>
                    <span className="text-[10px] text-zinc-500 mt-1 block">আজ অনুপস্থিত আছে</span>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 shadow-lg backdrop-blur-xl border-l-yellow-500/30">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">⏰ বিলম্বে উপস্থিতি</span>
                    <span className="text-3xl font-extrabold text-yellow-400 mt-1 block">{stats.lateStudents}</span>
                    <span className="text-[10px] text-zinc-500 mt-1 block">দেরি করে ক্লাসে উপস্থিত</span>
                </div>
                <div className="col-span-2 md:col-span-1 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 shadow-lg backdrop-blur-xl">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">📈 উপস্থিতির হার</span>
                    <span className="text-3xl font-extrabold text-blue-400 mt-1 block">{stats.attendanceRate}%</span>
                    <span className="text-[10px] text-zinc-500 mt-1 block">আজকের অ্যাটেনডেন্স রেট</span>
                </div>
            </div>

            {/* Split Section: Trend Table + Live Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Monthly Trend Table */}
                <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-4">
                    <h2 className="text-lg font-bold text-zinc-200">📊 মাসিক উপস্থিতির ট্রেন্ড (Monthly Trend Table)</h2>
                    <div className="overflow-x-auto max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-850">
                        <table className="w-full text-sm text-left text-zinc-400">
                            <thead className="text-xs text-zinc-450 uppercase border-b border-zinc-800 bg-zinc-950/40 sticky top-0 backdrop-blur-md">
                                <tr>
                                    <th className="px-6 py-3">তারিখ (Date)</th>
                                    <th className="px-6 py-3 text-right">উপস্থিত শিক্ষার্থীর সংখ্যা</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-850">
                                {trendData.length === 0 ? (
                                    <tr>
                                        <td colSpan="2" className="px-6 py-8 text-center text-zinc-500 text-xs">
                                            কোনো ট্রেন্ড রেকর্ড পাওয়া যায়নি।
                                        </td>
                                    </tr>
                                ) : (
                                    trendData.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-zinc-900/20 transition-all duration-150">
                                            <td className="px-6 py-3.5 font-mono text-zinc-300">{row.date}</td>
                                            <td className="px-6 py-3.5 text-right font-semibold text-emerald-400">{row.presentCount} জন</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Real-time Live Log Table */}
                <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-4">
                    <h2 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
                        <span>🕒 রিয়েল-টাইম হাজিরা লগ (Live Check-Ins)</span>
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                    </h2>
                    <div className="overflow-x-auto max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-850">
                        <table className="w-full text-sm text-left text-zinc-400">
                            <thead className="text-xs text-zinc-450 uppercase border-b border-zinc-800 bg-zinc-950/40 sticky top-0 backdrop-blur-md">
                                <tr>
                                    <th scope="col" className="px-6 py-3">শিক্ষার্থী</th>
                                    <th scope="col" className="px-6 py-3">রোল</th>
                                    <th scope="col" className="px-6 py-3 text-right">চেক-ইন সময়</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-850">
                                {recentLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-8 text-center text-zinc-500 text-xs">
                                            আজকের কোনো রিয়েল-টাইম হাজিরা রেকর্ড করা হয়নি।
                                        </td>
                                    </tr>
                                ) : (
                                    recentLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-zinc-900/20 transition-all duration-150">
                                            <td className="px-6 py-3.5 font-semibold text-zinc-200">{log.studentName}</td>
                                            <td className="px-6 py-3.5 font-mono">{log.roll}</td>
                                            <td className="px-6 py-3.5 text-right font-mono text-zinc-400">{log.time}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
