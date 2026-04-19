import { useState } from "react";
import { Plus, Save, Trash2, FileText, X, Upload } from "lucide-react";
import { ItemTemplate } from "../types";
import { defaultCategories, mockTemplates } from "../data/mockData";
import { ManageTemplatesDialog } from "./ManageTemplatesDialog";
import { ManageCategoriesDialog } from "./ManageCategoriesDialog";

interface ItemForm {
  name: string;
  categories: string[];
  description: string;
  location: string;
  images: string[];
}

export function ReportItemPage() {
  const [items, setItems] = useState<ItemForm[]>([
    { name: "", categories: [], description: "", location: "", images: [] },
  ]);
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [templates, setTemplates] = useState<ItemTemplate[]>(mockTemplates);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const addItem = () => {
    setItems([...items, { name: "", categories: [], description: "", location: "", images: [] }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof ItemForm, value: string | string[]) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: string[] = [];
      const fileArray = Array.from(files);
      
      fileArray.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          if (newImages.length === fileArray.length) {
            const newItems = [...items];
            newItems[index] = {
              ...newItems[index],
              images: [...newItems[index].images, ...newImages],
            };
            setItems(newItems);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (itemIndex: number, imageIndex: number) => {
    const newItems = [...items];
    newItems[itemIndex].images = newItems[itemIndex].images.filter((_, i) => i !== imageIndex);
    setItems(newItems);
  };

  const toggleCategory = (itemIndex: number, category: string) => {
    const newItems = [...items];
    const currentCategories = newItems[itemIndex].categories;
    
    if (currentCategories.includes(category)) {
      newItems[itemIndex].categories = currentCategories.filter((c) => c !== category);
    } else {
      newItems[itemIndex].categories = [...currentCategories, category];
    }
    
    setItems(newItems);
  };

  const applyTemplate = (index: number, templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      const newItems = [...items];
      newItems[index] = {
        name: template.name.replace(" Template", ""),
        categories: template.categories,
        description: template.description,
        location: template.location,
        images: newItems[index].images, // Keep existing images
      };
      setItems(newItems);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that all items are filled
    const allValid = items.every(
      (item) =>
        item.name &&
        item.categories.length > 0 &&
        item.description &&
        item.location &&
        item.images.length > 0
    );

    if (!allValid) {
      alert("Please fill in all fields for every item, including at least one category and one image.");
      return;
    }

    // Show success message
    setSuccessMessage(`Successfully reported ${items.length} item(s)!`);
    
    // Reset form
    setItems([{ name: "", categories: [], description: "", location: "", images: [] }]);

    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleSaveTemplate = (template: Omit<ItemTemplate, "id">) => {
    const newTemplate: ItemTemplate = {
      ...template,
      id: Date.now().toString(),
    };
    setTemplates([...templates, newTemplate]);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter((t) => t.id !== templateId));
  };

  const handleAddCategory = (category: string) => {
    if (!categories.includes(category)) {
      setCategories([...categories, category].sort());
    }
  };

  const handleDeleteCategory = (category: string) => {
    if (!defaultCategories.includes(category)) {
      setCategories(categories.filter((c) => c !== category));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2">Report Lost Item</h1>
        <p className="text-slate-600">
          Found a lost item? Report it here. You must add at least one item with at least one image.
        </p>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setIsTemplateDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
        >
          <FileText className="size-4" />
          Manage Templates
        </button>
        <button
          onClick={() => setIsCategoryDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
        >
          <Save className="size-4" />
          Manage Categories
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {items.map((item, index) => (
          <div key={index} className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Item {index + 1}</h3>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>

            {templates.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Use Template (Optional)
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      applyTemplate(index, e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue=""
                >
                  <option value="">Select a template...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={item.name}
                  onChange={(e) => updateItem(index, "name", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., iPhone 14 Pro"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Categories <span className="text-red-500">* (Select at least one)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(index, category)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        item.categories.includes(category)
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
                <label className="block text-sm font-medium mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={item.description}
                  onChange={(e) => updateItem(index, "description", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe the item in detail..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Location Found <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={item.location}
                  onChange={(e) => updateItem(index, "location", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Library - 2nd Floor"
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
                      onChange={(e) => handleImageUpload(index, e)}
                      className="hidden"
                    />
                  </label>
                </div>

                {item.images.length > 0 && (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {item.images.map((image, imgIndex) => (
                      <div key={imgIndex} className="relative aspect-square bg-slate-100 rounded-md overflow-hidden group">
                        <img
                          src={image}
                          alt={`Preview ${imgIndex + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index, imgIndex)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
        >
          <Plus className="size-5" />
          Add Another Item
        </button>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Submit Report
          </button>
        </div>
      </form>

      <ManageTemplatesDialog
        isOpen={isTemplateDialogOpen}
        onClose={() => setIsTemplateDialogOpen(false)}
        templates={templates}
        categories={categories}
        onSave={handleSaveTemplate}
        onDelete={handleDeleteTemplate}
      />

      <ManageCategoriesDialog
        isOpen={isCategoryDialogOpen}
        onClose={() => setIsCategoryDialogOpen(false)}
        categories={categories}
        defaultCategories={defaultCategories}
        onAdd={handleAddCategory}
        onDelete={handleDeleteCategory}
      />
    </div>
  );
}
