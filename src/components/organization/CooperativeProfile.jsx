import { useState, useEffect } from "react";
import { authedRequest } from "../../api";

function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
      {message}
    </div>
  );
}

function FormField({ label, value, onChange, error, type = "text", maxLength }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">{label}</label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        className={`bg-white border rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30 ${
          error ? "border-red-400" : "border-gray-200"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function validateName(value) {
  if (!value || !value.trim()) return "Cooperative name is required.";
  return null;
}

function validateEmail(value) {
  if (!value) return null; // optional
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address.";
  return null;
}

const STATUS_BADGE = {
  pending: { label: "Pending approval", className: "bg-amber-100 text-amber-700 border-amber-200" },
  active: { label: "Active", className: "bg-[#e8f5e9] text-[#2e7d32] border-[#c8e6c9]" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700 border-red-200" },
};

export default function CooperativeProfile() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saved, setSaved] = useState(null);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const me = await authedRequest("/api/auth/me");
        if (cancelled) return;
        if (!me.cooperativeId) {
          setLoadError("No cooperative membership found on this account.");
          setLoading(false);
          return;
        }
        const coop = await authedRequest(`/api/cooperatives/${me.cooperativeId}`);
        if (cancelled) return;
        setSaved(coop);
        setForm(coop);
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Failed to load your data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Cooperative Profile</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">Loading profile…</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Cooperative Profile</h2>
        <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 text-sm">{loadError}</div>
      </div>
    );
  }

  const isDirty = JSON.stringify(form) !== JSON.stringify(saved);
  const status = STATUS_BADGE[form.status] || STATUS_BADGE.pending;

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleCancel() {
    setForm(saved);
    setErrors({});
  }

  async function handleSave() {
    const newErrors = {
      name: validateName(form.name),
      contactEmail: validateEmail(form.contactEmail),
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    setSaving(true);
    try {
      const updated = await authedRequest(`/api/cooperatives/${form._id}`, {
        method: "PATCH",
        body: {
          name: form.name,
          registrationNumber: form.registrationNumber,
          address: form.address,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone,
        },
      });
      setSaved(updated);
      setForm(updated);
      setToastMessage("Cooperative profile updated successfully");
    } catch (err) {
      setErrors({ name: err.message || "Something went wrong. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">Cooperative Profile</h2>
      <p className="mt-1 text-gray-500">Organization details and registration status</p>

      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-gray-900 font-semibold text-lg">Cooperative Details</h3>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${status.className}`}>{status.label}</span>
        </div>

        {form.status === "pending" && (
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            Your cooperative is still awaiting admin approval. You can edit these details in the meantime.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Cooperative Name" value={form.name} onChange={(v) => update("name", v)} error={errors.name} maxLength={100} />
          <FormField label="Registration No." value={form.registrationNumber} onChange={(v) => update("registrationNumber", v)} maxLength={30} />
          <FormField label="Address" value={form.address} onChange={(v) => update("address", v)} maxLength={150} />
          <FormField label="Contact Email" type="email" value={form.contactEmail} onChange={(v) => update("contactEmail", v)} error={errors.contactEmail} />
          <FormField label="Contact Phone" value={form.contactPhone} onChange={(v) => update("contactPhone", v)} maxLength={30} />
        </div>

        <div className="border-t border-gray-200 my-6" />

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={handleCancel}
            disabled={!isDirty}
            className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium px-5 py-2 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="bg-[#4f7331] hover:bg-[#3f6238] text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage("")} />}
    </div>
  );
}