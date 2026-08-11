"use client";

import { useEffect, useState, useRef } from "react";
import Navbar from "../../components/Navbar";
import api from "../../components/api";
import io from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ||
    (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(/\/api\/?$/, "");

const getCurrentLocation = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
        reject(new Error("GPS is not supported by this browser."));
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
        () => reject(new Error("Location permission is required to start a class.")),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
});

export default function TeacherDashboard() {
    // Session state
    const [session, setSession] = useState(null); // active GPS session details
    const [timeLeft, setTimeLeft] = useState(180); // 3 minutes default

    // Class start inputs
    const [cls, setCls] = useState("BEd-2026");
    const [section, setSection] = useState("All");
    const [subject, setSubject] = useState("অ্যাডভান্স আইসিটি");
    const [lat, setLat] = useState(24.7654);
    const [lng, setLng] = useState(90.4014);

    // Subjects List
    const subjects = [
        "অ্যাডভান্স আইসিটি",
        "মাধ্যমিক শিক্ষা",
        "সক্রিয় শিখন পদ্ধতি ও কৌশল",
        "শিখন ও শিখনযাচাই",
        "শিক্ষায় তথ্য ও যোগাযোগ পদ্ধতি"
    ];

    // Dedicated Manual Attendance state
    const [manualClass, setManualClass] = useState("BEd-2026");
    const [manualSection, setManualSection] = useState("A");
    const [manualSubject, setManualSubject] = useState("অ্যাডভান্স আইসিটি");
    const [manualDate, setManualDate] = useState(new Date().toISOString().slice(0, 10));

    // Manual Attendance / Logs state
    const [students, setStudents] = useState([]);
    const [manualRecords, setManualRecords] = useState({}); // { studentId: "present"|"absent"|"late" }
    const [dailyLogs, setDailyLogs] = useState([]);
    const [activeTab, setActiveTab] = useState("qr"); // qr, manual, reports

    // Socket / Timer references
    const socketRef = useRef(null);
    const timerRef = useRef(null);
    const timeLeftRef = useRef(180);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Fetch GPS coordinates on mount
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLat(pos.coords.latitude);
                    setLng(pos.coords.longitude);
                },
                (err) => {
                    console.log("GPS access denied");
                }
            );
        }
    }, []);

    // Clean up timers and sockets on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    // Set up timer for attendance countdown
    useEffect(() => {
        if (!session) return;

        if (timerRef.current) clearInterval(timerRef.current);

        const updateTimer = () => {
            const remaining = Math.max(timeLeftRef.current - 1, 0);
            timeLeftRef.current = remaining;
            setTimeLeft(remaining);

            if (remaining <= 0) {
                if (timerRef.current) clearInterval(timerRef.current);
                setSuccess("Attendance session has closed automatically (3 minutes limit reached).");
            }
        };

        timerRef.current = setInterval(updateTimer, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [session]);

    const startClassSession = async () => {
        setError("");
        setSuccess("");
        setLoading(true);
        try {
            const location = await getCurrentLocation();
            setLat(location.lat);
            setLng(location.lng);

            const data = await api.post("/qr/start", {
                class: cls,
                section,
                subject,
                lat: location.lat,
                lng: location.lng
            });

            const duration = data.durationSeconds || 180;
            timeLeftRef.current = duration;
            setTimeLeft(duration);
            setSession({ sessionId: data.sessionId, class: cls, section, subject });

            // Connect Socket.io & Join session room
            const socket = io(SOCKET_URL);
            socketRef.current = socket;
            socket.emit("session:join", data.sessionId);

            socket.on("attendance:new", (log) => {
                setDailyLogs((prev) => [
                    {
                        student: { name: log.studentName, roll: log.roll },
                        checkInTime: new Date(),
                        status: log.status,
                        method: "gps",
                        _id: Math.random().toString()
                    },
                    ...prev
                ]);
            });

            setSuccess("GPS Attendance Session started! Students can now mark their attendance.");
            void fetchDailyReport();
        } catch (err) {
            setError(err.message || "Failed to start class session.");
        } finally {
            setLoading(false);
        }
    };

    const endClassSession = async () => {
        if (!session) return;
        const confirmed = window.confirm(
            "Close this attendance session? Students will no longer be able to check in."
        );
        if (!confirmed) return;

        setError("");
        setSuccess("");
        setLoading(true);
        try {
            await api.post(`/qr/${session.sessionId}/end`);
            setSession(null);
            timeLeftRef.current = 180;
            setTimeLeft(180);
            if (timerRef.current) clearInterval(timerRef.current);
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            setSuccess("Attendance session closed successfully.");
        } catch (err) {
            setError(err.message || "Failed to end class session.");
        } finally {
            setLoading(false);
        }
    };

    const loadStudentList = async () => {
        setError("");
        setSuccess("");
        setStudents([]);
        setLoading(true);
        try {
            // 1. Fetch student list
            const studentList = await api.get(
                `/students?class=${encodeURIComponent(manualClass)}&section=${encodeURIComponent(manualSection)}`
            );

            // 2. Fetch existing daily report to check GPS attendance status
            const report = await api.get(
                `/attendance/daily-report?class=${encodeURIComponent(manualClass)}&section=${encodeURIComponent(manualSection)}&subject=${encodeURIComponent(manualSubject)}&date=${manualDate}`
            );

            const markedMap = {};
            (report.records || []).forEach(r => {
                if (r.student) markedMap[r.student._id] = r;
            });

            // 3. Mark GPS checked-in students, and default others to absent
            const initialStatus = {};
            const updatedList = studentList.map(s => {
                const existing = markedMap[s._id];
                if (existing && existing.method === "gps") {
                    s.gpsCheckedIn = true;
                    s.existingStatus = existing.status;
                    initialStatus[s._id] = existing.status;
                } else if (existing && existing.method === "manual") {
                    s.existingStatus = existing.status;
                    initialStatus[s._id] = existing.status;
                } else {
                    initialStatus[s._id] = "absent"; // default to absent!
                }
                return s;
            });

            setStudents(updatedList);
            setManualRecords(initialStatus);
        } catch (err) {
            setError("Failed to load students list.");
        } finally {
            setLoading(false);
        }
    };

    const handleManualStatusChange = (studentId, status) => {
        setManualRecords((prev) => ({
            ...prev,
            [studentId]: status
        }));
    };

    const submitManualAttendance = async () => {
        setError("");
        setSuccess("");
        setLoading(true);
        try {
            // Filter out GPS checked-in students from manual submission array
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

            setSuccess("Manual attendance recorded successfully!");
            setStudents([]);
            setManualRecords({});
            void fetchDailyReport();
        } catch (err) {
            setError(err.message || "Failed to save attendance.");
        } finally {
            setLoading(false);
        }
    };

    const fetchDailyReport = async () => {
        try {
            const data = await api.get(`/attendance/daily-report?class=${encodeURIComponent(cls)}&section=${encodeURIComponent(section)}&subject=${encodeURIComponent(subject)}`);
            setDailyLogs(data.records);
        } catch (err) {
            console.error(err);
        }
    };

    const editAttendanceRecord = async (recordId, newStatus) => {
        try {
            await api.patch(`/attendance/${recordId}`, { status: newStatus });
            setDailyLogs((prev) =>
                prev.map((r) => (r._id === recordId ? { ...r, status: newStatus } : r))
            );
            setSuccess("Attendance updated successfully.");
        } catch (err) {
            setError("Failed to update attendance record.");
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
                <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-blue-600/5 blur-[120px] pointer-events-none"></div>

                {/* Header */}
                <div className="border-b border-zinc-800 pb-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent sm:text-3xl">
                        👨‍🏫 শিক্ষক প্যানেল (Teacher Dashboard)
                    </h1>
                    <p className="text-xs text-zinc-400 mt-1">
                        জিপিএস এবং ডিভাইস লক ভিত্তিক ক্লাস উপস্থিতি শুরু করুন এবং লাইভ হাজিরা মনিটর করুন
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-zinc-800/80 pb-0.5">
                    {["qr", "manual", "reports"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab);
                                setError("");
                                setSuccess("");
                                if (tab === "manual") void loadStudentList();
                                if (tab === "reports") void fetchDailyReport();
                            }}
                            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all duration-200 ${activeTab === tab
                                ? "border-blue-500 text-blue-400"
                                : "border-transparent text-zinc-400 hover:text-zinc-200"
                                }`}
                        >
                            {tab === "qr" ? "📱 GPS ভিত্তিক হাজিরা" : tab === "manual" ? "✏️ ম্যানুয়াল হাজিরা" : "📄 আজকের হাজিরা রিপোর্ট"}
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

                {/* Tab: GPS Session */}
                {activeTab === "qr" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Class Setup / Control panel */}
                        <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-6">
                            <h3 className="text-md font-bold text-zinc-200">📚 ক্লাস সেটআপ</h3>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">বিষয় (Subject)</label>
                                    <select
                                        disabled={!!session}
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                    >
                                        {subjects.map((sub, idx) => (
                                            <option key={idx} value={sub}>{sub}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">শ্রেণী (Class)</label>
                                        <select
                                            disabled={!!session}
                                            value={cls}
                                            onChange={(e) => setCls(e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                        >
                                            <option value="BEd-2026">BEd-2026</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">শাখা (Section)</label>
                                        <select
                                            disabled={!!session}
                                            value={section}
                                            onChange={(e) => setSection(e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                        >
                                            <option value="All">All Sections</option>
                                            <option value="A">Section A</option>
                                            <option value="B">Section B</option>
                                            <option value="C">Section C</option>
                                            <option value="D">Section D</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-850 text-[11px] text-zinc-400 space-y-1">
                                    <div className="flex justify-between">
                                        <span>📍 GPS Coordinates:</span>
                                        <span className="font-semibold text-zinc-200">
                                            {lat ? `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E` : "Detecting..."}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-zinc-500">শিক্ষার্থীর উপস্থিতি ভেরিফাই করতে এই অবস্থান ব্যবহৃত হবে (১০০মি ব্যাসার্ধ)।</p>
                                </div>

                                {session ? (
                                    <button
                                        onClick={endClassSession}
                                        disabled={loading}
                                        className="w-full bg-red-600 hover:bg-red-500 text-white rounded-xl py-3 text-xs font-semibold transition-all duration-200 shadow-lg shadow-red-500/10 active:scale-98"
                                    >
                                        ⏹ ক্লাস শেষ করুন (End Session)
                                    </button>
                                ) : (
                                    <button
                                        onClick={startClassSession}
                                        disabled={loading}
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 text-xs font-semibold transition-all duration-200 shadow-lg shadow-blue-500/10 active:scale-98"
                                    >
                                        ▶ হাজিরা শুরু করুন (Start Attendance)
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Center: GPS Active Session Status Display */}
                        <div className="lg:col-span-2 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-8 shadow-xl backdrop-blur-xl flex flex-col items-center justify-center min-h-[350px]">
                            {session ? (
                                <div className="text-center space-y-6 max-w-md w-full">
                                    <div className="w-32 h-32 mx-auto rounded-full border-4 border-dashed border-indigo-500 flex items-center justify-center animate-[spin_20s_linear_infinite]">
                                        <div className="w-24 h-24 rounded-full bg-indigo-600/10 flex items-center justify-center">
                                            <span className="text-3xl">📡</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-lg font-bold text-zinc-100">GPS Attendance is Running</h3>
                                        <p className="text-xs text-zinc-400">
                                            Students of Class <code className="bg-zinc-950 px-2 py-0.5 rounded text-indigo-400">{session.class}</code> section <code className="bg-zinc-950 px-2 py-0.5 rounded text-indigo-400">{session.section}</code> can mark check-in.
                                        </p>
                                    </div>

                                    <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between text-sm">
                                        <span className="text-zinc-500">Time Remaining:</span>
                                        <span className={`font-bold flex items-center gap-1.5 ${timeLeft <= 30 ? "text-red-400 animate-pulse" : "text-emerald-400"}`}>
                                            <span className="h-2 w-2 rounded-full bg-current animate-ping"></span>
                                            {timeLeft > 0 ? formatTimeRemaining(timeLeft) : "Expired"}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-left text-[11px] text-zinc-500 pt-2 border-t border-zinc-850">
                                        <div>
                                            <span className="block font-semibold text-zinc-400">GEOFENCE LIMIT:</span>
                                            Maximum 100 meters distance from center.
                                        </div>
                                        <div>
                                            <span className="block font-semibold text-zinc-400">DEVICE SECURITY:</span>
                                            Locked to unique device. Duplicate accounts blocked.
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-zinc-500 space-y-3 py-12">
                                    <span className="text-6xl block">📡</span>
                                    <h3 className="text-sm font-bold text-zinc-400">No Active Attendance Session</h3>
                                    <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                                        হাজিরা শুরু করার জন্য বাম পাশের সেটআপ ফরম থেকে বিষয় ও শাখা সিলেক্ট করে "হাজিরা শুরু করুন" বাটনে ক্লিক করুন।
                                        এতে ৩ মিনিটের জন্য জিপিএস ভিত্তিক হাজিরা চালু হবে।
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Tab: Manual Attendance */}
                {activeTab === "manual" && (
                    <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-850 pb-4">
                            <div>
                                <h3 className="text-md font-bold text-zinc-200">
                                    ✏️ ম্যানুয়াল হাজিরা মার্কিং (Manual Attendance System)
                                </h3>
                                <p className="text-[11px] text-zinc-500 mt-0.5">শিক্ষার্থীদের তালিকা লোড করে সরাসরি হাজিরা সংরক্ষণ করুন</p>
                            </div>
                        </div>

                        {/* Manual Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-4">
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

                        <div className="flex justify-start gap-3">
                            <button
                                onClick={loadStudentList}
                                disabled={loading}
                                className="bg-zinc-800 border border-zinc-700 hover:border-zinc-650 text-zinc-200 text-xs font-semibold rounded-xl px-5 py-2.5 transition-all duration-200"
                            >
                                👥 শিক্ষার্থীদের তালিকা লোড করুন
                            </button>
                            {students.length > 0 && (
                                <button
                                    onClick={submitManualAttendance}
                                    disabled={loading}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl px-5 py-2.5 shadow-lg shadow-emerald-500/10 transition-all duration-200 hover:scale-103"
                                >
                                    💾 হাজিরা সংরক্ষণ করুন (Save Attendance)
                                </button>
                            )}
                        </div>

                        {students.length === 0 ? (
                            <p className="text-zinc-500 text-center py-12 text-sm">কোনো শিক্ষার্থী লোড করা হয়নি। উপরের অপশন সিলেক্ট করে লোড বাটনে ক্লিক করুন।</p>
                        ) : (
                            <div className="overflow-x-auto border-t border-zinc-850 pt-4 mt-4">
                                <table className="w-full text-sm text-left text-zinc-400">
                                    <thead className="text-xs text-zinc-400 uppercase border-b border-zinc-850 bg-zinc-950/40">
                                        <tr>
                                            <th className="px-6 py-3">রোল</th>
                                            <th className="px-6 py-3">শিক্ষার্থীর নাম</th>
                                            <th className="px-6 py-3">স্টুডেন্ট আইডি</th>
                                            <th className="px-6 py-3 text-center">উপস্থিতি স্থিতি (Status)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-850">
                                        {students.map((student) => (
                                            <tr key={student._id} className="hover:bg-zinc-900/10">
                                                <td className="px-6 py-4 font-mono font-bold text-zinc-200">{student.roll}</td>
                                                <td className="px-6 py-4 font-semibold text-zinc-200">{student.name}</td>
                                                <td className="px-6 py-4 font-mono">{student.studentId}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center gap-2">
                                                        {student.gpsCheckedIn ? (
                                                            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                                📡 GPS Checked-In ({student.existingStatus.toUpperCase()})
                                                            </span>
                                                        ) : (
                                                            ["present", "late", "absent"].map((status) => (
                                                                <button
                                                                    key={status}
                                                                    onClick={() => handleManualStatusChange(student._id, status)}
                                                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize border transition-all duration-250 ${manualRecords[student._id] === status
                                                                        ? status === "present"
                                                                            ? "bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/5"
                                                                            : status === "late"
                                                                                ? "bg-yellow-500/15 border-yellow-500 text-yellow-400 shadow-md shadow-yellow-500/5"
                                                                                : "bg-red-500/15 border-red-500 text-red-400 shadow-md shadow-red-500/5"
                                                                        : "bg-zinc-950 border-zinc-850 text-zinc-500 hover:text-zinc-300"
                                                                        }`}
                                                                >
                                                                    {status}
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: Reports / Logs */}
                {activeTab === "reports" && (
                    <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800/80 pb-4">
                            <h3 className="text-md font-bold text-zinc-200">
                                📄 আজকের হাজিরা রেকর্ড ({subject} · Class {cls}-{section})
                            </h3>
                            <button
                                onClick={fetchDailyReport}
                                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 px-4 py-2 rounded-xl text-xs font-semibold"
                            >
                                🔄 রিলোড লগ
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-zinc-400">
                                <thead className="text-xs text-zinc-400 uppercase border-b border-zinc-850 bg-zinc-950/40">
                                    <tr>
                                        <th className="px-6 py-3">শিক্ষার্থী</th>
                                        <th className="px-6 py-3">রোল</th>
                                        <th className="px-6 py-3">সেকশন</th>
                                        <th className="px-6 py-3">চেক-ইন সময়</th>
                                        <th className="px-6 py-3">পদ্ধতি (Method)</th>
                                        <th className="px-6 py-3">স্ট্যাটাস</th>
                                        <th className="px-6 py-3 text-right">পদক্ষেপ (Actions)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-850">
                                    {dailyLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-8 text-center text-zinc-500 text-xs">
                                                আজকের কোনো হাজিরা লগ পাওয়া যায়নি।
                                            </td>
                                        </tr>
                                    ) : (
                                        dailyLogs.map((log) => (
                                            <tr key={log._id} className="hover:bg-zinc-900/10">
                                                <td className="px-6 py-4 font-semibold text-zinc-200">{log.student?.name}</td>
                                                <td className="px-6 py-4 font-mono">{log.student?.roll}</td>
                                                <td className="px-6 py-4 font-mono">{log.section}</td>
                                                <td className="px-6 py-4">
                                                    {log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}
                                                </td>
                                                <td className="px-6 py-4 uppercase text-xs tracking-wider font-semibold">{log.method}</td>
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
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-1.5">
                                                        {["present", "late", "absent"].map((st) => (
                                                            log.status !== st && (
                                                                <button
                                                                    key={st}
                                                                    onClick={() => void editAttendanceRecord(log._id, st)}
                                                                    className="px-2 py-0.5 text-[10px] rounded bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700"
                                                                >
                                                                    Make {st}
                                                                </button>
                                                            )
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
