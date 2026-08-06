// ================================================================
// orderArchiveService.ts - Enterprise Auto-Archiving System
// شركة نجوم دلتا للتجارة (Delta Stars Trading Co.)
// ================================================================

import { Order } from '../types';
import { supabase } from '../lib/supabaseClient';

const ARCHIVE_STORAGE_KEY = 'delta_stars_archived_orders_v1';
const ARCHIVE_LOG_KEY = 'delta_stars_archive_logs_v1';

export interface ArchiveLogEntry {
  id: string;
  timestamp: string;
  archivedCount: number;
  totalAmountArchived: number;
  triggerType: 'auto_cron' | 'manual_admin';
}

export interface ArchiveStats {
  totalArchivedCount: number;
  totalArchivedRevenue: number;
  lastArchivedAt: string | null;
  databaseSpaceSavedKB: number;
}

class OrderArchiveService {
  /**
   * Checks if an order is eligible for archiving:
   * 1. Status is completed / delivered or cancelled
   * 2. Creation date is older than 30 days
   */
  public isEligibleForArchive(order: Order, daysThreshold: number = 30): boolean {
    const isCompletedOrTerminal = 
      order.status === 'delivered' || 
      order.status === 'completed' || 
      order.status === 'cancelled';

    if (!isCompletedOrTerminal) return false;

    const orderDate = new Date(order.createdAt || order.updatedAt || Date.now()).getTime();
    if (isNaN(orderDate)) return false;

    const now = Date.now();
    const thresholdMs = daysThreshold * 24 * 60 * 60 * 1000;

    return (now - orderDate) >= thresholdMs;
  }

