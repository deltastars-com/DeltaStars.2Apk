import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { auth, db, onAuthStateChanged, onSnapshot, collection, query, orderBy, where, handleFirestoreError, OperationType, FirebaseUser, setDoc, doc } from '@/firebase';
import { User, Product, CategoryConfig, ProductUnit, HomeSection, Order, Branch, ShowroomItem, Coupon, Ad, LegalPage, PriceUpdateRequest, DeliveryAgent, Invoice, UserRole } from '../../../types';
import { supabase, checkSupabaseConnection, isSupabaseConfigured } from '../../../lib/supabaseClient';
import api from '@/services/api';
import { DEFAULT_LEGAL_PAGES } from '../../../data/legalData';
import { onyxService } from '../../../services/onyxService';
import { smsService } from '../../../services/smsService';
import { orderArchiveService, ArchiveStats } from '../../../services/orderArchiveService';
import { useI18n } from './I18nContext';

interface Notification {
  id: string;
  title_ar: string;
  title_en: string;
  message_ar: string;
  message_en: string;
  createdAt: string;
  isRead: boolean;
  type: 'order' | 'system' | 'price' | 'user';
}

interface FirebaseContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  products: Product[];
  showroomItems: ShowroomItem[];
  categories: CategoryConfig[];
  units: ProductUnit[];
  homeSections: HomeSection[];
  orders: Order[];
  branches: Branch[];
  coupons: Coupon[];
  ads: Ad[];
  legalPages: LegalPage[];
  priceUpdateRequests: PriceUpdateRequest[];
  notifications: Notification[];
  deliveryAgents: DeliveryAgent[];
  invoices: Invoice[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  db: any;
  users: User[];
  promotions: any[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: number, data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  addShowroomItem: (item: Omit<ShowroomItem, 'id'>) => Promise<void>;
  updateShowroomItem: (id: number, data: Partial<ShowroomItem>) => Promise<void>;
  deleteShowroomItem: (id: number) => Promise<void>;
  updateOrder: (id: string, data: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  addCoupon: (coupon: Omit<Coupon, 'id'>) => Promise<void>;
  updateCoupon: (id: string, data: Partial<Coupon>) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;
  addAd: (ad: Omit<Ad, 'id'>) => Promise<void>;
  updateAd: (id: string, data: Partial<Ad>) => Promise<void>;
  deleteAd: (id: string) => Promise<void>;
  addBranch: (branch: Omit<Branch, 'id'>) => Promise<void>;
  updateBranch: (id: string, data: Partial<Branch>) => Promise<void>;
  deleteBranch: (id: string) => Promise<void>;
  addPriceUpdateRequest: (request: Omit<PriceUpdateRequest, 'id'>) => Promise<void>;
  updatePriceUpdateRequest: (id: string, data: Partial<PriceUpdateRequest>) => Promise<void>;
  updateUserPermissions: (userId: string, permissions: string[]) => Promise<void>;
  updateLegalPage: (id: string, data: Partial<LegalPage>) => Promise<void>;
  updateHomeSection: (id: string, data: Partial<HomeSection>) => Promise<void>;
  addHomeSection: (section: Omit<HomeSection, 'id'>) => Promise<void>;
  deleteHomeSection: (id: string) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  updateDeliveryAgent: (id: string, data: Partial<DeliveryAgent>) => Promise<void>;
  addDeliveryAgent: (agent: Omit<DeliveryAgent, 'id'>) => Promise<void>;
  deleteDeliveryAgent: (id: string) => Promise<void>;
  createOrderWithInvoice: (orderData: Omit<Order, 'id' | 'createdAt' | 'status' | 'paymentStatus'>) => Promise<string>;
  seedLegalPages: () => Promise<void>;
  syncProductsToFirestore: () => Promise<void>;
  addCategory: (category: Omit<CategoryConfig, 'id'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addUnit: (unit: Omit<ProductUnit, 'id'>) => Promise<void>;
  deleteUnit: (id: string) => Promise<void>;
  getLegalPages: () => Promise<LegalPage[]>;
  archivedOrders: Order[];
  archiveStats: ArchiveStats;
  runAutoArchive: (daysThreshold?: number) => Promise<{ archivedCount: number }>;
  restoreArchivedOrder: (orderId: string) => Promise<void>;
  loadArchivedOrders: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useI18n();
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [showroomItems, setShowroomItems] = useState<ShowroomItem[]>([]);
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [homeSections, setHomeSections] = useState<HomeSection[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [archivedOrders, setArchivedOrders] = useState<Order[]>([]);
  const [archiveStats, setArchiveStats] = useState<ArchiveStats>({
    totalArchivedCount: 0,
    totalArchivedRevenue: 0,
    lastArchivedAt: null,
    databaseSpaceSavedKB: 0
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [legalPages, setLegalPages] = useState<LegalPage[]>([]);
  const [priceUpdateRequests, setPriceUpdateRequests] = useState<PriceUpdateRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [deliveryAgents, setDeliveryAgents] = useState<DeliveryAgent[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isInitialized = useRef(false);

  // دوال الجلب المجزأة (Targeted Fetchers) لمنع إعادة تحميل المتجر بالكامل
  const fetchers = useMemo(() => ({
    products: async () => setProducts(await api.getProducts()),
    categories: async () => setCategories(await api.getCategories()),
    units: async () => setUnits(await api.getUnits()),
    branches: async () => setBranches(await api.getBranches()),
    ads: async () => setAds(await api.getAds()),
    legal_pages: async () => {
      const legal = await api.getLegalPages();
      if (legal && legal.length > 0) setLegalPages(legal);
    },
    notifications: async () => {
      if (!firebaseUser?.uid) return;
      const notifs = await api.getNotifications(firebaseUser.uid) as any;
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n: any) => !n.is_read).length);
    },
    delivery_agents: async () => setDeliveryAgents(await api.getDeliveryAgents()),
    invoices: async () => setInvoices(await api.getInvoices()),
    orders: async () => {
      const allFetched = (await api.getOrders()) as any[];
      if (allFetched && allFetched.length > 0) {
        const { remainingActiveOrders } = await orderArchiveService.autoArchiveCompletedOrders(allFetched, 'auto_cron', 30);
        setOrders(remainingActiveOrders);
        const archived = await orderArchiveService.fetchAllArchivedOrders();
        setArchivedOrders(archived);
        setArchiveStats(orderArchiveService.getArchiveStats());
      } else {
        setOrders([]);
        const archived = await orderArchiveService.fetchAllArchivedOrders();
        setArchivedOrders(archived);
        setArchiveStats(orderArchiveService.getArchiveStats());
      }
    },
    coupons: async () => setCoupons(await api.getCoupons()),
    users: async () => {
      const { data } = await supabase.from('users').select('*');
      if (data) setUsers(data as any);
    },
    promotions: async () => {
      const { data } = await supabase.from('promotions').select('*');
      if (data) setPromotions(data);
    },
    home_sections: async () => setHomeSections(await api.getHomeSections())
  }), [firebaseUser?.uid]);

  const seedCoupons = useCallback(async () => {
    try {
      const { data } = await supabase.from('coupons').select('id').eq('code', 'WELCOME10').single();
      if (!data) {
        await supabase.from('coupons').insert({
          code: 'WELCOME10', discountType: 'percentage', value: 10,
          minOrderAmount: 100, expiryDate: '2026-05-31', isActive: true
        });
        fetchers.coupons(); // تحديث الكوبونات فقط
      }
    } catch (err) { console.error('Error seeding coupons:', err); }
  }, [fetchers]);

  const seedLegalPages = useCallback(async () => {
    try {
      let seeded = false;
      for (const page of DEFAULT_LEGAL_PAGES) {
        const { data: existing } = await supabase.from('legal_pages').select('id').eq('id', page.id).single();
        if (!existing) {
          await supabase.from('legal_pages').insert({
            id: page.id, title_ar: page.title_ar, title_en: page.title_en,
            content_ar: page.content_ar, content_en: page.content_en, updatedAt: new Date().toISOString()
          });
          seeded = true;
        }
      }
      if (seeded) fetchers.legal_pages(); // تحديث الصفحات القانونية فقط
    } catch (err) {
      console.error('Error seeding legal pages:', err);
      setLegalPages(DEFAULT_LEGAL_PAGES);
    }
  }, [fetchers]);

  // التمهيد الأساسي لمرة واحدة فقط
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const init = async () => {
      try {
        const isConnected = await checkSupabaseConnection();
        if (!isConnected) console.warn('⚠️ Supabase not connected. Falling back.');
        
        // جلب متوازي وسريع لجميع البيانات مرة واحدة
        await Promise.all((Object.values(fetchers) as Array<() => Promise<any>>).map(fetcher => fetcher().catch(e => console.warn(e))));
        
        // تشغيل بذور التأسيس في الخلفية
        seedCoupons();
        seedLegalPages();
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchers, seedCoupons, seedLegalPages]);

  // إدارة الاشتراكات الموجهة (التنظيف الذكي)
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const tables = ['products', 'categories', 'units', 'branches', 'ads', 'legal_pages', 'notifications', 'delivery_agents', 'invoices', 'orders', 'coupons', 'home_sections'];
    
    const subscriptions = tables.map(table =>
      supabase
        .channel(`public:${table}`)
        .on('postgres_changes' as any, { event: '*', schema: 'public', table }, () => {
          // جلب الجدول الذي تم تحديثه فقط!
          const fetcherKey = table as keyof typeof fetchers;
          if (fetchers[fetcherKey]) {
            fetchers[fetcherKey]();
          }
        })
        .subscribe()
    );

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [fetchers]);

  // إدارة المصادقة (Auth & User Profile)
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const unsubscribeSnapshot = onSnapshot(doc(db, 'users', fbUser.uid), (snapshot) => {
          let userData = snapshot.data() as User;
          let role: UserRole = 'client';
          let type: UserRole = 'client';
          let permissions: string[] = [];

          const adminEmails = ['deltastars90@gmail.com', 'deltastars777@gmail.com', 'marketing@deltastars-ksa.com', 'info@deltastars-ksa.com', 'vipservicesyemen@outlook.sa', 'developer@deltastars-ksa.com'];
          const isAdminEmail = adminEmails.includes(fbUser.email || '');
          const isDevEmail = fbUser.email === 'vipservicesyemen@outlook.sa' || fbUser.email === 'marketing@deltastars-ksa.com';

          if (isDevEmail || isAdminEmail) {
            role = isDevEmail ? 'developer' : 'admin';
            type = isDevEmail ? 'developer' : 'admin';
            permissions = ['manage_products', 'manage_users', 'manage_accounting', 'manage_branches', 'manage_prices', 'receive_orders', 'manage_quality', 'manage_complaints', 'manage_ads', 'manage_coupons', 'manage_developer', 'manage_shipments'];
          }

          if (userData) {
            if (isAdminEmail || isDevEmail) {
              userData = { ...userData, role, type, permissions, email: 'marketing@deltastars-ksa.com' };
            }
            setUser(userData);
          } else {
            const newUser: User = {
              id: fbUser.uid, uid: fbUser.uid, type, role, email: (isAdminEmail || isDevEmail) ? 'marketing@deltastars-ksa.com' : (fbUser.email || ''),
              full_name: fbUser.displayName || '', name: fbUser.displayName || '', permissions
            };
            setUser(newUser);
            setDoc(doc(db, 'users', fbUser.uid), newUser).catch(err => console.error('Error bootstrapping user:', err));
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, 'users'));
        
        return () => unsubscribeSnapshot();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // جلب طلبات العميل العادي
  useEffect(() => {
    let isMounted = true;
    if (!user || ['admin', 'developer', 'gm', 'ops'].includes(user.role)) return;

    const fetchUserOrders = async () => {
      try {
        const { data, error } = await supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (error) throw error;
        if (isMounted) setOrders(data as any);
      } catch (err) { console.error('Error fetching user orders:', err); }
    };

    fetchUserOrders();
    return () => { isMounted = false; };
  }, [user]);

  // --- Management Methods (Memoized for Performance) ---
  
  const addProduct = useCallback(async (product: Omit<Product, 'id'>) => {
    try { await api.createProduct(product); } catch (err) { console.error(err); }
  }, []);

  const updateProduct = useCallback(async (id: number, data: Partial<Product>) => {
    try { await api.updateProduct(id, data); } catch (err) { console.error(err); }
  }, []);

  const deleteProduct = useCallback(async (id: number) => {
    try { await api.deleteProduct(id); } catch (err) { console.error(err); }
  }, []);

  const addShowroomItem = useCallback(async (item: Omit<ShowroomItem, 'id'>) => {
    try { await supabase.from('showroom').insert(item); } catch (err) { console.error(err); }
  }, []);

  const updateShowroomItem = useCallback(async (id: number, data: Partial<ShowroomItem>) => {
    try { await supabase.from('showroom').update(data).eq('id', id); } catch (err) { console.error(err); }
  }, []);

  const deleteShowroomItem = useCallback(async (id: number) => {
    try { await supabase.from('showroom').delete().eq('id', id); } catch (err) { console.error(err); }
  }, []);

  const updateOrder = useCallback(async (id: string, data: Partial<Order>) => {
    try {
      await supabase.from('orders').update(data).eq('id', id);
      if (data.status || data.paymentStatus) {
        const { data: invoiceData } = await supabase.from('invoices').select('id').eq('orderId', id).single();
        if (invoiceData) {
          const invoiceUpdate: Partial<Invoice> = {};
          if (data.paymentStatus === 'paid') { invoiceUpdate.status = 'Paid'; invoiceUpdate.status_ar = 'مدفوع'; }
          if (Object.keys(invoiceUpdate).length > 0) await supabase.from('invoices').update(invoiceUpdate).eq('id', invoiceData.id);
        }
      }

      if (data.status) {
        const order = orders.find(o => o.id === id);
        if (order && order.customerPhone) {
          await smsService.sendOrderStatusUpdate(order.customerPhone, id, data.status, { total: order.total, itemsCount: order.items.length });
        }
        if (data.status === 'delivered') {
          await supabase.from('notifications').insert({
            title_ar: 'تم تسليم الطلب', title_en: 'Order Delivered',
            message_ar: `تم تسليم الطلب رقم ${id} بنجاح. شكراً لتعاملكم معنا.`,
            message_en: `Order #${id} has been delivered successfully. Thank you for choosing us.`,
            created_at: new Date().toISOString(), is_read: false, type: 'order',
            user_id: orders.find(o => o.id === id)?.customerId || ''
          });
        }
      }
    } catch (err) { console.error(err); }
  }, [orders]);

  const deleteOrder = useCallback(async (id: string) => {
    try { await supabase.from('orders').delete().eq('id', id); } catch (err) { console.error(err); }
  }, []);

  const loadArchivedOrders = useCallback(async () => {
    try {
      const archived = await orderArchiveService.fetchAllArchivedOrders();
      setArchivedOrders(archived);
      setArchiveStats(orderArchiveService.getArchiveStats());
    } catch (err) {
      console.error('Error loading archived orders:', err);
    }
  }, []);

  const runAutoArchive = useCallback(async (daysThreshold: number = 30) => {
    try {
      const result = await orderArchiveService.autoArchiveCompletedOrders(orders, 'manual_admin', daysThreshold);
      setOrders(result.remainingActiveOrders);
      const archived = await orderArchiveService.fetchAllArchivedOrders();
      setArchivedOrders(archived);
      setArchiveStats(orderArchiveService.getArchiveStats());
      return { archivedCount: result.archivedCount };
    } catch (err) {
      console.error('Error running auto archive:', err);
      return { archivedCount: 0 };
    }
  }, [orders]);

  const restoreArchivedOrder = useCallback(async (orderId: string) => {
    try {
      const { updatedActiveOrders } = await orderArchiveService.restoreArchivedOrder(orderId, orders);
      setOrders(updatedActiveOrders);
      const archived = await orderArchiveService.fetchAllArchivedOrders();
      setArchivedOrders(archived);
      setArchiveStats(orderArchiveService.getArchiveStats());
    } catch (err) {
      console.error('Error restoring archived order:', err);
    }
  }, [orders]);

  const addCoupon = useCallback(async (coupon: Omit<Coupon, 'id'>) => {
    try { await api.createCoupon(coupon); } catch (err) { console.error(err); }
  }, []);

  const updateCoupon = useCallback(async (id: string, data: Partial<Coupon>) => {
    try { await supabase.from('coupons').update(data).eq('id', id); } catch (err) { console.error(err); }
  }, []);

  const deleteCoupon = useCallback(async (id: string) => {
    try { await api.deleteCoupon(id); } catch (err) { console.error(err); }
  }, []);

  const addAd = useCallback(async (ad: Omit<Ad, 'id'>) => {
    try { await supabase.from('ads').insert(ad); } catch (err) { console.error(err); }
  }, []);

  const updateAd = useCallback(async (id: string, data: Partial<Ad>) => {
    try { await supabase.from('ads').update(data).eq('id', id); } catch (err) { console.error(err); }
  }, []);

  const deleteAd = useCallback(async (id: string) => {
    try { await supabase.from('ads').delete().eq('id', id); } catch (err) { console.error(err); }
  }, []);

  const addBranch = useCallback(async (branch: Omit<Branch, 'id'>) => {
    try { await supabase.from('branches').insert(branch); } catch (err) { console.error(err); }
  }, []);

  const updateBranch = useCallback(async (id: string, data: Partial<Branch>) => {
    try { await supabase.from('branches').update(data).eq('id', id); } catch (err) { console.error(err); }
  }, []);

  const deleteBranch = useCallback(async (id: string) => {
    try { await supabase.from('branches').delete().eq('id', id); } catch (err) { console.error(err); }
  }, []);

  const addPriceUpdateRequest = useCallback(async (request: Omit<PriceUpdateRequest, 'id'>) => {
    try { await supabase.from('price_update_requests').insert(request); } catch (err) { console.error(err); }
  }, []);

  const updatePriceUpdateRequest = useCallback(async (id: string, data: Partial<PriceUpdateRequest>) => {
    try { await supabase.from('price_update_requests').update(data).eq('id', id); } catch (err) { console.error(err); }
  }, []);

  const updateUserPermissions = useCallback(async (userId: string, permissions: string[]) => {
    try { await supabase.from('users').update({ permissions }).eq('id', userId); } catch (err) { console.error(err); }
  }, []);

  const updateLegalPage = useCallback(async (id: string, data: Partial<LegalPage>) => {
    try { await api.updateLegalPage(id, data); } catch (err) { console.error(err); }
  }, []);

  const updateHomeSection = useCallback(async (id: string, data: Partial<HomeSection>) => {
    try { await supabase.from('home_sections').update(data).eq('id', id); } catch (err) { console.error(err); }
  }, []);

  const addHomeSection = useCallback(async (section: Omit<HomeSection, 'id'>) => {
    try { await supabase.from('home_sections').insert(section); } catch (err) { console.error(err); }
  }, []);

  const deleteHomeSection = useCallback(async (id: string) => {
    try { await supabase.from('home_sections').delete().eq('id', id); } catch (err) { console.error(err); }
  }, []);

  const markNotificationAsRead = useCallback(async (id: string) => {
    try { await api.markNotificationAsRead(id); } catch (err) { console.error(err); }
  }, []);

  const updateDeliveryAgent = useCallback(async (id: string, data: Partial<DeliveryAgent>) => {
    try { await api.updateDeliveryAgent(id, data); } catch (err) { console.error(err); }
  }, []);

  const addDeliveryAgent = useCallback(async (agent: Omit<DeliveryAgent, 'id'>) => {
    try { await api.createDeliveryAgent(agent); } catch (err) { console.error(err); }
  }, []);

  const deleteDeliveryAgent = useCallback(async (id: string) => {
    try { await api.deleteDeliveryAgent(id); } catch (err) { console.error(err); }
  }, []);

  const syncProductsToFirestore = useCallback(async () => {
    try {
      for (const p of products) await setDoc(doc(db, 'products', p.id.toString()), p);
      console.log('✅ Products synced to Firestore');
    } catch (err) { console.error(err); }
  }, [products]);

  const addCategory = useCallback(async (category: Omit<CategoryConfig, 'id'>) => {
    try { await supabase.from('categories').insert(category); } catch (err) { console.error(err); }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    try { await supabase.from('categories').delete().eq('id', id); } catch (err) { console.error(err); }
  }, []);

  const addUnit = useCallback(async (unit: Omit<ProductUnit, 'id'>) => {
    try { await supabase.from('units').insert(unit); } catch (err) { console.error(err); }
  }, []);

  const deleteUnit = useCallback(async (id: string) => {
    try { await supabase.from('units').delete().eq('id', id); } catch (err) { console.error(err); }
  }, []);

  const getLegalPages = useCallback(async () => legalPages, [legalPages]);

  const createOrderWithInvoice = useCallback(async (orderData: Omit<Order, 'id' | 'createdAt' | 'status' | 'paymentStatus'>) => {
    try {
      const orderId = `DS-${Math.floor(100000 + Math.random() * 900000)}`;
      const timestamp = new Date().toISOString();
      const dueDateObj = new Date(); dueDateObj.setDate(dueDateObj.getDate() + 3);

      const newOrder: Order = {
        ...orderData, id: orderId, status: 'pending',
        paymentStatus: orderData.paymentMethod === 'cod' ? 'pending' : 'paid',
        createdAt: timestamp, dueDate: dueDateObj.toISOString(),
      };

      await supabase.from('orders').insert(newOrder);

      const invoiceId = `INV-${orderId.split('-')[1]}`;
      const vatNumber = "310123456700003";
      const taxAmount = (orderData.subtotal - (orderData.discountAmount || 0) + (orderData.shippingFee || 0)) * 0.15;
      const qrData = JSON.stringify({ seller: "Delta Stars Trading Co.", vat: vatNumber, timestamp, total: orderData.total, tax: taxAmount.toFixed(2) });
      const qrCode = btoa(unescape(encodeURIComponent(qrData)));
      const invoiceDueDate = new Date(); invoiceDueDate.setDate(invoiceDueDate.getDate() + 30);

      const newInvoice: Invoice = {
        id: invoiceId, orderId, clientId: orderData.customerId, customerName: orderData.customerName,
        date: timestamp, dueDate: user?.role === 'vip' ? invoiceDueDate.toISOString() : undefined,
        items: orderData.items.map(item => ({ productId: item.id, name_ar: item.name_ar, name_en: item.name_en, quantity: item.quantity, price: item.price })),
        subtotal: orderData.subtotal, shipping: orderData.shippingFee || 0, tax: taxAmount, total: orderData.total,
        status: newOrder.paymentStatus === 'paid' ? 'Paid' : 'Unpaid',
        status_ar: newOrder.paymentStatus === 'paid' ? 'مدفوع' : 'غير مدفوع',
        type: 'Sales', branchId: orderData.branchId, sellerVatNumber: vatNumber, qrCode, invoiceType: 'Simplified'
      };
      await api.createInvoice(newInvoice);

      if (user?.role === 'vip') {
        const currentDebt = user.debt_balance || 0;
        const newBalance = currentDebt + (orderData.paymentMethod === 'bank_transfer' ? orderData.total : 0);
        if (orderData.paymentMethod === 'bank_transfer') {
          await supabase.from('users').update({ debt_balance: newBalance }).eq('id', user.id);
          await supabase.from('vip_transactions').insert({
            clientId: user.id, date: timestamp, description_ar: `فاتورة مبيعات رقم ${invoiceId} (آجل)`,
            description_en: `Sales Invoice #${invoiceId} (Credit)`, debit: orderData.total, credit: 0, balance: newBalance
          });
        }
      }

      try {
        const syncResult = await onyxService.syncOrder(newOrder);
        if (syncResult.success) {
          await supabase.from('orders').update({ onyx_sync_status: 'synced', onyx_invoice_id: syncResult.onyxInvoiceId }).eq('id', orderId);
          await onyxService.syncInvoice(newInvoice);
        }
      } catch (e) { console.warn('Onyx sync failed', e); }

      const assignedBranch = branches.find(b => b.id === orderData.branchId.toString()) || branches[0];
      const availableDrivers = deliveryAgents.filter(a => a.status === 'online');
      let assignedDriverId = availableDrivers.length > 0 ? availableDrivers[0].id : '';
      
      if (assignedDriverId) await supabase.from('orders').update({ driverId: assignedDriverId, status: 'preparing' }).eq('id', orderId);

      await supabase.from('notifications').insert({
        title_ar: 'طلب جديد مستلم وموجه', title_en: 'New Order Routed',
        message_ar: `طلب ${orderId} من ${orderData.customerName} موجه لفرع ${assignedBranch?.name_ar || 'الرئيسي'}.`,
        message_en: `Order ${orderId} routed to ${assignedBranch?.name_en || 'Main'} branch.`,
        created_at: timestamp, is_read: false, type: 'order', user_id: 'admin',
        metadata: { sound: 'alert_new_order', branchId: orderData.branchId, driverId: assignedDriverId }
      });

      if (assignedDriverId) {
        await supabase.from('notifications').insert({
          title_ar: 'طلب شحن جديد بانتظارك', title_en: 'New Shipment Awaiting You',
          message_ar: `طلب رقم ${orderId} جاهز للاستلام من فرع ${assignedBranch?.name_ar}.`,
          message_en: `Order #${orderId} is ready for pickup from ${assignedBranch?.name_en}.`,
          created_at: timestamp, is_read: false, type: 'order', user_id: assignedDriverId
        });
      }

      if (orderData.customerPhone) {
        const estDelivery = language === 'ar' ? 'خلال 6-12 ساعة' : 'within 6-12 hours';
        await smsService.sendOrderStatusUpdate(orderData.customerPhone, orderId, 'received', { total: orderData.total, itemsCount: orderData.items.length, estimatedDelivery: estDelivery });
        await smsService.sendWhatsAppNotification(orderData.customerPhone, language === 'ar' ? `تم استلام طلبكم بنجاح!\nرقم الطلب: ${orderId}` : `Your order received!\nOrder ID: ${orderId}`);
      }

      return orderId;
    } catch (err) { console.error(err); throw err; }
  }, [user, branches, deliveryAgents, language]);

  // تغليف القيم المرسلة لمنع الـ Re-renders العشوائية في التطبيق
  const contextValue = useMemo(() => ({
    user, firebaseUser, products, showroomItems, categories, units, homeSections, orders, archivedOrders, archiveStats, branches, coupons, ads, legalPages, priceUpdateRequests, notifications, deliveryAgents, invoices, unreadCount, loading, error, db, users, promotions,
    addProduct, updateProduct, deleteProduct, addShowroomItem, updateShowroomItem, deleteShowroomItem, updateOrder, deleteOrder,
    runAutoArchive, restoreArchivedOrder, loadArchivedOrders,
    addCoupon, updateCoupon, deleteCoupon, addAd, updateAd, deleteAd, addBranch, updateBranch, deleteBranch, addPriceUpdateRequest, updatePriceUpdateRequest, updateUserPermissions, updateLegalPage, updateHomeSection, addHomeSection, deleteHomeSection, markNotificationAsRead,
    updateDeliveryAgent, addDeliveryAgent, deleteDeliveryAgent, createOrderWithInvoice, seedLegalPages,
    syncProductsToFirestore, addCategory, deleteCategory, addUnit, deleteUnit, getLegalPages
  }), [
    user, firebaseUser, products, showroomItems, categories, units, homeSections, orders, archivedOrders, archiveStats, branches, coupons, ads, legalPages, priceUpdateRequests, notifications, deliveryAgents, invoices, unreadCount, loading, error, users, promotions,
    addProduct, updateProduct, deleteProduct, addShowroomItem, updateShowroomItem, deleteShowroomItem, updateOrder, deleteOrder,
    runAutoArchive, restoreArchivedOrder, loadArchivedOrders,
    addCoupon, updateCoupon, deleteCoupon, addAd, updateAd, deleteAd, addBranch, updateBranch, deleteBranch, addPriceUpdateRequest, updatePriceUpdateRequest, updateUserPermissions, updateLegalPage, updateHomeSection, addHomeSection, deleteHomeSection, markNotificationAsRead, updateDeliveryAgent, addDeliveryAgent, deleteDeliveryAgent, createOrderWithInvoice, seedLegalPages, syncProductsToFirestore, addCategory, deleteCategory, addUnit, deleteUnit, getLegalPages
  ]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) throw new Error('useFirebase must be used within a FirebaseProvider');
  return context;
};
