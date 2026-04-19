import { useState } from "react";
import { X, Upload, Trash2 as Trash2Icon } from "lucide-react";
import { LostItem, ItemStatus } from "../types";
import { defaultCategories } from "../data/mockData";

const statuses: ItemStatus[] = ["unclaimed", "claimed", "returned"];

interface EditItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: LostItem;
  onUpdate: (item: LostItem) => void;
}

export function EditItemDialog({ isOpen, onClose, item, onUpdate }: EditItemDialogProps) {
  const [formData, setFormData] = useState({
    name: item.name,
    categories: item.categories,
    description: item.description,
    location: item.location,
    dateFound: item.dateFound,
    status: item.status,
    images: item.images,
  });

  const toggleCategory = (category: string) => {
    if (formData.categories.includes(category)) {
      setFormData({
        ...formData,
        categories: formData.categories.filter((c) => c !== category),
      });
    } else {
      setFormData({
        ...formData,
        categories: [...formData.categories, category],
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: string[] = [];
      const fileArray = Array.from(files);
      
      fileArray.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          if (newImages.length === fileArray.length) {
            setFormData({
              ...formData,
              images: [...formData.images, ...newImages],
            });
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (imageIndex: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== imageIndex),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.categories.length === 0) {
      alert("Please select at least one category.");
      return;
    }
    if (formData.images.length === 0) {
      alert("Please add at least one image.");
      return;
    }
    onUpdate({
      ...item,
      ...formData,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold">Edit Item</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Item Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Categories <span className="text-red-500">* (Select at least one)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {defaultCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    formData.categories.includes(category)
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as ItemStatus })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location Found</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date Found</label>
            <input
              type="date"
              required
              value={formData.dateFound}
              onChange={(e) =>
                setFormData({ ...formData, dateFound: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Images <span className="text-red-500">* (At least one required)</span>
            </label>
            
            <div className="mb-3">
              <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-md hover:border-blue-500 cursor-pointer transition-colors">
                <Upload className="size-5 text-slate-500" />
                <span className="text-slate-600">Upload Images</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {formData.images.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {formData.images.map((image, imgIndex) => (
                  <div key={imgIndex} className="relative aspect-square bg-slate-100 rounded-md overflow-hidden group">
                    <img
                      src={image}
                      alt={`Preview ${imgIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(imgIndex)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}