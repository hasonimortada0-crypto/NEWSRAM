import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  Sun, 
  Cpu, 
  Wind, 
  Cable, 
  ShoppingCart, 
  Search, 
  Bot, 
  Sparkles, 
  Phone, 
  ShieldCheck, 
  Truck, 
  X, 
  Clock, 
  QrCode,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Camera,
  Home,
  LayoutGrid,
  Heart,
  ShoppingBag,
  User,
  Menu,
  Bell
} from 'lucide-react';
import { Product, CartItem } from './types';
import { PRODUCTS, CATEGORIES, USD_TO_IQD } from './data';
import ProductCard from './components/ProductCard';
import AIAdvisor from './components/AIAdvisor';
import AdminPanel from './components/AdminPanel';
import ShoppingModals from './components/ShoppingModals';
// @ts-ignore
import newsramLogo from './assets/images/newsram_main_logo_1783357135473.jpg';

const normalizePhone = (phone: string): string => {
  if (!phone) return "";
  let str = phone.toString().trim();
  
  // Convert Eastern Arabic/Persian digits to English digits
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  const persianDigits = "۰۱۲۳۴۵۶٧٨٩";
  for (let i = 0; i < 10; i++) {
    str = str.replace(new RegExp(arabicDigits[i], "g"), i.toString());
    str = str.replace(new RegExp(persianDigits[i], "g"), i.toString());
  }
  
  // Remove non-numeric characters
  const digits = str.replace(/\D/g, "");
  return digits;
};

