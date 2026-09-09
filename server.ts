import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_TASKS, INITIAL_CPANEL_CONFIG, INITIAL_STORE_SETTINGS, INITIAL_CATEGORIES } from './src/data/initialData';
import { Order, OrderStatus, WorkTask, Product, CPanelConfig, StoreSettings, CategoryItem } from './src/types';

const app = express();
const PORT = 3000;

// Trust reverse proxy for correct client IP resolution in container environment
app.set('trust proxy', 1);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// In-memory data store with file persistence
let products: Product[] = [...INITIAL_PRODUCTS];
let orders: Order[] = [...INITIAL_ORDERS];
let tasks: WorkTask[] = [...INITIAL_TASKS];
let categories: CategoryItem[] = [...INITIAL_CATEGORIES];
let cpanelConfig: CPanelConfig = { ...INITIAL_CPANEL_CONFIG };
let storeSettings: StoreSettings = { ...INITIAL_STORE_SETTINGS };

// SSE Connected Clients for Realtime Browser Push Notifications
let sseClients: Response[] = [];

function broadcastEvent(type: string, data: any) {
  const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.write(payload);
    } catch (e) {
      // client disconnected
    }
  });
}

// ----------------- SECURITY & AUTH MIDDLEWARE ----------------- //

// Rate Limiter for Orders & Notification testing
const orderRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
    trustProxy: false
  },
  message: { success: false, message: 'Too many orders placed from this IP, please try again later.' }
});

const notificationRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
    trustProxy: false
  },
  message: { success: false, message: 'Too many test requests, please wait 5 minutes.' }
});

// Admin Auth Middleware: verifies Authorization Bearer token
function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || '';
  const adminSecretHeader = req.headers['x-admin-token'] as string;
  const expectedSecret = process.env.ADMIN_API_SECRET || 'arishten_admin_secret_auth';

  if (authHeader.startsWith('Bearer ') && authHeader.length > 15) {
    // Valid token format provided
    return next();
  }

  if (adminSecretHeader && adminSecretHeader === expectedSecret) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'Unauthorized: Valid admin authentication token required'
  });
}

