import React, { useState, useRef } from 'react';
import { Plus, Check, Eye, ChevronLeft, ChevronRight, ShoppingBag, ArrowRight } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onQuickBuy: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  quantityInCart: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onQuickBuy,
  onViewDetails,
  quantityInCart
}) => {
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  const productImages = product.images && product.images.length > 0 
    ? product.images 
    : [product.image].filter(Boolean);
  const currentImage = productImages[activeImgIndex] || product.image;

  const handleNextImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (productImages.length <= 1) return;
    setActiveImgIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1));
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (productImages.length <= 1) return;
    setActiveImgIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchEndX.current === null || touchStartY.current === null || touchEndY.current === null) {
      return;
    }
    const diffX = touchStartX.current - touchEndX.current;
    const diffY = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 30;

    if (Math.abs(diffX) > minSwipeDistance && Math.abs(diffX) > Math.abs(diffY) * 1.2) {
      // Prevent opening detail view when swiping horizontally on card
      e.stopPropagation();
      if (diffX > 0) {
        handleNextImage();
      } else {
        handlePrevImage();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    touchEndY.current = null;
  };

  return (
    <div className="group bg-white rounded-2xl border border-gray-150 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col justify-between select-none">
      {/* Product Image & Badges with Touch Swipe */}
      <div 
        className="relative w-full pt-[100%] overflow-hidden bg-white border-b-2 border-gray-100 cursor-pointer p-1 touch-pan-y" 
        onClick={() => onViewDetails(product)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          key={activeImgIndex}
          src={currentImage}
          alt={product.name}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-contain p-1.5 border-2 border-gray-200 rounded-xl group-hover:scale-105 transition-transform duration-300 bg-white animate-in fade-in zoom-in-98"
        />

        {/* Swipe arrow controls for multiple images on hover/touch */}
        {productImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevImage}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-sm flex items-center justify-center border border-gray-200 transition-all z-10 cursor-pointer active:scale-95 opacity-0 group-hover:opacity-100 sm:opacity-0"
              title="আগের ছবি"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNextImage}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-sm flex items-center justify-center border border-gray-200 transition-all z-10 cursor-pointer active:scale-95 opacity-0 group-hover:opacity-100 sm:opacity-0"
              title="পরের ছবি"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Pagination dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-full pointer-events-none">
              {productImages.map((_, dotIdx) => (
                <span
                  key={dotIdx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeImgIndex === dotIdx ? 'w-3 bg-emerald-400' : 'w-1.5 bg-white/70'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Discount / Tag Badge (Top Left) */}
        {product.discountBadge && (
          <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
            <span
              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider shadow-xs ${
                product.discountBadge === 'BESTSELLER'
                  ? 'bg-emerald-600 text-white'
                  : product.discountBadge.includes('OFF')
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-700 text-white'
              }`}
            >
              {product.discountBadge}
            </span>
          </div>
        )}

        {/* Weight Tag (Top Right) */}
        {product.weight && (
          <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
            <span className="text-[10px] font-bold text-gray-700 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md border border-gray-200/60 shadow-xs">
              {product.weight}
            </span>
          </div>
        )}

        {/* Quick view overlay on hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(product);
          }}
          className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer pointer-events-none sm:pointer-events-auto"
        >
          <span className="bg-white/90 backdrop-blur-xs text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="w-3.5 h-3.5" /> বিস্তারিত দেখুন
          </span>
        </button>
      </div>

      {/* Product Information */}
      <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Category Tag - only show if manually provided and not legacy default */}
          {product.categoryLabel &&
            product.categoryLabel.trim() !== '' &&
            product.categoryLabel !== 'অর্গানিক ফুড' &&
            product.categoryLabel.toLowerCase() !== product.name.toLowerCase() && (
            <span className="text-[9px] font-extrabold tracking-wider text-emerald-700 uppercase">
              {product.categoryLabel}
            </span>
          )}

          {/* Product Title */}
          <h3
            onClick={() => onViewDetails(product)}
            className="text-[10px] sm:text-xs font-bold text-gray-900 line-clamp-2 hover:text-emerald-700 transition-colors cursor-pointer mt-0.5"
          >
            {product.name}
          </h3>

          {/* Bengali Name - only show if different from name */}
          {product.bnName && product.bnName.trim() !== '' && product.bnName.toLowerCase() !== product.name.toLowerCase() && (
            <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{product.bnName}</p>
          )}
        </div>

        {/* Price and Action Buttons Section */}
        <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-sm sm:text-base font-black text-gray-900">
                ৳{product.price}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-[10px] text-gray-400 line-through font-normal">
                  ৳{product.originalPrice}
                </span>
              )}
            </div>
            {product.weight && (
              <span className="text-[10px] text-gray-500 font-medium">{product.weight}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            {/* Add to Cart Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
              className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer active:scale-95 border ${
                quantityInCart > 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-800 border-gray-200'
              }`}
              title="কার্টে যোগ করুন"
            >
              {quantityInCart > 0 ? (
                <>
                  <Check className="w-3 h-3 text-emerald-700 stroke-[3]" />
                  <span>কার্ট ({quantityInCart})</span>
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3 text-gray-600 stroke-[2.5]" />
                  <span>কার্ট</span>
                </>
              )}
            </button>

            {/* Direct Order Now Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickBuy(product);
              }}
              className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-all cursor-pointer active:scale-95"
              title="সরাসরি অর্ডার করুন"
            >
              <span>অর্ডার করুন</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
