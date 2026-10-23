import { Eye, EyeOff, Edit3 } from "lucide-react";
import PhoneNumberInput from "../../../components/PhoneNumberInput";

export default function AccountDetailsPage({
  profile,
  isEditing,
  setIsEditing,
  editForm,
  setEditForm,
  onProfileSave,
  showPassword,
  setShowPassword,
}) {
  return (
    <div className="bg-white border border-[#E6DED4]/40 rounded-[4px] p-6 sm:p-8 shadow-xs relative">
      <div className="flex items-center justify-between border-b border-[#E6DED4]/60 pb-4 mb-6">
        <h3 className="font-serif text-[18px] font-normal tracking-wide text-[#1C1916]">
          Account Details
        </h3>
        {!isEditing && (
          <button
            onClick={() => {
              setEditForm({ ...profile });
              setIsEditing(true);
            }}
            className="p-1.5 text-[#8A857E] hover:text-[#B58A5B] transition-colors cursor-pointer"
            aria-label="Edit account details"
          >
            <Edit3 size={15} />
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={onProfileSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#6B6560] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                className="w-full p-3 bg-white border border-[#E6DED4] rounded-[2px] font-sans text-[12.5px] focus:outline-none focus:border-[#B58A5B]"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#6B6560] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
                className="w-full p-3 bg-white border border-[#E6DED4] rounded-[2px] font-sans text-[12.5px] focus:outline-none focus:border-[#B58A5B]"
              />
            </div>
            <PhoneNumberInput
              countryCode={editForm.countryCode}
              phone={editForm.phone}
              onCountryChange={(countryCode) =>
                setEditForm({ ...editForm, countryCode })
              }
              onPhoneChange={(phone) => setEditForm({ ...editForm, phone })}
              label="Phone Number"
              required={false}
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-[#E6DED4] text-[10px] font-semibold tracking-wider uppercase rounded-[2px] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#1C1916] hover:bg-[#B58A5B] text-white text-[10px] font-semibold tracking-wider uppercase rounded-[2px] transition-colors cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-4 items-start gap-1 py-1">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-[#8A857E]">
              Name
            </span>
            <span className="font-sans text-[13.5px] font-normal text-[#1C1916] md:col-span-3">
              {profile.name}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 items-start gap-1 py-1 border-t border-[#E6DED4]/20 pt-4">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-[#8A857E]">
              Email
            </span>
            <span className="font-sans text-[13.5px] font-normal text-[#1C1916] md:col-span-3">
              {profile.email}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 items-start gap-1 py-1 border-t border-[#E6DED4]/20 pt-4">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-[#8A857E]">
              Phone
            </span>
            <span className="font-sans text-[13.5px] font-normal text-[#1C1916] md:col-span-3">
              {profile.phone || "Not added"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
