import { useState, useEffect } from "react";
import {
  User,
  Home,
  FileText,
  Lock,
  Camera,
  Eye,
  EyeOff,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { getFarmProfile, saveFarmProfileSection, FARM_TYPE_OPTIONS, MEMBERSHIP_TYPE_OPTIONS } from "../../mocks/individual/farmProfile.mock";
import {
  validateFullName,
  validateEmail,
  validatePhone,
  validateNationalId,
  validateFarmName,
  validateLocation,
  validateFarmSize,
  validateFarmType,
  validateNewPassword,
  validateConfirmPassword,
  getPasswordStrength,
  calculateProfileStrength,
} from "../../lib/farmProfileValidation";

const TABS = [
  { key: "personal-info", label: "Personal Info", icon: User },
  { key: "farm-details", label: "Farm Details", icon: Home },
  { key: "registration", label: "Registration", icon: FileText },
  { key: "account-security", label: "Account & Security", icon: Lock },
];

// ---- Small shared pieces ----

function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium">
      <CheckCircle2 size={16} />
      {message}
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
      {children}
    </label>
  );
}

function TextField({ label, value, onChange, error, placeholder, type = "text" }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`bg-white border rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30 ${
          error ? "border-red-400" : "border-gray-200"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function SelectField({ label, value, onChange, options, error }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`bg-white border rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30 ${
          error ? "border-red-400" : "border-gray-200"
        }`}
      >
        <option value="" disabled>
          Select...
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function StatusBadge({ label, tone = "green" }) {
  const tones = {
    green: "bg-green-100 text-green-800",
    gray: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tones[tone]}`}>
      {label}
    </span>
  );
}

