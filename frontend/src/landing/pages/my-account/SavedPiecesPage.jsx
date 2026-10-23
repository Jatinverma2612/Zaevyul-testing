import { Heart } from "lucide-react";
import ProductCard from "../../components/ProductCard";

export default function SavedPiecesPage({ savedPieces }) {
  return (
    <div className="bg-white border border-[#E6DED4]/40 rounded-[4px] p-6 sm:p-8 shadow-xs">
      <div className="flex items-center justify-between border-b border-[#E6DED4]/60 pb-4 mb-6">
        <h3 className="font-serif text-[18px] font-normal tracking-wide text-[#1C1916] flex items-center gap-2.5">
          <Heart size={16} className="text-[#B58A5B]" /> Saved Pieces
        </h3>
      </div>

      {savedPieces.length === 0 ? (
        <div className="py-12 text-center text-[#8A857E] font-sans text-xs">
          No saved pieces yet. Browse items and click heart icon to save.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {savedPieces.map((p) => (
            <ProductCard
              key={p._id || p.id}
              p={p}
              showMeta={false}
              showAddButton={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
