import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import Razorpay from "razorpay";
import dotenv from "dotenv";
import crypto from "crypto";
import { fileURLToPath } from "url";

// Firebase Web SDK Imports
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc,
  writeBatch,
  Firestore 
} from "firebase/firestore";

// Seed data from src/data
import { products as seedProducts, storeLocations as seedLocations, reviews as seedReviews } from "./src/data";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Path to uploaded files and static serving
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use("/uploads", express.static(UPLOADS_DIR));

// Path to data files
const DATA_DIR = path.join(process.cwd(), "src", "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const EMAILS_LOG_FILE = path.join(DATA_DIR, "emails_log.json");
const PROMO_FILE = path.join(DATA_DIR, "promo_codes.json");
const SHIPMENTS_FILE = path.join(DATA_DIR, "shipments.json");
const SH_SETTINGS_FILE = path.join(DATA_DIR, "shipping_settings.json");

// Ensure data directory and files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// --- Firebase Initialization ---
let db: Firestore | null = null;

const initFirebase = () => {
  if (db) return db;
  
  try {
    let config: any = {};
    let currentDir = process.cwd();
    try {
      if (typeof __dirname !== "undefined") {
        currentDir = __dirname;
      } else {
        currentDir = path.dirname(fileURLToPath(import.meta.url));
      }
    } catch (e) {
      // ignore fallback
    }

    const possiblePaths = [
      path.join(process.cwd(), "firebase-applet-config.json"),
      path.join(currentDir, "firebase-applet-config.json"),
      path.join(currentDir, "..", "firebase-applet-config.json"),
      path.join(currentDir, "../..", "firebase-applet-config.json")
    ];

    let foundConfigPath = "";
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        foundConfigPath = p;
        break;
      }
    }

    if (foundConfigPath) {
      console.log(`[Firebase Initializer] Found configuration file at: ${foundConfigPath}`);
      config = JSON.parse(fs.readFileSync(foundConfigPath, "utf-8"));
    } else {
      console.warn(`[Firebase Initializer] firebase-applet-config.json not found in search paths. Using robust environment and default fallbacks.`);
    }

    const apiKey = config.apiKey || process.env.FIREBASE_API_KEY || "AIzaSyAfgxVzb2KrKm805ANK7h6HVRyRc0EVr8s";
    const projectId = config.projectId || process.env.FIREBASE_PROJECT_ID || "myra-luxury-9c49c";
    const authDomain = config.authDomain || process.env.FIREBASE_AUTH_DOMAIN || "myra-luxury-9c49c.firebaseapp.com";
    const storageBucket = config.storageBucket || process.env.FIREBASE_STORAGE_BUCKET || "myra-luxury-9c49c.firebasestorage.app";
    const messagingSenderId = config.messagingSenderId || process.env.FIREBASE_MESSAGING_SENDER_ID || "500396522177";
    const appId = config.appId || process.env.FIREBASE_APP_ID || "1:500396522177:web:0f039c3e7b774f78e9b240";
    const databaseId = config.firestoreDatabaseId || process.env.FIREBASE_FIRESTORE_DATABASE_ID || "(default)";

    const firebaseConfig = {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId
    };

    console.log(`[Firebase Initializer] Bootstrapping Web SDK with project ID: ${projectId}, Database: ${databaseId}`);

    if (getApps().length === 0) {
      initializeApp(firebaseConfig);
    }

    if (databaseId && databaseId !== "(default)") {
      db = getFirestore(getApp(), databaseId);
    } else {
      db = getFirestore(getApp());
    }

    return db;
  } catch (err) {
    console.error("[Firebase Initializer Exception] Failed to bootstrap Firebase Firestore Web SDK client:", err);
    return null;
  }
};

function getDB() {
  return initFirebase();
}

