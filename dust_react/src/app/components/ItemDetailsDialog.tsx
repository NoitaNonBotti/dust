import { X, Calendar, MapPin, Tag, AlertCircle, ImageIcon } from "lucide-react";
import { canFileClaimOnItem, claimClosedMessage, Claim, LostItem } from "../types";

interface ItemDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: LostItem;
  onFileClaim: () => void;
  claimActionLabel?: string;
  currentUserToken?: string;
  onCancelClaim?: (claimId: string) => void;
}

function visibleClaimsForItem(item: LostItem): Claim[] {
  if (item.status === "unclaimed") {
    return item.claims;
  }
  return item.claims.filter((claim) => claim.status !== "pending");
}

export function ItemDetailsDialog({
  isOpen,
  onClose,
  item,
  onFileClaim,
  claimActionLabel = "File a Claim",
  currentUserToken,
  onCancelClaim,
}: ItemDetailsDialogProps) {
  if (!isOpen) return null;

  const statusColors = {
    unclaimed: "bg-green-100 text-green-800",
    claimed: "bg-yellow-100 text-yellow-800",
    returned: "bg-slate-100 text-slate-800",
  };

  const canFileClaim = canFileClaimOnItem(item);
  const visibleClaims = visibleClaimsForItem(item);
  const pendingCount = visibleClaims.filter((claim) => claim.status === "pending").length;
  const closedMessage = claimClosedMessage(item);
  const claimButtonLabel = canFileClaim ? claimActionLabel : closedMessage;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold">Item Details</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {item.images && item.images.length > 0 && (
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <ImageIcon className="size-5" />
                Images ({item.images.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {item.images.map((image, index) => (
                  <div key={index} className="aspect-square bg-slate-100 rounded-lg overflow-hidden">
                    <img
                      src={image}
                      alt={`${item.name} - Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-semibold mb-2">{item.name}</h3>
              <span className={`px-3 py-1 rounded-full text-sm ${statusColors[item.status]}`}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-slate-700">{item.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Tag className="size-5 text-slate-500 mt-0.5" />
              <div>
                <div className="text-sm text-slate-500">Categories</div>
                <div className="font-medium">{item.categories.join(", ")}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="size-5 text-slate-500 mt-0.5" />
              <div>
                <div className="text-sm text-slate-500">Location Found</div>
                <div className="font-medium">{item.location}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="size-5 text-slate-500 mt-0.5" />
              <div>
                <div className="text-sm text-slate-500">Date Found</div>
                <div className="font-medium">
                  {new Date(item.dateFound).toLocaleDateString()}
                </div>
              </div>
            </div>

            {visibleClaims.length > 0 && (
              <div className="flex items-start gap-3">
                <AlertCircle className="size-5 text-slate-500 mt-0.5" />
                <div>
                  <div className="text-sm text-slate-500">Claims</div>
                  <div className="font-medium">
                    {visibleClaims.length} claim(s)
                    {pendingCount > 0 && ` (${pendingCount} pending)`}
                  </div>
                </div>
              </div>
            )}
          </div>

          {visibleClaims.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Existing Claims</h4>
              <div className="space-y-2">
                {visibleClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="p-3 bg-slate-50 rounded-md border border-slate-200"
                  >
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <span className="font-medium">User</span>
                      <div className="flex flex-wrap justify-end gap-1">
                        {claim.priority === "low" && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-200 text-slate-700">
                            Guest request
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            claim.status === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : claim.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {claim.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Submitted {new Date(claim.dateSubmitted).toLocaleDateString()}
                    </p>
                    {claim.status === "pending" &&
                      canFileClaim &&
                      currentUserToken &&
                      claim.createdByToken === currentUserToken &&
                      onCancelClaim && (
                        <button
                          type="button"
                          onClick={() => onCancelClaim(claim.id)}
                          className="mt-2 text-xs text-red-600 hover:text-red-700"
                        >
                          Cancel my claim
                        </button>
                      )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={canFileClaim ? onFileClaim : undefined}
              aria-disabled={!canFileClaim}
              className={`w-full px-4 py-3 rounded-md font-medium transition-colors ${
                canFileClaim
                  ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                  : "bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300"
              }`}
            >
              {claimButtonLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
