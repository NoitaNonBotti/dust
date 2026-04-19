import { X, Mail, Phone, Calendar, User } from "lucide-react";
import { LostItem, Claim } from "../types";

interface ClaimReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: LostItem;
  claim: Claim;
  onUpdate: (itemId: string, claimId: string, status: "approved" | "rejected") => void;
}

export function ClaimReviewDialog({
  isOpen,
  onClose,
  item,
  claim,
  onUpdate,
}: ClaimReviewDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold">Review Claim</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-medium text-lg mb-2">Item Details</h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-slate-600">{item.description}</div>
              <div className="flex gap-4 text-sm text-slate-500">
                <span>Category: {item.category}</span>
                <span>•</span>
                <span>Location: {item.location}</span>
                <span>•</span>
                <span>Found: {new Date(item.dateFound).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-lg mb-2">Claimant Information</h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <User className="size-4 text-slate-500" />
                <span className="font-medium">{claim.claimantName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail className="size-4 text-slate-500" />
                <a
                  href={`mailto:${claim.claimantEmail}`}
                  className="hover:text-blue-600"
                >
                  {claim.claimantEmail}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="size-4 text-slate-500" />
                <a href={`tel:${claim.claimantPhone}`} className="hover:text-blue-600">
                  {claim.claimantPhone}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="size-4 text-slate-500" />
                <span>Submitted: {new Date(claim.dateSubmitted).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-lg mb-2">Claim Justification</h3>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-slate-700">{claim.description}</p>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-lg mb-2">Claim Status</h3>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm ${
                claim.status === "pending"
                  ? "bg-amber-100 text-amber-800"
                  : claim.status === "approved"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
            </span>
          </div>

          {claim.status === "pending" && (
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  onUpdate(item.id, claim.id, "rejected");
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Reject Claim
              </button>
              <button
                onClick={() => {
                  onUpdate(item.id, claim.id, "approved");
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Approve Claim
              </button>
            </div>
          )}

          {claim.status !== "pending" && (
            <button
              onClick={onClose}
              className="w-full px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