// Firestore Error-Resilient Queries
async function firestoreGetCollection(collName: string): Promise<any[]> {
  const firestoreDb = getDB();
  if (!firestoreDb) {
    console.warn(`[Firestore Get Collection ${collName}] Firestore not initialized. Falling back to empty.`);
    return [];
  }
  
  let retries = 3;
  while (retries > 0) {
    try {
      const colRef = collection(firestoreDb, collName);
      const snapshot = await getDocs(colRef);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      retries--;
      console.error(`[Firestore Get Collection ${collName}] Failed to fetch. Retries remaining: ${retries}`, err);
      if (retries === 0) return [];
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return [];
}

async function firestoreGetDoc(collName: string, docId: string): Promise<any | null> {
  const firestoreDb = getDB();
  if (!firestoreDb) return null;
  
  let retries = 3;
  while (retries > 0) {
    try {
      const docRef = doc(firestoreDb, collName, docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (err) {
      retries--;
      console.error(`[Firestore Get Doc ${collName}/${docId}] Failed to fetch. Retries remaining: ${retries}`, err);
      if (retries === 0) return null;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return null;
}

async function firestoreSetDoc(collName: string, docId: string, data: any): Promise<boolean> {
  const firestoreDb = getDB();
  if (!firestoreDb) throw new Error("Firestore database is not initialized.");
  if (!docId) throw new Error(`Cannot write document to ${collName} without a valid document ID.`);
  
  let retries = 3;
  let lastError: any = null;
  while (retries > 0) {
    try {
      const cleaned = JSON.parse(JSON.stringify(data));
      const docRef = doc(firestoreDb, collName, docId);
      await setDoc(docRef, cleaned, { merge: true });
      return true;
    } catch (err) {
      retries--;
      lastError = err;
      console.error(`[Firestore Set Doc ${collName}/${docId}] Failed to save. Retries remaining: ${retries}`, err);
      if (retries === 0) throw err;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw lastError || new Error(`Failed to save document to ${collName}/${docId}`);
}

async function firestoreDeleteDoc(collName: string, docId: string): Promise<boolean> {
  const firestoreDb = getDB();
  if (!firestoreDb) throw new Error("Firestore database is not initialized.");
  if (!docId) throw new Error(`Cannot delete document from ${collName} without a valid document ID.`);
  
  let retries = 3;
  let lastError: any = null;
  while (retries > 0) {
    try {
      const docRef = doc(firestoreDb, collName, docId);
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      retries--;
      lastError = err;
      console.error(`[Firestore Delete Doc ${collName}/${docId}] Failed to delete. Retries remaining: ${retries}`, err);
      if (retries === 0) throw err;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw lastError || new Error(`Failed to delete document from ${collName}/${docId}`);
}

// Seeding and Migrations
async function seedFirestore() {
  const firestoreDb = getDB();
  if (!firestoreDb) return;
  
  try {
    console.log("[Seed Firestore] Checking and seeding database collections...");
    
    // 1. Shipping Settings
    const shippingSettingsSnap = await getDocs(collection(firestoreDb, "shippingSettings"));
    if (shippingSettingsSnap.empty) {
      console.log("[Seed Firestore] Seeding shippingSettings...");
      let defaultSettings = {
        originPin: "400001",
        freeShippingThreshold: 999,
        baseCodCharge: 50,
        markupPercentage: 0,
        enablePromoFreeShipping: true,
        warehouseName: "MYRA Central Atelier",
        warehouseAddress: "Boutique Block, Apollo Bandar, Colaba",
        warehouseCity: "Mumbai",
        warehouseState: "Maharashtra"
      };
      try {
        if (fs.existsSync(SH_SETTINGS_FILE)) {
          defaultSettings = JSON.parse(fs.readFileSync(SH_SETTINGS_FILE, "utf-8"));
        }
      } catch {}
      await firestoreSetDoc("shippingSettings", "settings", defaultSettings);
    }
    
    // 2. Promo Codes
    const promoCodesSnap = await getDocs(collection(firestoreDb, "promoCodes"));
    if (promoCodesSnap.empty) {
      console.log("[Seed Firestore] Seeding promoCodes...");
      let defaultPromos = [
        { code: "MYRAGIFT", type: "fixed", value: 25, active: true, description: "Flat ₹25 discount on any order" },
        { code: "LUXE20", type: "percentage", value: 20, active: true, description: "20% discount on order subtotal" }
      ];
      try {
        if (fs.existsSync(PROMO_FILE)) {
          defaultPromos = JSON.parse(fs.readFileSync(PROMO_FILE, "utf-8"));
        }
      } catch {}
      for (const p of defaultPromos) {
        await firestoreSetDoc("promoCodes", p.code, p);
      }
    }
    
    // 3. Orders
    const ordersSnap = await getDocs(collection(firestoreDb, "orders"));
    if (ordersSnap.empty) {
      console.log("[Seed Firestore] Seeding orders...");
      let existingOrders: any[] = [];
      try {
        if (fs.existsSync(ORDERS_FILE)) {
          existingOrders = JSON.parse(fs.readFileSync(ORDERS_FILE, "utf-8"));
        }
      } catch {}
      for (const o of existingOrders) {
        await firestoreSetDoc("orders", o.id, o);
      }
    }
    
    // 4. Shipments
    const shipmentsSnap = await getDocs(collection(firestoreDb, "shipments"));
    if (shipmentsSnap.empty) {
      console.log("[Seed Firestore] Seeding shipments...");
      let existingShipments: any[] = [];
      try {
        if (fs.existsSync(SHIPMENTS_FILE)) {
          existingShipments = JSON.parse(fs.readFileSync(SHIPMENTS_FILE, "utf-8"));
        }
      } catch {}
      for (const s of existingShipments) {
        await firestoreSetDoc("shipments", s.awb || s.id || `SHIP-${Math.floor(Math.random() * 100000)}`, s);
      }
    }
    
    // 5. Email Logs
    const emailLogsSnap = await getDocs(collection(firestoreDb, "emailLogs"));
    if (emailLogsSnap.empty) {
      console.log("[Seed Firestore] Seeding emailLogs...");
      let existingLogs: any[] = [];
      try {
        if (fs.existsSync(EMAILS_LOG_FILE)) {
          existingLogs = JSON.parse(fs.readFileSync(EMAILS_LOG_FILE, "utf-8"));
        }
      } catch {}
      for (const log of existingLogs) {
        await firestoreSetDoc("emailLogs", log.id || `LOG-${Math.floor(Math.random() * 100000)}`, log);
      }
    }
 
    // 6. Products
    const productsSnap = await getDocs(collection(firestoreDb, "products"));
    if (productsSnap.empty) {
      console.log("[Seed Firestore] Seeding products from src/data.ts...");
      for (const p of seedProducts) {
        await firestoreSetDoc("products", p.id, p);
      }
    }
    
    // 7. Reviews
    const reviewsSnap = await getDocs(collection(firestoreDb, "reviews"));
    if (reviewsSnap.empty) {
      console.log("[Seed Firestore] Seeding reviews from src/data.ts...");
      for (const r of seedReviews) {
        await firestoreSetDoc("reviews", r.id, r);
      }
    }
    
    // 8. Store Locations
    const locationsSnap = await getDocs(collection(firestoreDb, "locations"));
    if (locationsSnap.empty) {
      console.log("[Seed Firestore] Seeding boutique locations from src/data.ts...");
      for (const l of seedLocations) {
        await firestoreSetDoc("locations", l.id, l);
      }
    }
 
    // 9. Users
    const usersSnap = await getDocs(collection(firestoreDb, "users"));
    if (usersSnap.empty) {
      console.log("[Seed Firestore] Seeding initial users...");
      const defaultUser = {
        id: "admin-patron",
        firstName: "Myra",
        lastName: "Patron",
        emailAddress: "ikondecor1@gmail.com",
        mobileNumber: "+91 9999999999",
        houseNo: "Showroom 1",
        streetAddress: "Colaba Causeway",
        areaLocality: "Apollo Bandar",
        city: "Mumbai",
        state: "Maharashtra",
        pinCode: "400001",
        country: "India",
        createdDate: new Date().toISOString()
      };
      await firestoreSetDoc("users", defaultUser.id, defaultUser);
    }
    
    console.log("[Seed Firestore] Seeding completed.");
  } catch (err) {
    console.error("[Seed Firestore Exception] Error:", err);
  }
}


// Lazy initialization of Razorpay SDK to prevent crash if keys are missing or invalid
let razorpayInstance: Razorpay | null = null;
function getRazorpay(): Razorpay | null {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    
    // Validate that keys represent actual active credentials (start with rzp_test_ or rzp_live_)
    // and are not default placeholder strings
    const isKeyIdValid = keyId && 
                         keyId !== "Secret value" && 
                         keyId !== "" && 
                         (keyId.startsWith("rzp_test_") || keyId.startsWith("rzp_live_"));
                         
    const isKeySecretValid = keySecret && 
                             keySecret !== "Secret value" && 
                             keySecret !== "";

    if (isKeyIdValid && isKeySecretValid) {
      try {
        razorpayInstance = new Razorpay({
          key_id: keyId,
          key_secret: keySecret
        });
        console.log("Razorpay initialized successfully with provided API credentials.");
      } catch (err) {
        console.error("Failed to initialize Razorpay SDK:", err);
      }
    }
  }
  return razorpayInstance;
}

// Mailer transporter helper
async function sendMailNotification(to: string, subject: string, htmlContent: string) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  
  const fromName = process.env.SMTP_FROM_NAME || "MYRA Luxury Atelier";
  const fromEmail = process.env.SMTP_FROM_EMAIL || "noreply@myraluxury.com";

  const emailLogEntry = {
    id: `TXT-MAIL-${Math.floor(100000 + Math.random() * 900000)}`,
    timestamp: new Date().toISOString(),
    to,
    subject,
    body: htmlContent,
    sentViaSmtp: false,
    smtpHost: host || "Sandbox Local"
  };

  // If credentials exist, dispatch real SMTP email
  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
          user,
          pass
        }
      });

      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        html: htmlContent
      });

      console.log(`Email dispatched successfully to ${to}. Message ID: ${info.messageId}`);
      emailLogEntry.sentViaSmtp = true;
    } catch (err) {
      console.error(`Failed to dispatch SMTP email to ${to}:`, err);
    }
  } else {
    console.log(`[SMTP SIMULATOR] No active SMTP keys found. Saved outbound mail to logs:\nTO: ${to}\nSUBJECT: ${subject}`);
  }

  // Prepend and save to Firestore
  try {
    await firestoreSetDoc("emailLogs", emailLogEntry.id, emailLogEntry);
  } catch (err) {
    console.error("Failed to persist email log to Firestore:", err);
  }
}

// API Routes
// 0. Debug Firebase and Firestore connection
app.get("/api/debug-firebase", async (req, res) => {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    let fileConfig: any = {};
    if (fs.existsSync(configPath)) {
      fileConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    }

    const apiKey = process.env.FIREBASE_API_KEY || fileConfig.apiKey || "AIzaSyAfgxVzb2KrKm805ANK7h6HVRyRc0EVr8s";
    const projectId = process.env.FIREBASE_PROJECT_ID || fileConfig.projectId || "myra-luxury-9c49c";
    const databaseId = fileConfig.firestoreDatabaseId || process.env.FIREBASE_FIRESTORE_DATABASE_ID || "(default)";

    const firestoreDb = getDB();
    if (!firestoreDb) {
      return res.status(500).json({
        success: false,
        error: "Firestore DB instance could not be initialized.",
        config: { apiKey: apiKey ? "PRESENT" : "MISSING", projectId, databaseId }
      });
    }

    // Try to write a test document
    const testDocId = "test_" + Date.now();
    const docRef = doc(firestoreDb, "_debug_connection", testDocId);
    await setDoc(docRef, { test: true, timestamp: new Date().toISOString() });

    // Try to read it back
    const snap = await getDoc(docRef);
    const data = snap.exists() ? snap.data() : null;

    // Clean up
    await deleteDoc(docRef);

    res.json({
      success: true,
      message: "Firestore connection and write-read cycle succeeded perfectly!",
      data,
      config: { apiKey: apiKey ? "PRESENT" : "MISSING", projectId, databaseId }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || err.toString(),
      stack: err.stack,
      code: err.code
    });
  }
});

