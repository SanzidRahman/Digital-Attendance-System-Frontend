"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import api from "../../components/api";
import io from "socket.io-client";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";

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
    const [notificationFeed, setNotificationFeed] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const summary = await api.get("/dashboard/summary");
                setStats(summary);

                const trend = await api.get("/dashboard/monthly");
                // format data for recharts
                const formattedTrend = trend.trend.map(t => ({
                    date: t.date.slice(5), // Keep MM-DD
                    "Present Students": t.presentCount
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

        // Socket listener for real-time updates
        const socket = io("https://digital-attendance-system-backend-production.up.railway.app");

        socket.on("attendance:new", (log) => {
            // Append check-in log
            setRecentLogs((prev) => [
                {
                    studentName: log.studentName,
                    roll: log.roll,
                    time: log.time,
                    status: log.status,
                    id: Date.now()
                },
                ...prev.slice(0, 7)
            ]);

            // Re-fetch statistics to sync real-time count
            api.get("/dashboard/summary").then(setStats).catch(console.error);
        });

        socket.on("notification:sent", (notif) => {
            // Append simulated notification alerts
            setNotificationFeed((prev) => [
                {
                    type: notif.type,
                    recipient: notif.recipient,
                    message: notif.message,
                    timestamp: new Date(notif.timestamp).toLocaleTimeString(),
                    id: Math.random()
                },
                ...prev.slice(0, 9)
            ]);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const getReportUrl = (format) => {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        return `https://digital-attendance-system-backend-production.up.railway.app/api/reports/${format}?token=${token}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center font-sans text-zinc-100">
                <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-sm text-zinc-400">Loading Admin Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100 flex flex-col">
            <Navbar />

            <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 space-y-8 relative overflow-hidden">
                {/* Background lighting */}
                <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-blue-600/5 blur-[120px] pointer-events-none"></div>

                {/* Dashboard Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800/80 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent sm:text-3xl">
                            🛡️ অ্যাডমিন ড্যাশবোর্ড (Admin Panel)
                        </h1>
                        <p className="text-xs text-zinc-400 mt-1">
                            আজকের উপস্থিতির হার এবং রিয়েল-টাইম ক্লাসরুম নোটিফিকেশন লভুন
                        </p>
                    </div>
                    {/* Downloads */}
                    <div className="flex flex-wrap gap-3">
                        <a
                            href={getReportUrl("pdf")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl px-4 py-2 text-xs font-semibold text-zinc-200 shadow-md transition-all duration-200 hover:scale-103"
                        >
                            📥 PDF রিপোর্ট ডাউনলোড
                        </a>
                        <a
                            href={getReportUrl("excel")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-600 hover:bg-blue-500 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/10 transition-all duration-200 hover:scale-103"
                        >
                            📊 Excel রিপোর্ট ডাউনলোড
                        </a>
                    </div>
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

                {/* Main section: Chart + Realtime checks */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Chart */}
                    <div className="lg:col-span-2 bg-zinc-900/20 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-4">
                        <h2 className="text-lg font-bold text-zinc-200">📈 মাসিক উপস্থিতির ট্রেন্ড (Monthly Trend)</h2>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                    <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
                                    <YAxis stroke="#71717a" fontSize={11} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "12px", color: "#f4f4f5" }}
                                    />
                                    <Area type="monotone" dataKey="Present Students" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPresent)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Right: Live notification console */}
                    <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-4 flex flex-col h-[400px]">
                        <h2 className="text-lg font-bold text-zinc-200 flex items-center justify-between">
                            <span>🔔 নোটিফিকেশন কনসোল</span>
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                        </h2>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
                            {notificationFeed.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 py-12">
                                    <span className="text-2xl mb-2">💬</span>
                                    <p className="text-xs">কোনো নোটিফিকেশন লভ্য নেই। কোনো শিক্ষার্থী চেক-ইন করলে এখানে অভিভাবকের কাছে পাঠানো SMS/Email লাইভ দেখা যাবে।</p>
                                </div>
                            ) : (
                                notificationFeed.map((notif) => (
                                    <div key={notif.id} className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800/80 text-[11px] space-y-1 hover:border-zinc-700/80 transition-all duration-200">
                                        <div className="flex items-center justify-between">
                                            <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider ${notif.type === "SMS"
                                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                : notif.type === "WhatsApp"
                                                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                                    : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                                }`}>
                                                {notif.type}
                                            </span>
                                            <span className="text-[10px] text-zinc-500">{notif.timestamp}</span>
                                        </div>
                                        <p className="text-zinc-300 font-mono text-[10px]">Recipient: {notif.recipient}</p>
                                        <p className="text-zinc-400 line-clamp-2">{notif.message}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Recent check-ins logs */}
                <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-4">
                    <h2 className="text-lg font-bold text-zinc-200">🕒 আজকের রিয়েল-টাইম হাজিরা লগ (Check-In Live Log)</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-zinc-400">
                            <thead className="text-xs text-zinc-400 uppercase border-b border-zinc-800 bg-zinc-900/40">
                                <tr>
                                    <th scope="col" className="px-6 py-3.5">শিক্ষার্থীর নাম</th>
                                    <th scope="col" className="px-6 py-3.5">রোল</th>
                                    <th scope="col" className="px-6 py-3.5">চেক-ইন সময়</th>
                                    <th scope="col" className="px-6 py-3.5">স্ট্যাটাস</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-850">
                                {recentLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-zinc-500 text-xs">
                                            আজকের কোনো রিয়েল-টাইম হাজিরা রেকর্ড করা হয়নি।
                                        </td>
                                    </tr>
                                ) : (
                                    recentLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-zinc-900/20 transition-all duration-150">
                                            <td className="px-6 py-4 font-semibold text-zinc-200">{log.studentName}</td>
                                            <td className="px-6 py-4 font-mono">{log.roll}</td>
                                            <td className="px-6 py-4">{log.time}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${log.status === "present"
                                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                    : log.status === "late"
                                                        ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                                                    }`}>
                                                    {log.status === "present" ? "Present" : log.status === "late" ? "Late" : "Absent"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
