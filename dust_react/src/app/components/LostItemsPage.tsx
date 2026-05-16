import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, Search, X } from "lucide-react";
import { canFileClaimOnItem, LostItem } from "../types";
import { mockLostItems } from "../data/mockData";
import { createClaim, createGuestInquiry, getLostItems, sortClaims, updateClaimStatus } from "../api/lostItems";
import { useAuth } from "../auth";
import { ItemCard } from "./ItemCard";
import { ItemDetailsDialog } from "./ItemDetailsDialog";
import { ClaimDialog } from "./ClaimDialog";

const MAX_CATEGORY_FILTERS = 5;

export function LostItemsPage() {
  const { user, isGuest } = useAuth();
  const [items, setItems] = useState<LostItem[]>(mockLostItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dateFilterMode, setDateFilterMode] = useState<"all" | "before" | "after" | "on" | "between">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedItem, setSelectedItem] = useState<LostItem | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<"loading" | "connected" | "fallback">("loading");

  const loadItems = useCallback(async () => {
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
    let isMounted = true;

    const refresh = () => {
      if (isMounted) {
        loadItems();
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
  }, [loadItems]);

  const itemCategories = useMemo(
    () => Array.from(new Set(items.flatMap((item) => item.categories))).sort(),
    [items]
  );

  const toggleCategoryFilter = (category: string) => {
    setSelectedCategories((current) => {
      if (current.includes(category)) {
        return current.filter((value) => value !== category);
      }
      if (current.length >= MAX_CATEGORY_FILTERS) {
        return current;
      }
      return [...current, category];
    });
  };

  const filteredItems = items
    .filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategories.length === 0 ||
        item.categories.some((category) => selectedCategories.includes(category));

      const matchesDate = matchesDateFilter(item.dateFound, dateFilterMode, dateFrom, dateTo);

      return matchesSearch && matchesCategory && matchesDate;
    })
    .sort(compareLostItems);

  const hasDateFilter = dateFilterMode !== "all";

  const clearDateFilter = () => {
    setDateFilterMode("all");
    setDateFrom("");
    setDateTo("");
  };

  const handleViewDetails = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      setSelectedItem(item);
      setIsDetailsDialogOpen(true);
    }
  };

  const handleOpenClaim = () => {
    if (!selectedItem || !canFileClaimOnItem(selectedItem)) return;
    setIsDetailsDialogOpen(false);
    setIsClaimDialogOpen(true);
  };

  const handleSubmitClaim = async (
    itemId: string,
    claimData: {
      claimantName: string;
      claimantEmail: string;
      claimantPhone: string;
      description: string;
    }
  ) => {
    const item = items.find((entry) => entry.id === itemId);
    if (!item || !canFileClaimOnItem(item)) {
      alert("This item is no longer open for claims.");
      return;
    }

    try {
      const savedClaim = isGuest
        ? await createGuestInquiry({
            itemId,
            contactName: claimData.claimantName,
            contactEmail: claimData.claimantEmail,
            contactPhone: claimData.claimantPhone,
            message: claimData.description,
          })
        : await createClaim({ itemId, ...claimData });

      const withNewClaim = (claims: LostItem["claims"]) => sortClaims([...claims, savedClaim]);

      setItems(
        items.map((item) =>
          item.id === itemId ? { ...item, claims: withNewClaim(item.claims) } : item
        )
      );
      if (selectedItem?.id === itemId) {
        setSelectedItem({ ...selectedItem, claims: withNewClaim(selectedItem.claims) });
      }
      if (isGuest) {
        alert("Your assistance request was submitted. Admins will review it after student claims.");
      }
      window.dispatchEvent(new Event("dust:lost-items-changed"));
      localStorage.setItem("dust:last-items-change", Date.now().toString());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit request.";
      alert(`Could not submit: ${message}`);
    }
  };

  const handleCancelClaim = async (claimId: string) => {
    try {
      const savedClaim = await updateClaimStatus(claimId, "cancelled");
      setItems(
        items.map((item) => ({
          ...item,
          claims: item.claims.map((claim) =>
            claim.id === claimId ? savedClaim : claim
          ),
        }))
      );
      if (selectedItem) {
        setSelectedItem({
          ...selectedItem,
          claims: selectedItem.claims.map((claim) =>
            claim.id === claimId ? savedClaim : claim
          ),
        });
      }
      window.dispatchEvent(new Event("dust:lost-items-changed"));
      localStorage.setItem("dust:last-items-change", Date.now().toString());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to cancel claim.";
      alert(`Could not cancel claim: ${message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2">Lost Items</h1>
        <p className="text-slate-600">
          Browse and search for lost items. Click "See Details" to view more information and file a claim.
        </p>
        <p className="text-sm text-slate-500 mt-2">
          {apiStatus === "loading" && "Connecting to the Django API..."}
          {apiStatus === "connected" && "Loaded from the Django API."}
          {apiStatus === "fallback" && "Django API unavailable; showing mock data."}
        </p>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {itemCategories.length > 0 && (
        <div className="mb-6 bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <p className="text-sm font-medium text-slate-700">Filter by category</p>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>
                {selectedCategories.length}/{MAX_CATEGORY_FILTERS} selected
              </span>
              {selectedCategories.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedCategories([])}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {itemCategories.map((category) => {
              const isSelected = selectedCategories.includes(category);
              const isDisabled =
                !isSelected && selectedCategories.length >= MAX_CATEGORY_FILTERS;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleCategoryFilter(category)}
                  disabled={isDisabled}
                  title={
                    isDisabled
                      ? `You can filter by up to ${MAX_CATEGORY_FILTERS} categories`
                      : undefined
                  }
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600"
                      : isDisabled
                      ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                      : "bg-white text-slate-700 border-slate-300 hover:border-blue-400 hover:text-blue-700"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-6 bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
          <div className="relative min-w-[180px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date Filter
            </label>
            <Calendar className="absolute left-3 bottom-2.5 size-5 text-slate-400" />
            <select
              value={dateFilterMode}
              onChange={(e) => {
                const nextMode = e.target.value as typeof dateFilterMode;
                setDateFilterMode(nextMode);
                if (nextMode === "all") {
                  setDateFrom("");
                  setDateTo("");
                } else if (nextMode !== "between") {
                  setDateTo("");
                }
              }}
              className="w-full pl-10 pr-8 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="all">All Dates</option>
              <option value="before">Before</option>
              <option value="after">After</option>
              <option value="on">On</option>
              <option value="between">Between</option>
            </select>
          </div>

          {dateFilterMode !== "all" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {dateFilterMode === "between" ? "Start Date" : "Date"}
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {dateFilterMode === "between" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          )}

          {hasDateFilter && (
            <button
              type="button"
              onClick={clearDateFilter}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              <X className="size-4" />
              Clear Date
            </button>
          )}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500">No items found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} onViewDetails={handleViewDetails} />
          ))}
        </div>
      )}

      {selectedItem && (
        <>
          <ItemDetailsDialog
            isOpen={isDetailsDialogOpen}
            onClose={() => {
              setIsDetailsDialogOpen(false);
              setSelectedItem(null);
            }}
            item={selectedItem}
            onFileClaim={handleOpenClaim}
            claimActionLabel={isGuest ? "Request Admin Assistance" : "File a Claim"}
            currentUserToken={user?.token}
            onCancelClaim={handleCancelClaim}
          />

          <ClaimDialog
            isOpen={isClaimDialogOpen}
            onClose={() => {
              setIsClaimDialogOpen(false);
              setSelectedItem(null);
            }}
            item={selectedItem}
            mode={isGuest ? "inquiry" : "claim"}
            defaultName={user?.name || ""}
            defaultEmail={user?.email || ""}
            onSubmit={handleSubmitClaim}
          />
        </>
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

function matchesDateFilter(
  itemDate: string,
  mode: "all" | "before" | "after" | "on" | "between",
  dateFrom: string,
  dateTo: string
) {
  const normalizedItemDate = itemDate.slice(0, 10);

  if (mode === "all") return true;
  if (!dateFrom) return true;

  if (mode === "before") return normalizedItemDate < dateFrom;
  if (mode === "after") return normalizedItemDate > dateFrom;
  if (mode === "on") return normalizedItemDate === dateFrom;

  if (mode === "between") {
    if (!dateTo) return normalizedItemDate >= dateFrom;
    return normalizedItemDate >= dateFrom && normalizedItemDate <= dateTo;
  }

  return true;
}