// Proxy endpoints for Products
app.post("/api/upload", async (req, res) => {
  try {
    const { base64, filename } = req.body;
    if (!base64) {
      return res.status(400).json({ error: "No base64 file data provided" });
    }

    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Invalid base64 format. Expected a Data URL (e.g. data:image/png;base64,...)" });
    }

    const mimeType = matches[1];
    const rawData = matches[2];
    const buffer = Buffer.from(rawData, "base64");

    // Determine file extension
    let ext = "png";
    if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
      ext = "jpg";
    } else if (mimeType.includes("webp")) {
      ext = "webp";
    } else if (mimeType.includes("svg")) {
      ext = "svg";
    } else if (mimeType.includes("gif")) {
      ext = "gif";
    }

    const baseName = filename ? filename.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 50) : "image";
    const cleanFilename = `img_${baseName}_${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, cleanFilename);

    fs.writeFileSync(filePath, buffer);

    const relativeUrl = `/uploads/${cleanFilename}`;
    console.log(`[Upload API]: Saved base64 image of size ${buffer.length} bytes to ${relativeUrl}`);
    res.json({ url: relativeUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message || err.toString() });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const list = await firestoreGetCollection("products");
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message || err.toString() });
  }
});

// Proxy endpoints for Locations
app.get("/api/locations", async (req, res) => {
  try {
    const list = await firestoreGetCollection("locations");
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message || err.toString() });
  }
});

app.post("/api/locations/sync", async (req, res) => {
  try {
    const dbLocations = req.body;
    if (!Array.isArray(dbLocations)) {
      return res.status(400).json({ error: "Expected array of locations" });
    }
    
    for (const l of dbLocations) {
      if (!l || typeof l !== "object") continue;
      const docId = l.id || `loc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      l.id = docId;
      await firestoreSetDoc("locations", docId, l);
    }
    
    const currentList = await firestoreGetCollection("locations");
    const updatedIds = dbLocations.filter((l: any) => l && typeof l === "object" && l.id).map((l: any) => l.id);
    for (const docObj of currentList) {
      if (!updatedIds.includes(docObj.id)) {
        await firestoreDeleteDoc("locations", docObj.id);
      }
    }
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || err.toString() });
  }
});

// Proxy endpoints for Branding Config
app.get("/api/configs/branding", async (req, res) => {
  try {
    const branding = await firestoreGetDoc("configs", "branding");
    res.json(branding || {});
  } catch (err: any) {
    res.status(500).json({ error: err.message || err.toString() });
  }
});

app.post("/api/configs/branding", async (req, res) => {
  try {
    await firestoreSetDoc("configs", "branding", req.body);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || err.toString() });
  }
});

// Proxy endpoints for SEO Config
app.get("/api/configs/seo", async (req, res) => {
  try {
    const seo = await firestoreGetDoc("configs", "seo");
    res.json(seo || {});
  } catch (err: any) {
    res.status(500).json({ error: err.message || err.toString() });
  }
});

app.post("/api/configs/seo", async (req, res) => {
  try {
    await firestoreSetDoc("configs", "seo", req.body);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || err.toString() });
  }
});

// Proxy endpoints for Support Messages
app.get("/api/messages", async (req, res) => {
  try {
    const list = await firestoreGetCollection("messages");
    list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message || err.toString() });
  }
});

app.post("/api/messages/sync", async (req, res) => {
  try {
    const messages = req.body;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Expected array of messages" });
    }
    
    for (const m of messages) {
      if (!m || typeof m !== "object") continue;
      const docId = m.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      m.id = docId;
      await firestoreSetDoc("messages", docId, m);
    }
    
    const currentList = await firestoreGetCollection("messages");
    const updatedIds = messages.filter((m: any) => m && typeof m === "object" && m.id).map((m: any) => m.id);
    for (const docObj of currentList) {
      if (!updatedIds.includes(docObj.id)) {
        await firestoreDeleteDoc("messages", docObj.id);
      }
    }
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || err.toString() });
  }
});

// 1. Get all orders (with optional filtering for secure user queries)
app.get("/api/orders", async (req, res) => {
  try {
    const { userId, email } = req.query;
    let list = await firestoreGetCollection("orders");

    if (userId) {
      list = list.filter(o => o.userId === userId || o.uid === userId);
    } else if (email) {
      list = list.filter(o => o.emailAddress?.toLowerCase() === (email as string).toLowerCase());
    }

    const sorted = list.sort((a, b) => {
      const d1 = a.orderDate || a.date || "";
      const d2 = b.orderDate || b.date || "";
      return d2.localeCompare(d1);
    });
    res.json(sorted);
  } catch (err) {
    console.error("Error reading orders database from Firestore:", err);
    res.status(500).json({ error: "Failed to load orders." });
  }
});

