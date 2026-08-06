"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import Navbar from "../../components/Navbar";
import api from "../../components/api";

const getCurrentLocation = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
        reject(new Error("GPS is not supported by this browser."));
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (position) => resolve({ 
            lat: position.coords.latitude, 
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
        }),
        () => reject(new Error("Location permission is required to mark attendance.")),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
});

export default function StudentDashboard() {
    // Active session details
    const [activeSession, setActiveSession] = useState(null);
    const [hasAttended, setHasAttended] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [checkingSession, setCheckingSession] = useState(false);

    // Geolocation coordinates
    const [lat, setLat] = useState(24.7654); // default coords
    const [lng, setLng] = useState(90.4014);
    const [mockAccuracy, setMockAccuracy] = useState(15);
    const [mockGPS, setMockGPS] = useState(false); // allow simulating coordinates

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

    // Fetch active session from backend
    const fetchActiveSession = useCallback(async () => {
        try {
            const data = await api.get("/attendance/active");
            if (data && data.session) {
                setActiveSession(data.session);
                setHasAttended(data.hasAttended);
                
                // Calculate remaining seconds
                const now = new Date().getTime();
                const end = new Date(data.session.endTime).getTime();
                const remaining = Math.max(Math.floor((end - now) / 1000), 0);
                setTimeRemaining(remaining);
            } else {
                setActiveSession(null);
                setHasAttended(false);
                setTimeRemaining(0);
            }
        } catch (err) {
            console.error("Error fetching active session:", err);
        }
    }, []);

    // Get current GPS on mount
    useEffect(() => {
        if (navigator.geolocation && !mockGPS) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLat(pos.coords.latitude);
                    setLng(pos.coords.longitude);
                    setMockAccuracy(pos.coords.accuracy);
                },
                () => console.log("GPS access blocked")
            );
        }
    }, [mockGPS]);

    // Periodically fetch active session when student is on the check-in tab
    useEffect(() => {
        if (activeTab === "checkin") {
            void fetchActiveSession();
            const interval = setInterval(() => {
                void fetchActiveSession();
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [activeTab, fetchActiveSession]);

    // Timer countdown
    useEffect(() => {
        if (timeRemaining <= 0) return;
        const interval = setInterval(() => {
            setTimeRemaining((prev) => Math.max(prev - 1, 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [timeRemaining]);

    // Fetch personal history
    const fetchHistory = useCallback(async () => {
        try {
            const query = historyMonth ? `?month=${encodeURIComponent(historyMonth)}` : "";
            const data = await api.get(`/attendance/history${query}`);
            setHistory(data.records);
            setStats({
                total: data.total,
                present: data.present,
                percentage: data.percentage
            });
        } catch (err) {
            console.error(err);
        }
    }, [historyMonth]);

    const fetchLeaveApplications = useCallback(async () => {
        try {
            const data = await api.get("/students/leave");
            setLeaves(data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    // Load history and leaves
    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchHistory();
            void fetchLeaveApplications();
        }, 0);
        return () => clearTimeout(timer);
    }, [fetchHistory, fetchLeaveApplications]);

    const triggerGPSCheckIn = async () => {
        setError("");
        setSuccess("");
        setLoading(true);
        try {
            if (!activeSession) {
                throw new Error("No active class session found.");
            }

            // Get fresh location if not using mock
            let coords;
            if (mockGPS) {
                coords = { lat, lng, accuracy: mockAccuracy };
            } else {
                const loc = await getCurrentLocation();
                coords = loc;
                setLat(loc.lat);
                setLng(loc.lng);
                setMockAccuracy(loc.accuracy);
            }

            // Accuracy check
            if (coords.accuracy > 30) {
                throw new Error(`Location accuracy is too low (${Math.round(coords.accuracy)} meters). Must be under 30 meters. Please move outdoors.`);
            }

            const res = await api.post("/attendance/give", {
                sessionId: activeSession._id,
                lat: coords.lat,
                lng: coords.lng,
                accuracy: coords.accuracy
            });

            setSuccess("Check-in success! Attendance marked.");
            setHasAttended(true);
            void fetchHistory();
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

    const formatTimeRemaining = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
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
                        জিও-লোকেশন এবং ডিভাইস ভেরিফিকেশন এর মাধ্যমে আপনার ক্লাসের উপস্থিতি সাবমিট করুন
                    </p>
                </div>

                {/* Navigation tabs */}
                <div className="flex gap-2 border-b border-zinc-800/80 pb-0.5">
                    {["checkin", "history", "leave"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab);
                                void fetchHistory();
                            }}
                            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all duration-200 ${activeTab === tab
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
                        {/* Today's Attendance Panel */}
                        <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-8 shadow-xl backdrop-blur-xl flex flex-col justify-between min-h-[350px]">
                            <div className="space-y-6">
                                <div className="border-b border-zinc-800 pb-3">
                                    <h3 className="text-md font-bold text-zinc-200">📌 আজকের হাজিরা (Today's Attendance)</h3>
                                    <p className="text-[10px] text-zinc-500 uppercase mt-0.5">Auto-detected active class session</p>
                                </div>

                                {activeSession ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-[10px] font-semibold text-zinc-500 uppercase">বিষয় (Subject)</span>
                                                <p className="text-sm font-bold text-zinc-100">{activeSession.subject}</p>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-semibold text-zinc-500 uppercase">শ্রেণী (Class)</span>
                                                <p className="text-sm font-bold text-zinc-100">{activeSession.class}</p>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-semibold text-zinc-500 uppercase">শাখা (Section)</span>
                                                <p className="text-sm font-bold text-zinc-100">
                                                    {activeSession.section === "All" ? "All Sections" : `Section ${activeSession.section}`}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-semibold text-zinc-500 uppercase">সময়সীমা (Time Limit)</span>
                                                <p className="text-sm font-bold text-red-400 flex items-center gap-1">
                                                    <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse"></span>
                                                    {timeRemaining > 0 ? `${formatTimeRemaining(timeRemaining)} minutes remaining` : "Expired"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-850 space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-zinc-500">Status:</span>
                                                {hasAttended ? (
                                                    <span className="text-emerald-400 font-bold">Attendance Completed</span>
                                                ) : timeRemaining > 0 ? (
                                                    <span className="text-indigo-400 font-bold animate-pulse">Attendance Running</span>
                                                ) : (
                                                    <span className="text-zinc-500">Session Ended</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-zinc-500 space-y-2">
                                        <span className="text-5xl block">📭</span>
                                        <p className="text-sm font-bold text-zinc-400">কোনো একটিভ ক্লাস সেশন পাওয়া যায়নি</p>
                                        <p className="text-xs text-zinc-600">শিক্ষক ক্লাস শুরু করলে এখানে হাজিরা দেওয়ার বাটন দেখতে পাবেন।</p>
                                    </div>
                                )}
                            </div>

                            {activeSession && (
                                <div className="mt-8">
                                    {hasAttended ? (
                                        <button
                                            disabled
                                            className="w-full py-3.5 bg-emerald-950/40 text-emerald-500 border border-emerald-500/20 rounded-xl text-xs font-bold uppercase tracking-wider"
                                        >
                                            ✓ হাজিরা মার্ক করা হয়েছে (Attendance Marked)
                                        </button>
                                    ) : timeRemaining > 0 ? (
                                        <button
                                            onClick={triggerGPSCheckIn}
                                            disabled={loading}
                                            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-98 disabled:opacity-50 transition-all duration-200"
                                        >
                                            {loading ? "হাজিরা যাচাই করা হচ্ছে..." : "Give Attendance (হাজিরা দিন)"}
                                        </button>
                                    ) : (
                                        <button
                                            disabled
                                            className="w-full py-3.5 bg-zinc-900 text-zinc-600 border border-zinc-800 rounded-xl text-xs font-bold uppercase"
                                        >
                                            সময়সীমা শেষ (Session Expired)
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Location Details & Simulator */}
                        <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-6">
                            <h3 className="text-sm font-bold text-zinc-200">📍 জিপিএস লোকেশন ভেরিফিকেশন ও সিমুলেশন</h3>

                            <div className="space-y-4">
                                <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-zinc-400">📍 GPS Geolocation</span>
                                        <button
                                            onClick={() => setMockGPS(!mockGPS)}
                                            className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all duration-200 ${mockGPS ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400"
                                                }`}
                                        >
                                            {mockGPS ? "Custom Simulator Active" : "Using Real Device GPS"}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wide">Latitude</span>
                                            <input
                                                type="number"
                                                step="0.000001"
                                                value={lat}
                                                disabled={!mockGPS}
                                                onChange={(e) => setLat(parseFloat(e.target.value))}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 disabled:opacity-60"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wide">Longitude</span>
                                            <input
                                                type="number"
                                                step="0.000001"
                                                value={lng}
                                                disabled={!mockGPS}
                                                onChange={(e) => setLng(parseFloat(e.target.value))}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 disabled:opacity-60"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wide">Accuracy (meters)</span>
                                            <input
                                                type="number"
                                                step="1"
                                                value={mockAccuracy}
                                                disabled={!mockGPS}
                                                onChange={(e) => setMockAccuracy(parseFloat(e.target.value))}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 disabled:opacity-60"
                                            />
                                        </div>
                                    </div>

                                    {!mockGPS && (
                                        <div className="text-[10px] text-zinc-400 flex items-center justify-between border-t border-zinc-850 pt-3">
                                            <span>Current Accuracy:</span>
                                            <span className={`font-bold ${mockAccuracy <= 30 ? "text-green-400" : "text-red-400"}`}>
                                                {Math.round(mockAccuracy)} meters {mockAccuracy <= 30 ? "✓ (Good)" : "✗ (Poor, >30m)"}
                                            </span>
                                        </div>
                                    )}

                                    {mockGPS && (
                                        <div className="text-[10px] text-zinc-500 border-t border-zinc-850 pt-3">
                                            Mymensingh Campus Reference Coordinates: <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-300">24.7654, 90.4014</code>.
                                            <br />
                                            (You can adjust these values to test distance failures &gt; 50 meters or accuracy failures &gt; 30 meters).
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-xl space-y-2 text-xs text-zinc-500">
                                    <p className="font-semibold text-zinc-400">🛡️ Device Security Guidelines:</p>
                                    <ul className="list-disc pl-4 space-y-1">
                                        <li>You are registered to one specific device ID. Switching accounts or devices requires manual reset from class coordinator.</li>
                                        <li>Multiple logins are monitored. Logging into a second device logs you out from the previous device session.</li>
                                        <li>Your IP Address, Browser name, and OS details are registered with each check-in for audit.</li>
                                    </ul>
                                </div>
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
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${log.status === "present"
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
                                    <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">ছুটির कारण (Reason)</label>
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
                                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${leave.status === "approved"
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