function FormActions({ onCancel, onSave, saveLabel = "Save changes" }) {
  return (
    <div className="mt-6 flex items-center gap-3">
      <button
        onClick={onSave}
        className="px-6 py-2.5 rounded-xl bg-[#4f7331] text-white text-sm font-semibold hover:bg-[#3f6238] transition-colors"
      >
        {saveLabel}
      </button>
      <button
        onClick={onCancel}
        className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}

// ---- Hero header ----

function ProfileHero({ profile, profileStrength, avatarUrl, onAvatarChange }) {
  return (
    <div className="bg-[#f9faf7] border border-gray-200 rounded-2xl p-6 shadow-sm mb-6 flex items-center justify-between flex-wrap gap-6">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="bg-black rounded-full w-16 h-16 flex items-center justify-center text-white text-xl font-bold">
              {profile.personalInfo.fullName
                .split(" ")
                .map((p) => p[0])
                .join("")
                .toUpperCase() || "?"}
            </div>
          )}

          {/* Clicking the camera badge opens the file picker via the hidden
              input below it — no separate modal needed, this is the
              standard "click an icon to upload" pattern. */}
          <label
            htmlFor="avatar-upload"
            className="absolute -bottom-1 -right-1 bg-white border border-gray-200 rounded-full p-1.5 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
            aria-label="Change profile picture"
          >
            <Camera size={12} className="text-gray-600" />
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onAvatarChange(e.target.files?.[0])}
          />
        </div>

        <div>
          <p className="font-bold text-gray-900 text-lg">
            {profile.personalInfo.fullName || "Unnamed"}
          </p>
          <p className="text-sm text-gray-600">
            {profile.farmDetails.farmName || "No farm name yet"}
          </p>
          <p className="text-xs text-gray-400">{profile.farmDetails.location}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {profile.statusPills.map((pill) => (
              <StatusBadge key={pill} label={pill} />
            ))}
          </div>
        </div>
      </div>

      <div className="w-full sm:w-56 shrink-0">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold text-gray-500 uppercase tracking-wider">
            Profile Strength
          </span>
          <span className="font-bold text-gray-900">{profileStrength}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#4f7331] rounded-full transition-all"
            style={{ width: `${profileStrength}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ---- Tab 1: Personal Info ----

function PersonalInfoTab({ saved, onSaveSection, showToast }) {
  const [draft, setDraft] = useState(saved);
  const [errors, setErrors] = useState({});

  useEffect(() => setDraft(saved), [saved]);

  function update(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleSave() {
    const newErrors = {
      fullName: validateFullName(draft.fullName),
      email: validateEmail(draft.email),
      phone: validatePhone(draft.phone),
      nationalId: validateNationalId(draft.nationalId),
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    onSaveSection("personalInfo", draft);
    showToast("Profile updated successfully!");
  }

  function handleCancel() {
    setDraft(saved);
    setErrors({});
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h3 className="font-bold text-gray-900 mb-4">Personal Info</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          label="Full Name"
          value={draft.fullName}
          onChange={(v) => update("fullName", v)}
          error={errors.fullName}
          placeholder="Juan Dela Cruz"
        />
        <TextField
          label="Email Address"
          type="email"
          value={draft.email}
          onChange={(v) => update("email", v)}
          error={errors.email}
          placeholder="you@example.com"
        />
        <TextField
          label="Phone Number"
          value={draft.phone}
          onChange={(v) => update("phone", v)}
          error={errors.phone}
          placeholder="09171234567"
        />
        <TextField
          label="National ID"
          value={draft.nationalId}
          onChange={(v) => update("nationalId", v)}
          error={errors.nationalId}
          placeholder="1234-5678-9012"
        />
      </div>
      <FormActions onCancel={handleCancel} onSave={handleSave} />
    </div>
  );
}

// ---- Tab 2: Farm Details ----

function FarmDetailsTab({ saved, onSaveSection, showToast }) {
  const [draft, setDraft] = useState(saved);
  const [errors, setErrors] = useState({});

  useEffect(() => setDraft(saved), [saved]);

  function update(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleSave() {
    const newErrors = {
      farmName: validateFarmName(draft.farmName),
      location: validateLocation(draft.location),
      farmSizeHectares: validateFarmSize(draft.farmSizeHectares),
      farmType: validateFarmType(draft.farmType),
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    onSaveSection("farmDetails", draft);
    showToast("Profile updated successfully!");
  }

  function handleCancel() {
    setDraft(saved);
    setErrors({});
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Farm Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            label="Farm Name"
            value={draft.farmName}
            onChange={(v) => update("farmName", v)}
            error={errors.farmName}
            placeholder="e.g., Dizon Family Farm"
          />
          <TextField
            label="Location"
            value={draft.location}
            onChange={(v) => update("location", v)}
            error={errors.location}
            placeholder="City, Province"
          />
          <TextField
            label="Total Farm Size (Hectares)"
            value={draft.farmSizeHectares}
            onChange={(v) => update("farmSizeHectares", v)}
            error={errors.farmSizeHectares}
            placeholder="2.5"
          />
          <SelectField
            label="Farm Type"
            value={draft.farmType}
            onChange={(v) => update("farmType", v)}
            options={FARM_TYPE_OPTIONS}
            error={errors.farmType}
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Current Operations</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            label="Primary Crops"
            value={draft.primaryCrops}
            onChange={(v) => update("primaryCrops", v)}
            placeholder="Rice, yellow corn, ampalaya"
          />
          <TextField
            label="Livestock (Optional)"
            value={draft.livestock}
            onChange={(v) => update("livestock", v)}
            placeholder="e.g., Carabao, chickens"
          />
        </div>
      </div>

      <FormActions onCancel={handleCancel} onSave={handleSave} />
    </div>
  );
}

// ---- Tab 3: Registration & Compliance ----

function RegistrationTab({ saved, onSaveSection, showToast }) {
  const [draft, setDraft] = useState(saved);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => setDraft(saved), [saved]);

  function update(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }
  function updateNested(field, subfield, value) {
    setDraft((prev) => ({
      ...prev,
      [field]: { ...prev[field], [subfield]: value },
    }));
  }

  function handleFiles(files) {
    if (!files || !files[0]) return;
    setDraft((prev) => ({
      ...prev,
      documents: [...prev.documents, { name: files[0].name, verified: false }],
    }));
  }

  function handleSave() {
    onSaveSection("registration", draft);
    showToast("Profile updated successfully!");
  }

  function handleCancel() {
    setDraft(saved);
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">
          Registration & Compliance
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            label="KFA Registration No."
            value={draft.kfaRegNo}
            onChange={(v) => update("kfaRegNo", v)}
            placeholder="KFA-2021-NAK-00342"
          />
          <TextField
            label="RSBSA / Farmer ID No."
            value={draft.rsbsaId}
            onChange={(v) => update("rsbsaId", v)}
            placeholder="01-23-45-678-000123"
          />
          <TextField
            label="Registered Since"
            value={draft.registeredSince}
            onChange={(v) => update("registeredSince", v)}
            placeholder="March 2021"
          />
          <SelectField
            label="Membership Type"
            value={draft.membershipType}
            onChange={(v) => update("membershipType", v)}
            options={MEMBERSHIP_TYPE_OPTIONS}
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Certifications</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <StatusBadge label={draft.philGap.status} />
            <input
              type="text"
              value={draft.philGap.idNumber}
              onChange={(e) => updateNested("philGap", "idNumber", e.target.value)}
              placeholder="PhilGAP ID number"
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
            />
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge label={draft.landTitle.status} />
            <input
              type="text"
              value={draft.landTitle.registryNumber}
              onChange={(e) =>
                updateNested("landTitle", "registryNumber", e.target.value)
              }
              placeholder="Registry number"
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
            />
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge label={draft.organicCert.status} tone="gray" />
            <span className="text-sm text-gray-400">Organic Certification</span>
          </div>
          <TextField
            label="Cooperative Standing"
            value={draft.coopStanding}
            onChange={(v) => update("coopStanding", v)}
            placeholder="e.g., Active, in good standing"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Supporting Documents</h3>
        <div className="space-y-2 mb-4">
          {draft.documents.map((doc) => (
            <div
              key={doc.name}
              className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5"
            >
              <span className="text-sm text-gray-700">{doc.name}</span>
              {doc.verified ? (
                <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 size={12} />
                  Verified
                </span>
              ) : (
                <span className="text-xs text-amber-600">Pending review</span>
              )}
            </div>
          ))}
        </div>

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={`block border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-green-500 bg-green-50"
              : "border-green-300 bg-[#f7faf6]"
          }`}
        >
          <UploadCloud size={22} className="mx-auto text-green-600" />
          <p className="mt-2 text-sm text-gray-700">
            Click to upload or drag & drop
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            PDF, JPG, PNG up to 5MB
          </p>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      </div>

      <FormActions onCancel={handleCancel} onSave={handleSave} />
    </div>
  );
}

// ---- Tab 4: Account & Security ----

function AccountSecurityTab({ saved, onSaveSection, showToast }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [loginAlerts, setLoginAlerts] = useState(saved.loginAlertsEnabled);
  const [confirmAction, setConfirmAction] = useState(null); // "deactivate" | "delete" | null

  const strength = getPasswordStrength(newPassword);
  const strengthColors = ["bg-gray-200", "bg-red-400", "bg-amber-400", "bg-green-500"];

  function handleUpdatePassword() {
    const newErrors = {
      currentPassword: !currentPassword ? "Current password is required." : null,
      newPassword: validateNewPassword(newPassword),
      confirmPassword: validateConfirmPassword(confirmPassword, newPassword),
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    // TODO: replace with a real password-change API call once the backend exists
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    showToast("Profile updated successfully!");
  }

  function handleToggleLoginAlerts() {
    const next = !loginAlerts;
    setLoginAlerts(next);
    onSaveSection("security", { loginAlertsEnabled: next });
  }

  function handleConfirmDangerAction() {
    // TODO: wire up real account deactivation/deletion once the backend
    // exists. This is a demo — nothing is actually deactivated or deleted.
    showToast(
      confirmAction === "delete"
        ? "(Demo) Account deletion would happen here."
        : "(Demo) Account deactivation would happen here."
    );
    setConfirmAction(null);
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Change Password</h3>
        <div className="space-y-4">
          <div>
            <FieldLabel>Current Password</FieldLabel>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={`bg-white border rounded-xl px-4 py-2.5 pr-10 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30 ${
                  errors.currentPassword ? "border-red-400" : "border-gray-200"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-1 text-xs text-red-500">{errors.currentPassword}</p>
            )}
          </div>

          <div>
            <FieldLabel>New Password</FieldLabel>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`bg-white border rounded-xl px-4 py-2.5 pr-10 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30 ${
                  errors.newPassword ? "border-red-400" : "border-gray-200"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNew((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {newPassword && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${
                        i <= strength.score ? strengthColors[strength.score] : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-500">{strength.label}</p>
              </div>
            )}
            {errors.newPassword && (
              <p className="mt-1 text-xs text-red-500">{errors.newPassword}</p>
            )}
          </div>

          <div>
            <FieldLabel>Confirm New Password</FieldLabel>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`bg-white border rounded-xl px-4 py-2.5 pr-10 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30 ${
                  errors.confirmPassword ? "border-red-400" : "border-gray-200"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        <button
          onClick={handleUpdatePassword}
          className="mt-6 px-6 py-2.5 rounded-xl bg-[#4f7331] text-white text-sm font-semibold hover:bg-[#3f6238] transition-colors"
        >
          Update Password
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Login Security</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Login Alerts</p>
            <p className="text-xs text-gray-400">
              Get notified of new sign-ins to your account
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={loginAlerts}
            onClick={handleToggleLoginAlerts}
            className={`${
              loginAlerts ? "bg-[#4f7331]" : "bg-gray-300"
            } relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
          >
            <span
              aria-hidden="true"
              className={`${
                loginAlerts ? "translate-x-5" : "translate-x-0"
              } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </button>
        </div>
      </div>

      <div className="bg-white border border-red-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-red-700 mb-1">Danger Zone</h3>
        <p className="text-xs text-gray-500 mb-4">
          These actions are difficult or impossible to undo.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setConfirmAction("deactivate")}
            className="px-5 py-2.5 rounded-xl bg-red-100 text-red-700 text-sm font-semibold hover:bg-red-200 transition-colors"
          >
            Deactivate Account
          </button>
          <button
            onClick={() => setConfirmAction("delete")}
            className="px-5 py-2.5 rounded-xl bg-red-200 text-red-800 text-sm font-semibold hover:bg-red-300 transition-colors"
          >
            Delete Account
          </button>
        </div>
      </div>

      {confirmAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setConfirmAction(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle size={20} />
              <h3 className="font-bold">
                {confirmAction === "delete"
                  ? "Delete your account?"
                  : "Deactivate your account?"}
              </h3>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {confirmAction === "delete"
                ? "This permanently removes your account and all farm data. This cannot be undone."
                : "Your account will be temporarily disabled until you log back in."}
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-5 py-2 rounded-xl border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDangerAction}
                className="px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                {confirmAction === "delete" ? "Delete" : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Main component ----

export default function FarmProfile({ user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal-info");
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    getFarmProfile(user).then((data) => {
      if (!cancelled) {
        setProfile(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user?.firstName, user?.lastName]);

  async function handleSaveSection(section, sectionData) {
    await saveFarmProfileSection(); // simulated network call
    setProfile((prev) => ({ ...prev, [section]: sectionData }));
  }

  function showToast(message) {
    setToastMessage(message);
  }

  // Local-only image preview — there's no backend yet to actually store an
  // uploaded photo, so this uses the browser's own file preview mechanism.
  // It'll look and work correctly, but won't survive a page refresh until
  // a real upload endpoint exists to swap this for.
  const [avatarUrl, setAvatarUrl] = useState(null);

  function handleAvatarChange(file) {
    if (!file) return;
    // Release the previous preview URL before creating a new one, so we
    // don't leak memory if someone changes the photo multiple times.
    if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    setAvatarUrl(URL.createObjectURL(file));
  }

  useEffect(() => {
    // Clean up the preview URL when the whole page unmounts
    return () => {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    };
  }, [avatarUrl]);

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Farm Profile</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">
          Loading profile…
        </div>
      </div>
    );
  }

  const profileStrength = calculateProfileStrength(profile);

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Farm Profile</h2>

      <ProfileHero
        profile={profile}
        profileStrength={profileStrength}
        avatarUrl={avatarUrl}
        onAvatarChange={handleAvatarChange}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sub-sidebar */}
        <div className="lg:col-span-1 space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm text-left transition-colors ${
                  isActive
                    ? "bg-[#4f7331] text-white font-semibold"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="lg:col-span-3">
          {activeTab === "personal-info" && (
            <PersonalInfoTab
              saved={profile.personalInfo}
              onSaveSection={handleSaveSection}
              showToast={showToast}
            />
          )}
          {activeTab === "farm-details" && (
            <FarmDetailsTab
              saved={profile.farmDetails}
              onSaveSection={handleSaveSection}
              showToast={showToast}
            />
          )}
          {activeTab === "registration" && (
            <RegistrationTab
              saved={profile.registration}
              onSaveSection={handleSaveSection}
              showToast={showToast}
            />
          )}
          {activeTab === "account-security" && (
            <AccountSecurityTab
              saved={profile.security}
              onSaveSection={handleSaveSection}
              showToast={showToast}
            />
          )}
        </div>
      </div>

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      )}
    </div>
  );
}