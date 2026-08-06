// ================================================================
// UpdateManager.ts - نظام إدارة التحديثات التلقائية وحذف الكاش
// متجر دلتا ستارز للتجارة (Delta Stars)
// ================================================================

interface UpdateManagerConfig {
  /** رقم الإصدار الحالي للتطبيق */
  appVersion: string;
  /** وقت بناء التطبيق */
  buildTime: string;
  /** فترة فحص التحديثات بالثواني */
  checkInterval?: number;
  /** ما إذا كان يجب فحص التحديثات عند بدء التشغيل */
  checkOnStart?: boolean;
  /** دالة استدعاء عند توفر تحديث */
  onUpdateAvailable?: (version: string) => void;
  /** دالة استدعاء عند تطبيق التحديث */
  onUpdateApplied?: () => void;
  /** دالة استدعاء عند حدوث خطأ */
  onError?: (error: Error) => void;
}

interface UpdateInfo {
  /** هل هناك تحديث متاح */
  available: boolean;
  /** رقم الإصدار الجديد */
  newVersion: string;
  /** وقت بناء الإصدار الجديد */
  newBuildTime: string;
  /** وصف التحديث */
  description: string;
}

class UpdateManager {
  private static instance: UpdateManager;
  private config: UpdateManagerConfig;
  private checkIntervalId: any = null;
  private isChecking: boolean = false;
  private lastCheck: Date | null = null;
  private currentVersion: string = '';
  private currentBuildTime: string = '';

  private constructor(config: UpdateManagerConfig) {
    this.config = {
      checkInterval: 300, // 5 دقائق
      checkOnStart: true,
      ...config,
    };
    this.currentVersion = config.appVersion;
    this.currentBuildTime = config.buildTime;
  }

  /**
   * الحصول على النسخة الوحيدة من مدير التحديثات
   */
  public static getInstance(config?: UpdateManagerConfig): UpdateManager {
    if (!UpdateManager.instance) {
      if (!config) {
        throw new Error('يجب توفير الإعدادات عند إنشاء مدير التحديثات لأول مرة');
      }
      UpdateManager.instance = new UpdateManager(config);
    }
    return UpdateManager.instance;
  }

  /**
   * بدء تشغيل مدير التحديثات وتثبيت الـ Service Worker تلقائياً
   */
  public start(): void {
    console.log(`🔄 [UpdateManager] Starting version ${this.currentVersion}...`);

    // تسجيل الـ Service Worker
    this.registerServiceWorker();

    // التحقق من وجود تحديثات عند البدء
    if (this.config.checkOnStart) {
      this.checkForUpdates();
    }

    // بدء الجدولة
    this.startScheduledChecks();
  }

  /**
   * إيقاف تشغيل مدير التحديثات
   */
  public stop(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
    console.log('🔄 [UpdateManager] Stopped.');
  }

