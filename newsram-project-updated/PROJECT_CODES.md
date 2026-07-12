# 📦 ملف الكود المصدري الكامل للمشروع (NEWSRAM PREMIUM)

مرحبا عيوني! هذا الملف يحتوي على الكود المصدري الكامل والمعدل لكافة أجزاء المتجر الأساسية لكي تتمكن من نسخها أو مراجعتها أو رفعها على GitHub بكل سهولة.

---

## 🏗️ طريقة تصدير الكود الفورية من متجر AI Studio:
بدلاً من نسخ ولصق الملفات يدوياً، يمكنك تحميل المشروع كاملاً كملف **ZIP** مضغوط أو رفعه لـ **GitHub** بضغطة زر واحدة:
1. انظر إلى الزاوية العلوية أو الجانبية في واجهة **Google AI Studio Build**.
2. اضغط على أيقونة **Settings (الإعدادات)** أو **Export/Download**.
3. اختر **Export to GitHub** لربطه بحسابك ورفعه مباشرة، أو **Download ZIP** لتحميل ملف يحتوي على كل ملفات الكود والمجلدات مرتبة على كمبيوترك الشخصي!

---

## 1. 🌐 ملف الخادم الأساسي (`server.ts`)
يحتوي على لوحة التحكم، الاتصال بـ Gemini AI، إدارة السيرفر، وقواعد البيانات المحلية للمبيعات والمنتجات:

