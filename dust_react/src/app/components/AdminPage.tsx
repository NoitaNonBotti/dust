import { useState } from "react";
import { Search, Edit, Trash2 } from "lucide-react";
import { LostItem, Claim } from "../types";
import { mockLostItems } from "../data/mockData";
import { EditItemDialog } from "./EditItemDialog";
import { ClaimReviewDialog } from "./ClaimReviewDialog";

export function AdminPage() {
  const [items, setItems] = useState<LostItem[]>(mockLostItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<LostItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<{
    item: LostItem;
    claim: Claim;
  } | null>(null);

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleEdit = (item: LostItem) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (itemId: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      setItems(items.filter((item) => item.id !== itemId));
    }
  };

  const handleUpdateItem = (updatedItem: LostItem) => {
    setItems(items.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
  };

  const handleUpdateClaim = (itemId: string, claimId: string, status: "approved" | "rejected") => {
    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            claims: item.claims.map((claim) =>
              claim.id === claimId ? { ...claim, status } : claim
            ),
            status: status === "approved" ? "claimed" : item.status,
          };
        }
        return item;
      })
    );
    setSelectedClaim(null);
  };

  const pendingClaims = items.reduce((acc, item) => {
    const pending = item.claims.filter((claim) => claim.status === "pending");
    return acc + pending.length;
  }, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2">Admin Dashboard</h1>
        <p className="text-slate-600">
          Manage lost items, review claims, and update item status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="text-sm text-slate-600 mb-1">Total Items</div>
          <div className="text-3xl font-semibold">{items.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="text-sm text-slate-600 mb-1">Unclaimed Items</div>
          <div className="text-3xl font-semibold">
            {items.filter((i) => i.status === "unclaimed").length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="text-sm text-slate-600 mb-1">Pending Claims</div>
          <div className="text-3xl font-semibold text-amber-600">{pendingClaims}</div>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Categories
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Claims
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    {item.images && item.images.length > 0 && (
                      <div className="size-12 bg-slate-100 rounded overflow-hidden">
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-slate-500 truncate max-w-xs">
                      {item.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {item.categories.join(", ")}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.location}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        item.status === "unclaimed"
                          ? "bg-green-100 text-green-800"
                          : item.status === "claimed"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {item.claims.length > 0 ? (
                      <div className="space-y-1">
                        {item.claims.map((claim) => (
                          <button
                            key={claim.id}
                            onClick={() => setSelectedClaim({ item, claim })}
                            className={`block w-full text-left px-2 py-1 rounded text-xs ${
                              claim.status === "pending"
                                ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                : claim.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {claim.claimantName} - {claim.status}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">No claims</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit className="size-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedItem && (
        <EditItemDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
          onUpdate={handleUpdateItem}
        />
      )}

      {selectedClaim && (
        <ClaimReviewDialog
          isOpen={!!selectedClaim}
          onClose={() => setSelectedClaim(null)}
          item={selectedClaim.item}
          claim={selectedClaim.claim}
          onUpdate={handleUpdateClaim}
        />
      )}
    </div>
  );
}