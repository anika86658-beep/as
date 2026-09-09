import React from 'react';
import { Award, Headphones, ShieldCheck, Sparkles, Truck } from 'lucide-react';

export const HeroBanner: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pt-1.5 pb-1">
      <div className="relative overflow-hidden rounded-xl sm:rounded-3xl bg-gradient-to-r from-blue-50 via-sky-100/70 to-blue-200/80 border border-blue-100/80 shadow-xs px-3 sm:px-6 py-4 sm:py-8 lg:py-10 flex flex-col justify-center text-center">
        {/* Subtle background decorative shapes */}
        <div className="absolute -top-12 -left-12 w-24 h-24 sm:w-48 sm:h-48 bg-blue-300/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-24 h-24 sm:w-48 sm:h-48 bg-sky-400/20 rounded-full blur-2xl pointer-events-none" />

        {/* Decorative Grid Dots (Hidden on mobile for compactness) */}
        <div className="hidden sm:flex justify-center mb-3">
          <div className="grid grid-cols-4 gap-1 opacity-40">
            {[...Array(8)].map((_, i) => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            ))}
          </div>
        </div>

        {/* Brand Header */}
        <div className="flex items-center justify-center gap-1 mb-0.5 sm:mb-2">
          <div className="w-4 h-4 sm:w-6 sm:h-6 rounded bg-blue-600 flex items-center justify-center text-white font-black text-[10px] sm:text-sm">
            A
          </div>
          <span className="text-sm sm:text-2xl font-extrabold tracking-tight text-gray-900">
            Arishten
          </span>
        </div>

        {/* Main Bold Headline */}
        <h1 className="text-sm sm:text-3xl md:text-5xl font-black text-blue-950 tracking-tight leading-tight uppercase mb-1 sm:mb-2">
          SMART CHOICES.
          <span className="block text-blue-900 font-extrabold text-xs sm:text-3xl mt-0.5">BETTER LIVING.</span>
        </h1>



        {/* Quality Badge */}
        <div className="inline-flex items-center gap-1 mx-auto bg-white text-blue-950 px-2.5 py-0.5 sm:py-1.5 rounded-md sm:rounded-lg border border-blue-200 text-[10px] sm:text-sm font-bold shadow-xs my-1 sm:my-3">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-blue-600 text-white flex items-center justify-center text-[8px] sm:text-[10px]">
            ✓
          </div>
          <span>Quality You Can Trust.</span>
        </div>

        {/* Bottom Feature Badges */}
        <div className="grid grid-cols-3 max-w-sm sm:max-w-md mx-auto gap-1.5 sm:gap-4 mt-2 sm:mt-6 pt-2 sm:pt-6 border-t border-blue-200/50">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 mb-0.5 sm:mb-2">
              <Award className="w-3 h-3 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[8px] sm:text-xs font-extrabold text-blue-950 tracking-tight uppercase leading-none">
              PREMIUM QUALITY
            </span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 mb-0.5 sm:mb-2">
              <Headphones className="w-3 h-3 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[8px] sm:text-xs font-extrabold text-blue-950 tracking-tight uppercase leading-none">
              EXPERT SUPPORT
            </span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 mb-0.5 sm:mb-2">
              <Truck className="w-3 h-3 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[8px] sm:text-xs font-extrabold text-blue-950 tracking-tight uppercase leading-none">
              FAST & SAFE DELIVERY
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
