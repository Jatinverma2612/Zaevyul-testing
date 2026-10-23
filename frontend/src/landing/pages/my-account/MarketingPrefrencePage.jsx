import { Mail } from "lucide-react";

export default function MarketingPreferencesPage({
  marketingPreferences,
  onToggleMarketing,
}) {
  return (
    <div className="bg-white border border-[#E6DED4]/40 rounded-[4px] p-6 sm:p-8 shadow-xs">
      <div className="border-b border-[#E6DED4]/60 pb-4 mb-6">
        <h3 className="font-serif text-[18px] font-normal tracking-wide text-[#1C1916] flex items-center gap-2.5">
          <Mail size={16} className="text-[#B58A5B]" /> Marketing Preferences
        </h3>
      </div>

      <div className="space-y-6 max-w-lg">
        <p className="font-sans text-[13px] font-light text-[#8A857E] leading-relaxed">
          Control the updates you wish to receive from the Zaevyul house of
          luxury. We send updates about new collections, seasonal launches, and
          invite-only artisan events.
        </p>

        <div className="flex items-center justify-between bg-[#FBF9F6] border border-[#E6DED4]/40 p-5 rounded-[4px]">
          <div>
            <h4 className="font-sans text-[13.5px] font-semibold text-[#1C1916]">
              Email Updates
            </h4>
            <p className="font-sans text-[11.5px] text-[#8A857E] mt-0.5 font-light">
              Receive emails about heritage collections, private events, and
              news.
            </p>
          </div>
          <button
            onClick={onToggleMarketing}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
              ${marketingPreferences.emailUpdates ? "bg-[#B58A5B]" : "bg-[#E6DED4]"}`}
            role="switch"
            aria-checked={marketingPreferences.emailUpdates}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out
                ${marketingPreferences.emailUpdates ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