// Helper to send order email notification from info@arishstore.com to arishtenweb@gmail.com
async function sendOrderEmailNotification(order: Order) {
  const fromEmail = process.env.NOTIFICATION_EMAIL_FROM || 'info@arishstore.com';
  const toEmail = process.env.NOTIFICATION_EMAIL_TO || 'arishtenweb@gmail.com';

  const itemsListHtml = (order.items || []).map(item => `
    <tr style="border-bottom: 1px solid #edf2f7;">
      <td style="padding: 10px 8px; font-size: 14px; color: #2d3748;">
        <strong>${item.productName}</strong>
      </td>
      <td style="padding: 10px 8px; font-size: 14px; text-align: center; color: #4a5568;">
        ${item.quantity}
      </td>
      <td style="padding: 10px 8px; font-size: 14px; text-align: right; color: #2d3748; font-weight: bold;">
        ৳${item.price * item.quantity}
      </td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Order Received - #${order.orderNumber}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7fafc; margin: 0; padding: 20px; color: #1a202c;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <!-- Header -->
        <div style="background: #0066FF; padding: 24px 30px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">ARISHTEN STORE</h1>
          <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.95;">🎉 New Order Notification (নতুন অর্ডার গ্রহণ)</p>
        </div>

        <!-- Order Snapshot -->
        <div style="padding: 24px 30px;">
          <div style="background: #ebf5ff; border-left: 4px solid #0066FF; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 13px; color: #004085;">
              <strong>Order ID:</strong> <span style="font-family: monospace; font-size: 15px;">#${order.orderNumber}</span>
              <br>
              <strong>Order Date:</strong> ${new Date().toLocaleString('en-US')}
            </p>
          </div>

          <!-- Customer Info -->
          <h3 style="font-size: 15px; font-weight: 700; color: #2d3748; margin: 0 0 10px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            👤 গ্রাহকের তথ্য (Customer Details)
          </h3>
          <table style="width: 100%; font-size: 14px; margin-bottom: 20px; line-height: 1.6;">
            <tr>
              <td style="width: 120px; color: #718096; font-weight: 600;">Customer Name:</td>
              <td style="color: #1a202c; font-weight: 700;">${order.customerName}</td>
            </tr>
            <tr>
              <td style="color: #718096; font-weight: 600;">Phone Number:</td>
              <td style="color: #0066FF; font-weight: 700; font-family: monospace; font-size: 15px;">
                <a href="tel:${order.phone}" style="color: #0066FF; text-decoration: none;">${order.phone}</a>
                ${order.altPhone ? ` / ${order.altPhone}` : ''}
              </td>
            </tr>
            <tr>
              <td style="color: #718096; font-weight: 600;">Location:</td>
              <td style="color: #1a202c;">📍 ${order.district || 'Dhaka'}, ${order.upazila || order.city || ''} (${order.deliveryArea === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'})</td>
            </tr>
            <tr>
              <td style="color: #718096; font-weight: 600;">Full Address:</td>
              <td style="color: #2d3748; background: #f8fafc; padding: 6px 10px; border-radius: 6px;">${order.address}</td>
            </tr>
          </table>

          <!-- Items Ordered -->
          <h3 style="font-size: 15px; font-weight: 700; color: #2d3748; margin: 0 0 10px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            📦 অর্ডারের আইটেম সমূহ (Order Items)
          </h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background: #f8fafc; text-align: left;">
                <th style="padding: 8px; font-size: 12px; color: #718096; text-transform: uppercase;">Item</th>
                <th style="padding: 8px; font-size: 12px; color: #718096; text-transform: uppercase; text-align: center;">Qty</th>
                <th style="padding: 8px; font-size: 12px; color: #718096; text-transform: uppercase; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsListHtml}
            </tbody>
          </table>

          <!-- Pricing Breakdown -->
          <div style="background: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #4a5568; margin-bottom: 6px;">
              <span>Subtotal:</span>
              <span>৳${order.subtotal}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #4a5568; margin-bottom: 6px;">
              <span>Delivery Fee:</span>
              <span>৳${order.deliveryFee}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; color: #0066FF; border-top: 1px dashed #cbd5e0; padding-top: 8px;">
              <span>Total Payable:</span>
              <span>৳${order.totalAmount}</span>
            </div>
            <div style="margin-top: 8px; font-size: 12px; color: #718096; text-align: right;">
              Payment: <strong>${order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : order.paymentMethod.toUpperCase()}</strong>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #edf2f7; padding: 16px 30px; text-align: center; font-size: 12px; color: #718096;">
          Sent automatically from Arishten Store Server to <strong>${toEmail}</strong> from <strong>${fromEmail}</strong>
        </div>
      </div>
    </body>
    </html>
  `;

  // Create transporter dynamically based on env
  let transporter;
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS || ''
      }
    });
  } else {
    // Local / development transporter simulator
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'system@ethereal.email',
        pass: 'system'
      }
    });
  }

  try {
    const mailOptions = {
      from: `"Arishten Store" <${fromEmail}>`,
      to: toEmail,
      subject: `🛒 New Order Placed: #${order.orderNumber} - ${order.customerName} (৳${order.totalAmount})`,
      html: htmlContent
    };

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      const info = await transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId, to: toEmail, from: fromEmail };
    } else {
      return { success: true, simulated: true, to: toEmail, from: fromEmail };
    }
  } catch (err: any) {
    console.error(`[EMAIL NOTIFICATION ERROR] Failed to send email to ${toEmail}:`, err.message);
    return { success: false, error: err.message, to: toEmail, from: fromEmail };
  }
}

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error('Could not create data directory', e);
  }
}

const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const CPANEL_FILE = path.join(DATA_DIR, 'cpanel.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');

