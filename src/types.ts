export type Page = 'home' | 'products' | 'cart' | 'checkout' | 'login' | 'dashboard' | 'vipLogin' | 'vipDashboard' | 'wishlist' | 'showroom' | 'productDetail' | 'operations' | 'warehouse' | 'privacy' | 'security_setup' | 'trackOrder' | 'dev_console' | 'trust_center' | 'sourcing' | 'terms' | 'returns' | 'shipping' | 'driverDashboard' | 'units' | 'contact' | 'admin_dashboard';

export interface Product {
  id: number;
  sku?: string;
  name_ar: string;
  name_en: string;
  category: CategoryKey;
  category_ar?: string;
  category_en?: string;
  price: number;
  price_500g?: number;
  price_1kg?: number;
  price_currency?: string;
  image?: string;
  image_url?: string;
  unit_ar?: string;
  unit_en?: string;
  unit_type?: string;
  weight_grams?: number;
  description_ar?: string;
  description_en?: string;
  features_ar?: string; 
  features_en?: string;
  nutritional_value_ar?: string;
  nutritional_value_en?: string;
  origin_ar?: string;
  origin_en?: string;
  benefits_ar?: string;
  benefits_en?: string;
  stock_quantity?: number;
  stock_available?: number;
  min_threshold?: number;
  gallery?: string[];
  extra_settings?: Record<string, any>;
  is_featured?: boolean;
}

export interface User {
  id: string;
  uid?: string;
  type: UserRole;
  role?: UserRole; // for compatibility
  email?: string;
  phone?: string;
  phoneNumber?: string; // for compatibility
  name?: string;
  full_name?: string;
  displayName?: string; // for compatibility
  photo_url?: string;
  photoURL?: string; // for compatibility
  creditLimit?: number;
  currentBalance?: number;
  cashbackBalance?: number;
  clientStatus?: 'active' | 'inactive' | 'pending';
  assignedBranchId?: string;
  branches?: string[];
  permissions?: string[];
  fcm_token?: string;
  force_password_change?: boolean;
  is_verified?: boolean;
  onyx_id?: string;
  credit_limit?: number;
  debt_balance?: number;
  biometric_key?: string;
  security_pin?: string;
  pin_auth_enabled?: boolean;
  biometric_auth_enabled?: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  minOrderAmount: number;
  expiryDate: string;
  isActive: boolean;
}

export interface Ad {
  id: string;
  title_ar: string;
  title_en: string;
  image: string;
  link?: string;
  customerEmail: string;
  fee: number;
  startDate: string;
  endDate: string;
  status: 'pending' | 'active' | 'expired';
}

export interface CartItem extends Product {
  quantity: number;
}

export type UserRole = 'admin' | 'ops' | 'developer' | 'gm' | 'vip' | 'client' | 'marketing' | 'delegate' | 'accountant' | 'sales' | 'driver' | 'branch_agent' | 'quality_officer' | 'qa' | 'customer';
// تحديث قائمة الأقسام لتشمل كافة تصنيفات العميل
export type CategoryKey = 'fruits' | 'vegetables' | 'herbs' | 'qassim' | 'dates' | 'packages' | 'seasonal' | 'nuts' | 'flowers' | 'custom' | 'eggs' | 'imported';

export interface CategoryConfig {
  key: CategoryKey;
  id?: string;
  label_ar: string;
  label_en: string;
  icon?: string;
  order?: number;
  isVisible?: boolean;
}

export interface InvoiceItem {
  productId: number;
  name_ar: string;
  name_en: string;
  quantity: number;
  price: number;
}

export interface Invoice {
  id: string;
  orderId?: string;
  clientId?: string;
  customerName: string;
  date: string;
  dueDate?: string;
  items: InvoiceItem[];
  subtotal: number;
  shipping?: number;
  tax?: number;
  total: number;
  status: string;
  status_ar: string;
  type: 'Sales' | 'Purchase';
  branchId?: string | number;
  sellerVatNumber?: string;
  qrCode?: string;
  invoiceType?: 'Simplified' | 'Tax';
}

export interface VipClient {
  id: string;
  phone: string;
  companyName: string;
  contactPerson: string;
  shippingAddress: string;
  creditLimit: number;
  currentBalance: number;
  clientStatus: 'active' | 'standard';
}

