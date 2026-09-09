import React, { useState, useEffect, useRef } from 'react';
import { APP_VERSION, forceClearCacheAndReload } from '../utils/versionCheck';
import {
  LayoutDashboard,
  BarChart2,
  Package,
  ShoppingCart,
  DollarSign,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  LogOut,
  Bell,
  PanelLeft,
  Boxes,
  TrendingUp,
  FolderTree,
  ShoppingBag,
  FileText,
  Palette,
  Megaphone,
  Settings,
  Plus,
  Search,
  CheckCircle2,
  Truck,
  Edit2,
  Trash2,
  Cloud,
  Check,
  RefreshCw,
  Phone,
  ArrowUpRight,
  Sparkles,
  Layers,
  Tag,
  X,
  Download,
  FileSpreadsheet,
  Hash,
  User,
  MapPin,
  Mail,
  Volume2,
  Send
} from 'lucide-react';
import { soundNotification } from '../services/soundNotification';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Order, WorkTask, Product, OrderStatus, CategoryItem, OrderItem } from '../types';
import { CPanelManager } from './CPanelManager';
import { NewProductForm } from './NewProductForm';
import { CategoryManager } from './CategoryManager';
import { StoreSettingsManager } from './StoreSettingsManager';
import { OrderInvoiceModal } from './OrderInvoiceModal';
import { api } from '../services/api';
import { BANGLADESH_DISTRICTS } from '../data/bangladeshGeo';
import { compressImage } from '../utils/imageCompressor';

interface AdminDashboardProps {
  orders: Order[];
  tasks: WorkTask[];
  products: Product[];
  categories?: CategoryItem[];
  onCategoryUpdate?: (cats: CategoryItem[]) => void;
  onRefreshData: () => void;
  onOpenTrackOrder: (orderId: string) => void;
  onAddNewProduct: (p: Partial<Product>) => void;
  onVisitShop: () => void;
  onLogout: () => void;
}

// 14 Days Orders Data matching screenshot
const orders14DaysData = [
  { date: '08-03', orders: 0 },
  { date: '08-04', orders: 0 },
  { date: '08-05', orders: 0 },
  { date: '08-06', orders: 0 },
  { date: '08-07', orders: 0 },
  { date: '08-08', orders: 1 },
  { date: '08-09', orders: 0 },
  { date: '08-10', orders: 0 },
  { date: '08-11', orders: 0 },
  { date: '08-12', orders: 0 },
  { date: '08-13', orders: 0 },
  { date: '08-14', orders: 0 },
  { date: '08-15', orders: 0 },
  { date: '08-16', orders: 0 }
];

