import { Product, Order, WorkTask, CPanelConfig, CategoryItem } from '../types';

export const INITIAL_CATEGORIES: CategoryItem[] = [];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_TASKS: WorkTask[] = [];

export const INITIAL_CPANEL_CONFIG: CPanelConfig = {
  cpanelHost: '',
  cpanelUsername: '',
  publicHtmlPath: '/api/orders.json',
  apiUrl: '/api/cpanel/sync',
  apiKey: '',
  lastSyncTime: '',
  syncMode: 'direct_api',
  autoSync: true
};

export const INITIAL_STORE_SETTINGS = {
  facebookUrl: 'https://facebook.com',
  phone: '01886-123456',
  email: 'support@arishten.com',
  address: 'Noakhali, Bangladesh',
  whatsappNumber: '01886123456',
  brandName: 'Arishten',
  tagline: 'Quality Electronics & Sanitary Products in Bangladesh'
};
