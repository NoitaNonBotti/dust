import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { ItemTemplate } from "../types";

interface ManageTemplatesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  templates: ItemTemplate[];
  categories: string[];
  onSave: (template: Omit<ItemTemplate, "id">) => void;
  onDelete: (templateId: string) => void;
}

export function ManageTemplatesDialog({
  isOpen,
  onClose,
  templates,
  categories,
  onSave,
  onDelete,
}: ManageTemplatesDialogProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    categories: [] as string[],
    description: "",
    location: "",
  });

  const toggleCategory = (category: string) => {
    if (newTemplate.categories.includes(category)) {
      setNewTemplate({
        ...newTemplate,
        categories: newTemplate.categories.filter((c) => c !== category),
      });
    } else {
      setNewTemplate({
        ...newTemplate,
        categories: [...newTemplate.categories, category],
      });
    }
  };

  const handleSave = () => {
    if (newTemplate.name && newTemplate.categories.length > 0 && newTemplate.description) {
      onSave(newTemplate);
      setNewTemplate({ name: "", categories: [], description: "", location: "" });
      setIsAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold">Manage Templates</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {templates.length === 0 && !isAdding && (
            <p className="text-slate-500 text-center py-8">
              No templates yet. Create one to save time when reporting items.
            </p>
          )}

          {templates.map((template) => (
            <div
              key={template.id}
              className="p-4 border border-slate-200 rounded-md flex justify-between items-start"
            >
              <div>
                <h3 className="font-medium">{template.name}</h3>
                <p className="text-sm text-slate-600 mt-1">{template.description}</p>
                <p className="text-sm text-slate-500 mt-1">
                  Categories: {template.categories.join(", ")}
                </p>
                {template.location && (
                  <p className="text-sm text-slate-500">Location: {template.location}</p>
                )}
              </div>
              <button
                onClick={() => onDelete(template.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}

          {isAdding && (
            <div className="p-4 border-2 border-blue-200 rounded-md space-y-3">
              <input
                type="text"
                placeholder="Template Name"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <div>
                <label className="block text-sm font-medium mb-2">Categories (Select at least one)</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        newTemplate.categories.includes(category)
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                placeholder="Description"
                value={newTemplate.description}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
              <input
                type="text"
                placeholder="Location (optional)"
                value={newTemplate.location}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, location: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Template
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewTemplate({
                      name: "",
                      categories: [],
                      description: "",
                      location: "",
                    });
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              <Plus className="size-5" />
              Add New Template
            </button>
          )}
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