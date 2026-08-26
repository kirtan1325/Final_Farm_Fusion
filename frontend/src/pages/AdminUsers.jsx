import { useState, useEffect } from "react";
import { getUsers, approveUser, suspendUser, deleteUser } from "../api/adminService";
import { useToast } from "../context/ToastContext";

const getInitials = (name = "") => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function AdminUsers() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRole, setUserRole] = useState("All");
  const [userStatus, setUserStatus] = useState("All");
  const [userLoading, setUserLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setUserLoading(true);
      try {
        const params = {};
        if (userRole !== "All") params.role = userRole.toLowerCase();
        if (userStatus !== "All") params.status = userStatus.toLowerCase();
        if (userSearch.trim()) params.search = userSearch.trim();
        const data = await getUsers(params);
        setUsers(data.data || []);
      } catch {
        /* silent */
      } finally {
        setUserLoading(false);
      }
    };
    const t = setTimeout(fetch, userSearch ? 400 : 0);
    return () => clearTimeout(t);
  }, [userRole, userStatus, userSearch]);

  const handleApprove = async (id) => {
    try {
      const data = await approveUser(id);
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, isActive: true } : u)));
      toast.success(`${data.data.name} approved!`);
    } catch {
      toast.error("Failed to approve");
    }
  };

  const handleSuspend = async (id) => {
    if (!window.confirm("Suspend this user?")) return;
    try {
      const data = await suspendUser(id);
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, isActive: false } : u)));
      toast.success(`${data.data.name} suspended`);
    } catch {
      toast.error("Failed to suspend");
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Permanently delete ${name}? This cannot be undone.`)) return;
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      toast.success("User deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const inputCls = "border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-red-400 transition-all bg-white";

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-gray-900">Manage Users</h2>
      <div className="flex flex-wrap gap-3">
        <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search by name or email..." className={`${inputCls} w-64`} />
        <select value={userRole} onChange={(e) => setUserRole(e.target.value)} className={`${inputCls} cursor-pointer`}>
          <option>All</option>
          <option value="farmer">Farmer</option>
          <option value="buyer">Buyer</option>
        </select>
        <select value={userStatus} onChange={(e) => setUserStatus(e.target.value)} className={`${inputCls} cursor-pointer`}>
          <option>All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      {userLoading ? (
        <div className="flex justify-center py-12">
          <svg className="animate-spin w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["User", "Role", "Location", "Joined", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-green-800 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {getInitials(u.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize ${u.role === "farmer" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{u.location || "—"}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{fmtDate(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {!u.isActive ? (
                            <button
                              onClick={() => handleApprove(u._id)}
                              className="text-xs font-semibold text-green-700 hover:text-green-900 border border-green-200 px-2 py-1 rounded-lg hover:bg-green-50 cursor-pointer transition-all"
                            >
                              Approve
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSuspend(u._id)}
                              className="text-xs font-semibold text-yellow-700 hover:text-yellow-900 border border-yellow-200 px-2 py-1 rounded-lg hover:bg-yellow-50 cursor-pointer transition-all"
                            >
                              Suspend
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(u._id, u.name)}
                            className="text-xs font-semibold text-red-600 hover:text-red-800 border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50 cursor-pointer transition-all"
                          >
                            Delete
                          </button>
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
    </div>
  );
}
