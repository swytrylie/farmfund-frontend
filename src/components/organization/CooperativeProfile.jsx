import { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { validateDateEstablished } from "../../lib/validation";
import {
  getCooperativeProfile,
  saveCooperativeProfile,
} from "../../mocks/organization/orgCooperativeProfile.mock";

const NAME_REGEX = /^[a-zA-Z0-9\s.\-&]+$/;
const REG_NO_REGEX = /^[A-Z0-9-]+$/i;
const ADDRESS_REGEX = /^[a-zA-Z0-9\s,.\-]+$/;

function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#2d4027] text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium">
      <CheckCircle2 size={16} />
      {message}
    </div>
  );
}

function FormField({ label, value, onChange, error, type = "text", maxLength }) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
        {label} *
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        max={type === "date" ? new Date().toISOString().slice(0, 10) : undefined}
        className={`bg-[#f4f4f4] border rounded-xl px-4 py-2.5 text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30 ${
          error ? "border-red-400" : "border-gray-200"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function validateName(value) {
  if (!value.trim()) return "Cooperative name is required.";
  if (value.length > 100) return "Keep it under 100 characters.";
  if (!NAME_REGEX.test(value))
    return "Only letters, numbers, spaces, hyphens, periods, and ampersands allowed.";
  return null;
}

function validateRegistrationNo(value) {
  if (!value.trim()) return "Registration number is required.";
  if (value.length > 30) return "Keep it under 30 characters.";
  if (!REG_NO_REGEX.test(value))
    return "Use letters, numbers, and hyphens only (e.g., CDA-2015-00812).";
  return null;
}

function validateAddress(value) {
  if (!value.trim()) return "Address is required.";
  if (value.length > 150) return "Keep it under 150 characters.";
  if (!ADDRESS_REGEX.test(value))
    return "Only letters, numbers, spaces, commas, periods, and hyphens allowed.";
  return null;
}

export default function CooperativeProfile() {
  const [saved, setSaved] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    getCooperativeProfile().then((data) => {
      if (!cancelled) {
        setSaved(data);
        setForm(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Cooperative Profile</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">
          Loading profile…
        </div>
      </div>
    );
  }

  const isDirty = JSON.stringify(form) !== JSON.stringify(saved);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  // Live-restricted versions — strip forbidden characters as you type,
  // rather than only catching them after clicking Save. Each mirrors its
  // own field's regex exactly, so nothing can be typed that the submit-time
  // validation would reject anyway.
  function updateName(rawValue) {
    update("name", rawValue.replace(/[^a-zA-Z0-9\s.\-&]/g, ""));
  }

  function updateRegistrationNo(rawValue) {
    update("registrationNo", rawValue.replace(/[^A-Za-z0-9-]/g, ""));
  }

  function updateAddress(rawValue) {
    update("address", rawValue.replace(/[^a-zA-Z0-9\s,.\-]/g, ""));
  }

  function handleCancel() {
    setForm(saved);
    setErrors({});
  }

  async function handleSave() {
    const newErrors = {
      name: validateName(form.name),
      registrationNo: validateRegistrationNo(form.registrationNo),
      address: validateAddress(form.address),
      dateEstablished: validateDateEstablished(form.dateEstablished),
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    await saveCooperativeProfile(form);
    setSaved(form);
    setToastMessage("Cooperative profile updated successfully");
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">Cooperative Profile</h2>
      <p className="mt-1 text-gray-500">
        Organization details and registration status
      </p>

      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-gray-900 font-semibold text-lg">Farm Details</h3>
          <span className="bg-[#e8f5e9] text-[#2e7d32] text-xs font-semibold px-3 py-1 rounded-full border border-[#c8e6c9]">
            Verified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Cooperative Name"
            value={form.name}
            onChange={updateName}
            error={errors.name}
            maxLength={100}
          />
          <FormField
            label="Registration No."
            value={form.registrationNo}
            onChange={updateRegistrationNo}
            error={errors.registrationNo}
            maxLength={30}
          />
          <FormField
            label="Address"
            value={form.address}
            onChange={updateAddress}
            error={errors.address}
            maxLength={150}
          />
          <FormField
            label="Date Established"
            value={form.dateEstablished}
            onChange={(v) => update("dateEstablished", v)}
            error={errors.dateEstablished}
            type="date"
          />
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
            className="bg-[#c8e6c9] text-[#1b5e20] hover:bg-[#a5d6a7] font-semibold px-5 py-2 rounded-xl text-sm transition-colors"
          >
            Save changes
          </button>
        </div>
      </div>

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      )}
    </div>
  );
}