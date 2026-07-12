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

  // Initialize Gemini client lazily and safely
  function getGeminiClient(): GoogleGenAI | null {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return null;
    }
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
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
      console.log("Saving product request received:", { id: product.id, name: product.name, category: product.category });
      
      if (!product.name || !product.category) {
        console.error("Missing name or category:", { name: product.name, category: product.category });
        return res.status(400).json({ error: "اسم المنتج والفئة مطلوبان عيوني!" });
      }

      const products = await readProductsFromFile();
      
      // If product has a truthy non-empty ID, treat as update or insert
      if (product.id && product.id.trim() !== '') {
        const index = products.findIndex((p: any) => p.id === product.id);
        if (index > -1) {
          console.log(`Updating existing product: ${product.id}`);
          products[index] = { ...products[index], ...product };
        } else {
          console.log(`Inserting product with custom id: ${product.id}`);
          products.push(product);
        }
      } else {
        // Create new product with a generated ID
        product.id = "prod-" + Date.now().toString();
        product.rating = parseFloat(product.rating) || 5.0;
        product.reviewsCount = parseInt(product.reviewsCount) || 1;
        product.specs = product.specs || {};
        product.tags = product.tags || [];
        console.log(`Creating brand new product: ${product.id}`);
        products.push(product);
      }

      await writeProductsToFile(products);
      console.log("Product saved successfully:", product.id);
      res.json(product);
    } catch (error: any) {
      console.error("CRITICAL ERROR inside save product API:", error);
      res.status(500).json({ error: error.message || "Failed to save product" });
    }
  });

  // POST Bulk Products Endpoint for Excel / CSV Imports
  app.post("/api/products/bulk", async (req, res) => {
    try {
      const { products: newProducts, replaceAll } = req.body;
      if (!Array.isArray(newProducts)) {
        return res.status(400).json({ error: "البيانات المرسلة يجب أن تكون مصفوفة من المنتجات عيوني!" });
      }

      let existingProducts = replaceAll ? [] : await readProductsFromFile();
      const timestamp = Date.now();
      
      const processedProducts = newProducts.map((p: any, index: number) => {
        const id = p.id && String(p.id).trim() !== "" ? String(p.id) : `prod-${timestamp}-${index}`;
        return {
          id,
          name: p.name || "منتج جديد",
          englishName: p.englishName || "",
          description: p.description || "",
          priceUSD: parseFloat(p.priceUSD) || 0,
          category: p.category || "lighting-indoor",
          subcategory: p.subcategory || "",
          image: p.image || "https://images.unsplash.com/photo-1543248939-ff40856f65d4?auto=format&fit=crop&w=600&q=80",
          rating: parseFloat(p.rating) || 5.0,
          reviewsCount: parseInt(p.reviewsCount) || 1,
          specs: typeof p.specs === "object" && p.specs !== null ? p.specs : {},
          inStock: p.inStock !== undefined ? !!p.inStock : true,
          tags: Array.isArray(p.tags) ? p.tags : (p.tags ? String(p.tags).split(',').map(t => t.trim()).filter(Boolean) : [])
        };
      });

      if (replaceAll) {
        existingProducts = processedProducts;
      } else {
        processedProducts.forEach((p: any) => {
          // If a product with the same name or ID exists, update it, otherwise add it
          const idx = existingProducts.findIndex((ex: any) => ex.id === p.id || (ex.name && ex.name.trim() === p.name.trim()));
          if (idx > -1) {
            existingProducts[idx] = { ...existingProducts[idx], ...p };
          } else {
            existingProducts.push(p);
          }
        });
      }

      await writeProductsToFile(existingProducts);
      res.json({ success: true, count: processedProducts.length });
    } catch (error: any) {
      console.error("CRITICAL ERROR inside bulk save product API:", error);
      res.status(500).json({ error: error.message || "Failed to bulk save products" });
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

  // Helper for offline / fallback Iraqi dialect advisor
  function getLocalIraqiResponse(query: string): string {
    const q = query.toLowerCase();
    
    if (q.includes("سبوت") || q.includes("صالة") || q.includes("غرفة") || q.includes("حساب") || q.includes("مساحة") || q.includes("مسافة") || q.includes("توزيع") || q.includes("إنارة") || q.includes("اضاءة") || q.includes("إضاءة") || q.includes("سبوتات")) {
      return `يا مية هلا عيوني! لحساب عدد السبوتات المناسبة لأي غرفة أو صالة بشكل هندسي صحيح، نحتاج حوالي سبوت لايت بقوة 7 واط أو 10 واط لكل 1.5 متر مربع تقريباً.

مثال: إذا مساحة الصالة مالتك 4×5 أمتار (يعني مساحتها 20 متر مربع):
1. ننصحك بتوزيع حوالي 12 إلى 15 سبوت لايت غاطس عيوني.
2. المسافة المثالية بين سبوت وآخر هي 1 متر إلى 1.2 متر.
3. ابعد أول سبوت عن الحائط بمسافة 50 سم لتلافي ضياع الإنارة على الجدران.

أفضل سبوت لايت نرشحه إلك من متجرنا هو: **سبوت لايت ليد غاطس مضاد للتوهج كول لايت** بسعر 6.5$ (9,750 د.ع) فقط! هذا السبوت يتميز بتصميم عميق يريح العين ومضاد للتوهج مع ضمان 3 سنوات حقيقي استبدال عيوني. تكدر تضيفه للسلة مباشرة وتدلل عيوني! 🛍️`;
    }
    
    if (q.includes("سبلت") || q.includes("مكيف") || q.includes("حماية") || q.includes("جوزة") || q.includes("وطنية") || q.includes("فولتية") || q.includes("امبير") || q.includes("أمبير") || q.includes("فولت") || q.includes("جهاز حماية") || q.includes("تقلب")) {
      return `يا هلا عيوني! الكهرباء الوطنية والخصخصة بالعراق معروفة بتقلب الفولتية المفاجئ، وهذا كلش خطر على السبلت أو الأجهزة الكهربائية الكبيرة ويسبب احتراق الضواغط (الكومبريسر).
علمود تحمي السبلت، ننصحك بجهاز حماية يتحمل تيار عالي ومصمم بقطع ذكي عند انخفاض أو ارتفاع الفولتية عن الحدود الآمنة.

نرشحلك من متجرنا: **جهاز حماية سبلت ذكي 30 أمبير رقمي** بسعر 12$ (18,000 د.ع) فقط! هذا الجهاز يتحمل لغاية 30 أمبير حقيقي، ويحتوي على شاشة رقمية تعرض فولتية الكهرباء بالوقت الفعلي، مع توقيت تشغيل آمن لحماية الضاغط. تكدر تطلبه وتضيفه للسلة مباشرة عيوني! 🛍️`;
    }
    
    if (q.includes("لمس") || q.includes("مفتاح") || q.includes("مفاتيح") || q.includes("ذكي") || q.includes("سويتش") || q.includes("سويتشات") || q.includes("موبايل") || q.includes("تلفون") || q.includes("واي فاي") || q.includes("وايفاي") || q.includes("تطبيق") || q.includes("سيرفس")) {
      return `تدلل عيوني! مفاتيح اللمس الذكية مالتنا مصنوعة من الزجاج المقسى الفاخر المضاد للخدش والماء، وتشتغل باللمس وبنفس الوقت تكدر تتحكم بيها بالكامل من تليفونك عبر تطبيق Smart Life أو Tuya عن طريق الواي فاي مباشرة بدون حاجة لأي هب أو جهاز وسيط.

المفاتيح متوفرة عندنا بعدة أشكال وتصاميم راقية:
- **مفتاح لمس ذكي زجاجي أحادي** بسعر 16$ (24,000 د.ع).
- **مفتاح لمس ذكي زجاجي ثنائي** بسعر 19$ (28,500 د.ع).
- **مفتاح لمس ذكي زجاجي ثلاثي** بسعر 22$ (33,000 د.ع).

تكدر تسيطر على إنارة بيتكم حتى لو جنت خارج البيت عيوني! تكدر تضيفها للسلة مباشرة وتدلل عيوني. 🛍️`;
    }
    
    if (q.includes("خارجي") || q.includes("واجهة") || q.includes("واجهات") || q.includes("حديقة") || q.includes("حدائق") || q.includes("مطر") || q.includes("ماء") || q.includes("تراب") || q.includes("كشاف") || q.includes("كشافات") || q.includes("شارع") || q.includes("طاقة شمسية")) {
      return `منور عيوني! لإنارة واجهة البيت الخارجي والحدائق، أهم شي تختار إنارة بمقاومة عالية للمياه والحرارة والغبار (IP65 فما فوق) علمود تتحمل جونا العراقي الصعب بالصيف الحار والشتاء الماطر.

نرشحلك أفضل الخيارات المتوفرة لدينا حالياً:
1. **كشاف طاقة شمسية ذكي بقوة 300 واط مع حساس حركة** بسعر 42$ (63,000 د.ع)، هذا يشتغل 100% ع الشمس وبدون أي وايرات وتأسيسات، ومعاه حساس ذكي يزيد السطوع من يمر أحد يمه علمود يوفر طاقة.
2. **أبليك جداري خارجي باتجاهين مضاد للماء** بسعر 14$ (21,000 د.ع)، يعطي نقشات ضوئية تخبل فوق وتحت وتزين الواجهة الديكورية للبيت.

تكدر تضيفهم للسلة مباشرة بضغطة زر وتدلل عيوني! 🛍️`;
    }
    
    if (q.includes("سعر") || q.includes("اسعار") || q.includes("أسعار") || q.includes("توصيل") || q.includes("مكانكم") || q.includes("موقعكم") || q.includes("شلون") || q.includes("اشتري") || q.includes("طلب") || q.includes("رقم") || q.includes("واتساب") || q.includes("وين") || q.includes("شراء")) {
      return `يا مية هلا بيك عيوني بمتجر نيوسرام! طريقة الشراء وتأكيد الطلب كلش سهلة وبسيطة:
1. تصفح كتالوج الأجهزة والإنارة بالمتجر.
2. اضغط على زر 'إضافة للسلة' للمنتجات اللي تعجبك.
3. افتح سلة المشتريات من الشريط الفوق أو الجوه، واضغط على زر 'تأكيد الطلب وإرساله عبر واتساب'.
4. اكتب اسمك، رقم الهاتف وعنوان السكن بالتفصيل، واختار طريقة الدفع المفضلة (مثل زين كاش، آسيا حوالة، أو الدفع عند الاستلام).
5. راح تتولد رسالة مرتبة بطلبك وتنفتح محادثة الواتساب ويانا مباشرة على الرقم (07866080020) لتأكيد وتجهيز طلبيتك وتوصيلها لباب بيتك عيوني بخلال يوم أو يومين بكل العراق.

وتدلل عيوني! 🛍️`;
    }
    
    if (q.includes("واير") || q.includes("وايرات") || q.includes("سلك") || q.includes("اسلاك") || q.includes("جوزة") || q.includes("جوزات") || q.includes("قاطع") || q.includes("تأسيس") || q.includes("كهربائي") || q.includes("نحاس")) {
      return `يا هلا بيك عيوني! لتأسيسات البيت الكهربائية، من الضروري جداً استخدام أسلاك نحاس نقي 100% علمود تتحمل الأحمال العالية وميصير بيها حميان أو تسبب حرائق لا سامح الله، بالإضافة لقواطع دورة (جوزات) أصلية تفصل الكهرباء فوراً عند حدوث أي تماس.

متوفر بمتجرنا للتأسيس:
- **سلك نحاسي مرن ممتاز للتأسيسات 2.5 ملم** بسعر 35$ (52,500 د.ع) للبكرة 100 متر، نحاس أورجينال نقي.
- **سلك نحاسي مرن ممتاز للتأسيسات 4 ملم** بسعر 55$ (82,500 د.ع) للبكرة 100 متر (مثالي للسبالت والخطوط الرئيسية).
- **قاطع دورة (جوزة) ثنائي ذكي 40 أمبير** بسعر 28$ (42,000 د.ع) يوفر حماية فائقة وتفصل عند التماس أو الحميان الزائد.

تكدر تضيفهم للسلة مباشرة وتدلل عيوني! 🛍️`;
    }
    
    if (q.includes("مروحة") || q.includes("مراوح") || q.includes("شفاط") || q.includes("شفاطات") || q.includes("سقفية") || q.includes("تهوية") || q.includes("هوا")) {
      return `يا هلا بيك عيوني! للتهوية والترطيب بالبيت، متوفر عندنا مراوح سقفية ديكورية فخمة تجمع بين المظهر الجمالي والهواء العالي والهدوء التام، وأيضاً شفاطات صامتة للمطابخ والحمامات.

نرشحلك:
- **مروحة سقفية ديكورية فاخرة مع إضاءة ليد وريموت** بسعر 85$ (127,500 د.ع)، تصميمها كلش راقي وهادئ وتدعم التحكم بالسرعات والإنارة بالريموت.
- **مروحة شفط جدارية صامتة مقاومة للرطوبة** بسعر 18$ (27,000 د.ع) ممتازة لسحب الروائح والرطوبة بسرعة وبدون أي صوت مزعج.

تكدر تضيفهم للسلة مباشرة بضغطة زر عيوني! 🛍️`;
    }
    
    return `يا مية هلا بيك عيوني! نورت مستشار نيوسرام الذكي للإنارة الحديثة الفاخرة والأجهزة الكهربائية بالعراق. 💡🇮🇶
أنا مهندس الكهرباء والإنارة الافتراضي مالتكم لخدمتكم بأي وكت عيوني.

تكدر تسألني عن أي شي ببالك، مثلاً:
- حساب عدد السبوت لايتات لغرفكم وتوزيعها بالشكل الصحيح.
- طريقة حماية السبالت والأجهزة من تقلبات كهرباء الوطنية العراقية.
- مواصفات مفاتيح اللمس الذكية اللي تشتغل عالموبايل.
- إنارة الحدائق والواجهات الخارجية اللي تتحمل المطر والحر.

اسألني عيوني وراح أجاوبك فوراً ونختار سوا المنتجات المناسبة! ✨`;
  }

  // API Chat Endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required." });
      }

      // Find last user message
      const lastUserMsgObj = messages
        .filter(msg => msg && msg.role === 'user' && msg.content)
        .pop();
      const lastUserQuery = lastUserMsgObj ? lastUserMsgObj.content.trim() : "";

      const aiClient = getGeminiClient();
      if (!aiClient) {
        // Fall back to the highly polished local responder immediately and gracefully!
        const localReply = getLocalIraqiResponse(lastUserQuery);
        return res.json({ response: localReply });
      }

      // Convert messages to Gemini API format, ensuring non-empty content
      const rawContents = messages
        .filter(msg => msg && msg.content && msg.content.trim() !== '')
        .map(msg => {
          return {
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          };
        });

      // Filter to ensure history starts with 'user' and alternates strictly
      const contents = [];
      let expectedRole = 'user';
      for (const item of rawContents) {
        if (item.role === expectedRole) {
          contents.push(item);
          expectedRole = expectedRole === 'user' ? 'model' : 'user';
        }
      }

      if (contents.length === 0) {
        // Fall back to local response if empty
        const localReply = getLocalIraqiResponse(lastUserQuery);
        return res.json({ response: localReply });
      }

      // Retrieve dynamic list of products for Gemini AI context
      const products = await readProductsFromFile();
      const dynamicProductList = products.map((p: any, index: number) => {
        const specsText = p.specs ? Object.entries(p.specs).map(([k, v]) => `${k}: ${v}`).join(', ') : 'لا يوجد تفاصيل';
        return `${index + 1}. **${p.name}** (${p.englishName || ''})\n   سعر المنتج بالدولار: ${p.priceUSD}$\n   سعر المنتج بالدينار العراقي: ${(p.priceUSD * 1500).toLocaleString()} د.ع\n   الفئة: ${p.category}\n   الوصف: ${p.description}\n   المواصفات: ${specsText}\n   حالة التوفر: ${p.inStock ? "متوفر" : "غير متوفر"}`;
      }).join('\n\n');

      // Inject products context into the system instructions so the model knows what we sell!
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

      const response = await aiClient.models.generateContent({
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
      // Fallback on failure!
      try {
        const { messages } = req.body;
        const lastUserMsgObj = messages
          .filter((msg: any) => msg && msg.role === 'user' && msg.content)
          .pop();
        const lastUserQuery = lastUserMsgObj ? lastUserMsgObj.content.trim() : "";
        const localReply = getLocalIraqiResponse(lastUserQuery);
        res.json({ response: localReply });
      } catch (innerErr) {
        res.json({ response: "أهلاً بك عيوني! حالياً مستشار الذكاء الاصطناعي يستعد للرد، يمكنك تصفح المنتجات وإضافتها للسلة وطلبها مباشرة عبر الواتساب (07866080020) في أي وقت!" });
      }
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