export interface VipTransaction {
  id: string;
  clientId: string;
  date: string;
  description_ar: string;
  description_en: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  clientId: string;
  date: string;
  amount: number;
  method: string;
  method_ar: string;
  status: string;
}

export interface ShowroomAsset {
  id: string;
  type: 'video' | 'image';
  url: string;
  title_ar?: string;
  title_en?: string;
}

export interface ShowroomItem {
  id: number;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  image: string;
  section_ar: string;
  section_en: string;
  assets: ShowroomAsset[];
}

export type DeliveryMethod = 'standard' | 'express' | 'scheduled';

export interface Review {
  id: string;
  productId: number;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface DeliveryAgent {
  id: string;
  name: string;
  phone: string;
  vehicle_type: 'truck' | 'car';
  status: 'delivering' | 'online' | 'offline';
  rating: number;
  completed_orders: number;
  earnings: number;
  location: { lat: number; lng: number };
}

export interface ShipmentStatus {
  status: 'pending' | 'preparing' | 'setup' | 'shipped' | 'delivered';
  timestamp: string;
  location_name_ar: string;
  location_name_en: string;
  note_ar?: string;
  note_en?: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  agent: DeliveryAgent;
  currentStatus: ShipmentStatus['status'];
  history: ShipmentStatus[];
  estimatedDelivery: string;
}

export interface StockMovement {
  id: string;
  productId: number;
  type: 'IN' | 'OUT';
  quantity: number;
  reason: string;
  date: string;
  user: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export interface Promotion {
  id: number;
  title_ar: string;
  title_en: string;
  image: string;
  type: string;
  isActive: boolean;
  description_ar?: string;
  description_en?: string;
}

export type HomeSectionType = 'hero' | 'categories' | 'partners' | 'customers' | 'trust' | 'channels' | 'featured_products' | 'map' | 'featured' | 'banner' | 'ads' | 'stats';

export interface HomeSection {
  id: string;
  type: HomeSectionType;
  title_ar: string;
  title_en: string;
  isVisible: boolean;
  order: number;
  items?: any[];
}

export interface ProductUnit {
  id?: string;
  key?: string;
  code: string;
  name_ar: string;
  name_en: string;
  label_ar?: string;
  label_en?: string;
  base_factor: number;
}

export interface Branch {
  id: string;
  name_ar: string;
  name_en: string;
  city: string;
  address_ar: string;
  address_en: string;
  phone: string;
  location?: { lat: number; lng: number };
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export interface LegalPage {
  id: 'privacy' | 'terms' | 'shipping' | 'returns';
  title_ar: string;
  title_en: string;
  content_ar: string;
  content_en: string;
  updatedAt: string;
}

export interface Log {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  action: string;
  detail: string;
}

export interface PriceUpdateRequest {
  id: string;
  productId: number;
  productName_ar: string;
  productName_en: string;
  oldPrice: number;
  newPrice: number;
  requestedBy: string; // user email or name
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  total: number;
  customerPhone?: string;
  address?: string;
  status: 'pending' | 'preparing' | 'setup' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: string;
  updatedAt?: string;
  dueDate?: string;
  paymentMethod: string;
  branchId?: string;
  trackingNumber?: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  assignedDriverId?: string;
  cashbackEarned?: number;
  couponCode?: string;
  onyx_sync_status?: 'pending' | 'synced' | 'failed';
  onyx_invoice_id?: string;
  location?: { lat: number; lng: number };
  latitude?: number;
  longitude?: number;
  deliveryAddress?: string;
  isArchived?: boolean;
  archivedAt?: string;
  deliveryFee?: number;
  discount?: number;
  cashback?: number;
}

export interface FinancialReport {
  id: string;
  type: 'daily' | 'monthly';
  date: string;
  totalSales: number;
  totalOrders: number;
  totalProfit: number;
  expenses: number;
  netProfit: number;
  details: any;
  branchId?: string;
  createdAt: string;
}

export interface OnyxSyncLog {
  id: string;
  timestamp: string;
  status: 'success' | 'failed';
  entityType: 'order' | 'invoice' | 'product' | 'client';
  entityId: string;
  errorMessage?: string;
}
