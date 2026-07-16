export const TeacherFields = () => (
    <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
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
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Designation</label>
            <input
                type="text"
                name="designation"
                required
                placeholder="Enter Your Designation"
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-zinc-100 placeholder-zinc-600 transition-all duration-200"
            />
        </div>
        <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Subject</label>
            <input
                type="text"
                name="subject"
                required
                placeholder="Enter Your Subject"
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-zinc-100 placeholder-zinc-600 transition-all duration-200"
            />
        </div>
    </div>
);
