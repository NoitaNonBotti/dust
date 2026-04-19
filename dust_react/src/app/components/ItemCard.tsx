import { Calendar, MapPin, Tag, AlertCircle } from "lucide-react";
import { LostItem } from "../types";

interface ItemCardProps {
  item: LostItem;
  onViewDetails: (itemId: string) => void;
}

export function ItemCard({ item, onViewDetails }: ItemCardProps) {
  const statusColors = {
    unclaimed: "bg-green-100 text-green-800",
    claimed: "bg-yellow-100 text-yellow-800",
    returned: "bg-slate-100 text-slate-800",
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* First image preview */}
      {item.images && item.images.length > 0 && (
        <div className="w-full h-48 bg-slate-100 overflow-hidden">
          <img
            src={item.images[0]}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-lg">{item.name}</h3>
          <span
            className={`px-2 py-1 rounded-full text-xs ${statusColors[item.status]}`}
          >
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </span>
        </div>

        <p className="text-slate-600 text-sm mb-4 line-clamp-2">{item.description}</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Tag className="size-4" />
            <span>{item.categories.join(", ")}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="size-4" />
            <span>{item.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="size-4" />
            <span>Found on {new Date(item.dateFound).toLocaleDateString()}</span>
          </div>
        </div>

        {item.claims.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-amber-600 mb-4 p-2 bg-amber-50 rounded">
            <AlertCircle className="size-4" />
            <span>{item.claims.length} claim(s) pending</span>
          </div>
        )}

        <button
          onClick={() => onViewDetails(item.id)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          See Details
        </button>
      </div>
    </div>
  );
}