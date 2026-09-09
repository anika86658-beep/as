import React, { useRef, useState } from 'react';
import { X, Printer, Download, CheckCircle2, Phone, MapPin, Calendar, Clock, ShoppingBag, ShieldCheck, FileText, AlertCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toJpeg } from 'html-to-image';
import { Order } from '../types';

interface OrderInvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  storeName?: string;
  storePhone?: string;
  storeEmail?: string;
  storeAddress?: string;
}

export const OrderInvoiceModal: React.FC<OrderInvoiceModalProps> = ({
  order,
  isOpen,
  onClose,
  storeName = 'Arishten',
  storePhone = '01886-123456',
  storeEmail = 'support@arishten.com',
  storeAddress = 'Noakhali, Bangladesh'
}) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Touch Swipe tracking refs
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

  if (!isOpen || !order) return null;

  const orderDate = new Date(order.createdAt);
  const formattedDate = orderDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const formattedTime = orderDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const subtotal = order.subtotal || order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = order.deliveryFee ?? (order.deliveryArea === 'inside_dhaka' ? 60 : 120);
  const grandTotal = order.totalAmount || (subtotal + deliveryFee);

  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.error('Print trigger error:', err);
    }
  };

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current) return;

    try {
      setIsGeneratingPdf(true);
      setErrorMessage(null);
      setDownloadSuccess(false);

      // Brief delay to ensure font rendering & layout settling
      await new Promise((resolve) => setTimeout(resolve, 100));

      const element = invoiceRef.current;
      let imgData: string | null = null;
      let naturalRatio = 1.414;

      // Method 1: html2canvas (Primary - 100% resilient across cPanel/shared servers and CORS boundaries)
      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 1024,
          width: Math.max(element.scrollWidth, 750),
          height: element.scrollHeight,
          onclone: (clonedDoc) => {
            const clonedEl = clonedDoc.querySelector('.print-invoice-container') as HTMLElement;
            if (clonedEl) {
              clonedEl.style.width = '750px';
              clonedEl.style.minWidth = '750px';
              clonedEl.style.maxWidth = '750px';
              clonedEl.style.padding = '24px';
              clonedEl.style.margin = '0 auto';
              clonedEl.style.backgroundColor = '#ffffff';
            }
          }
        });
        imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (canvas.width > 0 && canvas.height > 0) {
          naturalRatio = canvas.height / canvas.width;
        }
      } catch (canvasErr) {
        console.warn('html2canvas engine warning, trying secondary fallback:', canvasErr);
      }

      // Method 2: html-to-image fallback if html2canvas was blocked
      if (!imgData) {
        try {
          imgData = await toJpeg(element, {
            quality: 0.95,
            backgroundColor: '#ffffff',
            pixelRatio: 2,
            skipFonts: true,
            cacheBust: false,
          });
          const img = new Image();
          img.src = imgData;
          await new Promise((resolve) => {
            img.onload = () => {
              if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                naturalRatio = img.naturalHeight / img.naturalWidth;
              }
              resolve(true);
            };
            img.onerror = () => resolve(true);
          });
        } catch (toImgErr) {
          console.warn('html-to-image fallback warning:', toImgErr);
        }
      }

      if (!imgData) {
        throw new Error('Unable to render invoice image');
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfPageWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfPageHeight = pdf.internal.pageSize.getHeight(); // 297mm
      
      const margin = 8; // 8mm margin
      const maxAvailableWidth = pdfPageWidth - (margin * 2); // 194mm
      const maxAvailableHeight = pdfPageHeight - (margin * 2); // 281mm

      let imgWidth = maxAvailableWidth;
      let imgHeight = imgWidth * naturalRatio;

      // If it slightly exceeds single A4 page height, scale down cleanly to fit 1 single page!
      if (imgHeight > maxAvailableHeight && imgHeight <= maxAvailableHeight * 1.35) {
        imgHeight = maxAvailableHeight;
        imgWidth = imgHeight / naturalRatio;
      }

      if (imgHeight <= maxAvailableHeight) {
        // Fits perfectly on single page with centered alignment
        const xOffset = margin + (maxAvailableWidth - imgWidth) / 2;
        pdf.addImage(imgData, 'JPEG', xOffset, margin, imgWidth, imgHeight, undefined, 'FAST');
      } else {
        // Multi-page handling for large orders with many items
        let heightLeft = imgHeight;
        let position = margin;

        pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= maxAvailableHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight + margin;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
          heightLeft -= maxAvailableHeight;
        }
      }

      pdf.save(`Invoice-${order.orderNumber}.pdf`);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (error) {
      console.error('Failed to generate invoice PDF:', error);
      setErrorMessage('PDF জেনারেটরে সাময়িক সমস্যা হয়েছে। আপনি সরাসরি "প্রিন্ট" বাটন চেপে "Save as PDF" অপশন ব্যবহার করতে পারেন।');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div 
      className="invoice-modal-overlay fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-auto border border-gray-200 animate-in fade-in zoom-in-95 duration-150 print:border-none print:shadow-none print:max-w-none print:w-full">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="bg-gray-900 text-white px-5 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold">অর্ডার ইনভয়েস / চালান</h3>
              <p className="text-[11px] text-gray-400 font-mono">Invoice #{order.orderNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 border border-gray-700"
              title="ইনভয়েস প্রিন্ট করুন"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>প্রিন্ট (Print)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-xs ${
                downloadSuccess
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white'
              }`}
              title="PDF হিসেবে ডাউনলোড করুন"
            >
              {downloadSuccess ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <Download className="w-3.5 h-3.5" />}
              <span>{isGeneratingPdf ? 'PDF তৈরি হচ্ছে...' : downloadSuccess ? 'PDF ডাউনলোড সম্পন্ন!' : 'PDF ডাউনলোড'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer ml-1"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-amber-700 hover:text-amber-900 font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Printable Invoice Scrollable Wrapper */}
        <div className="overflow-x-auto overflow-y-auto max-h-[82vh] bg-gray-100/60 p-2 sm:p-4 print:p-0 print:bg-white print:overflow-visible print:max-h-none flex justify-center">
          
          {/* Printable Invoice Sheet (Standard Desktop Dimensions) */}
          <div 
            className="print-invoice-container w-full min-w-[680px] max-w-[750px] p-6 bg-white rounded-xl shadow-xs border border-gray-200 print:shadow-none print:border-none print:p-2 print:min-w-0" 
            ref={invoiceRef}
          >
            {/* 1. Header: Brand Info & Invoice Meta */}
            <div className="flex flex-row items-start justify-between gap-4 pb-4 border-b-2 border-gray-900">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-emerald-800 text-white font-black text-base flex items-center justify-center shadow-xs">
                    A
                  </span>
                  <div>
                    <h1 className="text-xl font-black text-gray-900 tracking-tight">{storeName}</h1>
                  </div>
                </div>
                <div className="mt-1.5 text-xs text-gray-600 space-y-0.5 font-medium">
                  <p>{storeAddress}</p>
                  <p>হটলাইন: <span className="font-semibold text-gray-900">{storePhone}</span> | ইমেইল: {storeEmail}</p>
                </div>
              </div>

              <div className="text-right bg-gray-50 p-2.5 rounded-xl border border-gray-200 min-w-[200px]">
                <div className="inline-block bg-emerald-800 text-white px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider mb-1">
                  INVOICE / ক্যাশ মেমো
                </div>
                <p className="text-sm font-black text-gray-900 font-mono">#{order.orderNumber}</p>
                <div className="mt-1 text-[10px] text-gray-600 space-y-0.5">
                  <p><span className="text-gray-500">তারিখ:</span> <span className="font-semibold text-gray-800">{formattedDate}</span></p>
                  <p><span className="text-gray-500">সময়:</span> <span className="font-semibold text-gray-800">{formattedTime}</span></p>
                  <p>
                    <span className="text-gray-500">স্ট্যাটাস:</span>{' '}
                    <span className="font-bold uppercase text-emerald-700">{order.status}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Customer & Delivery Information Grid (2 Columns Desktop Layout) */}
            <div className="grid grid-cols-2 gap-3 py-3 border-b border-gray-200">
              {/* Customer Details */}
              <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-200">
                <h3 className="text-xs font-black uppercase text-gray-800 tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-700" />
                  <span>গ্রাহকের বিবরণী (Customer Info)</span>
                </h3>
                <div className="text-xs space-y-0.5 text-gray-700">
                  <p><span className="text-gray-500">নাম:</span> <strong className="text-gray-900 font-bold">{order.customerName}</strong></p>
                  <p><span className="text-gray-500">মোবাইল:</span> <strong className="text-gray-900 font-mono font-bold">{order.phone}</strong></p>
                  {order.altPhone && (
                    <p><span className="text-gray-500">বিকল্প নম্বর:</span> <span className="font-mono text-gray-800">{order.altPhone}</span></p>
                  )}
                  <p>
                    <span className="text-gray-500">পেমেন্ট মেথড:</span>{' '}
                    <strong className="uppercase text-emerald-800 font-bold font-mono">
                      {order.paymentMethod === 'cod' ? 'Cash on Delivery (ক্যাশ অন ডেলিভারি)' : order.paymentMethod}
                    </strong>
                  </p>
                  {order.trxId && (
                    <p><span className="text-gray-500">TrxID:</span> <span className="font-mono font-bold text-gray-900">{order.trxId}</span></p>
                  )}
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-200">
                <h3 className="text-xs font-black uppercase text-gray-800 tracking-wider mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  <span>ডেলিভারি ঠিকানা (Shipping Address)</span>
                </h3>
                <div className="text-xs space-y-0.5 text-gray-700">
                  <p><span className="text-gray-500">ঠিকানা:</span> <strong className="text-gray-900">{order.address}</strong></p>
                  <p>
                    <span className="text-gray-500">জেলা/থানা:</span>{' '}
                    <strong className="text-gray-900">{order.district || 'Dhaka'}{order.upazila ? `, ${order.upazila}` : ''}</strong>
                  </p>
                  <p>
                    <span className="text-gray-500">ডেলিভারি এরিয়া:</span>{' '}
                    <span className="font-semibold text-gray-800">
                      {order.deliveryArea === 'inside_dhaka' ? 'ঢাকার ভেতরে (Inside Dhaka)' : 'ঢাকার বাইরে (Outside Dhaka)'}
                    </span>
                  </p>
                  {order.courierName && (
                    <p>
                      <span className="text-gray-500">কুরিয়ার:</span>{' '}
                      <strong className="text-blue-700 font-semibold">{order.courierName}</strong>
                      {order.courierTrackingId ? ` (${order.courierTrackingId})` : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Products / Items Table */}
            <div className="py-3">
              <h3 className="text-xs font-black uppercase text-gray-800 tracking-wider mb-2 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-700" />
                <span>পণ্যের বিবরণ (Ordered Items)</span>
              </h3>

              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-900 text-white">
                    <th className="p-2 text-center font-bold w-10">#</th>
                    <th className="p-2 text-left font-bold">পণ্যের নাম (Product)</th>
                    <th className="p-2 text-center font-bold">ওজন/সাইজ</th>
                    <th className="p-2 text-center font-bold">পরিমাণ</th>
                    <th className="p-2 text-right font-bold">একক মূল্য</th>
                    <th className="p-2 text-right font-bold">মোট টাকা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 border-b border-gray-200">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/80">
                      <td className="p-2 text-center font-mono font-bold text-gray-500">{idx + 1}</td>
                      <td className="p-2 font-bold text-gray-900">
                        {item.productName}
                      </td>
                      <td className="p-2 text-center text-gray-600 font-medium">
                        {item.weight || 'স্ট্যান্ডার্ড'}
                      </td>
                      <td className="p-2 text-center font-bold text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="p-2 text-right font-mono text-gray-700">
                        ৳{item.price}
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-gray-900">
                        ৳{item.price * item.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 4. Financial Summary Grid (Desktop 2-Side Layout) */}
            <div className="flex flex-row justify-between items-start gap-4 pt-1 pb-4 border-b border-gray-200">
              {/* Note & Instructions */}
              <div className="text-xs text-gray-600 flex-1 max-w-sm space-y-1 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                <p className="font-bold text-gray-800 uppercase text-[10px]">প্যাকেজ নির্দেশিকা ও শর্তাবলী:</p>
                <p>• পণ্য গ্রহণের সময় ডেলিভারি ম্যানের সামনে চেক করে নিন।</p>
                <p>• যেকোনো প্রয়োজনে আমাদের হটলাইনে যোগাযোগ করুন।</p>
                {order.adminNote && (
                  <div className="mt-1.5 pt-1.5 border-t border-gray-200 text-emerald-800">
                    <span className="font-bold">গ্রাহকের নোট:</span> {order.adminNote}
                  </div>
                )}
              </div>

              {/* Calculations Table */}
              <div className="w-64 shrink-0 space-y-1 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>পণ্য উপমোট (Subtotal):</span>
                  <span className="font-mono font-bold text-gray-900">৳{subtotal}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>ডেলিভারি চার্জ (Delivery):</span>
                  <span className="font-mono font-bold text-gray-900">+ ৳{deliveryFee}</span>
                </div>
                <div className="pt-1.5 border-t-2 border-gray-900 flex justify-between items-baseline">
                  <span className="text-sm font-black text-gray-900">সর্বমোট প্রদেয়:</span>
                  <span className="text-base font-black text-emerald-800 font-mono">৳{grandTotal}</span>
                </div>
                <div className="text-right pt-0.5">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    order.paymentStatus === 'paid'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    পেমেন্ট: {order.paymentStatus === 'paid' ? 'Paid (পরিশোধিত)' : 'Cash On Delivery (বকেয়া)'}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Footer & Signatures */}
            <div className="pt-3 flex items-end justify-between text-[11px] text-gray-500">
              <div>
                <p className="font-bold text-gray-800">ধন্যবাদ {storeName}-এর সাথে থাকার জন্য!</p>
                <p className="text-[10px] text-gray-400">এটি একটি কম্পিউটার জেনারেটেড ইনভয়েস। কোনো সিল বা স্বাক্ষরের প্রয়োজন নেই।</p>
              </div>

              <div className="text-center">
                <div className="w-28 border-b border-gray-400 mb-1" />
                <p className="font-semibold text-gray-700 text-[10px]">অনুমোদিত স্বাক্ষর</p>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Footer Actions (Hidden on print) */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between print:hidden">
          <div className="text-xs text-gray-500">
            অর্ডার আইডি: <span className="font-mono font-bold text-gray-800">{order.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              বন্ধ করুন
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'PDF তৈরি হচ্ছে...' : 'PDF ডাউনলোড'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