export default function App() {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isAdvisorOpen, setIsAdvisorOpen] = useState<boolean>(false);
  const [showNotification, setShowNotification] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(16);

  // Favorites state synced with localStorage
  const [favoritedIds, setFavoritedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('newsram_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleToggleFavorite = (id: string) => {
    setFavoritedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem('newsram_favorites', JSON.stringify(next));
      triggerNotification(prev.includes(id) ? "تمت إزالة السلعة من المفضلة عيوني 💔" : "تمت إضافة السلعة إلى المفضلة عيوني ❤️");
      return next;
    });
  };

  // Store Configuration state
  const [storeConfig, setStoreConfig] = useState<{ 
    heroImage?: string; 
    slide1?: string; 
    slide2?: string; 
    slide3?: string; 
    slogan?: string;
    rate?: number;
  }>({ heroImage: "", slide1: "", slide2: "", slide3: "", slogan: "", rate: USD_TO_IQD });

  const currentExchangeRate = storeConfig.rate || USD_TO_IQD;
  const [isUploadingHero, setIsUploadingHero] = useState<boolean>(false);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isUploadingSlide, setIsUploadingSlide] = useState<{ [key: number]: boolean }>({});

  // Orders state
  const [orders, setOrders] = useState<any[]>([]);

  // Customer tracking order states
  const [isTrackingOpen, setIsTrackingOpen] = useState<boolean>(false);
  const [trackingPhone, setTrackingPhone] = useState<string>('');
  const [trackedOrders, setTrackedOrders] = useState<any[]>([]);
  const [hasSearchedTracking, setHasSearchedTracking] = useState<boolean>(false);

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'zain' | 'asia' | 'card'>('cod');

  // Admin states
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminRole, setAdminRole] = useState<'admin' | 'sales' | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState<boolean>(false);
  
  // External product control states (for Edit/Delete actions clicked from the main page grid)
  const [externalProductToEdit, setExternalProductToEdit] = useState<Product | null>(null);
  const [externalProductToDelete, setExternalProductToDelete] = useState<Product | null>(null);

  // Mobile Direct Access states
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const getAppUrl = () => {
    return "https://newsram-155224210798.europe-west3.run.app";
  };

  // Toast Notification Trigger
  const triggerNotification = (message: string) => {
    setShowNotification(message);
    setTimeout(() => {
      setShowNotification(null);
    }, 3000);
  };

  // Load products dynamically
  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setProducts(data);
        }
      }
    } catch (error) {
      console.error("Error fetching dynamic products, using fallback:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Sync admin authentication and dialog closing to keep admin panel open
  useEffect(() => {
    if (isAdminAuthenticated && showPasswordDialog) {
      setShowPasswordDialog(false);
      setIsAdminOpen(true);
    }
  }, [isAdminAuthenticated, showPasswordDialog]);

  // Load config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const data = await response.json();
          if (data) {
            setStoreConfig(data);
          }
        }
      } catch (error) {
        console.error("Error loading config:", error);
      }
    };
    fetchConfig();
  }, []);

  // Fetch orders from database
  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setOrders(data);
        }
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('newsram_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Automatically advance hero banner slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === 2 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Reset visible products count when category or search query changes
  useEffect(() => {
    setVisibleCount(16);
  }, [selectedCategory, searchQuery]);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('newsram_cart', JSON.stringify(newCart));
  };

  const handleAddToCart = (product: Product) => {
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    let updatedCart: CartItem[] = [];

    if (existingIndex > -1) {
      updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
    } else {
      updatedCart = [...cart, { product, quantity: 1 }];
    }

    saveCart(updatedCart);
    triggerNotification(`تمت إضافة ${product.name} إلى السلة! 🛒`);
  };

  const handleUpdateQuantity = (productId: string, amount: number) => {
    const updatedCart = cart.map((item) => {
      if (item.product.id === productId) {
        const newQty = item.quantity + amount;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as CartItem[];

    saveCart(updatedCart);
  };

  const handleRemoveFromCart = (productId: string) => {
    const updatedCart = cart.filter((item) => item.product.id !== productId);
    saveCart(updatedCart);
  };

  // Copy link action helper
  const fallbackCopyTextToClipboard = (text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        triggerNotification("تم نسخ الرابط العام للمتجر بنجاح عيوني! يمكنك الآن مشاركته مباشرة.");
      } else {
        triggerNotification("عذراً، يرجى نسخ الرابط يدوياً من الأسفل عيوني.");
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      triggerNotification("عذراً، يرجى نسخ الرابط يدوياً من الأسفل عيوني.");
    }
  };

  const handleCopyLink = () => {
    const linkToCopy = getAppUrl();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(linkToCopy).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        triggerNotification("تم نسخ رابط متجر NEWSRAM بنجاح! يمكنك الآن فتحه في جوجل أو سفاري أو مشاركته.");
      }).catch(err => {
        console.warn('Navigator clipboard failed, trying fallback:', err);
        fallbackCopyTextToClipboard(linkToCopy);
      });
    } else {
      fallbackCopyTextToClipboard(linkToCopy);
    }
  };

  // Track customer order by phone number
  const handleTrackOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!trackingPhone) {
      triggerNotification("يرجى إدخال رقم الهاتف أولاً عيوني!");
      return;
    }
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const allOrders = await response.json();
        const cleanTrack = normalizePhone(trackingPhone);
        const filtered = allOrders.filter((o: any) => {
          const cleanOrder = normalizePhone(o.customerPhone || '');
          if (!cleanTrack || !cleanOrder) return false;
          
          // Match by last 9 digits (handles country codes and leading zero issues perfectly)
          const suffixTrack = cleanTrack.slice(-9);
          const suffixOrder = cleanOrder.slice(-9);
          if (suffixTrack.length >= 9 && suffixOrder.length >= 9) {
            return suffixTrack === suffixOrder;
          }
          
          return cleanOrder.includes(cleanTrack) || cleanTrack.includes(cleanOrder);
        });
        setTrackedOrders(filtered);
        setHasSearchedTracking(true);
      } else {
        triggerNotification("فشل جلب الطلبات، يرجى المحاولة لاحقاً.");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("حدث خطأ أثناء تحميل حالة الطلبات.");
    }
  };

  // Submit checkout, save to database and send formatted message to WhatsApp
  const handleWhatsAppCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !customerAddress) {
      triggerNotification("يرجى ملء جميع حقول التوصيل المطلوبة عيوني!");
      return;
    }

    let paymentMethodName = '';
    let paymentInstructions = '';
    switch (paymentMethod) {
      case 'cod':
        paymentMethodName = 'الدفع عند الاستلام المحلي (نقداً)';
        paymentInstructions = 'يتم تسليم المبلغ يدوياً بالدينار العراقي أو الدولار لمندوب التوصيل عند استلام وتدقيق المنتجات.';
        break;
      case 'zain':
        paymentMethodName = 'زين كاش (Zain Cash)';
        paymentInstructions = 'تم اختيار الدفع مقدمًا عبر زين كاش للرقم: 07866080020 (يرجى إرسال لقطة شاشة للتحويل).';
        break;
      case 'asia':
        paymentMethodName = 'آسيا حوالة (AsiaCell)';
        paymentInstructions = 'تم اختيار الدفع مقدمًا عبر رصيد/حوالة آسيا سيل للرقم: 07866080020.';
        break;
      case 'card':
        paymentMethodName = 'بطاقة ماستركارد / فيزا (Mastercard/Visa)';
        paymentInstructions = 'يرجى تزويدي برابط الدفع الإلكتروني السريع أو معلومات بطاقة الماستر كارد.';
        break;
    }

    const cartTotalUSD = cart.reduce((acc, item) => acc + (item.product.priceUSD * item.quantity), 0);
    const cartTotalIQD = cartTotalUSD * currentExchangeRate;

    let messageText = `*طلب شراء جديد - متجر NEWSRAM ⚡*\n\n`;
    messageText += `👤 *معلومات الزبون للطلب والتوصيل:*\n`;
    messageText += `• *الاسم الكامل:* ${customerName}\n`;
    messageText += `• *رقم الهاتف العراقي:* ${customerPhone}\n`;
    messageText += `• *العنوان / موقع السكن:* ${customerAddress}\n\n`;
    messageText += `💳 *طريقة الدفع المختارة:* ${paymentMethodName}\n`;
    messageText += `📝 *تعليمات الدفع:* ${paymentInstructions}\n\n`;
    messageText += `🛒 *قائمة المنتجات المطلوبة:*\n`;

    cart.forEach((item, index) => {
      const itemTotalUSD = item.product.priceUSD * item.quantity;
      const itemTotalIQD = itemTotalUSD * currentExchangeRate;
      messageText += `${index + 1}. *${item.product.name}*\n   العدد: ${item.quantity} × ${(item.product.priceUSD * currentExchangeRate).toLocaleString()} د.ع\n`;
    });

    messageText += `\n------------------------------------\n`;
    messageText += `*المجموع الإجمالي:* ${cartTotalIQD.toLocaleString()} د.ع\n`;
    messageText += `------------------------------------\n\n`;
    messageText += `يرجى تأكيد هذا الطلب وبدء عملية التجهيز والشحن عيوني. شكراً لكم!`;

    const encodedText = encodeURIComponent(messageText);
    const whatsappUrl = `https://wa.me/9647866080020?text=${encodedText}`;

    // Send order to backend server
    const orderData = {
      customerName,
      customerPhone,
      customerAddress,
      paymentMethod,
      items: cart.map(item => ({
        id: item.product.id,
        name: item.product.name,
        englishName: item.product.englishName,
        priceUSD: item.product.priceUSD,
        quantity: item.quantity
      })),
      totalUSD: cartTotalUSD,
      totalIQD: cartTotalIQD
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      if (response.ok) {
        await fetchOrders(); // refresh order state safely
      }
    } catch (err) {
      console.error("Failed to save order to server:", err);
    }

    try {
      const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        window.location.href = whatsappUrl;
      }
    } catch (e) {
      console.warn("Popup blocked, redirecting directly:", e);
      window.location.href = whatsappUrl;
    }
    
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
    saveCart([]); // Clear cart
    triggerNotification("تم إرسال الطلب وحفظه بنجاح! تم تحويلك للواتساب للتأكيد الفوري.");
  };

  // Open the Admin section
  const handleAdminButtonClick = () => {
    if (isAdminAuthenticated) {
      setIsAdminOpen(true);
    } else {
      setShowPasswordDialog(true);
    }
  };

  // Image Upload helper for setting hero banner
  const handleHeroImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        triggerNotification("عذراً، يرجى اختيار ملف صورة صحيح.");
        return;
      }
      setIsUploadingHero(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
            
            const updatedConfig = { ...storeConfig, heroImage: compressedBase64 };
            try {
              const res = await fetch('/api/config', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedConfig)
              });
              if (res.ok) {
                setStoreConfig(updatedConfig);
                triggerNotification("تم تحديث وحفظ الصورة الرئيسية للمعرض بنجاح! 📸🎉");
              } else {
                triggerNotification("فشل حفظ الصورة على الخادم.");
              }
            } catch (err) {
              console.error(err);
              triggerNotification("حدث خطأ أثناء حفظ الصورة الرئيسية.");
            }
          }
          setIsUploadingHero(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Image Upload helper for setting specific slider image (1, 2, or 3)
  const handleSlideImageUpload = (slideIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        triggerNotification("عذراً، يرجى اختيار ملف صورة صحيح.");
        return;
      }
      setIsUploadingSlide(prev => ({ ...prev, [slideIndex]: true }));
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
            
            const updatedConfig = { 
              ...storeConfig, 
              [`slide${slideIndex}`]: compressedBase64 
            };

            try {
              const res = await fetch('/api/config', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedConfig)
              });
              if (res.ok) {
                setStoreConfig(updatedConfig);
                triggerNotification(`تم تحديث وحفظ صورة الشريحة ${slideIndex} بنجاح! 📸🎉`);
              } else {
                triggerNotification("فشل حفظ صورة الشريحة على الخادم.");
              }
            } catch (err) {
              console.error(err);
              triggerNotification("حدث خطأ أثناء حفظ صورة الشريحة.");
            }
          }
          setIsUploadingSlide(prev => ({ ...prev, [slideIndex]: false }));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle smooth scroll & category selection from visual category cards
  const handleCategoryClick = (catId: string) => {
    setSelectedCategory(catId);
    setTimeout(() => {
      const element = document.getElementById("products-catalog");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  // Mapping dynamic categories to Lucide icons
  const renderCategoryIcon = (iconName: string) => {
    const iconClass = "w-4 h-4 shrink-0";
    switch (iconName) {
      case 'Lightbulb': return <Lightbulb className={iconClass} />;
      case 'Sun': return <Sun className={iconClass} />;
      case 'Cpu': return <Cpu className={iconClass} />;
      case 'Wind': return <Wind className={iconClass} />;
      case 'Cable': return <Cable className={iconClass} />;
      default: return <Lightbulb className={iconClass} />;
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'all' 
      ? true 
      : selectedCategory === 'favorites' 
        ? favoritedIds.includes(product.id)
        : product.category === selectedCategory;
    const matchesSearch = (product.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (product.englishName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (product.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const slides = [
    {
      id: 1,
      image: storeConfig.slide1 || "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=1200&q=80",
      title: "إنارة داخلية فاخرة",
      subtitle: "ثريات ملكية وسبوتات ذكية تضيء منزلك بأناقة ✨"
    },
    {
      id: 2,
      image: storeConfig.slide2 || "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1200&q=80",
      title: "مفاتيح ذكية عصرية",
      subtitle: "تحكم كامل بإنارة بيتك بلمسة واحدة أو عبر الهاتف 📱"
    },
    {
      id: 3,
      image: storeConfig.slide3 || "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1200&q=80",
      title: "إنارة خارجية وهندسية مقاومة",
      subtitle: "تصاميم تتحمل كافة الظروف الجوية لجمال يدوم ☔"
    }
  ];

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="w-full min-h-[100dvh] bg-gradient-to-b from-[#FAF8ED] via-[#F5E6BD] to-[#DFB13C] text-stone-900 flex flex-col antialiased selection:bg-[#DFB13C]/40 selection:text-stone-950 pb-16 md:pb-0 overflow-x-hidden" dir="rtl">
      
      {/* Cohesive Luxury Ambient Background Halo */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Soft golden light glow in the top-right */}
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-yellow-400/40 blur-[120px] animate-pulse duration-[10000ms]" />
        {/* Soft warm light glow in the bottom-left */}
        <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] rounded-full bg-amber-500/35 blur-[120px] animate-pulse duration-[8000ms]" />
        {/* Center glowing golden-yellow spot */}
        <div className="absolute top-1/3 left-1/4 w-[450px] h-[450px] rounded-full bg-yellow-300/30 blur-[100px] animate-pulse duration-[12000ms]" />
        {/* Luxury subtle pattern lines or light circles */}
        <div className="absolute inset-0 bg-[radial-gradient(#b45309_2px,transparent_2px)] [background-size:24px_24px] opacity-[0.05]" />
      </div>

      {/* Toast Notification */}
      {showNotification && (
        <div className="fixed bottom-20 md:bottom-6 left-6 z-50 bg-white text-stone-900 px-5 py-3 rounded-xl shadow-2xl border border-amber-500/30 flex items-center gap-3 animate-fade-in">
          <div className="p-1 bg-amber-500 rounded-sm text-white">
            <span className="font-bold text-xs">✔</span>
          </div>
          <p className="text-xs font-bold leading-relaxed">{showNotification}</p>
        </div>
      )}

      {/* Top Info Strip */}
      <div className="bg-[#DFB13C] text-black text-[11px] font-medium py-2.5 px-4 sm:px-8 text-center border-b border-[#C59B27]/10 flex flex-col md:flex-row justify-between items-center gap-3 z-30">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6">
          <span className="text-black font-bold tracking-wider">⚡ متجر نيوسرام للأجهزة الكهربائية والإنارة الحديثة الفاخرة</span>
          <div className="flex items-center gap-4 text-black/75">
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-black" />
              اتصال و واتساب: 07866080020
            </span>
            <span className="hidden md:inline text-black/15">|</span>
            <span className="hidden md:flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-black" />
              توصيل سريع لباب البيت في جميع محافظات العراق
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Top Header - Matching Screenshot */}
      <header className="md:hidden sticky top-0 bg-white z-40 px-4 py-3.5 flex items-center justify-between border-b border-stone-200/60 shadow-xs" dir="rtl">
        <button 
          onClick={() => {
            const element = document.getElementById("products-catalog");
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }}
          className="p-2 text-stone-900 hover:bg-stone-50 rounded-lg cursor-pointer transition-all active:scale-95"
        >
          <Menu className="w-6 h-6 stroke-[2.5]" />
        </button>

        <div className="flex items-center gap-1.5">
          <img 
            src={newsramLogo} 
            className="w-8 h-8 rounded-full object-cover border border-amber-500/20 shadow-xs bg-white" 
            alt="NEWSRAM Logo"
          />
          <span className="font-serif font-black tracking-widest text-base text-[#D4AF37] uppercase">
            NEWSRAM
          </span>
        </div>

        <button 
          onClick={() => triggerNotification("لا توجد إشعارات جديدة حالياً عيوني! 🔔")}
          className="p-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-[#DFB13C] cursor-pointer transition-all active:scale-95"
        >
          <Bell className="w-5 h-5 fill-[#DFB13C]" />
        </button>
      </header>

      {/* Desktop Main Header */}
      <header className="hidden md:flex sticky top-0 bg-[#DFB13C] backdrop-blur-md z-40 border-b-2 border-[#C59B27] px-4 sm:px-8 py-4 items-center justify-between shadow-md text-stone-950">
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <div className="flex items-center gap-3">
            <img 
              src={newsramLogo} 
              className="w-12 h-12 rounded-xl object-cover shadow-md border-2 border-[#C59B27] bg-white" 
              alt="NEWSRAM Logo"
            />
            <div>
              <h1 className="text-lg font-serif font-black tracking-wide text-stone-950 uppercase flex items-center gap-1.5">
                NEWSRAM
              </h1>
              <p className="text-[10px] text-amber-950 font-black">الإنارة الفاخرة والمفاتيح الذكية العراقية 💡🇮🇶</p>
            </div>
          </div>
        </div>

        {/* Live Catalog Search */}
        <div className="relative w-full max-w-xs">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-700" />
          <input 
            type="text"
            placeholder="ابحث عن أجهزة وإنارة بالاسم عيوني..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-2 border-amber-500 focus:border-amber-600 rounded-lg py-2.5 pr-10 pl-4 text-xs text-stone-950 focus:outline-none placeholder:text-stone-500 font-black"
          />
        </div>

        {/* Navigation buttons - Hidden on mobile to avoid overcrowding, fully covered by floating Bottom Bar */}
        <div className="flex items-center gap-2">
          {/* Track Order */}
          <button
            onClick={() => setIsTrackingOpen(true)}
            className="bg-[#FFFDF0] hover:bg-yellow-100 text-amber-950 border-2 border-yellow-500 px-3.5 py-2.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Smartphone className="w-4 h-4 text-amber-800 font-black" />
            <span>تتبع الطلب 📦</span>
          </button>

          {/* AI Advisor */}
          <button
            onClick={() => setIsAdvisorOpen(true)}
            className="bg-[#FFFDF0] hover:bg-yellow-100 text-amber-950 border-2 border-yellow-500 px-3.5 py-2.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Bot className="w-4 h-4 text-amber-800 font-black" />
            <span>المستشار الذكي 🤖</span>
          </button>

          {/* Shopping Cart */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="bg-amber-600 hover:bg-amber-700 text-stone-950 font-black px-4.5 py-2.5 rounded-lg text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md border-2 border-amber-700"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>سلة المشتريات</span>
            {cartCount > 0 && (
              <span className="bg-black text-[#FBC02D] text-[10px] font-black px-2 py-0.5 rounded-full">
                {cartCount}
              </span>
            )}
          </button>

          {/* Admin Control */}
          <button
            onClick={handleAdminButtonClick}
            className={`px-3.5 py-2.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border-2 ${
              isAdminAuthenticated 
                ? 'bg-amber-700 text-[#FFFDF0] border-amber-800 shadow-md' 
                : 'bg-[#FFFDF0] hover:bg-yellow-100 text-stone-800 border-yellow-500 shadow-sm'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-800 font-black" />
            <span>{isAdminAuthenticated ? 'لوحة التحكم ⚙️' : 'دخول المشرف'}</span>
          </button>
        </div>
      </header>

      {/* Premium Bottom Navigator for Mobile Phones - Matching Screenshot layout */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 py-2.5 px-3 z-50 flex justify-around items-center text-center shadow-2xl rounded-t-[24px]" dir="rtl">
        {/* 1. الرئيسية */}
        <button 
          onClick={() => { 
            setSelectedCategory('all'); 
            window.scrollTo({ top: 0, behavior: 'smooth' }); 
          }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
            selectedCategory === 'all' 
              ? 'text-amber-500 scale-105' 
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <Home className="w-5.5 h-5.5" fill={selectedCategory === 'all' ? "currentColor" : "none"} />
          <span className="text-[10px] font-black">الرئيسية</span>
        </button>

        {/* 2. التصنيفات */}
        <button 
          onClick={() => {
            const element = document.getElementById("products-catalog");
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
            selectedCategory !== 'all' && selectedCategory !== 'favorites'
              ? 'text-amber-500 scale-105' 
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <LayoutGrid className="w-5.5 h-5.5" />
          <span className="text-[10px] font-black">التصنيفات</span>
        </button>

        {/* 3. المفضلة */}
        <button 
          onClick={() => {
            setSelectedCategory('favorites');
            const element = document.getElementById("products-catalog");
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
            selectedCategory === 'favorites'
              ? 'text-amber-500 scale-105' 
              : 'text-stone-500 hover:text-[#f43f5e]'
          }`}
        >
          <Heart className="w-5.5 h-5.5" fill={selectedCategory === 'favorites' ? "currentColor" : "none"} />
          <span className="text-[10px] font-black">المفضلة</span>
        </button>

        {/* 4. السلة */}
        <button 
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center gap-1 text-stone-500 hover:text-stone-900 cursor-pointer relative transition-all"
        >
          <div className="relative">
            <ShoppingBag className="w-5.5 h-5.5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-bounce">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-black">السلة</span>
        </button>

        {/* 5. حسابي (Admin Panel) */}
        <button 
          onClick={handleAdminButtonClick}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
            isAdminAuthenticated ? 'text-amber-500 scale-105' : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <User className="w-5.5 h-5.5" fill={isAdminAuthenticated ? "currentColor" : "none"} />
          <span className="text-[10px] font-black">حسابي</span>
        </button>
      </nav>

      {/* Interactive 3-Image Slider (Top of page) */}
      <section className="relative w-full aspect-[21/9] min-h-[320px] max-h-[500px] overflow-hidden bg-stone-900 border-b border-amber-500/10 shrink-0">
        {/* Slides Wrapper */}
        <div className="absolute inset-0 w-full h-full">
          {slides.map((slide, index) => {
            const isActive = index === currentSlide;
            return (
              <div
                key={slide.id}
                className={`absolute inset-0 w-full h-full transition-all duration-700 ease-in-out ${
                  isActive ? "opacity-100 z-10 translate-x-0 scale-100" : "opacity-0 z-0 translate-x-full scale-95 pointer-events-none"
                }`}
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover filter brightness-[0.75] contrast-[1.05]"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
                
                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white select-none">
                  <div className="max-w-2xl space-y-3 animate-fade-in">
                    <h2 className="text-xl sm:text-3xl md:text-4xl font-serif font-black tracking-wide text-amber-400 drop-shadow-md">
                      {slide.title}
                    </h2>
                    <p className="text-[11px] sm:text-xs md:text-sm text-stone-100 drop-shadow-sm font-bold">
                      {slide.subtitle}
                    </p>
                  </div>
                </div>

                {/* Admin Image Edit Button */}
                {isAdminAuthenticated && (
                  <div className="absolute top-4 left-4 z-20">
                    <label className="bg-amber-500 hover:bg-amber-600 text-black font-black text-[10px] sm:text-xs px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xl border border-amber-400/40">
                      <Camera className="w-3.5 h-3.5" />
                      <span>تعديل هذه الصورة 📷</span>
                      {isUploadingSlide[slide.id] && (
                        <span className="animate-spin w-3 h-3 border-2 border-black border-t-transparent rounded-full" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleSlideImageUpload(slide.id, e)}
                        className="hidden"
                        disabled={isUploadingSlide[slide.id]}
                      />
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Left / Right Navigation Controls */}
        <button
          onClick={handlePrevSlide}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-amber-500 hover:text-black text-white p-2 rounded-full backdrop-blur-md transition-all active:scale-90 border border-white/10 cursor-pointer"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={handleNextSlide}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-amber-500 hover:text-black text-white p-2 rounded-full backdrop-blur-md transition-all active:scale-90 border border-white/10 cursor-pointer"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Dots Indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                index === currentSlide ? "bg-amber-500 scale-125" : "bg-white/40 hover:bg-white"
              }`}
            />
          ))}
        </div>
      </section>

      {/* Trust Metrics Section below Slider */}
      <section className="bg-yellow-300/20 border-b border-amber-500/20 py-5 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-black text-stone-950">🛡️ ضمان حقيقي استبدال</span>
              <span className="text-[9px] text-amber-950 font-black mt-0.5">استبدال مباشر فوري</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-black text-stone-950">🚚 توصيل سريع مريح</span>
              <span className="text-[9px] text-amber-950 font-black mt-0.5">لكافة مدن العراق</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-black text-stone-950">🤖 مستشار ذكي مجاني</span>
              <span className="text-[9px] text-amber-950 font-black mt-0.5">يساعدك بتوزيع وحساب الإنارة</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-black text-stone-950">⏰ دعم 24/7 متواصل</span>
              <span className="text-[9px] text-amber-950 font-black mt-0.5">جاهزون لخدمتك دائماً</span>
            </div>
          </div>
        </div>
      </section>

      {/* Category Selection Filter */}
      <section id="products-catalog" className="px-4 sm:px-8 py-8 max-w-7xl mx-auto w-full space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-amber-500/20 pb-4">
          <div>
            <h3 className="font-serif text-xl tracking-wide text-stone-950 flex items-center gap-2 font-black">
              تصفح المنتجات الفاخرة <span className="text-[9px] font-sans bg-amber-500/20 text-amber-950 border border-amber-500/30 px-2 py-0.5 uppercase font-black">Approved Solutions</span>
            </h3>
            <p className="text-[11px] text-stone-800 font-black mt-1">انقر لتصفية الأجهزة والإنارة المتاحة لتأسيس بيتك الراقي عيوني</p>
          </div>
          
          <div className="text-[11px] text-stone-900 font-black bg-yellow-100 border-2 border-yellow-400 px-3 py-1.5 rounded-lg self-start shadow-sm">
            يعرض الآن: <span className="text-amber-950 font-black">
              {selectedCategory === 'all' 
                ? `${Math.min(visibleCount, filteredProducts.length)} من ${filteredProducts.length} منتج`
                : `${filteredProducts.length} منتج`
              }
            </span>
          </div>
        </div>

        {/* Category horizontal bar scrollable */}
        <div className="overflow-x-auto whitespace-nowrap flex gap-2 pb-2.5 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer border-2 flex items-center gap-1.5 shrink-0 uppercase ${
              selectedCategory === 'all'
                ? 'bg-amber-500 border-amber-600 text-black font-black shadow-md'
                : 'bg-[#FFFDF0] border-yellow-400 text-stone-900 hover:bg-yellow-50 shadow-sm'
            }`}
          >
            <span>كل المعروضات</span>
          </button>
          
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer border-2 flex items-center gap-1.5 shrink-0 uppercase ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 border-amber-600 text-black font-black shadow-md'
                  : 'bg-[#FFFDF0] border-yellow-400 text-stone-900 hover:bg-yellow-50 shadow-sm'
              }`}
            >
              {renderCategoryIcon(cat.icon)}
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Products Grid */}
      <section className="px-3 sm:px-8 pb-20 max-w-7xl mx-auto w-full flex-1">
        {filteredProducts.length > 0 ? (
          <div className="space-y-12">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-6">
              {(selectedCategory === 'all' ? filteredProducts.slice(0, visibleCount) : filteredProducts).map((prod) => (
                <ProductCard 
                  key={prod.id} 
                  product={prod} 
                  onAddToCart={handleAddToCart} 
                  isFavorite={favoritedIds.includes(prod.id)}
                  onToggleFavorite={() => handleToggleFavorite(prod.id)}
                  isAdmin={isAdminAuthenticated && adminRole === 'admin'}
                  onEdit={(p) => {
                    setExternalProductToEdit(p);
                    if (!isAdminAuthenticated) {
                      setShowPasswordDialog(true);
                    } else {
                      setIsAdminOpen(true);
                    }
                  }}
                  onDelete={() => {
                    setExternalProductToDelete(prod);
                    if (!isAdminAuthenticated) {
                      setShowPasswordDialog(true);
                    } else {
                      setIsAdminOpen(true);
                    }
                  }}
                />
              ))}
            </div>

            {selectedCategory === 'all' && filteredProducts.length > visibleCount && (
              <div className="flex justify-center">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 16)}
                  className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs px-8 py-3.5 rounded-xl transition-all cursor-pointer shadow-lg border-2 border-amber-600/30 flex items-center gap-2 transform active:scale-95"
                >
                  <span>عرض المزيد من المنتجات ⚡</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#FFFDF0] rounded-2xl border-2 border-yellow-500 p-12 text-center max-w-md mx-auto space-y-4 shadow-md">
            <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-stone-950 mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-black text-stone-950 text-xs">لم نجد أي منتجات تطابق بحثك عيوني!</h4>
              <p className="text-[11px] text-stone-800 leading-relaxed font-bold">تأكد من كتابة الكلمة بشكل صحيح، أو تصفح كل المعروضات أو اسأل مستشارنا الذكي لمساعدتك.</p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="bg-amber-500 hover:bg-amber-600 text-black font-black text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-sm border border-amber-600/30"
            >
              عرض جميع الأجهزة
            </button>
          </div>
        )}
      </section>

      {/* Category Visual Cards Grid (Moved to bottom as requested) */}
      <section className="bg-yellow-400/20 border-t-2 border-b-2 border-amber-500/20 py-12 px-4 sm:px-8 shrink-0">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h3 className="font-serif text-lg sm:text-xl text-stone-950 font-black">
            تصفح فئات المنتجات الفاخرة ⬇️
          </h3>
          <p className="text-[11px] text-stone-800 font-black max-w-md mx-auto">
            اختر الفئة التي تود تصفح تفاصيلها وأجهزتها المتميزة مباشرة عيوني:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 max-w-3xl mx-auto">
            
            {/* Category 1: Indoor lighting */}
            <div 
              onClick={() => handleCategoryClick('lighting-indoor')}
              className="relative h-24 rounded-xl overflow-hidden cursor-pointer group shadow-sm border border-stone-200/50 hover:border-amber-500/40 transition-all duration-300"
            >
              <img 
                src="https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=300&q=80" 
                alt="الإنارة الداخلية الفخمة" 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/60 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2 text-right">
                <span className="block text-[11px] font-black text-white">الإنارة الداخلية</span>
                <span className="block text-[8px] text-amber-400 font-bold">ثريات وسبوتات راقية ✨</span>
              </div>
            </div>

            {/* Category 2: Smart switches */}
            <div 
              onClick={() => handleCategoryClick('smart-switches')}
              className="relative h-24 rounded-xl overflow-hidden cursor-pointer group shadow-sm border border-stone-200/50 hover:border-amber-500/40 transition-all duration-300"
            >
              <img 
                src="https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=300&q=80" 
                alt="المفاتيح والذكاء المنزلي" 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/60 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2 text-right">
                <span className="block text-[11px] font-black text-white">المفاتيح والذكاء</span>
                <span className="block text-[8px] text-amber-400 font-bold">لمس زجاجية وتحكم ذكي 📱</span>
              </div>
            </div>

            {/* Category 3: Outdoor lighting */}
            <div 
              onClick={() => handleCategoryClick('lighting-outdoor')}
              className="relative h-24 rounded-xl overflow-hidden cursor-pointer group shadow-sm border border-stone-200/50 hover:border-amber-500/40 transition-all duration-300"
            >
              <img 
                src="https://images.unsplash.com/photo-1508333706533-1ab43ecb1606?auto=format&fit=crop&w=300&q=80" 
                alt="الإنارة الخارجية" 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/60 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2 text-right">
                <span className="block text-[11px] font-black text-white">الإنارة الخارجية</span>
                <span className="block text-[8px] text-amber-400 font-bold">مقاومة للأمطار والحرارة ☔</span>
              </div>
            </div>

            {/* Category 4: Electrical supplies */}
            <div 
              onClick={() => handleCategoryClick('electrical-supplies')}
              className="relative h-24 rounded-xl overflow-hidden cursor-pointer group shadow-sm border border-stone-200/50 hover:border-amber-500/40 transition-all duration-300"
            >
              <img 
                src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80" 
                alt="الأسلاك والتأسيسات" 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/60 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2 text-right">
                <span className="block text-[11px] font-black text-white">الأسلاك والتأسيس</span>
                <span className="block text-[8px] text-amber-400 font-bold">نحاس نقي وقواطع أصلية 🔌</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Bottom Information & Action Footer (Moved from top hero) */}
      <section className="bg-amber-500/5 border-t border-amber-500/10 py-14 px-4 sm:px-8 shrink-0 flex flex-col items-center justify-center">
        <div className="max-w-4xl mx-auto text-center space-y-6 w-full">
          <div className="inline-block px-3.5 py-1 border border-amber-500/25 text-amber-800 text-[10px] uppercase font-bold rounded-full bg-amber-500/10">
            خيارك الهندسي الأول في العراق 💡
          </div>

          <h2 className="text-3xl sm:text-4xl font-serif leading-tight text-stone-900 font-black">
            تأسيس فخم وإنارة راقية لبيتك 🏛️
          </h2>
          
          <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto leading-relaxed font-medium">
            تسوّق أرقى مستلزمات الكهرباء والإنارة الحديثة والمفاتيح الذكية من ماركة <strong className="text-stone-900 font-bold">NEWSRAM</strong> مع شحن سريع لكافة محافظات العراق وضمان استبدال حقيقي.
          </p>

          <div className="flex flex-wrap justify-center gap-3.5 pt-2">
            <button
              onClick={() => setIsAdvisorOpen(true)}
              className="bg-amber-500 text-black px-6 py-3.5 font-black text-[11px] tracking-wider hover:bg-amber-600 transition-all rounded-lg cursor-pointer shadow-lg shadow-amber-500/10 active:scale-95"
            >
              جرب مستشار الإنارة الذكي مجاناً 🤖
            </button>
            <a
              href={`https://wa.me/9647866080020?text=${encodeURIComponent('السلام عليكم متجر نيوسرام 💡 أود الاستفسار عن منتجاتكم الكهربائية والإنارة المتوفرة.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-stone-200 px-6 py-3.5 font-black text-[11px] tracking-wider hover:bg-stone-50 text-stone-800 transition-colors bg-white rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>تواصل واتساب مباشر</span>
            </a>
          </div>

          {/* Big App Download Area with App Store and Google Play */}
          <div className="mt-8 p-6 bg-[#FFFDF0] rounded-2xl border-2 border-yellow-400 shadow-md max-w-xl mx-auto space-y-4">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">📱</span>
              <h3 className="text-sm font-black text-stone-950">حمّل تطبيق نيوسرام للهواتف الذكية الآن!</h3>
            </div>
            <p className="text-[11px] text-stone-800 leading-relaxed font-black">
              استمتع بتجربة تسوّق متكاملة وسريعة مباشرة من هاتفك (الآيفون أو الأندرويد). تصفح أحدث الكتالوجات والأسعار الحصرية واطلب بكل سهولة وراحة.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-1">
              <a 
                href="https://apps.apple.com/iq/app/newsram/id6749196450?l=ar" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-stone-900 hover:bg-black text-white px-5 py-2.5 rounded-xl transition-all shadow-md border border-stone-800 hover:scale-105"
              >
                <span className="text-[20px]">🍏</span>
                <div className="text-right">
                  <span className="block text-[8px] text-stone-400 font-bold leading-none">Download on the</span>
                  <span className="block text-[12px] font-black leading-none mt-0.5">App Store</span>
                </div>
              </a>

              <a 
                href="https://play.google.com/store/search?q=newsram&c=apps" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-stone-900 hover:bg-black text-white px-5 py-2.5 rounded-xl transition-all shadow-md border border-stone-800 hover:scale-105"
              >
                <span className="text-[20px]">🤖</span>
                <div className="text-right">
                  <span className="block text-[8px] text-stone-400 font-bold leading-none">GET IT ON</span>
                  <span className="block text-[12px] font-black leading-none mt-0.5">Google Play</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Blocks */}
      <section className="bg-yellow-400/20 border-t-2 border-amber-500/20 py-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#FFFDF0] p-6 rounded-xl border-2 border-yellow-400 space-y-2 text-right shadow-sm">
            <h4 className="font-black text-sm text-stone-950">⚖️ سعر الصرف والضمان الحقيقي</h4>
            <p className="text-xs text-stone-800 leading-relaxed font-bold">
              جميع الأسعار معلنة بالدولار الأمريكي ويتم تحويلها لراحتكم بالدينار العراقي بسعر صرف ثابت معتمد في معرضنا وهو {currentExchangeRate.toLocaleString()} دينار لكل دولار مع الضمان الذهبي للاستبدال الفوري.
            </p>
          </div>

          <div className="bg-[#FFFDF0] p-6 rounded-xl border-2 border-yellow-400 space-y-2 text-right shadow-sm">
            <h4 className="font-black text-sm text-stone-950">🚚 سرعة الشحن والتوصيل بالعراق</h4>
            <p className="text-xs text-stone-800 leading-relaxed font-bold">
              نوصل طلبياتكم لباب بيتكم في جميع محافظات العراق، مع إمكانية فحص طلبيتك بالكامل قبل دفع الحساب لتتأكد من سلامة الأجهزة الكهربائية ومطابقتها للمواصفات المطلوبة.
            </p>
          </div>

          <div className="bg-[#FFFDF0] p-6 rounded-xl border-2 border-yellow-400 space-y-2 text-right shadow-sm">
            <h4 className="font-black text-sm text-stone-950">📲 الطلب التلقائي عبر واتساب</h4>
            <p className="text-xs text-stone-800 leading-relaxed font-bold">
              فقط أضف احتياجاتك من الإضاءة والمفاتيح وقواطع الدورة إلى السلة، وانقر على تأكيد الطلب، ليتم تجميع طلبيتك تلقائياً في رسالة منسقة وفتح محادثة واتساب معنا لتجهيزها فوراً.
            </p>
          </div>
        </div>
      </section>

      {/* Modular Shopping Cart & Checkout Modals */}
      <ShoppingModals 
        exchangeRate={currentExchangeRate}
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveFromCart={handleRemoveFromCart}
        onOpenCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        isCheckoutOpen={isCheckoutOpen}
        setIsCheckoutOpen={setIsCheckoutOpen}
        customerName={customerName}
        setCustomerName={setCustomerName}
        customerPhone={customerPhone}
        setCustomerPhone={setCustomerPhone}
        customerAddress={customerAddress}
        setCustomerAddress={setCustomerAddress}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        onCheckoutSubmit={handleWhatsAppCheckoutSubmit}
        isTrackingOpen={isTrackingOpen}
        setIsTrackingOpen={setIsTrackingOpen}
        trackingPhone={trackingPhone}
        setTrackingPhone={setTrackingPhone}
        trackedOrders={trackedOrders}
        hasSearchedTracking={hasSearchedTracking}
        onTrackOrder={handleTrackOrder}
        copiedLink={copiedLink}
        onCopyLink={handleCopyLink}
        getAppUrl={getAppUrl}
      />

      {/* Modular Admin Control Panel */}
      <AdminPanel 
        isOpen={isAdminOpen || showPasswordDialog}
        onClose={() => {
          setIsAdminOpen(false);
          setShowPasswordDialog(false);
        }}
        products={products}
        onRefreshProducts={fetchProducts}
        orders={orders}
        onRefreshOrders={fetchOrders}
        isAdminAuthenticated={isAdminAuthenticated}
        setIsAdminAuthenticated={setIsAdminAuthenticated}
        adminRole={adminRole}
        setAdminRole={setAdminRole}
        showPasswordDialog={showPasswordDialog}
        setShowPasswordDialog={setShowPasswordDialog}
        triggerNotification={triggerNotification}
        externalProductToEdit={externalProductToEdit}
        setExternalProductToEdit={setExternalProductToEdit}
        externalProductToDelete={externalProductToDelete}
        setExternalProductToDelete={setExternalProductToDelete}
        onConfigUpdated={(newConfig) => setStoreConfig(newConfig)}
      />

      {/* Modular Smart AI Consultant */}
      <AIAdvisor 
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
        onAddProductToCart={handleAddToCart}
        products={products}
        exchangeRate={currentExchangeRate}
      />

    </div>
  );
}
