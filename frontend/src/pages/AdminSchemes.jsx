import { useState, useEffect } from "react";
import { getSchemes, createScheme, updateScheme, deleteScheme } from "../api/schemeService";
import { useToast } from "../context/ToastContext";

import Button from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import { Input, Select, Textarea } from "../components/ui/Input";
import EmptyState from "../components/ui/EmptyState";
import Skeleton from "../components/ui/Skeleton";

const CATEGORIES = ["subsidy", "loan", "insurance", "training", "equipment", "other"];

export default function AdminSchemes() {
  const toast = useToast();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editScheme, setEditScheme] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "other",
    eligibility: "",
    benefits: "",
    howToApply: "",
    deadline: "",
    officialLink: "",
    tags: "",
  });

  const fetchSchemes = async () => {
    setLoading(true);
    try {
      const data = await getSchemes();
      setSchemes(data.data || []);
    } catch (err) {
      toast.error("Failed to load schemes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, []);

  const handleOpenModal = (scheme = null) => {
    if (scheme) {
      setEditScheme(scheme);
      setFormData({
        title: scheme.title || "",
        description: scheme.description || "",
        category: scheme.category || "other",
        eligibility: scheme.eligibility || "",
        benefits: scheme.benefits || "",
        howToApply: scheme.howToApply || "",
        deadline: scheme.deadline ? scheme.deadline.split("T")[0] : "",
        officialLink: scheme.officialLink || "",
        tags: scheme.tags ? scheme.tags.join(", ") : "",
      });
    } else {
      setEditScheme(null);
      setFormData({
        title: "",
        description: "",
        category: "other",
        eligibility: "",
        benefits: "",
        howToApply: "",
        deadline: "",
        officialLink: "",
        tags: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
      };
      if (!payload.deadline) delete payload.deadline;

      if (editScheme) {
        await updateScheme(editScheme._id, payload);
        toast.success("Scheme updated successfully!");
      } else {
        await createScheme(payload);
        toast.success("Scheme created successfully!");
      }
      setIsModalOpen(false);
      fetchSchemes();
    } catch (err) {
      toast.error(editScheme ? "Failed to update scheme." : "Failed to create scheme.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this scheme?")) return;
    try {
      await deleteScheme(id);
      toast.success("Scheme deleted successfully.");
      fetchSchemes();
    } catch (err) {
      toast.error("Failed to delete scheme.");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle>Government Schemes Management</CardTitle>
          <CardDescription>Add, update, or remove official agricultural schemes and subsidies</CardDescription>
        </div>
        <Button onClick={() => handleOpenModal(null)} size="sm">
          + Add New Scheme
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : schemes.length === 0 ? (
          <EmptyState
            icon={() => <span className="text-3xl">🏛️</span>}
            title="No schemes cataloged"
            description="Create your first government scheme listing above."
            actionLabel="+ Add New Scheme"
            onAction={() => handleOpenModal(null)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500 tracking-wider">
                  <th className="px-5 py-3.5">Scheme Title</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Benefits</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schemes.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-900">{s.title}</td>
                    <td className="px-5 py-4">
                      <Badge variant="emerald">{s.category}</Badge>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 truncate max-w-xs">
                      {s.benefits || s.description}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenModal(s)}>
                          Edit
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(s._id)}>
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editScheme ? "Edit Scheme" : "Add Government Scheme"}
        subtitle="Catalog subsidy, loan, or insurance details"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Input
            label="Scheme Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.toUpperCase()}
              </option>
            ))}
          </Select>
          <Textarea
            label="Description"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
          <Input
            label="Benefits Summary"
            value={formData.benefits}
            onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
          />
          <Input
            label="Eligibility Criteria"
            value={formData.eligibility}
            onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
          />
          <Input
            label="Official Application URL"
            value={formData.officialLink}
            onChange={(e) => setFormData({ ...formData, officialLink: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Scheme</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
