import { StudentFields } from "./StudentFields";
import { TeacherFields } from "./TeacherFields";

export const RegisterForm = ({ onSubmit, role, loading, error }) => (
    <form onSubmit={onSubmit} className="space-y-6">
        {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm flex items-center gap-3">
                <span>⚠️</span>
                <p>{error}</p>
            </div>
        )}


        {/* Role-specific fields */}
        {role === "student" && <StudentFields />}
        {role === "teacher" && <TeacherFields />}
        {/* Parent registration would need its own fields, omitted for demo */}

        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">ইমেইল এড্রেস</label>
                <input
                    type="email"
                    name="email"
                    required
                    placeholder="email@example.com"
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-zinc-100 placeholder-zinc-600 transition-all duration-200"
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">পাসওয়ার্ড</label>
                <input
                    type="password"
                    name="password"
                    required
                    placeholder="••••••••"
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-zinc-100 placeholder-zinc-600 transition-all duration-200"
                />
            </div>
        </div>



        <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl text-sm font-semibold tracking-wide text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 flex justify-center items-center gap-2 border border-blue-500/20 active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
        >
            {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
                "নিবন্ধন করুন (Register)"
            )}
        </button>
    </form>
);