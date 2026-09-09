import React, { useState, useMemo, useRef } from 'react';
import { X, CheckCircle2, ShieldCheck, MapPin, Phone, User, Truck, CreditCard, ArrowRight, ArrowLeft, Loader2, Sparkles, ChevronDown, Building2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem } from './CartDrawer';
import { Order, OrderItem } from '../types';
import { api } from '../services/api';
import { BANGLADESH_DISTRICTS } from '../data/bangladeshGeo';
import { soundNotification } from '../services/soundNotification';
import { validateBangladeshiPhone } from '../utils/phoneValidator';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onOrderSuccess: (order: Order) => void;
  onOpenTrackOrder?: (orderId: string) => void;
}

const DIVISIONS = ['Dhaka', 'Chattogram', 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal', 'Rangpur', 'Mymensingh'];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  onOrderSuccess,
  onOpenTrackOrder
}) => {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('Dhaka');
  const [upazila, setUpazila] = useState('Dhanmondi');
  const [deliveryArea, setDeliveryArea] = useState<'inside_dhaka' | 'outside_dhaka'>('inside_dhaka');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash' | 'nagad'>('cod');
  const [trxId, setTrxId] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

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
      handleCloseModal();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Selected district object & dynamic upazilas list
  const currentDistrictObj = useMemo(() => {
    return (
      BANGLADESH_DISTRICTS.find(
        d => d.name.toLowerCase() === district.toLowerCase() || d.id === district.toLowerCase()
      ) || BANGLADESH_DISTRICTS[0]
    );
  }, [district]);

  const availableUpazilas = useMemo(() => {
    return currentDistrictObj?.upazilas || [];
  }, [currentDistrictObj]);

  const handleDistrictChange = (newDistrictName: string) => {
    setDistrict(newDistrictName);
    const matched = BANGLADESH_DISTRICTS.find(d => d.name === newDistrictName);
    if (matched && matched.upazilas.length > 0) {
      setUpazila(matched.upazilas[0].name);
    } else {
      setUpazila('');
    }

    // Auto update delivery fee based on district
    if (newDistrictName === 'Dhaka') {
      setDeliveryArea('inside_dhaka');
    } else {
      setDeliveryArea('outside_dhaka');
    }
  };

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const defaultFeeInside = cart.length > 0
    ? Math.max(...cart.map(item => item.product.insideDhakaFee ?? 60))
    : 60;
  const defaultFeeOutside = cart.length > 0
    ? Math.max(...cart.map(item => item.product.outsideDhakaFee ?? 120))
    : 120;
  const deliveryFee = deliveryArea === 'inside_dhaka' ? defaultFeeInside : defaultFeeOutside;
  const grandTotal = subtotal + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (cart.length === 0) {
      setErrorMsg('আপনার শপিং ব্যাগ খালি! অনুগ্রহ করে প্রথমে পণ্য যোগ করুন।');
      return;
    }
    if (!customerName.trim()) {
      setErrorMsg('অনুগ্রহ করে আপনার নাম লিখুন');
      return;
    }
    const phoneValidation = validateBangladeshiPhone(phone);
    if (!phoneValidation.isValid) {
      setErrorMsg(phoneValidation.errorMessage || 'সঠিক বাংলাদেশি মোবাইল নম্বর প্রদান করুন');
      return;
    }

    if (altPhone.trim()) {
      const altPhoneVal = validateBangladeshiPhone(altPhone);
      if (!altPhoneVal.isValid) {
        setErrorMsg(`বিকল্প নম্বর ত্রুটি: ${altPhoneVal.errorMessage}`);
        return;
      }
    }
    if (!district) {
      setErrorMsg('অনুগ্রহ করে আপনার জেলা নির্বাচন করুন');
      return;
    }
    if (!address.trim()) {
      setErrorMsg('পূর্ণাঙ্গ ডেলিভারি ঠিকানা লিখুন');
      return;
    }
    if (paymentMethod !== 'cod' && !trxId.trim()) {
      setErrorMsg('মোবাইল পেমেন্টের Transaction ID (TrxID) দিন');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderItems: OrderItem[] = cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        weight: item.product.weight,
        image: item.product.image
      }));

      const newOrder = await api.createOrder({
        customerName,
        phone,
        altPhone,
        address: address.trim(),
        city: upazila ? `${district} (${upazila})` : district,
        district,
        upazila,
        deliveryArea,
        deliveryFee,
        items: orderItems,
        subtotal,
        totalAmount: grandTotal,
        paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'unpaid' : 'paid',
        trxId,
        adminNote: note ? `Customer note: ${note}` : undefined
      });

      // Trigger Confetti effect and Sound/Browser notification
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        // ignore
      }

      // Browser Sound & Desktop Notification
      try {
        soundNotification.notifyNewOrder(newOrder);
      } catch (e) {
        console.warn('Notification sound trigger error:', e);
      }

      setPlacedOrder(newOrder);
      onOrderSuccess(newOrder);
    } catch (err) {
      console.error(err);
      setErrorMsg('অর্ডার সম্পন্ন করতে সমস্যা হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setPlacedOrder(null);
    onClose();
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {}
  };

  // If order was successfully placed, render the exact Order Placed success screen from the image
  if (placedOrder) {
    return (
      <div 
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleCloseModal();
          }
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative my-auto text-center animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
          <button
            onClick={handleCloseModal}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
            title="বন্ধ করুন (Close)"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top Blue Checkmark Icon Matching Image */}
          <div className="w-18 h-18 sm:w-20 sm:h-20 mx-auto mb-5 rounded-full border-[3.5px] border-[#0066FF] flex items-center justify-center text-[#0066FF]">
            <svg
              className="w-9 h-9 sm:w-10 sm:h-10 stroke-current"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>

          {/* Heading Matching Image */}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
            Order Placed!
          </h2>

          {/* Subtitle Matching Image */}
          <p className="text-gray-500 text-xs sm:text-sm leading-relaxed mb-6 font-normal px-2">
            Thank you for shopping with us. Your order has been received.
          </p>

          {/* Details Card Matching Image */}
          <div className="bg-[#f8fafc] rounded-2xl p-5 mb-7 text-left space-y-3.5 border border-gray-100/90 shadow-2xs">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-500 font-medium">Order ID</span>
              <span className="font-bold text-gray-900 font-mono tracking-tight">
                {placedOrder.orderNumber}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-500 font-medium">Total</span>
              <span className="font-extrabold text-[#0066FF] text-sm sm:text-base">
                ৳{placedOrder.totalAmount}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-500 font-medium">Payment</span>
              <span className="font-medium text-gray-800">
                {placedOrder.paymentMethod === 'cod'
                  ? 'Cash on Delivery'
                  : placedOrder.paymentMethod === 'bkash'
                  ? 'bKash'
                  : 'Nagad'}
              </span>
            </div>
          </div>

          {/* Buttons Matching Image */}
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 bg-[#0066FF] hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-95"
            >
              Continue Shopping
            </button>
            <button
              type="button"
              onClick={() => {
                const ordId = placedOrder.orderNumber;
                handleCloseModal();
                if (onOpenTrackOrder) {
                  onOpenTrackOrder(ordId);
                }
              }}
              className="flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-2xs active:scale-95"
            >
              Track Order
            </button>
          </div>
        </div>
      </div>
    );
  }

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
      <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white p-4 sm:p-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-700 text-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Fast Checkout
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black mt-1">ক্যাশ অন ডেলিভারিতে অর্ডার করুন</h2>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-emerald-700/60 hover:bg-emerald-700 flex items-center justify-center text-emerald-100 hover:text-white transition-colors cursor-pointer active:scale-95"
            title="বন্ধ করুন (Close)"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 grid md:grid-cols-5 gap-6">
          {/* Form Fields (Left 3 columns) */}
          <div className="md:col-span-3 space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
                <span>⚠️ {errorMsg}</span>
              </div>
            )}

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                আপনার নাম (Full Name) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="যেমন: তানভীর আহমেদ"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none"
                />
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Phone numbers */}
            {(() => {
              const liveValidation = phone.length > 0 ? validateBangladeshiPhone(phone) : null;
              const isPhoneComplete = phone.length === 11;
              const isPhoneValid = isPhoneComplete && liveValidation?.isValid;
              const isPhoneInvalid = isPhoneComplete && !liveValidation?.isValid;

              return (
                <div className="space-y-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase">
                      মোবাইল নম্বর (Valid BD Phone) *
                    </label>
                    <div className="flex items-center gap-1.5">
                      {isPhoneValid && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          {liveValidation.operatorName}
                        </span>
                      )}
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isPhoneValid 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : isPhoneInvalid
                          ? 'bg-rose-100 text-rose-800 font-bold'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {phone.length}/11
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]{11}"
                      maxLength={11}
                      required
                      placeholder="017XXXXXXXX"
                      value={phone}
                      onChange={e => {
                        const cleanNumber = e.target.value.replace(/\D/g, '').slice(0, 11);
                        setPhone(cleanNumber);
                        if (errorMsg) setErrorMsg('');
                      }}
                      className={`w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border rounded-xl focus:outline-none font-mono transition-colors ${
                        isPhoneValid
                          ? 'border-emerald-500 bg-emerald-50/20 focus:ring-2 focus:ring-emerald-600'
                          : isPhoneInvalid
                          ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-500'
                          : 'border-gray-200 focus:ring-2 focus:ring-emerald-600 focus:bg-white'
                      }`}
                    />
                    <Phone className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
                      isPhoneValid ? 'text-emerald-700' : isPhoneInvalid ? 'text-rose-500' : 'text-emerald-600'
                    }`} />
                  </div>
                  {isPhoneInvalid && (
                    <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1 mt-1">
                      <span>⚠️</span> {liveValidation.errorMessage}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Dynamic District & Upazila Selectors - 2 Columns */}
            <div className="grid grid-cols-2 gap-3">
              {/* District Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1 flex items-center justify-between">
                  <span>District / জেলা *</span>
                  {currentDistrictObj && (
                    <span className="hidden sm:inline-block text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                      {currentDistrictObj.division}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <select
                    id="checkoutDistrictSelect"
                    value={district}
                    onChange={e => handleDistrictChange(e.target.value)}
                    className="w-full pl-8 sm:pl-9 pr-6 sm:pr-8 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none appearance-none font-medium text-gray-800 cursor-pointer shadow-2xs hover:border-emerald-400 transition-colors truncate"
                  >
                    <option value="">-- জেলা নির্বাচন করুন --</option>
                    {DIVISIONS.map(div => {
                      const distsInDiv = BANGLADESH_DISTRICTS.filter(d => d.division === div);
                      return (
                        <optgroup key={div} label={`── ${div} Division (${distsInDiv.length}) ──`}>
                          {distsInDiv.map(d => (
                            <option key={d.id} value={d.name}>
                              {d.name} ({d.bnName})
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Upazila Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1 flex items-center justify-between">
                  <span>Thana / থানা/উপজেলা *</span>
                  {availableUpazilas.length > 0 && (
                    <span className="hidden sm:inline-block text-[10px] text-gray-500 font-medium">
                      {availableUpazilas.length} টি
                    </span>
                  )}
                </label>
                <div className="relative">
                  <select
                    id="checkoutUpazilaSelect"
                    value={upazila}
                    onChange={e => setUpazila(e.target.value)}
                    disabled={!district || availableUpazilas.length === 0}
                    className={`w-full pl-8 sm:pl-9 pr-6 sm:pr-8 py-2.5 text-xs sm:text-sm border rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none appearance-none font-medium cursor-pointer shadow-2xs transition-colors truncate ${
                      !district
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-gray-50 text-gray-800 border-gray-200 hover:border-emerald-400'
                    }`}
                  >
                    <option value="">
                      {!district
                        ? 'আগে জেলা নির্বাচন করুন'
                        : '-- থানা/উপজেলা নির্বাচন করুন --'}
                    </option>
                    {availableUpazilas.map(u => (
                      <option key={u.name} value={u.name}>
                        {u.name} ({u.bnName})
                      </option>
                    ))}
                  </select>
                  <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Delivery Location Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                ডেলিভারি এরিয়া ও চার্জ (Delivery Fee)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryArea('inside_dhaka')}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    deliveryArea === 'inside_dhaka'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-600/30'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold">ঢাকার ভেতরে</p>
                    <p className="text-[11px] text-gray-500">হোম ডেলিভারি (২৪-৪৮ ঘণ্টা)</p>
                  </div>
                  <span className="text-xs font-black text-emerald-800">৳{defaultFeeInside}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryArea('outside_dhaka')}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    deliveryArea === 'outside_dhaka'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-600/30'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold">ঢাকার বাইরে</p>
                    <p className="text-[11px] text-gray-500">সারা বাংলাদেশ (৪৮-৭২ ঘণ্টা)</p>
                  </div>
                  <span className="text-xs font-black text-emerald-800">৳{defaultFeeOutside}</span>
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700 uppercase">
                  পূর্ণাঙ্গ ডেলিভারি ঠিকানা (Full Address) *
                </label>
                <span className="text-[10px] text-gray-400 font-normal">
                  (বাসা নং, রোড, এলাকা)
                </span>
              </div>
              <div className="relative">
                <textarea
                  required
                  rows={2}
                  placeholder="যেমন: বাড়ি নং ১২, রোড নং ৫, ব্লক-সি (এখানে শুধু আপনার বাসা/রোডের ঠিকানা লিখুন)"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none"
                />
                <MapPin className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
              </div>
            </div>

            {/* Payment Method Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                পেমেন্ট মেথড (Payment Option)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'cod'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                      : 'border-gray-200 text-gray-700'
                  }`}
                >
                  <p className="text-xs">ক্যাশ অন ডেলিভারি</p>
                  <p className="text-[10px] text-gray-500 font-normal">Cash on Delivery</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('bkash')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'bkash'
                      ? 'border-pink-600 bg-pink-50 text-pink-900 font-bold'
                      : 'border-gray-200 text-gray-700'
                  }`}
                >
                  <p className="text-xs">বিকাশ (bKash)</p>
                  <p className="text-[10px] text-gray-500 font-normal">01345302537</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('nagad')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'nagad'
                      ? 'border-orange-600 bg-orange-50 text-orange-900 font-bold'
                      : 'border-gray-200 text-gray-700'
                  }`}
                >
                  <p className="text-xs">নগদ (Nagad)</p>
                  <p className="text-[10px] text-gray-500 font-normal">01345302537</p>
                </button>
              </div>

              {paymentMethod !== 'cod' && (
                <div className="mt-2.5 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
                  <p className="font-semibold">
                    বিকাশ/নগদ মার্চেন্ট/পার্সোনাল নম্বর: <span className="font-mono font-bold">01345302537</span> এ Send Money/Payment করে TrxID নিচে লিখুন:
                  </p>
                  <input
                    type="text"
                    required
                    placeholder="Enter TrxID (যেমন: 9J4K829)"
                    value={trxId}
                    onChange={e => setTrxId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Order Summary & Confirm (Right 2 columns) */}
          <div className="md:col-span-2 bg-gray-50/80 p-4 sm:p-5 rounded-2xl border border-gray-200 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
                অর্ডার বিবরণী (Order Items)
              </h3>

              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4 bg-white/70 rounded-xl border border-dashed border-gray-300">
                    কোনো পণ্য যোগ করা হয়নি
                  </p>
                ) : (
                  cart.map(({ product, quantity }) => (
                    <div key={product.id} className="flex items-center gap-2 text-xs">
                      <img
                        src={product.image}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-md object-cover bg-white shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{product.name}</p>
                        <p className="text-[10px] text-gray-500">
                          {quantity} × ৳{product.price}
                        </p>
                      </div>
                      <span className="font-bold text-gray-900">৳{product.price * quantity}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Price Calculation */}
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>পণ্য উপমোট (Subtotal):</span>
                  <span className="font-bold text-gray-900">৳{subtotal}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>ডেলিভারি চার্জ:</span>
                  <span className="font-bold text-gray-900">৳{deliveryFee}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-emerald-950 pt-2 border-t border-gray-200">
                  <span>সর্বমোট প্রদেয়:</span>
                  <span className="text-base text-emerald-800">৳{grandTotal}</span>
                </div>
              </div>

              <div className="mt-4 p-2 bg-emerald-50 rounded-xl flex items-center gap-1.5 text-[10px] text-emerald-900 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>অর্ডার করার পর আমাদের প্রতিনিধি ফোন করে কনফার্ম করবেন।</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>অর্ডার সংরক্ষিত হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span>অর্ডার সম্পন্ন করুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>দোকানে ফিরে যান (Back to Shop)</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