// Helper to generate elegant HTML Order Details receipt
function generateOrderHtmlReceipt(order: any, isForAdmin: boolean): string {
  const itemsRows = order.items.map((item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-family: sans-serif; font-size: 13px;">
         <b>${item.name}</b><br/>
         <span style="font-size: 11px; color: #777;">${item.sizeOrSpec || ""}</span>
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-family: sans-serif; font-size: 13px; text-align: center;">
         ${item.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-family: sans-serif; font-size: 13px; text-align: right; font-weight: bold;">
         ₹${item.price * item.quantity}
      </td>
    </tr>
  `).join("");

  const shipping = order.shippingDetails;
  const addressFormatted = shipping 
    ? `${shipping.houseNo || ""}, ${shipping.streetAddress || ""}, ${shipping.areaLocality || ""}, ${shipping.city || ""}, ${shipping.state || ""} ${shipping.pinCode || ""}, ${shipping.country || ""}`
    : order.shippingAddress || "N/A";

  const customerName = shipping 
    ? `${shipping.firstName || ""} ${shipping.lastName || ""}` 
    : order.customerName || "Bespoke Patron";

  const email = shipping?.emailAddress || order.emailAddress || "N/A";
  const phone = shipping?.mobileNumber || order.phoneNumber || "N/A";

  const testBanner = order.isTestOrder || order.id?.startsWith("TEST-")
    ? `
      <div style="background-color: #fef2f2; border: 1px solid #fca5a5; padding: 12px; text-align: center; border-radius: 8px; margin-bottom: 15px; font-family: sans-serif; font-size: 13px; color: #b91c1c; font-weight: bold;">
        🧪 SIMULATED TEST ORDER - SANDBOX MODE ACTIVE
      </div>
    `
    : "";

  return `
    <div style="background-color: #fcfaf7; padding: 20px 15px; font-family: Georgia, serif; max-width: 600px; margin: 0 auto; border: 1px solid #e8e4dc; border-radius: 12px; color: #292524;">
      ${testBanner}
      <div style="text-align: center; border-bottom: 2px solid #8a7968; padding-bottom: 15px; margin-bottom: 20px;">
        <h1 style="font-size: 28px; letter-spacing: 4px; uppercase: true; margin: 0; color: #1c1917; font-weight: normal;">M Y R A</h1>
        <p style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #8a7968; margin: 5px 0 0 0;">L u x u r y  A t e l i e r</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 16px; border-bottom: 1px solid #e8e4dc; padding-bottom: 6px; color: #8a7968; font-weight: normal; margin-top: 0;">
          ${isForAdmin ? "Atelier Administration Dispatch Advisory" : "Thank you for your order"}
        </h3>
        <p style="font-size: 13px; line-height: 1.5; font-family: sans-serif;">
          ${isForAdmin 
            ? `An order has been registered via Razorpay. Verify stock availability and coordinate packing dispatch.` 
            : `Dear ${customerName}, your exclusive curation order from the MYRA Atelier is processed. We are preparing your botanical scents and leather accessories for dynamic delivery.`}
        </p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
        <thead>
          <tr style="background-color: #f5f2eb;">
            <th style="padding: 10px; text-align: left; font-family: sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666;">Selection Package</th>
            <th style="padding: 10px; text-align: center; font-family: sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666;">Qty</th>
            <th style="padding: 10px; text-align: right; font-family: sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666;">Valuation</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
          <tr>
            <td colspan="2" style="padding: 12px 10px 6px 10px; text-align: right; font-family: sans-serif; font-size: 12px; font-weight: bold; color: #555;">Atelier Subtotal:</td>
            <td style="padding: 12px 10px 6px 10px; text-align: right; font-family: sans-serif; font-size: 13px; font-weight: bold;">₹${order.totalAmount || order.totalPrice}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 6px 10px 12px 10px; text-align: right; font-family: sans-serif; font-size: 12px; font-weight: bold; color: #555; border-bottom: 2px solid #8a7968;">Express Shipment:</td>
            <td style="padding: 6px 10px 12px 10px; text-align: right; font-family: sans-serif; font-size: 13px; font-weight: bold; border-bottom: 2px solid #8a7968;">Complimented</td>
          </tr>
          <tr style="background-color: #fdfaf3;">
            <td colspan="2" style="padding: 15px 10px; text-align: right; font-size: 14px; font-weight: bold; color: #1c1917; text-transform: uppercase; letter-spacing: 1px;">Grand Invoiced Total:</td>
            <td style="padding: 15px 10px; text-align: right; font-size: 17px; font-weight: bold; color: #c68b59; font-family: Georgia, serif;">₹${order.totalAmount || order.totalPrice}</td>
          </tr>
        </tbody>
      </table>

      <div style="background-color: #eae6df; padding: 15px; border-radius: 8px; font-family: sans-serif; font-size: 12px; line-height: 1.6; margin-bottom: 25px;">
        <h4 style="margin: 0 0 8px 0; text-transform: uppercase; font-size: 11px; tracking-widest: 1px; color: #444; font-family: Georgia, serif; font-weight: bold;">Order Logistics Metadata</h4>
        <div style="display: grid; grid-template-cols: 1fr; gap: 8px;">
          <div><b>Order ID:</b> <code style="font-family: monospace; font-size: 12px; color: #c68b59;">${order.id}</code></div>
          <div><b>Order Date:</b> ${order.orderDate || order.date}</div>
          <div><b>Recipient Name:</b> ${customerName}</div>
          <div><b>Email Address:</b> ${email}</div>
          <div><b>Phone Number:</b> ${phone}</div>
          <div><b>Recipient Address:</b> ${addressFormatted}</div>
          <div><b>Payment Method:</b> ${order.paymentMethod || "Razorpay Securenodes"}</div>
          <div><b>Payment Status:</b> <span style="background-color: #e6f4ea; color: #137333; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold;">${order.paymentStatus || "PAID"}</span></div>
          <div><b>Order Status:</b> <span style="background-color: #fef7e0; color: #b06000; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold;">${order.orderStatus || "Pending"}</span></div>
        </div>
      </div>

      <div style="text-align: center; font-size: 11px; color: #8a7968; border-top: 1px solid #e8e4dc; padding-top: 15px;">
        <p style="margin: 0 0 5px 0;">MYRA Atelier Boutique, Mumbai, Maharashtra, India</p>
        <p style="margin: 0; font-family: sans-serif; font-size: 10px; color: #bbb;">Secured checkout system via Razorpay Payment Gateway integration</p>
      </div>
    </div>
  `;
}

// 2. Create new Order on DB
app.post("/api/orders", async (req, res) => {
  try {
    const { order } = req.body;
    if (!order) {
      return res.status(400).json({ error: "Missing order object." });
    }

    const settings = await getShippingSettings();
    const isProduction = settings.isProductionMode === true && process.env.DELHIVERY_SANDBOX !== "true";
    const isTestOrder = !isProduction;

    // Build the completed Order document fitting ALL schema parameters in Requirement 3
    const orderId = order.id || `MYRA-ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    const finalOrderId = isTestOrder ? `TEST-ORDER-${orderId}` : orderId;
    
    const shipping = order.shippingDetails;
    const formattedAddress = shipping 
      ? `${shipping.houseNo || ""}, ${shipping.streetAddress || ""}, ${shipping.areaLocality || ""}, ${shipping.city || ""}, ${shipping.state || ""} ${shipping.pinCode || ""}, ${shipping.country || ""}`
      : order.shippingAddress || "No detailed shipping address registered";

    const customerName = shipping
      ? `${shipping.firstName || ""} ${shipping.lastName || ""}`
      : order.customerName || "Bespoke Patron";

    const email = shipping?.emailAddress || order.emailAddress || "ikondecor1@gmail.com";
    const phone = shipping?.mobileNumber || order.phoneNumber || "+91 9999999999";

    const totalQuantity = (order.items || []).reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);
    const amount = Number(order.totalAmount || order.totalPrice || 0);

    const fullOrder = {
      // Direct requirement items
      id: finalOrderId,
      userId: order.userId || order.uid || null,
      customerName,
      phoneNumber: phone,
      emailAddress: email,
      shippingAddress: formattedAddress,
      items: order.items,
      totalQuantity,
      totalAmount: amount,
      paymentMethod: order.paymentMethod || "Razorpay secured card",
      paymentStatus: isTestOrder ? "TEST PAYMENT" : "Paid", // Checkpoint criteria
      orderStatus: isTestOrder ? "TEST ORDER" : "Pending", // Checkpoint criteria
      orderDate: order.orderDate || order.date || new Date().toISOString().split("T")[0],
      isTestOrder: isTestOrder,
      razorpayPaymentId: order.razorpayPaymentId || undefined,

      // Backwards-compatible parameters
      totalPrice: amount,
      status: isTestOrder ? "placed" : "placed", // backward compatibility mapping
      date: order.orderDate || order.date || new Date().toISOString().split("T")[0],
      isCancellationRequested: false,
      shippingDetails: shipping
    };

    // Save to Firestore
    await firestoreSetDoc("orders", fullOrder.id, fullOrder);

    // Async mail dispatch to avoid slowing order processing down
    const adminEmail = process.env.ADMIN_EMAIL || "ikondecor1@gmail.com";
    
    // Receipt 1: Notice to customer
    const customerReceiptHtml = generateOrderHtmlReceipt(fullOrder, false);
    sendMailNotification(email, `MYRA Luxury Atelier: Order Confirmation — ${orderId}`, customerReceiptHtml);

    // Receipt 2: Advisory to admin
    const adminAdvisoryHtml = generateOrderHtmlReceipt(fullOrder, true);
    sendMailNotification(adminEmail, `[ADMIN ADVISORY] New Order Placed: ${orderId} by ${customerName}`, adminAdvisoryHtml);

    res.json({ success: true, order: fullOrder });
  } catch (err) {
    console.error("Error writing new order:", err);
    res.status(500).json({ error: "Failed to securely save order record." });
  }
});

// 3. Update order pipeline status
app.put("/api/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, status, isCancellationRequested } = req.body;

    const orderData = await firestoreGetDoc("orders", id);
    if (!orderData) {
      return res.status(404).json({ error: "Order not found." });
    }

    const updatedOrder = { ...orderData };

    if (orderStatus !== undefined) updatedOrder.orderStatus = orderStatus;
    if (status !== undefined) updatedOrder.status = status;
    if (isCancellationRequested !== undefined) updatedOrder.isCancellationRequested = isCancellationRequested;

    await firestoreSetDoc("orders", id, updatedOrder);
    res.json({ success: true, order: updatedOrder });
  } catch (err) {
    console.error("Error updating order:", err);
    res.status(500).json({ error: "Failed to update order state." });
  }
});

// 4. Delete/cancel order from DB
app.delete("/api/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const orderData = await firestoreGetDoc("orders", id);
    if (!orderData) {
      return res.status(404).json({ error: "Order not found in records." });
    }

    await firestoreDeleteDoc("orders", id);
    res.json({ success: true, message: `Order ${id} deleted successfully.` });
  } catch (err) {
    console.error("Error deleting order:", err);
    res.status(500).json({ error: "Failed to delete order record." });
  }
});

