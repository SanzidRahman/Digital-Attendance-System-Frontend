"use client";

import { useEffect, useState, useRef } from "react";
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
    const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard", "update", "manual", "reports"
    
    // Stats and Trend
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
    const [success, setSuccess] = useState("");

    // Subjects List
    const subjects = [
        "অ্যাডভান্স আইসিটি",
        "মাধ্যমিক শিক্ষা",
        "সক্রিয় শিখন পদ্ধতি ও কৌশল",
        "শিখন ও শিখনযাচাই",
        "শিক্ষায় তথ্য ও যোগাযোগ পদ্ধতি"
    ];

    // --- Update Attendance Tab State ---
    const [updateClass, setUpdateClass] = useState("BEd-2026");
    const [updateSection, setUpdateSection] = useState("All");
    const [updateSubject, setUpdateSubject] = useState("অ্যাডভান্স আইসিটি");
    const [updateFromDate, setUpdateFromDate] = useState(new Date().toISOString().slice(0, 10));
    const [updateToDate, setUpdateToDate] = useState(new Date().toISOString().slice(0, 10));
    const [updateRecords, setUpdateRecords] = useState([]);
    const [updateLoading, setUpdateLoading] = useState(false);

    // --- Manual Attendance Tab State ---
    const [manualClass, setManualClass] = useState("BEd-2026");
    const [manualSection, setManualSection] = useState("A");
    const [manualSubject, setManualSubject] = useState("অ্যাডভান্স আইসিটি");
    const [manualDate, setManualDate] = useState(new Date().toISOString().slice(0, 10));
    const [students, setStudents] = useState([]);
    const [manualRecords, setManualRecords] = useState({}); // { studentId: status }
    const [manualLoading, setManualLoading] = useState(false);

    // --- Report Export Tab State ---
    const [reportClass, setReportClass] = useState("BEd-2026");
    const [reportSection, setReportSection] = useState("All");
    const [reportSubject, setReportSubject] = useState("অ্যাডভান্স আইসিটি");
    const [reportFromDate, setReportFromDate] = useState(new Date().toISOString().slice(0, 10));
    const [reportToDate, setReportToDate] = useState(new Date().toISOString().slice(0, 10));

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const summary = await api.get("/dashboard/summary");
                setStats(summary);

                const trend = await api.get("/dashboard/monthly");
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

        // Socket listener for real-time check-in live logs
        const socket = io(
            process.env.NEXT_PUBLIC_SOCKET_URL ||
            "http://localhost:8000"
        );

        socket.on("attendance:new", (log) => {
            // Append check-in log to recent log
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

        socket.on("notification:sent", (notif) => {
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

    // --- Actions: Update Attendance Tab ---
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
            
            // Update local state record status
            setUpdateRecords((prev) =>
                prev.map((r) => (r._id === recordId ? { ...r, status: newStatus } : r))
            );
            setSuccess("হাজিরা সফলভাবে আপডেট করা হয়েছে।");
            
            // Sync dashboard stats
            const summary = await api.get("/dashboard/summary");
            setStats(summary);
        } catch (err) {
            setError(err.message || "হাজিরা আপডেট করতে ব্যর্থ হয়েছে।");
        }
    };

    // --- Actions: Manual Attendance Tab ---
    const loadManualStudents = async () => {
        setManualLoading(true);
        setError("");
        setSuccess("");
        setStudents([]);
        try {
            // 1. Fetch all students in the class/section
            const studentList = await api.get(
                `/students?class=${manualClass}&section=${manualSection}`
            );

            // 2. Fetch already marked attendance for that class/section/subject/date
            const report = await api.get(
                `/attendance/daily-report?class=${manualClass}&section=${manualSection}&subject=${encodeURIComponent(manualSubject)}&date=${manualDate}`
            );

            const markedStudentsMap = {};
            (report.records || []).forEach(r => {
                if (r.student) {
                    markedStudentsMap[r.student._id] = r;
                }
            });

            // 3. Set default status to absent, or mark as disabled if GPS checked in
            const initialStatus = {};
            const updatedStudentList = studentList.map(s => {
                const existingRecord = markedStudentsMap[s._id];
                if (existingRecord && existingRecord.method === "gps") {
                    s.gpsCheckedIn = true;
                    s.existingStatus = existingRecord.status;
                    initialStatus[s._id] = existingRecord.status;
                } else if (existingRecord && existingRecord.method === "manual") {
                    s.existingStatus = existingRecord.status;
                    initialStatus[s._id] = existingRecord.status;
                } else {
                    initialStatus[s._id] = "absent"; // default to absent!
                }
                return s;
            });

            setStudents(updatedStudentList);
            setManualRecords(initialStatus);
        } catch (err) {
            setError("শিক্ষার্থীদের তালিকা লোড করতে ব্যর্থ হয়েছে।");
        } finally {
            setManualLoading(false);
        }
    };

    const handleManualStatusSelection = (studentId, status) => {
        setManualRecords((prev) => ({
            ...prev,
            [studentId]: status
        }));
    };

    const submitManualAttendance = async () => {
        setManualLoading(true);
        setError("");
        setSuccess("");
        try {
            // Filter out students who are already checked in via GPS
            const recordsArray = Object.keys(manualRecords)
                .filter(id => {
                    const student = students.find(s => s._id === id);
                    return !student?.gpsCheckedIn;
                })
                .map((id) => ({
                    studentId: id,
                    status: manualRecords[id]
                }));

            await api.post("/attendance/manual", {
                class: manualClass,
                section: manualSection,
                subject: manualSubject,
                date: manualDate,
                records: recordsArray
            });

            setSuccess(`${students.length} জন শিক্ষার্থীর হাজিরা সফলভাবে সংরক্ষিত হয়েছে!`);
            // Reset state
            setStudents([]);
            setManualRecords({});
            
            // Sync dashboard stats
            const summary = await api.get("/dashboard/summary");
            setStats(summary);
        } catch (err) {
            setError(err.message || "ম্যানুয়াল হাজিরা সংরক্ষণ করতে ব্যর্থ হয়েছে।");
        } finally {
            setManualLoading(false);
        }
    };

    // --- Actions: Report Exports ---
    const handleDownloadReport = (format) => {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(/\/$/, "");
        
        const params = new URLSearchParams({
            token,
            class: reportClass,
            section: reportSection,
            subject: reportSubject,
            from: reportFromDate,
            to: reportToDate
        });
        
        window.open(`${apiUrl}/reports/${format}?${params.toString()}`, "_blank");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center font-sans text-zinc-100">
                <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-sm text-zinc-400 font-mono">Loading Admin Panel...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100 flex flex-col">
            <Navbar />

            <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 space-y-8 relative overflow-hidden">
                {/* Background ambient light */}
                <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none"></div>

                {/* Dashboard Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800/80 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent sm:text-3xl">
                            🛡️ অ্যাডমিন কন্ট্রোল প্যানেল (Admin Portal)
                        </h1>
                        <p className="text-xs text-zinc-400 mt-1">
                            উপস্থিতি ভেরিফিকেশন, রিয়েল-টাইম লাইভ লগ ট্র্যাকিং এবং সামগ্রিক হাজিরা রিপোর্ট সিস্টেম
                        </p>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex bg-zinc-900/80 border border-zinc-850 p-1 rounded-xl">
                        <button
                            onClick={() => { setActiveTab("dashboard"); setError(""); setSuccess(""); }}
                            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-250 ${activeTab === "dashboard" ? "bg-blue-600 text-white shadow-md" : "text-zinc-400 hover:text-zinc-200"}`}
                        >
                            📊 ড্যাশবোর্ড
                        </button>
                        <button
                            onClick={() => { setActiveTab("update"); setError(""); setSuccess(""); }}
                            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-250 ${activeTab === "update" ? "bg-blue-600 text-white shadow-md" : "text-zinc-400 hover:text-zinc-200"}`}
                        >
                            ✏️ হাজিরা সংশোধন
                        </button>
                        <button
                            onClick={() => { setActiveTab("manual"); setError(""); setSuccess(""); }}
                            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-250 ${activeTab === "manual" ? "bg-blue-600 text-white shadow-md" : "text-zinc-400 hover:text-zinc-200"}`}
                        >
                            📝 ম্যানুয়াল হাজিরা
                        </button>
                        <button
                            onClick={() => { setActiveTab("reports"); setError(""); setSuccess(""); }}
                            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-250 ${activeTab === "reports" ? "bg-blue-600 text-white shadow-md" : "text-zinc-400 hover:text-zinc-200"}`}
                        >
                            📥 রিপোর্ট ডাউনলোড
                        </button>
                    </div>
                </div>

                {/* Notifications Alert Banner */}
                {error && (
                    <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm flex items-center gap-3">
                        <span>⚠️</span>
                        <p>{error}</p>
                    </div>
                )}
                {success && (
                    <div className="p-4 rounded-xl bg-green-950/40 border border-green-500/30 text-green-300 text-sm flex items-center gap-3 animate-pulse">
                        <span>✅</span>
                        <p>{success}</p>
                    </div>
                )}

                {/* --- TAB: DASHBOARD --- */}
                {activeTab === "dashboard" && (
                    <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
                        {/* Stats Widgets */}
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

                        {/* Mid Section: Chart + Notifications Feed */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                                            <p className="text-xs">কোনো অ্যাক্টিভ মেসেজ সেন্ড হয়নি। ছাত্র হাজিরা দিলে অভিভাবকের ফোনে পাঠানো মেসেজ লাইভ দেখা যাবে।</p>
                                        </div>
                                    ) : (
                                        notificationFeed.map((notif) => (
                                            <div key={notif.id} className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800/80 text-[11px] space-y-1 hover:border-zinc-700 hover:scale-101 transition-all duration-200">
                                                <div className="flex items-center justify-between">
                                                    <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] ${notif.type === "SMS"
                                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                        : notif.type === "WhatsApp"
                                                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                                        }`}>
                                                        {notif.type}
                                                    </span>
                                                    <span className="text-[10px] text-zinc-500">{notif.timestamp}</span>
                                                </div>
                                                <p className="text-zinc-300 font-mono text-[9px]">To: {notif.recipient}</p>
                                                <p className="text-zinc-400 text-[10px]">{notif.message}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Real-time Live Log Table */}
                        <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-4">
                            <h2 className="text-lg font-bold text-zinc-200">🕒 আজকের রিয়েল-টাইম হাজিরা লগ (Check-In Live Log)</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-zinc-400">
                                    <thead className="text-xs text-zinc-400 uppercase border-b border-zinc-800 bg-zinc-900/40">
                                        <tr>
                                            <th scope="col" className="px-6 py-3.5">শিক্ষার্থীর নাম</th>
                                            <th scope="col" className="px-6 py-3.5">রোল নম্বর</th>
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
                    </div>
                )}

                {/* --- TAB: UPDATE ATTENDANCE (DAILY / MONTHLY UPDATE) --- */}
                {activeTab === "update" && (
                    <div className="space-y-6 bg-zinc-900/20 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl animate-[fadeIn_0.3s_ease-out]">
                        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-850 pb-4 mb-4 gap-2">
                            <div>
                                <h2 className="text-lg font-bold text-zinc-200">✏️ হাজিরা সংশোধন (Daily & Monthly Attendance Update)</h2>
                                <p className="text-[11px] text-zinc-500 mt-0.5">যে কোনো দিনের বা সম্পূর্ণ মাসের হাজিরা রেকর্ড খুঁজুন এবং সংশোধন করুন</p>
                            </div>
                        </div>

                        {/* Search Filters */}
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

                        {/* Search Results */}
                        <div className="overflow-x-auto border-t border-zinc-850 pt-4 mt-4">
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
                                                    
                                                    {/* Quick Update Dropdown */}
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
                )}

                {/* --- TAB: MANUAL ATTENDANCE --- */}
                {activeTab === "manual" && (
                    <div className="space-y-6 bg-zinc-900/20 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl animate-[fadeIn_0.3s_ease-out]">
                        <div>
                            <h2 className="text-lg font-bold text-zinc-200">📝 ম্যানুয়াল হাজিরা মার্কিং (Manual Attendance System)</h2>
                            <p className="text-[11px] text-zinc-500 mt-0.5">শিক্ষার্থীরা অনুপস্থিত থাকলে বা বিশেষ প্রয়োজনে সরাসরি হাজিরা মার্ক করে সংরক্ষণ করুন</p>
                        </div>

                        {/* manual setup filters */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-b border-zinc-850 pb-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">শ্রেণী (Class)</label>
                                <select
                                    value={manualClass}
                                    onChange={(e) => setManualClass(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
                                >
                                    <option value="BEd-2026">BEd-2026</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">শাখা (Section)</label>
                                <select
                                    value={manualSection}
                                    onChange={(e) => setManualSection(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
                                >
                                    <option value="A">Section A</option>
                                    <option value="B">Section B</option>
                                    <option value="C">Section C</option>
                                    <option value="D">Section D</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">বিষয় (Subject)</label>
                                <select
                                    value={manualSubject}
                                    onChange={(e) => setManualSubject(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
                                >
                                    {subjects.map((sub, idx) => (
                                        <option key={idx} value={sub}>{sub}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">তারিখ (Date)</label>
                                <input
                                    type="date"
                                    value={manualDate}
                                    onChange={(e) => setManualDate(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex justify-start">
                            <button
                                onClick={loadManualStudents}
                                disabled={manualLoading}
                                className="bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-zinc-200 text-xs font-semibold rounded-xl px-6 py-2.5 transition-all duration-200 flex items-center gap-2"
                            >
                                👥 শিক্ষার্থীদের তালিকা লোড করুন
                            </button>
                        </div>

                        {/* student attendance inputs */}
                        {students.length > 0 && (
                            <div className="space-y-6 pt-4">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left text-zinc-400">
                                        <thead className="text-xs text-zinc-400 uppercase border-b border-zinc-800 bg-zinc-900/40">
                                            <tr>
                                                <th scope="col" className="px-6 py-3.5">রোল নম্বর</th>
                                                <th scope="col" className="px-6 py-3.5">শিক্ষার্থীর নাম</th>
                                                <th scope="col" className="px-6 py-3.5 text-center">উপস্থিতি স্থিতি (Attendance Status)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-850">
                                            {students.map((s) => (
                                                <tr key={s._id} className="hover:bg-zinc-900/10 transition-all duration-150">
                                                    <td className="px-6 py-4 font-mono font-semibold text-zinc-300">{s.roll}</td>
                                                    <td className="px-6 py-4 text-zinc-100 font-semibold">{s.name}</td>
                                                    <td className="px-6 py-4 flex items-center justify-center gap-4">
                                                        {s.gpsCheckedIn ? (
                                                            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                                📡 GPS Checked-In ({s.existingStatus.toUpperCase()})
                                                            </span>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleManualStatusSelection(s._id, "present")}
                                                                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${manualRecords[s._id] === "present"
                                                                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/10"
                                                                        : "bg-zinc-950 text-zinc-500 hover:text-zinc-300"
                                                                        }`}
                                                                >
                                                                    Present
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleManualStatusSelection(s._id, "late")}
                                                                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${manualRecords[s._id] === "late"
                                                                        ? "bg-yellow-600 text-white shadow-md shadow-yellow-500/10"
                                                                        : "bg-zinc-950 text-zinc-500 hover:text-zinc-300"
                                                                        }`}
                                                                >
                                                                    Late
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleManualStatusSelection(s._id, "absent")}
                                                                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${manualRecords[s._id] === "absent"
                                                                        ? "bg-red-600 text-white shadow-md shadow-red-500/10"
                                                                        : "bg-zinc-950 text-zinc-500 hover:text-zinc-300"
                                                                        }`}
                                                                >
                                                                    Absent
                                                                </button>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-zinc-850">
                                    <button
                                        onClick={submitManualAttendance}
                                        disabled={manualLoading}
                                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl px-8 py-3 shadow-lg shadow-blue-500/10 transition-all duration-200 flex items-center gap-2"
                                    >
                                        {manualLoading ? (
                                            <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : "💾 হাজিরা সাবমিট করুন (Save Attendance)"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- TAB: DOWNLOAD REPORTS --- */}
                {activeTab === "reports" && (
                    <div className="space-y-6 bg-zinc-900/20 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl animate-[fadeIn_0.3s_ease-out]">
                        <div>
                            <h2 className="text-lg font-bold text-zinc-200">📥 রিপোর্ট এক্সপোর্ট সেন্টার (Download PDF & Excel Reports)</h2>
                            <p className="text-[11px] text-zinc-500 mt-0.5">ক্লাস, সেকশন, সাবজেক্ট ও ডেট ফিল্টার অনুযায়ী অফিশিয়াল উপস্থিতি রিপোর্ট ডাউনলোড করুন</p>
                        </div>

                        {/* Report Filter Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">শ্রেণী (Class)</label>
                                <select
                                    value={reportClass}
                                    onChange={(e) => setReportClass(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
                                >
                                    <option value="BEd-2026">BEd-2026</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">শাখা (Section)</label>
                                <select
                                    value={reportSection}
                                    onChange={(e) => setReportSection(e.target.value)}
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
                                    value={reportSubject}
                                    onChange={(e) => setReportSubject(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
                                >
                                    {subjects.map((sub, idx) => (
                                        <option key={idx} value={sub}>{sub}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">শুরুর তারিখ (From)</label>
                                <input
                                    type="date"
                                    value={reportFromDate}
                                    onChange={(e) => setReportFromDate(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">শেষের তারিখ (To)</label>
                                <input
                                    type="date"
                                    value={reportToDate}
                                    onChange={(e) => setReportToDate(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Export Buttons */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-zinc-850 mt-6">
                            <button
                                onClick={() => handleDownloadReport("pdf")}
                                className="flex flex-col items-center justify-center p-6 bg-zinc-900/60 border border-zinc-800 hover:border-red-500/40 rounded-2xl group transition-all duration-300 hover:scale-101 hover:shadow-lg active:scale-99"
                            >
                                <span className="text-4xl group-hover:scale-110 transition-transform duration-300">📄</span>
                                <span className="text-xs font-bold text-zinc-200 mt-3">PDF রিপোর্ট ডাউনলোড করুন</span>
                                <span className="text-[10px] text-zinc-500 mt-1">প্রিন্ট ও অফিশিয়াল ভেরিফিকেশনের জন্য সেরা</span>
                            </button>

                            <button
                                onClick={() => handleDownloadReport("excel")}
                                className="flex flex-col items-center justify-center p-6 bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/40 rounded-2xl group transition-all duration-300 hover:scale-101 hover:shadow-lg active:scale-99"
                            >
                                <span className="text-4xl group-hover:scale-110 transition-transform duration-300">📊</span>
                                <span className="text-xs font-bold text-zinc-200 mt-3">EXCEL রিপোর্ট ডাউনলোড করুন</span>
                                <span className="text-[10px] text-zinc-500 mt-1">বিশ্লেষণ ও স্প্রেডশীট ম্যানেজমেন্টের জন্য সেরা</span>
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