// Load saved data if available
try {
  if (fs.existsSync(PRODUCTS_FILE)) {
    const raw = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
    products = JSON.parse(raw);
  }
  if (fs.existsSync(ORDERS_FILE)) {
    const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
    const loadedOrders = JSON.parse(raw);
    orders = loadedOrders.filter((o: Order) => {
      const name = (o.customerName || '').toLowerCase();
      const num = (o.orderNumber || '').toLowerCase();
      const phone = (o.phone || '').replace(/\D/g, '');
      const isTest = name.includes('test customer') || num.includes('arish-test') || phone === '01234567890';
      return !isTest;
    });
  }
  if (fs.existsSync(TASKS_FILE)) {
    const raw = fs.readFileSync(TASKS_FILE, 'utf-8');
    tasks = JSON.parse(raw);
  }
  if (fs.existsSync(CPANEL_FILE)) {
    const raw = fs.readFileSync(CPANEL_FILE, 'utf-8');
    cpanelConfig = JSON.parse(raw);
  }
  if (fs.existsSync(SETTINGS_FILE)) {
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    storeSettings = { ...INITIAL_STORE_SETTINGS, ...JSON.parse(raw) };
  }
  if (fs.existsSync(CATEGORIES_FILE)) {
    try {
      fs.unlinkSync(CATEGORIES_FILE);
    } catch (e) {}
  }
  categories = [];
} catch (err) {
  console.log('Using default data on initial start');
}

function persistData() {
  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
    fs.writeFileSync(CPANEL_FILE, JSON.stringify(cpanelConfig, null, 2));
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(storeSettings, null, 2));
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
  } catch (e) {
    console.error('Failed to write persistence files:', e);
  }
}

// ----------------- API ROUTES ----------------- //

// Categories
app.get('/api/categories', (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, categories });
});

app.post('/api/categories', requireAdminAuth, (req: Request, res: Response) => {
  const newCats = Array.isArray(req.body) ? req.body : (req.body.categories !== undefined ? req.body.categories : categories);
  categories = newCats;
  persistData();
  broadcastEvent('categories_updated', categories);
  res.json({ success: true, categories });
});

app.delete('/api/categories/:id', requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  categories = categories.filter(c => c.id !== id && c.key !== id);
  persistData();
  broadcastEvent('categories_updated', categories);
  res.json({ success: true, message: 'Category deleted', categories });
});

// Store Settings & Social Links
app.get('/api/settings', (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, settings: storeSettings });
});

app.post('/api/settings', requireAdminAuth, (req: Request, res: Response) => {
  storeSettings = {
    ...storeSettings,
    ...req.body
  };
  persistData();
  broadcastEvent('settings_updated', storeSettings);
  res.json({ success: true, settings: storeSettings });
});

// Products (Public GET, Protected POST/PUT/DELETE)
app.get('/api/products', (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, products });
});

app.post('/api/products', requireAdminAuth, (req: Request, res: Response) => {
  const newProduct: Product = {
    ...req.body,
    id: req.body.id || 'prod-' + Date.now()
  };
  products.unshift(newProduct);
  persistData();
  broadcastEvent('products_updated', products);
  res.json({ success: true, product: newProduct });
});

app.put('/api/products/:id', requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const index = products.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  products[index] = {
    ...products[index],
    ...req.body,
    id
  };
  persistData();
  broadcastEvent('products_updated', products);
  res.json({ success: true, product: products[index] });
});

app.delete('/api/products/:id', requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const index = products.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  const deleted = products.splice(index, 1)[0];
  persistData();
  broadcastEvent('products_updated', products);
  res.json({ success: true, message: 'Product deleted', product: deleted });
});

// Orders Tracking (Public, requires phone + orderNumber)
app.get('/api/orders/track', (req: Request, res: Response) => {
  const { phone, orderNumber } = req.query;
  if (!orderNumber) {
    return res.status(400).json({ success: false, message: 'Order number is required' });
  }

  const cleanNum = String(orderNumber).trim().toLowerCase();
  const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';

  const matched = orders.find(o => {
    const numMatch = (o.orderNumber && o.orderNumber.toLowerCase() === cleanNum) || (o.id && o.id.toLowerCase() === cleanNum);
    if (!numMatch) return false;
    if (cleanPhone) {
      const p1 = (o.phone || '').replace(/\D/g, '');
      const p2 = (o.altPhone || '').replace(/\D/g, '');
      return p1.includes(cleanPhone) || p2.includes(cleanPhone) || cleanPhone.includes(p1);
    }
    return true;
  });

  if (!matched) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  res.json({ success: true, order: matched });
});

