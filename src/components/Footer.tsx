import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  ShieldCheck, 
  CreditCard, 
  Headphones, 
  Phone, 
  Mail, 
  MapPin, 
  X,
  MessageCircle
} from 'lucide-react';
import { api } from '../services/api';
import { INITIAL_STORE_SETTINGS } from '../data/initialData';
import { StoreSettings } from '../types';

interface FooterProps {
  onOpenTrackOrder: () => void;
  onOpenDashboard?: () => void;
  onOpenCPanel?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenTrackOrder,
  onOpenDashboard
}) => {
  const [activePolicyModal, setActivePolicyModal] = useState<string | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(INITIAL_STORE_SETTINGS);

  useEffect(() => {
    // Load initial settings
    api.getStoreSettings().then(settings => {
      if (settings) setStoreSettings(settings);
    });

    const handleSettingsUpdate = (e: CustomEvent<StoreSettings>) => {
      if (e.detail) {
        setStoreSettings(e.detail);
      }
    };

    window.addEventListener('arishten_settings_updated' as any, handleSettingsUpdate);
    return () => {
      window.removeEventListener('arishten_settings_updated' as any, handleSettingsUpdate);
    };
  }, []);

  const policyContent: Record<string, { title: string; body: string[] }> = {
    shipping: {
      title: 'Shipping Policy (ডেলিভারি নীতিমালা)',
      body: [
        '• ঢাকার ভেতরে ডেলিভারি চার্জ ৬০ টাকা (১-২ কার্যদিবসের মধ্যে ডেলিভারি)।',
        '• ঢাকার বাইরে সারা বাংলাদেশে ডেলিভারি চার্জ ১২০ টাকা (২-৪ কার্যদিবসের মধ্যে ডেলিভারি)।',
        '• কুরিয়ার সার্ভিসের মাধ্যমে নিরাপদ প্যাকেজিংয়ে পণ্য ডেলিভারি করা হয়।'
      ]
    },
    refund: {
      title: 'Return & Refund Policy (রিটার্ন ও রিফান্ড)',
      body: [
        '• পণ্য গ্রহণের সময় ডেলিভারিম্যানের সামনে চেক করে গ্রহণ করুন।',
        '• কোনো ত্রুটি বা সমস্যা পেলে তাৎক্ষণিকভাবে রিটার্ন করতে পারবেন।',
        '• প্রিপেইড পেমেন্টের ক্ষেত্রে ৩-৫ কার্যদিবসের মধ্যে মূল্য রিফান্ড করা হয়।'
      ]
    },
    privacy: {
      title: 'Privacy Policy (গোপনীয়তা নীতিমালা)',
      body: [
        '• আপনার ব্যক্তিগত তথ্য ও ফোন নম্বর সম্পূর্ণ গোপন ও সুরক্ষিত রাখা হয়।',
        '• শুধুমাত্র অর্ডার ডেলিভারি ও কাস্টমার সাপোর্টের প্রয়োজনে তথ্য ব্যবহৃত হয়।',
        '• তৃতীয় কোনো পক্ষের কাছে আপনার তথ্য কখনোই হস্তান্তর করা হয় না।'
      ]
    },
    terms: {
      title: 'Terms & Conditions (শর্তাবলী)',
      body: [
        '• সঠিক ফোন নম্বর ও ডেলিভারি ঠিকানা প্রদান করা আবশ্যক।',
        '• স্টক ও পণ্যের প্রাপ্যতা সাপেক্ষে অর্ডার কনফার্ম করা হয়।',
        '• যেকোনো অভিযোগ বা সহায়তার জন্য আমাদের হটলাইন নম্বরে যোগাযোগ করুন।'
      ]
    }
  };

  return (
    <footer className="bg-white border-t border-gray-200 mt-16 text-gray-700 font-sans">
      {/* 1. Top Feature Badges Bar */}
      <div className="border-b border-gray-100 bg-[#fbfcfd]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            {/* Feature 1 */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#e8f1ff] text-[#0066FF] flex items-center justify-center shrink-0 shadow-2xs">
                <Truck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">Fast Delivery</h4>
                <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">Across Bangladesh</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#e8f1ff] text-[#0066FF] flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">Genuine Products</h4>
                <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">100% authentic</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#e8f1ff] text-[#0066FF] flex items-center justify-center shrink-0 shadow-2xs">
                <CreditCard className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">Secure Payment</h4>
                <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">COD & online</p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#e8f1ff] text-[#0066FF] flex items-center justify-center shrink-0 shadow-2xs">
                <Headphones className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">7-Day Support</h4>
                <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">Always here for you</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Links & Information */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1: Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {/* Stylish A Logo */}
              <div className="relative w-8 h-8 flex items-center justify-center">
                <svg viewBox="0 0 40 40" className="w-8 h-8 fill-none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 4L7 34H15.5L20 22.5L24.5 34H33L20 4Z" fill="#1e293b" />
                  <path d="M14 26L20 12L23 20L18 26H14Z" fill="#0066FF" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">Arishten</span>
            </div>

            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-xs">
              Arishten — your modern destination for quality electronics and sanitary products in Bangladesh.
            </p>

            {/* Social Icons (Facebook round button) */}
            <div className="pt-2 flex items-center gap-2.5">
              <a
                href={storeSettings.facebookUrl ? (storeSettings.facebookUrl.startsWith('http') ? storeSettings.facebookUrl : `https://${storeSettings.facebookUrl}`) : 'https://facebook.com'}
                target="_blank"
                rel="noreferrer"
                className="w-[38px] h-[38px] rounded-full bg-gray-100 hover:bg-[#1877F2] text-gray-600 hover:text-white flex items-center justify-center transition-all text-[15px] font-bold shadow-2xs hover:scale-105"
                title="Follow us on Facebook"
              >
                f
              </a>
              {storeSettings.whatsappNumber && (
                <a
                  href={`https://wa.me/${storeSettings.whatsappNumber.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-[38px] h-[38px] rounded-full bg-gray-100 hover:bg-[#25D366] text-gray-600 hover:text-white flex items-center justify-center transition-all shadow-2xs hover:scale-105"
                  title="WhatsApp Support"
                >
                  <MessageCircle className="w-[18px] h-[18px]" />
                </a>
              )}
            </div>
          </div>

          {/* Column 2: CATEGORIES */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">
              CATEGORIES
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-gray-600">
              <li>
                <button
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#0066FF] transition-colors cursor-pointer text-left"
                >
                  All Products
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                  className="hover:text-[#0066FF] transition-colors cursor-pointer text-left"
                >
                  Wishlist
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenTrackOrder}
                  className="hover:text-[#0066FF] transition-colors cursor-pointer text-left"
                >
                  Track Order
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: SUPPORT */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">
              SUPPORT
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-gray-600">
              <li>
                <button
                  onClick={() => setActivePolicyModal('shipping')}
                  className="hover:text-[#0066FF] transition-colors cursor-pointer text-left"
                >
                  Shipping Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePolicyModal('refund')}
                  className="hover:text-[#0066FF] transition-colors cursor-pointer text-left"
                >
                  Return & Refund
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePolicyModal('privacy')}
                  className="hover:text-[#0066FF] transition-colors cursor-pointer text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePolicyModal('terms')}
                  className="hover:text-[#0066FF] transition-colors cursor-pointer text-left"
                >
                  Terms & Conditions
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: CONTACT */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">
              CONTACT
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-gray-600">
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#0066FF] shrink-0" />
                <a href="tel:+8801953756760" className="hover:text-[#0066FF] transition-colors">
                  +8801953-756760
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#0066FF] shrink-0" />
                <a href="mailto:info@arishstore.com" className="hover:text-[#0066FF] transition-colors">
                  info@arishstore.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#0066FF] shrink-0" />
                <span>Noakhali , Bangladesh</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 3. Bottom Copyright Bar */}
      <div className="border-t border-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <p>© 2026 All rights reserved.</p>
            <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">v1.0.2</span>
          </div>
          <div className="flex items-center gap-4">
            <p>
              Developed by{' '}
              <a
                href="https://orbgate.com/services"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0066FF] font-bold hover:underline"
              >
                Orb Gate
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* 4. Floating WhatsApp Action Button */}
      <a
        href="https://wa.me/8801953756760?text=Hello%20Arishten%2C%20I%20have%20an%20inquiry"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 w-13 h-13 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group"
        title="Chat with us on WhatsApp (+8801953-756760)"
      >
        <MessageCircle className="w-7 h-7 fill-white stroke-[#25D366]" />
        <span className="sr-only">WhatsApp Chat</span>
      </a>

      {/* Policy Modal */}
      {activePolicyModal && policyContent[activePolicyModal] && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-gray-100">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">
                {policyContent[activePolicyModal].title}
              </h3>
              <button
                onClick={() => setActivePolicyModal(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 text-xs sm:text-sm text-gray-600 leading-relaxed mb-6">
              {policyContent[activePolicyModal].body.map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </div>
            <button
              onClick={() => setActivePolicyModal(null)}
              className="w-full py-2 bg-[#0066FF] hover:bg-blue-700 text-white font-semibold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </footer>
  );
};