```typescript
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  const PRODUCTS_FILE_PATH = path.join(process.cwd(), "src", "products.json");

  // Helper function to read products safely
  async function readProductsFromFile() {
    try {
      if (!fs.existsSync(PRODUCTS_FILE_PATH)) {
        return [];
      }
      const data = await fs.promises.readFile(PRODUCTS_FILE_PATH, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error reading products file:", error);
      return [];
    }
  }

  // Helper function to write products safely
  async function writeProductsToFile(products: any[]) {
    await fs.promises.writeFile(PRODUCTS_FILE_PATH, JSON.stringify(products, null, 2), "utf-8");
  }

  // Initialize Gemini client safely
  let ai: GoogleGenAI | null = null;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } else {
    console.warn("WARNING: GEMINI_API_KEY is not defined in the environment. AI features will be limited.");
  }

  // GET Products Dynamic Endpoint
  app.get("/api/products", async (req, res) => {
    try {
      const products = await readProductsFromFile();
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to load products" });
    }
  });

  // POST Create/Update Product Endpoint
  app.post("/api/products", async (req, res) => {
    try {
      const product = req.body;
      if (!product.name || !product.category) {
        return res.status(400).json({ error: "Product name and category are required." });
      }

      const products = await readProductsFromFile();
      
      if (product.id) {
        // Update existing product
        const index = products.findIndex((p: any) => p.id === product.id);
        if (index > -1) {
          products[index] = { ...products[index], ...product };
        } else {
          products.push(product);
        }
      } else {
        // Create new product
        product.id = "prod-" + Date.now().toString();
        product.rating = parseFloat(product.rating) || 5.0;
        product.reviewsCount = parseInt(product.reviewsCount) || 1;
        product.specs = product.specs || {};
        product.tags = product.tags || [];
        products.push(product);
      }

      await writeProductsToFile(products);
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to save product" });
    }
  });

  // DELETE Product Endpoint
  app.delete("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      let products = await readProductsFromFile();
      products = products.filter((p: any) => p.id !== id);
      await writeProductsToFile(products);
      res.json({ success: true, id });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to delete product" });
    }
  });

  const CONFIG_FILE_PATH = path.join(process.cwd(), "src", "config.json");
  const ORDERS_FILE_PATH = path.join(process.cwd(), "src", "orders.json");

  // Helper function to read config
  async function readConfigFromFile() {
    try {
      if (!fs.existsSync(CONFIG_FILE_PATH)) {
        return { heroImage: "" };
      }
      const data = await fs.promises.readFile(CONFIG_FILE_PATH, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error reading config file:", error);
      return { heroImage: "" };
    }
  }

  // Helper function to write config
  async function writeConfigToFile(config: any) {
    await fs.promises.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), "utf-8");
  }

  // Helper function to read orders
  async function readOrdersFromFile() {
    try {
      if (!fs.existsSync(ORDERS_FILE_PATH)) {
        return [];
      }
      const data = await fs.promises.readFile(ORDERS_FILE_PATH, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error reading orders file:", error);
      return [];
    }
  }

  // Helper function to write orders
  async function writeOrdersToFile(orders: any[]) {
    await fs.promises.writeFile(ORDERS_FILE_PATH, JSON.stringify(orders, null, 2), "utf-8");
  }

  // GET Config Endpoint
  app.get("/api/config", async (req, res) => {
    try {
      const config = await readConfigFromFile();
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to load config" });
    }
  });

  // POST Config Endpoint
  app.post("/api/config", async (req, res) => {
    try {
      const config = req.body;
      await writeConfigToFile(config);
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to save config" });
    }
  });

  // GET Orders Endpoint
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await readOrdersFromFile();
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to load orders" });
    }
  });

  // POST Create Order Endpoint
  app.post("/api/orders", async (req, res) => {
    try {
      const order = req.body;
      if (!order.customerName || !order.customerPhone || !order.customerAddress) {
        return res.status(400).json({ error: "Customer details are required." });
      }

      const orders = await readOrdersFromFile();
      order.id = "order-" + Math.floor(100000 + Math.random() * 900000).toString();
      order.status = "قيد المعالجة"; // Default status
      order.createdAt = new Date().toISOString();
      
      orders.push(order);
      await writeOrdersToFile(orders);
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to save order" });
    }
  });

  // PUT Update Order Status Endpoint
  app.put("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status is required." });
      }

      const orders = await readOrdersFromFile();
      const index = orders.findIndex((o: any) => o.id === id);
      if (index > -1) {
        orders[index].status = status;
        await writeOrdersToFile(orders);
        res.json(orders[index]);
      } else {
        res.status(404).json({ error: "Order not found" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to update order status" });
    }
  });

  // API Chat Endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required." });
      }

      if (!ai) {
        return res.json({
          response: "أهلاً بك في متجر NEWSRAM! حالياً مستشار الذكاء الاصطناعي في وضع الصيانة لعدم ضبط مفتاح API في الخادم، ولكن يمكنك تصفح المنتجات الكهربائية وإضافتها للسلة وطلبها مباشرة عبر الواتساب (07866080020) في أي وقت!"
        });
      }

      const contents = messages.map(msg => {
        return {
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        };
      });

      const products = await readProductsFromFile();
      const dynamicProductList = products.map((p: any, index: number) => {
        const specsText = p.specs ? Object.entries(p.specs).map(([k, v]) => `${k}: ${v}`).join(', ') : 'لا يوجد تفاصيل';
        return `${index + 1}. **${p.name}** (${p.englishName || ''})\n   سعر المنتج بالدولار: ${p.priceUSD}$\n   سعر المنتج بالدينار العراقي: ${(p.priceUSD * 1500).toLocaleString()} د.ع\n   الفئة: ${p.category}\n   الوصف: ${p.description}\n   المواصفات: ${specsText}\n   حالة التوفر: ${p.inStock ? "متوفر" : "غير متوفر"}`;
      }).join('\n\n');

      const systemInstruction = `أنت "مستشار نيوسرام الذكي" (NEWSRAM Smart Advisor)، الخبير العراقي المحترف في مجال التأسيسات الكهربائية والإنارة الحديثة والحلول الذكية.
مهمتك هي مساعدة الزوار في اختيار الأجهزة المناسبة وحساب احتياجاتهم من الإضاءة والكهرباء (مثل: حساب عدد السبوتات المطلوبة لمساحة معينة، شرح درجات حرارة الألوان، أهمية أجهزة الحماية للسبالت والمكيفات في شبكة الكهرباء العراقية، اختيار الأسلاك المناسبة للتأسيس).