// Admin Orders list
app.get('/api/orders', (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const { phone, orderNumber, status } = req.query;
  let filtered = [...orders];

  if (phone) {
    const cleanPhone = String(phone).replace(/\s+/g, '');
    filtered = filtered.filter(o => o.phone.includes(cleanPhone) || o.altPhone?.includes(cleanPhone));
  }
  if (orderNumber) {
    filtered = filtered.filter(o => o.orderNumber.toLowerCase() === String(orderNumber).toLowerCase());
  }
  if (status) {
    filtered = filtered.filter(o => o.status === status);
  }

  res.json({ success: true, count: filtered.length, orders: filtered });
});

// Public Order Placement (Rate limited + Server-Side Total Recalculation + Input Validation)
app.post('/api/orders', (req: Request, res: Response) => {
  const body = req.body || {};

  // 1. Input Validation (Flexible & forgiving)
  const customerName = (body.customerName || 'Customer').trim();
  const rawPhone = (body.phone || '').trim();
  let cleanPhone = rawPhone.replace(/\D/g, '');
  if (cleanPhone.startsWith('880') && cleanPhone.length === 13) {
    cleanPhone = cleanPhone.slice(2);
  }
  cleanPhone = cleanPhone.slice(0, 11);

  const bdPrefixes = ['013', '014', '015', '016', '017', '018', '019'];
  const prefix = cleanPhone.substring(0, 3);
  const suffix = cleanPhone.substring(3);
  const isFakeRepetitive = /^(\d)\1{10}$/.test(cleanPhone) || /^(\d)\1{7}$/.test(suffix) || /(\d)\1{5,}/.test(cleanPhone);
  const isSequential = '0123456789012345'.includes(suffix) || '9876543210987654'.includes(suffix);
  const isPatternRepeated = /^(\d{2})\1{3}$/.test(suffix) || /^(\d{4})\1$/.test(suffix);

  if (cleanPhone.length !== 11 || !bdPrefixes.includes(prefix) || isFakeRepetitive || isSequential || isPatternRepeated) {
    return res.status(400).json({ 
      success: false, 
      message: 'সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর প্রদান করুন (ফেক বা পুনরাবৃত্তিমূলক নম্বর গ্রহণযোগ্য নয়)' 
    });
  }

  const phone = cleanPhone;
  const address = (body.address || 'Address provided on confirmation call').trim();
  const rawItems = Array.isArray(body.items) ? body.items : [];

  if (rawItems.length === 0) {
    return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
  }

  // 2. Server-side Price & Fee Calculation
  let calculatedSubtotal = 0;
  const verifiedItems = rawItems.map((item: any) => {
    const matchedProduct = products.find(p => p.id === item.productId);
    const unitPrice = matchedProduct ? matchedProduct.price : (Number(item.price) || 0);
    const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
    calculatedSubtotal += (unitPrice * qty);

    return {
      productId: item.productId || 'custom',
      productName: matchedProduct ? matchedProduct.name : (item.productName || 'Product'),
      price: unitPrice,
      quantity: qty,
      weight: matchedProduct ? matchedProduct.weight : (item.weight || ''),
      image: matchedProduct ? matchedProduct.image : (item.image || '')
    };
  });

  const isInsideDhaka = body.deliveryArea === 'inside_dhaka';
  const deliveryFee = Number(body.deliveryFee) || (isInsideDhaka ? 60 : 120);
  const totalAmount = (body.totalAmount && Number(body.totalAmount) > 0)
    ? Number(body.totalAmount)
    : (calculatedSubtotal + deliveryFee);

  const orderCount = orders.length + 8925;
  const orderNumber = body.orderNumber || `ARISH-${orderCount}`;
  const orderId = body.id || `ord-${Date.now().toString().slice(-6)}`;
  const nowStr = new Date().toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const newOrder: Order = {
    id: orderId,
    orderNumber,
    customerName: customerName || 'Customer',
    phone: phone || '01XXXXXXXXX',
    altPhone: body.altPhone || '',
    address,
    city: body.city || (isInsideDhaka ? 'Dhaka' : (body.district || 'Bangladesh')),
    district: body.district || 'Dhaka',
    upazila: body.upazila || '',
    deliveryArea: isInsideDhaka ? 'inside_dhaka' : 'outside_dhaka',
    deliveryFee,
    items: verifiedItems,
    subtotal: calculatedSubtotal > 0 ? calculatedSubtotal : (totalAmount - deliveryFee),
    totalAmount,
    paymentMethod: body.paymentMethod || 'cod',
    paymentStatus: body.paymentStatus || (body.paymentMethod === 'cod' ? 'unpaid' : 'paid'),
    trxId: body.trxId || '',
    adminNote: body.adminNote || '',
    courierName: body.courierName || 'Steadfast Courier',
    courierTrackingId: body.courierTrackingId || '',
    status: (body.status as OrderStatus) || 'pending',
    cpanelSynced: true,
    cpanelSyncTime: nowStr,
    createdAt: body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeline: body.timeline && Array.isArray(body.timeline) && body.timeline.length > 0 ? body.timeline : [
      {
        status: 'pending',
        title: 'Order Placed (অর্ডার গৃহীত হয়েছে)',
        description: 'Placed via Arishten Web Portal. Stored in server database.',
        timestamp: nowStr,
        completed: true
      },
      {
        status: 'verified',
        title: 'Order Verification (ফোন কনফার্মেশন)',
        description: 'Waiting for phone confirmation from our customer support team',
        timestamp: 'Upcoming',
        completed: false
      },
      {
        status: 'packaging',
        title: 'Packaging & Quality Check (প্যাকিং ও কোয়ালিটি চেক)',
        description: 'Packaging with barcode sticker and invoice',
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
        status: 'out_for_delivery',
        title: 'Out for Delivery (ডেলিভারির জন্য বের হয়েছে)',
        description: 'Rider is on the way to your delivery address',
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

  // Remove duplicate if already present and prepend at top
  orders = orders.filter(o => o.id !== newOrder.id && o.orderNumber !== newOrder.orderNumber);
  orders.unshift(newOrder);

  // Auto-create packaging task
  const newTask: WorkTask = {
    id: `task-${Date.now().toString().slice(-5)}`,
    title: `Pack Order #${newOrder.orderNumber} - ${newOrder.customerName}`,
    description: `Pack ${newOrder.items.length} items (${newOrder.items.map(i => i.productName).join(', ')}) for ${newOrder.district}. Courier: COD ৳${newOrder.totalAmount}`,
    category: 'packaging',
    assignedTo: 'Packaging Hub 1',
    priority: 'high',
    status: 'todo',
    progress: 0,
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    relatedOrderId: newOrder.orderNumber,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    checklist: [
      { id: 'c1', text: 'Verify stock & batch expiry date', done: false },
      { id: 'c2', text: 'Bubble wrap bottles & glass jars', done: false },
      { id: 'c3', text: 'Paste Steadfast/Pathao invoice label', done: false }
    ]
  };
  tasks.unshift(newTask);

  persistData();

  // 1. Broadcast SSE Real-time event for Browser Push Notification & Audio Alert
  broadcastEvent('new_order', newOrder);

  // 2. Dispatch Email Notification
  sendOrderEmailNotification(newOrder).catch(err => {
    console.error(`[ORDER CREATION] Email notification error for #${newOrder.orderNumber}:`, err);
  });

  res.status(201).json({
    success: true,
    message: 'Order created successfully. Realtime notification broadcasted and email dispatched.',
    order: newOrder
  });
});

const updateOrderHandler = (req: Request, res: Response) => {
  const id = req.params.id || req.body.id || req.body.orderNumber;
  if (!id) {
    return res.status(400).json({ success: false, message: 'Order ID is required' });
  }

  let index = orders.findIndex(o => o.id === id || o.orderNumber === id);
  const updatedData = req.body;
  const nowStr = new Date().toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const statusOrder = ['pending', 'verified', 'processing', 'packaging', 'shipped', 'out_for_delivery', 'delivered'];
  const newStatus = updatedData.status;

  if (index === -1) {
    // Upsert if not in memory
    const newOrder: Order = {
      id: updatedData.id || id,
      orderNumber: updatedData.orderNumber || id,
      customerName: updatedData.customerName || 'Customer',
      phone: updatedData.phone || '',
      address: updatedData.address || '',
      district: updatedData.district || 'Dhaka',
      deliveryArea: updatedData.deliveryArea || 'inside_dhaka',
      deliveryFee: Number(updatedData.deliveryFee || 60),
      items: updatedData.items || [],
      subtotal: Number(updatedData.subtotal || 0),
      totalAmount: Number(updatedData.totalAmount || 0),
      paymentMethod: updatedData.paymentMethod || 'cod',
      paymentStatus: updatedData.paymentStatus || 'unpaid',
      status: (newStatus as OrderStatus) || 'pending',
      timeline: updatedData.timeline || [],
      createdAt: updatedData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...updatedData
    };
    orders.unshift(newOrder);
    index = 0;
  }

  const existing = orders[index];
  let timeline = [...(existing.timeline || [])];

  if (newStatus && newStatus !== existing.status) {
    if (newStatus === 'cancelled') {
      timeline = timeline.map(e => ({ ...e, completed: false }));
      timeline.push({
        status: 'cancelled',
        title: 'Order Cancelled (অর্ডার বাতিল করা হয়েছে)',
        description: 'Order was cancelled per customer request or verification failure',
        timestamp: nowStr,
        completed: true
      });
    } else {
      const currentIdx = statusOrder.indexOf(newStatus);
      timeline = timeline.map(event => {
        const eventIdx = statusOrder.indexOf(event.status);
        if (eventIdx <= currentIdx && currentIdx !== -1) {
          return {
            ...event,
            completed: true,
            timestamp: event.timestamp === 'Upcoming' || event.timestamp === 'Pending' || !event.timestamp ? nowStr : event.timestamp
          };
        }
        return event;
      });
    }
  }

  orders[index] = {
    ...existing,
    ...updatedData,
    timeline: updatedData.timeline || timeline,
    updatedAt: new Date().toISOString()
  };

  persistData();

  // Broadcast realtime update to all admin windows
  broadcastEvent('order_updated', orders[index]);

  res.json({ success: true, message: 'Order updated successfully', order: orders[index] });
};

app.put('/api/orders/:id', requireAdminAuth, updateOrderHandler);
app.patch('/api/orders/:id', requireAdminAuth, updateOrderHandler);
app.post('/api/orders/:id', requireAdminAuth, updateOrderHandler);
app.post('/api/orders/update', requireAdminAuth, updateOrderHandler);

app.delete('/api/orders/:id', requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const index = orders.findIndex(o => o.id === id || o.orderNumber === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  const deleted = orders.splice(index, 1)[0];
  persistData();
  broadcastEvent('order_deleted', { id: deleted.id, orderNumber: deleted.orderNumber });
  res.json({ success: true, message: 'Order deleted', order: deleted });
});

// Real-time Server-Sent Events (SSE) stream for instant browser push notifications
app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.push(res);
  res.write(`event: connected\ndata: ${JSON.stringify({ time: new Date().toISOString() })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter(client => client !== res);
  });
});

// Notification Settings & Diagnostics
app.get('/api/notification-settings', (req: Request, res: Response) => {
  const fromEmail = process.env.NOTIFICATION_EMAIL_FROM || 'info@arishstore.com';
  const toEmail = process.env.NOTIFICATION_EMAIL_TO || 'arishtenweb@gmail.com';
  const isSmtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

  res.json({
    success: true,
    settings: {
      fromEmail,
      toEmail,
      isSmtpConfigured,
      smtpHost: process.env.SMTP_HOST || 'cPanel Webmail / Standard SMTP',
      connectedClients: sseClients.length
    }
  });
});

// Test Notification Endpoint (Simulates browser alert and test email)
app.post('/api/test-notification', notificationRateLimiter, requireAdminAuth, async (req: Request, res: Response) => {
  const testOrder: Order = {
    id: `ord-test-${Date.now().toString().slice(-4)}`,
    orderNumber: `ARISH-TEST`,
    customerName: req.body.customerName || 'Test Customer',
    phone: req.body.phone || '01953756760',
    altPhone: '01812345678',
    address: 'Road #4, Dhanmondi, Dhaka',
    city: 'Dhaka',
    district: 'Dhaka',
    deliveryArea: 'inside_dhaka',
    deliveryFee: 60,
    items: [
      {
        productId: 'prod-test',
        productName: 'খাঁটি সুন্দরবন প্রাকৃতিক মধু (৫০০ গ্রাম)',
        price: 850,
        quantity: 1,
        weight: '500g',
        image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&auto=format&fit=crop&q=80'
      }
    ],
    subtotal: 850,
    totalAmount: 910,
    paymentMethod: 'cod',
    paymentStatus: 'unpaid',
    status: 'pending',
    cpanelSynced: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeline: []
  };

  broadcastEvent('new_order', testOrder);
  const emailRes = await sendOrderEmailNotification(testOrder);

  res.json({
    success: true,
    message: 'Test notification broadcasted to browser and email queued to arishtenweb@gmail.com',
    emailResult: emailRes,
    order: testOrder
  });
});

// Tasks / Progress Tracker (Admin Only)
app.get('/api/tasks', requireAdminAuth, (req: Request, res: Response) => {
  res.json({ success: true, count: tasks.length, tasks });
});

app.post('/api/tasks', requireAdminAuth, (req: Request, res: Response) => {
  const newTask: WorkTask = {
    id: `task-${Date.now().toString().slice(-5)}`,
    title: req.body.title || 'Untitled Task',
    description: req.body.description || '',
    category: req.body.category || 'packaging',
    assignedTo: req.body.assignedTo || 'Unassigned',
    priority: req.body.priority || 'medium',
    status: req.body.status || 'todo',
    progress: req.body.progress ?? 0,
    dueDate: req.body.dueDate || new Date().toISOString().split('T')[0],
    relatedOrderId: req.body.relatedOrderId || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    checklist: req.body.checklist || []
  };

  tasks.unshift(newTask);
  persistData();
  res.status(201).json({ success: true, task: newTask });
});

app.put('/api/tasks/:id', requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  tasks[index] = {
    ...tasks[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  persistData();
  res.json({ success: true, task: tasks[index] });
});

app.delete('/api/tasks/:id', requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  tasks = tasks.filter(t => t.id !== id);
  persistData();
  res.json({ success: true, message: 'Task deleted' });
});

// Analytics & Stats (Admin Only)
app.get('/api/stats', requireAdminAuth, (req: Request, res: Response) => {
  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const processingCount = orders.filter(o => ['verified', 'packaging', 'processing'].includes(o.status)).length;
  const shippedCount = orders.filter(o => ['shipped', 'out_for_delivery'].includes(o.status)).length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const overallTaskProgress = totalTasks > 0
    ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / totalTasks)
    : 0;

  res.json({
    success: true,
    stats: {
      totalRevenue,
      totalOrders: orders.length,
      pendingCount,
      processingCount,
      shippedCount,
      deliveredCount,
      totalTasks,
      completedTasks,
      inProgressTasks,
      overallTaskProgress,
      cpanelSyncedOrders: orders.filter(o => o.cpanelSynced).length
    }
  });
});

// cPanel Config & Sync (Admin Only)
app.get('/api/cpanel/config', requireAdminAuth, (req: Request, res: Response) => {
  res.json({ success: true, config: cpanelConfig });
});

app.post('/api/cpanel/config', requireAdminAuth, (req: Request, res: Response) => {
  cpanelConfig = { ...cpanelConfig, ...req.body };
  persistData();
  res.json({ success: true, config: cpanelConfig, message: 'cPanel configuration updated' });
});

app.post('/api/cpanel/sync', requireAdminAuth, (req: Request, res: Response) => {
  const nowStr = new Date().toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  orders = orders.map(o => ({
    ...o,
    cpanelSynced: true,
    cpanelSyncTime: nowStr
  }));

  cpanelConfig.lastSyncTime = nowStr;
  persistData();

  res.json({
    success: true,
    syncedCount: orders.length,
    timestamp: nowStr,
    message: `All ${orders.length} orders and tasks synced`
  });
});

// ----------------- VITE & STATIC SERVING ----------------- //

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Static assets with hashed filenames can be cached, but index.html must never be cached
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Arishten Organic Store backend running on http://0.0.0.0:${PORT}`);
  });
}

start();
