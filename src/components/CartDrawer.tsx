import React, { useRef } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ArrowLeft, ShoppingBag, ShieldCheck } from 'lucide-react';
import { Product } from '../types';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout
}) => {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (!isOpen) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = endX - touchStartX.current;
    const diffY = endY - touchStartY.current;

    // If user swiped right (towards the right edge) by at least 60px with low vertical movement
    if (diffX > 60 && Math.abs(diffY) < 60) {
      onClose();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in cursor-pointer"
        title="বন্ধ করুন (Close)"
      />

      <div 
        className="fixed inset-y-0 right-0 max-w-full flex pl-10"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">আপনার শপিং ব্যাগ</h2>
                <p className="text-xs text-gray-500">{totalItems} টি পণ্য যুক্ত করা হয়েছে</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer active:scale-95"
              title="বন্ধ করুন (Close)"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-8 h-8 opacity-60" />
                </div>
                <h3 className="text-base font-bold text-gray-800">আপনার ব্যাগ খালি!</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  আমাদের ফ্রেশ অরগানিক মধু, ঘানি ভাঙ্গা সরিষার তেল ও খাঁটি মসলা থেকে পণ্য যোগ করুন।
                </p>
                <button
                  onClick={onClose}
                  className="mt-4 px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl hover:bg-emerald-800 transition-colors cursor-pointer"
                >
                  পণ্য ব্রাউজ করুন
                </button>
              </div>
            ) : (
              cart.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex gap-3 p-3 bg-gray-50/60 rounded-2xl border border-gray-100 hover:border-emerald-200 transition-colors"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-18 h-18 rounded-xl object-cover bg-white"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                          {product.name}
                        </h4>
                        <button
                          onClick={() => onRemoveItem(product.id)}
                          className="text-gray-400 hover:text-red-500 p-1 transition-colors cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {product.weight && <p className="text-[11px] text-emerald-800 font-medium">{product.weight}</p>}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-black text-gray-900">
                        ৳{product.price * quantity}
                      </span>

                      {/* Quantity Controls */}
                      <div className="flex items-center border border-gray-200 bg-white rounded-lg overflow-hidden shadow-2xs">
                        <button
                          onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                          className="p-1 hover:bg-gray-100 text-gray-600 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-gray-800">
                          {quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                          className="p-1 hover:bg-gray-100 text-gray-600 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-white space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>সাবটোটাল (Subtotal):</span>
                  <span className="font-bold text-gray-900">৳{subtotal}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>ডেলিভারি চার্জ (Delivery):</span>
                  <span className="text-emerald-700 font-semibold">চেকআউটে সিলেক্ট করুন</span>
                </div>
                <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-100">
                  <span>সর্বমোট প্রদেয় (Est. Total):</span>
                  <span className="text-emerald-800">৳{subtotal}</span>
                </div>
              </div>

              <div className="p-2 bg-emerald-50 rounded-xl flex items-center gap-1.5 text-[11px] text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে টাকা পরিশোধ করুন)</span>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 transition-all cursor-pointer active:scale-95"
              >
                <span>অর্ডার কনফার্ম করুন (Checkout)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>শপিং চালিয়ে যান (Continue Shopping)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
