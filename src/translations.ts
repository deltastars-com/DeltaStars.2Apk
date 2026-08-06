
export type Translation = { [key: string]: any };

export const translations: { [key: string]: Translation } = {
  ar: {
    common: {
      currency: "ر.س",
      loading: "جاري التحميل...",
      error: "حدث خطأ ما، يرجى المحاولة لاحقاً",
      save: "حفظ الإعدادات",
      cancel: "إلغاء العملية",
      delete: "حذف نهائي",
      confirm: "تأكيد الطلب",
      back: "الرجوع",
      search: "ابحث عن منتجك المفضل...",
      id: "رقم المرجع",
      status: "الحالة الحالية",
      date: "تاريخ العملية",
      amount: "القيمة الإجمالية",
      actions: "خيارات التحكم",
      view: "استعراض التفاصيل",
      edit: "تحديث البيانات",
      all: "كافة الأصناف",
      ok: "موافق",
      close: "إغلاق النافذة",
      add: "إضافة صنف",
      update: "تحديث المخزون",
      unit: "الوحدة",
      price: "السعر",
      total: "الإجمالي",
      logout: "تسجيل الخروج",
      logout_emoji: "تسجيل الخروج 🚪",
      active: "نشط",
      inactive: "غير مفعل",
      verified: "موثق",
      statuses: {
        pending: "قيد المعالجة",
        delivered: "مكتمل بنجاح",
        cancelled: "ملغي",
        shipped: "جاري الشحن",
        confirmed: "تم التأكيد"
      },
      units: {
        kg: "كيلو",
        half_kg: "نصف كيلو (500 جرام)",
        bundle: "حزمة",
        packet: "باكت",
        piece: "حبة",
        box: "صندوق / كرتون"
      }
    },
    header: {
      storeName: "نجوم دلتا للتجارة",
      storeTitle: "نجوم دلتا للتجارة | شريكك الأمثل للخضروات والفواكه والتمور عالية الجودة",
      adminGate: "بوابة الإدارة السيادية",
      aiSupportActive: "دعم تقني مدار بالذكاء الاصطناعي نشط",
      myAccount: "حسابي",
      login: "دخول",
      utility: {
        install: "تثبيت التطبيق",
        version: "إصدار التوريد المتميز v62.0",
        diamondEdition: "النسخة الماسية السيادية"
      },
      navLinks: {
        home: "الرئيسية",
        products: "سوق المنتجات",
        showroom: "صالة العرض",
        wishlist: "المفضلة",
        dashboard: "لوحة التحكم",
        vipPortal: "بوابة كبار العملاء",
        trackOrder: "تتبع شحنتك",
        adi: "مساعد عُدي الإجرائي",
        privacy: "سياسة الخصوصية",
        terms: "الشروط والأحكام",
        returns: "سياسة الإرجاع",
        driverDashboard: "لوحة المندوب",
        contact: "تواصل معنا",
        trackOrderPage: "تتبع حالة الطلب"
      }
    },
    contact: {
      title: "تواصل معنا",
      subtitle: "نحن هنا لخدمتكم وتلبية احتياجاتكم. لا تترددوا في التواصل معنا عبر أي من القنوات التالية.",
      callUs: "اتصل بنا",
      whatsapp: "واتساب",
      email: "البريد الإلكتروني",
      location: "الموقع",
      businessHours: "ساعات العمل",
      satThu: "السبت - الخميس",
      friday: "الجمعة",
      sendMessage: "أرسل لنا رسالة",
      fullName: "الاسم الكامل",
      phone: "رقم الجوال",
      subject: "الموضوع",
      message: "الرسالة",
      submit: "إرسال الرسالة",
      success: "تم إرسال رسالتك بنجاح. سنتواصل معك قريباً.",
      placeholders: {
        name: "أدخل اسمك",
        help: "كيف يمكننا مساعدتك؟"
      },
      subjects: {
        general: "استفسار عام",
        special: "طلب خاص",
        complaint: "شكوى أو اقتراح",
        partnership: "شراكة أعمال"
      }
    },
    checkout: {
      steps: {
        details: "بيانات العميل",
        otp: "التحقق",
        payment: "الدفع",
        success: "النجاح"
      },
      minOrderError: "عذراً، الحد الأدنى للطلب هو 50 ريال لضمان كفاءة التوريد والجودة.",
      phoneStep: "التحقق من رقم الجوال",
      phonePlaceholder: "05XXXXXXXX",
      sendCode: "إرسال كود التحقق",
      otpStep: "تأكيد الهوية الرقمية",
      otpPlaceholder: "أدخل الكود",
      verifyCode: "تأكيد والتحقق",
      addressStep: "بيانات الموقع والتسليم التفصيلية",
      city: "المدينة / المنطقة",
      district: "الحي السكني",
      street: "اسم الشارع الرئيسي / الفرعي",
      phoneVerificationSubtitle: "يرجى إدخال رقم الجوال لتلقي رمز التحقق الرقمي لتفعيل طلبك",
      otpSubtitle: "أدخل الكود المكون من 4 أرقام لتأكيد هويتك",
      changePhone: "تغيير رقم الجوال؟",
      addressSubtitle: "يرجى تسجيل بيانات الموقع اللوجستية بدقة",
      confirmAddress: "تأكيد العنوان والانتقال للسداد 🚚",
      sendingOtp: "جاري الإرسال...",
      resendOtp: "إعادة الإرسال بعد {{timer}}ث",
      verifyingOtp: "جاري التحقق...",
      locationType: "نوع السكن / المقر",
      house: "منزل / فيلا مستقلة",
      mall: "مركز تجاري / مول",
      market: "سوق / محل تجاري",
      buildingName: "اسم العمارة / رقم المبنى",
      unitNumber: "رقم الشقة / المكتب / المعرض",
      paymentStep: "خيار السداد والتحصيل المالي",
      onlinePayment: "بطاقة ائتمانية (فيزا / مدى / ماستركارد)",
      bankTransfer: "تحويل بنكي رسمي (البنك العربي الوطني)",
      bankDetails: "تفاصيل الحساب البنكي للسداد",
      cod: "الدفع عند الاستلام (نقدي للمندوب)",
      completeOrder: "إتمام الطلب النهائي",
      securityNote: "✓ نظام حماية المشتري مفعّل - طلب حقيقي موثق رقمياً"
    },
    home: {
      hero: {
        quality_label: "جودة سيادية فائقة",
        headline: "نجوم دلتا",
        description: "شريكك الأمثل للخضروات والفواكه والتمور عالية الجودة",
        button: "استعراض المنتجات 🛒",
        vipButton: "بوابة كبار العملاء 🤝",
        slogan: "Delta Stars | شريكك الأمثل للخضروات والفواكه والتمور عالية الجودة"
      },
      categories: {
        title: "اقسامنا المتخصصة",
        subtitle: "تصفح منتجاتنا الطازجة حسب التصنيف"
      },
      partners: {
        title: "نحن نقدر ثقتكم عملائنا الكرام",
        partners_label: "شركاء الجودة والتميز المؤسسي",
        subtitle: "نفتخر بكوننا الشريك الأول والموثوق لكبرى المؤسسات الغذائية في المملكة العربية السعودية"
      },
      stats: {
        coverage: { title: "تغطية شاملة", desc: "نخدم المدن المتواجدة فيها فروعنا في المملكة العربية السعودية لضمان أقصى درجات الجودة." },
        quality: { title: "جودة فائقة", desc: "نلتزم بأعلى معايير الجودة العالمية في اختيار وتوريد منتجاتنا." },
        delivery: { title: "سرعة التوصيل", desc: "أسطول مبرد يضمن وصول المنتجات طازجة وفي أسرع وقت." }
      },
      about: {
        title: "شريكك الأمثل للخضروات والفواكه والتمور عالية الجودة",
        desc: "اكتشف التميز مع دلتا ستارز، الموزع الأول للخضروات والفواكه في السوق السعودي. إن التزامنا الثابت بالجودة جعلنا المورد المفضل لمجموعة كبيرة من المؤسسات بما في ذلك المطاعم والفنادق وخدمات تقديم الطعام والأسواق الكبرى والمستشفيات.",
        features: {
          organic: "منتجات عضوية",
          dates: "تمور فاخرة",
          import: "استيراد مباشر",
          support: "دعم فني 24/7"
        },
        experience: "سنة من الخبرة"
      },
      channels: {
        title: "قنواتنا الرقمية",
        subtitle: "تابع كل جديد وعروضنا الحصرية عبر منصاتنا التفاعلية",
        adLabel: "إعلان ترويجي"
      },
      lounges: {
        title: "مجتمعات delta stars",
        subtitle: "تواصل مباشر وحصري لأحدث العروض اليومية",
        whatsapp: {
          title: "مجتمع واتساب",
          desc: "انضم لمجتمعنا لتصلك العروض اليومية والأسعار المحدثة فوراً.",
          button: "انضم الآن"
        },
        telegram: {
          title: "قناة تيليجرام",
          desc: "تغطية شاملة للمنتجات الجديدة وتقارير الجودة من قلب المستودعات.",
          button: "متابعة القناة"
        }
      }
    },
    showroom: {
      title: "صالة العروض الترويجية",
      searchPlaceholder: "ابحث عن منتج...",
      priceLabel: "السعر النهائي",
      orderNow: "اطلب الآن 🚀",
      featured: "مميز ⭐",
      price: "السعر",
      refId: "الرقم المرجعي",
      itemNumber: "رقم المنتج",
      qualitySeal: "معيار الجودة العالية",
      showMore: "عرض المزيد من المنتجات",
      origin: "بلد المنشأ",
      nutrition: "القيمة الغذائية",
      features: "المميزات",
    },
    dashboard: {
      title: "نظام التحكم القيادي",
      subtitle: "شركة delta stars للتجارة",
      stats: {
        sales: "إجمالي المبيعات المحققة",
        lowStock: "أصناف تحتاج إعادة توريد",
        pending: "طلبات بانتظار الاعتماد"
      },
      sections: {
        admin: { title: "الإدارة العامة والمحاسبة", desc: "التقارير المالية والقرارات السيادية" },
        marketing: { title: "قسم التسويق والأسعار", desc: "العروض والمنتجات وإدارة الأسعار" },
        ops: { title: "العمليات واللوجستيات", desc: "تتبع الأسطول والمخزون الحي" },
        dev: { title: "ركن المطور", desc: "تعديل الأكواد والأنظمة الأمنية" }
      }
    },
    categories: {
      fruits: "فواكة",
      vegetables: "خضروات",
      herbs: "ورقيات",
      qassim: "منتجات القصيم",
      dates: "تمور",
      packages: "مغلفات",
      seasonal: "منتجات موسمية",
      nuts: "مكسرات",
      flowers: "الورود والهدايا",
      imported: "فواكه وخضروات مستوردة"
    },
    products: {
      title: "صالة المنتجات عالية الجودة",
      subtitle: "نختار لك الأجود من المزارع الوطنية والعالمية بعناية فائقة",
      searchPlaceholder: "ما الذي تبحث عنه اليوم؟",
      noResults: "لم نجد نتائج مطابقة لطلبك",
      allCategories: "كافة الأقسام",
      sort: {
        default: "الترتيب الافتراضي",
        priceAsc: "السعر: من الأقل للأعلى",
        priceDesc: "السعر: من الأعلى للأقل",
        newest: "الأحدث وصولاً",
        stock: "توفر المخزون (الأعلى أولاً)"
      },
      certifiedCatalog: "كتالوج ٢٣٥ صنفاً معتمداً"
    },
    cart: {
      title: "سلة المشتريات",
      empty: "سلتك فارغة حالياً، ابدأ بالتسوق الآن",
      clear: "تفريغ السلة",
      continueShopping: "مواصلة التسوق",
      summary: "ملخص الطلبية والمحاسبة",
      items_value: "قيمة المنتجات",
      vat: "ضريبة القيمة المضافة (15%)",
      shippingFee: "رسوم التوصيل",
      free: "مجاني",
      cashbackEarned: "كاش باك مكتسب",
      grandTotalLabel: "الإجمالي الكلي",
      finalizeCheckout: "إتمام الطلب الآن",
      qualityPledge: "التزامنا بالجودة يبدأ من سلتكم",
      couponCodeLabel: "كود الخصم",
      apply: "تطبيق",
      discount: "الخصم",
      deliveryFeeLabel: "رسوم التوصيل",
      freeLabel: "مجاني",
      cashbackEarnedLabel: "كاش باك مكتسب",
      invalidCoupon: "كوبون غير صالح",
      minOrderCoupon: "الحد الأدنى لهذا الكوبون هو {{min}}",
      couponApplied: "تم تطبيق الكوبون بنجاح",
      identityVerified: "مرحباً بك مجدداً، تم التعرف على هويتك",
      validPhoneRequired: "يرجى إدخال رقم هاتف صحيح (05XXXXXXXX)",
      otpSent: "تم إرسال رمز التحقق",
      otpFailed: "فشل إرسال الرمز",
      verifiedSuccess: "تم التحقق بنجاح",
      invalidCode: "رمز غير صحيح",
      verificationError: "حدث خطأ أثناء التحقق",
      orderFailed: "فشل في إنشاء الطلب",
      redirectDashboard: "تم تحويلك للوحة التحكم لمتابعة الطلب",
      redirectTrack: "جاري تحويلك لصفحة تتبع الطلبات",
      bankInfo: {
        bank: "البنك",
        branch: "الفرع",
        idNo: "رقم الهوية",
        accountName: "اسم الحساب",
        accountNumber: "رقم الحساب",
        iban: "رقم الآيبان (IBAN)",
        transferInstruction: "يرجى تحويل المبلغ وإرسال صورة الإيصال عبر الواتساب لتأكيد الطلب"
      },
      deliveryMode: {
        title: "اختر طريقة التوصيل",
        subtitle: "نحن نضمن وصول طلبك بأفضل حالة",
        standard: "توصيل قياسي",
        express: "توصيل سريع",
        scheduled: "توصيل مجدول",
        within24h: "خلال ٢٤ ساعة",
        within2h: "خلال ساعتين",
        pickTime: "اختر موعدك",
        confirm: "تأكيد وسيلة التوصيل"
      },
      paymentOptions: {
        creditCard: "بطاقة ائتمانية",
        bankTransfer: "تحويل بنكي",
        paypal: "PayPal",
        cod: "الدفع عند الاستلام",
        selectCredit: "اختيار السداد بالبطاقة",
        selectBank: "اختيار التحويل البنكي",
        selectPaypal: "اختيار PayPal",
        selectCod: "تأكيد الدفع عند الاستلام",
        safePaypal: "سداد سريع وآمن عبر بايبال",
        codDesc: "الدفع نقداً عند وصول الطلب"
      },
      checkout: {
          successTitle: "تم استلام طلبك بنجاح",
          successSubtitle: "فريقنا اللوجستي يقوم الآن بتجهيز طلبك بأعلى معايير الجودة",
          orderId: "رقم طلبك المرجعي",
          whatsappConfirmation: "تأكيد عبر واتساب",
          backToStore: "العودة للمتجر",
          whatsappConfirmationMessage: "مرحباً delta stars، أود تأكيد طلبي رقم {{orderId}} بقيمة {{formattedTotal}}."
      }
    },
    trackOrder: {
      title: "تتبع طلبك",
      subtitle: "شاهد رحلة طلبك من مزارعنا إلى باب منزلك",
      placeholder: "أدخل رقم الطلب (مثال: ORD-123)",
      search: "بحث",
      initializing: "نظام التتبع قيد التفعيل",
      apiKeyMissing: "يرجى إضافة مفتاح Google Maps API في ملف .env لتفعيل التتبع اللحظي عبر الخرائط.",
      steps: {
        prep: "تجهيز الطلب",
        shipping: "جاري التوصيل",
        delivered: "تم الاستلام"
      },
      realtime: "تتبع طلبك اللحظي",
      driver: "السائق",
      onTheWay: "طلبك في الطريق!",
      updating: "يتم التحديث لحظياً"
    },
    admin: {
      liveConsole: {
        title: "شاشة استقبال الطلبات الحية",
        awaiting: "طلبات جديدة بانتظار التأكيد",
        noNew: "لا توجد طلبات جديدة حالياً",
        accept: "قبول وتجهيز",
        reject: "رفض",
        inPrep: "طلبات قيد التجهيز",
        noPrep: "لا توجد طلبات قيد التجهيز",
        contents: "محتويات الطلب:",
        ready: "تم التجهيز - إرسال للمندوب 🚚"
      },
      userManagement: {
        title: "إدارة الصلاحيات والوصول",
        userUpdated: "تم تحديث دور المستخدم",
        updateFailed: "فشل في التحديث",
        permissionsUpdated: "تم تحديث الصلاحيات",
        loading: "جاري تحميل قاعدة بيانات المستخدمين...",
        headers: {
          user: "المستخدم",
          role: "الدور",
          permissions: "الصلاحيات الممنوحة"
        },
        roles: {
          client: "عميل (Client)",
          vip: "عميل VIP",
          marketing: "تسويق (Marketing)",
          admin: "مدير (Admin)",
          ops: "عمليات (Operations)",
          delegate: "مندوب (Delegate)",
          developer: "مطور (Developer)"
        },
        permissions: {
          receive_orders: "استقبال الطلبات",
          manage_prices: "تعديل الأسعار",
          manage_ads: "إدارة الإعلانات",
          view_reports: "عرض التقارير",
          manage_inventory: "إدارة المخزون",
          manage_products: "إدارة المنتجات",
          manage_categories: "إدارة الأصناف",
          manage_units: "إدارة الوحدات",
          manage_branches: "إدارة الفروع",
          manage_coupons: "إدارة الكوبونات",
          manage_showroom: "إدارة صالة العرض",
          manage_legal: "إدارة الصفحات القانونية",
          manage_notifications: "إدارة الإشعارات",
          view_ai_insights: "عرض توقعات AI",
          manage_accounting: "إدارة النظام المحاسبي"
        }
      },
      shipment: {
        title: "إدارة المشتريات والاستيراد 🚢",
        subtitle: "تتبع الشحنات الدولية والمحلية وسجل الموردين",
        add: "إضافة شحنة جديدة",
        active: "شحنات نشطة",
        arrivingToday: "تصل اليوم",
        totalSuppliers: "إجمالي الموردين",
        listTitle: "قائمة الشحنات الجارية",
        searchPlaceholder: "بحث برقم الشحنة...",
        headers: {
          id: "رقم الشحنة",
          supplier: "المورد",
          items: "الأصناف",
          eta: "تاريخ وصول متوقع",
          status: "الحالة",
          tracking: "التتبع"
        }
      },
      dev: {
        title: "غرفة عمليات المطور",
        publish: "نشر التحديثات",
        sysStatus: "حالة النظام الحالية",
        version: "إصدار التطبيق",
        latency: "زمن الاستجابة",
        serverStatus: "حالة السيرفر",
        online: "متصل (Online)",
        opsLog: "سجل العمليات التقنية",
        advancedTools: "أدوات التحكم المتقدمة",
        tools: {
          deepSettings: "الإعدادات العميقة",
          firewall: "جدار الحماية",
          backup: "نسخ احتياطي",
          cache: "تنظيف الكاش"
        }
      }
    },
    payment: {
      portalTitle: "بوابة السداد السيادية",
      totalDue: "إجمالي المستحقات",
      selectMethod: "اختر طريقة السداد المفضلة",
      creditCard: "Credit Card (بطاقة ائتمانية)",
      mada: "Mada (بطاقة مدى)",
      bankIBAN: "حوالة بنكية (الآيبان)",
      backToMethods: "الرجوع لطرق الدفع",
      confirmSecure: "تأكيد السداد الآمن",
      paypalRedirect: "سيتم توجيهك الآن إلى صفحة بايبال لإتمام عملية الدفع بأمان.",
      paypalButton: "الدفع بواسطة PayPal",
      bankDetailsTitle: "بيانات التحويل الرسمي",
      bankName: "اسم البنك",
      accountNumber: "رقم الحساب",
      branchNumber: "رقم الفرع",
      iban: "رقم الآيبان (IBAN)",
      ibanCopied: "تم نسخ رقم الآيبان بنجاح",
      transferNote: "يرجى تحويل المبلغ المذكور وإرفاق صورة السند عبر واتساب الشركة لتأكيد طلبكم فوراً.",
      confirmWhatsapp: "تأكيد التحويل عبر واتساب",
      verifying: "جاري التحقق...",
      success: "تمت العملية بنجاح"
    },
    accounting: {
      assets: "الأصول المتداولة",
      inventory: "مخزون المنتجات الطازجة",
      receivables: "ذمم العملاء (VIP)",
      cash: "الصندوق / البنك العربي",
      liabilities: "الالتزامات",
      vatOut: "ضريبة القيمة المضافة (15%)",
      equity: "رأس مال شركة نجوم دلتا",
      revenue: "إيرادات المبيعات",
      cogs: "تكلفة البضاعة المباعة",
      expenses: "مصاريف التشغيل واللوجستيات"
    },
    productDetail: {
      back: "الرجوع للمتجر",
      narrative: "وصف المنتج التفصيلي",
      features: "المميزات الفنية",
      benefits: "الفوائد الصحية والقيمة",
      origin: "بلد المنشأ المعتمد",
      supplyPrice: "سعر التوريد النهائي",
      unitPer: "لكل {{unit}}",
      addedToCart: "تمت إضافة الصنف لسلة المشتريات",
      qualityNotice: "إشعار الجودة: يتم فحص هذا المنتج بدقة في مختبراتنا لضمان مطابقته للمواصفات الوطنية والدولية قبل التوريد.",
      reviews: "آراء العملاء",
      reviewsCount: "({{count}} تقييم)",
      guaranteed: "جودة مضمونة ١٠٠٪",
      gradeQuality: "(Institutional Grade Quality)",
      narrativeLabel: "وصف المنتج التفصيلي",
      technicalAttributes: "المميزات الفنية",
      healthBenefits: "الفوائد الصحية والقيمة",
      originLabel: "بلد المنشأ المعتمد",
      supplyPriceLabel: "سعر التوريد النهائي",
      addReview: "أضف تقييمك الخاص",
      yourRating: "تقييمك العام",
      yourComment: "تعليقك",
      commentPlaceholder: "اكتب رأيك هنا...",
      postReview: "إرسال التقييم",
      noReviews: "لا توجد تقييمات بعد",
      thankYou: "شكراً لتقييمك!",
      anonymous: "عميل مجهول"
    },
    wishlist: {
      empty: "قائمة المفضلة فارغة حالياً",
      toCart: "إضافة للسلة"
    },
    adi: {
      title: "المستشار عُدي (Adi)",
      settings: {
        title: "إعدادات المستشار عُدي",
        persona: "شخصية المستشار",
        classic: "كلاسيكي (رسمي)",
        friendly: "ودود (اجتماعي)",
        expert: "خبير (تقني)",
        concise: "مختصر (سريع)",
        save: "تطبيق التغييرات",
        welcome: "يا هلا بك في delta stars. أنا عُدي (Adi)، خبيرك في جودة المنتجات الطازجة. كيف يمكنني دعم عمليات توريدكم اليوم؟ 🍏🛡️"
      },
      chat: {
        placeholder: "استفسر عن أي منتج أو معايير الجودة...",
        thinking: "عُدي يفكر...",
        typing: "عُدي يكتب حالياً...",
        error: "عذراً، جاري تحديث بيانات المستودع.. حاول مجدداً.",
        links: "روابط مفيدة:"
      }
    },
    auth: {
      otp: {
        sentToEmail: "تم إرسال كود التحقق إلى <b>{{email}}</b>",
        placeholder: "أدخل الكود هنا",
        verify: "التحقق من الهوية",
        generatingCode: "جاري توليد الكود الآمن...",
        invalidCode: "الكود غير صحيح",
        successTitle: "تم تحديث كلمة المرور",
        successSubtitle: "يمكنك الآن استخدام كلمة المرور الجديدة للدخول للنظام",
        passwordLengthError: "كلمة المرور قصيرة جداً"
      },
      createNewPassword: "إنشاء كلمة مرور جديدة",
      newPassword: "كلمة المرور الجديدة",
      confirmPassword: "تأكيد كلمة المرور",
      changePasswordButton: "حفظ وتعديل",
      passwordMismatch: "كلمات المرور غير متطابقة"
    },
    warehouse: {
      control: "كنترول المخازن والمناديب",
      reception: "استقبال الطلبات الجديدة",
      prep: "كنترول التجهيز والمخازن",
      dispatch: "كنترول الشحن والتوزيع",
      liveFeed: "بث مباشر",
      processing: "جاري التجهيز",
      ready: "جاهز",
      noNew: "لا توجد طلبات جديدة",
      noPrep: "لا توجد طلبات قيد التجهيز",
      noReady: "لا توجد طلبات جاهزة للشحن",
      accept: "قبول وتجهيز",
      reject: "رفض",
      complete: "اكتمل التجهيز - جاهز للشحن",
      confirmDispatch: "تأكيد الشحن وتسليم المندوب",
      search: "بحث برقم الطلب أو اسم العميل...",
      allBranches: "جميع الفروع",
      activeOrders: "الطلبات النشطة",
      close: "إغلاق الكنترول"
    },
    vip: {
      loading: "جاري تحميل البيانات السيادية...",
      tabs: {
        orders: "طلباتي السيادية",
        tracking: "التتبع المباشر",
        invoices: "السجل المالي",
        contracts: "اتفاقيات التعاقد والتوريد",
        profile: "الأمان والملف"
      },
      welcome: "مرحباً بك في بوابتك السيادية، {{name}}",
      support: {
        title: "الدعم المباشر VIP",
        button: "تحدث مع مدير حسابك"
      },
      stats: {
        cashback: "رصيد الكاش باك",
        debt: "الرصيد المدين",
        processing: "قيد التجهيز",
        total_orders: "إجمالي الطلبات",
        credit_limit: "سقف الائتمان"
      },
      orders: {
        history_title: "سجل العمليات السيادية 📦",
        new_order: "إنشاء طلب جديد +",
        track: "تتبع مباشر"
      },
      tracking: {
        title: "تتبع الرادار للطلب",
        open_map: "فتح الخريطة التفاعلية",
        current_location: "الموقع الحالي",
        truck_status: "الشاحنة المبردة في طريقها إلى مستودعكم",
        no_active: "لا توجد شحنات نشطة",
        no_active_desc: "سيظهر رادار التتبع هنا بمجرد خروج طلبك القادم من مستودعاتنا."
      },
      security: {
        title: "مركز الأمان السيادي",
        subtitle: "إدارة طرق الدخول والتحقق المتقدمة",
        biometric_title: "الدخول بالبصمة / الوجه",
        biometric_desc: "استخدم تقنيات التحقق البيومترية للدخول السريع والآمن دون الحاجة لكود التحقق.",
        activate_now: "تفعيل الآن"
      },
      profile: {
        details: "بيانات الشريك",
        name: "الاسم:",
        company: "الشركة:",
        phone: "رقم الهاتف:"
      }
    },
    footer: {
      about: "عن نجوم دلتا",
      description: "شريكك الأول بين الشركات للفواكه والخضروات عالية الجودة في المملكة العربية السعودية. التزامنا الثابت بالجودة جعلنا المورد المفضل للمؤسسات الكبرى.",
      quickLinks: "روابط سريعة",
      policies: "السياسات",
      contact: "تواصل معنا",
      address: "المملكة العربية السعودية، جدة، حي المنار",
      openInMaps: "فتح الموقع في الخرائط",
      rights: "جميع الحقوق محفوظة.",
      ownership: "حقوق النشر والملكية لشركة نجوم دلتا للتجارة . تم بناء وتطوير المتجر عبر الفريق التقني للشركة",
      systemStatus: "النظام يعمل بكفاءة عالية",
      links: {
        home: "الرئيسية",
        showroom: "صالة العرض",
        products: "منتجاتنا",
        track: "تتبع طلبك",
        contact: "اتصل بنا",
        vip: "بوابة العملاء VIP",
        privacy: "سياسة الخصوصية",
        terms: "الشروط والأحكام",
        shipping: "سياسة الشحن والتوصيل",
        return: "سياسة الاسترجاع"
      }
    }
  },
  en: {
    common: {
      currency: "SAR",
      loading: "Processing...",
      error: "An error occurred, please try again",
      save: "Save Changes",
      cancel: "Cancel",
      delete: "Delete",
      confirm: "Confirm",
      back: "Go Back",
      search: "Search for premium products...",
      id: "Reference ID",
      status: "Current Status",
      date: "Process Date",
      amount: "Total Amount",
      actions: "Control Options",
      view: "View Details",
      edit: "Edit Data",
      all: "All Categories",
      ok: "OK",
      close: "Close Window",
      add: "Add Item",
      update: "Update Inventory",
      unit: "Unit",
      price: "Price",
      total: "Total",
      logout: "Log Out",
      logout_emoji: "Log Out 🚪",
      active: "Active",
      inactive: "Inactive",
      verified: "Verified",
      statuses: {
        pending: "Processing",
        delivered: "Delivered",
        cancelled: "Cancelled",
        shipped: "Shipped",
        confirmed: "Confirmed"
      },
      units: {
        kg: "Kg",
        half_kg: "0.5 Kg (500g)",
        bundle: "Bundle",
        packet: "Packet",
        piece: "Piece",
        box: "Box / Carton"
      }
    },
    header: {
      storeName: "Delta Stars",
      storeTitle: "Delta Stars | Your Ideal Partner for High-Quality Vegetables, Fruits & Dates",
      adminGate: "Sovereign Management Portal",
      aiSupportActive: "AI-Managed Tech Support Active",
      myAccount: "My Account",
      login: "Login",
      utility: {
        install: "Install App",
        version: "Elite Supply Node v62.0",
        diamondEdition: "Sovereign Diamond Edition"
      },
      navLinks: {
        home: "Home",
        products: "Market",
        showroom: "Showroom",
        wishlist: "Wishlist",
        dashboard: "Command Center",
        vipPortal: "VIP Clients Portal",
        trackOrder: "Track Order",
        adi: "Adi AI Assistant",
        privacy: "Privacy Policy",
        terms: "Terms & Conditions",
        returns: "Return Policy",
        driverDashboard: "Driver Portal",
        contact: "Contact Us",
        trackOrderPage: "Track Order Status"
      }
    },
    contact: {
      title: "Contact Us",
      subtitle: "We are here to serve you and meet your needs. Feel free to contact us through any of the following channels.",
      callUs: "Call Us",
      whatsapp: "WhatsApp",
      email: "Email",
      location: "Location",
      businessHours: "Business Hours",
      satThu: "Sat - Thu",
      friday: "Friday",
      sendMessage: "Send us a Message",
      fullName: "Full Name",
      phone: "Phone Number",
      subject: "Subject",
      message: "Message",
      submit: "Send Message",
      success: "Your message has been sent successfully. We will contact you soon.",
      placeholders: {
        name: "Enter your name",
        help: "How can we help you?"
      },
      subjects: {
        general: "General Inquiry",
        special: "Special Request",
        complaint: "Complaint or Suggestion",
        partnership: "Business Partnership"
      }
    },
    checkout: {
      steps: {
        details: "Customer Details",
        otp: "Verification",
        payment: "Payment",
        success: "Success"
      },
      minOrderError: "Sorry, minimum order is 50 SAR to ensure supply quality and integrity.",
      phoneStep: "Phone Verification",
      phonePlaceholder: "05XXXXXXXX",
      sendCode: "Send Verification Code",
      otpStep: "Digital Identity Confirmation",
      otpPlaceholder: "Enter Code",
      verifyCode: "Verify & Confirm",
      addressStep: "Detailed Location & Delivery Info",
      city: "City / Region",
      district: "District",
      street: "Main / Sub Street Name",
      phoneVerificationSubtitle: "Please enter your mobile number to receive a digital verification code to activate your order",
      otpSubtitle: "Enter the 4-digit code to confirm your identity",
      changePhone: "Change Mobile Number?",
      addressSubtitle: "Please register logistic location data accurately",
      confirmAddress: "Confirm Address and Proceed to Payment 🚚",
      sendingOtp: "Sending...",
      resendOtp: "Resend in {{timer}}s",
      verifyingOtp: "Verifying...",
      locationType: "Location Type",
      house: "House / Private Villa",
      mall: "Shopping Mall",
      market: "Public Market / Shop",
      buildingName: "Building Name / No.",
      unitNumber: "Apt / Office / Shop No.",
      paymentStep: "Payment & Financial Collection",
      onlinePayment: "Credit Card (Visa / Mada / MC)",
      bankTransfer: "Official Bank Transfer (ANB)",
      bankDetails: "Bank Account Details for Payment",
      cod: "Cash on Delivery (Cash to Agent)",
      completeOrder: "Finalize Order",
      securityNote: "✓ Buyer Protection Active - Digitally Verified Real Order"
    },
    home: {
      hero: {
        quality_label: "Sovereign Premium Quality",
        headline: "Delta Stars",
        description: "Your Ideal Partner for High-Quality Vegetables, Fruits and Dates",
        button: "Browse Products 🛒",
        vipButton: "VIP Clients Portal 🤝",
        slogan: "Delta Stars | Your Ideal Partner for High-Quality Vegetables, Fruits & Dates"
      },
      categories: {
        title: "Our Specialized Categories",
        subtitle: "Browse our fresh products by category"
      },
      partners: {
        title: "We Value Your Trust",
        partners_label: "Quality & Institutional Excellence Partners",
        subtitle: "Proud to be the first and trusted partner for major food institutions in the Kingdom of Saudi Arabia"
      },
      stats: {
        coverage: { title: "Comprehensive Coverage", desc: "We serve cities where our branches are located in Saudi Arabia to ensure maximum quality." },
        quality: { title: "Superior Quality", desc: "We are committed to the highest international quality standards in selecting and supplying our products." },
        delivery: { title: "Fast Delivery", desc: "A refrigerated fleet ensures products arrive fresh and in the fastest time." }
      },
      about: {
        title: "Your Ideal Partner for High-Quality Vegetables, Fruits & Dates",
        desc: "Discover excellence with Delta Stars, the premier distributor of vegetables and fruits in the Saudi market. Our unwavering commitment to quality has made us the preferred supplier for a wide range of institutions including restaurants, hotels, catering services, major markets, and hospitals.",
        features: {
          organic: "Organic Products",
          dates: "Premium Dates",
          import: "Direct Import",
          support: "24/7 Tech Support"
        },
        experience: "Years of Experience"
      },
      channels: {
        title: "Our Digital Channels",
        subtitle: "Follow all that's new and our exclusive offers via our interactive platforms",
        adLabel: "Promotional Ad"
      },
      lounges: {
        title: "delta stars Communities",
        subtitle: "Direct and Exclusive Access to Daily Offers",
        whatsapp: {
          title: "WhatsApp Community",
          desc: "Join our community to receive daily offers and updated prices immediately.",
          button: "Join Now"
        },
        telegram: {
          title: "Telegram Channel",
          desc: "Comprehensive coverage of new products and quality reports from the heart of our warehouses.",
          button: "Follow Channel"
        }
      }
    },
    showroom: {
      title: "Promotional Showroom",
      searchPlaceholder: "Search for a product...",
      priceLabel: "Final Price",
      orderNow: "Order Now 🚀",
      featured: "Featured ⭐",
      price: "Price",
      refId: "Reference ID",
      itemNumber: "Item No.",
      qualitySeal: "High Quality Standard",
      showMore: "Show More Products",
      origin: "Origin",
      nutrition: "Nutritional Value",
      features: "Features",
    },
    dashboard: {
      title: "Command Center",
      subtitle: "delta stars Trading Co.",
      stats: {
        sales: "Total Realized Sales",
        lowStock: "Items Needing Restock",
        pending: "Orders Awaiting Approval"
      },
      sections: {
        admin: { title: "Admin & Accounting", desc: "Financial Reports & Sovereign Decisions" },
        marketing: { title: "Marketing & Pricing", desc: "Promotions, Products & Price Management" },
        ops: { title: "Operations & Logistics", desc: "Fleet Tracking & Live Inventory" },
        dev: { title: "Developer Console", desc: "Code Updates & Security Systems" }
      }
    },
    categories: {
      fruits: "Fruits",
      vegetables: "Vegetables",
      herbs: "Herbs",
      qassim: "Qassim Products",
      dates: "Dates",
      packages: "Packages",
      seasonal: "Seasonal Products",
      nuts: "Nuts",
      flowers: "Flowers & Gifts",
      imported: "Imported Produce"
    },
    products: {
      title: "Fresh Products Market",
      subtitle: "We select the best from national and international farms with extreme care",
      searchPlaceholder: "What are you looking for today?",
      noResults: "No results matching your request",
      allCategories: "All Categories",
      sort: {
        default: "Default Sort",
        priceAsc: "Price: Low to High",
        priceDesc: "Price: High to Low",
        newest: "Newest Arrivals",
        stock: "Stock Availability (Highest First)"
      },
      certifiedCatalog: "Catalog of 235 Certified Items"
    },
    cart: {
      title: "Shopping Cart",
      empty: "Your cart is empty, start shopping now",
      clear: "Clear Cart",
      continueShopping: "Continue Shopping",
      summary: "Order & Accounting Summary",
      items_value: "Products Value",
      vat: "VAT (15%)",
      shippingFee: "Shipping Fee",
      free: "Free",
      cashbackEarned: "Cashback Earned",
      grandTotalLabel: "Grand Total",
      finalizeCheckout: "Finalize Order",
      qualityPledge: "Our commitment to quality starts with your cart",
      couponCodeLabel: "Coupon Code",
      apply: "Apply",
      discount: "Discount",
      deliveryFeeLabel: "Shipping Fee",
      freeLabel: "Free",
      cashbackEarnedLabel: "Cashback Earned",
      invalidCoupon: "Invalid coupon",
      minOrderCoupon: "Min order for this coupon is {{min}}",
      couponApplied: "Coupon applied successfully",
      identityVerified: "Welcome back, identity verified",
      validPhoneRequired: "Valid phone required",
      otpSent: "OTP sent successfully",
      otpFailed: "Failed to send OTP",
      verifiedSuccess: "Verified successfully",
      invalidCode: "Invalid code",
      verificationError: "Verification error",
      orderFailed: "Failed to create order",
      redirectDashboard: "Redirecting to Dashboard to track order",
      redirectTrack: "Redirecting to order tracking",
      bankInfo: {
        bank: "Bank",
        branch: "Branch",
        idNo: "ID No",
        accountName: "Account Name",
        accountNumber: "Account Number",
        iban: "IBAN",
        transferInstruction: "Please transfer the amount and send the receipt via WhatsApp to confirm your order"
      },
      deliveryMode: {
        title: "Select Delivery Method",
        subtitle: "We ensure your order arrives in perfect condition",
        standard: "Standard Delivery",
        express: "Express Delivery",
        scheduled: "Scheduled Delivery",
        within24h: "Within 24h",
        within2h: "Within 2h",
        pickTime: "Pick your time",
        confirm: "Confirm Delivery Method"
      },
      paymentOptions: {
        creditCard: "Credit Card",
        bankTransfer: "Bank Transfer",
        paypal: "PayPal",
        cod: "Cash on Delivery",
        selectCredit: "Choose Credit Card",
        selectBank: "Choose Bank Transfer",
        selectPaypal: "Choose PayPal",
        selectCod: "Confirm Cash on Delivery",
        safePaypal: "Fast and safe via PayPal",
        codDesc: "Pay cash when order arrives"
      },
      checkout: {
          successTitle: "Order Received Successfully",
          successSubtitle: "Our logistics team is now preparing your order with the highest quality standards",
          orderId: "Your Order Reference",
          whatsappConfirmation: "Confirm via WhatsApp",
          backToStore: "Back to Market",
          whatsappConfirmationMessage: "Hello delta stars, I want to confirm my order #{{orderId}} with total {{formattedTotal}}."
      }
    },
    trackOrder: {
      title: "Track Your Order",
      subtitle: "Watch your order travel from our farms to your door",
      placeholder: "Enter Order ID (e.g. ORD-123)",
      search: "Search",
      initializing: "Tracking System Initializing",
      apiKeyMissing: "Please add Google Maps API key in .env file to enable real-time map tracking.",
      steps: {
        prep: "Preparing Order",
        shipping: "Out for Delivery",
        delivered: "Delivered"
      },
      realtime: "Real-time Tracking",
      driver: "Driver",
      onTheWay: "Your order is on the way!",
      updating: "Updating in real-time"
    },
    admin: {
      liveConsole: {
        title: "Live Order Console",
        awaiting: "Awaiting Confirmation",
        noNew: "No new orders at the moment",
        accept: "Accept & Process",
        reject: "Reject",
        inPrep: "Orders in Preparation",
        noPrep: "No orders in preparation",
        contents: "Order Contents:",
        ready: "Ready - Send to Driver 🚚"
      },
      userManagement: {
        title: "User Access Control",
        userUpdated: "User role updated",
        updateFailed: "Update failed",
        permissionsUpdated: "Permissions updated",
        loading: "Loading user database...",
        headers: {
          user: "User",
          role: "Role",
          permissions: "Granted Permissions"
        },
        roles: {
          client: "Client",
          vip: "VIP",
          marketing: "Marketing",
          admin: "Admin",
          ops: "Operations",
          delegate: "Delegate",
          developer: "Developer"
        },
        permissions: {
          receive_orders: "Receive Orders",
          manage_prices: "Manage Prices",
          manage_ads: "Manage Ads",
          view_reports: "View Reports",
          manage_inventory: "Manage Inventory",
          manage_products: "Manage Products",
          manage_categories: "Manage Categories",
          manage_units: "Manage Units",
          manage_branches: "Manage Branches",
          manage_coupons: "Manage Coupons",
          manage_showroom: "Manage Showroom",
          manage_legal: "Manage Legal",
          manage_notifications: "Manage Notifications",
          view_ai_insights: "View AI Insights",
          manage_accounting: "Manage Accounting"
        }
      },
      shipment: {
        title: "Purchase & Import Management 🚢",
        subtitle: "Track international & local shipments and suppliers",
        add: "Add New Shipment",
        active: "Active Shipments",
        arrivingToday: "Arriving Today",
        totalSuppliers: "Total Suppliers",
        listTitle: "Ongoing Shipments",
        searchPlaceholder: "Search by Shipment ID...",
        headers: {
          id: "Shipment ID",
          supplier: "Supplier",
          items: "Items",
          eta: "Expected ETA",
          status: "Status",
          tracking: "Tracking"
        }
      },
      dev: {
        title: "Developer Ops Center",
        publish: "Publish Updates",
        sysStatus: "System Status",
        version: "App Version",
        latency: "Latency",
        serverStatus: "Server Status",
        online: "Online",
        opsLog: "Technical Ops Log",
        advancedTools: "Advanced Control Tools",
        tools: {
          deepSettings: "Deep Settings",
          firewall: "Firewall",
          backup: "Backup",
          cache: "Clear Cache"
        }
      }
    },
    payment: {
      portalTitle: "Sovereign Payment Portal",
      totalDue: "Total Due Amount",
      selectMethod: "Select Payment Method",
      creditCard: "Credit Card",
      mada: "Mada",
      bankIBAN: "Bank Transfer (IBAN)",
      backToMethods: "Back to Methods",
      confirmSecure: "Confirm Secure Payment",
      paypalRedirect: "Redirecting to PayPal for secure payment.",
      paypalButton: "Pay with PayPal",
      bankDetailsTitle: "Official Transfer Details",
      bankName: "Bank Name",
      accountNumber: "Account Number",
      branchNumber: "Branch Number",
      iban: "IBAN",
      ibanCopied: "IBAN copied successfully",
      transferNote: "Please transfer the amount and send receipt via WhatsApp to confirm immediately.",
      confirmWhatsapp: "Confirm Transfer via WhatsApp",
      verifying: "Verifying...",
      success: "Transaction Successful"
    },
    accounting: {
      assets: "Current Assets",
      inventory: "Fresh Products Inventory",
      receivables: "Customer Receivables (VIP)",
      cash: "Cash / ANB Bank",
      liabilities: "Liabilities",
      vatOut: "VAT (15%)",
      equity: "Delta Stars Capital",
      revenue: "Sales Revenue",
      cogs: "COGS",
      expenses: "Ops & Logistics Expenses"
    },
    productDetail: {
      back: "Back to Market",
      narrative: "Detailed Product Narrative",
      features: "Technical Features",
      benefits: "Health Benefits & Value",
      origin: "Certified Origin",
      supplyPrice: "Final Supply Price",
      unitPer: "per {{unit}}",
      addedToCart: "Added to cart successfully",
      qualityNotice: "Quality Notice: This product is strictly inspected in our labs before supply.",
      reviews: "Customer Reviews",
      reviewsCount: "({{count}} reviews)",
      guaranteed: "100% Guaranteed Quality",
      gradeQuality: "(Institutional Grade Quality)",
      narrativeLabel: "Detailed Product Narrative",
      technicalAttributes: "Technical Attributes",
      healthBenefits: "Health Benefits & Value",
      originLabel: "Certified Origin",
      supplyPriceLabel: "Final Supply Price",
      addReview: "Leave a Review",
      yourRating: "Your Rating",
      yourComment: "Your Comment",
      commentPlaceholder: "Write your thoughts here...",
      postReview: "Post Review",
      noReviews: "No reviews yet",
      thankYou: "Thank you for your review!",
      anonymous: "Anonymous Customer"
    },
    wishlist: {
      empty: "Your wishlist is currently empty",
      toCart: "Add to Cart"
    },
    adi: {
      title: "Adi AI Advisor",
      settings: {
        title: "Adi AI Settings",
        persona: "Advisor Persona",
        classic: "Classic (Formal)",
        friendly: "Friendly (Social)",
        expert: "Expert (Technical)",
        concise: "Concise (Fast)",
        save: "Apply Changes",
        welcome: "Welcome to delta stars. I am Adi, your expert in fresh produce quality. How can I support your supply chain today? 🍏🛡️"
      },
      chat: {
        placeholder: "Ask about quality or products...",
        thinking: "Adi is thinking...",
        typing: "Adi is typing...",
        error: "Warehouse sync in progress.. please try again.",
        links: "Useful Links:"
      }
    },
    auth: {
      otp: {
        sentToEmail: "Verification code sent to <b>{{email}}</b>",
        placeholder: "Enter code here",
        verify: "Verify Identity",
        generatingCode: "Generating secure code...",
        invalidCode: "Invalid code provided",
        successTitle: "Password Updated",
        successSubtitle: "You can now use your new password to access the system",
        passwordLengthError: "Password is too short"
      },
      createNewPassword: "Create New Password",
      newPassword: "New Password",
      confirmPassword: "Confirm Password",
      changePasswordButton: "Save & Apply",
      passwordMismatch: "Passwords do not match"
    },
    warehouse: {
      control: "Warehouse & Delegate Control",
      reception: "New Order Reception",
      prep: "Warehouse Prep Control",
      dispatch: "Dispatch & Logistics Control",
      liveFeed: "Live Feed",
      processing: "Processing",
      ready: "Ready",
      noNew: "No new orders",
      noPrep: "No orders in preparation",
      noReady: "No orders ready for dispatch",
      accept: "Accept & Process",
      reject: "Reject",
      complete: "Prep Complete - Ready for Ship",
      confirmDispatch: "Confirm Dispatch to Driver",
      search: "Search by Order ID or Customer...",
      allBranches: "All Branches",
      activeOrders: "Active Orders",
      close: "Close Control"
    },
    vip: {
      loading: "Loading Sovereign Data...",
      tabs: {
        orders: "My Sovereign Orders",
        tracking: "Live Tracking",
        invoices: "Financial History",
        contracts: "Supply Agreements",
        profile: "Security & Profile"
      },
      welcome: "Welcome to your sovereign portal, {{name}}",
      support: {
        title: "VIP Direct Support",
        button: "Chat with Account Manager"
      },
      stats: {
        cashback: "Cashback Balance",
        debt: "Debit Balance",
        processing: "Processing",
        total_orders: "Total Orders",
        credit_limit: "Credit Limit"
      },
      orders: {
        history_title: "Sovereign Operations History 📦",
        new_order: "Create New Order +",
        track: "Live Track"
      },
      tracking: {
        title: "Order Radar Tracking",
        open_map: "Open Interactive Map",
        current_location: "Current Location",
        truck_status: "Refrigerated truck is on its way to your warehouse",
        no_active: "No active shipments",
        no_active_desc: "Tracking radar will appear here once your next order leaves our warehouses."
      },
      security: {
        title: "Sovereign Security Center",
        subtitle: "Manage advanced entry and verification methods",
        biometric_title: "Fingerprint / Face Unlock",
        biometric_desc: "Use biometric verification techniques for fast and secure access without needs for code.",
        activate_now: "Activate Now"
      },
      profile: {
        details: "Partner Details",
        name: "Name:",
        company: "Company:",
        phone: "Phone:"
      }
    },
    footer: {
      about: "About Delta Stars",
      description: "Your premier B2B partner for high-quality fruits and vegetables in Saudi Arabia. Our unwavering commitment to quality has made us the supplier of choice for major institutions.",
      quickLinks: "Quick Links",
      policies: "Policies",
      contact: "Contact Us",
      address: "Saudi Arabia, Jeddah, Al Manar District",
      openInMaps: "Open Location in Maps",
      rights: "All Rights Reserved.",
      ownership: "Copyright and ownership by Delta Stars Trading Co. Store built and developed by the company's technical team",
      systemStatus: "System operating with high efficiency",
      links: {
        home: "Home",
        showroom: "Showroom",
        products: "Our Products",
        track: "Track Your Order",
        contact: "Contact Us",
        vip: "VIP Customer Portal",
        privacy: "Privacy Policy",
        terms: "Terms & Conditions",
        shipping: "Shipping & Delivery Policy",
        return: "Return Policy"
      }
    }
  }
};
