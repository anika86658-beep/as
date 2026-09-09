import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, Check, X, Layers, Sparkles } from 'lucide-react';
import { CategoryItem, Product } from '../types';
import { api } from '../services/api';

interface CategoryManagerProps {
  products: Product[];
  categories: CategoryItem[];
  onCategoryUpdate: (categories: CategoryItem[]) => void;
  onNavigateToNewProduct: () => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  products,
  categories,
  onCategoryUpdate,
  onNavigateToNewProduct
}) => {
  const [categoryList, setCategoryList] = useState<CategoryItem[]>(categories || []);

  useEffect(() => {
    if (categories && Array.isArray(categories)) {
      setCategoryList(categories);
    }
  }, [categories]);

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [deleteConfirmCat, setDeleteConfirmCat] = useState<CategoryItem | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form state for new / edit category
  const [formState, setFormState] = useState<{
    key: string;
    name: string;
    bnName: string;
    description: string;
    emoji: string;
    badge: string;
  }>({
    key: '',
    name: '',
    bnName: '',
    description: '',
    emoji: '🍃',
    badge: ''
  });

  const handleStartAdd = () => {
    setFormState({
      key: '',
      name: '',
      bnName: '',
      description: '',
      emoji: '🌿',
      badge: ''
    });
    setIsAddingNew(true);
    setEditingCategory(null);
  };

  const handleStartEdit = (cat: CategoryItem) => {
    setFormState({
      key: cat.key || '',
      name: cat.name || '',
      bnName: cat.bnName || '',
      description: cat.description || '',
      emoji: cat.emoji || '🍃',
      badge: cat.badge || ''
    });
    setEditingCategory(cat);
    setIsAddingNew(false);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim()) return;

    let updated: CategoryItem[] = [];

    if (isAddingNew) {
      const newKey = formState.key.trim()
        ? formState.key.toLowerCase().replace(/\s+/g, '_')
        : formState.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

      const newCat: CategoryItem = {
        id: 'cat-' + Date.now(),
        key: newKey,
        name: formState.name,
        bnName: formState.bnName || formState.name,
        description: formState.description || '',
        emoji: formState.emoji || '🌿',
        badge: formState.badge || undefined
      };

      updated = [...categoryList, newCat];
    } else if (editingCategory) {
      updated = categoryList.map(c =>
        c.id === editingCategory.id
          ? {
              ...c,
              key: formState.key || c.key,
              name: formState.name,
              bnName: formState.bnName,
              description: formState.description,
              emoji: formState.emoji,
              badge: formState.badge || undefined
            }
          : c
      );
    }

    setCategoryList(updated);
    onCategoryUpdate(updated);
    localStorage.setItem('arishten_categories', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('arishten_categories_updated', { detail: updated }));
    await api.saveCategories(updated);

    setToastMsg(`✅ ক্যাটাগরি সফলভাবে ${isAddingNew ? 'যোগ করা' : 'আপডেট করা'} হয়েছে!`);
    setTimeout(() => setToastMsg(null), 4000);

    setIsAddingNew(false);
    setEditingCategory(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmCat) return;

    const targetId = deleteConfirmCat.id || deleteConfirmCat.key;
    const updated = await api.deleteCategory(targetId);
    setCategoryList(updated);
    onCategoryUpdate(updated);

    setToastMsg(`🗑️ ক্যাটাগরি "${deleteConfirmCat.name}" সফলভাবে মুছে ফেলা হয়েছে!`);
    setTimeout(() => setToastMsg(null), 4000);
    setDeleteConfirmCat(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 sm:p-6 space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-xl flex items-center justify-between shadow-2xs">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-emerald-700 hover:text-emerald-950">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-600" />
            <span>Dynamic Categories Management ({categoryList.length})</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            অ্যাডমিন প্যানেল থেকে নতুন ক্যাটাগরি যুক্ত করুন, এডিট করুন অথবা ডিলিট করুন। এগুলো কাস্টমার স্টোরে রিয়েল-টাইমে আপডেট হবে।
          </p>
        </div>

        <button
          onClick={handleStartAdd}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ নতুন ক্যাটাগরি যোগ করুন</span>
        </button>
      </div>

      {/* Add / Edit Form Modal / Card */}
      {(isAddingNew || editingCategory) && (
        <div className="p-5 bg-blue-50/50 border border-blue-200 rounded-2xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>{isAddingNew ? 'নতুন ক্যাটাগরি তৈরি করুন' : 'ক্যাটাগরি এডিট করুন'}</span>
            </h3>
            <button
              onClick={() => {
                setIsAddingNew(false);
                setEditingCategory(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveCategory} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                ক্যাটাগরির নাম (English Name) *
              </label>
              <input
                type="text"
                required
                value={formState.name}
                onChange={e => setFormState({ ...formState, name: e.target.value })}
                placeholder="e.g. Organic Teas & Drinks"
                className="w-full px-3.5 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                বাংলা নাম (Bangla Title)
              </label>
              <input
                type="text"
                value={formState.bnName}
                onChange={e => setFormState({ ...formState, bnName: e.target.value })}
                placeholder="যেমন: অর্গানিক চা ও পানীয়"
                className="w-full px-3.5 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                সিস্টেম কি (System Key ID)
              </label>
              <input
                type="text"
                value={formState.key}
                onChange={e => setFormState({ ...formState, key: e.target.value })}
                placeholder="e.g. tea, organic_drinks"
                className="w-full px-3.5 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                আইকন ইমোজি (Emoji Icon)
              </label>
              <input
                type="text"
                value={formState.emoji}
                onChange={e => setFormState({ ...formState, emoji: e.target.value })}
                placeholder="🍵"
                className="w-full px-3.5 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-center font-bold text-lg"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                সংক্ষিপ্ত বিবরণী (Description)
              </label>
              <input
                type="text"
                value={formState.description}
                onChange={e => setFormState({ ...formState, description: e.target.value })}
                placeholder="প্রাকৃতিক ও স্বাস্থ্যসম্মত অর্গানিক চা..."
                className="w-full px-3.5 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(false);
                  setEditingCategory(null);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                {isAddingNew ? 'সংরক্ষণ করুন (Add)' : 'পরিবর্তন সেভ করুন'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoryList.map((cat, index) => {
          const prodCount = products.filter(
            p =>
              p.category === cat.key ||
              p.categoryLabel?.toLowerCase().includes(cat.key.toLowerCase()) ||
              p.categoryLabel?.toLowerCase().includes(cat.name.toLowerCase())
          ).length;

          return (
            <div
              key={cat.id || cat.key}
              className="p-4 bg-gray-50/80 hover:bg-blue-50/20 rounded-2xl border border-gray-200 flex flex-col justify-between gap-3 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white shadow-2xs border border-gray-200 flex items-center justify-center text-2xl shrink-0">
                    {cat.emoji || '🌿'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-xs text-gray-900">{cat.name}</h3>
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-mono">
                        #{cat.key}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500">{cat.bnName}</p>
                  </div>
                </div>
              </div>

              {cat.description && (
                <p className="text-[11px] text-gray-600 bg-white p-2 rounded-xl border border-gray-100">
                  {cat.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 text-xs">
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  📦 {prodCount} Products
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleStartEdit(cat)}
                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>এডিট</span>
                  </button>
                  <button
                    onClick={() => setDeleteConfirmCat(cat)}
                    className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>ডিলিট</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmCat && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">ক্যাটাগরি ডিলিট নিশ্চিত করুন</h3>
                <p className="text-xs text-gray-500 font-mono">Key: {deleteConfirmCat.key}</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 bg-red-50 p-3 rounded-xl border border-red-100 leading-relaxed">
              ⚠️ <strong>সতর্কতা:</strong> আপনি কি নিশ্চিতভাবে "{deleteConfirmCat.name}" ক্যাটাগরি ডিলিট করতে চান?
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmCat(null)}
                className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                না, ফিরে যান
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>হ্যাঁ, ডিলিট করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