  /**
   * Gets all local archived orders
   */
  public getLocalArchivedOrders(): Order[] {
    try {
      const data = localStorage.getItem(ARCHIVE_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading archived orders from local storage:', e);
      return [];
    }
  }

  /**
   * Saves archived orders to local storage
   */
  private saveLocalArchivedOrders(orders: Order[]) {
    try {
      localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      console.error('Error writing archived orders to local storage:', e);
    }
  }

  /**
   * Runs the auto-archive algorithm on an array of active orders.
   * Returns remaining active orders, archived count, and archived list.
   */
  public async autoArchiveCompletedOrders(
    activeOrders: Order[],
    triggerType: 'auto_cron' | 'manual_admin' = 'auto_cron',
    daysThreshold: number = 30
  ): Promise<{
    remainingActiveOrders: Order[];
    newlyArchivedOrders: Order[];
    archivedCount: number;
    totalAmountArchived: number;
  }> {
    if (!activeOrders || activeOrders.length === 0) {
      return {
        remainingActiveOrders: [],
        newlyArchivedOrders: [],
        archivedCount: 0,
        totalAmountArchived: 0
      };
    }

    const newlyArchivedOrders: Order[] = [];
    const remainingActiveOrders: Order[] = [];

    for (const order of activeOrders) {
      if (this.isEligibleForArchive(order, daysThreshold)) {
        newlyArchivedOrders.push({
          ...order,
          isArchived: true,
          archivedAt: new Date().toISOString()
        });
      } else {
        remainingActiveOrders.push(order);
      }
    }

    if (newlyArchivedOrders.length === 0) {
      return {
        remainingActiveOrders: activeOrders,
        newlyArchivedOrders: [],
        archivedCount: 0,
        totalAmountArchived: 0
      };
    }

    // 1. Update Local Storage Archive
    const existingArchive = this.getLocalArchivedOrders();
    const mergedArchiveMap = new Map<string, Order>();
    
    existingArchive.forEach(o => mergedArchiveMap.set(o.id, o));
    newlyArchivedOrders.forEach(o => mergedArchiveMap.set(o.id, o));

    const updatedArchive = Array.from(mergedArchiveMap.values());
    this.saveLocalArchivedOrders(updatedArchive);

    // 2. Sync to Supabase secondary archive table (best effort)
    try {
      const recordsToInsert = newlyArchivedOrders.map(o => ({
        id: o.id,
        user_id: o.customerId || o.customerPhone,
        customer_name: o.customerName,
        customer_phone: o.customerPhone,
        total: o.total,
        status: o.status,
        items: o.items,
        branch_id: o.branchId,
        created_at: o.createdAt,
        archived_at: new Date().toISOString()
      }));

      await supabase.from('archived_orders').upsert(recordsToInsert as any);
      
      // Delete archived orders from main table to keep main DB lightweight
      const idsToDelete = newlyArchivedOrders.map(o => o.id);
      await supabase.from('orders').delete().in('id', idsToDelete);
    } catch (err) {
      console.warn('⚠️ Supabase sync during archiving warning (using offline archive):', err);
    }

    const totalAmountArchived = newlyArchivedOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    // Log the archive event
    this.addLogEntry({
      id: `arch_log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      archivedCount: newlyArchivedOrders.length,
      totalAmountArchived,
      triggerType
    });

    console.log(`📦 [Auto-Archive Engine] Successfully archived ${newlyArchivedOrders.length} completed orders (> ${daysThreshold} days old).`);

    return {
      remainingActiveOrders,
      newlyArchivedOrders,
      archivedCount: newlyArchivedOrders.length,
      totalAmountArchived
    };
  }

  /**
   * Fetches full archived orders list combining local cache and remote
   */
  public async fetchAllArchivedOrders(): Promise<Order[]> {
    const local = this.getLocalArchivedOrders();
    try {
      const { data, error } = await supabase.from('archived_orders').select('*');
      if (!error && data && data.length > 0) {
        const remoteOrders: Order[] = data.map((d: any) => ({
          id: d.id,
          customerId: d.user_id || 'guest',
          customerName: d.customer_name || 'عميل المتجر',
          customerPhone: d.customer_phone || '',
          subtotal: d.subtotal || d.total || 0,
          shippingFee: d.shipping_fee || 0,
          discountAmount: d.discount_amount || 0,
          total: d.total || 0,
          status: d.status || 'delivered',
          items: d.items || [],
          branchId: d.branch_id || '1',
          createdAt: d.created_at || new Date().toISOString(),
          paymentStatus: 'paid',
          paymentMethod: d.payment_method || 'cod',
          deliveryAddress: d.delivery_address || '',
          isArchived: true,
          archivedAt: d.archived_at
        }));

        const map = new Map<string, Order>();
        local.forEach(o => map.set(o.id, o));
        remoteOrders.forEach(o => map.set(o.id, o));
        
        const combined = Array.from(map.values()).sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.saveLocalArchivedOrders(combined);
        return combined;
      }
    } catch (e) {
      console.warn('Fallback to local archived orders store');
    }
    return local;
  }

  /**
   * Restores an archived order back to active state
   */
  public async restoreArchivedOrder(orderId: string, currentActiveOrders: Order[]): Promise<{
    restoredOrder: Order | null;
    updatedActiveOrders: Order[];
  }> {
    const archive = this.getLocalArchivedOrders();
    const target = archive.find(o => o.id === orderId);

    if (!target) {
      return { restoredOrder: null, updatedActiveOrders: currentActiveOrders };
    }

    const unarchived: Order = {
      ...target,
      isArchived: false,
      archivedAt: undefined
    };

    // Remove from archive
    const newArchive = archive.filter(o => o.id !== orderId);
    this.saveLocalArchivedOrders(newArchive);

    // Sync to Supabase active table
    try {
      await supabase.from('orders').upsert({
        id: unarchived.id,
        user_id: unarchived.customerId,
        customer_name: unarchived.customerName,
        customer_phone: unarchived.customerPhone,
        total: unarchived.total,
        status: unarchived.status,
        items: unarchived.items,
        branch_id: unarchived.branchId,
        created_at: unarchived.createdAt
      } as any);

      await supabase.from('archived_orders').delete().eq('id', orderId);
    } catch (e) {
      console.warn('Error restoring order in Supabase:', e);
    }

    const updatedActive = [unarchived, ...currentActiveOrders];
    return { restoredOrder: unarchived, updatedActiveOrders: updatedActive };
  }

  /**
   * Calculates overall archive statistics
   */
  public getArchiveStats(): ArchiveStats {
    const archive = this.getLocalArchivedOrders();
    const logs = this.getArchiveLogs();

    const totalArchivedCount = archive.length;
    const totalArchivedRevenue = archive.reduce((acc, o) => acc + (o.total || 0), 0);
    const lastArchivedAt = logs.length > 0 ? logs[0].timestamp : null;
    // Estimated database space saved in KB (~2.5 KB per detailed order record)
    const databaseSpaceSavedKB = Math.round(totalArchivedCount * 2.5);

    return {
      totalArchivedCount,
      totalArchivedRevenue,
      lastArchivedAt,
      databaseSpaceSavedKB
    };
  }

  public getArchiveLogs(): ArchiveLogEntry[] {
    try {
      const data = localStorage.getItem(ARCHIVE_LOG_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  private addLogEntry(entry: ArchiveLogEntry) {
    try {
      const logs = this.getArchiveLogs();
      const updated = [entry, ...logs].slice(0, 50); // Keep last 50 logs
      localStorage.setItem(ARCHIVE_LOG_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to log archive entry:', e);
    }
  }
}

export const orderArchiveService = new OrderArchiveService();
export default orderArchiveService;
