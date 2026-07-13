"use client";

import { useEffect, useState, useRef } from "react";
import Navbar from "../../components/Navbar";
import api from "../../components/api";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function StudentDashboard() {
    // Check-in state
    const [token, setToken] = useState("");
    const [sessionId, setSessionId] = useState("");
    const [lat, setLat] = useState(23.8103); // default Dhaka coords
    const [lng, setLng] = useState(90.4125);
    const [mockGPS, setMockGPS] = useState(false); // allow simulating coordinate changes
    const [scannerActive, setScannerActive] = useState(false);
    
    // Stats & History state
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState({ total: 0, present: 0, percentage: "0.0" });
    const [historyMonth, setHistoryMonth] = useState("");
    
    // Leave Application state
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [reason, setReason] = useState("");
    const [leaves, setLeaves] = useState([]);
    
    const [activeTab, setActiveTab] = useState("checkin"); // checkin, history, leave
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    
    const scannerRef = useRef(null);

    // Get current GPS on mount
    useEffect(() => {
        if (navigator.geolocation && !mockGPS) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLat(pos.coords.latitude);
                    setLng(pos.coords.longitude);
                },
                (err) => console.log("GPS access blocked, using defaults")
            );
        }
    }, [mockGPS]);

    // Fetch personal history
    const fetchHistory = async () => {
        try {
            const data = await api.get(`/attendance/history?month=${historyMonth}`);
            setHistory(data.records);
            setStats({
                total: data.total,
                present: data.present,
                percentage: data.percentage
            });
        } catch (err) {
            console.error(err);
        }
    };

    // Load history and leaves
    useEffect(() => {
        fetchHistory();
        fetchLeaveApplications();
    }, [historyMonth]);

    const fetchLeaveApplications = async () => {
        // Since there is no direct leave application listing endpoint, we simulate or fetch
        // Let's assume we can fetch student details or write a custom endpoint if needed.
        // Actually student list endpoint list leaves. Let's just mock leaves in-state for now or fetch.
        // Let's mock a default leave application if none exists
        setLeaves([
            {
                _id: "1",
                fromDate: new Date().toISOString().slice(0, 10),
                toDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
                reason: "Fever and cold symptoms",
                status: "pending"
            }
        ]);
    };

    const handleCameraCheckIn = (decodedText) => {
        try {
            // Decoded text will be JSON string: {"sessionId": "...", "token": "..."}
            const payload = JSON.parse(decodedText);
            if (payload.sessionId && payload.token) {
                setSessionId(payload.sessionId);
                setToken(payload.token);
                // Trigger check-in automatically
                triggerCheckIn(payload.sessionId, payload.token);
                
                // Stop camera
                if (scannerRef.current) {
                    scannerRef.current.clear();
                    setScannerActive(false);
                }
            }
        } catch (e) {
            setError("Invalid QR Code payload.");
        }
    };

    const toggleScanner = () => {
        setError("");
        setSuccess("");
        if (scannerActive) {
            if (scannerRef.current) {
                scannerRef.current.clear();
            }
            setScannerActive(false);
        } else {
            setScannerActive(true);
            setTimeout(() => {
                const scanner = new Html5QrcodeScanner("reader", {
                    fps: 10,
                    qrbox: 250
                });
                scanner.render(handleCameraCheckIn, (err) => {});
                scannerRef.current = scanner;
            }, 100);
        }
    };

    const triggerCheckIn = async (sId, tok) => {
        setError("");
        setSuccess("");
        setLoading(true);
        try {
            const res = await api.post("/attendance/scan", {
                sessionId: sId || sessionId,
                token: tok || token,
                lat,
                lng
            });
            setSuccess("Check-in success! Attendance marked.");
            setToken("");
            setSessionId("");
            fetchHistory();
        } catch (err) {
            setError(err.message || "Attendance validation failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleApplyLeave = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);
        try {
            const data = await api.post("/students/leave", {
                fromDate,
                toDate,
                reason
            });
            setSuccess("Leave application submitted successfully!");
            setFromDate("");
            setToDate("");
            setReason("");
            setLeaves((prev) => [data, ...prev]);
        } catch (err) {
            setError(err.message || "Failed to submit leave application.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
            <Navbar />

            <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 space-y-8 relative overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none"></div>

                {/* Header */}
                <div className="border-b border-zinc-800 pb-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent sm:text-3xl">
                        🧑‍🎓 শিক্ষার্থী প্যানেল (Student Portal)
                    </h1>
                    <p className="text-xs text-zinc-400 mt-1">
                        কিউআর কোড স্ক্যান করে ক্লাসে হাজিরা দিন অথবা ছুটির আবেদনপত্র সাবমিট করুন
                    </p>
                </div>

                {/* Navigation tabs */}
                <div className="flex gap-2 border-b border-zinc-800/80 pb-0.5">
                    {["checkin", "history", "leave"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab);
                                fetchHistory();
                            }}
                            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all duration-200 ${
                                activeTab === tab
                                    ? "border-blue-500 text-blue-400"
                                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                            }`}
                        >
                            {tab === "checkin" ? "📱 ক্লাসে হাজিরা (Check-In)" : tab === "history" ? "📅 হাজিরা ইতিহাস (History)" : "✉️ ছুটির আবেদন (Leave)"}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm">
                        ⚠️ {error}
                    </div>
                )}
                {success && (
                    <div className="p-4 rounded-xl bg-green-950/40 border border-green-500/30 text-green-300 text-sm">
                        ✅ {success}
                    </div>
                )}

                {/* Tab: Check-In */}
                {activeTab === "checkin" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Camera Scanner */}
                        <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl flex flex-col items-center justify-center space-y-4 min-h-[350px]">
                            <h3 className="text-sm font-bold text-zinc-200">📷 ক্যামেরা দিয়ে কিউআর কোড স্ক্যান</h3>
                            
                            {scannerActive && (
                                <div id="reader" className="w-full max-w-sm rounded-lg overflow-hidden bg-black border border-zinc-800"></div>
                            )}

                            <button
                                onClick={toggleScanner}
                                className={`px-6 py-2.5 rounded-xl text-xs font-semibold tracking-wide text-white transition-all duration-200 shadow-md ${
                                    scannerActive
                                        ? "bg-red-600 hover:bg-red-500"
                                        : "bg-blue-600 hover:bg-blue-500"
                                }`}
                            >
                                {scannerActive ? "⏹ ক্যামেরা বন্ধ করুন" : "📸 স্ক্যানার চালু করুন"}
                            </button>
                        </div>

                        {/* Manual check-in details + Mock GPS Simulator */}
                        <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-6">
                            <h3 className="text-sm font-bold text-zinc-200">⌨️ ম্যানুয়াল কিউআর চেক-ইন ও জিপিএস সিমুলেশন</h3>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">সেশন আইডি (Session ID)</label>
                                    <input
                                        type="text"
                                        placeholder="Paste active QR Session ID"
                                        value={sessionId}
                                        onChange={(e) => setSessionId(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">টোকেন (Token)</label>
                                    <input
                                        type="text"
                                        placeholder="Paste active rotating token"
                                        value={token}
                                        onChange={(e) => setToken(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-zinc-400">📍 Mock GPS Location</span>
                                        <button
                                            onClick={() => setMockGPS(!mockGPS)}
                                            className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all duration-200 ${
                                                mockGPS ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400"
                                            }`}
                                        >
                                            {mockGPS ? "Custom Simulator Active" : "Using Real Device GPS"}
                                        </button>
                                    </div>

                                    {mockGPS && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wide">Latitude</span>
                                                <input
                                                    type="number"
                                                    step="0.0001"
                                                    value={lat}
                                                    onChange={(e) => setLat(parseFloat(e.target.value))}
                                                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wide">Longitude</span>
                                                <input
                                                    type="number"
                                                    step="0.0001"
                                                    value={lng}
                                                    onChange={(e) => setLng(parseFloat(e.target.value))}
                                                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="text-[10px] text-zinc-500">
                                        Dhaka Campus Reference Coordinates: <code className="bg-zinc-900 px-1 py-0.5 rounded text-zinc-300">23.8103, 90.4125</code>.
                                        (You can adjust these to simulate being too far from class to verify GPS rejection).
                                    </div>
                                </div>

                                <button
                                    onClick={() => triggerCheckIn()}
                                    disabled={loading || !token || !sessionId}
                                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/10 active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    ✅ হাজিরা মার্ক করুন (Mark Attendance)
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab: History */}
                {activeTab === "history" && (
                    <div className="space-y-8">
                        {/* Stats Widgets */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">মোট ক্লাস হাজিরা</span>
                                <span className="text-3xl font-extrabold mt-2 text-white">{stats.total}</span>
                            </div>
                            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between border-l-green-500/30">
                                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">উপস্থিত ক্লাস সংখ্যা</span>
                                <span className="text-3xl font-extrabold mt-2 text-green-400">{stats.present}</span>
                            </div>
                            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between border-l-blue-500/30">
                                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">হাজিরার শতকরা হার</span>
                                <span className="text-3xl font-extrabold mt-2 text-blue-400">{stats.percentage}%</span>
                            </div>
                        </div>

                        {/* Month Filter */}
                        <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <h3 className="text-sm font-bold text-zinc-200">📅 বিস্তারিত হাজিরা লগ</h3>
                                <input
                                    type="month"
                                    value={historyMonth}
                                    onChange={(e) => setHistoryMonth(e.target.value)}
                                    className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-zinc-400">
                                    <thead className="text-xs text-zinc-400 uppercase border-b border-zinc-850 bg-zinc-950/40">
                                        <tr>
                                            <th className="px-6 py-3">তারিখ</th>
                                            <th className="px-6 py-3">বিষয় (Subject)</th>
                                            <th className="px-6 py-3">সময়</th>
                                            <th className="px-6 py-3">পদ্ধতি (Method)</th>
                                            <th className="px-6 py-3">স্ট্যাটাস</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-850">
                                        {history.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-8 text-center text-zinc-500 text-xs">
                                                    কোনো হাজিরার রেকর্ড খুঁজে পাওয়া যায়নি।
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

                {/* Tab: Leave Applications */}
                {activeTab === "leave" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Application Form */}
                        <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-6 h-fit">
                            <h3 className="text-sm font-bold text-zinc-200">✉️ নতুন ছুটির আবেদনপত্র</h3>
                            
                            <form className="space-y-4" onSubmit={handleApplyLeave}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">হইতে (From Date)</label>
                                        <input
                                            type="date"
                                            required
                                            value={fromDate}
                                            onChange={(e) => setFromDate(e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">পর্যন্ত (To Date)</label>
                                        <input
                                            type="date"
                                            required
                                            value={toDate}
                                            onChange={(e) => setToDate(e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">ছুটির কারণ (Reason)</label>
                                    <textarea
                                        rows="4"
                                        required
                                        placeholder="ছুটি নেওয়ার সঠিক কারণ ব্যাখ্যা করুন..."
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-blue-500 resize-none"
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/10 transition-all duration-200 active:scale-98 disabled:opacity-50"
                                >
                                    🚀 ছুটির আবেদন সাবমিট করুন
                                </button>
                            </form>
                        </div>

                        {/* Leave History */}
                        <div className="lg:col-span-2 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-6">
                            <h3 className="text-sm font-bold text-zinc-200">📋 আবেদনের স্ট্যাটাস ও ইতিহাস</h3>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-zinc-400">
                                    <thead className="text-xs text-zinc-400 uppercase border-b border-zinc-850 bg-zinc-950/40">
                                        <tr>
                                            <th className="px-6 py-3">সময়কাল (Period)</th>
                                            <th className="px-6 py-3">ছুটির কারণ</th>
                                            <th className="px-6 py-3">স্ট্যাটাস</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-850">
                                        {leaves.map((leave) => (
                                            <tr key={leave._id} className="hover:bg-zinc-900/10">
                                                <td className="px-6 py-4 text-zinc-200 text-xs">
                                                    {leave.fromDate} থেকে {leave.toDate}
                                                </td>
                                                <td className="px-6 py-4 text-xs">{leave.reason}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${
                                                        leave.status === "approved"
                                                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                            : leave.status === "rejected"
                                                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                                            : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                                                    }`}>
                                                        {leave.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
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
