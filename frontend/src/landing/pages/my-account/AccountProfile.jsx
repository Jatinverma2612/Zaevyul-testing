import { Plus, Edit3 } from "lucide-react";

const AVATARS = [
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
];

export { AVATARS };

export default function AccountProfile({
  profile,
  showAvatarSelector,
  setShowAvatarSelector,
  onAvatarChange,
  onAddAddress,
}) {
  return (
    <div className="flex flex-col items-center text-center bg-white border border-[#E6DED4]/40 rounded-[4px] p-6 sm:p-8 shadow-xs">
      <div className="relative group">
        <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-[#E6DED4] bg-[#FAF8F5] shadow-xs">
          <img
            src={profile.avatar}
            alt={profile.name}
            className="w-full h-full object-cover"
          />
        </div>
        <button
          onClick={() => setShowAvatarSelector(!showAvatarSelector)}
          className="absolute bottom-0.5 right-0.5 bg-white border border-[#E6DED4] p-2 rounded-full shadow-md hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          aria-label="Change profile picture"
        >
          <Edit3 size={12} className="text-[#6B6560]" />
        </button>

        {showAvatarSelector && (
          <div className="absolute top-36 left-1/2 -translate-x-1/2 z-20 bg-white border border-[#E6DED4] rounded-lg shadow-xl p-3 flex gap-2 animate-in fade-in zoom-in-95 duration-150">
            {AVATARS.map((url, idx) => (
              <button
                key={idx}
                onClick={() => onAvatarChange(url)}
                className="w-10 h-10 rounded-full overflow-hidden border border-[#E6DED4] hover:border-[#B58A5B] transition-colors cursor-pointer"
              >
                <img
                  src={url}
                  alt={`Avatar option ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <h2 className="font-serif text-[22px] font-normal tracking-wide text-[#1C1916] mt-5 leading-snug">
        {profile.name}
      </h2>
      <p className="font-sans text-[11px] text-[#8A857E] mt-1 font-light tracking-wide uppercase">
        {profile.tagline}
      </p>

      <button
        onClick={onAddAddress}
        className="w-full mt-8 border border-[#E6DED4] text-[#1C1916] hover:bg-[#1C1916] hover:text-white hover:border-[#1C1916] transition-colors duration-300 py-3 text-[10px] font-semibold tracking-[0.2em] uppercase rounded-[2px] cursor-pointer flex items-center justify-center gap-2"
      >
        <Plus size={12} /> New Address
      </button>
    </div>
  );
}
