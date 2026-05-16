import { useState } from "react";
import { X } from "lucide-react";
import { LostItem } from "../types";

interface ClaimDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: LostItem;
  mode?: "claim" | "inquiry";
  defaultName?: string;
  defaultEmail?: string;
  onSubmit: (
    itemId: string,
    claimData: {
      claimantName: string;
      claimantEmail: string;
      claimantPhone: string;
      description: string;
    }
  ) => void;
}

export function ClaimDialog({
  isOpen,
  onClose,
  item,
  mode = "claim",
  defaultName = "",
  defaultEmail = "",
  onSubmit,
}: ClaimDialogProps) {
  const [formData, setFormData] = useState({
    claimantName: defaultName,
    claimantEmail: defaultEmail,
    claimantPhone: "",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(item.id, formData);
    setFormData({
      claimantName: defaultName,
      claimantEmail: defaultEmail,
      claimantPhone: "",
      description: "",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold">
            {mode === "claim" ? "File a Claim" : "Request Admin Assistance"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h3 className="font-medium mb-2">{item.name}</h3>
          <p className="text-sm text-slate-600">{item.description}</p>
          <p className="text-sm text-slate-500 mt-2">
            Found at {item.location} on {new Date(item.dateFound).toLocaleDateString()}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Your Name</label>
            <input
              type="text"
              required
              value={formData.claimantName}
              onChange={(e) =>
                setFormData({ ...formData, claimantName: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.claimantEmail}
              onChange={(e) =>
                setFormData({ ...formData, claimantEmail: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input
              type="tel"
              required
              value={formData.claimantPhone}
              onChange={(e) =>
                setFormData({ ...formData, claimantPhone: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="555-0123"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {mode === "claim"
                ? "Why do you believe this is your item?"
                : "What would you like the admins to know?"}
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder={
                mode === "claim"
                  ? "Provide details about the item to verify ownership..."
                  : "Share your question or contact request..."
              }
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {mode === "claim" ? "Submit Claim" : "Send Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
