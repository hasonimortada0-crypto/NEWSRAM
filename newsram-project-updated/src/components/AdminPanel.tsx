import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  X, 
  Trash2, 
  Check, 
  Plus, 
  Smartphone, 
  TrendingUp, 
  User, 
  MapPin, 
  Calendar, 
  ShoppingBag, 
  CreditCard,
  Image as ImageIcon,
  Printer,
  BarChart2,
  Settings,
  Download,
  Search,
  Tag,
  CheckCircle,
  FileSpreadsheet,
  Upload,
  AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Product } from '../types';
import { USD_TO_IQD } from '../data';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onRefreshProducts: () => void;
  orders: any[];
  onRefreshOrders: () => void;
  isAdminAuthenticated: boolean;
  setIsAdminAuthenticated: (val: boolean) => void;
  adminRole?: 'admin' | 'sales' | null;
  setAdminRole?: (role: 'admin' | 'sales' | null) => void;
  showPasswordDialog: boolean;
  setShowPasswordDialog: (val: boolean) => void;
  triggerNotification: (msg: string) => void;
  externalProductToEdit?: Product | null;
  setExternalProductToEdit?: (p: Product | null) => void;
  externalProductToDelete?: Product | null;
  setExternalProductToDelete?: (p: Product | null) => void;
  onConfigUpdated?: (config: any) => void;
}

