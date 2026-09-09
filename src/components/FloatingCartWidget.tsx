import React, { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';

interface FloatingCartWidgetProps {
  cartCount: number;
  cartTotal: number;
  onClick: () => void;
}

export const FloatingCartWidget: React.FC<FloatingCartWidgetProps> = ({
  cartCount,
  cartTotal,
  onClick
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (cartCount > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300); // 300ms (< 1 second) animation
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  return (
    <div
      onClick={onClick}
      className={`fixed right-0 top-1/2 -translate-y-1/2 z-50 shadow-2xl rounded-l-xl overflow-hidden cursor-pointer flex flex-col items-center w-12 sm:w-16 transition-all hover:scale-105 border-l border-y border-white/20 select-none group duration-200 ${
        isAnimating ? 'scale-110 ring-2 ring-emerald-400' : ''
      }`}
      title="Open Cart"
    >
      {/* Top Green Half */}
      <div className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white py-1.5 px-0.5 sm:py-2.5 sm:px-1 flex flex-col items-center justify-center text-center transition-colors">
        <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5 group-hover:scale-110 transition-transform" />
        <span className="text-[9px] sm:text-[10px] font-bold whitespace-nowrap">{cartCount} item</span>
      </div>

      {/* Bottom Dark Half */}
      <div className="w-full bg-[#111827] text-white py-1.5 px-0.5 sm:py-2 sm:px-1 flex flex-col items-center justify-center text-center border-t border-black/30">
        <span className="text-[10px] sm:text-[11px] font-black tracking-tight whitespace-nowrap font-mono">৳{cartTotal}</span>
      </div>
    </div>
  );
};