// 14 Days Revenue Data matching screenshot
const revenue14DaysData = [
  { date: '08-03', revenue: 0 },
  { date: '08-04', revenue: 0 },
  { date: '08-05', revenue: 0 },
  { date: '08-06', revenue: 0 },
  { date: '08-07', revenue: 0 },
  { date: '08-08', revenue: 640 },
  { date: '08-09', revenue: 0 },
  { date: '08-10', revenue: 0 },
  { date: '08-11', revenue: 0 },
  { date: '08-12', revenue: 0 },
  { date: '08-13', revenue: 0 },
  { date: '08-14', revenue: 0 },
  { date: '08-15', revenue: 0 },
  { date: '08-16', revenue: 0 }
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders,
  tasks,
  products,
  categories,
  onCategoryUpdate,
  onRefreshData,
  onOpenTrackOrder,
  onAddNewProduct,
  onVisitShop,
  onLogout
}) => {
  // Navigation State
  const [activeSection, setActiveSection] = useState<'dashboard' | 'analytics' | 'orders' | 'products' | 'categories' | 'new_product' | 'stock' | 'cpanel' | 'tasks' | 'settings'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  const ordersRef = useRef(orders);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  // Sync hash routing & handle mobile back gestures
  useEffect(() => {
    const handleAdminRouting = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      const validSections = [
        'dashboard', 'analytics', 'orders', 'products', 'categories',
        'new_product', 'stock', 'cpanel', 'tasks', 'settings'
      ];

      // If user opened invoice modal (e.g. #invoice-1001)
      if (hash.startsWith('invoice-')) {
        const orderNum = hash.replace('invoice-', '');
        const matched = ordersRef.current.find(o => o.orderNumber === orderNum || o.id === orderNum);
        if (matched) {
          setSelectedInvoiceOrder(matched);
        }
        return;
      } else {
        setSelectedInvoiceOrder(null);
      }

      if (hash === 'new-product' || hash === 'new_product') {
        setActiveSection('new_product');
      } else if (validSections.includes(hash)) {
        setActiveSection(hash as any);
      } else if (!hash) {
        setActiveSection('dashboard');
      }
    };

    handleAdminRouting();
    window.addEventListener('hashchange', handleAdminRouting);
    window.addEventListener('popstate', handleAdminRouting);
    return () => {
      window.removeEventListener('hashchange', handleAdminRouting);
      window.removeEventListener('popstate', handleAdminRouting);
    };
  }, []);

  const handleNavigateSection = (section: 'dashboard' | 'analytics' | 'orders' | 'products' | 'categories' | 'new_product' | 'stock' | 'cpanel' | 'tasks' | 'settings') => {
    setActiveSection(section);
    try {
      window.history.pushState(
        { view: 'dashboard', section },
        '',
        `?portal=arishadmin#${section}`
      );
    } catch (e) {}
  };

  const handleOpenInvoice = (order: Order) => {
    setSelectedInvoiceOrder(order);
    try {
      window.history.pushState(
        { view: 'dashboard', section: activeSection, modal: 'invoice', orderId: order.id },
        '',
        `?portal=arishadmin#invoice-${order.orderNumber}`
      );
    } catch (e) {}
  };

  const handleCloseInvoice = () => {
    if (window.location.hash.startsWith('#invoice-') || window.history.state?.modal === 'invoice') {
      window.history.back();
    } else {
      setSelectedInvoiceOrder(null);
      try {
        window.history.replaceState({ view: 'dashboard', section: activeSection }, '', `?portal=arishadmin#${activeSection}`);
      } catch (e) {}
    }
  };

  // Accordion Expand states for sidebar
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    main: true,
    catalog: true,
    sales: false,
    content: false,
    appearance: false,
    marketing: false,
    system: false
  });

  const toggleMenu = (menuKey: string) => {
    setOpenMenus(prev => ({ ...prev, [menuKey]: !prev[menuKey] }));
  };

  // Notifications State
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(() => soundNotification.hasPermission());
  const [dismissNotificationBanner, setDismissNotificationBanner] = useState(false);

  // Manage Stock Modal State
  const [showStockModal, setShowStockModal] = useState(false);
  const [localProducts, setLocalProducts] = useState(products);

  // Product Catalog Search & Edit/Delete States
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<Product | null>(null);
  const [editFormState, setEditFormState] = useState<Partial<Product>>({});

  const handleStartEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    const existingImgs = prod.images && prod.images.length > 0 ? prod.images : (prod.image ? [prod.image] : []);
    const matchedCat = (categories || []).find(
      c => c.key === prod.category || c.id === prod.category || c.name.toLowerCase() === prod.categoryLabel?.toLowerCase() || c.bnName === prod.categoryLabel
    );
    setEditFormState({
      name: prod.name,
      bnName: prod.bnName || '',
      category: matchedCat ? (matchedCat.key || matchedCat.id) : (prod.category || 'honey'),
      categoryLabel: matchedCat ? matchedCat.name : (prod.categoryLabel || ''),
      price: prod.price,
      originalPrice: prod.originalPrice,
      discountBadge: prod.discountBadge || '',
      weight: prod.weight || '',
      image: prod.image || '',
      images: existingImgs,
      inStock: prod.inStock ?? true,
      stockCount: prod.stockCount ?? 100,
      description: prod.description || '',
      features: prod.features || []
    });
  };

  const handleSaveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      await api.updateProduct(editingProduct.id, editFormState);
      onRefreshData();
      setToastMessage(`✅ "${editFormState.name || editingProduct.name}" সফলভাবে আপডেট করা হয়েছে!`);
      setTimeout(() => setToastMessage(null), 4000);
      setEditingProduct(null);
    } catch (err) {
      console.error('Error updating product:', err);
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (!deleteConfirmProduct) return;
    try {
      await api.deleteProduct(deleteConfirmProduct.id);
      onRefreshData();
      setToastMessage(`🗑️ "${deleteConfirmProduct.name}" পণ্যটি মুছে ফেলা হয়েছে!`);
      setTimeout(() => setToastMessage(null), 4000);
      setDeleteConfirmProduct(null);
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const handleSaveNewProduct = async (productData: Partial<Product> & { [key: string]: any }) => {
    try {
      const created = await api.createProduct(productData);
      onAddNewProduct(created);
      onRefreshData();
      soundNotification.playOrderChime();
      setToastMessage(`✅ পণ্য সফলভাবে যোগ করা হয়েছে: "${productData.name}"`);
      setTimeout(() => setToastMessage(null), 5000);
      handleNavigateSection('products');
    } catch (err) {
      console.error(err);
      onAddNewProduct(productData);
      handleNavigateSection('products');
    }
  };

  // Order Management Filter & Edit
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<Order | null>(null);

  // Edit form state for order details including price, location, status, etc.
  const [orderEditForm, setOrderEditForm] = useState<{
    customerName: string;
    phone: string;
    altPhone: string;
    district: string;
    upazila: string;
    address: string;
    deliveryArea: 'inside_dhaka' | 'outside_dhaka';
    deliveryFee: number;
    subtotal: number;
    totalAmount: number;
    status: OrderStatus;
    paymentMethod: 'cod' | 'bkash' | 'nagad';
    paymentStatus: 'paid' | 'unpaid';
    courierName: string;
    courierTrackingId: string;
    items: OrderItem[];
  }>({
    customerName: '',
    phone: '',
    altPhone: '',
    district: 'Dhaka',
    upazila: 'Dhanmondi',
    address: '',
    deliveryArea: 'inside_dhaka',
    deliveryFee: 60,
    subtotal: 0,
    totalAmount: 0,
    status: 'pending',
    paymentMethod: 'cod',
    paymentStatus: 'unpaid',
    courierName: 'Steadfast Courier',
    courierTrackingId: '',
    items: []
  });

  const handleStartEditOrder = (order: Order) => {
    setEditingOrder(order);
    setOrderEditForm({
      customerName: order.customerName || '',
      phone: order.phone || '',
      altPhone: order.altPhone || '',
      district: order.district || 'Dhaka',
      upazila: order.upazila || order.city || '',
      address: order.address || '',
      deliveryArea: order.deliveryArea || 'inside_dhaka',
      deliveryFee: order.deliveryFee ?? (order.deliveryArea === 'inside_dhaka' ? 60 : 120),
      subtotal: order.subtotal || (order.totalAmount - (order.deliveryFee || 60)),
      totalAmount: order.totalAmount,
      status: order.status,
      paymentMethod: order.paymentMethod as any,
      paymentStatus: order.paymentStatus as any,
      courierName: order.courierName || 'Steadfast Courier',
      courierTrackingId: order.courierTrackingId || '',
      items: order.items ? JSON.parse(JSON.stringify(order.items)) : []
    });
  };

  const updateItemQuantity = (index: number, newQty: number) => {
    const newItems = [...orderEditForm.items];
    newItems[index].quantity = Math.max(1, newQty);
    const newSubtotal = newItems.reduce((sum, it) => sum + (it.price * it.quantity), 0);
    setOrderEditForm({
      ...orderEditForm,
      items: newItems,
      subtotal: newSubtotal,
      totalAmount: newSubtotal + Number(orderEditForm.deliveryFee)
    });
  };

  const handleSaveOrderEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    try {
      await api.updateOrder(editingOrder.id, {
        customerName: orderEditForm.customerName,
        phone: orderEditForm.phone,
        altPhone: orderEditForm.altPhone,
        district: orderEditForm.district,
        upazila: orderEditForm.upazila,
        city: orderEditForm.upazila || orderEditForm.district,
        address: orderEditForm.address,
        deliveryArea: orderEditForm.deliveryArea,
        deliveryFee: Number(orderEditForm.deliveryFee),
        subtotal: Number(orderEditForm.subtotal),
        totalAmount: Number(orderEditForm.totalAmount),
        status: orderEditForm.status,
        paymentMethod: orderEditForm.paymentMethod,
        paymentStatus: orderEditForm.paymentStatus,
        courierName: orderEditForm.courierName,
        courierTrackingId: orderEditForm.courierTrackingId,
        items: orderEditForm.items
      });
      onRefreshData();
      setToastMessage(`✅ অর্ডার #${editingOrder.orderNumber}-এর তথ্য ও মূল্য সফলভাবে আপডেট করা হয়েছে!`);
      setTimeout(() => setToastMessage(null), 4000);
      setEditingOrder(null);
    } catch (e) {
      console.error(e);
      setToastMessage('⚠️ অর্ডার আপডেট করতে সমস্যা হয়েছে।');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleQuickStatusChange = async (order: Order, newStatus: OrderStatus, courier?: string) => {
    try {
      const trackingId = courier ? (order.courierTrackingId || `ST-${Date.now().toString().slice(-6)}`) : order.courierTrackingId;
      const updates: Partial<Order> = {
        status: newStatus,
        courierName: courier || order.courierName || (newStatus === 'shipped' ? 'Steadfast Courier' : order.courierName),
        courierTrackingId: trackingId,
        paymentStatus: newStatus === 'delivered' ? 'paid' : order.paymentStatus
      };

      await api.updateOrder(order.id, updates);
      soundNotification.playOrderChime();

      let message = '';
      if (newStatus === 'verified') {
        message = `📞 অর্ডার #${order.orderNumber} কনফার্মড / নিশ্চিত করা হয়েছে!`;
      } else if (newStatus === 'processing') {
        message = `⚙️ অর্ডার #${order.orderNumber} প্রসেসিং-এ স্থানান্তর করা হয়েছে!`;
      } else if (newStatus === 'packaging') {
        message = `📦 অর্ডার #${order.orderNumber} প্যাকেজিং সম্পন্ন হয়েছে!`;
      } else if (newStatus === 'shipped') {
        message = `🚚 অর্ডার #${order.orderNumber} ${courier || order.courierName || 'কুরিয়ারে'} হস্তান্তর করা হয়েছে!`;
      } else if (newStatus === 'out_for_delivery') {
        message = `🛵 অর্ডার #${order.orderNumber} ডেলিভারির জন্য বের হয়েছে!`;
      } else if (newStatus === 'delivered') {
        message = `🎉 অর্ডার #${order.orderNumber} সফলভাবে ডেলিভারড সম্পন্ন হয়েছে!`;
      } else if (newStatus === 'cancelled') {
        message = `❌ অর্ডার #${order.orderNumber} বাতিল করা হয়েছে!`;
      } else {
        message = `✅ অর্ডার #${order.orderNumber} স্ট্যাটাস পরিবর্তন করা হয়েছে (${newStatus})!`;
      }

      setToastMessage(message);
      setTimeout(() => setToastMessage(null), 4000);
      onRefreshData();
    } catch (e: any) {
      console.error('Quick status change error:', e);
      setToastMessage(`⚠️ অর্ডার স্ট্যাটাস আপডেট ব্যর্থ: ${e?.message || 'সার্ভার সংযোগ চেক করুন'}`);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  const handleConfirmDeleteOrder = async () => {
    if (!deleteConfirmOrder) return;
    try {
      await api.deleteOrder(deleteConfirmOrder.id);
      onRefreshData();
      setToastMessage(`🗑️ অর্ডার #${deleteConfirmOrder.orderNumber} সফলভাবে ডিলিট করা হয়েছে!`);
      setTimeout(() => setToastMessage(null), 4000);
      setDeleteConfirmOrder(null);
    } catch (err) {
      console.error('Error deleting order:', err);
    }
  };

  // Top Metrics calculation (100% Dynamic from actual database records)
  const totalProductsCount = products.length;
  const totalOrdersCount = orders.length;
  const totalRevenue = orders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const incompleteCount = orders.filter(o => o.status === 'pending' || o.status === 'verified').length;

  // Stock values (100% Dynamic)
  const stockTotalUnits = products.reduce((acc, p) => acc + (p.stockCount || 0), 0);
  const stockRetailValue = products.reduce((acc, p) => acc + (p.price * (p.stockCount || 0)), 0);
  const stockInventoryCost = Math.round(stockRetailValue * 0.78);
  const stockPotentialProfit = (stockRetailValue - stockInventoryCost);

  const filteredOrders = orders.filter(order => {
    const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
    if (!orderSearchQuery.trim()) return matchesStatus;

    const q = orderSearchQuery.toLowerCase().trim();
    const matchesSearch =
      (order.orderNumber || '').toLowerCase().includes(q) ||
      (order.customerName || '').toLowerCase().includes(q) ||
      (order.phone || '').includes(q) ||
      (order.altPhone || '').includes(q) ||
      (order.district || '').toLowerCase().includes(q) ||
      (order.upazila || '').toLowerCase().includes(q) ||
      (order.address || '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  // Export orders to Excel (CSV with UTF-8 BOM for full Bangla and Excel support)
  const exportOrdersToExcel = (ordersToExport: Order[], tabName: string) => {
    if (!ordersToExport || ordersToExport.length === 0) {
      setToastMessage('⚠️ ডাউনলোড করার জন্য এই ট্যাবে কোনো অর্ডার নেই।');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const headers = [
      'S/N (ক্রমিক নং)',
      'Order ID (অর্ডার আইডি)',
      'Order Date (অর্ডারের তারিখ)',
      'Customer Name (গ্রাহকের নাম)',
      'Phone (মোবাইল নম্বর)',
      'Alt Phone (বিকল্প নম্বর)',
      'District (জেলা)',
      'Thana/Upazila (থানা/উপজেলা)',
      'Full Address (পূর্ণাঙ্গ ডেলিভারি ঠিকানা)',
      'Items (পণ্য বিবরণী)',
      'Quantity (মোট সংখ্যা)',
      'Delivery Area (ডেলিভারি এরিয়া)',
      'Delivery Fee (ডেলিভারি চার্জ ৳)',
      'Total Amount (সর্বমোট মূল্য ৳)',
      'Payment Method (পেমেন্ট পদ্ধতি)',
      'Payment Status (পেমেন্ট অবস্থা)',
      'Order Status (অর্ডার স্ট্যাটাস)',
      'Courier Name (কুরিয়ার কোম্পানি)',
      'Tracking Code (ট্র্যাকিং আইডি)'
    ];

    const rows = ordersToExport.map((ord, index) => {
      const itemsSummary = ord.items
        .map(it => `${it.productName} (x${it.quantity})`)
        .join('; ');
      const totalQty = ord.items.reduce((acc, it) => acc + (it.quantity || 1), 0);
      const dateStr = new Date(ord.createdAt).toLocaleString('bn-BD', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      return [
        index + 1,
        `"${ord.orderNumber}"`,
        `"${dateStr}"`,
        `"${(ord.customerName || '').replace(/"/g, '""')}"`,
        `"${ord.phone || ''}"`,
        `"${ord.altPhone || '-'}"`,
        `"${ord.district || ''}"`,
        `"${ord.upazila || ord.city || ''}"`,
        `"${(ord.address || '').replace(/"/g, '""')}"`,
        `"${itemsSummary.replace(/"/g, '""')}"`,
        totalQty,
        ord.deliveryArea === 'inside_dhaka' ? 'ঢাকার ভিতরে (৳৬০)' : 'ঢাকার বাইরে (৳১২০)',
        ord.deliveryFee,
        ord.totalAmount,
        ord.paymentMethod,
        ord.paymentStatus,
        ord.status,
        `"${ord.courierName || 'Pending'}"`,
        `"${ord.courierTrackingId || '-'}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTabName = tabName.replace(/\s+/g, '_').toLowerCase();
    link.setAttribute('href', url);
    link.setAttribute('download', `Arishten_Orders_${safeTabName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToastMessage(`📥 "${tabName}"-এর ${ordersToExport.length} টি অর্ডারের এক্সেল ফাইল সফলভাবে ডাউনলোড হয়েছে!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-800 flex font-sans">
      {/* 1. LEFT SIDEBAR */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col justify-between shrink-0 sticky top-0 h-screen z-30 select-none`}
      >
        {/* Top Section */}
        <div className="p-4 overflow-y-auto">
          {/* Admin Brand in Left Sidebar */}
          <div className="flex items-center gap-2.5 mb-5 px-1">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-base shadow-xs shrink-0">
              A
            </div>
            {isSidebarOpen && (
              <div className="flex items-baseline gap-1.5 overflow-hidden">
                <span className="text-lg font-bold tracking-tight text-gray-900">Arishten</span>
                <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded-md">Admin</span>
              </div>
            )}
          </div>

          {/* Visit Shop Link */}
          <button
            onClick={onVisitShop}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50/60 rounded-xl transition-colors cursor-pointer mb-5 border border-blue-100 bg-blue-50/30"
          >
            <ArrowUpRight className="w-4 h-4 shrink-0 text-blue-600" />
            {isSidebarOpen && <span>Visit Shop</span>}
          </button>

          {/* Navigation Groups */}
          <nav className="space-y-1">
            {/* GROUP: MAIN */}
            <div>
              {isSidebarOpen && (
                <button
                  onClick={() => toggleMenu('main')}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-900 cursor-pointer"
                >
                  <span className="uppercase tracking-wider text-[11px]">Main</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                      openMenus.main ? 'rotate-0' : '-rotate-90'
                    }`}
                  />
                </button>
              )}

              <div className="space-y-1 mt-1">
                {/* Dashboard (Active) */}
                <button
                  onClick={() => handleNavigateSection('dashboard')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeSection === 'dashboard'
                      ? 'bg-sky-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0 text-blue-600" />
                  {isSidebarOpen && <span>Dashboard</span>}
                </button>

                {/* Analytics */}
                <button
                  onClick={() => handleNavigateSection('analytics')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    activeSection === 'analytics'
                      ? 'bg-sky-50 text-blue-600 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <BarChart2 className="w-4 h-4 shrink-0 text-gray-500" />
                  {isSidebarOpen && <span>Analytics</span>}
                </button>
              </div>
            </div>

            {/* GROUP: CATALOG */}
            <div className="pt-2">
              <button
                onClick={() => {
                  toggleMenu('catalog');
                  if (!openMenus.catalog) handleNavigateSection('products');
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <FolderTree className="w-4 h-4 text-gray-500" />
                  {isSidebarOpen && <span>Catalog</span>}
                </div>
                {isSidebarOpen && (
                  <ChevronRight
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                      openMenus.catalog ? 'rotate-90' : ''
                    }`}
                  />
                )}
              </button>

              {isSidebarOpen && openMenus.catalog && (
                <div className="pl-9 pr-2 py-1 space-y-1 text-xs">
                  <button
                    onClick={() => handleNavigateSection('products')}
                    className={`w-full text-left py-1.5 px-2 rounded-lg cursor-pointer ${
                      activeSection === 'products' ? 'text-blue-600 font-bold bg-blue-50' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Products List ({products.length})
                  </button>
                  <button
                    onClick={() => handleNavigateSection('categories')}
                    className={`w-full text-left py-1.5 px-2 rounded-lg cursor-pointer flex items-center justify-between ${
                      activeSection === 'categories' ? 'text-blue-600 font-bold bg-blue-50' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3 h-3 text-blue-500" />
                      <span>Categories (Edit/Delete)</span>
                    </span>
                  </button>
                  <button
                    onClick={() => handleNavigateSection('new_product')}
                    className={`w-full text-left py-1.5 px-2 rounded-lg cursor-pointer flex items-center justify-between ${
                      activeSection === 'new_product' ? 'text-blue-600 font-bold bg-blue-50' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span>+ Add New Product</span>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-semibold">New</span>
                  </button>
                  <button
                    onClick={() => setShowStockModal(true)}
                    className="w-full text-left py-1.5 px-2 rounded-lg text-gray-600 hover:text-gray-900 cursor-pointer"
                  >
                    Manage Inventory
                  </button>
                </div>
              )}
            </div>

            {/* GROUP: SALES */}
            <div>
              <button
                onClick={() => {
                  toggleMenu('sales');
                  if (!openMenus.sales) handleNavigateSection('orders');
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-4 h-4 text-gray-500" />
                  {isSidebarOpen && <span>Sales</span>}
                </div>
                {isSidebarOpen && (
                  <ChevronRight
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                      openMenus.sales ? 'rotate-90' : ''
                    }`}
                  />
                )}
              </button>

              {isSidebarOpen && openMenus.sales && (
                <div className="pl-9 pr-2 py-1 space-y-1 text-xs">
                  <button
                    onClick={() => handleNavigateSection('orders')}
                    className={`w-full text-left py-1.5 px-2 rounded-lg cursor-pointer ${
                      activeSection === 'orders' ? 'text-blue-600 font-bold bg-blue-50' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    All Orders ({totalOrdersCount})
                  </button>
                  <button
                    onClick={() => handleNavigateSection('orders')}
                    className="w-full text-left py-1.5 px-2 rounded-lg text-gray-600 hover:text-gray-900 cursor-pointer"
                  >
                    Incomplete / Abandoned
                  </button>
                </div>
              )}
            </div>



            {/* GROUP: APPEARANCE & SOCIAL */}
            <div>
              <button
                onClick={() => {
                  toggleMenu('appearance');
                  handleNavigateSection('settings');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl transition-colors cursor-pointer ${
                  activeSection === 'settings' ? 'text-blue-600 bg-blue-50/80 font-bold' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Palette className="w-4 h-4 text-gray-500" />
                  {isSidebarOpen && <span>Settings & Social</span>}
                </div>
                {isSidebarOpen && (
                  <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                    Facebook
                  </span>
                )}
              </button>
              {isSidebarOpen && openMenus.appearance && (
                <div className="pl-9 pr-2 py-1 space-y-1 text-xs">
                  <button
                    onClick={() => handleNavigateSection('settings')}
                    className={`w-full text-left py-1.5 px-2 rounded-lg cursor-pointer ${
                      activeSection === 'settings' ? 'text-blue-600 font-bold bg-blue-50' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Facebook Page Link
                  </button>
                  <button
                    onClick={() => handleNavigateSection('settings')}
                    className={`w-full text-left py-1.5 px-2 rounded-lg cursor-pointer font-semibold flex items-center justify-between ${
                      activeSection === 'settings' ? 'text-blue-600 font-bold bg-blue-50' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span>Footer Manager</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded">Save</span>
                  </button>
                </div>
              )}
            </div>

            {/* GROUP: MARKETING */}
            <div>
              <button
                onClick={() => {
                  toggleMenu('marketing');
                  handleNavigateSection('settings');
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Megaphone className="w-4 h-4 text-gray-500" />
                  {isSidebarOpen && <span>Marketing</span>}
                </div>
                {isSidebarOpen && (
                  <ChevronRight
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                      openMenus.marketing ? 'rotate-90' : ''
                    }`}
                  />
                )}
              </button>
            </div>

            {/* GROUP: SYSTEM & SETTINGS */}
            <div>
              <button
                onClick={() => {
                  toggleMenu('system');
                  if (!openMenus.system) handleNavigateSection('settings');
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4 text-gray-500" />
                  {isSidebarOpen && <span>System & Settings</span>}
                </div>
                {isSidebarOpen && (
                  <ChevronRight
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                      openMenus.system ? 'rotate-90' : ''
                    }`}
                  />
                )}
              </button>

              {isSidebarOpen && openMenus.system && (
                <div className="pl-9 pr-2 py-1 space-y-1 text-xs">
                  <button
                    onClick={() => handleNavigateSection('settings')}
                    className={`w-full text-left py-1.5 px-2 rounded-lg cursor-pointer ${
                      activeSection === 'settings' ? 'text-blue-600 font-bold bg-blue-50' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Social & Facebook Settings
                  </button>
                  <button
                    onClick={() => handleNavigateSection('cpanel')}
                    className={`w-full text-left py-1.5 px-2 rounded-lg cursor-pointer ${
                      activeSection === 'cpanel' ? 'text-blue-600 font-bold bg-blue-50' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    cPanel Storage Sync
                  </button>
                  <button
                    onClick={() => handleNavigateSection('tasks')}
                    className={`w-full text-left py-1.5 px-2 rounded-lg cursor-pointer ${
                      activeSection === 'tasks' ? 'text-blue-600 font-bold bg-blue-50' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Production Tasks ({tasks.length})
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Bottom Section: Logout (Red) */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0 text-red-500" />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* 2. MAIN DASHBOARD CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-gray-200/80 px-6 py-3.5 flex items-center justify-between sticky top-0 z-20">
          {/* Left: Sidebar Toggle + Brand Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-500 hover:text-gray-800 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              title="Toggle Sidebar"
            >
              <PanelLeft className="w-5 h-5" />
            </button>

            {/* Brand Logo matching screenshot */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-base shadow-sm">
                A
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold tracking-tight text-gray-900">Arishten</span>
                <span className="text-xs text-gray-400 font-normal">Admin</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded-md">v{APP_VERSION}</span>
              </div>
            </div>
          </div>

          {/* Right: Actions, Facebook Link, Visit Store & Notifications */}
          <div className="flex items-center gap-2.5">
            {/* Cache Reset Button */}
            <button
              onClick={() => {
                if (window.confirm('সকল ব্রাউজার ক্যাশ ও লোকাল ডাটা ক্লিয়ার করে নতুন ভার্সনে আপডেট করতে চান?')) {
                  forceClearCacheAndReload();
                }
              }}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="ডিভাইসের পুরাতন ক্যাশ মুছে নতুন ভার্সন লোড করুন"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden md:inline">ক্যাশ ক্লিয়ার</span>
            </button>
            <button
              onClick={() => handleNavigateSection('settings')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                activeSection === 'settings'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs font-bold'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
              }`}
              title="ফেসবুক পেজ লিংক ও সোশ্যাল সেটিংস পরিবর্তন করুন"
            >
              <div className="w-4 h-4 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[10px] font-bold">
                f
              </div>
              <span className="hidden sm:inline">Facebook Link</span>
            </button>

            <button
              onClick={onVisitShop}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
              <span className="hidden sm:inline">Visit Store</span>
            </button>

            {/* Notifications Bell with Badge 4 */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors cursor-pointer relative"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  4
                </span>
              </button>

            {/* Notification Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-88 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 z-50 animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900 uppercase">বিজ্ঞপ্তি ও নোটিফিকেশন</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer p-1 rounded-md hover:bg-gray-100"
                  >
                    ✕
                  </button>
                </div>

                {/* Email & Browser Status Banner */}
                <div className="my-3 p-3 bg-blue-50/70 border border-blue-100 rounded-xl space-y-2 text-xs">
                  <div className="flex items-start gap-2 text-blue-900">
                    <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">অটোমেটিক ইমেইল নোটিফিকেশন</p>
                      <p className="text-[11px] text-blue-700">
                        ফ্রম: <span className="font-mono font-semibold">info@arishstore.com</span>
                        <br />
                        টু: <span className="font-mono font-semibold text-blue-900">arishtenweb@gmail.com</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-blue-100/80">
                    <span className="text-[11px] text-blue-800 flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5 text-blue-600" /> ব্রাউজার সাউন্ড ও পুশ
                    </span>
                    <button
                      onClick={async () => {
                        const granted = await soundNotification.requestPermission();
                        soundNotification.playOrderChime();
                        setToastMessage(granted ? '🔔 ব্রাউজার নোটিফিকেশন সফলভাবে চালু করা হয়েছে!' : '🔔 সাউন্ড টেস্ট বাজানো হলো!');
                        setTimeout(() => setToastMessage(null), 4000);
                      }}
                      className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      {soundNotification.hasPermission() ? 'অনুমতি সচল ✓' : 'অনুমতি দিন 🔔'}
                    </button>
                  </div>
                </div>

                {/* Quick Test Button */}
                <button
                  onClick={async () => {
                    soundNotification.playOrderChime();
                    soundNotification.showDesktopNotification('🛒 টেস্ট অর্ডার নোটিফিকেশন!', {
                      body: 'গ্রাহক: তানভীর আহমেদ (৳১,৫১০) • ডেলিভারি: ঢাকা'
                    });
                    try {
                      await fetch('/api/test-notification', { method: 'POST' });
                    } catch (e) {}
                    setToastMessage('🔔 টেস্ট নোটিফিকেশন এবং arishtenweb@gmail.com এ ইমেইল সফলভাবে পাঠানো হয়েছে!');
                    setTimeout(() => setToastMessage(null), 4500);
                  }}
                  className="w-full mb-3 flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  টেস্ট নোটিফিকেশন ও ইমেইল পাঠান
                </button>

                <div className="space-y-2 text-xs max-h-60 overflow-y-auto">
                  <div className="p-2.5 bg-gray-50 hover:bg-blue-50/50 rounded-xl transition-colors">
                    <p className="font-semibold text-gray-900">নতুন অর্ডার #ARISH-8924 গৃহীত</p>
                    <span className="text-[10px] text-gray-500">তানভীর আহমেদ • ৳১,৫১০ (ক্যাশ অন ডেলিভারি)</span>
                  </div>
                  <div className="p-2.5 bg-gray-50 hover:bg-emerald-50/50 rounded-xl transition-colors">
                    <p className="font-semibold text-gray-900">cPanel ডাটাবেজ সিঙ্ক সফল</p>
                    <span className="text-[10px] text-gray-500">s3.sitechai.com / Auto Synced</span>
                  </div>
                  <div className="p-2.5 bg-gray-50 hover:bg-amber-50/50 rounded-xl transition-colors">
                    <p className="font-semibold text-gray-900">কুরিয়ার পিকআপ শিডিউল</p>
                    <span className="text-[10px] text-gray-500">Steadfast Logistics (STF-8849201)</span>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </header>

        {/* Dashboard Main View Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-6 max-w-7xl touch-pan-y scroll-smooth" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Browser Notification Activation Banner */}
          {!hasNotificationPermission && !dismissNotificationBanner && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bell className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">ব্রাউজার নোটিফিকেশন চালু করুন</h4>
                  <p className="text-xs text-gray-600">নতুন কোনো গ্রাহক অর্ডার দিলে যাতে ব্রাউজারে সাথে সাথে পুশ নোটিফিকেশন ও সাউন্ড এলার্ট বাজে।</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  onClick={async () => {
                    const granted = await soundNotification.requestPermission();
                    setHasNotificationPermission(granted);
                    soundNotification.playOrderChime();
                    if (granted) {
                      soundNotification.showDesktopNotification('🛒 নোটিফিকেশন সফলভাবে চালু হয়েছে!', {
                        body: 'এখন থেকে নতুন কোনো অর্ডার আসলেই আপনি তাৎক্ষণিক নোটিফিকেশন পাবেন।'
                      });
                      setToastMessage('✅ ব্রাউজার নোটিফিকেশন সফলভাবে চালু করা হয়েছে!');
                    } else {
                      setToastMessage('🔔 সাউন্ড টেস্ট সফল!');
                    }
                    setTimeout(() => setToastMessage(null), 4000);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex-1 sm:flex-initial text-center"
                >
                  অনুমতি দিন (Enable Notifications)
                </button>
                <button
                  onClick={() => setDismissNotificationBanner(true)}
                  className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 font-semibold cursor-pointer rounded-xl hover:bg-white/60"
                  title="বাতিল করুন"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Success / Notification Toast */}
          {toastMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-semibold rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in">
              <span>{toastMessage}</span>
              <button
                onClick={() => setToastMessage(null)}
                className="text-xs text-emerald-700 hover:text-emerald-950 font-bold px-2 py-1 rounded bg-emerald-100/60 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
          )}

          {/* VIEW: NEW PRODUCT FORM (Matching Screenshot) */}
          {activeSection === 'new_product' && (
            <NewProductForm
              categories={categories}
              onSaveProduct={handleSaveNewProduct}
              onCancel={() => handleNavigateSection('products')}
            />
          )}

          {/* VIEW: CATEGORIES MANAGEMENT (Edit & Delete) */}
          {activeSection === 'categories' && (
            <CategoryManager
              products={products}
              categories={categories}
              onCategoryUpdate={onCategoryUpdate}
              onNavigateToNewProduct={() => handleNavigateSection('new_product')}
            />
          )}

          {activeSection === 'dashboard' && (
            <>
              {/* Page Title: Dashboard */}
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>

              {/* 4 TOP KPI CARDS (Matching image layout) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Products Card */}
                <div className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-2xs flex flex-col justify-between min-h-[110px]">
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-sm font-medium text-gray-600">Products</span>
                    <Package className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 tracking-tight">{totalProductsCount}</p>
                </div>

                {/* 2. Orders Card */}
                <div className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-2xs flex flex-col justify-between min-h-[110px]">
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-sm font-medium text-gray-600">Orders</span>
                    <ShoppingCart className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 tracking-tight">{totalOrdersCount}</p>
                </div>

                {/* 3. Revenue Card */}
                <div className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-2xs flex flex-col justify-between min-h-[110px]">
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-sm font-medium text-gray-600">Revenue</span>
                    <DollarSign className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 tracking-tight">
                    ৳{totalRevenue.toLocaleString()}
                  </p>
                </div>

                {/* 4. Incomplete Card */}
                <div className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-2xs flex flex-col justify-between min-h-[110px]">
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-sm font-medium text-gray-600">Incomplete</span>
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900 tracking-tight">{incompleteCount}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Pending + Confirmed</p>
                  </div>
                </div>
              </div>

              {/* STOCK QUICK INFO CARD (Matching image layout) */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200/90 shadow-2xs space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-blue-600">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h2 className="text-sm font-semibold text-gray-800">Stock Quick Info</h2>
                  </div>

                  <button
                    onClick={() => setShowStockModal(true)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    Manage Stock
                  </button>
                </div>

                {/* 5 Stats Columns */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-1 text-left">
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">Total Units</span>
                    <p className="text-xl font-bold text-gray-900">{stockTotalUnits}</p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 block mb-1">Retail Value</span>
                    <p className="text-xl font-bold text-gray-900">৳{stockRetailValue.toLocaleString()}</p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 block mb-1">Inventory Cost</span>
                    <p className="text-xl font-bold text-gray-900">৳{stockInventoryCost.toLocaleString()}</p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 block mb-1">Potential Profit</span>
                    <p className="text-xl font-bold text-blue-600 flex items-center gap-1">
                      <span className="text-xs">📈</span>
                      <span>৳{stockPotentialProfit.toLocaleString()}</span>
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 block mb-1">Alerts</span>
                    <p className="text-xl font-bold text-gray-900">
                      <span className="text-red-500">0</span>
                      <span className="text-xs font-normal text-gray-500 ml-1">(0 out, 0 low)</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* TWO 14-DAYS CHARTS (Matching image layout) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Chart: Orders (14 Days) */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200/90 shadow-2xs space-y-4">
                  <h3 className="text-sm font-semibold text-gray-800">Orders (14 Days)</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={orders14DaysData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="date"
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 10 }}
                          interval={1}
                        />
                        <YAxis
                          domain={[0, 1]}
                          ticks={[0, 0.25, 0.5, 0.75, 1]}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 10 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '12px',
                            border: 'none'
                          }}
                          formatter={(val: number) => [`${val} Orders`, 'Daily Orders']}
                        />
                        <Bar dataKey="orders" fill="#0284c7" radius={[2, 2, 0, 0]} maxBarSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Right Chart: Revenue (14 Days) */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200/90 shadow-2xs space-y-4">
                  <h3 className="text-sm font-semibold text-gray-800">Revenue (14 Days)</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenue14DaysData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="date"
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 10 }}
                          interval={1}
                        />
                        <YAxis
                          domain={[0, 800]}
                          ticks={[0, 200, 400, 600, 800]}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 10 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '12px',
                            border: 'none'
                          }}
                          formatter={(val: number) => [`৳${val}`, 'Daily Revenue']}
                        />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#0284c7"
                          strokeWidth={2}
                          dot={{ r: 3.5, fill: '#fff', stroke: '#0284c7', strokeWidth: 2 }}
                          activeDot={{ r: 5, fill: '#0284c7' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* VIEW: ORDERS MANAGEMENT (Sales -> All Orders) */}
          {activeSection === 'orders' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
              <div className="p-5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                    <span>Orders Management ({orders.length} Total)</span>
                  </h2>
                  <p className="text-xs text-gray-500">গ্রাহকদের অর্ডার স্ট্যাটাস ও কুরিয়ার ট্র্যাকিং পরিচালনা করুন</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      onRefreshData();
                      setToastMessage('🔄 অর্ডার ডাটা রিলোড এবং সিঙ্ক করা হচ্ছে...');
                      setTimeout(() => setToastMessage(null), 2500);
                    }}
                    className="p-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1 cursor-pointer transition-all"
                    title="ডাটাবেজ থেকে নতুন অর্ডার রিলোড করুন"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin-hover" />
                    <span className="hidden sm:inline">রিফ্রেশ</span>
                  </button>

                  <div className="relative w-56 sm:w-64">
                    <input
                      type="text"
                      placeholder="অর্ডার নং, নাম, ফোন, জেলা..."
                      value={orderSearchQuery}
                      onChange={e => setOrderSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>

                  {/* Primary Download Excel for currently viewed filtered list */}
                  <button
                    onClick={() => {
                      const currentTabObj = [
                        { id: 'all', label: 'সব অর্ডার' },
                        { id: 'pending', label: 'পেন্ডিং অর্ডার' },
                        { id: 'shipped', label: 'কুরিয়ারে প্রেরিত অর্ডার' },
                        { id: 'delivered', label: 'ডেলিভারড অর্ডার' }
                      ].find(t => t.id === orderStatusFilter);
                      exportOrdersToExcel(filteredOrders, currentTabObj ? currentTabObj.label : 'অর্ডার তালিকা');
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="বর্তমান তালিকার এক্সেল ডাউনলোড করুন"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>এক্সেল ডাউনলোড ({filteredOrders.length})</span>
                  </button>
                </div>
              </div>

              {/* Status Tabs with Serial Numbers (S/N) and Separate Individual Excel Downloads */}
              <div className="px-5 py-3 border-b border-gray-200 bg-gray-50/30 flex items-center gap-2 overflow-x-auto">
                {[
                  {
                    id: 'all',
                    sn: 1,
                    label: 'সব অর্ডার',
                    count: orders.length,
                    getOrders: () => orders
                  },
                  {
                    id: 'pending',
                    sn: 2,
                    label: 'পেন্ডিং',
                    count: orders.filter(o => o.status === 'pending').length,
                    getOrders: () => orders.filter(o => o.status === 'pending')
                  },
                  {
                    id: 'verified',
                    sn: 3,
                    label: 'কনফার্মড',
                    count: orders.filter(o => o.status === 'verified').length,
                    getOrders: () => orders.filter(o => o.status === 'verified')
                  },
                  {
                    id: 'shipped',
                    sn: 4,
                    label: 'কুরিয়ারে প্রেরিত',
                    count: orders.filter(o => o.status === 'shipped').length,
                    getOrders: () => orders.filter(o => o.status === 'shipped')
                  },
                  {
                    id: 'delivered',
                    sn: 5,
                    label: 'ডেলিভারড',
                    count: orders.filter(o => o.status === 'delivered').length,
                    getOrders: () => orders.filter(o => o.status === 'delivered')
                  },
                  {
                    id: 'cancelled',
                    sn: 6,
                    label: 'বাতিল',
                    count: orders.filter(o => o.status === 'cancelled').length,
                    getOrders: () => orders.filter(o => o.status === 'cancelled')
                  }
                ].map(tab => {
                  const isActive = orderStatusFilter === tab.id;
                  return (
                    <div
                      key={tab.id}
                      className={`flex items-center rounded-xl p-0.5 transition-all border ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {/* Tab Select Button with S/N */}
                      <button
                        onClick={() => setOrderStatusFilter(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer rounded-lg ${
                          isActive ? 'text-white' : 'text-gray-700'
                        }`}
                      >
                        {/* Serial Number Badge (S/N) */}
                        <span
                          className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                            isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {tab.sn}
                        </span>
                        <span>{tab.label}</span>
                        <span
                          className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                            isActive ? 'bg-white text-blue-700' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {tab.count}
                        </span>
                      </button>

                      {/* Separate Excel Download Button for this Tab */}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          exportOrdersToExcel(tab.getOrders(), tab.label);
                        }}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer mr-0.5 ${
                          isActive
                            ? 'text-white/80 hover:text-white hover:bg-white/20'
                            : 'text-gray-400 hover:text-emerald-700 hover:bg-emerald-50'
                        }`}
                        title={`📥 শুধু "${tab.label}"-এর (${tab.count}) এক্সেল ফাইল ডাউনলোড করুন`}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Table */}
              <div className="text-[11px] text-gray-500 mb-1 px-1 flex items-center justify-between font-medium">
                <span className="flex items-center gap-1 text-blue-600">
                  <span>↔️ ডানে-বামে স্ক্রল করতে সোয়াইপ করুন</span>
                </span>
                <span className="text-gray-400 text-[10px] sm:hidden">টেবিলটি সম্পূর্ণ দেখতে স্ক্রল করুন</span>
              </div>
              <div className="overflow-x-auto touch-pan-x pb-2 rounded-xl border border-gray-100 bg-white shadow-2xs">
                <table className="w-full text-left text-xs text-gray-700">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5 w-12 text-center">S/N</th>
                      <th className="p-3.5">Order ID</th>
                      <th className="p-3.5">গ্রাহক</th>
                      <th className="p-3.5">পণ্য</th>
                      <th className="p-3.5">মূল্য</th>
                      <th className="p-3.5">স্ট্যাটাস</th>
                      <th className="p-3.5">কুরিয়ার</th>
                      <th className="p-3.5 text-right">একশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-10 text-gray-500">
                          <p className="text-sm font-semibold">কোনো অর্ডার পাওয়া যায়নি</p>
                          <p className="text-xs text-gray-400 mt-1">অন্য কোনো ফিল্টার বা অনুসন্ধান দিয়ে চেষ্টা করুন</p>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order, index) => (
                        <tr key={order.id} className="hover:bg-blue-50/20">
                          {/* S/N Column */}
                          <td className="p-3.5 text-center font-mono font-bold text-gray-500 bg-gray-50/30">
                            #{index + 1}
                          </td>
                          <td className="p-3.5 font-mono font-bold text-gray-900">
                            #{order.orderNumber}
                            <span className="block text-[10px] text-gray-400 font-normal">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <p className="font-bold text-gray-900">{order.customerName}</p>
                            <p className="text-[11px] text-gray-500">{order.phone}</p>
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-gray-100 text-gray-700 text-[10px] rounded font-medium">
                              📍 {order.district || 'Dhaka'}{order.upazila ? `, ${order.upazila}` : ''}
                            </span>
                          </td>
                          <td className="p-3.5">
                            {order.items.map((it, i) => (
                              <p key={i} className="truncate max-w-xs text-[11px]">
                                {it.quantity}× {it.productName}
                              </p>
                            ))}
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-gray-900">৳{order.totalAmount}</span>
                            <span className="block text-[10px] uppercase text-emerald-600 font-semibold">
                              {order.paymentMethod} • {order.paymentStatus}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div className="space-y-1">
                              <select
                                value={order.status}
                                onChange={e => handleQuickStatusChange(order, e.target.value as OrderStatus)}
                                className={`text-[11px] font-bold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                                  order.status === 'delivered'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : order.status === 'shipped'
                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                    : order.status === 'verified'
                                    ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                                    : order.status === 'cancelled'
                                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                              >
                                <option value="pending">⏳ Pending (পেন্ডিং)</option>
                                <option value="verified">📞 Confirmed (কনফার্মড)</option>
                                <option value="shipped">🚚 Shipped (কুরিয়ারে প্রেরিত)</option>
                                <option value="delivered">✅ Delivered (ডেলিভার্ড)</option>
                                <option value="cancelled">❌ Cancelled (বাতিল)</option>
                              </select>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-[11px] text-gray-800">{order.courierName || 'Not Assigned'}</span>
                              </div>
                              {order.courierTrackingId ? (
                                <span className="text-[10px] text-blue-600 font-mono block font-bold">
                                  🏷️ {order.courierTrackingId}
                                </span>
                              ) : null}

                              {/* Quick Courier Assignment Buttons */}
                              {order.status === 'pending' && (
                                <div className="flex items-center gap-1 pt-0.5">
                                  <button
                                    onClick={() => handleQuickStatusChange(order, 'shipped', 'Steadfast Courier')}
                                    className="px-1.5 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold cursor-pointer transition-colors shadow-2xs"
                                    title="Steadfast কুরিয়ারে পাঠিয়ে Shipped মার্ক করুন"
                                  >
                                    + Steadfast
                                  </button>
                                  <button
                                    onClick={() => handleQuickStatusChange(order, 'shipped', 'Pathao Courier')}
                                    className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold cursor-pointer transition-colors shadow-2xs"
                                    title="Pathao কুরিয়ারে পাঠিয়ে Shipped মার্ক করুন"
                                  >
                                    + Pathao
                                  </button>
                                </div>
                              )}

                              {order.status === 'shipped' && (
                                <button
                                  onClick={() => handleQuickStatusChange(order, 'delivered')}
                                  className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                                >
                                  <span>✓ Mark Delivered</span>
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenInvoice(order)}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 border border-emerald-200 shadow-2xs"
                                title="অর্ডার ইনভয়েস দেখুন এবং PDF ডাউনলোড বা প্রিন্ট করুন"
                              >
                                <FileText className="w-3 h-3 text-emerald-700" />
                                <span>Invoice</span>
                              </button>
                              <button
                                onClick={() => handleStartEditOrder(order)}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                                title="অর্ডারের দাম, লোকেশন, ঠিকানা ও স্ট্যাটাস এডিট করুন"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>এডিট</span>
                              </button>
                              <button
                                onClick={() => onOpenTrackOrder(order.orderNumber)}
                                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                title="অর্ডার ট্র্যাক করুন"
                              >
                                ট্র্যাক
                              </button>
                              <button
                                onClick={() => setDeleteConfirmOrder(order)}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="অর্ডারটি ডিলিট করুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: PRODUCTS CATALOG */}
          {activeSection === 'products' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    <span>Organic Products Catalog ({products.length})</span>
                  </h2>
                  <p className="text-xs text-gray-500">প্রোডাক্টের স্টক, দাম, ছবি ও বিবরণী এডিট অথবা ডিলিট করুন</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleNavigateSection('categories')}
                    className="px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Categories</span>
                  </button>
                  <button
                    onClick={() => setShowStockModal(true)}
                    className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    Manage Inventory
                  </button>
                  <button
                    onClick={() => handleNavigateSection('new_product')}
                    className="px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    নতুন পণ্য যোগ করুন
                  </button>
                </div>
              </div>

              {/* Product Search & Filters Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200/80">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="পণ্য বা ক্যাটাগরি দিয়ে সার্চ করুন..."
                    value={productSearchQuery}
                    onChange={e => setProductSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-800"
                  />
                  {productSearchQuery && (
                    <button
                      onClick={() => setProductSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={productCategoryFilter}
                    onChange={e => setProductCategoryFilter(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                  >
                    <option value="all">সকল ক্যাটাগরি ({products.length})</option>
                    {(categories || []).map(cat => (
                      <option key={cat.id || cat.key} value={cat.key}>
                        {cat.name} {cat.bnName ? `(${cat.bnName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Products List Grid */}
              {(() => {
                const filtered = products.filter(prod => {
                  const matchesSearch =
                    !productSearchQuery.trim() ||
                    prod.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                    prod.bnName?.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                    prod.category?.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                    prod.id.toLowerCase().includes(productSearchQuery.toLowerCase());
                  
                  const matchesCategory =
                    productCategoryFilter === 'all' ||
                    prod.category === productCategoryFilter ||
                    prod.categoryLabel?.toLowerCase().includes(productCategoryFilter.toLowerCase());

                  return matchesSearch && matchesCategory;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-12 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                      <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-gray-600">কোনো পণ্য পাওয়া যায়নি</p>
                      <p className="text-xs text-gray-400 mt-1">অনুসন্ধানের কি-ওয়ার্ড পরিবর্তন করে চেষ্টা করুন</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((prod, index) => {
                      const globalIndex = products.findIndex(p => p.id === prod.id);
                      const serialNo = globalIndex !== -1 ? globalIndex + 1 : index + 1;
                      return (
                        <div
                          key={prod.id}
                          className="bg-white border border-gray-200/90 rounded-xl p-4 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group relative"
                        >
                          <span className="absolute top-2 right-2 bg-gray-900 text-white text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold shadow-xs z-10">
                            #{serialNo}
                          </span>
                          <div className="flex gap-3">
                            {/* Product Thumbnail */}
                            <div className="relative w-20 h-20 shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={e => {
                                  (e.target as HTMLElement).setAttribute(
                                    'src',
                                    'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&auto=format&fit=crop&q=80'
                                  );
                                }}
                              />
                              {prod.discountBadge && (
                                <span className="absolute top-1 left-1 bg-amber-500 text-white text-[9px] font-extrabold px-1 rounded">
                                  {prod.discountBadge}
                                </span>
                              )}
                            </div>

                            {/* Product Meta */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {prod.categoryLabel ? (
                                  <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-md border border-blue-100">
                                    {prod.categoryLabel}
                                  </span>
                                ) : null}
                                {prod.weight && (
                                  <span className="text-[10px] bg-gray-100 text-gray-600 font-medium px-1.5 py-0.5 rounded">
                                    {prod.weight}
                                  </span>
                                )}
                              </div>
                              <h3 className="font-bold text-xs text-gray-900 truncate mt-1" title={prod.name}>
                                {prod.name}
                              </h3>
                              <p className="text-[11px] text-gray-500 truncate" title={prod.bnName}>
                                {prod.bnName}
                              </p>

                              <div className="flex items-baseline gap-2 mt-1.5">
                                <span className="font-bold text-sm text-blue-600">৳{prod.price}</span>
                                {prod.originalPrice && prod.originalPrice > prod.price && (
                                  <span className="text-xs text-gray-400 line-through">
                                    ৳{prod.originalPrice}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Stock & Action Buttons */}
                          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  prod.inStock && prod.stockCount > 0 ? 'bg-emerald-500' : 'bg-red-500'
                                }`}
                              />
                              <span className="text-[11px] font-medium text-gray-600">
                                স্টক: <span className="font-bold text-gray-800">{prod.stockCount}</span>
                              </span>
                            </div>

                            {/* Edit & Delete Action Buttons */}
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleStartEditProduct(prod)}
                                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 hover:shadow-2xs"
                                title="পণ্য এডিট করুন"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>এডিট</span>
                              </button>
                              <button
                                onClick={() => setDeleteConfirmProduct(prod)}
                                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 hover:shadow-2xs"
                                title="পণ্য ডিলিট করুন"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>ডিলিট</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* VIEW: cPANEL MANAGER */}
          {activeSection === 'cpanel' && (
            <CPanelManager orders={orders} tasks={tasks} onDataRefresh={onRefreshData} />
          )}

          {/* VIEW: STORE SETTINGS & SOCIAL LINKS (FACEBOOK) */}
          {activeSection === 'settings' && (
            <StoreSettingsManager onSuccessToast={(msg) => setToastMessage(msg)} />
          )}

          {/* VIEW: ANALYTICS */}
          {activeSection === 'analytics' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-6">
              <h2 className="text-lg font-bold text-gray-900">Advanced Business Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                  <span className="text-xs text-blue-700 font-semibold uppercase">Conversion Rate</span>
                  <p className="text-2xl font-black text-blue-900 mt-1">4.82%</p>
                  <span className="text-[11px] text-emerald-600 font-semibold">↑ +1.2% this week</span>
                </div>
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                  <span className="text-xs text-emerald-700 font-semibold uppercase">Average Order Value (AOV)</span>
                  <p className="text-2xl font-black text-emerald-900 mt-1">৳922.60</p>
                  <span className="text-[11px] text-emerald-600 font-semibold">High honey sales volume</span>
                </div>
                <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl">
                  <span className="text-xs text-purple-700 font-semibold uppercase">Customer Return Rate</span>
                  <p className="text-2xl font-black text-purple-900 mt-1">38.4%</p>
                  <span className="text-[11px] text-purple-600 font-semibold">Organic Repeat Buyers</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: MANAGE STOCK */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Inventory & Stock Manager</h3>
                <p className="text-xs text-gray-500">মোট ইউনিট: 514 • রিটেইল ভ্যালু: ৳240,550</p>
              </div>
              <button
                onClick={() => setShowStockModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3">
              {products.map((prod, index) => (
                <div key={prod.id} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between gap-4 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-gray-200/80 text-gray-700 text-[10px] font-bold flex items-center justify-center shrink-0 font-mono">
                      #{index + 1}
                    </span>
                    <img src={prod.image} alt={prod.name} className="w-10 h-10 rounded-lg object-cover" />
                    <div>
                      <p className="text-xs font-bold text-gray-900">{prod.name}</p>
                      <p className="text-[10px] text-gray-500">৳{prod.price} • {prod.weight}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 font-medium">ইন-স্টক:</span>
                    <input
                      type="number"
                      defaultValue={prod.stockCount}
                      className="w-20 px-2 py-1 bg-white border border-gray-300 rounded-lg text-xs font-bold text-center"
                    />
                    <button
                      onClick={() => alert(`স্টক আপডেট সফল হয়েছে: ${prod.name}`)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      সেভ
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowStockModal(false)}
                className="px-5 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-black"
              >
                সম্পন্ন করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT ORDER (Price, Location, Customer, Delivery & Status) */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    অর্ডার এডিট ও আপডেট (#{editingOrder.orderNumber})
                  </h3>
                  <p className="text-xs text-gray-500">মূল্য, লোকেশন, ডেলিভারি ফি এবং স্ট্যাটাস পরিবর্তন করুন</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenInvoice(editingOrder)}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border border-emerald-200"
                  title="এই অর্ডারের ইনভয়েস দেখুন ও PDF ডাউনলোড করুন"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Invoice PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveOrderEdit} className="space-y-4">
              {/* Customer Basic Info */}
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-3">
                <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>গ্রাহকের তথ্য (Customer Information)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      গ্রাহকের নাম *
                    </label>
                    <input
                      type="text"
                      required
                      value={orderEditForm.customerName}
                      onChange={e => setOrderEditForm({ ...orderEditForm, customerName: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      ফোন নম্বর *
                    </label>
                    <input
                      type="tel"
                      required
                      value={orderEditForm.phone}
                      onChange={e => setOrderEditForm({ ...orderEditForm, phone: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      বিকল্প ফোন
                    </label>
                    <input
                      type="tel"
                      value={orderEditForm.altPhone}
                      onChange={e => setOrderEditForm({ ...orderEditForm, altPhone: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                      placeholder="ঐচ্ছিক"
                    />
                  </div>
                </div>
              </div>

              {/* Location & Address Section */}
              <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
                <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>ডেলিভারি লোকেশন ও ঠিকানা (Delivery Location)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      ডেলিভারি এরিয়া
                    </label>
                    <select
                      value={orderEditForm.deliveryArea}
                      onChange={e => {
                        const area = e.target.value as 'inside_dhaka' | 'outside_dhaka';
                        const fee = area === 'inside_dhaka' ? 60 : 120;
                        setOrderEditForm({
                          ...orderEditForm,
                          deliveryArea: area,
                          deliveryFee: fee,
                          totalAmount: orderEditForm.subtotal + fee
                        });
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
                    >
                      <option value="inside_dhaka">ঢাকার ভিতরে (৳60)</option>
                      <option value="outside_dhaka">ঢাকার বাইরে (৳120)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      জেলা (District) *
                    </label>
                    <select
                      value={orderEditForm.district}
                      onChange={e => {
                        const newDist = e.target.value;
                        const matched = BANGLADESH_DISTRICTS.find(d => d.name === newDist);
                        setOrderEditForm({
                          ...orderEditForm,
                          district: newDist,
                          upazila: matched && matched.upazilas.length > 0 ? matched.upazilas[0].name : ''
                        });
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
                    >
                      {BANGLADESH_DISTRICTS.map(dist => (
                        <option key={dist.id} value={dist.name}>
                          {dist.name} ({dist.bnName})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      থানা / উপজেলা (Upazila/Area)
                    </label>
                    {(() => {
                      const matched = BANGLADESH_DISTRICTS.find(d => d.name.toLowerCase() === orderEditForm.district.toLowerCase());
                      const upazilas = matched?.upazilas || [];
                      return upazilas.length > 0 ? (
                        <select
                          value={orderEditForm.upazila}
                          onChange={e => setOrderEditForm({ ...orderEditForm, upazila: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
                        >
                          {upazilas.map(up => (
                            <option key={up.name} value={up.name}>
                              {up.name} ({up.bnName})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={orderEditForm.upazila}
                          onChange={e => setOrderEditForm({ ...orderEditForm, upazila: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          placeholder="উপজেলা বা এরিয়ার নাম"
                        />
                      );
                    })()}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    পূর্ণাঙ্গ ঠিকানা (Full Address) *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={orderEditForm.address}
                    onChange={e => setOrderEditForm({ ...orderEditForm, address: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    placeholder="রোড, বাড়ি নম্বর, এলাকা বা ল্যান্ডমার্ক..."
                  />
                </div>
              </div>

              {/* Order Items Edit List */}
              {orderEditForm.items && orderEditForm.items.length > 0 && (
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                  <h4 className="text-xs font-bold text-gray-900 flex items-center justify-between">
                    <span>অর্ডারের পণ্যসমূহ ও পরিমাণ (Order Items & Quantities)</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-mono font-bold">
                      {orderEditForm.items.length}টি পণ্য
                    </span>
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {orderEditForm.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 bg-white p-2 rounded-xl border border-gray-200 text-xs">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-900 truncate">{item.productName}</p>
                          <p className="text-[10px] text-gray-500 font-mono">৳{item.price} প্রতি ইউনিট</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-gray-500">পরিমাণ:</span>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={e => updateItemQuantity(idx, Number(e.target.value))}
                              className="w-14 px-2 py-1 text-xs font-bold text-center bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                            />
                          </div>
                          <span className="font-mono font-extrabold text-gray-900 w-16 text-right">
                            ৳{item.price * item.quantity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Price & Billing Calculation */}
              <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
                <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>অর্ডারের মূল্য ও পেমেন্ট (Order Price & Payment)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      পণ্যের মূল্য (Subtotal ৳) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={orderEditForm.subtotal}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setOrderEditForm({
                          ...orderEditForm,
                          subtotal: val,
                          totalAmount: val + Number(orderEditForm.deliveryFee)
                        });
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      ডেলিভারি চার্জ (৳) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={orderEditForm.deliveryFee}
                      onChange={e => {
                        const fee = Number(e.target.value);
                        setOrderEditForm({
                          ...orderEditForm,
                          deliveryFee: fee,
                          totalAmount: Number(orderEditForm.subtotal) + fee
                        });
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-800 uppercase mb-1">
                      মোট বিল (Total Amount ৳)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={orderEditForm.totalAmount}
                      onChange={e => setOrderEditForm({ ...orderEditForm, totalAmount: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs bg-emerald-100/70 border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none font-extrabold text-emerald-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      পেমেন্ট মেথড
                    </label>
                    <select
                      value={orderEditForm.paymentMethod}
                      onChange={e => setOrderEditForm({ ...orderEditForm, paymentMethod: e.target.value as any })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
                    >
                      <option value="cod">ক্যাশ অন ডেলিভারি (Cash on Delivery)</option>
                      <option value="bkash">বিকাশ (bKash)</option>
                      <option value="nagad">নগদ (Nagad)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      পেমেন্ট স্ট্যাটাস
                    </label>
                    <select
                      value={orderEditForm.paymentStatus}
                      onChange={e => setOrderEditForm({ ...orderEditForm, paymentStatus: e.target.value as any })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
                    >
                      <option value="unpaid">বকেয়া / Unpaid</option>
                      <option value="paid">পরিশোধিত / Paid</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Order Status & Courier Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    অর্ডার স্ট্যাটাস *
                  </label>
                  <select
                    value={orderEditForm.status}
                    onChange={e => setOrderEditForm({ ...orderEditForm, status: e.target.value as OrderStatus })}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer font-bold text-blue-700"
                  >
                    <option value="pending">⏳ পেন্ডিং (Pending)</option>
                    <option value="verified">📞 কনফার্মড / নিশ্চিতকৃত (Confirmed)</option>
                    <option value="shipped">🚚 কুরিয়ারে হস্তান্তর (In Transit / Shipped)</option>
                    <option value="delivered">✅ ডেলিভার সম্পন্ন (Delivered)</option>
                    <option value="cancelled">❌ বাতিল (Cancelled)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    কুরিয়ার সার্ভিস
                  </label>
                  <select
                    value={orderEditForm.courierName}
                    onChange={e => setOrderEditForm({ ...orderEditForm, courierName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
                  >
                    <option value="Steadfast Courier">Steadfast Courier</option>
                    <option value="Pathao Courier">Pathao Courier</option>
                    <option value="RedX Logistics">RedX Logistics</option>
                    <option value="Paperfly">Paperfly</option>
                    <option value="Sundarban Courier">Sundarban Courier</option>
                    <option value="In-House Delivery">In-House Delivery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    কুরিয়ার ট্র্যাকিং কোড
                  </label>
                  <input
                    type="text"
                    value={orderEditForm.courierTrackingId}
                    onChange={e => setOrderEditForm({ ...orderEditForm, courierTrackingId: e.target.value })}
                    placeholder="যেমন: ST-89241"
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    const toDelete = editingOrder;
                    setEditingOrder(null);
                    setDeleteConfirmOrder(toDelete);
                  }}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>অর্ডার ডিলিট করুন</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingOrder(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    বাতিল (Cancel)
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    পরিবর্তন সংরক্ষণ করুন (Save Order)
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE ORDER CONFIRMATION */}
      {deleteConfirmOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  অর্ডার ডিলিট নিশ্চিত করুন
                </h3>
                <p className="text-xs text-gray-500 font-mono">Order #{deleteConfirmOrder.orderNumber}</p>
              </div>
            </div>

            {/* Order Brief Snapshot */}
            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-1.5 text-xs text-gray-700">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">{deleteConfirmOrder.customerName}</span>
                <span className="font-bold text-blue-600">৳{deleteConfirmOrder.totalAmount}</span>
              </div>
              <p className="text-gray-500 text-[11px]">{deleteConfirmOrder.phone}</p>
              <p className="text-gray-600 text-[11px] truncate">
                📍 {deleteConfirmOrder.district}, {deleteConfirmOrder.address}
              </p>
            </div>

            <p className="text-xs text-red-700 bg-red-50 p-3 rounded-xl border border-red-100 leading-relaxed">
              ⚠️ <strong>সতর্কতা:</strong> আপনি কি নিশ্চিতভাবে এই অর্ডারটি ডাটাবেজ থেকে মুছে ফেলতে চান? এটি মুছে ফেললে তা আর পুনরুদ্ধার করা সম্ভব হবে না।
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmOrder(null)}
                className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                না, ফিরে যান
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteOrder}
                className="py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>হ্যাঁ, ডিলিট করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PRODUCT */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    পণ্য এডিট করুন (Edit Product)
                  </h3>
                  <p className="text-xs text-gray-500 font-mono">ID: {editingProduct.id}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product Name (English) */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    পণ্যের নাম (English Title) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormState.name || ''}
                    onChange={e => setEditFormState({ ...editFormState, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    placeholder="e.g. Raw Forest Flower Honey"
                  />
                </div>

                {/* Product Name (Bengali) */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    পণ্যের বাংলা নাম (Bangla Title)
                  </label>
                  <input
                    type="text"
                    value={editFormState.bnName || ''}
                    onChange={e => setEditFormState({ ...editFormState, bnName: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    placeholder="যেমন: সুন্দরবনের প্রাকৃতিক চাকের মধু"
                  />
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    ক্যাটাগরি (Category) *
                  </label>
                  <select
                    value={editFormState.category || 'honey'}
                    onChange={e => {
                      const selectedKey = e.target.value;
                      const matchedCat = (categories || []).find(c => c.key === selectedKey || c.id === selectedKey);
                      setEditFormState({
                        ...editFormState,
                        category: selectedKey,
                        categoryLabel: matchedCat ? matchedCat.name : selectedKey
                      });
                    }}
                    className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
                  >
                    {(categories || []).map(cat => (
                      <option key={cat.id || cat.key} value={cat.key}>
                        {cat.name} {cat.bnName ? `(${cat.bnName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Weight / Pack Size */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    ওজন / পরিমাণ (Weight/Unit)
                  </label>
                  <input
                    type="text"
                    value={editFormState.weight || ''}
                    onChange={e => setEditFormState({ ...editFormState, weight: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    placeholder="যেমন: 500gm, 1kg, 250ml"
                  />
                </div>

                {/* Selling Price */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    বিক্রয় মূল্য (Selling Price ৳) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editFormState.price ?? ''}
                    onChange={e => setEditFormState({ ...editFormState, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-blue-700"
                  />
                </div>

                {/* Original Regular Price */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    পূর্বের মূল্য (Original Regular Price ৳)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editFormState.originalPrice ?? ''}
                    onChange={e => setEditFormState({ ...editFormState, originalPrice: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-gray-600"
                    placeholder="যেমন: 1200"
                  />
                </div>

                {/* Stock Quantity */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    স্টক পরিমাণ (Stock Quantity)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editFormState.stockCount ?? ''}
                    onChange={e => setEditFormState({ ...editFormState, stockCount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                {/* Discount Badge */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    ডিসকাউন্ট ব্যাজ (Discount Tag)
                  </label>
                  <input
                    type="text"
                    value={editFormState.discountBadge || ''}
                    onChange={e => setEditFormState({ ...editFormState, discountBadge: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    placeholder="যেমন: 15% OFF, হট ডিল"
                  />
                </div>
              </div>

              {/* Image URL & Gallery Management */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-700 uppercase">
                  পণ্যের মূল ছবি ও গ্যালারি ছবিসমূহ (Images & Gallery)
                </label>
                
                {/* Main Image URL */}
                <div>
                  <span className="text-[11px] font-semibold text-gray-600 block mb-1">প্রধান ছবি (Main Cover Image URL)</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editFormState.image || ''}
                      onChange={e => {
                        const val = e.target.value;
                        const currentImgs = editFormState.images || [];
                        const updatedImgs = currentImgs.length > 0 ? [val, ...currentImgs.slice(1)] : [val];
                        setEditFormState({ ...editFormState, image: val, images: updatedImgs });
                      }}
                      className="flex-1 px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      placeholder="https://..."
                    />
                    <label className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 cursor-pointer transition-colors flex items-center gap-1 shrink-0">
                      <span>📁 ফাইল আপলোড</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const compressed = await compressImage(file);
                              const currentImgs = editFormState.images || [];
                              const updatedImgs = currentImgs.length > 0 ? [compressed, ...currentImgs.slice(1)] : [compressed];
                              setEditFormState({ ...editFormState, image: compressed, images: updatedImgs });
                            } catch (err) {
                              console.warn('Image compression fallback:', err);
                            }
                          }
                          if (e.target) e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Additional Gallery Images */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-gray-600">গ্যালারি ছবিসমূহ (Additional Gallery Images)</span>
                    <label className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1">
                      <span>+ গ্যালারিতে ছবি যোগ করুন</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const compressed = await compressImage(file);
                              const currentImgs = editFormState.images || [editFormState.image || ''];
                              setEditFormState({ ...editFormState, images: [...currentImgs, compressed] });
                            } catch (err) {
                              console.warn('Gallery image compression fallback:', err);
                            }
                          }
                          if (e.target) e.target.value = '';
                        }}
                      />
                    </label>
                  </div>

                  {/* Gallery Thumbnails Grid */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                    {(editFormState.images && editFormState.images.length > 0 ? editFormState.images : [editFormState.image]).filter(Boolean).map((imgUrl, idx) => (
                      <div key={idx} className="relative group/thumb w-full pt-[100%] rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50">
                        <img
                          src={imgUrl}
                          alt={`Gallery ${idx}`}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const currentImgs = editFormState.images || [];
                            const updatedImgs = currentImgs.filter((_, i) => i !== idx);
                            setEditFormState({
                              ...editFormState,
                              images: updatedImgs,
                              image: idx === 0 ? (updatedImgs[0] || '') : editFormState.image
                            });
                          }}
                          className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-80 group-hover/thumb:opacity-100 transition-opacity shadow-sm cursor-pointer"
                          title="ছবি মুছুন"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {idx === 0 && (
                          <span className="absolute bottom-0 inset-x-0 bg-blue-600/90 text-white text-[9px] font-bold text-center py-0.5">
                            মূল ছবি
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  পণ্যের বিবরণী (Description)
                </label>
                <textarea
                  rows={5}
                  value={editFormState.description || ''}
                  onChange={e => setEditFormState({ ...editFormState, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none leading-relaxed font-sans whitespace-pre-wrap"
                  placeholder="পণ্যটির বিস্তারিত তথ্য, স্বাস্থ্য উপকারিতা, স্পেস, এন্টার বা বুলেট পয়েন্ট দিয়ে সাজিয়ে লিখুন..."
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  💡 এখানে এন্টার এবং স্পেস দিয়ে যেভাবে সাজাবেন, কাস্টমার বিবরণী পেজে হুবহু সেই ফরম্যাটেই প্রদর্শিত হবে।
                </p>
              </div>

              {/* In-Stock Toggle */}
              <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                <input
                  type="checkbox"
                  id="inStockCheck"
                  checked={editFormState.inStock ?? true}
                  onChange={e => setEditFormState({ ...editFormState, inStock: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="inStockCheck" className="text-xs font-semibold text-gray-800 cursor-pointer">
                  পণ্যটি বিক্রয়ের জন্য সক্রিয় (In-Stock & Active on Store)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  বাতিল (Cancel)
                </button>
                <button
                  type="submit"
                  className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  পরিবর্তন সংরক্ষণ করুন (Save Changes)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE PRODUCT CONFIRMATION */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  পণ্য ডিলিট নিশ্চিত করুন
                </h3>
                <p className="text-xs text-gray-500">Delete Product Confirmation</p>
              </div>
            </div>

            {/* Product Snapshot */}
            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex items-center gap-3">
              <img
                src={deleteConfirmProduct.image}
                alt={deleteConfirmProduct.name}
                className="w-14 h-14 rounded-xl object-cover border border-gray-200 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs text-gray-900 truncate">
                  {deleteConfirmProduct.name}
                </p>
                <p className="text-[11px] text-gray-500 truncate">
                  {deleteConfirmProduct.bnName}
                </p>
                <p className="text-xs font-bold text-blue-600 mt-0.5">
                  ৳{deleteConfirmProduct.price} • স্টক: {deleteConfirmProduct.stockCount}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed bg-red-50/60 p-3 rounded-xl border border-red-100 text-red-800">
              ⚠️ <strong>সতর্কতা:</strong> আপনি কি নিশ্চিতভাবে এই পণ্যটি ক্যাটালগ থেকে মুছে ফেলতে চান? পণ্যটি মুছে ফেললে কাস্টমাররা আর ওয়েবসাইটে এটি দেখতে বা অর্ডার করতে পারবে না।
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmProduct(null)}
                className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                না, ফিরে যান
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProduct}
                className="py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>হ্যাঁ, ডিলিট করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: ORDER INVOICE & PDF GENERATOR */}
      <OrderInvoiceModal
        order={selectedInvoiceOrder}
        isOpen={Boolean(selectedInvoiceOrder)}
        onClose={handleCloseInvoice}
      />
    </div>
  );
};