export default function AdminPanel({
  isOpen,
  onClose,
  products,
  onRefreshProducts,
  orders,
  onRefreshOrders,
  isAdminAuthenticated,
  setIsAdminAuthenticated,
  adminRole,
  setAdminRole,
  showPasswordDialog,
  setShowPasswordDialog,
  triggerNotification,
  externalProductToEdit,
  setExternalProductToEdit,
  externalProductToDelete,
  setExternalProductToDelete,
  onConfigUpdated
}: AdminPanelProps) {
  const [adminTab, setAdminTab] = useState<'products' | 'orders' | 'stats' | 'settings'>('products');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [selectedLoginRole, setSelectedLoginRole] = useState<'admin' | 'sales'>('admin');
  const [adminPasswordConfig, setAdminPasswordConfig] = useState<string>('');
  const [salesPasswordConfig, setSalesPasswordConfig] = useState<string>('');

  // Excel / CSV Import States
  const [showImportSection, setShowImportSection] = useState<boolean>(false);
  const [excelFileName, setExcelFileName] = useState<string>('');
  const [excelProductsPreview, setExcelProductsPreview] = useState<any[]>([]);
  const [replaceAllOnImport, setReplaceAllOnImport] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // Enforce orders tab for Sales role
  useEffect(() => {
    if (adminRole === 'sales') {
      setAdminTab('orders');
    }
  }, [adminRole]);

  // Confirmation state for deleting a product
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);

  // Search & Filter state for products
  const [productSearch, setProductSearch] = useState<string>('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');

  // Search & Filter state for orders
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  // Product edit/create states
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState<boolean>(false);

  // Store custom configuration state
  const [heroImageUrl, setHeroImageUrl] = useState<string>('');
  const [storeSlogan, setStoreSlogan] = useState<string>('');
  const [exchangeRate, setExchangeRate] = useState<number>(USD_TO_IQD);

  // New specification input helpers
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');

  // Fetch store config on tab settings load
  useEffect(() => {
    if (isOpen) {
      const loadStoreConfig = async () => {
        try {
          const response = await fetch('/api/config');
          if (response.ok) {
            const data = await response.json();
            if (data) {
              if (data.heroImage) setHeroImageUrl(data.heroImage);
              if (data.slogan) setStoreSlogan(data.slogan);
              if (data.rate) setExchangeRate(data.rate);
              if (data.adminPassword) setAdminPasswordConfig(data.adminPassword);
              if (data.salesPassword) setSalesPasswordConfig(data.salesPassword);
            }
          }
        } catch (err) {
          console.error("Failed to load config in admin:", err);
        }
      };
      loadStoreConfig();
    }
  }, [isOpen]);

  // Synchronize external actions (edit/delete) triggered from the main page grid
  useEffect(() => {
    if (isAdminAuthenticated) {
      if (externalProductToEdit) {
        setAdminTab('products');
        setEditingProduct({ ...externalProductToEdit });
        setNewSpecKey('');
        setNewSpecValue('');
        setIsProductFormOpen(true);
        if (setExternalProductToEdit) {
          setExternalProductToEdit(null);
        }
      }
      if (externalProductToDelete) {
        setAdminTab('products');
        setProductToDelete({ id: externalProductToDelete.id, name: externalProductToDelete.name });
        if (setExternalProductToDelete) {
          setExternalProductToDelete(null);
        }
      }
    }
  }, [isAdminAuthenticated, externalProductToEdit, externalProductToDelete]);

  // Handle Verify Password - easy login for Iraqi admins
  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine role based on passwords or fallback selection
    let matchedRole: 'admin' | 'sales' | null = null;
    
    // Auto detect if the typed password matches any of the stored configs
    if (adminPasswordConfig && adminPassword === adminPasswordConfig) {
      matchedRole = 'admin';
    } else if (salesPasswordConfig && adminPassword === salesPasswordConfig) {
      matchedRole = 'sales';
    } else {
      // Use the chosen UI role
      matchedRole = selectedLoginRole;
      
      // If a password is set for that selected role, check it
      if (matchedRole === 'admin') {
        if (adminPasswordConfig && adminPassword !== adminPasswordConfig) {
          setPasswordError("عذراً، رمز مرور المدير العام غير صحيح عيوني! ❌");
          return;
        }
      } else {
        if (salesPasswordConfig && adminPassword !== salesPasswordConfig) {
          setPasswordError("عذراً، رمز مرور مسؤول المبيعات غير صحيح عيوني! ❌");
          return;
        }
      }
    }

    setIsAdminAuthenticated(true);
    if (setAdminRole) {
      setAdminRole(matchedRole);
    }
    
    if (matchedRole === 'sales') {
      setAdminTab('orders');
      triggerNotification("مرحباً بك عيوني بصفتك مسؤول مبيعات متجر نيوسرام! تم الدخول بنجاح. 🤝");
    } else {
      setAdminTab('products');
      triggerNotification("مرحباً بك عيوني بصفتك المدير العام لمتجر نيوسرام! تم الدخول بنجاح. 👑");
    }

    setShowPasswordDialog(false);
    setAdminPassword('');
    setPasswordError('');
  };

  // Handle parsing Excel or CSV file
  const handleExcelFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Convert sheet to JSON array of objects
        const rawRows = XLSX.utils.sheet_to_json<any>(ws);
        
        if (rawRows.length === 0) {
          triggerNotification("الملف المحدد فارغ عيوني! يرجى اختيار ملف يحتوي على بيانات.");
          return;
        }

        // Intelligently map columns based on synonyms
        const mappedProducts = rawRows.map((row) => {
          // Helper to find value by dynamic key patterns
          const getValueByPatterns = (rowObj: any, patterns: RegExp[]) => {
            const key = Object.keys(rowObj).find((k) => 
              patterns.some((pat) => pat.test(k.trim()))
            );
            return key ? rowObj[key] : undefined;
          };

          const name = getValueByPatterns(row, [/^الاسم$/i, /^اسم المنتج$/i, /^الاسم بالعربي$/i, /^name$/i, /^product_name$/i, /^product name$/i]);
          const englishName = getValueByPatterns(row, [/^الاسم بالانكليزي$/i, /^الاسم بالانجليزي$/i, /^english_name$/i, /^english name$/i, /^englishName$/i, /^english_title$/i]);
          const description = getValueByPatterns(row, [/^الوصف$/i, /^وصف$/i, /^الوصف التفصيلي$/i, /^description$/i, /^details$/i]);
          const priceUSD = getValueByPatterns(row, [/^السعر بالدولار$/i, /^السعر$/i, /^السعر دولار$/i, /^price$/i, /^priceusd$/i, /^price usd$/i, /^price_usd$/i]);
          const categoryRaw = getValueByPatterns(row, [/^الفئة$/i, /^القسم$/i, /^الفئه$/i, /^category$/i, /^department$/i]);
          const subcategory = getValueByPatterns(row, [/^الفئة الفرعية$/i, /^القسم الفرعي$/i, /^الفئه الفرعيه$/i, /^subcategory$/i, /^sub-category$/i, /^sub_category$/i]);
          const image = getValueByPatterns(row, [/^الصورة$/i, /^رابط الصورة$/i, /^رابط صوره$/i, /^صورة$/i, /^image$/i, /^imageurl$/i, /^image url$/i, /^picture$/i]);
          const specsRaw = getValueByPatterns(row, [/^المواصفات$/i, /^مواصفات$/i, /^specs$/i, /^specifications$/i]);

          // Category mapping helper
          let category = "lighting-indoor";
          if (categoryRaw) {
            const catStr = String(categoryRaw).trim();
            if (/داخل|indoor|إضاءة داخلية|انارة داخلية|إنارة داخلية/i.test(catStr)) {
              category = "lighting-indoor";
            } else if (/خارج|outdoor|إضاءة خارجية|انارة خارجية|إنارة خارجية/i.test(catStr)) {
              category = "lighting-outdoor";
            } else if (/مفاتيح|ذك|smart|switch|تحكم/i.test(catStr)) {
              category = "smart-switches";
            } else if (/تهوية|جهاز|أجهزة|appliance|تهويه/i.test(catStr)) {
              category = "appliances";
            } else if (/سلك|أسلاك|تأسيس|cable|wire|electrical|اسلاك/i.test(catStr)) {
              category = "electrical-supplies";
            }
          }

          // Parse specs safely
          let specs: Record<string, string> = {};
          if (specsRaw) {
            if (typeof specsRaw === 'object') {
              specs = specsRaw;
            } else {
              try {
                // Check if it's a JSON string
                specs = JSON.parse(String(specsRaw));
              } catch {
                // Otherwise split by comma/semicolon and colon
                const parts = String(specsRaw).split(/,|;|\n/);
                parts.forEach((p) => {
                  const colonIndex = p.indexOf(':');
                  if (colonIndex > -1) {
                    const k = p.substring(0, colonIndex).trim();
                    const v = p.substring(colonIndex + 1).trim();
                    if (k && v) specs[k] = v;
                  }
                });
              }
            }
          }

          // If specs are empty, let's also automatically add any other columns as specs if they are not mapped
          const mappedKeysSet = new Set([
            "الاسم", "اسم المنتج", "الاسم بالعربي", "name", "product_name", "product name",
            "الاسم بالانكليزي", "الاسم بالانجليزي", "english_name", "english name", "englishName",
            "الوصف", "وصف", "الوصف التفصيلي", "description", "details",
            "السعر بالدولار", "السعر", "السعر دولار", "price", "priceusd", "price usd", "price_usd",
            "الفئة", "القسم", "الفئه", "category", "department",
            "الفئة الفرعية", "القسم الفرعي", "الفئه الفرعيه", "subcategory", "sub-category", "sub_category",
            "الصورة", "رابط الصورة", "رابط صوره", "صورة", "image", "imageurl", "image url", "picture",
            "المواصفات", "مواصفات", "specs", "specifications"
          ].map(k => k.toLowerCase()));

          // Gather unmapped columns into specs
          Object.keys(row).forEach((k) => {
            if (!mappedKeysSet.has(k.trim().toLowerCase()) && String(row[k]).trim() !== '') {
              specs[k.trim()] = String(row[k]);
            }
          });

          // Standardize prices
          let priceNum = 0;
          if (priceUSD !== undefined) {
            // Remove dollar signs, commas, and spaces
            const cleanedPrice = String(priceUSD).replace(/[^0-9.]/g, '');
            priceNum = parseFloat(cleanedPrice) || 0;
          }

          return {
            name: name ? String(name).trim() : undefined,
            englishName: englishName ? String(englishName).trim() : '',
            description: description ? String(description).trim() : '',
            priceUSD: priceNum,
            category,
            subcategory: subcategory ? String(subcategory).trim() : '',
            image: image ? String(image).trim() : 'https://images.unsplash.com/photo-1543248939-ff40856f65d4?auto=format&fit=crop&w=600&q=80',
            specs,
            rating: 5.0,
            reviewsCount: 1,
            inStock: true,
            tags: []
          };
        }).filter(p => p.name); // must have a name

        setExcelProductsPreview(mappedProducts);
        triggerNotification(`تم قراءة الملف بنجاح! عثرنا على ${mappedProducts.length} منتج جاهز للمراجعة عيوني.`);
      } catch (err: any) {
        console.error("Error reading file:", err);
        triggerNotification("عذراً، حدث خطأ أثناء قراءة ملف الـ Excel. يرجى التحقق من صياغته ❌");
      }
    };
    reader.readAsBinaryString(file);
  };

  // Submit Bulk Products to API
  const handleExecuteImport = async () => {
    if (excelProductsPreview.length === 0) return;

    setIsImporting(true);
    try {
      const response = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          products: excelProductsPreview,
          replaceAll: replaceAllOnImport
        })
      });

      if (!response.ok) {
        throw new Error("فشل إرسال المنتجات للخادم عيوني");
      }

      const resData = await response.json();
      triggerNotification(`تم بنجاح استيراد وتجهيز ${resData.count} منتج في معروضات متجر نيوسرام! 🎉`);
      
      // Reset state
      setExcelProductsPreview([]);
      setExcelFileName('');
      setShowImportSection(false);
      
      // Refresh products from app context
      onRefreshProducts();
    } catch (err: any) {
      console.error(err);
      triggerNotification("عذراً، حدث خطأ أثناء حفظ المنتجات المستوردة. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        triggerNotification(`تم تحديث حالة الطلب بنجاح إلى: ${newStatus}`);
        onRefreshOrders();
      } else {
        triggerNotification("عذراً، فشل تحديث حالة الطلب على الخادم.");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("حدث خطأ في الاتصال بالخادم.");
    }
  };

  const handleDeleteProductClick = async (productId: string, productName: string) => {
    setProductToDelete({ id: productId, name: productName });
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    const { id: productId, name: productName } = productToDelete;

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onRefreshProducts();
        setProductToDelete(null);
        triggerNotification(`تم حذف المنتج "${productName}" بنجاح! 🗑️`);
      } else {
        triggerNotification("فشل حذف المنتج من الخادم.");
      }
    } catch (error) {
      console.error(error);
      triggerNotification("حدث خطأ أثناء محاولة الحذف.");
    }
  };

  const handleSaveProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name || !editingProduct.category) {
      triggerNotification("اسم المنتج والفئة مطلوبان عيوني!");
      return;
    }

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingProduct),
      });

      if (response.ok) {
        const savedProd = await response.json();
        onRefreshProducts();
        setIsProductFormOpen(false);
        setEditingProduct(null);
        triggerNotification(`تم حفظ منتج "${savedProd.name}" بنجاح في قاعدة البيانات!`);
      } else {
        const errData = await response.json();
        triggerNotification(`خطأ في الحفظ: ${errData.error || 'يرجى المحاولة مجدداً'}`);
      }
    } catch (error) {
      console.error(error);
      triggerNotification("فشل الاتصال بالخادم لحفظ المنتج.");
    }
  };

  const handleSaveConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Fetch existing config first so we don't overwrite slides
      let currentConfig = {};
      try {
        const getRes = await fetch('/api/config');
        if (getRes.ok) {
          currentConfig = await getRes.json();
        }
      } catch (getErr) {
        console.error("Error fetching config before save:", getErr);
      }

      const updatedConfig = {
        ...currentConfig,
        heroImage: heroImageUrl,
        slogan: storeSlogan,
        rate: exchangeRate,
        adminPassword: adminPasswordConfig,
        salesPassword: salesPasswordConfig
      };

      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedConfig),
      });

      if (response.ok) {
        triggerNotification("تم حفظ إعدادات وتخصيصات المتجر بنجاح وجعلها عامة! ⚙️");
        if (onConfigUpdated) {
          onConfigUpdated(updatedConfig);
        }
      } else {
        triggerNotification("عذراً، فشل تحديث إعدادات المتجر.");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("حدث خطأ في الشبكة أثناء حفظ الإعدادات.");
    }
  };

  const handleAddNewProductClick = () => {
    setEditingProduct({
      id: '',
      name: '',
      englishName: '',
      description: '',
      priceUSD: 0,
      category: 'lighting-indoor',
      subcategory: '',
      image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=600&q=80',
      rating: 5.0,
      reviewsCount: 1,
      specs: {
        'الضمان': 'سنتين استبدال فوري',
        'المنشأ': 'أصلي عالي الجودة'
      },
      inStock: true,
      tags: []
    });
    setNewSpecKey('');
    setNewSpecValue('');
    setIsProductFormOpen(true);
  };

  const handleEditProductClick = (product: Product) => {
    setEditingProduct({ ...product });
    setNewSpecKey('');
    setNewSpecValue('');
    setIsProductFormOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        triggerNotification("عذراً، يرجى اختيار ملف صورة صحيح.");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 800;
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
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
            
            setEditingProduct(prev => prev ? { ...prev, image: compressedBase64 } : null);
            triggerNotification("تم رفع وضغط الصورة بنجاح! 📸");
          } else {
            const base64String = event.target?.result as string;
            setEditingProduct(prev => prev ? { ...prev, image: base64String } : null);
            triggerNotification("تم رفع الصورة بنجاح! 📸");
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const addSpecification = () => {
    if (!newSpecKey.trim() || !newSpecValue.trim()) return;
    setEditingProduct(prev => {
      if (prev) {
        const currentSpecs = { ...(prev.specs || {}) };
        currentSpecs[newSpecKey.trim()] = newSpecValue.trim();
        return { ...prev, specs: currentSpecs };
      }
      return prev;
    });
    setNewSpecKey('');
    setNewSpecValue('');
  };

  const removeSpecification = (key: string) => {
    setEditingProduct(prev => {
      if (prev) {
        const currentSpecs = { ...(prev.specs || {}) };
        delete currentSpecs[key];
        return { ...prev, specs: currentSpecs };
      }
      return prev;
    });
  };

  // Export orders as CSV - Professional permission
  const exportOrdersCSV = () => {
    if (orders.length === 0) {
      triggerNotification("لا توجد طلبات لتصديرها عيوني.");
      return;
    }
    
    let csvContent = "\uFEFF"; // UTF-8 BOM for Arabic support
    csvContent += "رقم الطلب,تاريخ الطلب,اسم الزبون,الهاتف,العنوان,طريقة الدفع,المجموع بالدولار,المجموع بالدينار,حالة الطلب\n";
    
    orders.forEach(o => {
      const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleDateString('ar-IQ') : 'غير محدد';
      const cleanAddress = (o.customerAddress || '').replace(/,/g, ' ');
      csvContent += `${o.id},${dateStr},${o.customerName},${o.customerPhone},${cleanAddress},${o.paymentMethod},${o.totalUSD}$,${o.totalIQD} د.ع,${o.status || 'قيد المعالجة'}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `newsram_orders_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNotification("تم تصدير كشف المبيعات والطلبيات بصيغة Excel/CSV بنجاح! 📊");
  };

  // Print Professional Iraqi Customer Invoice
  const printOrderInvoice = (order: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      triggerNotification("عذراً، يرجى السماح بالنوافذ المنبثقة لطباعة الفاتورة عيوني.");
      return;
    }

    const itemsHtml = (order.items || []).map((it: any, index: number) => `
      <tr style="border-bottom: 1px solid #e5e7eb; font-size: 12px;">
        <td style="padding: 10px; text-align: center;">${index + 1}</td>
        <td style="padding: 10px; text-align: right; font-weight: bold;">${it.name}</td>
        <td style="padding: 10px; text-align: center; font-family: monospace;">${it.quantity}</td>
        <td style="padding: 10px; text-align: center; font-family: monospace;">${((it.priceUSD || 0) * exchangeRate).toLocaleString()} د.ع</td>
        <td style="padding: 10px; text-align: center; font-family: monospace; font-weight: bold;">${(((it.priceUSD || 0) * exchangeRate) * it.quantity).toLocaleString()} د.ع</td>
      </tr>
    `).join('');

    const invoiceContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>وصل تجهيز وشحن - طلب رقم #${order.id}</title>
        <style>
          body {
            font-family: 'system-ui', -apple-system, sans-serif;
            margin: 40px;
            color: #1c1917;
            background-color: #ffffff;
            direction: rtl;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px double #d97706;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo-area h1 {
            margin: 0;
            font-size: 24px;
            color: #1c1917;
            letter-spacing: 1px;
          }
          .logo-area p {
            margin: 5px 0 0 0;
            font-size: 11px;
            color: #b45309;
            font-weight: bold;
          }
          .invoice-title {
            text-align: left;
          }
          .invoice-title h2 {
            margin: 0;
            color: #d97706;
            font-size: 20px;
          }
          .invoice-title p {
            margin: 5px 0 0 0;
            font-size: 12px;
            color: #78716c;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
            background-color: #faf8f5;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #f5e0c3;
          }
          .details-block p {
            margin: 6px 0;
            font-size: 12px;
          }
          .details-block strong {
            color: #1c1917;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th {
            background-color: #f59e0b;
            color: #ffffff;
            font-size: 12px;
            font-weight: bold;
            padding: 10px;
          }
          .summary-area {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
          }
          .summary-box {
            width: 300px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            background-color: #faf8f5;
          }
          .summary-line {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 12px;
          }
          .summary-line.total {
            border-top: 1px solid #e5e7eb;
            margin-top: 8px;
            padding-top: 10px;
            font-size: 14px;
            font-weight: 1000;
            color: #b45309;
          }
          .footer-note {
            margin-top: 50px;
            text-align: center;
            font-size: 11px;
            color: #78716c;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
          }
          .signatures {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            padding: 0 40px;
          }
          .sig-line {
            border-top: 1px dashed #a8a29e;
            width: 150px;
            text-align: center;
            margin-top: 40px;
            padding-top: 8px;
            color: #78716c;
          }
          @media print {
            body { margin: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: left;">
          <button onclick="window.print()" style="background-color: #f59e0b; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer;">🖨️ بدء الطباعة الآن</button>
        </div>

        <div class="header">
          <div class="logo-area">
            <h1>NEWSRAM</h1>
            <p>الإنارة الحديثة الفاخرة والمفاتيح الذكية العراقية 💡🇮🇶</p>
          </div>
          <div class="invoice-title">
            <h2>وصل تجهيز وشحن المنتجات</h2>
            <p>رقم الفاتورة المعتمد: <strong style="font-family: monospace;">#${order.id}</strong></p>
          </div>
        </div>

        <div class="details-grid">
          <div class="details-block">
            <p>👤 <strong>الاسم المستلم:</strong> ${order.customerName}</p>
            <p>📞 <strong>رقم الهاتف:</strong> <span style="font-family: monospace; font-weight: bold;">${order.customerPhone}</span></p>
            <p>📍 <strong>العنوان والموقع:</strong> ${order.customerAddress}</p>
          </div>
          <div class="details-block" style="text-align: left;">
            <p>📅 <strong>تاريخ الطلب:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleString('ar-IQ') : 'غير محدد'}</p>
            <p>💳 <strong>طريقة الدفع:</strong> ${
              order.paymentMethod === 'cod' ? 'الدفع عند الاستلام المحلي' : 
              order.paymentMethod === 'zain' ? 'زين كاش (Zain Cash)' : 
              order.paymentMethod === 'asia' ? 'آسيا حوالة' : 'ماستر كارد'
            }</p>
            <p>🚚 <strong>حالة الشحن والتسليم:</strong> ${order.status || 'قيد المعالجة'}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 80px;">ت</th>
              <th style="text-align: right;">المنتج الكهربائي / الإنارة الفاخرة</th>
              <th style="width: 80px;">الكمية</th>
              <th style="width: 120px;">سعر المفرد</th>
              <th style="width: 120px;">المجموع فرعي</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="summary-area">
          <div class="summary-box">
            <div class="summary-line total">
              <span>الحساب النهائي بالدينار:</span>
              <span>${order.totalIQD?.toLocaleString() || '0'} د.ع</span>
            </div>
          </div>
        </div>

        <div class="signatures">
          <div>
            <p>توقيع مسؤول المعرض</p>
            <div class="sig-line">إدارة نيوسرام</div>
          </div>
          <div>
            <p>توقيع مستلم الطلبية</p>
            <div class="sig-line">الزبون المحترم</div>
          </div>
        </div>

        <div class="footer-note">
          <p>شكراً لثقتكم بمتجر نيوسرام - بغداد، العراق 💡</p>
          <p>ملاحظة: يرجى فحص كافة الأجهزة الكهربائية والإنارة ومطابقتها للمواصفات والضمان المكتوب قبل مغادرة مندوب التوصيل.</p>
        </div>

        <script>
          window.onload = function() {
            // Auto-trigger print view for convenience
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(invoiceContent);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  // Render elegant password / verification screen
  if (!isAdminAuthenticated && showPasswordDialog) {
    return (
      <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-amber-500/20 animate-fade-in" dir="rtl">
          <div className="bg-[#FCFAF7] text-stone-900 p-5 flex justify-between items-center border-b border-amber-500/15">
            <h4 className="font-bold text-sm text-amber-800 flex items-center gap-1.5">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              لوحة تحكم المشرف (NEWSRAM)
            </h4>
            <button 
              onClick={onClose}
              className="p-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-500 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleVerifyPassword} className="p-6 space-y-4">
            <p className="text-xs text-stone-500 leading-relaxed font-medium">
              مرحباً بك عيوني في الواجهة الإدارية لنيوسرام. يرجى اختيار صفتك وكتابة رمز المرور الخاص بك للدخول الآمن.
            </p>

            {/* Role Selection Tabs */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-stone-500 font-bold uppercase">الدخول بصفتي</label>
              <div className="grid grid-cols-2 gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLoginRole('admin');
                    setPasswordError('');
                  }}
                  className={`py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${selectedLoginRole === 'admin' ? 'bg-amber-500 text-black font-black shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
                >
                  👑 مدير عام
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLoginRole('sales');
                    setPasswordError('');
                  }}
                  className={`py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${selectedLoginRole === 'sales' ? 'bg-amber-500 text-black font-black shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
                >
                  🤝 مسؤول مبيعات
                </button>
              </div>
              <p className="text-[10px] text-amber-950 font-medium leading-relaxed bg-amber-50/60 border border-amber-500/10 rounded-lg p-2.5">
                {selectedLoginRole === 'admin' 
                  ? "صلاحيات كاملة للتحكم بالمخزن، تعديل وحذف الأجهزة، الإحصائيات والأرباح، وتخصيص الموقع بالكامل عيوني."
                  : "صلاحيات محددة فقط لإدارة فواتير المبيعات، تحديث حالات الشحن والتوصيل، وطباعة وصولات الزبائن. ممنوع تماماً من الإحصائيات أو تعديل المنتجات."}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-stone-500 font-bold uppercase">رمز المرور الخاص بالصفة المختارة</label>
              <input 
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder={selectedLoginRole === 'admin' ? "اكتب رمز المدير أو اضغط مباشرة" : "اكتب رمز المبيعات أو اضغط مباشرة"}
                className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-lg p-3 text-center text-sm text-stone-900 focus:outline-none"
                autoFocus
              />
            </div>
            {passwordError && (
              <p className="text-rose-600 text-[11px] font-bold text-center">{passwordError}</p>
            )}
            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black py-3 rounded-lg text-xs transition-all cursor-pointer shadow-md shadow-amber-500/10"
            >
              تأكيد الدخول الآمن للوحة المشرف 🚀
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Filter products for view
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                          (p.englishName || '').toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = productCategoryFilter === 'all' || p.category === productCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Filter and sort orders for view (newest first)
  const filteredOrders = [...orders]
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA; // Newest first
    })
    .filter(o => {
      const matchesSearch = (o.customerName || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
                            (o.customerPhone || '').includes(orderSearch);
      const matchesStatus = orderStatusFilter === 'all' || (o.status || 'قيد المعالجة') === orderStatusFilter;
      return matchesSearch && matchesStatus;
    });

  // Group orders by their current processing status
  const pendingOrders = filteredOrders.filter(o => (o.status || 'قيد المعالجة') === 'قيد المعالجة');
  const preparingOrders = filteredOrders.filter(o => o.status === 'قيد التجهيز');
  const deliveredOrders = filteredOrders.filter(o => o.status === 'وصل');
  const unavailableOrders = filteredOrders.filter(o => o.status === 'غير متوفر');

  // Helper to render segmented lanes (boxes) of orders
  const renderOrderSection = (
    title: string, 
    icon: string, 
    ordersList: any[], 
    bgColor: string, 
    textColor: string, 
    badgeBg: string
  ) => {
    // If we filtered specifically for one status and this section has no matches, don't render it at all
    if (orderStatusFilter !== 'all' && ordersList.length === 0) return null;
    
    return (
      <div className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden shadow-xs space-y-3 p-4">
        <div className={`flex items-center justify-between p-3 rounded-xl ${bgColor}`}>
          <div className="flex items-center gap-2">
            <span className="text-sm">{icon}</span>
            <h6 className={`font-black text-xs ${textColor}`}>{title}</h6>
          </div>
          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${badgeBg} ${textColor}`}>
            {ordersList.length} طلبات
          </span>
        </div>

        {ordersList.length === 0 ? (
          <div className="border border-dashed border-stone-200 rounded-xl p-6 text-center text-[11px] text-stone-400 font-medium">
            لا توجد طلبات في هذه الخانة حالياً عيوني ✨
          </div>
        ) : (
          <div className="space-y-3.5">
            {ordersList.map((order) => (
              <div key={order.id} className="bg-stone-50/60 border border-stone-100 rounded-xl p-4.5 space-y-4 hover:border-amber-500/15 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold bg-white px-2 py-1 rounded text-stone-950 border border-stone-200">
                      #{order.id}
                    </span>
                    <span className="text-[10px] text-stone-500">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString('ar-IQ') : 'تاريخ غير حدد'}
                    </span>
                  </div>
                  
                  {/* Order status action select */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => printOrderInvoice(order)}
                      className="bg-white hover:bg-stone-50 text-stone-700 px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer border border-stone-200 transition-colors"
                      title="طباعة وصل التجهيز الفاخر"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-600" />
                      <span>طباعة الفاتورة 🖨️</span>
                    </button>
                    
                    <span className="text-[10px] text-stone-500 font-bold">الحالة:</span>
                    <select 
                      value={order.status || 'قيد المعالجة'}
                      onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                      className="bg-white border border-stone-200 rounded-lg px-2 py-1 text-xs text-stone-800 focus:outline-none"
                    >
                      <option value="قيد المعالجة">⏳ قيد المعالجة</option>
                      <option value="قيد التجهيز">🛠️ قيد التجهيز والشحن</option>
                      <option value="وصل">✅ وصل / تم التسليم</option>
                      <option value="غير متوفر">❌ غير متوفر حالياً</option>
                    </select>
                  </div>
                </div>

                {/* Customer info & Items list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-normal">
                  <div className="space-y-1.5 bg-white p-3 rounded-xl border border-stone-200/50">
                    <p className="text-amber-800 font-black flex items-center gap-1.5 border-b border-stone-100 pb-1 mb-1">
                      <User className="w-3.5 h-3.5 text-amber-700" />
                      <span>بيانات العميل المستلم:</span>
                    </p>
                    <p className="text-stone-900 font-black">👤 الاسم: {order.customerName}</p>
                    <p className="text-stone-700 font-bold">📞 هاتف الزبون: <span className="font-mono text-amber-900">{order.customerPhone}</span></p>
                    <p className="text-stone-700 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-stone-500" />
                      <span>موقع السكن: {order.customerAddress}</span>
                    </p>
                    <p className="text-stone-700 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-stone-400" />
                      <span>طريقة الدفع: {
                        order.paymentMethod === 'cod' ? 'عند الاستلام' : 
                        order.paymentMethod === 'zain' ? 'زين كاش' : 
                        order.paymentMethod === 'asia' ? 'آسيا حوالة' : 'ماستركارد'
                      }</span>
                    </p>
                  </div>

                  <div className="space-y-1.5 bg-white p-3 rounded-xl border border-stone-200/50">
                    <p className="text-amber-800 font-black flex items-center gap-1.5 border-b border-stone-100 pb-1 mb-1">
                      <ShoppingBag className="w-3.5 h-3.5 text-amber-700" />
                      <span>الأجهزة والإنارة المطلوبة:</span>
                    </p>
                    <div className="space-y-1 pl-1 max-h-[120px] overflow-y-auto">
                      {order.items && order.items.map((it: any, i: number) => (
                        <div key={i} className="flex justify-between text-stone-700 bg-stone-50 border border-stone-200/60 p-1.5 rounded text-[11px] mb-1">
                          <span>• {it.name} <span className="text-stone-500 font-bold">({it.quantity}x)</span></span>
                          <span className="font-mono text-stone-900 font-bold">{((it.priceUSD * exchangeRate) * it.quantity).toLocaleString()} د.ع</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-stone-200 font-black text-amber-800 text-[11px]">
                      <span>المجموع الكلي:</span>
                      <span>{order.totalIQD?.toLocaleString() || '0'} د.ع</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-amber-500/20 animate-fade-in" dir="rtl">
        
        {/* Header */}
        <div className="bg-[#FCFAF7] text-stone-900 p-5 flex flex-col lg:flex-row gap-4 justify-between items-center border-b border-amber-500/15 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-lg text-black">
              <ShieldCheck className="w-5 h-5 font-bold" />
            </div>
            <div>
              <h4 className="font-bold text-base text-stone-900">لوحة تحكم المشرف والادارة الفاخرة</h4>
              <p className="text-[10px] text-stone-500">مرحباً بك عيوني! تحكم في معروضات المتجر، مبيعاتك، الأسعار، واطبع الإيصالات للزبائن.</p>
            </div>
          </div>
          
          {/* Tab Switcher */}
          <div className="flex items-center bg-stone-100 p-1 rounded-lg border border-stone-200 text-xs font-bold shrink-0">
            {adminRole !== 'sales' && (
              <button
                type="button"
                onClick={() => setAdminTab('products')}
                className={`px-3 py-2 rounded-md transition-all cursor-pointer ${adminTab === 'products' ? 'bg-amber-500 text-black font-black' : 'text-stone-600 hover:text-stone-900'}`}
              >
                📦 معروضات المخزن
              </button>
            )}
            <button
              type="button"
              onClick={() => setAdminTab('orders')}
              className={`px-3 py-2 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${adminTab === 'orders' ? 'bg-amber-500 text-black font-black' : 'text-stone-600 hover:text-stone-900'}`}
            >
              💼 فواتير المبيعات
              {orders.filter(o => o.status === 'قيد المعالجة' || !o.status).length > 0 && (
                <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                  {orders.filter(o => o.status === 'قيد المعالجة' || !o.status).length}
                </span>
              )}
            </button>
            {adminRole !== 'sales' && (
              <>
                <button
                  type="button"
                  onClick={() => setAdminTab('stats')}
                  className={`px-3 py-2 rounded-md transition-all flex items-center gap-1 cursor-pointer ${adminTab === 'stats' ? 'bg-amber-500 text-black font-black' : 'text-stone-600 hover:text-stone-900'}`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>إحصائيات الأداء</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdminTab('settings')}
                  className={`px-3 py-2 rounded-md transition-all flex items-center gap-1 cursor-pointer ${adminTab === 'settings' ? 'bg-amber-500 text-black font-black' : 'text-stone-600 hover:text-stone-900'}`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>الإعدادات العامة</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {adminTab === 'products' && (
              <button
                onClick={handleAddNewProductClick}
                className="bg-amber-500 hover:bg-amber-600 text-black font-black text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                + إضافة منتج جديد
              </button>
            )}
            {adminTab === 'orders' && (
              <button
                onClick={exportOrdersCSV}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير Excel</span>
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-500 transition-colors cursor-pointer border border-stone-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {adminTab === 'orders' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-stone-50">
            {/* Filter orders */}
            <div className="bg-white p-4 rounded-xl border border-amber-500/10 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input 
                  type="text" 
                  placeholder="ابحث عن الفاتورة بالاسم أو رقم الهاتف..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-lg py-2 pr-9 pl-3 text-xs text-stone-900 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-[11px] text-stone-500 shrink-0 font-bold">تصفية حسب الحالة:</span>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-700 focus:outline-none w-full sm:w-auto"
                >
                  <option value="all">كل الطلبات</option>
                  <option value="قيد المعالجة">⏳ قيد المعالجة</option>
                  <option value="قيد التجهيز">🛠️ قيد التجهيز والشحن</option>
                  <option value="وصل">✅ وصل / تم التسليم</option>
                  <option value="غير متوفر">❌ غير متوفر حالياً</option>
                </select>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-amber-500/10 space-y-3">
                <p className="text-xs text-stone-500 font-medium">لا يوجد أي مبيعات أو طلبات مسجلة تطابق التصفية حالياً عيوني.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <h5 className="text-xs font-bold text-stone-700">فواتير مبيعات الزبائن وتنسيق الشحن والمخازن ({filteredOrders.length} طلبية مرتبة من الأحدث للأقدم):</h5>
                
                <div className="grid grid-cols-1 gap-6">
                  {/* Category 1: Pending / New Orders */}
                  {renderOrderSection(
                    '⏳ طلبات جديدة قيد المعالجة والتحقق',
                    '⏳',
                    pendingOrders,
                    'bg-amber-50/70 border border-amber-100',
                    'text-amber-800',
                    'bg-amber-100'
                  )}

                  {/* Category 2: Preparing / Shipping */}
                  {renderOrderSection(
                    '🛠️ طلبات قيد التجهيز والتعبئة والشحن',
                    '🛠️',
                    preparingOrders,
                    'bg-sky-50/70 border border-sky-100',
                    'text-sky-800',
                    'bg-sky-100'
                  )}

                  {/* Category 3: Delivered */}
                  {renderOrderSection(
                    '✅ طلبات مكتملة (تم التوصيل والتسليم للزبون)',
                    '✅',
                    deliveredOrders,
                    'bg-emerald-50/70 border border-emerald-100',
                    'text-emerald-800',
                    'bg-emerald-100'
                  )}

                  {/* Category 4: Unavailable */}
                  {renderOrderSection(
                    '❌ طلبات غير متوفرة أو ملغاة',
                    '❌',
                    unavailableOrders,
                    'bg-rose-50/70 border border-rose-100',
                    'text-rose-800',
                    'bg-rose-100'
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {adminTab === 'products' && (
          <div className="flex-1 overflow-y-auto p-6 bg-stone-50 space-y-4">
            {/* Filter products */}
            <div className="bg-white p-4 rounded-xl border border-amber-500/10 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input 
                  type="text" 
                  placeholder="ابحث عن جهاز كهربائي أو إنارة بالاسم..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-lg py-2 pr-9 pl-3 text-xs text-stone-900 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-[11px] text-stone-500 shrink-0 font-bold">الفئة الرئيسية:</span>
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-700 focus:outline-none w-full sm:w-auto"
                >
                  <option value="all">كل الفئات المعروضة</option>
                  <option value="lighting-indoor">💡 الإنارة الداخلية</option>
                  <option value="lighting-outdoor">☀️ الإنارة الخارجية</option>
                  <option value="smart-switches">🔌 المفاتيح والذكاء المنزلي</option>
                  <option value="appliances">🌬️ التهوية والأجهزة</option>
                  <option value="electrical-supplies">🔌 الأسلاك والتأسيسات</option>
                </select>
              </div>
            </div>

            {/* Excel / CSV Importer Panel */}
            <div className="bg-white rounded-xl border border-amber-500/10 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setShowImportSection(!showImportSection)}
                className="w-full flex items-center justify-between p-4 bg-amber-500/5 hover:bg-amber-500/10 text-amber-950 font-black text-xs transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                  <span>📥 استيراد وتحديث المنتجات من ملف Excel / CSV عيوني</span>
                </div>
                <span className="text-stone-400 font-normal">
                  {showImportSection ? 'إغلاق واجهة الاستيراد ▲' : 'فتح واجهة الاستيراد ▼'}
                </span>
              </button>

              {showImportSection && (
                <div className="p-5 border-t border-stone-100 space-y-4 text-xs">
                  <p className="text-stone-500 leading-relaxed">
                    يمكنك استيراد مئات الأجهزة الكهربائية والإنارة وتحديث أسعارها وصورها بلحظة واحدة! يدعم النظام ملفات Excel (.xlsx, .xls) وملفات CSV.
                  </p>
                  
                  {/* Instructions */}
                  <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 space-y-1.5 text-[11px] text-stone-600">
                    <span className="font-bold text-stone-900 block">💡 الأعمدة المدعومة وتسمياتها الذكية في الملف:</span>
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong className="text-stone-800 font-bold">الاسم:</strong> اسم المنتج بالعربي (مثال: "سبوت لايت ليد 7 واط") [مطلوب].</li>
                      <li><strong className="text-stone-800 font-bold">الاسم بالانجليزي:</strong> الاسم باللغة الإنجليزية (مثال: "LED Spotlight 7W").</li>
                      <li><strong className="text-stone-800 font-bold">السعر بالدولار / السعر:</strong> السعر بالدولار الأمريكي (مثال: 6.5 أو 145) [مطلوب].</li>
                      <li><strong className="text-stone-800 font-bold">الفئة:</strong> الفئة الرئيسية للمنتج (الإنارة الداخلية، الإنارة الخارجية، المفاتيح الذكية، التهوية والأجهزة، الأسلاك والتأسيسات).</li>
                      <li><strong className="text-stone-800 font-bold">رابط الصورة / الصورة:</strong> رابط مباشر لصورة المنتج على الإنترنت (يمكنك تركه فارغاً وسيتم تعيين صورة افتراضية).</li>
                      <li><strong className="text-stone-800 font-bold">المواصفات:</strong> تفاصيل فنية إضافية (مثل "القدرة: 12 واط, الضمان: سنتين").</li>
                    </ul>
                  </div>

                  {/* File Upload Target */}
                  {excelProductsPreview.length === 0 ? (
                    <label className="border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer bg-stone-50/50 hover:bg-amber-50/20 transition-all">
                      <input 
                        type="file" 
                        accept=".xlsx, .xls, .csv" 
                        onChange={handleExcelFileSelect}
                        className="hidden" 
                      />
                      <Upload className="w-8 h-8 text-stone-400 hover:text-amber-500 transition-colors" />
                      <span className="font-bold text-stone-700">اضغط هنا أو اسحب ملف الـ Excel عيوني 📦</span>
                      <span className="text-[10px] text-stone-400">يدعم صيغ .xlsx و .xls و .csv</span>
                    </label>
                  ) : (
                    <div className="space-y-4">
                      {/* Preview Loaded Products */}
                      <div className="border border-stone-200 rounded-xl p-4 bg-amber-50/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            <span className="font-black text-stone-900">جاهز للاستيراد: {excelFileName}</span>
                          </div>
                          <span className="font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full text-[10px]">
                            {excelProductsPreview.length} منتج صالح ومكتمل الاسم
                          </span>
                        </div>

                        {/* List of some products preview */}
                        <div className="border border-stone-200/60 rounded-lg overflow-hidden bg-white text-[11px]">
                          <table className="w-full text-right border-collapse">
                            <thead>
                              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold">
                                <th className="p-2 text-right">اسم المنتج</th>
                                <th className="p-2 text-right">الفئة</th>
                                <th className="p-2 text-center">السعر بالدولار</th>
                                <th className="p-2 text-center">السعر بالدينار</th>
                              </tr>
                            </thead>
                            <tbody>
                              {excelProductsPreview.slice(0, 5).map((p, i) => (
                                <tr key={i} className="border-b border-stone-100 last:border-none">
                                  <td className="p-2 font-bold text-stone-900 truncate max-w-[150px]">{p.name}</td>
                                  <td className="p-2 text-stone-600">
                                    {p.category === 'lighting-indoor' ? '💡 إنارة داخلية' :
                                     p.category === 'lighting-outdoor' ? '☀️ إنارة خارجية' :
                                     p.category === 'smart-switches' ? '🔌 مفاتيح ذكية' :
                                     p.category === 'appliances' ? '🌬️ تهوية وأجهزة' : '🔌 أسلاك وتأسيس'}
                                  </td>
                                  <td className="p-2 text-center font-mono font-medium text-stone-600">${p.priceUSD}</td>
                                  <td className="p-2 text-center font-mono font-bold text-amber-700">{(p.priceUSD * exchangeRate).toLocaleString()} د.ع</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {excelProductsPreview.length > 5 && (
                            <div className="bg-stone-50 p-2 text-center font-bold text-stone-500 border-t border-stone-100">
                              وغيرها {excelProductsPreview.length - 5} منتج إضافي...
                            </div>
                          )}
                        </div>

                        {/* Settings for import */}
                        <div className="space-y-2 pt-2 border-t border-stone-200">
                          <label className="text-[10px] text-stone-500 font-bold uppercase block">طريقة الاستيراد المفضلة:</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setReplaceAllOnImport(false)}
                              className={`p-2.5 rounded-lg border text-right transition-all cursor-pointer ${!replaceAllOnImport ? 'bg-amber-500/10 border-amber-500 text-amber-950 font-black' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'}`}
                            >
                              <div className="text-xs font-bold">🤝 تحديث وإضافة للموجود حالياً</div>
                              <div className="text-[9px] text-stone-400 font-medium">سيقوم بتحديث أسعار المنتجات ذات نفس الاسم، وإضافة المنتجات الجديدة للمخزن.</div>
                            </button>
                            <button
                              type="button"
                              onClick={() => setReplaceAllOnImport(true)}
                              className={`p-2.5 rounded-lg border text-right transition-all cursor-pointer ${replaceAllOnImport ? 'bg-rose-500/10 border-rose-500 text-rose-950 font-black' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'}`}
                            >
                              <div className="text-xs font-bold text-rose-800">⚠️ مسح كامل المعروض واستبداله بالملف</div>
                              <div className="text-[9px] text-stone-400 font-medium">يقوم بحذف كل الأجهزة والإنارة الحالية من الموقع ووضع منتجات هذا الملف فقط. خطير جداً!</div>
                            </button>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 pt-3 border-t border-stone-200 justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setExcelProductsPreview([]);
                              setExcelFileName('');
                            }}
                            className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2.5 rounded-lg font-bold cursor-pointer transition-colors"
                          >
                            إلغاء واختيار ملف آخر 🗑️
                          </button>
                          <button
                            type="button"
                            onClick={handleExecuteImport}
                            disabled={isImporting}
                            className="bg-amber-500 hover:bg-amber-600 text-black px-6 py-2.5 rounded-lg font-black flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                          >
                            {isImporting ? (
                              <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin font-bold"></span>
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            <span>بدء الاستيراد الفوري والدمج بالموقع 🚀</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <h5 className="text-xs font-bold text-stone-700 mb-2">قائمة الأجهزة والإنارة المعروضة حالياً ({filteredProducts.length} منتج):</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map((prod) => (
                <div key={prod.id} className="bg-white border border-amber-500/10 rounded-xl p-4 flex gap-4 hover:border-amber-500/20 transition-all shadow-sm">
                  <img 
                    src={prod.image} 
                    alt={prod.name} 
                    className="w-16 h-16 rounded-lg object-cover bg-stone-100 border border-stone-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0 space-y-1 text-xs">
                    <h6 className="font-bold text-stone-900 truncate">{prod.name}</h6>
                    <p className="text-[10px] text-stone-400 truncate">{prod.englishName}</p>
                    <div className="flex justify-between items-center pt-1">
                      <span className="font-black text-amber-700 font-mono text-[13px]">{(prod.priceUSD * exchangeRate).toLocaleString()} د.ع</span>
                      <span className="text-[10px] bg-amber-50 text-amber-900 font-bold px-2 py-0.5 rounded border border-amber-200">{prod.subcategory || 'كهربائيات'}</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleEditProductClick(prod)}
                        className="bg-stone-50 hover:bg-amber-500/10 hover:text-amber-800 text-stone-700 border border-stone-200 font-bold px-3 py-1.5 rounded transition-all cursor-pointer text-[10px]"
                      >
                        تعديل مواصفات وسعر ⚙️
                      </button>
                      <button
                        onClick={() => handleDeleteProductClick(prod.id, prod.name)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-3 py-1.5 rounded transition-all cursor-pointer text-[10px]"
                      >
                        حذف المنتج 🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {adminTab === 'stats' && (
          <div className="flex-1 overflow-y-auto p-6 bg-stone-50 space-y-6">
            <h5 className="text-xs font-bold text-stone-700">إحصائيات الأداء المالي والتجهيز الاحترافية لمتجر نيوسرام:</h5>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-amber-500/10 space-y-1 shadow-sm">
                <span className="text-[10px] text-stone-500 font-bold block">معدل قيمة الطلب الواحد</span>
                <span className="text-xl font-black text-amber-700 font-sans">
                  {(orders.length > 0 ? Math.round(orders.reduce((acc, o) => acc + (o.totalIQD || 0), 0) / orders.length) : 0).toLocaleString()} د.ع
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-amber-500/10 space-y-1 shadow-sm">
                <span className="text-[10px] text-stone-500 font-bold block">إجمالي المبيعات (بالعراقي)</span>
                <span className="text-xl font-black text-amber-700">
                  {orders.reduce((acc, o) => acc + (o.totalIQD || 0), 0).toLocaleString()} د.ع
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-amber-500/10 space-y-1 shadow-sm">
                <span className="text-[10px] text-stone-500 font-bold block">عدد الطلبيات المستلمة</span>
                <span className="text-xl font-black text-stone-900 font-mono">{orders.length} طلبات</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-amber-500/10 space-y-1 shadow-sm">
                <span className="text-[10px] text-stone-500 font-bold block">قيد المعالجة والتسليم</span>
                <span className="text-xl font-black text-rose-600 font-mono">
                  {orders.filter(o => o.status === 'قيد المعالجة' || !o.status).length} طلبية
                </span>
              </div>
            </div>

            {/* Advanced Stats Charts breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment Methods Distribution */}
              <div className="bg-white p-5 rounded-xl border border-amber-500/10 space-y-3 shadow-sm">
                <h6 className="font-bold text-xs text-stone-900">💳 طرق الدفع الأكثر طلباً من قبل زبائنك:</h6>
                <div className="space-y-2 text-xs">
                  {['cod', 'zain', 'asia', 'card'].map(method => {
                    const count = orders.filter(o => o.paymentMethod === method).length;
                    const percent = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
                    const name = method === 'cod' ? 'عند الاستلام' : method === 'zain' ? 'زين كاش' : method === 'asia' ? 'آسيا حوالة' : 'ماستر كارد';
                    return (
                      <div key={method} className="space-y-1">
                        <div className="flex justify-between font-bold text-stone-700">
                          <span>{name} ({count} طلب)</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="w-full bg-stone-100 rounded-full h-2">
                          <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Status Distribution */}
              <div className="bg-white p-5 rounded-xl border border-amber-500/10 space-y-3 shadow-sm">
                <h6 className="font-bold text-xs text-stone-900">⏳ توزيع حالات تجهيز الطلبيات:</h6>
                <div className="space-y-2 text-xs">
                  {['وصل', 'قيد التجهيز', 'قيد المعالجة', 'غير متوفر'].map(status => {
                    const count = orders.filter(o => (o.status || 'قيد المعالجة') === status).length;
                    const percent = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
                    const color = status === 'وصل' ? 'bg-emerald-500' : status === 'قيد التجهيز' ? 'bg-amber-500' : status === 'غير متوفر' ? 'bg-rose-500' : 'bg-cyan-500';
                    return (
                      <div key={status} className="space-y-1">
                        <div className="flex justify-between font-bold text-stone-700">
                          <span>{status} ({count} طلبية)</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="w-full bg-stone-100 rounded-full h-2">
                          <div className="h-2 rounded-full LoadIndicator" style={{ width: `${percent}%`, backgroundColor: status === 'وصل' ? '#10b981' : status === 'قيد التجهيز' ? '#f59e0b' : status === 'غير متوفر' ? '#ef4444' : '#06b6d4' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Top Bestselling items simulated listing */}
            <div className="bg-white p-5 rounded-xl border border-amber-500/10 space-y-3 shadow-sm">
              <h6 className="font-bold text-xs text-stone-900">🏆 المنتجات الأكثر إقبالاً وطلباً في السلة:</h6>
              <div className="divide-y divide-stone-100 text-xs">
                {products.slice(0, 5).map((p, idx) => (
                  <div key={p.id} className="flex justify-between items-center py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-stone-400 font-bold">#0{idx + 1}</span>
                      <span className="font-bold text-stone-800">{p.name}</span>
                    </div>
                    <span className="bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded text-[10px]">
                      مستشار الإنارة يرشحه بكثرة 🔥
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {adminTab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-6 bg-stone-50 space-y-6">
            <h5 className="text-xs font-bold text-stone-700">تخصيص متجر نيوسرام والتحكم في الواجهة الأمامية:</h5>

            <form onSubmit={handleSaveConfigSubmit} className="bg-white p-6 rounded-xl border border-amber-500/10 space-y-4 shadow-sm">
              <h6 className="font-bold text-xs text-stone-900 border-b border-stone-100 pb-2">🖼️ تخصيص صورة وخلفية المعرض الرئيسية:</h6>
              
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-500 font-bold uppercase">رابط صورة الهيرو (خلفية الإضاءة الفخمة)</label>
                <input 
                  type="text"
                  value={heroImageUrl}
                  onChange={(e) => setHeroImageUrl(e.target.value)}
                  placeholder="مثال: https://images.unsplash.com/photo-1565538810844-1e1194826ff0"
                  className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-500 font-bold uppercase">شعار السطر الترحيبي العام</label>
                <input 
                  type="text"
                  value={storeSlogan}
                  onChange={(e) => setStoreSlogan(e.target.value)}
                  placeholder="أدخل الشعار المميز للموقع..."
                  className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-500 font-bold uppercase">سعر صرف الدولار المعتمد مقابل الدينار (ثابت)</label>
                  <input 
                    type="number"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(parseInt(e.target.value) || 1500)}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-500 font-bold uppercase">صلاحيات النسخ والاحتياط</label>
                  <div className="pt-1.5 text-stone-500 text-[11px] font-medium">
                    * يتم معالجة الحساب فورا وتحديثه بكامل التطبيق.
                  </div>
                </div>
              </div>

              <h6 className="font-bold text-xs text-stone-900 border-b border-stone-100 pb-2 pt-2">🔑 إدارة كلمات المرور والصلاحيات:</h6>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-500 font-bold uppercase">رمز مرور المدير العام (كامل الصلاحيات 👑)</label>
                  <input 
                    type="text"
                    value={adminPasswordConfig}
                    onChange={(e) => setAdminPasswordConfig(e.target.value)}
                    placeholder="اتركه فارغاً للسماح بالدخول المباشر"
                    className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none"
                  />
                  <p className="text-[9px] text-stone-500 font-medium">المدير العام يمتلك حق تعديل الأجهزة والأسعار والاطلاع على الأرباح.</p>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-500 font-bold uppercase">رمز مرور مسؤول المبيعات (المبيعات والطلبات فقط 🤝)</label>
                  <input 
                    type="text"
                    value={salesPasswordConfig}
                    onChange={(e) => setSalesPasswordConfig(e.target.value)}
                    placeholder="رمز مرور المبيعات (مثال: sales123)"
                    className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none"
                  />
                  <p className="text-[9px] text-stone-500 font-medium">مسؤول المبيعات يرى فقط فواتير المبيعات ويحدث حالات الشحن ويطبع الوصولات.</p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black py-3 rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-amber-500/10"
              >
                حفظ تعديلات المتجر وإعادة النشر فورا ⚙️
              </button>
            </form>

            {/* General Backup options */}
            <div className="bg-white p-6 rounded-xl border border-amber-500/10 space-y-3 shadow-sm">
              <h6 className="font-bold text-xs text-stone-900">💾 إدارة قواعد البيانات والنسخ الاحتياطي:</h6>
              <p className="text-xs text-stone-500 font-medium">بصفتك مديراً ومثبتاً رئيسياً، يمكنك تحميل نسخ كاملة من البيانات المدخلة بالموقع بصيغة JSON لحفظها يدوياً.</p>
              
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(products, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `newsram_products_backup_${Date.now()}.json`;
                    link.click();
                    triggerNotification("تم تحميل نسخة احتياطية من معروضات المخزن بنجاح!");
                  }}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-stone-200"
                >
                  <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                  <span>تصدير نسخة المنتجات JSON</span>
                </button>

                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(orders, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `newsram_orders_backup_${Date.now()}.json`;
                    link.click();
                    triggerNotification("تم تحميل نسخة احتياطية من سجل الفواتير بنجاح!");
                  }}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-stone-200"
                >
                  <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                  <span>تصدير سجل المبيعات JSON</span>
                </button>

                <a
                  href="/newsram_project.zip"
                  download="newsram_project.zip"
                  className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2.5 rounded-lg text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل كود المشروع الكامل ZIP 📦</span>
                </a>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Product Form Modal (Add / Edit) */}
      {isProductFormOpen && editingProduct && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg h-[80vh] flex flex-col overflow-hidden border border-amber-500/20 animate-fade-in" dir="rtl">
            
            {/* Modal Header */}
            <div className="bg-[#FCFAF7] text-stone-900 p-5 flex justify-between items-center border-b border-amber-500/15 shrink-0">
              <h4 className="font-bold text-sm text-amber-800 flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                {editingProduct.id ? 'تعديل بيانات وسعر المنتج' : 'إضافة منتج جديد للمخزن'}
              </h4>
              <button 
                onClick={() => setIsProductFormOpen(false)}
                className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-500 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSaveProductSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-500 font-bold uppercase block">اسم المنتج باللغة العربية</label>
                <input 
                  type="text"
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="مثال: سبوت لايت ليد غاطس 10 واط فريم ذهبي"
                  className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-500 font-bold uppercase block">اسم المنتج باللغة الإنجليزية</label>
                <input 
                  type="text"
                  value={editingProduct.englishName || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, englishName: e.target.value })}
                  placeholder="مثال: Recessed LED Spotlight Gold Frame 10W"
                  className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-500 font-bold uppercase block">سعر المنتج بالدولار ($)</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={editingProduct.priceUSD || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, priceUSD: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none font-mono"
                    required
                  />
                  <p className="text-[9px] text-amber-700 font-bold">يعادل تقريباً: {((editingProduct.priceUSD || 0) * exchangeRate).toLocaleString()} د.ع</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-500 font-bold uppercase block">الفئة الرئيسية للترشيح</label>
                  <select 
                    value={editingProduct.category || 'lighting-indoor'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-lg p-2.5 text-xs text-stone-700 focus:outline-none"
                  >
                    <option value="lighting-indoor">💡 الإنارة الداخلية</option>
                    <option value="lighting-outdoor">☀️ الإنارة الخارجية</option>
                    <option value="smart-switches">🔌 المفاتيح والذكاء المنزلي</option>
                    <option value="appliances">🌬️ التهوية والأجهزة</option>
                    <option value="electrical-supplies">🔌 الأسلاك والتأسيسات</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-500 font-bold uppercase block">فئة فرعية (النوع)</label>
                  <input 
                    type="text"
                    value={editingProduct.subcategory || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, subcategory: e.target.value })}
                    placeholder="مثال: ثريات معلقة"
                    className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-500 font-bold uppercase block">حالة التوفر بالمخزن</label>
                  <select 
                    value={editingProduct.inStock ? "yes" : "no"}
                    onChange={(e) => setEditingProduct({ ...editingProduct, inStock: e.target.value === "yes" })}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-lg p-2.5 text-xs text-stone-700 focus:outline-none"
                  >
                    <option value="yes">متوفر ويجهّز فوراً ✅</option>
                    <option value="no">غير متوفر حالياً ❌</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-500 font-bold uppercase block">تفاصيل ووصف المنتج</label>
                <textarea 
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="اكتب مواصفات ومميزات المنتج الكهربائي ليرشحه المساعد الذكي بدقة للزبائن عيوني..."
                  className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none h-16 resize-none"
                  required
                />
              </div>

              {/* Base64 Image upload field */}
              <div className="space-y-1.5 p-3.5 bg-[#FCFAF7] rounded-xl border border-amber-500/10 space-y-3">
                <label className="text-[10px] text-amber-800 font-bold uppercase block flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-amber-700" />
                  <span>تحميل صورة للمنتج (مع الضغط التلقائي):</span>
                </label>
                <div className="flex gap-4 items-center">
                  <img 
                    src={editingProduct.image} 
                    alt="Preview" 
                    className="w-14 h-14 rounded-lg object-cover bg-white border border-stone-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 space-y-2">
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="text-stone-600 text-xs file:bg-stone-100 file:text-stone-800 file:border-stone-200 file:px-3 file:py-1.5 file:rounded file:text-[10px] file:cursor-pointer hover:file:bg-stone-200 block w-full"
                    />
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-stone-500 font-bold shrink-0">أو رابط الصورة:</span>
                      <input 
                        type="text"
                        value={editingProduct.image || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                        placeholder="أدخل رابط الصورة مباشرة (URL)"
                        className="w-full bg-white border border-stone-200 focus:border-amber-500 rounded px-2 py-1 text-[10px] text-stone-800 focus:outline-none"
                      />
                    </div>
                    <p className="text-[9px] text-stone-500 font-medium">يمكنك تحميل ملف صورة من جهازك وسيتم ضغطه تلقائياً، أو لصق رابط صورة مباشر عيوني.</p>
                  </div>
                </div>
              </div>

              {/* Specs editor */}
              <div className="space-y-2 p-3.5 bg-[#FCFAF7] rounded-xl border border-amber-500/10">
                <label className="text-[10px] text-stone-500 font-bold uppercase block">المواصفات الفنية المعتمدة:</label>
                
                {/* Current specifications */}
                <div className="space-y-1.5">
                  {editingProduct.specs && Object.entries(editingProduct.specs).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center bg-white px-3 py-2 rounded-lg text-xs border border-stone-100">
                      <span className="font-bold text-stone-600">{key}: <span className="text-stone-900 font-bold">{value}</span></span>
                      <button 
                        type="button" 
                        onClick={() => removeSpecification(key)}
                        className="text-rose-600 hover:text-rose-700 font-bold px-1.5"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add dynamic spec inputs */}
                <div className="flex gap-2 pt-2 border-t border-stone-200">
                  <input 
                    type="text" 
                    placeholder="الميزة (مثال: المنشأ)"
                    value={newSpecKey}
                    onChange={(e) => setNewSpecKey(e.target.value)}
                    className="flex-1 bg-white border border-stone-200 rounded px-2.5 py-1.5 text-[11px] text-stone-900 focus:outline-none"
                  />
                  <input 
                    type="text" 
                    placeholder="التفصيل (مثال: تركي أصلي)"
                    value={newSpecValue}
                    onChange={(e) => setNewSpecValue(e.target.value)}
                    className="flex-1 bg-white border border-stone-200 rounded px-2.5 py-1.5 text-[11px] text-stone-900 focus:outline-none"
                  />
                  <button 
                    type="button" 
                    onClick={addSpecification}
                    className="bg-stone-100 hover:bg-amber-500 hover:text-black text-stone-800 font-black text-[10px] px-3 py-1.5 rounded transition-all border border-stone-200"
                  >
                    + إضافة
                  </button>
                </div>
              </div>

              {/* Submit button inside form */}
              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black py-3 rounded-xl text-xs transition-colors cursor-pointer mt-2 shadow-md shadow-amber-500/10"
              >
                تأكيد وحفظ بيانات المنتج في قاعدة البيانات 💾
              </button>

            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden border border-stone-200 shadow-2xl animate-in fade-in zoom-in duration-200" dir="rtl">
            <div className="bg-rose-50 border-b border-rose-100 px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-sm">تأكيد حذف المنتج</h3>
                <p className="text-[10px] text-rose-700 font-medium">هذا الإجراء لا يمكن التراجع عنه عيوني</p>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-xs text-stone-600 leading-relaxed font-medium">
                هل أنت متأكد من حذف المنتج <strong className="text-stone-900 font-bold">"{productToDelete.name}"</strong> نهائياً من مخزن المتجر؟
              </p>
              
              <div className="grid grid-cols-2 gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmDeleteProduct}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-black py-2.5 rounded-xl text-xs transition-all shadow-md shadow-rose-600/10 cursor-pointer"
                >
                  نعم، حذف نهائياً 🗑️
                </button>
                <button
                  type="button"
                  onClick={() => setProductToDelete(null)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-2.5 rounded-xl text-xs transition-all border border-stone-200 cursor-pointer"
                >
                  تراجع وإلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
