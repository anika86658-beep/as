import React, { useState, useRef, useEffect } from 'react';
import { X, Search, CheckCircle2, Clock, Truck, Package, MapPin, Phone, AlertCircle, RefreshCw, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { api } from '../services/api';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderId?: string;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  initialOrderId = ''
}) => {
  const [orderNumberInput, setOrderNumberInput] = useState(initialOrderId);
  const [phoneInput, setPhoneInput] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Swipe-to-dismiss gesture refs
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

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

    // Swipe right from left edge (swipe back gesture on mobile) or swipe down
    if ((touchStartX.current < 50 && diffX > 60 && Math.abs(diffY) < 60) || (diffY > 140 && Math.abs(diffX) < 60)) {
      onClose();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  useEffect(() => {
    if (initialOrderId) {
      setOrderNumberInput(initialOrderId);
      handleSearch(initialOrderId, '');
    }
  }, [initialOrderId, isOpen]);

  const handleSearch = async (customOrderNum?: string, customPhone?: string) => {
    const ordNum = (customOrderNum !== undefined ? customOrderNum : orderNumberInput).trim();
    const ph = (customPhone !== undefined ? customPhone : phoneInput).trim();

    if (!ordNum) {
      setError('অনুগ্রহ করে সঠিক অর্ডার নম্বর দিন (যেমন: ARISH-8924)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const order = await api.getOrder(ordNum, ph);
      if (order) {
        // If phone was provided, verify matching
        if (ph) {
          const cleanPh = ph.replace(/\D/g, '');
          const ordPh = (order.phone || '').replace(/\D/g, '');
          const ordAltPh = (order.altPhone || '').replace(/\D/g, '');
          if (!ordPh.includes(cleanPh) && !ordAltPh.includes(cleanPh) && !cleanPh.includes(ordPh)) {
            setSearchedOrder(null);
            setError('অর্ডার নম্বর ও মোবাইল নম্বর মেলেনি। সঠিক মোবাইল নম্বর দিয়ে আবার চেষ্টা করুন।');
            setLoading(false);
            return;
          }
        }
        setSearchedOrder(order);
      } else {
        setSearchedOrder(null);
        setError(`কোন অর্ডার খুঁজে পাওয়া যায়নি: "${ordNum}". দয়া করে সঠিক Order ID ও ফোন নম্বর দিন।`);
      }
    } catch (err) {
      setError('অর্ডার তথ্য লোড করতে ত্রুটি হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">অর্ডার গৃহীত (Pending)</span>;
      case 'verified':
      case 'packaging':
      case 'processing':
        return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">কনফার্মড (Confirmed)</span>;
      case 'shipped':
      case 'out_for_delivery':
        return <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-1 rounded-full">কুরিয়ারে হস্তান্তর (In Transit)</span>;
      case 'delivered':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">ডেলিভার সম্পন্ন (Delivered)</span>;
      case 'cancelled':
        return <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full">বাতিল (Cancelled)</span>;
      default:
        return null;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="bg-emerald-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black">অর্ডার লাইভ প্রগ্রেস ট্র্যাকার</h2>
              <p className="text-xs text-emerald-200">Track Order Progress & Delivery Timeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-emerald-800/80 hover:bg-emerald-700 flex items-center justify-center text-emerald-200 hover:text-white transition-colors cursor-pointer active:scale-95"
            title="বন্ধ করুন (Close)"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Two-factor privacy search: Order ID + Phone Number */}
          <div className="space-y-3 bg-gray-50 p-3.5 sm:p-4 rounded-2xl border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  অর্ডার নম্বর (Order ID) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="যেমন: ARISH-8924"
                    value={orderNumberInput}
                    onChange={e => setOrderNumberInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  মোবাইল নম্বর (Phone)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="01XXXXXXXXX"
                    value={phoneInput}
                    onChange={e => setPhoneInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-700/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>তথ্য যাচাই করা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>অর্ডার ট্র্যাক করুন (Track Order)</span>
                </>
              )}
            </button>
          </div>

          {/* Error notice */}
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Searched Order Details & Timeline */}
          {searchedOrder && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Order Quick Summary Header */}
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/60 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-gray-900 font-mono">
                      #{searchedOrder.orderNumber}
                    </span>
                    {getStatusBadge(searchedOrder.status)}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    গ্রাহক: <span className="font-semibold text-gray-800">{searchedOrder.customerName}</span> ({searchedOrder.phone})
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-gray-500 block">মোট প্রদেয় মূল্য</span>
                  <span className="text-base sm:text-lg font-black text-emerald-800">
                    ৳{searchedOrder.totalAmount}
                  </span>
                  <span className="text-[10px] text-gray-400 uppercase block font-semibold">
                    {searchedOrder.paymentMethod.toUpperCase()} • {searchedOrder.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Courier Information if shipped */}
              {searchedOrder.courierTrackingId && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-bold text-blue-950">
                        কুরিয়ার পার্টনার: {searchedOrder.courierName || 'Steadfast / Pathao'}
                      </p>
                      <p className="text-blue-700 font-mono text-[11px]">
                        ট্র্যাকিং কোড: {searchedOrder.courierTrackingId}
                      </p>
                    </div>
                  </div>
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    Live Courier
                  </span>
                </div>
              )}

              {/* Visual Step-by-Step Progress Timeline */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-4 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>অর্ডার প্রগ্রেস টাইমলাইন (Work & Delivery Progress)</span>
                </h3>

                <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                  {searchedOrder.timeline.map((event, idx) => {
                    const isPassed = event.completed;
                    return (
                      <div key={idx} className="relative group">
                        {/* Dot indicator */}
                        <div
                          className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                            isPassed
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-gray-300 text-gray-300'
                          }`}
                        >
                          {isPassed ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                          )}
                        </div>

                        {/* Event Content */}
                        <div
                          className={`p-3 rounded-xl border transition-all ${
                            isPassed
                              ? 'bg-white border-gray-200 shadow-2xs'
                              : 'bg-gray-50/50 border-dashed border-gray-200 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <h4
                              className={`text-xs font-bold ${
                                isPassed ? 'text-gray-900' : 'text-gray-500'
                              }`}
                            >
                              {event.title}
                            </h4>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {event.timestamp}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{event.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Items List */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-xs font-bold uppercase text-gray-600 mb-2">অর্ডারের পণ্যসমূহ</h4>
                <div className="space-y-2">
                  {searchedOrder.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl text-xs">
                      <div className="flex items-center gap-2">
                        <img
                          src={item.image}
                          alt={item.productName}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded object-cover bg-white"
                        />
                        <div>
                          <p className="font-semibold text-gray-800">{item.productName}</p>
                          <p className="text-[10px] text-gray-500">
                            {item.quantity} পিস • {item.weight}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-gray-900">৳{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address Details */}
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 text-xs text-gray-700 space-y-2.5">
                <div className="grid grid-cols-2 gap-2.5 pb-2.5 border-b border-gray-200">
                  <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-2xs">
                    <span className="block text-[10px] uppercase font-bold text-gray-500 mb-0.5">
                      জেলা (District)
                    </span>
                    <p className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{searchedOrder.district || 'Dhaka'}</span>
                    </p>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-2xs">
                    <span className="block text-[10px] uppercase font-bold text-gray-500 mb-0.5">
                      থানা / উপজেলা (Thana)
                    </span>
                    <p className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-1.5">
                      <span className="text-emerald-600 font-bold">🏛️</span>
                      <span>{searchedOrder.upazila || searchedOrder.city || 'সদর'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-0.5">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-gray-900 block text-[11px] uppercase tracking-wider text-gray-500">
                      পূর্ণাঙ্গ ঠিকানা (Full Address):
                    </span>
                    <p className="text-xs sm:text-sm font-medium text-gray-800 leading-relaxed mt-0.5">
                      {searchedOrder.address}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer / Back to Shop action */}
          <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-emerald-700 transition-colors cursor-pointer py-1.5 px-3 rounded-xl hover:bg-gray-100 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>হোমে ফিরে যান (Back to Store)</span>
            </button>
            <span className="text-[11px] text-gray-400">Arishten Live Track</span>
          </div>
        </div>
      </div>
    </div>
  );
};
