export const StudentFields = ({ name, onNameChange, nameError, roll, onRollChange, onRollBlur }) => (
    <>
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">পূর্ণ নাম (ইংরেজি)</label>
                <input
                    type="text"
                    name="name"
                    required
                    value={name}
                    onChange={onNameChange}
                    placeholder="আপনার নাম লিখুন (ইংরেজিতে)"
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-zinc-100 placeholder-zinc-600 transition-all duration-200"
                />
                {nameError && (
                    <p className="text-xs text-red-400 mt-1 font-semibold">{nameError}</p>
                )}
            </div>

            <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">রোল নম্বর (৩ ডিজিট)</label>
                <input
                    type="text"
                    name="roll"
                    required
                    value={roll}
                    onChange={(e) => onRollChange(e.target.value)}
                    onBlur={onRollBlur}
                    placeholder="যেমন: ১ বা ২৪"
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-zinc-100 placeholder-zinc-600 transition-all duration-200"
                />
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">শ্রেণি (Class)</label>
                <select
                    name="class"
                    defaultValue="BEd-2026"
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-zinc-100 placeholder-zinc-600 transition-all duration-200"
                >
                    <option value="BEd-2026">BEd-2026</option>
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