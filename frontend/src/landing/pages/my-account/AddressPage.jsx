import { useState } from "react";
import { Pencil, Trash2, Plus, MapPin, AlertCircle, X } from "lucide-react";

export const INITIAL_ADDRESSES = [
  {
    id: 1,
    name: "Devyansh Grover",
    phone: "+91 98765 43210",
    lines: [
      "A-204, Green View Apartments,",
      "Sector 21, Faridabad",
      "Haryana - 121001, India",
    ],
    isDefault: true,
  },
  {
    id: 2,
    name: "Devyansh Grover",
    phone: "+91 98765 43210",
    lines: [
      "B-12, Surya Nagar,",
      "Near City Park, New Delhi",
      "Delhi - 110024, India",
    ],
    isDefault: false,
  },
  {
    id: 3,
    name: "Devyansh Grover",
    phone: "+91 98765 43210",
    lines: [
      "Flat 5C, Ocean View Residency,",
      "Marine Drive, Kochi",
      "Kerala - 682031, India",
    ],
    isDefault: false,
  },
];

export default function AddressesSection({
  addresses = INITIAL_ADDRESSES,
  onDeleteAddress,
  onAddAddress,
  onEditAddress,
  onSetDefault,
}) {
  const [addressToDelete, setAddressToDelete] = useState(null);

  const confirmDelete = () => {
    if (addressToDelete && onDeleteAddress) {
      onDeleteAddress(addressToDelete);
    }
    setAddressToDelete(null);
  };

  const handleSetDefault = (id) => {
    if (onSetDefault) {
      onSetDefault(id);
    }
  };

  return (
    <div className="bg-white border border-[#E6DED4]/40 rounded-[4px] p-6 sm:p-8 shadow-xs">
      <div className="flex items-center justify-between border-b border-[#E6DED4]/60 pb-4 mb-6">
        <h3 className="font-serif text-[18px] font-normal tracking-wide text-[#1C1916] flex items-center gap-2.5">
          <MapPin size={16} className="text-[#B58A5B]" /> Saved Addresses
        </h3>
        <button
          onClick={onAddAddress}
          className="flex items-center gap-2 bg-[#F3EAE0] text-[#1C1916] text-[11px] font-semibold tracking-wide uppercase px-4 py-2.5 rounded-[2px] whitespace-nowrap hover:bg-[#ECDFCF] transition-colors cursor-pointer"
        >
          <Plus size={13} strokeWidth={2} />
          Add Address
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {addresses.map((addr) => (
          <div
            key={addr._id || addr.id}
            className="bg-white border border-[#ECE4D8] rounded-lg p-6 flex flex-col"
          >
            <div className="flex items-start justify-between mb-4 min-h-[26px]">
              {addr.isDefault ? (
                <span className="text-[11px] tracking-wide font-medium text-[#B08655] bg-[#F6EEE2] px-3 py-1 rounded-full">
                  Default
                </span>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-3 text-[#8A857E]">
                <button
                  onClick={() => onEditAddress?.(addr._id || addr.id)}
                  className="hover:text-[#1C1916] transition-colors cursor-pointer"
                  aria-label="Edit address"
                >
                  <Pencil size={15} strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => setAddressToDelete(addr._id || addr.id)}
                  className="hover:text-[#C0554A] transition-colors cursor-pointer"
                  aria-label="Delete address"
                >
                  <Trash2 size={15} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            <p className="text-[16px] font-medium text-[#1C1916] mb-2">
              {addr.recipientName || addr.name}
            </p>
            <p className="text-[14px] text-[#3D3833] mb-4">{addr.phone}</p>

            <div className="text-[14px] text-[#3D3833] leading-relaxed flex-1">
              {addr.lines ? (
                addr.lines.map((line, i) => (
                  <p key={i}>{line}</p>
                ))
              ) : (
                <>
                  <p>{addr.addressLine}</p>
                  {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                  <p>{addr.city}, {addr.state} - {addr.postalCode}</p>
                  <p>{addr.country}</p>
                </>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#ECE4D8] flex justify-center">
              {addr.isDefault ? (
                <span className="flex items-center gap-1.5 text-[13px] text-[#7A7368]">
                  <MapPin size={13} strokeWidth={1.5} />
                  Default Address
                </span>
              ) : (
                <button
                  onClick={() => handleSetDefault(addr._id || addr.id)}
                  className="text-[13px] text-[#B08655] hover:text-[#1C1916] transition-colors cursor-pointer"
                >
                  Set as Default
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Add new address card */}
        <button
          onClick={onAddAddress}
          className="border border-dashed border-[#D8CFC0] rounded-lg flex flex-col items-center justify-center text-center py-12 px-6 min-h-[260px] hover:border-[#B08655] transition-colors cursor-pointer group"
        >
          <span className="w-12 h-12 rounded-full bg-[#F3EAE0] flex items-center justify-center mb-5 group-hover:bg-[#ECDFCF] transition-colors">
            <Plus size={18} strokeWidth={1.5} className="text-[#1C1916]" />
          </span>
          <span className="font-serif text-[18px] text-[#1C1916] mb-1.5">
            Add New Address
          </span>
          <span className="text-[13px] text-[#7A7368] leading-relaxed">
            Add a new address for
            <br />
            faster checkout.
          </span>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {addressToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
          <div className="bg-[#FAF8F5] border border-[#ECE7E1] p-6 sm:p-8 rounded-[2px] max-w-sm w-full shadow-[0_20px_50px_rgba(28,25,22,0.12)]">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECE7E1] mb-4">
              <h4 className="font-serif text-[18px] text-[#1C1916] font-medium flex items-center gap-2">
                <AlertCircle size={17} className="text-[#C0554A]" />
                Remove Address
              </h4>
              <button
                onClick={() => setAddressToDelete(null)}
                className="text-[#8A857E] hover:text-[#1C1916] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-[13px] text-[#6B6560] leading-relaxed mb-6 font-sans font-light">
              Are you sure you want to delete this address? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 font-sans">
              <button
                onClick={() => setAddressToDelete(null)}
                className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#6B6560] hover:text-[#1C1916] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2 bg-[#C0554A] hover:bg-[#a84439] text-white text-[11px] font-semibold uppercase tracking-wider rounded-[1px] transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
