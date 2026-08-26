import { useState, useEffect } from "react";
import { getSchemes, createScheme, updateScheme, deleteScheme } from "../api/schemeService";
import { useToast } from "../context/ToastContext";

const CATEGORIES = ["subsidy", "loan", "insurance", "training", "equipment", "other"];

export default function AdminSchemes() {
  const toast = useToast();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editScheme, setEditScheme] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "other",
    eligibility: "",
    benefits: "",
    howToApply: "",
    deadline: "",
    officialLink: "",
    tags: "", // user types comma separated
  });

  const fetchSchemes = async () => {
    setLoading(true);
    try {
      const data = await getSchemes();
      setSchemes(data.data || []);
    } catch {
      toast.error("Failed to load schemes");
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
        title: "", description: "", category: "other", eligibility: "",
        benefits: "", howToApply: "", deadline: "", officialLink: "", tags: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean) };
      if (!payload.deadline) delete payload.deadline;
      
      if (editScheme) {
        await updateScheme(editScheme._id, payload);
        toast.success("Scheme updated successfully");
      } else {
        await createScheme(payload);
        toast.success("Scheme created successfully");
      }
      setIsModalOpen(false);
      fetchSchemes();
    } catch {
      toast.error(editScheme ? "Failed to update scheme" : "Failed to create scheme");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this scheme?")) return;
    try {
      await deleteScheme(id);
      toast.success("Scheme deleted successfully");
      fetchSchemes();
    } catch {
      toast.error("Failed to delete scheme");
    }
  };

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-red-400 transition-all bg-white";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Manage Government Schemes</h2>
        <button
          onClick={() => handleOpenModal()}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer flex items-center gap-2"
        >
          <span className="text-lg">+</span> Add Scheme
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="animate-spin w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      ) : schemes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
          <p className="text-gray-500">No schemes found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Title", "Category", "Deadline", "Actions"].map((h) => (
                    <th key={h} className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {schemes.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{s.title}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[300px]">{s.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-purple-100 text-purple-700 capitalize">
                        {s.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {s.deadline ? new Date(s.deadline).toLocaleDateString("en-IN") : "No deadline"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal(s)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 cursor-pointer transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(s._id)}
                          className="text-xs font-semibold text-red-600 hover:text-red-800 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 cursor-pointer transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">{editScheme ? "Edit Scheme" : "Add Scheme"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Title *</label>
                <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description *</label>
                <textarea required rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className={inputCls}>
                    {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Deadline</label>
                  <input type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Eligibility</label>
                  <textarea rows={2} value={formData.eligibility} onChange={e => setFormData({...formData, eligibility: e.target.value})} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Benefits</label>
                  <textarea rows={2} value={formData.benefits} onChange={e => setFormData({...formData, benefits: e.target.value})} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">How to Apply</label>
                <textarea rows={2} value={formData.howToApply} onChange={e => setFormData({...formData, howToApply: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Official Link</label>
                <input type="url" value={formData.officialLink} onChange={e => setFormData({...formData, officialLink: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tags (comma separated)</label>
                <input value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} className={inputCls} placeholder="e.g. kisan, loan, fertilizer" />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm">{editScheme ? "Save Changes" : "Create Scheme"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
