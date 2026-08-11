"use client";

import { useState } from "react";

export default function ReportDownload() {
    const [reportClass, setReportClass] = useState("BEd-2026");
    const [reportSection, setReportSection] = useState("All");
    const [reportSubject, setReportSubject] = useState("অ্যাডভান্স আইসিটি");
    const [reportFromDate, setReportFromDate] = useState(new Date().toISOString().slice(0, 10));
    const [reportToDate, setReportToDate] = useState(new Date().toISOString().slice(0, 10));

    const subjects = [
        "অ্যাডভান্স আইসিটি",
        "মাধ্যমিক শিক্ষা",
        "সক্রিয় শিখন পদ্ধতি ও কৌশল",
        "শিখন ও শিখনযাচাই",
        "শিক্ষায় তথ্য ও যোগাযোগ পদ্ধতি"
    ];

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

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-8 text-zinc-100 font-sans">
            {/* Header */}
            <div className="border-b border-zinc-800/80 pb-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent sm:text-3xl">
                    📥 রিপোর্ট এক্সপোর্ট সেন্টার (Download PDF & Excel Reports)
                </h1>
                <p className="text-xs text-zinc-400 mt-1">
                    ক্লাস, সেকশন, সাবজেক্ট ও ডেট ফিল্টার অনুযায়ী অফিশিয়াল উপস্থিতি রিপোর্ট ডাউনলোড করুন
                </p>
            </div>

            {/* Filter Selection */}
            <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-4">
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
            </div>

            {/* Export Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
                <button
                    onClick={() => handleDownloadReport("pdf")}
                    className="flex flex-col items-center justify-center p-8 bg-zinc-900/60 border border-zinc-800 hover:border-red-500/40 rounded-2xl group transition-all duration-350 hover:scale-102 hover:shadow-lg active:scale-99"
                >
                    <span className="text-5xl group-hover:scale-110 transition-transform duration-350">📄</span>
                    <span className="text-xs font-bold text-zinc-200 mt-4">PDF রিপোর্ট ডাউনলোড করুন</span>
                    <span className="text-[10px] text-zinc-500 mt-1">প্রিন্ট ও অফিশিয়াল ভেরিফিকেশনের জন্য সেরা</span>
                </button>

                <button
                    onClick={() => handleDownloadReport("excel")}
                    className="flex flex-col items-center justify-center p-8 bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/40 rounded-2xl group transition-all duration-350 hover:scale-102 hover:shadow-lg active:scale-99"
                >
                    <span className="text-5xl group-hover:scale-110 transition-transform duration-350">📊</span>
                    <span className="text-xs font-bold text-zinc-200 mt-4">EXCEL রিপোর্ট ডাউনলোড করুন</span>
                    <span className="text-[10px] text-zinc-500 mt-1">বিশ্লেষণ ও স্প্রেডশীট ম্যানেজমেন্টের জন্য সেরা</span>
                </button>
            </div>
        </div>
    );
}