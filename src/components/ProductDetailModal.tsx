import React, { useState, useRef, useEffect } from 'react';
import { X, ShieldCheck, Star, Truck, ShoppingCart, ArrowRight, ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../types';
import { RichDescriptionRenderer } from './RichDescriptionRenderer';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onBuyNow: (product: Product, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onBuyNow
}) => {
  const [quantity, setQuantity] = useState(1);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Touch Swipe tracking refs
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  // Modal swipe-to-dismiss gesture ref
  const modalTouchStartX = useRef<number | null>(null);
  const modalTouchStartY = useRef<number | null>(null);

  // Synchronize Image Preview with browser history & mobile back button
  useEffect(() => {
    const handlePopState = () => {
      if (showImagePreview) {
        setShowImagePreview(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showImagePreview]);

  const handleOpenImagePreview = () => {
    setShowImagePreview(true);
    try {
      window.history.pushState({ modal: 'image_preview', productId: product?.id }, '', '#preview');
    } catch (e) {}
  };

  const handleCloseImagePreview = () => {
    if (window.location.hash === '#preview' || window.history.state?.modal === 'image_preview') {
      window.history.back();
    } else {
      setShowImagePreview(false);
    }
  };

  if (!product) return null;

  const productImages = product.images && product.images.length > 0 
    ? product.images 
    : [product.image].filter(Boolean);
  const currentImage = productImages[activeImageIndex] || product.image;

  const handleNextImage = () => {
    if (productImages.length <= 1) return;
    setActiveImageIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1));
  };

  const handlePrevImage = () => {
    if (productImages.length <= 1) return;
    setActiveImageIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1));
  };

  const onTouchStartHandler = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };

  const onTouchMoveHandler = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };

  const onTouchEndHandler = () => {
    if (touchStartX.current === null || touchEndX.current === null || touchStartY.current === null || touchEndY.current === null) {
      return;
    }
    const diffX = touchStartX.current - touchEndX.current;
    const diffY = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 35;

    // Ensure horizontal gesture is dominant over vertical scroll
    if (Math.abs(diffX) > minSwipeDistance && Math.abs(diffX) > Math.abs(diffY) * 1.2) {
      if (diffX > 0) {
        // Swiped Left -> Show Next image
        handleNextImage();
      } else {
        // Swiped Right -> Show Previous image
        handlePrevImage();
      }
    }

    // Reset touch coordinates
    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    touchEndY.current = null;
  };

  // Swipe right / swipe down to dismiss modal on mobile
  const handleModalTouchStart = (e: React.TouchEvent) => {
    modalTouchStartX.current = e.touches[0].clientX;
    modalTouchStartY.current = e.touches[0].clientY;
  };

  const handleModalTouchEnd = (e: React.TouchEvent) => {
    if (modalTouchStartX.current === null || modalTouchStartY.current === null) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = endX - modalTouchStartX.current;
    const diffY = endY - modalTouchStartY.current;

    // Swipe right from left edge (swipe back gesture on mobile) or swipe down
    if ((modalTouchStartX.current < 50 && diffX > 60 && Math.abs(diffY) < 60) || (diffY > 120 && Math.abs(diffX) < 60)) {
      onClose();
    }
    modalTouchStartX.current = null;
    modalTouchStartY.current = null;
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onTouchStart={handleModalTouchStart}
      onTouchEnd={handleModalTouchEnd}
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 overflow-hidden my-auto border border-gray-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-50 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl flex items-center justify-center transition-all cursor-pointer border-2 border-white active:scale-95"
          title="বন্ধ করুন (Close)"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        <div className="grid sm:grid-cols-2">
          {/* Product Image Gallery with Touch Swipe */}
          <div className="flex flex-col bg-gray-50/90 p-3 sm:p-3.5 gap-2.5 sm:border-r border-gray-200/70">
            <div 
              className="relative w-full pt-[100%] sm:pt-0 sm:h-72 rounded-2xl bg-white overflow-hidden group border-2 border-gray-300 shadow-sm flex items-center justify-center select-none touch-pan-y"
              onTouchStart={onTouchStartHandler}
              onTouchMove={onTouchMoveHandler}
              onTouchEnd={onTouchEndHandler}
            >
              <div
                className="absolute inset-0 cursor-pointer flex items-center justify-center"
                onClick={handleOpenImagePreview}
                title="ছবি বড় করে দেখতে ক্লিক করুন বা সোয়াইপ করুন"
              >
                <img
                  key={activeImageIndex}
                  src={currentImage}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain p-1.5 transition-all duration-300 animate-in fade-in zoom-in-98"
                />
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <span className="bg-black/80 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg">পূর্ণস্ক্রিন বড় করে দেখুন</span>
                </div>
              </div>

              {/* Slide Previous / Next Buttons */}
              {productImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevImage();
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md flex items-center justify-center border border-gray-200 transition-all z-10 cursor-pointer active:scale-95"
                    title="আগের ছবি"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-800" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextImage();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md flex items-center justify-center border border-gray-200 transition-all z-10 cursor-pointer active:scale-95"
                    title="পরের ছবি"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-800" />
                  </button>

                  {/* Pagination Dots Indicator on Image */}
                  <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full pointer-events-none">
                    {productImages.map((_, dotIdx) => (
                      <span
                        key={dotIdx}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          activeImageIndex === dotIdx ? 'w-4 bg-emerald-400' : 'w-2 bg-white/70'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {product.discountBadge && (
                <span className="absolute top-3 left-3 bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-md uppercase shadow-sm pointer-events-none">
                  {product.discountBadge}
                </span>
              )}
            </div>

            {/* Thumbnails if multiple images exist */}
            {productImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer bg-white ${
                      activeImageIndex === idx ? 'border-emerald-600 ring-2 ring-emerald-200 scale-105' : 'border-gray-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain p-0.5" />
                  </button>
                ))}
              </div>
            )}

            {/* Quantity and Actions (Placed right under the images) */}
            <div className="pt-2 border-t border-gray-200/80 space-y-2.5">
              <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-2xs">
                <span className="text-xs font-bold text-gray-700 uppercase">পরিমাণ (Quantity):</span>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold cursor-pointer transition-colors active:scale-95"
                  >
                    -
                  </button>
                  <span className="w-10 text-center text-sm font-black text-gray-900 bg-white py-1">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold cursor-pointer transition-colors active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onAddToCart(product, quantity);
                    onClose();
                  }}
                  className="w-full py-2.5 rounded-xl border-2 border-emerald-700 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-50 transition-colors cursor-pointer active:scale-95 shadow-2xs"
                >
                  <ShoppingCart className="w-4 h-4" /> কার্টে যোগ করুন
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onBuyNow(product, quantity);
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-700/20 transition-colors cursor-pointer active:scale-95"
                >
                  সরাসরি অর্ডার করুন <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Taka Details under Action Buttons */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-gray-500 font-medium block">মূল্য বিবরণী (Total Price)</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-black text-emerald-800">৳{product.price * quantity}</span>
                    {quantity > 1 && (
                      <span className="text-[11px] text-gray-500 font-medium">(৳{product.price} × {quantity})</span>
                    )}
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-xs text-gray-400 line-through">
                        ৳{product.originalPrice * quantity}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md">
                  ইন স্টক
                </span>
              </div>
            </div>
          </div>

          {/* Full Screen Image Lightbox Modal with Swipe */}
          {showImagePreview && (
            <div 
              className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-md select-none touch-pan-y animate-in fade-in duration-150"
              onTouchStart={onTouchStartHandler}
              onTouchMove={onTouchMoveHandler}
              onTouchEnd={onTouchEndHandler}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  handleCloseImagePreview();
                }
              }}
            >
              <button
                onClick={handleCloseImagePreview}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-all shadow-2xl cursor-pointer border-2 border-white/40 active:scale-95"
                title="বন্ধ করুন (Close)"
              >
                <X className="w-7 h-7 stroke-[2.5]" />
              </button>

              {/* Lightbox Slide Buttons */}
              {productImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevImage();
                    }}
                    className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all z-50 cursor-pointer border border-white/40 shadow-2xl active:scale-95"
                    title="আগের ছবি"
                  >
                    <ChevronLeft className="w-7 h-7" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextImage();
                    }}
                    className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all z-50 cursor-pointer border border-white/40 shadow-2xl active:scale-95"
                    title="পরের ছবি"
                  >
                    <ChevronRight className="w-7 h-7" />
                  </button>
                </>
              )}

              <div className="relative max-w-5xl max-h-[92vh] w-full h-full flex flex-col items-center justify-center p-2">
                <div className="relative border-4 border-white/90 rounded-2xl overflow-hidden bg-black/50 shadow-2xl max-w-full max-h-[85vh] flex items-center justify-center">
                  <img
                    key={activeImageIndex}
                    src={currentImage}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="max-w-full max-h-[82vh] w-auto h-auto object-contain p-2 transition-all duration-300 animate-in fade-in zoom-in-95"
                  />
                </div>
                <div className="mt-4 text-white text-xs sm:text-sm font-bold tracking-wide bg-black/70 px-5 py-2 rounded-full border border-white/30 shadow-lg flex items-center gap-2">
                  <span>{product.name} {product.weight ? `(${product.weight})` : ''}</span>
                  {productImages.length > 1 && (
                    <span className="text-emerald-400 font-black">({activeImageIndex + 1} / {productImages.length})</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Details */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {product.categoryLabel &&
                  product.categoryLabel.trim() !== '' &&
                  product.categoryLabel !== 'অর্গানিক ফুড' &&
                  product.categoryLabel.toLowerCase() !== product.name.toLowerCase() && (
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                    {product.categoryLabel}
                  </span>
                )}
                {product.weight && (
                  <>
                    {product.categoryLabel &&
                      product.categoryLabel.trim() !== '' &&
                      product.categoryLabel !== 'অর্গানিক ফুড' &&
                      product.categoryLabel.toLowerCase() !== product.name.toLowerCase() && (
                      <span className="text-gray-300">•</span>
                    )}
                    <span className="text-xs font-semibold text-gray-500">{product.weight}</span>
                  </>
                )}
              </div>

              <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
              {product.bnName && product.bnName.trim() !== '' && product.bnName.toLowerCase() !== product.name.toLowerCase() && (
                <p className="text-sm text-emerald-800 font-medium">{product.bnName}</p>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-2xl font-black text-gray-900">৳{product.price}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-sm text-gray-400 line-through">
                    ৳{product.originalPrice}
                  </span>
                )}
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  ইন স্টক
                </span>
              </div>

              {/* Description */}
              <div className="mt-3.5 pt-3 border-t border-gray-150/80">
                <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">পণ্যের বিবরণ (Description):</h4>
                <RichDescriptionRenderer content={product.description} />
              </div>

              {/* Product Highlights / Specifications (only if provided) */}
              {product.features && product.features.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  {product.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-gray-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Back to Shop quick action */}
              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-1.5 font-bold text-gray-600 hover:text-emerald-700 transition-colors cursor-pointer py-1.5 px-3 rounded-lg hover:bg-gray-100"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>দোকানে ফিরে যান (Back to Shop)</span>
                </button>
                <span className="text-[11px] text-gray-400">Arishten Express</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
