import { useState, useEffect } from "react";
import { getUsers, approveUser, suspendUser, deleteUser } from "../api/adminService";
import { useToast } from "../context/ToastContext";

import Button from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { Input, Select } from "../components/ui/Input";
import EmptyState from "../components/ui/EmptyState";
import Skeleton from "../components/ui/Skeleton";

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
      } catch (err) {
        console.error("Admin users fetch error:", err);
      } finally {
        setUserLoading(false);
      }
    };
    const timer = setTimeout(fetch, userSearch ? 400 : 0);
    return () => clearTimeout(timer);
  }, [userRole, userStatus, userSearch]);

  const handleApprove = async (id) => {
    try {
      const data = await approveUser(id);
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, isActive: true } : u)));
      toast.success(`${data.data.name} approved!`);
    } catch (err) {
      toast.error("Failed to approve user.");
    }
  };

  const handleSuspend = async (id) => {
    if (!window.confirm("Suspend this user account?")) return;
    try {
      const data = await suspendUser(id);
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, isActive: false } : u)));
      toast.success(`${data.data.name} suspended.`);
    } catch (err) {
      toast.error("Failed to suspend user.");
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Permanently delete user ${name}?`)) return;
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      toast.success("User account deleted.");
    } catch (err) {
      toast.error("Failed to delete user.");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle>User Account Administration</CardTitle>
          <CardDescription>Review registered farmers, buyers, and account statuses</CardDescription>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Input
            placeholder="Search name, email..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="w-48 text-xs py-1.5"
          />
          <Select
            value={userRole}
            onChange={(e) => setUserRole(e.target.value)}
            className="w-32 text-xs py-1.5"
          >
            <option value="All">All Roles</option>
            <option value="farmer">Farmer</option>
            <option value="buyer">Buyer</option>
          </Select>
          <Select
            value={userStatus}
            onChange={(e) => setUserStatus(e.target.value)}
            className="w-32 text-xs py-1.5"
          >
            <option value="All">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {userLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={() => <span className="text-3xl">👥</span>}
            title="No user accounts found"
            description="Try clearing your search query or role filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500 tracking-wider">
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Location</th>
                  <th className="px-5 py-3.5">Joined</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-bold text-slate-900">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="emerald">{u.role}</Badge>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{u.location || "Not specified"}</td>
                    <td className="px-5 py-4 text-slate-500 text-xs">{fmtDate(u.createdAt)}</td>
                    <td className="px-5 py-4">
                      <Badge variant={u.isActive !== false ? "success" : "danger"}>
                        {u.isActive !== false ? "Active" : "Suspended"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {u.isActive === false ? (
                          <Button variant="secondary" size="sm" onClick={() => handleApprove(u._id)}>
                            Approve
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => handleSuspend(u._id)}>
                            Suspend
                          </Button>
                        )}
                        <Button variant="danger" size="sm" onClick={() => handleDeleteUser(u._id, u.name)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
