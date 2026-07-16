export const StudentFields = () => (
    <>
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">পূর্ণ নাম</label>
                <input
                    type="text"
                    name="name"
                    required
                    placeholder="আপনার নাম লিখুন"
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-zinc-100 placeholder-zinc-600 transition-all duration-200"
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">রোল নম্বর</label>
                <input
                    type="text"
                    name="roll"
                    required
                    placeholder="Enter Your Roll Number"
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-zinc-100 placeholder-zinc-600 transition-all duration-200"
                />
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">শ্রেণী (Class)</label>
                <select
                    name="class"
                    defaultValue="BEd-2026"
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-zinc-100 placeholder-zinc-600 transition-all duration-200"
                >
                    <option value="BEd-2026">BEd-2026</option>
                    {/* Add other classes if needed */}
                </select>
            </div>
            <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">শাখা (Section)</label>
                <select
                    name="section"
                    defaultValue="A"
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-zinc-100 placeholder-zinc-600 transition-all duration-200"
                >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                </select>
            </div>
        </div>
    </>
);