import { useCallback, useEffect, useState } from "react";
import { Edit, Lock, LogOut, RefreshCw, Search, ShieldCheck, Trash2 } from "lucide-react";
import { LostItem, Claim } from "../types";
import { mockLostItems } from "../data/mockData";
import { deleteLostItem, getLostItems, updateLostItem } from "../api/lostItems";
import { EditItemDialog } from "./EditItemDialog";
import { ClaimReviewDialog } from "./ClaimReviewDialog";

const TEMP_ADMIN_PASSWORD = "password";
const ADMIN_SESSION_KEY = "dust-admin-password";

export function AdminPage() {
  const [items, setItems] = useState<LostItem[]>(mockLostItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [adminPassword, setAdminPassword] = useState(
    () => sessionStorage.getItem(ADMIN_SESSION_KEY) || ""
  );
  const [authError, setAuthError] = useState("");
  const [apiStatus, setApiStatus] = useState<"idle" | "loading" | "connected" | "fallback" | "error">("idle");
  const [selectedItem, setSelectedItem] = useState<LostItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<{
    item: LostItem;
    claim: Claim;
  } | null>(null);

  const isAuthenticated = adminPassword === TEMP_ADMIN_PASSWORD;

  const loadAdminItems = useCallback(async () => {
    setApiStatus("loading");
    try {
      const apiItems = await getLostItems();
      setItems(apiItems);
      setApiStatus("connected");
    } catch {
      setItems(mockLostItems);
      setApiStatus("fallback");
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    const refresh = () => {
      if (isMounted) {
        loadAdminItems();
      }
    };

    refresh();
    const intervalId = window.setInterval(refresh, 5000);
    window.addEventListener("focus", refresh);
    window.addEventListener("dust:lost-items-changed", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("dust:lost-items-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [isAuthenticated, loadAdminItems]);

  const filteredItems = items
    .filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    })
    .sort(compareLostItems);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordInput !== TEMP_ADMIN_PASSWORD) {
      setAuthError("Incorrect password.");
      return;
    }

    sessionStorage.setItem(ADMIN_SESSION_KEY, passwordInput);
    setAdminPassword(passwordInput);
    setPasswordInput("");
    setAuthError("");
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setAdminPassword("");
    setItems(mockLostItems);
    setApiStatus("idle");
  };

  const handleEdit = (item: LostItem) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (itemId: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteLostItem(itemId, adminPassword);
        setItems(items.filter((item) => item.id !== itemId));
        window.dispatchEvent(new Event("dust:lost-items-changed"));
        localStorage.setItem("dust:last-items-change", Date.now().toString());
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to delete item.";
        alert(`Could not delete item: ${message}`);
      }
    }
  };

  const handleUpdateItem = async (updatedItem: LostItem) => {
    try {
      const savedItem = await updateLostItem(
        {
          id: updatedItem.id,
          name: updatedItem.name,
          category: updatedItem.categories[0],
          description: updatedItem.description,
          location: updatedItem.location,
          dateFound: updatedItem.dateFound,
          status: updatedItem.status,
          imageUrl: updatedItem.images[0] || "",
        },
        adminPassword
      );
      setItems(items.map((item) => (item.id === savedItem.id ? savedItem : item)));
      window.dispatchEvent(new Event("dust:lost-items-changed"));
      localStorage.setItem("dust:last-items-change", Date.now().toString());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update item.";
      alert(`Could not update item: ${message}`);
    }
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

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-11 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center">
              <Lock className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Admin Access</h1>
              <p className="text-sm text-slate-600">Enter the temporary admin password.</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setAuthError("");
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="password"
              />
              {authError && <p className="text-sm text-red-600 mt-2">{authError}</p>}
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <ShieldCheck className="size-4" />
              Unlock Dashboard
            </button>
          </form>

          <p className="text-xs text-slate-500 mt-4">
            Temporary development password: password
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Admin Dashboard</h1>
          <p className="text-slate-600">
            Manage lost items, review claims, and update item status.
          </p>
          <p className="text-sm text-slate-500 mt-2">
            {apiStatus === "loading" && "Loading items from the Django API..."}
            {apiStatus === "connected" && "Loaded from the Django API."}
            {apiStatus === "fallback" && "Django API unavailable; showing mock data."}
            {apiStatus === "error" && "Unable to complete the latest admin action."}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadAdminItems}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="size-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            <LogOut className="size-4" />
            Lock
          </button>
        </div>
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

function compareLostItems(a: LostItem, b: LostItem) {
  const statusPriority = {
    unclaimed: 0,
    claimed: 1,
    returned: 2,
  };

  const statusDifference = statusPriority[a.status] - statusPriority[b.status];
  if (statusDifference !== 0) return statusDifference;

  return b.dateFound.localeCompare(a.dateFound);
}