// 5. Get Mail Log outputs
app.get("/api/emails/log", async (req, res) => {
  try {
    const logs = await firestoreGetCollection("emailLogs");
    const sorted = logs.sort((a, b) => {
      const d1 = a.timestamp || "";
      const d2 = b.timestamp || "";
      return d2.localeCompare(d1);
    });
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: "Failed to load email dispatch logs." });
  }
});

async function savePromoCodes(promoCodes: any[]) {
  for (const p of promoCodes) {
    if (p && p.code) {
      await firestoreSetDoc("promoCodes", p.code, p);
    }
  }
}

// 5a. Promo codes management system
app.get("/api/promo-codes", async (req, res) => {
  try {
    const list = await firestoreGetCollection("promoCodes");
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Failed to load active promo codes." });
  }
});

app.post("/api/promo-codes", async (req, res) => {
  try {
    const { promoCodes } = req.body;
    if (!Array.isArray(promoCodes)) {
      return res.status(400).json({ error: "Invalid promoCodes schema, array expected." });
    }
    await savePromoCodes(promoCodes);
    res.json({ success: true, message: "Promo codes database successfully updated." });
  } catch (err) {
    res.status(500).json({ error: "Failed to persist promo codes." });
  }
});

// Razorpay Payments API integration
// 6. Create Razorpay order securely
app.post("/api/payments/razorpay-order", async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) {
      return res.status(400).json({ error: "Payment checkout amount required." });
    }

    const razorpay = getRazorpay();
    if (!razorpay) {
      // Keys are missing: return simulation parameters seamlessly
      return res.json({
        isSandbox: true,
        key_id: "rzp_test_MyraSandboxKey",
        order_id: `rzp_ord_mock_${Math.floor(100000 + Math.random() * 900000)}`,
        amount: Number(amount) * 100,
        currency: "INR"
      });
    }

    const options = {
      amount: Math.round(Number(amount) * 100), // convert to paise
      currency: "INR",
      receipt: `receipt_myra_${Date.now()}`
    };

    const rzpOrder = await razorpay.orders.create(options);
    res.json({
      isSandbox: false,
      key_id: process.env.RAZORPAY_KEY_ID,
      order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency
    });
  } catch (err) {
    console.error("Error generating Razorpay order:", err);
    res.status(500).json({ error: "SECURE PAY HANDSHAKE ERROR: Failed to create gateway order." });
  }
});

// 7. Verify Payment signature from razorpay
app.post("/api/payments/razorpay-verify", (req, res) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

  if (razorpay_order_id?.startsWith("rzp_ord_mock_")) {
    return res.json({ status: "success", isSandbox: true });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return res.status(400).json({ error: "Missing server security keys for verification." });
  }

  try {
    // Generate signature locally using crypto and verify standard Razorpay match
    const hmac = crypto.createHmac("sha256", keySecret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature === razorpay_signature) {
      res.json({ status: "success", isSandbox: false });
    } else {
      res.status(400).json({ status: "failed", error: "Signature checksum mismatch. Possible tampering." });
    }
  } catch (err) {
    res.status(500).json({ status: "error", error: "Failed to cryptographically authorize signature." });
  }
});

// ==========================================
// DELHIVERY SHIPPING INTEGRATION & SIMULATOR
// ==========================================

// Helper to load shipping settings
async function getShippingSettings() {
  try {
    const docData = await firestoreGetDoc("shippingSettings", "settings");
    if (docData) {
      return {
        isProductionMode: false,
        ...docData
      };
    }
  } catch (err) {
    console.error("Failed to load shipping settings from Firestore:", err);
  }
  return {
    originPin: "400001",
    freeShippingThreshold: 999,
    baseCodCharge: 50,
    markupPercentage: 0,
    enablePromoFreeShipping: true,
    warehouseName: "MYRA Central Atelier",
    warehouseAddress: "Boutique Block, Apollo Bandar, Colaba",
    warehouseCity: "Mumbai",
    warehouseState: "Maharashtra",
    isProductionMode: false
  };
}

// 1. Get Shipping & Warehouse Settings
app.get("/api/shipping/settings", async (req, res) => {
  try {
    const settings = await getShippingSettings();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch shipping settings." });
  }
});

// 2. Update Shipping & Warehouse Settings
app.post("/api/shipping/settings", async (req, res) => {
  try {
    const rawBody = req.body;
    if (!rawBody || typeof rawBody !== "object") {
      return res.status(400).json({ error: "Invalid shipping settings format." });
    }

    const settingsData = rawBody.settings ? rawBody.settings : rawBody;
    const current = await getShippingSettings();
    const updated = { ...current, ...settingsData };
    await firestoreSetDoc("shippingSettings", "settings", updated);
    res.json({ success: true, settings: updated, message: "Atelier warehouse and shipping parameters synchronized." });
  } catch (err) {
    res.status(500).json({ error: "Failed to persist shipping settings changes." });
  }
});

// Helper for Indian Pincode metadata mapping in Sandbox Mode
function getSandboxPinMetadata(pincode: string) {
  const pinNum = pincode.replace(/\D/g, "");
  if (pinNum.length !== 6 || pinNum.startsWith("0")) {
    return { serviceable: false, error: "Invalid Indian PIN code format. Must be 6 digits." };
  }

  const prefix = pinNum.charAt(0);
  const isOda = pinNum.endsWith("9"); // simulate ODA if terminates with 9

  let city = "Mumbai";
  let state = "Maharashtra";
  let zone = "A"; // Local / Intra-state
  let minDays = 1;
  let maxDays = 2;

  switch (prefix) {
    case "1":
      city = "New Delhi";
      state = "Delhi";
      zone = "C"; // National
      minDays = 3;
      maxDays = 5;
      break;
    case "2":
      city = "Lucknow";
      state = "Uttar Pradesh";
      zone = "C"; // National
      minDays = 3;
      maxDays = 5;
      break;
    case "3":
      city = "Jaipur";
      state = "Rajasthan";
      zone = "B"; // Regional
      minDays = 2;
      maxDays = 4;
      break;
    case "4":
      if (pinNum.slice(0, 3) === "400") {
        city = "Greater Mumbai";
        state = "Maharashtra";
        zone = "A"; // Local
        minDays = 1;
        maxDays = 1;
      } else {
        city = "Pune";
        state = "Maharashtra";
        zone = "A"; // Local/Intra-state
        minDays = 1;
        maxDays = 2;
      }
      break;
    case "5":
      city = "Bengaluru";
      state = "Karnataka";
      zone = "B"; // Regional
      minDays = 2;
      maxDays = 4;
      break;
    case "6":
      city = "Chennai";
      state = "Tamil Nadu";
      zone = "C"; // National
      minDays = 3;
      maxDays = 5;
      break;
    case "7":
      city = "Guwahati";
      state = "Assam";
      zone = "D"; // Remote / North-East
      minDays = 5;
      maxDays = 8;
      break;
    case "8":
      city = "Patna";
      state = "Bihar";
      zone = "C"; // National
      minDays = 4;
      maxDays = 6;
      break;
    case "9":
      city = "Srinagar";
      state = "Jammu & Kashmir";
      zone = "D"; // Remote
      minDays = 5;
      maxDays = 7;
      break;
  }

  if (isOda) {
    city = `${city} Rural (ODA)`;
    minDays += 1;
    maxDays += 2;
  }

  return {
    serviceable: true,
    pincode: pinNum,
    city,
    state,
    zone,
    isOda,
    daysRange: `${minDays}-${maxDays}`,
    courierName: "Delhivery Express Prime",
    hubCode: `DEL-${state.toUpperCase().slice(0, 2)}-${pinNum.slice(0, 3)}`
  };
}

