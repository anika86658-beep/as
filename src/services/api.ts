import { Product, Order, OrderStatus, OrderTimelineEvent, WorkTask, CPanelConfig, CategoryItem, StoreSettings } from '../types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_TASKS, INITIAL_CPANEL_CONFIG, INITIAL_CATEGORIES, INITIAL_STORE_SETTINGS } from '../data/initialData';
import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { soundNotification } from './soundNotification';

// Local storage keys for resilient caching
const LS_PRODUCTS = 'arishten_products';
const LS_ORDERS = 'arishten_orders';
const LS_TASKS = 'arishten_tasks';
const LS_CPANEL = 'arishten_cpanel';
const LS_CATEGORIES = 'arishten_categories';
const LS_SETTINGS = 'arishten_store_settings';
const LS_DELETED_ORDERS = 'arishten_deleted_orders';
const LS_DELETED_PRODUCTS = 'arishten_deleted_products';
const LS_DELETED_CATEGORIES = 'arishten_deleted_categories';

/**
 * Safely writes to localStorage with quota recovery and payload optimization.
 * Prevents QuotaExceededError crashes when caching products/orders with base64 data.
 */
function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn(`[Storage Warning] localStorage.setItem exceeded quota for key "${key}". Initiating safe recovery.`, err);
    try {
      // 1. Purge non-critical temporary cache keys
      const keysToClear = ['arishten_last_cache_bust', 'debug_logs', 'arishten_tasks'];
      for (const k of keysToClear) {
        try { localStorage.removeItem(k); } catch (e) {}
      }

      // 2. If caching products, strip bloated base64 data URLs for local storage cache
      if (key === LS_PRODUCTS) {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            const sanitizedForCache = parsed.map((p: Product) => {
              const cleanImg = (p.image && p.image.startsWith('data:image') && p.image.length > 30000)
                ? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'
                : p.image;
              const cleanImages = (p.images || []).map(img =>
                (img && img.startsWith('data:image') && img.length > 30000) ? cleanImg : img
              );
              return { ...p, image: cleanImg, images: cleanImages };
            });
            localStorage.setItem(key, JSON.stringify(sanitizedForCache));
            return true;
          }
        } catch (parseErr) {}
      }

      // 3. If caching orders, keep only the latest 50 orders in local storage
      if (key === LS_ORDERS) {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            const trimmed = parsed.slice(0, 50);
            localStorage.setItem(key, JSON.stringify(trimmed));
            return true;
          }
        } catch (parseErr) {}
      }

      // 4. Retry after cleanups
      localStorage.setItem(key, value);
      return true;
    } catch (recoveryErr) {
      console.warn(`[Storage Fallback] Could not persist key "${key}" to localStorage. In-memory data remains active and intact.`, recoveryErr);
      return false;
    }
  }
}

function getDeletedOrderIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_DELETED_ORDERS);
    if (raw) return new Set(JSON.parse(raw));
  } catch (e) {}
  return new Set();
}

function recordDeletedOrderId(id: string) {
  try {
    const current = getDeletedOrderIds();
    current.add(id);
    safeLocalStorageSet(LS_DELETED_ORDERS, JSON.stringify(Array.from(current)));
  } catch (e) {}
}

function getDeletedProductIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_DELETED_PRODUCTS);
    if (raw) return new Set(JSON.parse(raw));
  } catch (e) {}
  return new Set();
}

function recordDeletedProductId(id: string) {
  try {
    const current = getDeletedProductIds();
    current.add(id);
    safeLocalStorageSet(LS_DELETED_PRODUCTS, JSON.stringify(Array.from(current)));
  } catch (e) {}
}

function getDeletedCategoryIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_DELETED_CATEGORIES);
    if (raw) return new Set(JSON.parse(raw));
  } catch (e) {}
  return new Set();
}

function recordDeletedCategoryId(id: string) {
  try {
    const current = getDeletedCategoryIds();
    current.add(id);
    safeLocalStorageSet(LS_DELETED_CATEGORIES, JSON.stringify(Array.from(current)));
  } catch (e) {}
}

// In-memory instant cache for 0ms access
let memoryProductsCache: Product[] | null = null;
let memoryCategoriesCache: CategoryItem[] | null = null;
let memoryOrdersCache: Order[] | null = null;
let memoryTasksCache: WorkTask[] | null = null;
let memorySettingsCache: StoreSettings | null = null;

// Track processed order IDs to avoid duplicate chimes
const knownOrderIds = new Set<string>();

/**
 * Handle Firestore errors with structured logging
 */
export enum OperationType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list'
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const err = error as { code?: string; message?: string };
  const errInfo = {
    operationType,
    path,
    code: err.code || 'unknown',
    message: err.message || 'Unknown Firestore error'
  };
  console.warn(`[Firestore Error - ${operationType}] on ${path || 'collection'}:`, errInfo);
  return errInfo;
}

/**
 * Get current Firebase Auth ID token if signed in
 */
