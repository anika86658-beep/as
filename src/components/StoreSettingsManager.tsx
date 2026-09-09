import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Share2, 
  ExternalLink, 
  Check, 
  Save, 
  Phone, 
  Mail, 
  MapPin, 
  MessageCircle, 
  ShieldCheck, 
  Sparkles,
  Link as LinkIcon,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { INITIAL_STORE_SETTINGS } from '../data/initialData';
import { StoreSettings } from '../types';

interface StoreSettingsManagerProps {
  onSuccessToast?: (msg: string) => void;
}

export const StoreSettingsManager: React.FC<StoreSettingsManagerProps> = ({
  onSuccessToast
}) => {
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_STORE_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form State
  const [facebookUrl, setFacebookUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [brandName, setBrandName] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await api.getStoreSettings();
      if (data) {
        setSettings(data);
        setFacebookUrl(data.facebookUrl || '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
        setAddress(data.address || '');
        setWhatsappNumber(data.whatsappNumber || '');
        setBrandName(data.brandName || 'Arishten');
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      // Format facebook URL if user typed without https://
      let formattedFb = facebookUrl.trim();
      if (formattedFb && !formattedFb.startsWith('http://') && !formattedFb.startsWith('https://')) {
        formattedFb = 'https://' + formattedFb;
      }

      const updatedData: StoreSettings = {
        facebookUrl: formattedFb,
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        whatsappNumber: whatsappNumber.trim(),
        brandName: brandName.trim() || 'Arishten'
      };

      await api.saveStoreSettings(updatedData);
      setSettings(updatedData);
      setFacebookUrl(formattedFb);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);

      if (onSuccessToast) {
        onSuccessToast('✅ ফেসবুক পেজ লিংক ও স্টোর সেটিংস সফলভাবে আপডেট করা হয়েছে!');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const getFullFacebookUrl = () => {
    if (!facebookUrl) return 'https://facebook.com';
    if (facebookUrl.startsWith('http://') || facebookUrl.startsWith('https://')) {
      return facebookUrl;
    }
    return `https://${facebookUrl}`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-10 border border-gray-200 text-center flex flex-col items-center justify-center">
        <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-gray-600">স্টোর সেটিংস লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">ফুটার ও স্টোর ইনফো ম্যানেজার (Footer & Store Manager)</h2>
            </div>
            <p className="text-xs text-gray-500">
              ফুটারের সমস্ত তথ্য (ফেসবুক লিংক, হটলাইন, ইমেইল, ঠিকানা, ব্র্যান্ড নাম ও হোয়াটসঅ্যাপ) রিয়েল-টাইমে পরিবর্তন করুন এবং Save করুন।
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadSettings}
              className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
              রিফ্রেশ
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : savedSuccess ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {savedSuccess ? 'সংরক্ষিত হয়েছে ✓' : 'পরিবর্তন সংরক্ষণ করুন'}
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Main Facebook Integration Card */}
        <div className="bg-white rounded-2xl p-6 border border-blue-200/80 shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-[#1877F2] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              f
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Facebook Page URL (ফেসবুক পেজ লিংক)</h3>
              <p className="text-xs text-gray-500">
                এই লিংকটি ওয়েবসাইটের ফুটারে ফেসবুক আইকনে যুক্ত থাকবে। ক্লিক করলে গ্রাহকরা সরাসরি আপনার ফেসবুক পেজে চলে যাবে।
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-gray-800">
              ফেসবুক পেজের সম্পূর্ণ লিঙ্ক লিখুন বা পেস্ট করুন:
            </label>

            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <LinkIcon className="w-4 h-4 text-blue-600" />
                </div>
                <input
                  type="text"
                  value={facebookUrl}
                  onChange={e => setFacebookUrl(e.target.value)}
                  placeholder="https://www.facebook.com/your-page-name"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/60 hover:bg-white focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-xs sm:text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>

              {facebookUrl.trim() && (
                <a
                  href={getFullFacebookUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold border border-blue-200 flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                  title="লিংকটি টেস্ট করতে নতুন ট্যাবে ওপেন করুন"
                >
                  <span>লিংক টেস্ট করুন</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Quick helper buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-gray-500">
              <span className="font-semibold text-gray-600">উদাহরণ:</span>
              <button
                type="button"
                onClick={() => setFacebookUrl('https://www.facebook.com/arishten.official')}
                className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-mono text-[10px] cursor-pointer"
              >
                https://www.facebook.com/arishten.official
              </button>
              <button
                type="button"
                onClick={() => setFacebookUrl('https://facebook.com')}
                className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-mono text-[10px] cursor-pointer"
              >
                https://facebook.com
              </button>
              {facebookUrl && (
                <button
                  type="button"
                  onClick={() => setFacebookUrl('')}
                  className="text-red-500 hover:text-red-700 font-semibold ml-auto cursor-pointer"
                >
                  ✕ ক্লিয়ার করুন
                </button>
              )}
            </div>

            {/* Live Preview Box */}
            <div className="mt-4 p-3.5 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold text-sm">
                  f
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">ফুটার প্রিভিউ (Footer Preview)</p>
                  <p className="text-[11px] text-gray-500 font-mono truncate max-w-xs sm:max-w-md">
                    ট্যাগে যুক্ত লিঙ্ক: <span className="text-blue-600">{facebookUrl ? getFullFacebookUrl() : '(কোনো লিঙ্ক দেওয়া নেই)'}</span>
                  </p>
                </div>
              </div>

              <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>লাইভ ফুটারে কার্যকর</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Additional Store Info (Optional) */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-gray-900">অন্যান্য যোগাযোগের তথ্য (ঐচ্ছিক)</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* WhatsApp */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp সাপোর্ট নম্বর</span>
              </label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={e => setWhatsappNumber(e.target.value)}
                placeholder="01886123456"
                className="w-full px-3.5 py-2.5 bg-gray-50/60 focus:bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Contact Phone */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>হটলাইন / কাস্টমার কেয়ার ফোন নম্বর</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="01886-123456"
                className="w-full px-3.5 py-2.5 bg-gray-50/60 focus:bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Support Email */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-600" />
                <span>সাপোর্ট ইমেইল এড্রেস</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="support@arishten.com"
                className="w-full px-3.5 py-2.5 bg-gray-50/60 focus:bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Brand Display Name */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                <Globe className="w-3.5 h-3.5 text-amber-600" />
                <span>ব্র্যান্ডের নাম (Store Name)</span>
              </label>
              <input
                type="text"
                value={brandName}
                onChange={e => setBrandName(e.target.value)}
                placeholder="Arishten"
                className="w-full px-3.5 py-2.5 bg-gray-50/60 focus:bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Office Address */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>স্টোর / অফিস ঠিকানা</span>
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Noakhali, Bangladesh"
              className="w-full px-3.5 py-2.5 bg-gray-50/60 focus:bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none resize-none"
            />
          </div>
        </div>

        {/* Bottom Save Action */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : savedSuccess ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {savedSuccess ? 'সফলভাবে সংরক্ষিত হয়েছে ✓' : 'সেটিংস সংরক্ষণ করুন'}
          </button>
        </div>
      </form>
    </div>
  );
};