  /**
   * تسجيل الـ Service Worker لتمكين PWA والتحديثات التلقائية
   */
  private registerServiceWorker(): void {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then((registration) => {
            console.log('🚀 [PWA] ServiceWorker registered successfully with scope:', registration.scope);
            
            // مراقبة تحديثات الـ Service Worker
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('🔄 [PWA] New update discovered. Service Worker is ready.');
                    this.applyUpdate();
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.error('❌ [PWA] ServiceWorker registration failed:', error);
          });
      });

      // إعادة تحميل الصفحة تلقائياً عند تغيير الـ controller للـ SW لضمان تزامن الكاش
      // فقط في حالة وجود controller مسبق (ما يعني أن هذا تحديث حقيقي وليس التثبيت الأول)
      const hadController = !!navigator.serviceWorker.controller;
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (hadController && !refreshing) {
          refreshing = true;
          console.log('🔄 [PWA] Service Worker controller changed (actual update). Reloading page...');
          window.location.reload();
        }
      });
    }
  }

  /**
   * بدء الفحص المجدول
   */
  private startScheduledChecks(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
    }

    const intervalMs = (this.config.checkInterval || 300) * 1000;
    this.checkIntervalId = setInterval(() => {
      this.checkForUpdates();
    }, intervalMs);

    console.log(`🔄 [UpdateManager] Scheduled checks every ${intervalMs / 1000} seconds.`);
  }

  /**
   * التحقق من وجود تحديثات جديدة
   */
  public async checkForUpdates(): Promise<UpdateInfo | null> {
    if (this.isChecking) {
      return null;
    }

    this.isChecking = true;
    this.lastCheck = new Date();

    try {
      // جلب معلومات الإصدار من الخادم مع منع كاش المتصفح تماماً
      const response = await fetch('/version.json?cb=' + Date.now(), {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // استخراج معلومات الإصدار
      const newVersion = data.version || data.appVersion || '';
      const newBuildTime = data.buildTime || data.builtAt || '';

      // التحقق من وجود تحديث
      const hasUpdate = newVersion && this.isNewerVersion(newVersion, this.currentVersion);

      const updateInfo: UpdateInfo = {
        available: !!hasUpdate,
        newVersion: newVersion,
        newBuildTime: newBuildTime,
        description: data.description || 'تحديث جديد متاح للمتجر',
      };

      if (hasUpdate) {
        console.log(`🔄 [UpdateManager] Update available: ${this.currentVersion} → ${newVersion}`);
        this.handleUpdateAvailable(updateInfo);
      }

      return updateInfo;
    } catch (error) {
      console.warn('⚠️ [UpdateManager] Error checking version (likely offline or local dev):', error);
      return null;
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * مقارنة الإصدارات لتحديد ما إذا كان الجديد أحدث
   */
  private isNewerVersion(newVersion: string, currentVersion: string): boolean {
    if (!currentVersion) return true;

    const current = currentVersion.split('.').map(Number);
    const newer = newVersion.split('.').map(Number);

    for (let i = 0; i < Math.max(current.length, newer.length); i++) {
      const c = current[i] || 0;
      const n = newer[i] || 0;
      if (n > c) return true;
      if (n < c) return false;
    }

    return false;
  }

  /**
   * معالجة توفر تحديث جديد
   */
  private handleUpdateAvailable(updateInfo: UpdateInfo): void {
    try {
      localStorage.setItem('update_available', JSON.stringify(updateInfo));
      localStorage.setItem('update_timestamp', Date.now().toString());
    } catch (error) {
      console.warn('⚠️ [UpdateManager] Could not save update info:', error);
    }

    if (this.config.onUpdateAvailable) {
      this.config.onUpdateAvailable(updateInfo.newVersion);
    }

    // إرسال إشارة للـ Service Worker لتجاوز الانتظار
    this.notifyServiceWorker('SKIP_WAITING', updateInfo);
    
    // تفعيل التحديث التلقائي
    this.applyUpdate();
  }

  /**
   * تطبيق التحديث (إعادة تحميل الصفحة الكاش بالكامل)
   */
  public applyUpdate(): void {
    console.log('🔄 [UpdateManager] Applying update and clearing old cache...');

    this.notifyServiceWorker('SKIP_WAITING', { version: this.currentVersion });
    this.clearCache();

    if (this.config.onUpdateApplied) {
      this.config.onUpdateApplied();
    }

    setTimeout(() => {
      window.location.reload();
    }, 300);
  }

  /**
   * حذف الكاش المحلي بالكامل لإجبار المتصفح على جلب الملفات السليمة والجديدة
   */
  public clearCache(): void {
    try {
      // إزالة علامات الإصدارات السابقة
      localStorage.removeItem('update_available');
      localStorage.removeItem('update_timestamp');
      
      // تفريغ sessionStorage
      sessionStorage.clear();

      // حذف كاش المتصفح المسجل (Caches API)
      if ('caches' in window) {
        caches.keys().then((cacheNames) => {
          cacheNames.forEach((cacheName) => {
            caches.delete(cacheName);
          });
        });
      }

      console.log('🔄 [UpdateManager] Browser caches cleared successfully.');
    } catch (error) {
      console.warn('⚠️ [UpdateManager] Error clearing cache:', error);
    }
  }

  /**
   * إرسال إشارة إلى الـ Service Worker
   */
  private notifyServiceWorker(type: string, data: any): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type,
        data,
        version: this.currentVersion,
        timestamp: Date.now(),
      });
    }
  }

  public getPendingUpdate(): UpdateInfo | null {
    try {
      const saved = localStorage.getItem('update_available');
      if (saved) return JSON.parse(saved);
    } catch {
      return null;
    }
    return null;
  }
}

export async function forceClearCacheAndRefresh(): Promise<void> {
  console.log('🧹 [UpdateManager] Executing full cache purge and Service Worker unregistration...');
  
  try {
    // 1. Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }

    // 2. Clear all caches in CacheStorage
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
    }

    // 3. Clear sessionStorage and update flags from localStorage
    sessionStorage.clear();
    localStorage.removeItem('update_available');
    localStorage.removeItem('update_timestamp');
  } catch (err) {
    console.warn('⚠️ Error during force clear cache:', err);
  }

  // 4. Force hard reload with timestamp cache buster
  const cleanUrl = window.location.origin + window.location.pathname + '?clear_cache=' + Date.now();
  window.location.href = cleanUrl;
}

export const createUpdateManager = (config: UpdateManagerConfig): UpdateManager => {
  return UpdateManager.getInstance(config);
};

export default UpdateManager;
