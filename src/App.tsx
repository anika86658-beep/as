import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ShoppingBag, ChevronRight, Sparkles, Truck, ShieldCheck, Phone, Check, Bell, Volume2, X } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer, CartItem } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { ErrorScreen, ErrorDetails } from './components/ErrorScreen';
import { Footer } from './components/Footer';
import { FloatingCartWidget } from './components/FloatingCartWidget';
import { Product, Order, WorkTask, CategoryItem } from './types';
import { api } from './services/api';
import { soundNotification } from './services/soundNotification';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// Lazy load admin and modal components for optimal bundle splitting
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminLogin = lazy(() => import('./components/AdminLogin').then(m => ({ default: m.AdminLogin })));
const OrderTrackerModal = lazy(() => import('./components/OrderTrackerModal').then(m => ({ default: m.OrderTrackerModal })));

export default function App() {
  const [activeView, setActiveView] = useState<'shop' | 'dashboard' | 'cpanel' | 'error'>('shop');
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return !!auth.currentUser || localStorage.getItem('arishten_admin_auth') === 'true';
  });

  const [products, setProducts] = useState<Product[]>(() => api.getInitialProductsSync());
  const [orders, setOrders] = useState<Order[]>(() => api.getInitialOrdersSync());
  const [tasks, setTasks] = useState<WorkTask[]>(() => api.getInitialTasksSync());
  const [categories, setCategories] = useState<CategoryItem[]>(() => api.getInitialCategoriesSync());

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [liveOrderNotification, setLiveOrderNotification] = useState<Order | null>(null);

  // Cart State (Starts empty; only items explicitly added by the customer will appear)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('arishten_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      // ignore
    }
    return [];
  });

  // Keep localStorage in sync with user's cart
  useEffect(() => {
    try {
      localStorage.setItem('arishten_cart', JSON.stringify(cart));
    } catch (e) {
      // ignore
    }
  }, [cart]);

  // Modal States
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [selectedTrackOrderId, setSelectedTrackOrderId] = useState('');
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);
  const [orderSuccessBanner, setOrderSuccessBanner] = useState<Order | null>(null);

  // Synchronize Firebase Auth State directly
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAdminAuthenticated(true);
        localStorage.setItem('arishten_admin_auth', 'true');
      } else {
        const hasLocalAdminAuth = localStorage.getItem('arishten_admin_auth') === 'true';
        if (hasLocalAdminAuth) {
          setIsAdminAuthenticated(true);
        } else {
          setIsAdminAuthenticated(false);
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Check URL routing and handle browser popstate / hashchange / mobile back navigation
  useEffect(() => {
    const handleLocation = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      const params = new URLSearchParams(window.location.search);

      // 1. Secret Admin Portal: ONLY accessible via ?portal=arishadmin or hash #portal=arishadmin
      const hasSecretAdmin = search.includes('portal=arishadmin') || hash.includes('portal=arishadmin');
      if (hasSecretAdmin) {
        setActiveView('dashboard');
        setErrorDetails(null);
        setIsCartOpen(false);
        setIsCheckoutOpen(false);
        setSelectedProductDetails(null);
        setIsTrackOrderOpen(false);
        return;
      }

      // 2. Direct CPanel parameter
      if (search.includes('view=cpanel') || hash.includes('cpanel')) {
        setActiveView('cpanel');
        setErrorDetails(null);
        setIsCartOpen(false);
        setIsCheckoutOpen(false);
        setSelectedProductDetails(null);
        setIsTrackOrderOpen(false);
        return;
      }

      // 3. If attempting to access /admin, /dashboard, /login, /cpanel, /auth without the secret portal parameter -> Show 404
      if (
        (path.includes('/admin') ||
        path.includes('/login') ||
        path.includes('/dashboard') ||
        path.includes('/auth') ||
        path.includes('/cpanel') ||
        path.includes('/wp-admin')) &&
        !hasSecretAdmin
      ) {
        setErrorDetails({
          code: 404,
          title: 'Page Not Found / Resource Unavailable',
          bnTitle: 'পেইজটি পাওয়া যায়নি',
          description: 'The requested admin endpoint or URL was not found on this server. Please verify the URL or return to the main shop directory.',
          technicalDetails: `Error 404 (Path_Not_Found): No public route mapped for [${window.location.pathname}].`,
          urlPath: window.location.pathname
        });
        setActiveView('error');
        return;
      }

      // We are in the Customer Shop View
      setActiveView('shop');
      setErrorDetails(null);

      // 4. Track Order modal: /track, /track-order, ?track=..., ?order=..., #track
      const isTrackPath = path === '/track' || path === '/track-order' || params.has('track') || params.has('order') || hash === '#track';
      if (isTrackPath) {
        const orderIdParam = params.get('track') || params.get('order') || '';
        if (orderIdParam) {
          setSelectedTrackOrderId(orderIdParam);
        }
        setIsTrackOrderOpen(true);
        setIsCartOpen(false);
        setIsCheckoutOpen(false);
        setSelectedProductDetails(null);
        return;
      } else {
        setIsTrackOrderOpen(false);
      }

      // 5. Checkout modal: #checkout, ?checkout=true, /checkout
      const isCheckoutPath = hash === '#checkout' || params.get('checkout') === 'true' || path === '/checkout';
      if (isCheckoutPath) {
        setIsCheckoutOpen(true);
        setIsCartOpen(false);
        setSelectedProductDetails(null);
        setIsTrackOrderOpen(false);
        return;
      } else {
        setIsCheckoutOpen(false);
      }

      // 6. Cart Drawer: #cart, ?cart=true, /cart
      const isCartPath = hash === '#cart' || params.get('cart') === 'true' || path === '/cart';
      if (isCartPath) {
        setIsCartOpen(true);
        setIsCheckoutOpen(false);
        setSelectedProductDetails(null);
        setIsTrackOrderOpen(false);
        return;
      } else {
        setIsCartOpen(false);
      }

      // 7. Product Detail Routes: /products/:idOrSlug, /product/:idOrSlug, /item/:idOrSlug, or ?product=... or ?p=... or #product-...
      const isProductPath = path.startsWith('/products/') || path.startsWith('/product/') || path.startsWith('/item/');
      const productQueryParam = params.get('product') || params.get('p') || (hash.startsWith('#product-') ? hash.replace('#product-', '') : null);

      if (isProductPath || productQueryParam) {
        let identifier = productQueryParam || '';
        if (isProductPath) {
          const parts = window.location.pathname.split('/').filter(Boolean);
          if (parts.length >= 2) {
            identifier = parts[1];
          }
        }

        if (identifier) {
          const cleanId = decodeURIComponent(identifier).trim().toLowerCase();
          const matchedProd = (products || []).find(p => {
            const idMatch = p.id?.toLowerCase() === cleanId;
            const nameSlug = p.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            const bnSlug = p.bnName?.toLowerCase().replace(/\s+/g, '-');
            const simpleNameMatch = p.name?.toLowerCase().trim() === cleanId;
            return idMatch || nameSlug === cleanId || bnSlug === cleanId || simpleNameMatch;
          });

          if (matchedProd) {
            setSelectedProductDetails(matchedProd);
            return;
          } else if (products.length > 0) {
            // Product not found in catalog -> Show 404
            setErrorDetails({
              code: 404,
              title: 'Product Not Found',
              bnTitle: 'পণ্যটি পাওয়া যায়নি',
              description: 'The requested product link is invalid or may have been removed from the catalog.',
              technicalDetails: `Error 404 (Product_Not_Found): No product matched identifier [${identifier}].`,
              urlPath: window.location.pathname
            });
            setActiveView('error');
            return;
          }
        }
      } else {
        setSelectedProductDetails(null);
      }

      // 8. Category Routes: /category/:cat, /categories/:cat, ?category=..., ?cat=..., #category-...
      const isCategoryPath = path.startsWith('/category/') || path.startsWith('/categories/');
      const categoryQueryParam = params.get('category') || params.get('cat') || (hash.startsWith('#category-') ? hash.replace('#category-', '') : null);

      if (isCategoryPath || categoryQueryParam) {
        let catId = categoryQueryParam || '';
        if (isCategoryPath) {
          const parts = window.location.pathname.split('/').filter(Boolean);
          if (parts.length >= 2) {
            catId = parts[1];
          }
        }
        if (catId) {
          setSelectedCategory(decodeURIComponent(catId));
          return;
        }
      }

      // 9. Root Homepage
      const isRoot = path === '/' || path === '' || path === '/index.html';
      if (isRoot) {
        setSelectedCategory('all');
        setIsCartOpen(false);
        setIsCheckoutOpen(false);
        setSelectedProductDetails(null);
        setIsTrackOrderOpen(false);
        return;
      }

      // 10. Any other unknown URL -> Show HTTP 404 Error Screen
      setErrorDetails({
        code: 404,
        title: 'Page Not Found / Resource Unavailable',
        bnTitle: 'পেইজটি পাওয়া যায়নি',
        description: 'The requested URL path was not found on this server. Please verify the URL or return to the main shop directory.',
        technicalDetails: `Error 404 (Path_Not_Found): No static route or dynamic handler registered for [${window.location.pathname}].`,
        urlPath: window.location.pathname
      });
      setActiveView('error');
    };

    handleLocation();
    window.addEventListener('popstate', handleLocation);
    window.addEventListener('hashchange', handleLocation);
    return () => {
      window.removeEventListener('popstate', handleLocation);
      window.removeEventListener('hashchange', handleLocation);
    };
  }, [products]);

  // Keyboard shortcut Ctrl + Shift + A (or Cmd + Shift + A) to open Admin login & Escape to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setActiveView('dashboard');
        setErrorDetails(null);
        return;
      }

      if (e.key === 'Escape') {
        if (isTrackOrderOpen) {
          handleCloseTrackModal();
        } else if (isCheckoutOpen) {
          handleCloseCheckout();
        } else if (isCartOpen) {
          handleCloseCart();
        } else if (selectedProductDetails) {
          handleCloseProduct();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTrackOrderOpen, isCheckoutOpen, isCartOpen, selectedProductDetails]);

  // Global mobile edge swipe-back gesture listener
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleGlobalTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleGlobalTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length > 0) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;

        // If swiping from the left edge (< 55px) to the right (> 50px)
        if (activeView === 'dashboard' || activeView === 'cpanel') return;
        if (touchStartX < 55 && diffX > 50 && Math.abs(diffY) < 70) {
          if (isTrackOrderOpen) {
            handleCloseTrackModal();
          } else if (isCheckoutOpen) {
            handleCloseCheckout();
          } else if (isCartOpen) {
            handleCloseCart();
          } else if (selectedProductDetails) {
            handleCloseProduct();
          } else if (activeView !== 'shop') {
            handleNavigateShop();
          }
        }
      }
    };

    window.addEventListener('touchstart', handleGlobalTouchStart, { passive: true });
    window.addEventListener('touchend', handleGlobalTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleGlobalTouchStart);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isTrackOrderOpen, isCheckoutOpen, isCartOpen, selectedProductDetails, activeView]);

  // Load backend data concurrently without blocking UI
  const loadData = () => {
    api.getProducts().then(fetchedProducts => {
      if (Array.isArray(fetchedProducts)) {
        setProducts(fetchedProducts);
      }
    }).catch(() => {});

    api.getCategories().then(fetchedCategories => {
      if (Array.isArray(fetchedCategories)) {
        setCategories(fetchedCategories);
      }
    }).catch(() => {});

    api.getOrders().then(fetchedOrders => {
      if (Array.isArray(fetchedOrders)) {
        const uniqueOrders = Array.from(new Map(fetchedOrders.map(o => [o.id || o.orderNumber, o])).values());
        setOrders(uniqueOrders);
      }
    }).catch(() => {});

    api.getTasks().then(fetchedTasks => {
      if (Array.isArray(fetchedTasks)) {
        setTasks(fetchedTasks);
      }
    }).catch(() => {});
  };

  useEffect(() => {
    loadData();

    // 1. Subscribe to real-time Firestore updates
    const unsubOrders = api.subscribeRealtimeOrders((updatedOrders) => {
      setOrders(updatedOrders);
    });

    const unsubProducts = api.subscribeRealtimeProducts((updatedProducts) => {
      setProducts(updatedProducts);
    });

    const unsubCategories = api.subscribeRealtimeCategories((updatedCategories) => {
      setCategories(updatedCategories);
    });

    // 2. Listen for in-browser real-time events
    const handleCategorySync = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setCategories(e.detail);
      }
    };

    const handleProductSync = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setProducts(e.detail);
      }
    };

    const handleOrderSync = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        const uniqueOrders = Array.from(new Map(e.detail.map((o: Order) => [o.id || o.orderNumber, o])).values()) as Order[];
        setOrders(uniqueOrders);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'arishten_categories' || e.key === 'arishten_products' || e.key === 'arishten_orders') {
        loadData();
      }
    };

    window.addEventListener('arishten_categories_updated', handleCategorySync as EventListener);
    window.addEventListener('arishten_products_updated', handleProductSync as EventListener);
    window.addEventListener('arishten_orders_updated', handleOrderSync as EventListener);
    window.addEventListener('storage', handleStorage);

    // 3. Real-time Server-Sent Events (SSE)
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');
      eventSource.addEventListener('new_order', (e) => {
        try {
          const incomingOrder: Order = JSON.parse(e.data);
          soundNotification.notifyNewOrder(incomingOrder);
          setLiveOrderNotification(incomingOrder);
          setOrders(prev => {
            const combined = [incomingOrder, ...prev];
            return Array.from(new Map(combined.map(o => [o.id || o.orderNumber, o])).values());
          });
          loadData();

          setTimeout(() => {
            setLiveOrderNotification(prev => (prev?.id === incomingOrder.id ? null : prev));
          }, 8000);
        } catch (err) {
          console.error('Error handling SSE new_order:', err);
        }
      });
      eventSource.addEventListener('order_deleted', (e) => {
        try {
          const deletedInfo = JSON.parse(e.data);
          setOrders(prev => prev.filter(o => o.id !== deletedInfo.id && o.orderNumber !== deletedInfo.orderNumber));
        } catch (e) {}
      });
    } catch (err) {
      // SSE fallback
    }

    // 4. Periodic Background Synchronization Heartbeat (every 5 seconds) + Tab Focus Revalidation
    const intervalId = setInterval(() => {
      loadData();
    }, 5000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (typeof unsubOrders === 'function') unsubOrders();
      if (typeof unsubProducts === 'function') unsubProducts();
      if (typeof unsubCategories === 'function') unsubCategories();
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('arishten_categories_updated', handleCategorySync as EventListener);
      window.removeEventListener('arishten_products_updated', handleProductSync as EventListener);
      window.removeEventListener('arishten_orders_updated', handleOrderSync as EventListener);
      window.removeEventListener('storage', handleStorage);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  // Navigation helper methods with History API
  const handleNavigateShop = () => {
    setActiveView('shop');
    setErrorDetails(null);
    setIsCartOpen(false);
    setIsCheckoutOpen(false);
    setIsTrackOrderOpen(false);
    setSelectedProductDetails(null);
    setSelectedCategory('all');
    try {
      window.history.pushState({ view: 'shop' }, '', '/');
    } catch (e) {}
  };

  const handleSelectCategory = (catKey: string) => {
    setSelectedCategory(catKey);
    try {
      const url = catKey === 'all' ? '/' : `?category=${encodeURIComponent(catKey)}`;
      window.history.pushState({ view: 'shop', category: catKey }, '', url);
    } catch (e) {}
  };

  const handleOpenProduct = (product: Product) => {
    setSelectedProductDetails(product);
    try {
      window.history.pushState(
        { modal: 'product', productId: product.id },
        '',
        `?product=${encodeURIComponent(product.id)}`
      );
    } catch (e) {}
  };

  const handleCloseProduct = () => {
    setSelectedProductDetails(null);
    try {
      const catParam = selectedCategory !== 'all' ? `?category=${encodeURIComponent(selectedCategory)}` : '/';
      window.history.replaceState({ view: 'shop', category: selectedCategory }, '', catParam);
    } catch (e) {}
  };

  const handleOpenCart = () => {
    setIsCartOpen(true);
    try {
      window.history.pushState({ modal: 'cart' }, '', '#cart');
    } catch (e) {}
  };

  const handleCloseCart = () => {
    setIsCartOpen(false);
    try {
      const base = selectedCategory !== 'all' ? `?category=${encodeURIComponent(selectedCategory)}` : '/';
      window.history.replaceState({ view: 'shop' }, '', base);
    } catch (e) {}
  };

  const handleOpenCheckout = () => {
    setIsCheckoutOpen(true);
    setIsCartOpen(false);
    try {
      window.history.pushState({ modal: 'checkout' }, '', '#checkout');
    } catch (e) {}
  };

  const handleCloseCheckout = () => {
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
    setSelectedProductDetails(null);
    setIsTrackOrderOpen(false);
    setActiveView('shop');
    setErrorDetails(null);
    try {
      window.history.replaceState({ view: 'shop' }, '', '/');
    } catch (e) {}
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {}
  };

  const handleOpenTrackModal = (orderId?: string) => {
    if (orderId) {
      setSelectedTrackOrderId(orderId);
    }
    setIsTrackOrderOpen(true);
    try {
      const url = orderId ? `?track=${encodeURIComponent(orderId)}` : '#track';
      window.history.pushState({ modal: 'track', orderId: orderId || '' }, '', url);
    } catch (e) {}
  };

  const handleCloseTrackModal = () => {
    setIsTrackOrderOpen(false);
    setSelectedTrackOrderId('');
    try {
      const base = selectedCategory !== 'all' ? `?category=${encodeURIComponent(selectedCategory)}` : '/';
      window.history.replaceState({ view: 'shop' }, '', base);
    } catch (e) {}
  };

  const handleOpenDashboard = (section = 'dashboard') => {
    setActiveView('dashboard');
    setErrorDetails(null);
    try {
      window.history.pushState({ view: 'dashboard', section }, '', `?portal=arishadmin#${section}`);
    } catch (e) {}
  };

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const index = prev.findIndex(item => item.product.id === product.id);
      if (index !== -1) {
        const updated = [...prev];
        updated[index].quantity += quantity;
        return updated;
      }
      return [...prev, { product, quantity }];
    });
  };

  const handleQuickBuy = (product: Product, quantity = 1) => {
    handleAddToCart(product, quantity);
    setSelectedProductDetails(null);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
    try {
      window.history.pushState({ modal: 'checkout' }, '', '#checkout');
    } catch (e) {}
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleOrderSuccess = (newOrder: Order) => {
    setCart([]);
    setOrders(prev => {
      const combined = [newOrder, ...prev];
      return Array.from(new Map(combined.map(o => [o.id || o.orderNumber, o])).values());
    });
    setOrderSuccessBanner(newOrder);
    loadData();
  };

  const handleAddNewProduct = (newProd: Partial<Product>) => {
    if (newProd && newProd.id) {
      setProducts(prev => [newProd as Product, ...prev.filter(p => p.id !== newProd.id)]);
    }
    loadData();
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    localStorage.setItem('arishten_admin_auth', 'true');
    handleOpenDashboard('dashboard');
  };

  const handleAdminLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    setIsAdminAuthenticated(false);
    localStorage.removeItem('arishten_admin_auth');
    try {
      window.history.replaceState({ view: 'shop' }, '', '/');
    } catch (e) {
      // ignore
    }
    setActiveView('shop');
  };

  // Filter products by category & search
  const filteredProducts = (products || []).filter(prod => {
    const matchedCat = categories.find(
      c => c.key === selectedCategory || c.id === selectedCategory || c.name.toLowerCase() === selectedCategory.toLowerCase() || c.bnName === selectedCategory
    );
    const matchesCategory =
      selectedCategory === 'all' ||
      prod?.category === selectedCategory ||
      prod?.category?.toLowerCase() === selectedCategory.toLowerCase() ||
      prod?.categoryLabel?.toLowerCase() === selectedCategory.toLowerCase() ||
      (matchedCat && (
        prod?.category === matchedCat.key ||
        prod?.category === matchedCat.id ||
        prod?.category?.toLowerCase() === matchedCat.key?.toLowerCase() ||
        prod?.category?.toLowerCase() === matchedCat.id?.toLowerCase() ||
        prod?.categoryLabel?.toLowerCase() === matchedCat.name?.toLowerCase() ||
        prod?.categoryLabel?.toLowerCase() === matchedCat.bnName?.toLowerCase()
      ));
    const matchesSearch =
      !searchQuery?.trim() ||
      prod?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod?.bnName?.includes(searchQuery) ||
      prod?.categoryLabel?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // If in error view
  if (activeView === 'error') {
    return (
      <ErrorScreen
        error={errorDetails || undefined}
        onGoHome={() => {
          try {
            window.history.pushState({}, '', '/');
          } catch (e) {
            // ignore
          }
          setActiveView('shop');
          setErrorDetails(null);
        }}
      />
    );
  }

  // If in admin view:
  if (activeView === 'dashboard' || activeView === 'cpanel') {
    if (!isAdminAuthenticated) {
      return (
        <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-sm">লগইন পেজ লোড হচ্ছে...</div>}>
          <AdminLogin
            onLoginSuccess={handleAdminLoginSuccess}
            onBackToShop={handleNavigateShop}
          />
        </Suspense>
      );
    }

    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-sm">ড্যাশবোর্ড লোড হচ্ছে...</div>}>
          <AdminDashboard
            orders={orders}
            tasks={tasks}
            products={products}
            categories={categories}
            onCategoryUpdate={updated => setCategories(updated)}
            onRefreshData={loadData}
            onOpenTrackOrder={id => handleOpenTrackModal(id)}
            onAddNewProduct={handleAddNewProduct}
            onVisitShop={handleNavigateShop}
            onLogout={handleAdminLogout}
          />

          <OrderTrackerModal
            isOpen={isTrackOrderOpen}
            onClose={handleCloseTrackModal}
            initialOrderId={selectedTrackOrderId}
          />
        </Suspense>
      </div>
    );
  }

  // Otherwise, render Customer Store
  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 flex flex-col font-sans">
      {/* Navbar */}
      <Navbar
        activeView={activeView}
        setActiveView={handleNavigateShop}
        cartCount={cartItemCount}
        cartTotal={cartTotal}
        openCart={handleOpenCart}
        openTrackOrder={() => handleOpenTrackModal()}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        products={products}
        onSelectProduct={prod => handleOpenProduct(prod)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Top Order Success Banner Notification */}
        {orderSuccessBanner && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <div className="bg-emerald-800 text-white rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">
                    ধন্যবাদ {orderSuccessBanner.customerName}! আপনার অর্ডার সফলভাবে গৃহীত হয়েছে (#{orderSuccessBanner.orderNumber})
                  </h4>
                  <p className="text-xs text-emerald-200">
                    সার্ভারে ডাটা সংরক্ষিত হয়েছে। ডেলিভারির অগ্রগতি ট্র্যাক করতে পারেন।
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenTrackModal(orderSuccessBanner.orderNumber)}
                  className="px-4 py-2 bg-white text-emerald-900 text-xs font-bold rounded-xl hover:bg-emerald-50 transition-colors cursor-pointer"
                >
                  লাইভ প্রগ্রেস ট্র্যাক করুন
                </button>
                <button
                  onClick={() => setOrderSuccessBanner(null)}
                  className="p-1.5 text-emerald-200 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hero Banner */}
        <HeroBanner />

        {/* Category Filter Pills */}
        <CategoryFilter
          categories={categories}
          products={products}
          selectedCategory={selectedCategory}
          onSelectCategory={cat => handleSelectCategory(cat)}
        />

        {/* Products Grid Section */}
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-1 sm:py-2 min-h-[6vh] box-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                All Products
              </h2>
            </div>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Showing {filteredProducts.length} items
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {filteredProducts.map(product => {
              const inCart = cart.find(c => c.product.id === product.id)?.quantity || 0;
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={p => handleAddToCart(p, 1)}
                  onQuickBuy={p => handleQuickBuy(p, 1)}
                  onViewDetails={p => handleOpenProduct(p)}
                  quantityInCart={inCart}
                />
              );
            })}
          </div>
        </div>
      </main>

      {/* Live Real-time Order Popup Banner */}
      {liveOrderNotification && (
        <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 max-w-md w-full animate-in slide-in-from-top-4 duration-300">
          <div className="bg-white border-2 border-blue-500 rounded-2xl p-4 shadow-2xl shadow-blue-500/20 flex items-start gap-3.5 relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm animate-bounce">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  নতুন অর্ডার গৃহীত 🔔
                </span>
                <span className="text-[11px] font-mono text-gray-500">#{liveOrderNotification.orderNumber}</span>
              </div>
              <h4 className="text-sm font-bold text-gray-900 truncate">
                {liveOrderNotification.customerName}
              </h4>
              <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-2">
                <span className="font-bold text-blue-700">৳{liveOrderNotification.totalAmount}</span>
                <span>•</span>
                <span>📞 {liveOrderNotification.phone}</span>
                <span>•</span>
                <span>📍 {liveOrderNotification.district}</span>
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  onClick={() => {
                    handleOpenTrackModal(liveOrderNotification.orderNumber);
                    setLiveOrderNotification(null);
                  }}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  ট্র্যাক করুন
                </button>
                <button
                  onClick={() => {
                    handleOpenDashboard('orders');
                    setLiveOrderNotification(null);
                  }}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  অ্যাডমিন ড্যাশবোর্ড
                </button>
              </div>
            </div>
            <button
              onClick={() => setLiveOrderNotification(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 p-1 rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ProductDetailModal
        product={selectedProductDetails}
        onClose={handleCloseProduct}
        onAddToCart={(p, qty) => handleAddToCart(p, qty)}
        onBuyNow={(p, qty) => handleQuickBuy(p, qty)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={handleCloseCart}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onProceedToCheckout={handleOpenCheckout}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={handleCloseCheckout}
        cart={cart}
        onOrderSuccess={handleOrderSuccess}
        onOpenTrackOrder={handleOpenTrackModal}
      />

      <Suspense fallback={null}>
        <OrderTrackerModal
          isOpen={isTrackOrderOpen}
          onClose={handleCloseTrackModal}
          initialOrderId={selectedTrackOrderId}
        />
      </Suspense>

      {/* Floating Cart Widget (Fixed on Right Center at all times) */}
      <FloatingCartWidget
        cartCount={cartItemCount}
        cartTotal={cartTotal}
        onClick={handleOpenCart}
      />

      {/* Footer */}
      <Footer
        onOpenTrackOrder={() => handleOpenTrackModal()}
        onOpenDashboard={() => handleOpenDashboard('dashboard')}
        onOpenCPanel={() => handleOpenDashboard('cpanel')}
      />
    </div>
  );
}
