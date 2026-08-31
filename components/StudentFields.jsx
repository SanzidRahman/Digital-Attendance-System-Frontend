export const StudentFields = ({ name, onNameChange, year, onYearChange, nameError, roll, onRollChange, onRollBlur }) => (
    <>
        <div className="grid grid-cols-2 gap-4">

            {/* Name Input Field */}
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

            {/* Roll Input Field */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">রোল নম্বর (৩ ডিজিট)</label>
                <input
                    type="text"
                    name="roll"
                    required
                    inputMode="numeric"
                    maxLength={3}
                    value={roll}
                    onChange={(e) => onRollChange(e.target.value)}
                    onBlur={onRollBlur}
                    placeholder="যেমন: ১ বা ২৪"
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-zinc-100 placeholder-zinc-600 transition-all duration-200"
                />
            </div>


        </div>

        {/* Class And Section Input Field */}
        <div className="grid grid-cols-2 gap-4">

            <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">শ্রেণি (Class)</label>
                <select
                    name="class"
                    defaultValue="BEd"
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-zinc-100 placeholder-zinc-600 transition-all duration-200"
                >
                    <option value="BEd">BEd</option>
                    <option value="MEd">MEd</option>
                    <option value="BEd-Regular">BEd-Regular</option>
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

            <div className="space-y-2 col-span-2">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">শিক্ষাবর্ষ (৪ ডিজিট)</label>
                <input
                    type="text"
                    name="year"
                    required
                    inputMode="numeric"
                    minLength={4}
                    maxLength={4}
                    value={year}
                    onChange={(e) => onYearChange(e.target.value)}
                    placeholder="যেমন: 2026 (শিক্ষাবর্ষ ২০২৬)"
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-zinc-100 placeholder-zinc-600 transition-all duration-200"
                />
            </div>


        </div>
    </>
);
