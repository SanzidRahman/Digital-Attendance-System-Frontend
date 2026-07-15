export const RoleSelector = ({ role, setRole, isRegister, setIsRegister }) => {
    const roles = ["student", "teacher", "parent", "admin"];
    const labels = { student: "ছাত্র", teacher: "শিক্ষক", admin: "এডমিন" };

    return (
        <div className="flex rounded-lg bg-zinc-900/60 p-1 border border-zinc-800 backdrop-blur-md">
            {roles.map((r) => (
                <button
                    key={r}
                    type="button"
                    onClick={() => {
                        setRole(r);
                        // Parent registration is not fully supported; fallback to login
                        if (isRegister && r === "parent") setIsRegister(false);
                    }}
                    className={`flex-1 rounded-md py-1.5 text-xs font-semibold capitalize tracking-wide transition-all duration-300 ${role === r
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                        }`}
                >
                    {labels[r]}
                </button>
            ))}
        </div>
    );
};