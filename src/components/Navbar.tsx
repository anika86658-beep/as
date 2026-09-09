import React, { useState } from 'react';
import { Search, Phone, ShoppingCart, User, Truck, LayoutDashboard, Cloud, ShieldCheck, Leaf } from 'lucide-react';
import { Product } from '../types';

interface NavbarProps {
  activeView: 'shop' | 'dashboard' | 'cpanel' | 'error';
  setActiveView: (view: 'shop' | 'dashboard' | 'cpanel' | 'error') => void;
  cartCount: number;
  cartTotal: number;
  openCart: () => void;
  openTrackOrder: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  products: Product[];
  onSelectProduct: (p: Product) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  cartCount,
  cartTotal,
  openCart,
  openTrackOrder,
  searchQuery,
  setSearchQuery,
  products,
  onSelectProduct
}) => {
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const searchResults = searchQuery.trim()
    ? products.filter(
        p =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.bnName.includes(searchQuery) ||
          p.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveView('shop')}>
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 p-[2px] shadow-md shadow-amber-500/30 group-hover:scale-105 transition-transform flex items-center justify-center ring-2 ring-amber-400/80">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-900 to-blue-950 flex items-center justify-center relative overflow-hidden shadow-inner">
              <div className="absolute inset-0 bg-amber-400/10 rounded-full blur-[2px]" />
              <svg viewBox="0 0 100 100" className="w-full h-full p-1 drop-shadow-md">
                <defs>
                  <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FEF08A" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#D97706" />
                  </linearGradient>
                </defs>
                <text x="50" y="72" fontSize="64" fontWeight="900" fontFamily="serif" textAnchor="middle" fill="url(#goldGrad)">A</text>
                <path d="M 30 52 Q 50 44 70 52" fill="none" stroke="url(#goldGrad)" strokeWidth="4.5" strokeLinecap="round" />
                <path d="M 68 48 Q 80 36 84 26 Q 76 38 68 48 Z" fill="url(#goldGrad)" />
                <path d="M 72 44 Q 82 40 88 32 Q 80 38 72 44 Z" fill="url(#goldGrad)" />
              </svg>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-gray-900 group-hover:text-blue-600 transition-colors">Arishten</span>
            </div>
          </div>
        </div>

        {/* Search Bar with Autocomplete Dropdown */}
        <div className="flex-1 max-w-xl relative hidden md:block">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              placeholder="Search your items..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50/80 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all text-gray-800 placeholder-gray-400"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Autocomplete Dropdown */}
          {showSearchDropdown && searchQuery.trim() && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto">
              <div className="p-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100 flex justify-between">
                <span>Matching Organic Products ({searchResults.length})</span>
                <button
                  onClick={() => setShowSearchDropdown(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  Close ✕
                </button>
              </div>
              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  কোন পণ্য খুঁজে পাওয়া যায়নি &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                searchResults.map(prod => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      onSelectProduct(prod);
                      setShowSearchDropdown(false);
                    }}
                    className="p-2.5 hover:bg-emerald-50/60 flex items-center gap-3 cursor-pointer border-b border-gray-50 transition-colors"
                  >
                    <img
                      src={prod.image}
                      alt={prod.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{prod.name}</p>
                      {prod.bnName && prod.bnName.trim() !== '' && prod.bnName.toLowerCase() !== prod.name.toLowerCase() && (
                        <p className="text-xs text-gray-500">{prod.bnName}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-700">৳{prod.price}</span>
                      {prod.weight && <span className="text-[10px] text-gray-400 block">{prod.weight}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Phone Hotline Pill */}
          <a
            href="tel:+8801345302537"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
            <span>+8801345302537</span>
          </a>
        </div>
      </div>
    </header>
  );
};