// 3. Serviceability verification API
app.get("/api/shipping/serviceability", async (req, res) => {
  try {
    const pincode = String(req.query.pincode || "").trim();
    if (!pincode) {
      return res.status(400).json({ error: "Pincode parameter required." });
    }

    const settings = await getShippingSettings();
    const isProduction = settings.isProductionMode === true && process.env.DELHIVERY_SANDBOX !== "true";

    const apiToken = process.env.DELHIVERY_API_TOKEN?.trim();
    const hasLiveToken = apiToken && apiToken !== "Secret value" && apiToken !== "";

    // 3a. Real Delhivery Pincode check if in Production mode and token is active
    if (isProduction && hasLiveToken) {
      try {
        const isStaging = process.env.DELHIVERY_SANDBOX === "true";
        const baseUrl = isStaging 
          ? "https://staging-express.delhivery.com" 
          : "https://track.delhivery.com";
        
        const response = await fetch(`${baseUrl}/c/api/pin-codes/json/?filter=pincode=${pincode}`, {
          method: "GET",
          headers: {
            "Authorization": `Token ${apiToken}`,
            "Content-Type": "application/json"
          }
        });

        if (response.ok) {
          const apiData: any = await response.json();
          const codes = apiData?.delivery_codes;
          if (Array.isArray(codes) && codes.length > 0) {
            const match = codes[0]?.postal_code;
            if (match && match.is_serviceable === "Y") {
              const estimateDays = match.oda === "Y" ? "5-7" : "3-5";
              return res.json({
                serviceable: true,
                pincode: match.pincode,
                city: match.city || "Recipient City",
                state: match.state_code || "Recipient State",
                zone: match.zone || "C",
                isOda: match.oda === "Y",
                daysRange: estimateDays,
                courierName: "Delhivery Express Service",
                hubCode: match.district_hub || "DEL-MAIN",
                isSandboxEnv: false
              });
            }
          }
          return res.json({
            serviceable: false,
            pincode,
            error: "This pincode location is registered as out of delivery service bounds for Delhivery.",
            isSandboxEnv: false
          });
        }
      } catch (err: any) {
        console.warn(`[Delhivery API Error] Serviceability failed: ${err.message}. Routing to Sandbox mode.`);
      }
    }

    // 3b. Fully functional high-fidelity Sandbox fallback
    const meta = getSandboxPinMetadata(pincode);
    if (!meta.serviceable) {
      return res.status(400).json({ error: meta.error });
    }

    return res.json({
      ...meta,
      isSandboxEnv: true
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to evaluate shipping point serviceability." });
  }
});

// 4. Dynamic Shipping Charges calculation
app.post("/api/shipping/calculate", async (req, res) => {
  try {
    const { destPin, items, paymentMethod, orderValue } = req.body;
    if (!destPin || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Missing required query elements (destPin, items array)." });
    }

    const settings = await getShippingSettings();
    const meta = getSandboxPinMetadata(destPin);

    if (!meta.serviceable) {
      return res.status(400).json({ error: meta.error });
    }

    // Calculate consolidated packing measurements (consolidate stacked layout)
    let totalWeight = 0; // grams
    let maxLength = 0; // cm
    let maxWidth = 0; // cm
    let cumulativeHeight = 0; // cm
    let quantityTotal = 0;
    let fragileIncluded = false;

    items.forEach((item: any) => {
      const q = Number(item.quantity || 1);
      quantityTotal += q;
      
      // Defaults mapping based on product parameters
      const defaultWeight = item.weight || (item.category === "perfumes" ? 350 : item.category?.includes("leather") ? 180 : 160);
      const defaultLen = item.length || (item.category === "perfumes" ? 10 : item.category?.includes("leather") ? 12 : 9);
      const defaultWid = item.width || (item.category === "perfumes" ? 10 : item.category?.includes("leather") ? 12 : 6);
      const defaultHt = item.height || (item.category === "perfumes" ? 16 : item.category?.includes("leather") ? 4 : 4);

      totalWeight += defaultWeight * q;
      maxLength = Math.max(maxLength, defaultLen);
      maxWidth = Math.max(maxWidth, defaultWid);
      cumulativeHeight += defaultHt * q;
      if (item.fragile) fragileIncluded = true;
    });

    // Determine actual vs volumetric chargeable weight (Consolidation Multiplier)
    const volumetricWeight = (maxLength * maxWidth * cumulativeHeight) / 5000; // in kg
    const actualWeightKg = totalWeight / 1000; // in kg
    const chargeableWeightKg = Math.max(actualWeightKg, volumetricWeight);

    // Apply Delhivery dynamic rate calculation card by Zone (up to 0.5kg + additions)
    let baseRate = 45;
    let additionalHalfKgRate = 35;
    
    switch (meta.zone) {
      case "A": // Local / Same state
        baseRate = 45;
        additionalHalfKgRate = 35;
        break;
      case "B": // Regional
        baseRate = 65;
        additionalHalfKgRate = 45;
        break;
      case "C": // National
        baseRate = 85;
        additionalHalfKgRate = 60;
        break;
      case "D": // Remote
        baseRate = 120;
        additionalHalfKgRate = 85;
        break;
    }

    const halfKgSteps = Math.ceil(chargeableWeightKg / 0.5);
    let calculatedShipFee = baseRate;
    if (halfKgSteps > 1) {
      calculatedShipFee += (halfKgSteps - 1) * additionalHalfKgRate;
    }

    // Remote ODA Area Surcharge
    if (meta.isOda) {
      calculatedShipFee += 80; // Add standard Delhivery rural fee
    }

    // COD handling fee
    let codFeeValue = 0;
    if (paymentMethod === "cod") {
      codFeeValue = settings.baseCodCharge || 50; 
    }

    // Administrative Markup adjustment
    if (settings.markupPercentage > 0) {
      calculatedShipFee = calculatedShipFee * (1 + settings.markupPercentage / 100);
    }

    // Evaluate promotional Campaign Free Shipping rules
    const qualifiesForFreeShipping = settings.enablePromoFreeShipping && (Number(orderValue || 0) >= settings.freeShippingThreshold);
    const finalShippingCharged = qualifiesForFreeShipping ? 0 : Math.round(calculatedShipFee);

    res.json({
      serviceable: true,
      originPin: settings.originPin,
      destPin,
      estimatedDays: meta.daysRange,
      courierName: meta.courierName,
      zone: meta.zone,
      isOda: meta.isOda,
      metrics: {
        totalQuantity: quantityTotal,
        actualWeightGrams: totalWeight,
        volumetricWeightKg: Number(volumetricWeight.toFixed(3)),
        chargeableWeightKg: Number(chargeableWeightKg.toFixed(3)),
        dimensions: { length: maxLength, width: maxWidth, height: cumulativeHeight }
      },
      pricingBreakdown: {
        baseRate,
        extraWeightCharge: calculatedShipFee - baseRate - (meta.isOda ? 80 : 0),
        odaSurcharge: meta.isOda ? 80 : 0,
        codPaymentFee: codFeeValue,
        calculatedTotalRaw: calculatedShipFee + codFeeValue,
        freeShippingCovered: qualifiesForFreeShipping,
        shippingFeeInvoiced: finalShippingCharged + codFeeValue
      },
      grandInvoicedFreight: finalShippingCharged + codFeeValue
    });
  } catch (err) {
    res.status(500).json({ error: "Freighting pricing calculations crashed." });
  }
});

// 5. Get all Shipment Records
app.get("/api/shipping/shipments", async (req, res) => {
  try {
    const list = await firestoreGetCollection("shipments");
    const sorted = list.sort((a, b) => {
      const d1 = a.createdDate || "";
      const d2 = b.createdDate || "";
      return d2.localeCompare(d1);
    });
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: "Failed to load shipment logs." });
  }
});

