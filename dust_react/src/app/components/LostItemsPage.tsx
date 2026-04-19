import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { LostItem } from "../types";
import { mockLostItems, defaultCategories } from "../data/mockData";
import { ItemCard } from "./ItemCard";
import { ItemDetailsDialog } from "./ItemDetailsDialog";
import { ClaimDialog } from "./ClaimDialog";

export function LostItemsPage() {
  const [items, setItems] = useState<LostItem[]>(mockLostItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedItem, setSelectedItem] = useState<LostItem | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);

  // Get all unique categories from items plus default categories
  const allCategories = Array.from(
    new Set([...defaultCategories, ...items.flatMap((item) => item.categories)])
  ).sort();

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || item.categories.includes(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  const handleViewDetails = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      setSelectedItem(item);
      setIsDetailsDialogOpen(true);
    }
  };

  const handleOpenClaim = () => {
    setIsDetailsDialogOpen(false);
    setIsClaimDialogOpen(true);
  };

  const handleSubmitClaim = (
    itemId: string,
    claimData: {
      claimantName: string;
      claimantEmail: string;
      claimantPhone: string;
      description: string;
    }
  ) => {
    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          const newClaim = {
            id: Date.now().toString(),
            itemId,
            ...claimData,
            dateSubmitted: new Date().toISOString().split("T")[0],
            status: "pending" as const,
          };
          return {
            ...item,
            claims: [...item.claims, newClaim],
          };
        }
        return item;
      })
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2">Lost Items</h1>
        <p className="text-slate-600">
          Browse and search for lost items. Click "See Details" to view more information and file a claim.
        </p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="pl-10 pr-8 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white min-w-[200px]"
          >
            <option value="All">All Categories</option>
            {allCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
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
          />

          <ClaimDialog
            isOpen={isClaimDialogOpen}
            onClose={() => {
              setIsClaimDialogOpen(false);
              setSelectedItem(null);
            }}
            item={selectedItem}
            onSubmit={handleSubmitClaim}
          />
        </>
      )}
    </div>
  );
}