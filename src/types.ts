export interface CategoryItem {
  id: string;
  key: string;
  name: string;
  bnName: string;
  description?: string;
  icon?: string;
  emoji?: string;
  badge?: string;
  productCount?: number;
}

export interface Product {
  id: string;
  name: string;
  bnName: string;
  category: string;
  categoryLabel: string;
  price: number;
  originalPrice?: number;
  discountBadge?: string;
  weight: string;
  tag?: string;
  image: string;
  images?: string[];
  rating: number;
  reviewsCount: number;
  inStock: boolean;
  stockCount: number;
  description: string;
  features: string[];
  insideDhakaFee?: number;
  outsideDhakaFee?: number;
  createdAt?: number;
}

export type OrderStatus =
  | 'pending'
  | 'verified'
  | 'processing'
  | 'packaging'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  weight: string;
  image: string;
}

export interface OrderTimelineEvent {
  status: OrderStatus;
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  altPhone?: string;
  address: string;
  city: string;
  district: string;
  upazila?: string;
  deliveryArea: 'inside_dhaka' | 'outside_dhaka';
  deliveryFee: number;
  items: OrderItem[];
  subtotal: number;
  totalAmount: number;
  paymentMethod: 'cod' | 'bkash' | 'nagad' | 'rocket' | 'bank';
  paymentStatus: 'unpaid' | 'paid' | 'partial';
  trxId?: string;
  status: OrderStatus;
  courierName?: string;
  courierTrackingId?: string;
  adminNote?: string;
  cpanelSynced: boolean;
  cpanelSyncTime?: string;
  createdAt: string;
  updatedAt: string;
  timeline: OrderTimelineEvent[];
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface WorkTask {
  id: string;
  title: string;
  description: string;
  category: 'packaging' | 'quality_check' | 'harvesting' | 'dispatch' | 'customer_support' | 'cpanel_sync';
  assignedTo: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number; // 0 to 100
  dueDate: string;
  relatedOrderId?: string;
  createdAt: string;
  updatedAt: string;
  checklist: { id: string; text: string; done: boolean }[];
}

export interface CPanelConfig {
  cpanelHost: string;
  cpanelUsername: string;
  publicHtmlPath: string;
  apiUrl: string;
  apiKey: string;
  lastSyncTime?: string;
  syncMode: 'direct_api' | 'webhook' | 'json_export';
  autoSync: boolean;
}

export interface StoreSettings {
  facebookUrl: string;
  phone?: string;
  email?: string;
  address?: string;
  whatsappNumber?: string;
  brandName?: string;
  tagline?: string;
}