// 6. Generate Shipment / Create order in Delhivery endpoint
app.post("/api/shipping/shipments", async (req, res) => {
  try {
    const { order, metrics, pricing } = req.body;
    if (!order || !order.id) {
      return res.status(400).json({ error: "Order details are required to generate a tracking shipment." });
    }

    const settings = await getShippingSettings();
    const shipDetails = order.shippingDetails || {};
    const pin = shipDetails.pinCode || settings.originPin;
    const meta = getSandboxPinMetadata(pin);

    const isProduction = settings.isProductionMode === true && process.env.DELHIVERY_SANDBOX !== "true";

    let awb = `DLV-${Math.floor(100000000 + Math.random() * 900000000)}`;
    let isSandbox = true;
    let liveLogInfo = "Simulated delivery slot booking.";

    if (isProduction) {
      const apiToken = process.env.DELHIVERY_API_TOKEN?.trim();
      if (!apiToken || apiToken === "Secret value" || apiToken === "") {
        return res.status(400).json({ 
          error: "Delhivery API Token is missing or invalid in server environment. Configure DELHIVERY_API_TOKEN in your settings." 
        });
      }

      try {
        const payload = {
          shipments: [
            {
              name: order.customerName || `${shipDetails.firstName || ""} ${shipDetails.lastName || "Patron"}`.trim(),
              add: order.shippingAddress || "N/A",
              pin: pin,
              phone: order.phoneNumber || shipDetails.mobileNumber || "9999999999",
              payment_mode: order.paymentMethod?.toLowerCase().includes("cod") ? "COD" : "Prepaid",
              cod_amount: order.paymentMethod?.toLowerCase().includes("cod") ? (order.totalAmount || order.totalPrice) : 0,
              order: order.id,
              weight: metrics?.chargeableWeightKg || 0.45,
              length: metrics?.dimensions?.length || 12,
              width: metrics?.dimensions?.width || 12,
              height: metrics?.dimensions?.height || 8
            }
          ],
          pickup_location: {
            name: settings.warehouseName || "MYRA Central Atelier",
            add: settings.warehouseAddress || "Boutique Block, Apollo Bandar, Colaba",
            pin: settings.originPin || "400001",
            phone: settings.warehouseMobile || "9876543210"
          }
        };

        const formData = new URLSearchParams();
        formData.append("format", "json");
        formData.append("data", JSON.stringify(payload));

        const dResponse = await fetch("https://track.delhivery.com/api/v1/packages/json/", {
          method: "POST",
          headers: {
            "Authorization": `Token ${apiToken}`,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: formData.toString()
        });

        if (dResponse.ok) {
          const dData: any = await dResponse.json();
          if (dData.success && dData.packages && dData.packages.length > 0) {
            const pkg = dData.packages[0];
            if (pkg.status === "Success" && pkg.waybill) {
              awb = pkg.waybill;
              isSandbox = false;
              liveLogInfo = "Real package waybill requested: Courier partner acknowledged and booked shipping. AWB allocated.";
            } else {
              throw new Error(pkg.remarks || dData.rmk || "Delhivery courier rejected creation.");
            }
          } else {
            throw new Error(dData.rmk || "Service response parsed as unsuccessful.");
          }
        } else {
          const textErr = await dResponse.text();
          throw new Error(`Delhivery returned HTTP ${dResponse.status}: ${textErr}`);
        }
      } catch (err: any) {
        console.error("Delhivery Live API placement error:", err);
        return res.status(500).json({ 
          error: `Failed to register package with Live Delhivery Courier Network. Error: ${err.message}` 
        });
      }
    }

    const finalDaysRange = meta && meta.daysRange ? meta.daysRange : "3-5";
    const estimateDays = parseInt(finalDaysRange.split("-")[1] || "4");

    const newShipment = {
      awb,
      orderId: order.id,
      customerName: order.customerName || `${shipDetails.firstName || ""} ${shipDetails.lastName || "Patron"}`.trim(),
      recipientPhone: order.phoneNumber || shipDetails.mobileNumber || "N/A",
      deliveryAddress: order.shippingAddress || "N/A",
      deliveryPin: pin,
      originPin: settings.originPin,
      status: "manifest_created", // starts as manifest_created
      statusDescription: isSandbox 
        ? "Atelier warehouse package wrapped. Booking slots requested with courier partner." 
        : "Package booked in Delhivery Live courier network. Waybill registration active.",
      paymentMode: order.paymentMethod?.toLowerCase().includes("cod") ? "COD" : "Prepaid",
      codAmount: order.paymentMethod?.toLowerCase().includes("cod") ? (order.totalAmount || order.totalPrice) : 0,
      awbLabelUrl: `/api/shipping/label/${awb}`,
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      estimatedDeliveryDate: new Date(Date.now() + (estimateDays * 24 * 60 * 60 * 1000)).toISOString().split("T")[0],
      isSandbox,
      liveLogInfo,
      dimensions: metrics?.dimensions || { length: 12, width: 12, height: 8 },
      chargeableWeightKg: metrics?.chargeableWeightKg || 0.45,
      shippingCharges: pricing?.shippingFeeInvoiced || 0
    };

    // Save shipment record
    await firestoreSetDoc("shipments", awb, newShipment);

    // Also: append AWB and tracking details directly back into the Order record!
    try {
      const orderData = await firestoreGetDoc("orders", order.id);
      if (orderData) {
        orderData.awbNumber = awb;
        orderData.trackingLink = `/tracking?awb=${awb}`;
        orderData.shipmentStatus = "manifest_created";
        orderData.orderStatus = isSandbox ? "Dispatched" : "Dispatched (Delhivery Live)";
        await firestoreSetDoc("orders", order.id, orderData);
      }
    } catch (orderUpdateErr) {
      console.error("Failed to link AWB number to order database:", orderUpdateErr);
    }

    res.json({ success: true, shipment: newShipment, message: "Delhivery logistics manifest compiled successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Shipment manifest generation failed." });
  }
});

// 7. Track individual shipment by AWB
app.get("/api/shipping/track/:awb", async (req, res) => {
  try {
    const { awb } = req.params;
    const ship = await firestoreGetDoc("shipments", awb);
    if (!ship) {
      return res.status(404).json({ error: "Tracking record not found for the requested Delhivery AWB." });
    }

    // Return the status with descriptive historic checkpoint steps (Transit checkpoints)
    const checkpointMilestones = [
      { time: ship.createdDate, location: "Mumbai Central Hub", state: "Manifest Booked", detail: "Electronic invoice booked. Consignment accepted by Delhivery." }
    ];

    if (ship.status !== "manifest_created") {
      checkpointMilestones.unshift({
        time: new Date(new Date(ship.createdDate).getTime() + 12 * 60 * 60 * 1000).toISOString(),
        location: "Mumbai Central Sorting Facility",
        state: "Shipped",
        detail: "Premium sorting validated. Package in queue for dynamic zoning trucks."
      });
    }

    if (ship.status === "in_transit" || ship.status === "out_for_delivery" || ship.status === "delivered") {
      checkpointMilestones.unshift({
        time: new Date(new Date(ship.createdDate).getTime() + 24 * 60 * 60 * 1000).toISOString(),
        location: `State Hub PIN-${ship.deliveryPin.slice(0, 3)}xxx`,
        state: "In Transit",
        detail: "Arrived at zone hub terminal. Handed over to regional express operations."
      });
    }

    if (ship.status === "out_for_delivery" || ship.status === "delivered") {
      checkpointMilestones.unshift({
        time: new Date(new Date(ship.estimatedDeliveryDate).getTime() - 4 * 60 * 60 * 1000).toISOString(),
        location: `Local Delivery Office (${ship.deliveryPin})`,
        state: "Out For Delivery",
        detail: "Dispatched with Delhivery field associate. Contact confirmation initiated."
      });
    }

    if (ship.status === "delivered") {
      checkpointMilestones.unshift({
        time: new Date(ship.estimatedDeliveryDate).toISOString(),
        location: `Patron Residence (${ship.deliveryPin})`,
        state: "Delivered",
        detail: `Successfully delivered and verified. Received by authorized recipient.`
      });
    }

    res.json({
      shipment: ship,
      checkpoints: checkpointMilestones
    });
  } catch (err) {
    res.status(500).json({ error: "Tracking inquiry failed." });
  }
});

// 8. Update shipment dispatch stages (Admin Tool)
app.post("/api/shipping/shipments/:awb/update", async (req, res) => {
  try {
    const { awb } = req.params;
    const { status, statusDescription } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Next shipping status is required." });
    }

    const currentShip = await firestoreGetDoc("shipments", awb);
    if (!currentShip) {
      return res.status(404).json({ error: "Shipment AWB not found." });
    }

    currentShip.status = status;
    currentShip.statusDescription = statusDescription || `Consignment status adjusted to ${status}`;
    currentShip.updatedDate = new Date().toISOString();

    await firestoreSetDoc("shipments", awb, currentShip);

    // Also sync status back to order list
    const orderId = currentShip.orderId;
    try {
      const orderData = await firestoreGetDoc("orders", orderId);
      if (orderData) {
        orderData.shipmentStatus = status;
        if (status === "delivered") {
          orderData.orderStatus = "Delivered";
          orderData.paymentStatus = "Paid"; // paid if delivered
        } else if (status === "manifest_created") {
          orderData.orderStatus = "Dispatched";
        } else {
          orderData.orderStatus = "In Transit";
        }
        await firestoreSetDoc("orders", orderId, orderData);
      }
    } catch (err) {
      console.error(err);
    }

    res.json({ success: true, shipment: currentShip, message: `AWB ${awb} status updated to [${status.toUpperCase()}].` });
  } catch (err) {
    res.status(500).json({ error: "Status escalation failed." });
  }
});