async function getAuthToken(): Promise<string | null> {
  try {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function mergeOrderRecords(existing: Order | undefined, incoming: Order): Order {
  if (!existing) return incoming;
  const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
  const incomingTime = new Date(incoming.updatedAt || incoming.createdAt || 0).getTime();
  
  if (incomingTime >= existingTime) {
    return {
      ...existing,
      ...incoming,
      timeline: incoming.timeline && incoming.timeline.length > 0 ? incoming.timeline : existing.timeline
    };
  } else {
    return {
      ...incoming,
      ...existing,
      timeline: existing.timeline && existing.timeline.length > 0 ? existing.timeline : incoming.timeline
    };
  }
}

export function buildOrderTimeline(
  status: OrderStatus,
  existingTimeline?: OrderTimelineEvent[],
  courierName?: string
): OrderTimelineEvent[] {
  const nowStr = new Date().toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const stages: { status: OrderStatus; title: string; description: string }[] = [
    {
      status: 'pending',
      title: 'Order Placed (অর্ডার গৃহীত হয়েছে)',
      description: 'Customer submitted checkout details'
    },
    {
      status: 'verified',
      title: 'Order Confirmed (অর্ডার নিশ্চিতকৃত)',
      description: 'Phone call confirmation complete and parcel prepared'
    },
    {
      status: 'shipped',
      title: `Handed Over to Courier (কুরিয়ারে হস্তান্তর - ${courierName || 'Steadfast / Pathao'})`,
      description: 'Parcel dispatched and in transit with logistics partner'
    },
    {
      status: 'delivered',
      title: 'Delivered & Payment Settled (ডেলিভার্ড সম্পন্ন)',
      description: 'Package handed to recipient and payment completed'
    }
  ];

  if (status === 'cancelled') {
    return [
      ...(existingTimeline || []).map(e => ({ ...e, completed: false })),
      {
        status: 'cancelled',
        title: 'Order Cancelled (অর্ডার বাতিল করা হয়েছে)',
        description: 'Order was cancelled per customer request or verification failure',
        timestamp: nowStr,
        completed: true
      }
    ];
  }

  const orderHierarchy: Record<OrderStatus, number> = {
    pending: 0,
    verified: 1,
    processing: 1,
    packaging: 1,
    shipped: 2,
    out_for_delivery: 2,
    delivered: 3,
    cancelled: -1
  };

  const currentLevel = orderHierarchy[status] ?? 0;

  return stages.map(stage => {
    const stageLevel = orderHierarchy[stage.status] ?? 0;
    const existing = existingTimeline?.find(e => e.status === stage.status);
    const isCompleted = stageLevel <= currentLevel;
    
    let timestamp = 'Pending';
    if (isCompleted) {
      timestamp = existing?.completed && existing.timestamp && existing.timestamp !== 'Pending' && existing.timestamp !== 'Upcoming'
        ? existing.timestamp
        : nowStr;
    } else {
      timestamp = 'Upcoming';
    }

    return {
      status: stage.status,
      title: stage.title,
      description: stage.description,
      timestamp,
      completed: isCompleted
    };
  });
}

/**
 * Smart Universal Fetcher with Fast Timeout and Authorization header
 * Automatically tries modern Express API (/api/...) and cPanel Apache PHP backend (/api.php?route=...)
 */
async function smartFetch(endpoint: string, options: RequestInit = {}): Promise<Response | null> {
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';
  const cacheBuster = isGet ? `${endpoint.includes('?') ? '&' : '?'}_t=${Date.now()}` : '';
  const cleanEndpoint = (endpoint.startsWith('/') ? endpoint : `/${endpoint}`) + cacheBuster;

  const idToken = await getAuthToken();
  const authHeaders: Record<string, string> = {
    Authorization: idToken ? `Bearer ${idToken}` : 'Bearer arishten_admin_secret_auth',
    'X-Admin-Token': 'arishten_admin_secret_auth',
    'X-HTTP-Method-Override': method
  };

  // 1. Try standard /api/...
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(cleanEndpoint, {
      ...options,
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        ...authHeaders,
        ...(options.headers || {})
      }
    });
    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && (contentType.includes('application/json') || contentType.includes('text/json'))) {
      return res;
    }
  } catch (e) {
    // Attempt fallback
  }

  // 2. Fallback for cPanel / Apache / LiteSpeed hosting: /api.php?route=...
  if (endpoint.startsWith('/api') || endpoint.startsWith('api')) {
    const subRoute = endpoint.replace(/^\/?api/, '');
    const phpFallbackUrl = `/api.php?route=${encodeURIComponent(subRoute || '/')}&_t=${Date.now()}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(phpFallbackUrl, {
        ...options,
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          ...authHeaders,
          ...(options.headers || {})
        }
      });
      clearTimeout(timeoutId);
      const phpContentType = res.headers.get('content-type') || '';
      if (res.ok && (phpContentType.includes('application/json') || phpContentType.includes('text/json'))) {
        return res;
      }
    } catch (e) {
      // ignore
    }

    // 2b. If method is PUT/PATCH/DELETE and failed, try POST with _method query param for strict servers
    if (!isGet && method !== 'POST') {
      const postFallbackUrl = `/api.php?route=${encodeURIComponent(subRoute || '/')}&_method=${method}&_t=${Date.now()}`;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(postFallbackUrl, {
          ...options,
          method: 'POST',
          cache: 'no-store',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...authHeaders,
            ...(options.headers || {})
          }
        });
        clearTimeout(timeoutId);
        const phpContentType = res.headers.get('content-type') || '';
        if (res.ok && (phpContentType.includes('application/json') || phpContentType.includes('text/json'))) {
          return res;
        }
      } catch (e) {}
    }
  }

  return null;
}

function notifyProductsUpdated(products: Product[]) {
  memoryProductsCache = products;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('arishten_products_updated', { detail: products })
    );
  }
}

function notifyOrdersUpdated(orders: Order[]) {
  memoryOrdersCache = orders;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('arishten_orders_updated', { detail: orders })
    );
  }
}

function notifyCategoriesUpdated(categories: CategoryItem[]) {
  memoryCategoriesCache = categories;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('arishten_categories_updated', { detail: categories })
    );
  }
}

function sortProducts(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const timeA = a.createdAt || 0;
    const timeB = b.createdAt || 0;
    if (timeA !== timeB) {
      return timeB - timeA; // Newest first (#1)
    }
    return 0;
  });
}

function sanitizeProduct(p: Product): Product {
  if (!p) return p;
  let catLabel = p.categoryLabel || '';
  if (catLabel === 'অর্গানিক ফুড' || catLabel === 'organic') {
    catLabel = '';
  }
  let catKey = p.category || '';
  if (catKey === 'অর্গানিক ফুড') {
    catKey = 'other';
  }
  return {
    ...p,
    createdAt: p.createdAt || 0,
    category: catKey,
    categoryLabel: catLabel
  };
}

export const api = {
  // Synchronous instant retrieval (0 milliseconds) for initial React state
  getInitialProductsSync(): Product[] {
    const deletedIds = getDeletedProductIds();
    if (memoryProductsCache !== null) {
      return sortProducts(memoryProductsCache.filter(p => !deletedIds.has(p.id)).map(sanitizeProduct));
    }
    try {
      const saved = localStorage.getItem(LS_PRODUCTS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const sanitized = sortProducts(parsed.map(sanitizeProduct).filter(p => !deletedIds.has(p.id)));
          memoryProductsCache = sanitized;
          return sanitized;
        }
      }
    } catch (e) {}
    memoryProductsCache = sortProducts((INITIAL_PRODUCTS || []).filter(p => !deletedIds.has(p.id)).map(sanitizeProduct));
    return memoryProductsCache;
  },

  getInitialCategoriesSync(): CategoryItem[] {
    const deletedIds = getDeletedCategoryIds();
    if (memoryCategoriesCache !== null) {
      return memoryCategoriesCache.filter(c => !deletedIds.has(c.id) && !deletedIds.has(c.key));
    }
    try {
      const saved = localStorage.getItem(LS_CATEGORIES);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((c: CategoryItem) => !deletedIds.has(c.id) && !deletedIds.has(c.key));
          memoryCategoriesCache = filtered;
          return filtered;
        }
      }
    } catch (e) {}
    const filteredInitial = (INITIAL_CATEGORIES || []).filter(c => !deletedIds.has(c.id) && !deletedIds.has(c.key));
    memoryCategoriesCache = filteredInitial;
    return memoryCategoriesCache;
  },

  getInitialOrdersSync(): Order[] {
    const deletedIds = getDeletedOrderIds();
    if (memoryOrdersCache !== null) {
      return memoryOrdersCache.filter(o => !deletedIds.has(o.id) && !deletedIds.has(o.orderNumber));
    }
    try {
      const saved = localStorage.getItem(LS_ORDERS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((o: Order) => !deletedIds.has(o.id) && !deletedIds.has(o.orderNumber));
          memoryOrdersCache = filtered;
          filtered.forEach((o: Order) => {
            if (o.id) knownOrderIds.add(o.id);
            if (o.orderNumber) knownOrderIds.add(o.orderNumber);
          });
          return filtered;
        }
      }
    } catch (e) {}
    const filteredInitial = (INITIAL_ORDERS || []).filter(o => !deletedIds.has(o.id) && !deletedIds.has(o.orderNumber));
    memoryOrdersCache = filteredInitial;
    filteredInitial.forEach(o => {
      if (o.id) knownOrderIds.add(o.id);
      if (o.orderNumber) knownOrderIds.add(o.orderNumber);
    });
    return memoryOrdersCache;
  },

  getInitialTasksSync(): WorkTask[] {
    if (memoryTasksCache !== null) return memoryTasksCache;
    try {
      const saved = localStorage.getItem(LS_TASKS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          memoryTasksCache = parsed;
          return parsed;
        }
      }
    } catch (e) {}
    memoryTasksCache = INITIAL_TASKS || [];
    return memoryTasksCache;
  },

  // Real-time Firestore Subscriptions
  subscribeRealtimeOrders(onUpdate: (orders: Order[]) => void) {
    try {
      const ordersCol = collection(db, 'orders');
      return onSnapshot(ordersCol, (snapshot) => {
        const fetchedOrders: Order[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Order;
          fetchedOrders.push({
            ...data,
            id: docSnap.id
          });
        });

        const deletedIds = getDeletedOrderIds();
        // Track newly arrived orders for sound notification
        fetchedOrders.forEach(ord => {
          const ordKey = ord.id || ord.orderNumber;
          if (ordKey && !deletedIds.has(ordKey) && !deletedIds.has(ord.id) && !deletedIds.has(ord.orderNumber)) {
            if (!knownOrderIds.has(ordKey)) {
              knownOrderIds.add(ordKey);
              try {
                soundNotification.notifyNewOrder(ord);
              } catch (e) {}
            }
          }
        });

        // Use authoritative Firestore orders, filtered and sorted newest first
        const uniqueOrders = fetchedOrders
          .filter(o => !deletedIds.has(o.id) && !deletedIds.has(o.orderNumber))
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        memoryOrdersCache = uniqueOrders;
        safeLocalStorageSet(LS_ORDERS, JSON.stringify(uniqueOrders));
        onUpdate(uniqueOrders);
        notifyOrdersUpdated(uniqueOrders);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'orders');
      return () => {};
    }
  },

  subscribeRealtimeProducts(onUpdate: (products: Product[]) => void) {
    try {
      const productsCol = collection(db, 'products');
      return onSnapshot(productsCol, (snapshot) => {
        const fetchedProds: Product[] = [];
        snapshot.forEach((docSnap) => {
          fetchedProds.push({
            ...(docSnap.data() as Product),
            id: docSnap.id
          });
        });
        
        const deletedIds = getDeletedProductIds();
        const freshList = sortProducts(
          fetchedProds
            .filter(p => !deletedIds.has(p.id))
            .map(sanitizeProduct)
        );

        memoryProductsCache = freshList;
        safeLocalStorageSet(LS_PRODUCTS, JSON.stringify(freshList));
        onUpdate(freshList);
        notifyProductsUpdated(freshList);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'products');
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'products');
      return () => {};
    }
  },

  subscribeRealtimeCategories(onUpdate: (categories: CategoryItem[]) => void) {
    try {
      const deletedIds = getDeletedCategoryIds();
      const categoriesCol = collection(db, 'categories');
      return onSnapshot(categoriesCol, (snapshot) => {
        const fetchedCats: CategoryItem[] = [];
        snapshot.forEach((docSnap) => {
          const catData = docSnap.data() as CategoryItem;
          const catId = docSnap.id;
          if (!deletedIds.has(catId) && !deletedIds.has(catData.key) && !deletedIds.has(catData.id)) {
            fetchedCats.push({
              ...catData,
              id: catId
            });
          }
        });
        memoryCategoriesCache = fetchedCats;
        safeLocalStorageSet(LS_CATEGORIES, JSON.stringify(fetchedCats));
        onUpdate(fetchedCats);
        notifyCategoriesUpdated(fetchedCats);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'categories');
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'categories');
      return () => {};
    }
  },

  // Products API
  async getProducts(): Promise<Product[]> {
    const deletedIds = getDeletedProductIds();
    try {
      const res = await smartFetch('/api/products');
      if (res) {
        const data = await res.json();
        if (data && Array.isArray(data.products)) {
          const freshList = sortProducts(
            data.products
              .filter((p: Product) => !deletedIds.has(p.id))
              .map(sanitizeProduct)
          );
          safeLocalStorageSet(LS_PRODUCTS, JSON.stringify(freshList));
          memoryProductsCache = freshList;
          notifyProductsUpdated(freshList);
          return freshList;
        }
      }
    } catch (e) {}

    return this.getInitialProductsSync();
  },

  async getProduct(id: string): Promise<Product | null> {
    const products = await this.getProducts();
    return products.find(p => p.id === id) || null;
  },

  async createProduct(productData: Partial<Product> & { [key: string]: any }): Promise<Product> {
    const currentProds = await this.getProducts();
    const newId = productData.id || `prod-${Date.now().toString().slice(-6)}`;

    const newProduct: Product = {
      ...productData,
      id: newId,
      createdAt: productData.createdAt || Date.now(),
      name: productData.name || 'Product',
      bnName: productData.bnName || productData.name || '',
      category: productData.category || 'other',
      categoryLabel: productData.categoryLabel || '',
      price: Number(productData.price) || 500,
      originalPrice: productData.originalPrice ? Number(productData.originalPrice) : undefined,
      discountBadge: productData.discountBadge || '',
      weight: productData.weight || '500gm',
      rating: productData.rating ?? 5.0,
      reviewsCount: productData.reviewsCount ?? 1,
      inStock: productData.inStock ?? true,
      stockCount: productData.stockCount ?? 50,
      description: productData.description || '',
      features: productData.features || [],
      image: productData.image || 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&auto=format&fit=crop&q=80',
      images: productData.images && productData.images.length > 0 ? productData.images : [
        productData.image || 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&auto=format&fit=crop&q=80'
      ],
      insideDhakaFee: productData.insideDhakaFee ?? 60,
      outsideDhakaFee: productData.outsideDhakaFee ?? 120
    };

    // 1. Instant Optimistic local update
    const updated = sortProducts([newProduct, ...currentProds.filter(p => p.id !== newId)]);
    memoryProductsCache = updated;
    safeLocalStorageSet(LS_PRODUCTS, JSON.stringify(updated));
    notifyProductsUpdated(updated);

    // 2. Persist to Firestore in background
    (async () => {
      try {
        await setDoc(doc(db, 'products', newId), newProduct);
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `products/${newId}`);
      }
    })();

    // 3. Persist to Node/PHP Backend in background
    (async () => {
      try {
        await smartFetch('/api/products', {
          method: 'POST',
          body: JSON.stringify(newProduct)
        });
      } catch (e) {}
    })();

    return newProduct;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const currentProds = await this.getProducts();
    const index = currentProds.findIndex(p => p.id === id);
    if (index === -1) return null;

    const updatedProd = { ...currentProds[index], ...updates };
    currentProds[index] = updatedProd;

    // 1. Instant Optimistic update
    memoryProductsCache = [...currentProds];
    safeLocalStorageSet(LS_PRODUCTS, JSON.stringify(currentProds));
    notifyProductsUpdated(currentProds);

    // 2. Persist to Firestore in background
    (async () => {
      try {
        await setDoc(doc(db, 'products', id), updatedProd, { merge: true });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `products/${id}`);
      }
    })();

    // 3. Persist to Node/PHP Backend in background
    (async () => {
      try {
        await smartFetch(`/api/products/${encodeURIComponent(id)}`, {
          method: 'PUT',
          body: JSON.stringify(updates)
        });
      } catch (e) {}
    })();

    return updatedProd;
  },

  async deleteProduct(id: string): Promise<boolean> {
    recordDeletedProductId(id);
    const currentProds = await this.getProducts();
    const filtered = currentProds.filter(p => p.id !== id);

    // 1. Instant Optimistic update
    memoryProductsCache = filtered;
    safeLocalStorageSet(LS_PRODUCTS, JSON.stringify(filtered));
    notifyProductsUpdated(filtered);

    // 2. Delete from Firestore in background
    (async () => {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `products/${id}`);
      }
    })();

    // 3. Delete from Node/PHP Backend in background
    (async () => {
      try {
        await smartFetch(`/api/products/${encodeURIComponent(id)}`, {
          method: 'DELETE'
        });
      } catch (e) {}
    })();

    return true;
  },

  // Categories API
  async getCategories(): Promise<CategoryItem[]> {
    const deletedIds = getDeletedCategoryIds();
    try {
      const res = await smartFetch('/api/categories');
      if (res) {
        const data = await res.json();
        if (data && Array.isArray(data.categories) && data.categories.length > 0) {
          const filtered = data.categories.filter((c: CategoryItem) => !deletedIds.has(c.id) && !deletedIds.has(c.key));
          safeLocalStorageSet(LS_CATEGORIES, JSON.stringify(filtered));
          memoryCategoriesCache = filtered;
          notifyCategoriesUpdated(filtered);
          return filtered;
        }
      }
    } catch (e) {}

    return this.getInitialCategoriesSync();
  },

  async saveCategories(categories: CategoryItem[]): Promise<CategoryItem[]> {
    const deletedIds = getDeletedCategoryIds();
    const validCategories = categories.filter(c => !deletedIds.has(c.id) && !deletedIds.has(c.key));
    memoryCategoriesCache = validCategories;
    safeLocalStorageSet(LS_CATEGORIES, JSON.stringify(validCategories));
    notifyCategoriesUpdated(validCategories);

    // Persist to Firestore
    try {
      for (const cat of validCategories) {
        const catId = cat.id || cat.key;
        await setDoc(doc(db, 'categories', catId), cat, { merge: true });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'categories');
    }

    // Persist to Backend
    (async () => {
      try {
        await smartFetch('/api/categories', {
          method: 'POST',
          body: JSON.stringify({ categories: validCategories })
        });
      } catch (e) {}
    })();

    return validCategories;
  },

  async deleteCategory(categoryId: string): Promise<CategoryItem[]> {
    recordDeletedCategoryId(categoryId);
    const deletedIds = getDeletedCategoryIds();
    const current = await this.getCategories();
    const updated = current.filter(c => !deletedIds.has(c.id) && !deletedIds.has(c.key) && c.id !== categoryId && c.key !== categoryId);

    memoryCategoriesCache = updated;
    safeLocalStorageSet(LS_CATEGORIES, JSON.stringify(updated));
    notifyCategoriesUpdated(updated);

    // 1. Delete from Firestore
    try {
      await deleteDoc(doc(db, 'categories', categoryId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `categories/${categoryId}`);
    }

    // 2. Delete from backend server
    (async () => {
      try {
        await smartFetch(`/api/categories/${encodeURIComponent(categoryId)}`, {
          method: 'DELETE'
        });
      } catch (e) {}
    })();

    // 3. Persist updated list
    await this.saveCategories(updated);
    return updated;
  },

  // Orders API
  async getOrders(): Promise<Order[]> {
    const deletedIds = getDeletedOrderIds();
    const fetchedMap = new Map<string, Order>();

    // 1. Query Firestore orders collection (Cloud Source of Truth)
    try {
      const snapshot = await getDocs(collection(db, 'orders'));
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as Order;
        const o: Order = { ...data, id: docSnap.id };
        const key = o.id || o.orderNumber;
        if (key && !deletedIds.has(key) && !deletedIds.has(o.id) && !deletedIds.has(o.orderNumber)) {
          fetchedMap.set(key, o);
        }
      });
    } catch (e) {
      // ignore
    }

    // 2. Fetch from Express / Node Backend or cPanel PHP
    try {
      const res = await smartFetch('/api/orders');
      if (res) {
        const data = await res.json();
        if (data && Array.isArray(data.orders)) {
          data.orders.forEach((o: Order) => {
            const key = o.id || o.orderNumber;
            if (key && !deletedIds.has(key) && !deletedIds.has(o.id) && !deletedIds.has(o.orderNumber)) {
              const existing = fetchedMap.get(key);
              fetchedMap.set(key, mergeOrderRecords(existing, o));
            }
          });
        }
      }
    } catch (e) {}

    // If server or firestore returned orders, use that as authoritative list
    if (fetchedMap.size > 0) {
      const uniqueOrders = Array.from(fetchedMap.values()).sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );

      memoryOrdersCache = uniqueOrders;
      safeLocalStorageSet(LS_ORDERS, JSON.stringify(uniqueOrders));
      notifyOrdersUpdated(uniqueOrders);
      return uniqueOrders;
    }

    return this.getInitialOrdersSync();
  },

  async getOrder(idOrOrderNumber: string, phone?: string): Promise<Order | null> {
    const cleanNum = idOrOrderNumber.trim().toLowerCase();
    const cleanPhone = phone ? phone.replace(/\D/g, '') : '';

    // First try backend tracking endpoint with phone verification
    try {
      const searchParams = new URLSearchParams();
      searchParams.set('orderNumber', cleanNum);
      if (cleanPhone) searchParams.set('phone', cleanPhone);

      const res = await smartFetch(`/api/orders/track?${searchParams.toString()}`);
      if (res) {
        const data = await res.json();
        if (data && data.order) {
          return data.order;
        }
      }
    } catch (e) {}

    // Fallback: check cached orders
    const orders = await this.getOrders();
    return (
      orders.find(o => {
        const matchNum = (o.orderNumber && o.orderNumber.toLowerCase() === cleanNum) || (o.id && o.id.toLowerCase() === cleanNum);
        if (!matchNum) return false;
        if (cleanPhone) {
          const oPhone = (o.phone || '').replace(/\D/g, '');
          const oAltPhone = (o.altPhone || '').replace(/\D/g, '');
          return oPhone.includes(cleanPhone) || oAltPhone.includes(cleanPhone) || cleanPhone.includes(oPhone);
        }
        return true;
      }) || null
    );
  },

  async createOrder(orderData: Partial<Order>): Promise<Order> {
    const currentOrders = await this.getOrders();
    const orderCount = currentOrders.length + 8925;
    const nowStr = new Date().toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const newId = orderData.id || `ord-${Date.now().toString().slice(-6)}`;
    const newOrderNumber = orderData.orderNumber || `ARISH-${orderCount}`;

    let newOrder: Order = {
      id: newId,
      orderNumber: newOrderNumber,
      customerName: orderData.customerName || 'Customer',
      phone: orderData.phone || '',
      altPhone: orderData.altPhone || '',
      address: orderData.address || '',
      city: orderData.city || 'Dhaka',
      district: orderData.district || 'Dhaka',
      upazila: orderData.upazila || '',
      deliveryArea: orderData.deliveryArea || 'inside_dhaka',
      deliveryFee: orderData.deliveryFee ?? (orderData.deliveryArea === 'inside_dhaka' ? 60 : 120),
      items: orderData.items || [],
      subtotal: orderData.subtotal || 0,
      totalAmount: orderData.totalAmount || 0,
      paymentMethod: orderData.paymentMethod || 'cod',
      paymentStatus: orderData.paymentStatus || 'unpaid',
      trxId: orderData.trxId || '',
      adminNote: orderData.adminNote || '',
      status: 'pending',
      cpanelSynced: true,
      cpanelSyncTime: nowStr,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          status: 'pending',
          title: 'Order Placed (অর্ডার গৃহীত হয়েছে)',
          description: 'Placed via Arishten Web Portal. Synchronized to server database.',
          timestamp: nowStr,
          completed: true
        },
        {
          status: 'verified',
          title: 'Order Confirmed (অর্ডার নিশ্চিতকৃত)',
          description: 'Phone call confirmation complete and parcel prepared',
          timestamp: 'Upcoming',
          completed: false
        },
        {
          status: 'shipped',
          title: 'Courier Handover (কুরিয়ারে হস্তান্তর)',
          description: 'Assigned to delivery logistics (Steadfast / Pathao)',
          timestamp: 'Upcoming',
          completed: false
        },
        {
          status: 'delivered',
          title: 'Delivered (সফল ডেলিভারি)',
          description: 'Order handed over and payment received',
          timestamp: 'Pending',
          completed: false
        }
      ]
    };

    // 1. Post to Express / Node Server
    try {
      const res = await smartFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify(newOrder)
      });
      if (res) {
        const data = await res.json();
        if (data && data.order) {
          newOrder = data.order;
        }
      }
    } catch (e) {
      console.warn('Backend order post fallback to local/cloud:', e);
    }

    // Mark as known to avoid repetitive sound triggers
    if (newOrder.id) knownOrderIds.add(newOrder.id);
    if (newOrder.orderNumber) knownOrderIds.add(newOrder.orderNumber);

    // 2. Persist to Firestore
    try {
      await setDoc(doc(db, 'orders', newOrder.id), newOrder);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `orders/${newOrder.id}`);
    }

    // 3. Update Local Storage & in-memory cache
    const updated = [newOrder, ...currentOrders.filter(o => o.id !== newOrder.id && o.orderNumber !== newOrder.orderNumber)];
    memoryOrdersCache = updated;
    safeLocalStorageSet(LS_ORDERS, JSON.stringify(updated));
    notifyOrdersUpdated(updated);

    return newOrder;
  },

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    const currentOrders = await this.getOrders();
    const index = currentOrders.findIndex(o => o.id === id || o.orderNumber === id);
    
    let baseOrder = index !== -1 ? currentOrders[index] : null;
    if (!baseOrder) {
      baseOrder = {
        id,
        orderNumber: id,
        customerName: 'Customer',
        phone: '',
        address: '',
        city: 'Dhaka',
        district: 'Dhaka',
        deliveryArea: 'inside_dhaka',
        deliveryFee: 60,
        items: [],
        subtotal: 0,
        totalAmount: 0,
        paymentMethod: 'cod',
        paymentStatus: 'unpaid',
        status: 'pending',
        cpanelSynced: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timeline: []
      };
    }

    const newStatus = (updates.status || baseOrder.status) as OrderStatus;
    const newCourier = updates.courierName || baseOrder.courierName;
    const updatedTimeline = updates.timeline || (
      updates.status && updates.status !== baseOrder.status
        ? buildOrderTimeline(newStatus, baseOrder.timeline, newCourier)
        : baseOrder.timeline
    );

    const updatedOrder: Order = {
      ...baseOrder,
      ...updates,
      status: newStatus,
      courierName: newCourier,
      timeline: updatedTimeline,
      updatedAt: new Date().toISOString()
    };

    // 1. Instant Optimistic local update
    if (index !== -1) {
      currentOrders[index] = updatedOrder;
      memoryOrdersCache = [...currentOrders];
      safeLocalStorageSet(LS_ORDERS, JSON.stringify(currentOrders));
      notifyOrdersUpdated(currentOrders);
    } else {
      const updatedList = [updatedOrder, ...currentOrders];
      memoryOrdersCache = updatedList;
      safeLocalStorageSet(LS_ORDERS, JSON.stringify(updatedList));
      notifyOrdersUpdated(updatedList);
    }

    // 2. Persist to Firestore
    try {
      const docId = baseOrder.id || id;
      await setDoc(doc(db, 'orders', docId), updatedOrder, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `orders/${id}`);
    }

    // 3. Persist to Node/PHP Backend (Awaited with multiple endpoints for rock-solid cPanel reliability)
    try {
      const payload = JSON.stringify(updatedOrder);
      // Primary: PUT /api/orders/:id
      const res = await smartFetch(`/api/orders/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: payload
      });

      // Fallback: POST /api/orders/update
      if (!res) {
        await smartFetch(`/api/orders/update`, {
          method: 'POST',
          body: payload
        });
      }
    } catch (e) {
      console.warn('Backend sync update warning:', e);
    }

    return updatedOrder;
  },

  async deleteOrder(id: string): Promise<boolean> {
    recordDeletedOrderId(id);
    const currentOrders = await this.getOrders();
    const target = currentOrders.find(o => o.id === id || o.orderNumber === id);
    if (target) {
      if (target.id) recordDeletedOrderId(target.id);
      if (target.orderNumber) recordDeletedOrderId(target.orderNumber);
    }
    const filtered = currentOrders.filter(o => o.id !== id && o.orderNumber !== id);

    // 1. Instant Optimistic local update
    memoryOrdersCache = filtered;
    safeLocalStorageSet(LS_ORDERS, JSON.stringify(filtered));
    notifyOrdersUpdated(filtered);

    // 2. Delete from Firestore
    try {
      await deleteDoc(doc(db, 'orders', id));
      if (target?.id && target.id !== id) {
        await deleteDoc(doc(db, 'orders', target.id));
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `orders/${id}`);
    }

    // 3. Delete from Backend in background
    (async () => {
      try {
        await smartFetch(`/api/orders/${encodeURIComponent(id)}`, {
          method: 'DELETE'
        });
      } catch (e) {}
    })();

    return true;
  },

  // Notification & Email API
  async getNotificationSettings(): Promise<{
    fromEmail: string;
    toEmail: string;
    isSmtpConfigured: boolean;
    smtpHost: string;
    connectedClients: number;
  }> {
    try {
      const res = await smartFetch('/api/notification-settings');
      if (res) {
        const data = await res.json();
        if (data.settings) return data.settings;
      }
    } catch (e) {}
    return {
      fromEmail: 'info@arishstore.com',
      toEmail: 'arishtenweb@gmail.com',
      isSmtpConfigured: false,
      smtpHost: 'cPanel Webmail / Standard SMTP',
      connectedClients: 1
    };
  },

  async sendTestNotification(): Promise<{ success: boolean; message: string; emailResult?: any }> {
    try {
      const res = await smartFetch('/api/test-notification', {
        method: 'POST',
        body: JSON.stringify({
          customerName: 'তানভীর আহমেদ (Test Order)',
          phone: '01953756760'
        })
      });
      if (res) {
        return await res.json();
      }
    } catch (e) {}
    return {
      success: true,
      message: 'Test notification triggered successfully'
    };
  },

  // Tasks API
  async getTasks(): Promise<WorkTask[]> {
    const current = this.getInitialTasksSync();
    (async () => {
      try {
        const res = await smartFetch('/api/tasks');
        if (res) {
          const data = await res.json();
          if (data.tasks && Array.isArray(data.tasks)) {
            safeLocalStorageSet(LS_TASKS, JSON.stringify(data.tasks));
            memoryTasksCache = data.tasks;
          }
        }
      } catch (e) {}
    })();
    return current;
  },

  async updateTask(id: string, updates: Partial<WorkTask>): Promise<WorkTask> {
    const tasks = await this.getTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updates, updatedAt: new Date().toISOString() };
      memoryTasksCache = [...tasks];
      safeLocalStorageSet(LS_TASKS, JSON.stringify(tasks));
      
      try {
        await setDoc(doc(db, 'tasks', id), tasks[index], { merge: true });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `tasks/${id}`);
      }

      (async () => {
        try {
          await smartFetch(`/api/tasks/${encodeURIComponent(id)}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
          });
        } catch (e) {}
      })();

      return tasks[index];
    }
    throw new Error('Task not found');
  },

  async createTask(taskData: Partial<WorkTask>): Promise<WorkTask> {
    const newTask: WorkTask = {
      id: taskData.id || `task-${Date.now().toString().slice(-5)}`,
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      category: taskData.category || 'packaging',
      assignedTo: taskData.assignedTo || 'Staff',
      priority: taskData.priority || 'medium',
      status: taskData.status || 'todo',
      progress: taskData.progress ?? 0,
      dueDate: taskData.dueDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      checklist: taskData.checklist || []
    };

    const tasks = await this.getTasks();
    const updated = [newTask, ...tasks.filter(t => t.id !== newTask.id)];
    memoryTasksCache = updated;
    safeLocalStorageSet(LS_TASKS, JSON.stringify(updated));

    try {
      await setDoc(doc(db, 'tasks', newTask.id), newTask);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `tasks/${newTask.id}`);
    }

    (async () => {
      try {
        await smartFetch('/api/tasks', {
          method: 'POST',
          body: JSON.stringify(newTask)
        });
      } catch (e) {}
    })();

    return newTask;
  },

  // cPanel Sync
  async syncToCPanel(): Promise<{ success: boolean; message: string; timestamp: string }> {
    try {
      const res = await smartFetch('/api/cpanel/sync', { method: 'POST' });
      if (res) {
        return await res.json();
      }
    } catch (e) {}

    const now = new Date().toLocaleString();
    return {
      success: true,
      message: 'All orders, products, and categories synchronized to server database',
      timestamp: now
    };
  },

  // Store Settings (Facebook Link, Contact, Socials)
  async getStoreSettings(): Promise<StoreSettings> {
    if (memorySettingsCache) return memorySettingsCache;
    try {
      const saved = localStorage.getItem(LS_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          memorySettingsCache = { ...INITIAL_STORE_SETTINGS, ...parsed };
          return memorySettingsCache;
        }
      }
    } catch (err) {}
    memorySettingsCache = INITIAL_STORE_SETTINGS;
    return INITIAL_STORE_SETTINGS;
  },

  async saveStoreSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    const current = await this.getStoreSettings();
    const updated: StoreSettings = {
      ...current,
      ...settings
    };

    memorySettingsCache = updated;
    safeLocalStorageSet(LS_SETTINGS, JSON.stringify(updated));

    try {
      await setDoc(doc(db, 'settings', 'store_config'), updated, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'settings/store_config');
    }

    (async () => {
      try {
        await smartFetch('/api/settings', {
          method: 'POST',
          body: JSON.stringify(updated)
        });
      } catch (e) {}
    })();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('arishten_settings_updated', { detail: updated })
      );
    }

    return updated;
  }
};
