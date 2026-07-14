"use client";

import { useEffect, useState, useRef } from "react";
import Navbar from "../../components/Navbar";
import api from "../../components/api";
import io from "socket.io-client";

export default function TeacherDashboard() {
    // Session state
    const [session, setSession] = useState(null); // active QR session details
    const [qrImage, setQrImage] = useState("");
    const [expiresAt, setExpiresAt] = useState(null);
    const [timeLeft, setTimeLeft] = useState(45);

    // Class start inputs
    const [cls, setCls] = useState("BEd-2026");
    const [section, setSection] = useState("A");
    const [subject, setSubject] = useState("Advance ICT");
    const [lat, setLat] = useState(23.8103); // Dhaka coordinates default
    const [lng, setLng] = useState(90.4125);

    // Manual Attendance / Logs state
    const [students, setStudents] = useState([]);
    const [manualRecords, setManualRecords] = useState({}); // { studentId: "present"|"absent"|"late" }
    const [dailyLogs, setDailyLogs] = useState([]);
    const [activeTab, setActiveTab] = useState("qr"); // qr, manual, reports

    // Socket / Timer references
    const socketRef = useRef(null);
    const timerRef = useRef(null);

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
                    console.log("GPS access denied, using Dhaka defaults");
                }
            );
        }
    }, []);

    // Clean up timers on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    // Set up timer for QR code rotation
    useEffect(() => {
        if (!session || !expiresAt) return;

        if (timerRef.current) clearInterval(timerRef.current);

        const updateTimer = () => {
            const now = new Date().getTime();
            const exp = new Date(expiresAt).getTime();
            const diff = Math.max(Math.floor((exp - now) / 1000), 0);
            setTimeLeft(diff);

            if (diff <= 0) {
                // Time's up! Rotate QR token
                rotateQR();
            }
        };

        updateTimer();
        timerRef.current = setInterval(updateTimer, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [session, expiresAt]);

    const startClassSession = async () => {
        setError("");
        setSuccess("");
        setLoading(true);
        try {
            const data = await api.post("/qr/start", {
                class: cls,
                section,
                subject,
                lat,
                lng
            });

            setSession({ sessionId: data.sessionId, class: cls, section, subject });
            setQrImage(data.qrDataUrl);
            setExpiresAt(data.expiresAt);
            setTimeLeft(data.rotateSeconds || 45);

            // Connect Socket.io & Join session room
            const socket = io("http://localhost:8000");
            socketRef.current = socket;
            socket.emit("session:join", data.sessionId);

            // Listen for QR code updates (in case another device triggers rotation)
            socket.on("qr:update", (update) => {
                setQrImage(update.qrDataUrl);
                setExpiresAt(update.expiresAt);
            });

            // Listen for real-time check-ins to update the local log
            socket.on("attendance:new", (log) => {
                setDailyLogs((prev) => [
                    {
                        student: { name: log.studentName, roll: log.roll },
                        checkInTime: new Date(),
                        status: log.status,
                        method: "qr",
                        _id: Math.random().toString()
                    },
                    ...prev
                ]);
            });

            setSuccess("Class session started! QR Code is active.");

            // Auto fetch daily report for this subject
            fetchDailyReport();
        } catch (err) {
            setError(err.message || "Failed to start class session.");
        } finally {
            setLoading(false);
        }
    };

    const rotateQR = async () => {
        if (!session) return;
        try {
            const data = await api.post(`/qr/${session.sessionId}/rotate`);
            setQrImage(data.qrDataUrl);
            setExpiresAt(data.expiresAt);
        } catch (err) {
            console.error("Error rotating QR:", err);
        }
    };

    const endClassSession = async () => {
        if (!session) return;
        setError("");
        setSuccess("");
        setLoading(true);
        try {
            await api.post(`/qr/${session.sessionId}/end`);
            setSession(null);
            setQrImage("");
            setExpiresAt(null);
            if (timerRef.current) clearInterval(timerRef.current);
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            setSuccess("Class ended successfully.");
        } catch (err) {
            setError(err.message || "Failed to end class session.");
        } finally {
            setLoading(false);
        }
    };

    const loadStudentList = async () => {
        setError("");
        setLoading(true);
        try {
            const studentList = await api.get(`/students?class=${cls}&section=${section}`);
            setStudents(studentList);

            // Set default status to present
            const records = {};
            studentList.forEach(s => {
                records[s._id] = "present";
            });
            setManualRecords(records);
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
            const recordsArray = Object.keys(manualRecords).map((id) => ({
                studentId: id,
                status: manualRecords[id]
            }));

            await api.post("/attendance/manual", {
                class: cls,
                section,
                subject,
                records: recordsArray
            });

            setSuccess("Manual attendance recorded successfully!");
            fetchDailyReport();
        } catch (err) {
            setError(err.message || "Failed to save attendance.");
        } finally {
            setLoading(false);
        }
    };

    const fetchDailyReport = async () => {
        try {
            const data = await api.get(`/attendance/daily-report?class=${cls}&section=${section}&subject=${subject}`);
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
                        ক্লাসের কিউআর কোড জেনারেট করুন, লাইভ হাজিরা দেখুন অথবা ম্যানুয়ালি হাজিরা গ্রহণ করুন
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-zinc-800/80 pb-0.5">
                    {["qr", "manual", "reports"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab);
                                if (tab === "manual") loadStudentList();
                                if (tab === "reports") fetchDailyReport();
                            }}
                            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all duration-200 ${activeTab === tab
                                ? "border-blue-500 text-blue-400"
                                : "border-transparent text-zinc-400 hover:text-zinc-200"
                                }`}
                        >
                            {tab === "qr" ? "📱 QR কোড হাজিরা" : tab === "manual" ? "✏️ ম্যানুয়াল হাজিরা" : "📄 আজকের হাজিরা রিপোর্ট"}
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

                {/* Tab: QR Code Session */}
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
                                        <option value="Advance ICT">Advance ICT</option>

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
                                        <span className="font-semibold text-zinc-200">{lat.toFixed(4)}° N, {lng.toFixed(4)}° E</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-500">শিক্ষার্থীর উপস্থিতি ভেরিফাই করতে এই অবস্থান ব্যবহৃত হবে (১০০মি ব্যাসার্ধ)।</p>
                                </div>

                                {session ? (
                                    <button
                                        onClick={endClassSession}
                                        disabled={loading}
                                        className="w-full bg-red-600 hover:bg-red-500 text-white rounded-xl py-3 text-xs font-semibold transition-all duration-200 shadow-lg shadow-red-500/10 active:scale-98"
                                    >
                                        ⏹ ক্লাস শেষ করুন (End Class)
                                    </button>
                                ) : (
                                    <button
                                        onClick={startClassSession}
                                        disabled={loading}
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 text-xs font-semibold transition-all duration-200 shadow-lg shadow-blue-500/10 active:scale-98"
                                    >
                                        ▶ ক্লাস শুরু করুন (Start Class)
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Center: Dynamic QR Code Display */}
                        <div className="lg:col-span-2 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl flex flex-col items-center justify-center min-h-[350px]">
                            {session ? (
                                <div className="text-center space-y-4">
                                    <div className="bg-zinc-950 p-2 rounded-2xl border border-zinc-800 shadow-inner inline-block">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={qrImage} alt="QR Code Session" className="w-64 h-64 mx-auto rounded-lg" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-zinc-200">মোবাইল দিয়ে হাজিরা মার্ক করতে স্ক্যান করুন</p>
                                        <div className="flex items-center justify-center gap-2 text-xs">
                                            <span className="h-2 w-2 rounded-full bg-green-500 animate-ping"></span>
                                            <span className="text-red-400 font-semibold">⏳ কোড পরিবর্তন হবে {timeLeft} সেকেন্ডে</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={rotateQR}
                                        className="text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-4 py-1.5 rounded-full font-semibold transition-all duration-200"
                                    >
                                        🔄 নতুন কিউআর কোড জেনারেট
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center text-zinc-500 space-y-2 py-12">
                                    <span className="text-6xl block">⬛</span>
                                    <h3 className="text-sm font-bold text-zinc-400">QR Code Session Active No</h3>
                                    <p className="text-xs text-zinc-500">ক্লাস শুরু করার পর এখানে অটোমেটিক রটেটিং কিউআর কোড প্রদর্শিত হবে।</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Tab: Manual Attendance */}
                {activeTab === "manual" && (
                    <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <h3 className="text-md font-bold text-zinc-200">
                                ✏️ ম্যানুয়াল হাজিরা তালিকা (Class {cls}-{section} / {subject})
                            </h3>
                            <button
                                onClick={submitManualAttendance}
                                disabled={students.length === 0 || loading}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl px-5 py-2.5 shadow-lg shadow-emerald-500/10 transition-all duration-200 hover:scale-103"
                            >
                                ✅ হাজিরা সংরক্ষণ করুন (Save Attendance)
                            </button>
                        </div>

                        {students.length === 0 ? (
                            <p className="text-zinc-500 text-center py-12 text-sm">কোনো শিক্ষার্থী পাওয়া যায়নি। ক্লাস এবং শাখা ভ্যালিড করুন।</p>
                        ) : (
                            <div className="overflow-x-auto">
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
                                                        {["present", "late", "absent"].map((status) => (
                                                            <button
                                                                key={status}
                                                                onClick={() => handleManualStatusChange(student._id, status)}
                                                                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize border transition-all duration-200 ${manualRecords[student._id] === status
                                                                    ? status === "present"
                                                                        ? "bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/5"
                                                                        : status === "late"
                                                                            ? "bg-yellow-500/15 border-yellow-500 text-yellow-400 shadow-md shadow-yellow-500/5"
                                                                            : "bg-red-500/15 border-red-500 text-red-400 shadow-md shadow-red-500/5"
                                                                    : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                                                                    }`}
                                                            >
                                                                {status}
                                                            </button>
                                                        ))}
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
                                        <th className="px-6 py-3">চেক-ইন সময়</th>
                                        <th className="px-6 py-3">পদ্ধতি (Method)</th>
                                        <th className="px-6 py-3">স্ট্যাটাস</th>
                                        <th className="px-6 py-3 text-right">পদক্ষেপ (Actions)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-850">
                                    {dailyLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-8 text-center text-zinc-500 text-xs">
                                                আজকের কোনো হাজিরা লগ পাওয়া যায়নি।
                                            </td>
                                        </tr>
                                    ) : (
                                        dailyLogs.map((log) => (
                                            <tr key={log._id} className="hover:bg-zinc-900/10">
                                                <td className="px-6 py-4 font-semibold text-zinc-200">{log.student?.name}</td>
                                                <td className="px-6 py-4 font-mono">{log.student?.roll}</td>
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
                                                                    onClick={() => editAttendanceRecord(log._id, st)}
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
