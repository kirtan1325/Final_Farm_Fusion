import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axiosInstance";

import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { Input } from "../components/ui/Input";

const SECTIONS = ["Profile", "Security"];

export default function Settings() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("Profile");

  const [name, setName] = useState(user?.name || "");
  const [farmName, setFarmName] = useState(user?.farmName || "");
  const [companyName, setCompanyName] = useState(user?.companyName || "");
  const [location, setLocation] = useState(user?.location || "");

  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const showMsg = (msg, isError = false) => {
    if (isError) setError(msg);
    else setSuccess(msg);
    setTimeout(() => {
      setSuccess("");
      setError("");
    }, 3000);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const body = { name, location };
      if (user?.role === "farmer") body.farmName = farmName;
      if (user?.role === "buyer") body.companyName = companyName;
      const { data } = await api.put("/users/profile", body);
      updateUser(data.user);
      showMsg("Profile updated successfully!");
    } catch (err) {
      showMsg(err.response?.data?.message || "Failed to update profile.", true);
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (!currentPass || !newPass || !confirmPass) {
      showMsg("Please fill all password fields.", true);
      return;
    }
    if (newPass !== confirmPass) {
      showMsg("New passwords do not match.", true);
      return;
    }
    if (newPass.length < 6) {
      showMsg("Password must be at least 6 characters.", true);
      return;
    }
    setSaving(true);
    try {
      await api.put("/users/password", { currentPassword: currentPass, newPassword: newPass });
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
      showMsg("Password changed successfully!");
    } catch (err) {
      showMsg(err.response?.data?.message || "Failed to change password.", true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      activePath={`/${user?.role}/settings`}
      user={user}
      onLogout={() => {
        logout();
        navigate("/login");
      }}
      title="Account Settings"
      subtitle="Manage profile info, security credentials, and account preferences."
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Alerts */}
        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-lg">
            ✅ {success}
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-lg">
            ⚠️ {error}
          </div>
        )}

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          {SECTIONS.map((sec) => (
            <button
              key={sec}
              onClick={() => setActiveSection(sec)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSection === sec
                  ? "bg-[#0F4C2A] text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {sec}
            </button>
          ))}
        </div>

        {activeSection === "Profile" ? (
          <Card>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>Update account information and location</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveProfile} className="space-y-4">
                <Input
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="Email Address"
                  value={user?.email || ""}
                  disabled
                  helperText="Email cannot be changed"
                />

                {user?.role === "farmer" ? (
                  <Input
                    label="Farm Name"
                    placeholder="Green Acres Organic Farm"
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                  />
                ) : (
                  <Input
                    label="Company Name"
                    placeholder="Fresh Produce Procurement Ltd."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                )}

                <Input
                  label="Primary Location"
                  placeholder="e.g. Anand, Gujarat"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />

                <div className="flex justify-end pt-2">
                  <Button type="submit" loading={saving}>
                    Save Profile Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Security & Password</CardTitle>
              <CardDescription>Update your account access password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={savePassword} className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  required
                />
                <Input
                  label="New Password"
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  required
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  required
                />

                <div className="flex justify-end pt-2">
                  <Button type="submit" loading={saving}>
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}