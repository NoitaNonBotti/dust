import { useState } from "react";
import { X, Plus, Trash2, Lock } from "lucide-react";

interface ManageCategoriesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  defaultCategories: string[];
  onAdd: (category: string) => void;
  onDelete: (category: string) => void;
}

export function ManageCategoriesDialog({
  isOpen,
  onClose,
  categories,
  defaultCategories,
  onAdd,
  onDelete,
}: ManageCategoriesDialogProps) {
  const [newCategory, setNewCategory] = useState("");
  const [error, setError] = useState("");

  const handleAdd = () => {
    if (!newCategory.trim()) {
      setError("Category name cannot be empty");
      return;
    }

    if (categories.includes(newCategory.trim())) {
      setError("Category already exists");
      return;
    }

    onAdd(newCategory.trim());
    setNewCategory("");
    setError("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold">Manage Categories</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Add New Category</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => {
                  setNewCategory(e.target.value);
                  setError("");
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter category name..."
              />
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="size-5" />
              </button>
            </div>
            {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Existing Categories</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {categories.map((category) => {
                const isDefault = defaultCategories.includes(category);
                return (
                  <div
                    key={category}
                    className="flex items-center justify-between p-3 border border-slate-200 rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      {isDefault && (
                        <Lock className="size-4 text-slate-400" title="Default category" />
                      )}
                      <span>{category}</span>
                    </div>
                    {!isDefault && (
                      <button
                        onClick={() => onDelete(category)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete category"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