// 8a. Stream elegant printable shipping label PDF representation (HTML rendering)
app.get("/api/shipping/label/:awb", async (req, res) => {
  try {
    const { awb } = req.params;
    const ship = await firestoreGetDoc("shipments", awb);
    if (!ship) {
      return res.status(404).send("<h3>Label Generation Error: AWB Not Found</h3>");
    }

    const settings = await getShippingSettings();

    // Stream a wunderschön, clean, highly-authentic business thermal barcode package shipping label!
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Delhivery Shipping Label - ${awb}</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 11px; margin: 0; padding: 20px; background-color: #f0f0f0; }
          .label-box { width: 380px; border: 4px solid #000; padding: 15px; margin: 0 auto; background: #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.15); }
          .header { border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
          .logo { font-size: 18px; font-weight: 900; letter-spacing: 2px; }
          .mode { border: 3px solid #000; padding: 2px 8px; font-size: 14px; font-weight: 950; }
          .address-section { border-bottom: 1px solid #000; padding: 6px 0; min-height: 50px; }
          .sub-title { font-weight: bold; font-size: 9px; margin: 0 0 4px 0; text-transform: uppercase; }
          .bar { text-align: center; margin: 15px 0; border-bottom: 1px solid #000; padding-bottom: 15px; }
          .barcode-mock { background: #000; height: 50px; margin: 5px auto; width: 90%; 
            background: repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 6px, #000 6px, #000 8px, #fff 8px, #fff 10px);
          }
          .awb-text { font-size: 13px; font-weight: bold; margin-top: 4px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #000; padding: 6px 0; }
          .centered { text-align: center;}
          .bold { font-weight: bold; }
          .footer-text { font-size: 8px; text-align: center; color: #555; margin-top: 10px; }
        </style>
      </head>
      <body onload="window.print()">
        <div class="label-box">
          <div class="header">
            <div class="logo">DELHIVERY</div>
            <div class="mode">${ship.paymentMode === "COD" ? "C.O.D (Collect ₹" + ship.codAmount + ")" : "PREPAID"}</div>
          </div>
          
          <div class="address-section">
            <div class="sub-title">Ship To (Recipient patrongaddress):</div>
            <div class="bold" style="font-size: 12px; margin-bottom: 2px;">${ship.customerName}</div>
            <div>${ship.deliveryAddress}</div>
            <div class="bold" style="font-size: 13px; margin-top: 4px;">PIN: ${ship.deliveryPin}</div>
            <div>Phone: ${ship.recipientPhone}</div>
          </div>

          <div class="address-section">
            <div class="sub-title">Shipper / Return To:</div>
            <div class="bold">${settings.warehouseName}</div>
            <div>${settings.warehouseAddress}, ${settings.warehouseCity}, ${settings.warehouseState}</div>
            <div>PIN: ${settings.originPin}</div>
          </div>

          <div class="grid-2">
            <div>
              <div class="sub-title">Order Ref:</div>
              <div class="bold">${ship.orderId}</div>
            </div>
            <div style="border-left: 1px solid #000; padding-left: 10px;">
              <div class="sub-title">Ship Date:</div>
              <div>${ship.createdDate.split("T")[0]}</div>
            </div>
          </div>

          <div class="grid-2">
            <div>
              <div class="sub-title font-mono">Weight / Volume:</div>
              <div class="bold">${ship.chargeableWeightKg} Kg</div>
            </div>
            <div style="border-left: 1px solid #000; padding-left: 10px;">
              <div class="sub-title">Parcel Specs:</div>
              <div class="bold font-mono">${ship.dimensions.length}x${ship.dimensions.width}x${ship.dimensions.height} cm</div>
            </div>
          </div>

          <div class="bar">
            <div class="barcode-mock"></div>
            <div class="awb-text">AWB: ${ship.awb}</div>
          </div>

          <div class="centered bold" style="font-size: 11px;">
            DELHIVERY ROUTING ROUTE: CG-MH-${ship.deliveryPin.slice(0, 3)}
          </div>
          
          <div class="footer-text">
            For support regarding MYRA shipping logistics or delay claims, reach out to ikondecor1@gmail.com
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send("Label rendering exception.");
  }
});

// Vite server integrations
async function runDiagnostic() {
  const diagnosticResult: any = {
    timestamp: new Date().toISOString(),
    env: {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || null,
      FIREBASE_FIRESTORE_DATABASE_ID: process.env.FIREBASE_FIRESTORE_DATABASE_ID || null,
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY ? "PRESENT" : "MISSING",
      NODE_ENV: process.env.NODE_ENV || null,
    },
    config: null,
    connectionTest: "INITIALIZING"
  };

  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      diagnosticResult.config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    }
  } catch (e: any) {
    diagnosticResult.configError = e.message;
  }

  // Write initial config immediately so we can inspect it
  try {
    fs.writeFileSync(path.join(process.cwd(), "src", "debug-output.json"), JSON.stringify(diagnosticResult, null, 2), "utf-8");
  } catch (err) {
    console.error("[Diagnostic] Initial write failed:", err);
  }

  try {
    const firestoreDb = getDB();
    if (!firestoreDb) {
      diagnosticResult.connectionTest = { success: false, error: "getDB() returned null" };
    } else {
      const testDocId = "diag_" + Date.now();
      const docRef = doc(firestoreDb, "_debug_diagnostic", testDocId);
      await setDoc(docRef, { test: true, time: new Date().toISOString() });
      const snap = await getDoc(docRef);
      const data = snap.exists() ? snap.data() : null;
      await deleteDoc(docRef);

      diagnosticResult.connectionTest = {
        success: true,
        dataRead: data,
      };
    }
  } catch (err: any) {
    diagnosticResult.connectionTest = {
      success: false,
      error: err.message || err.toString(),
      code: err.code,
      stack: err.stack
    };
  }

  try {
    fs.writeFileSync(path.join(process.cwd(), "src", "debug-output.json"), JSON.stringify(diagnosticResult, null, 2), "utf-8");
    console.log("[Diagnostic] Wrote updated debug-output.json successfully.");
  } catch (err) {
    console.error("[Diagnostic] Failed to write debug-output.json:", err);
  }
}

async function startServer() {
  // Run diagnostics
  await runDiagnostic();

  // Check and run initial Firestore migrations/seeding in the background asynchronously
  seedFirestore().catch(err => {
    console.error("[Seed Firestore Exception] Background seeding error:", err);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Middlewares injected: Vite bundler hot module replacement connected.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving production static bundles via Express router.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express node running at http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
} else {
  // On Vercel, run seeding and diagnostic in the background asynchronously once on startup
  seedFirestore().catch(err => {
    console.error("[Vercel Seeding Exception] Background seeding error:", err);
  });
  runDiagnostic().catch(err => {
    console.error("[Vercel Diagnostics Exception] Background diagnostics error:", err);
  });
}

export default app;

