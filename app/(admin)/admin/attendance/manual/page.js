"use client";

import { useState } from "react";
import api from "@/components/api";

export default function ManualAttendance() {
    const [manualClass, setManualClass] = useState("BEd-2026");
    const [manualSection, setManualSection] = useState("A");
    const [manualSubject, setManualSubject] = useState("অ্যাডভান্স আইসিটি");
    const [manualDate, setManualDate] = useState(new Date().toISOString().slice(0, 10));
    const [students, setStudents] = useState([]);
    const [manualRecords, setManualRecords] = useState({}); // { studentId: status }
    const [manualLoading, setManualLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const subjects = [
        "অ্যাডভান্স আইসিটি",
        "মাধ্যমিক শিক্ষা",
        "সক্রিয় শিখন পদ্ধতি ও কৌশল",
        "শিখন ও শিখনযাচাই",
        "শিক্ষায় তথ্য ও যোগাযোগ পদ্ধতি"
    ];

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
        } catch (err) {
            setError(err.message || "ম্যানুয়াল হাজিরা সংরক্ষণ করতে ব্যর্থ হয়েছে।");
        } finally {
            setManualLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-8 text-zinc-100 font-sans">
            {/* Header */}
            <div className="border-b border-zinc-800/80 pb-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent sm:text-3xl">
                    📝 ম্যানুয়াল হাজিরা (Manual Attendance System)
                </h1>
                <p className="text-xs text-zinc-400 mt-1">
                    শিক্ষার্থীরা ডিভাইস ছাড়া উপস্থিত থাকলে সরাসরি হাজিরা সেভ করুন (GPS ভেরিফাইড হাজিরা সুরক্ষিত থাকবে)
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

            {/* Filter Setup */}
            <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            </div>

            {/* student checklist inputs */}
            {students.length > 0 && (
                <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-6">
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
                                                <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
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
    );
}