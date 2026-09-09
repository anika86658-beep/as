import React from 'react';
import { LayoutGrid, Sparkles, Tag } from 'lucide-react';
import { CategoryItem, Product } from '../types';

interface CategoryFilterProps {
  categories: CategoryItem[];
  products?: Product[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}

const EMOJI_MAP: Record<string, string> = {
  honey: '🍯',
  spices: '🌿',
  oils: '🫒',
  dairy: '🧈',
  seeds_nuts: '🌰',
  other: '✨',
  tea: '🍵',
  ghee: '🧈',
  nuts: '🥜',
  grains: '🌾',
  herbs: '🌱',
  fruits: '🍎',
  organic: '🍃'
};

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories = [],
  products = [],
  selectedCategory,
  onSelectCategory
}) => {
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeProducts = Array.isArray(products) ? products : [];

  const getEmoji = (cat: CategoryItem) => {
    if (cat?.emoji) return cat.emoji;
    const keyLower = (cat?.key || '').toLowerCase();
    const nameLower = (cat?.name || '').toLowerCase();

    for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
      if (keyLower.includes(key) || nameLower.includes(key)) {
        return emoji;
      }
    }
    return '🍃';
  };

  const getProductCount = (catKey: string, catName: string) => {
    const targetCat = safeCategories.find(c => c.key === catKey || c.id === catKey || c.name === catName || c.bnName === catName);
    return safeProducts.filter(
      p =>
        p?.category === catKey ||
        p?.category?.toLowerCase() === (catKey || '').toLowerCase() ||
        p?.categoryLabel?.toLowerCase().includes((catKey || '').toLowerCase()) ||
        p?.categoryLabel?.toLowerCase().includes((catName || '').toLowerCase()) ||
        p?.name?.toLowerCase().includes((catKey || '').toLowerCase()) ||
        (targetCat && (
          p?.category === targetCat.key ||
          p?.category === targetCat.id ||
          p?.category?.toLowerCase() === targetCat.key?.toLowerCase() ||
          p?.category?.toLowerCase() === targetCat.id?.toLowerCase() ||
          p?.categoryLabel?.toLowerCase() === targetCat.name?.toLowerCase() ||
          p?.categoryLabel?.toLowerCase() === targetCat.bnName?.toLowerCase()
        ))
    ).length;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-1">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60">
            EXPLORE CATEGORIES
          </span>
          <span className="text-xs text-gray-400 font-medium hidden sm:inline">
            ({safeCategories.length} Categories Live)
          </span>
        </div>

        {selectedCategory !== 'all' && (
          <button
            onClick={() => onSelectCategory('all')}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold underline underline-offset-2 cursor-pointer"
          >
            Clear Filter (সব পণ্য দেখুন)
          </button>
        )}
      </div>

      {/* Dynamic Categories Pill Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {/* All Products Pill */}
        <button
          onClick={() => onSelectCategory('all')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shadow-2xs ${
            selectedCategory === 'all'
              ? 'bg-emerald-800 text-white shadow-emerald-900/20'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>All Products</span>
          {safeProducts.length > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === 'all'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {safeProducts.length}
            </span>
          )}
        </button>

        {/* Real-time Synced Categories from Admin Dashboard */}
        {safeCategories.map(cat => {
          const isActive = selectedCategory === cat?.key || selectedCategory === cat?.id;
          const count = getProductCount(cat?.key || '', cat?.name || '');
          const emoji = getEmoji(cat);

          return (
            <button
              key={cat?.id || cat?.key || Math.random()}
              onClick={() => onSelectCategory(cat?.key || cat?.id || '')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shadow-2xs ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-emerald-900/20'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
              title={cat?.bnName || cat?.name || ''}
            >
              <span>{cat?.name || ''}</span>

              {cat?.badge && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md uppercase tracking-wider ${
                    isActive
                      ? 'bg-amber-400 text-amber-950'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {cat.badge}
                </span>
              )}

              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                    isActive
                      ? 'bg-emerald-700 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