قواعد التعامل الأساسية:
1. تحدث بلهجة عراقية محببة ومهذبة ومحترفة ("أهلاً بيك عيوني"، "تدلل عيوني"، "حاضرين").
2. ركز تماماً على الجانب العملي والجمالي، وقدم نصائح صادقة ومجانية لتوزيع الإضاءة بالشكل الهندسي الصحيح.
3. قم بترشيح منتجات محددة من متجر نيوسرام (NEWSRAM) المتوفرة لدينا فقط، واذكر مميزاتها وسعرها بالدولار وبالدينار العراقي (سعر الصرف لدينا هو 1500 دينار لكل دولار).
4. إليك قائمة المنتجات المتوفرة لدينا في متجر NEWSRAM حالياً بالتفصيل لترشيحها عند الطلب:

${dynamicProductList}

إذا سألك الزبون عن كيفية الشراء أو تأكيد الطلب، أخبره بكل سرور أن يقوم بإضافة المنتجات المفضلة لديه في "سلة المشتريات" ثم يضغط على زر "تأكيد الطلب وإرساله عبر واتساب" وسوف يتم فتح نافذة لإدخال الاسم والهاتف وموقع السكن، واختيار طريقة الدفع المناسبة (مثل زين كاش، آسيا حوالة، ماستركارد، أو الدفع عند الاستلام المحلي)، ومن ثم توليد رسالة منظمة يتم إرسالها لمحادثة الواتساب الخاصة بتجهيز الطلبية وتوصيلها لباب البيت في أي مكان بالعراق.
رقم الواتساب الخاص بمتجر نيوسرام هو: 07866080020.
كن دائماً محفزاً، متجاوباً، وأميناً في تقديم النصائح الهندسية لكي يثق العميل بمتجرنا.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ response: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "حدث خطأ في الاتصال بالذكاء الاصطناعي" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
```

---

## 2. 📂 لوحة التحكم الذكية والفاخرة للآدمن (`src/components/AdminPanel.tsx`)
تم تعديلها لتقسيم الفواتير إلى 4 خانات مرتبة ومفصلة من الأحدث إلى الأقدم، وإضافة حوار الحذف الفاخر:

```typescript
// مقتطف من الكود الأساسي للفلترة والتقسيم في لوحة التحكم:
const filteredOrders = [...orders]
  .sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA; // الأحدث أولاً
  })
  .filter(o => {
    const matchesSearch = (o.customerName || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
                          (o.customerPhone || '').includes(orderSearch);
    const matchesStatus = orderStatusFilter === 'all' || (o.status || 'قيد المعالجة') === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

// تقسيم الطلبات إلى خانات منظمة
const pendingOrders = filteredOrders.filter(o => (o.status || 'قيد المعالجة') === 'قيد المعالجة');
const preparingOrders = filteredOrders.filter(o => o.status === 'قيد التجهيز');
const deliveredOrders = filteredOrders.filter(o => o.status === 'وصل');
const unavailableOrders = filteredOrders.filter(o => o.status === 'غير متوفر');
```

يمكنك العثور على الكود كاملاً داخل المسار: `src/components/AdminPanel.tsx`.

---

## 3. 📦 واجهة الموديلات وسلات المشتريات والتتبع (`src/components/ShoppingModals.tsx`)
تدعم طرق الدفع المحلية (زين كاش، آسيا حوالة، عند الاستلام)، وتنسيق تتبع الطلبات بالهاتف.

---

## 🛠️ كيف تبدأ بتشغيل المشروع محلياً على كمبيوترك:
1. قم بفك الضغط عن ملف الـ ZIP الذي قمت بتحميله.
2. افتح مبوبة الأوامر (Terminal) في مجلد المشروع ونفذ:
   ```bash
   npm install
   ```
3. لتشغيل السيرفر المحلي في وضع التطوير:
   ```bash
   npm run dev
   ```
4. لإنشاء البناء الجاهز للنشر (Production Build):
   ```bash
   npm run build
   ```
5. لتشغيل السيرفر الفعلي:
   ```bash
   npm run start
   ```

هذا كل ما تحتاجه عيوني! جاهز بالكامل للتنزيل والاستخدام الاحترافي. 🚀
