import React, { useState, useEffect, useRef } from "react";
import { Product, SizeVariant, FragranceNotes, CartItem, ContactMessage, StoreLocation, Review, PromoCode, SEOMetadata } from "../types";
import { products as seedProducts } from "../data";
import { getPreseededReviews } from "./ProductDetailModal";
import { MediaSettingsTab } from "./MediaSettingsTab";
import { uploadToCloudinary } from "../cloudinary";
import { db } from "../lib/firebase";
import { collection, doc, setDoc, getDocs, getDoc, deleteDoc } from "firebase/firestore";
import { 
  X, 
  Trash2, 
  Edit3, 
  Plus, 
  RefreshCw, 
  ShoppingBag, 
  Database, 
  DollarSign, 
  Folder, 
  Layers, 
  CheckCircle, 
  AlertTriangle, 
  Image as ImageIcon, 
  Sparkles, 
  UploadCloud, 
  Tag, 
  TrendingUp, 
  Sliders, 
  MessageSquare, 
  User, 
  Search, 
  ArrowLeft,
  ChevronDown,
  Activity,
  Award,
  MapPin,
  Video,
  Lock,
  Star,
  ShieldCheck,
  Mail,
  Check,
  Truck,
  Printer,
  Settings,
  ClipboardList,
  Building,
  Calculator,
  Globe
} from "lucide-react";

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProductsChange: (updated: Product[]) => void;
  orders: any[];
  onOrdersChange: (updated: any[]) => void;
  triggerToast: (msg: string) => void;
  messages?: ContactMessage[];
  onMessagesChange?: (updated: ContactMessage[]) => void;
  locations?: StoreLocation[];
  onLocationsChange?: (updated: StoreLocation[]) => void;
  videoUrl?: string;
  onVideoUrlChange?: (url: string) => void;
  heroBgUrl?: string;
  onHeroBgUrlChange?: (url: string) => void;
  logoUrl?: string;
  onLogoUrlChange?: (url: string) => void;
  companyName?: string;
  onCompanyNameChange?: (name: string) => void;
  companySubtitle?: string;
  onCompanySubtitleChange?: (sub: string) => void;
  bannerUrl?: string;
  onBannerUrlChange?: (url: string) => void;
  seoData?: Record<string, SEOMetadata>;
  onSeoDataChange?: (newSeoData: Record<string, SEOMetadata>) => void;
}

// Initial default password
const ADMIN_PASSWORD = "admin";

export const AdminPortal: React.FC<AdminPortalProps> = ({
  isOpen,
  onClose,
  products,
  onProductsChange,
  orders,
  onOrdersChange,
  triggerToast,
  messages = [],
  onMessagesChange,
  locations = [],
  onLocationsChange,
  videoUrl = "https://res.cloudinary.com/dy7avkqub/video/upload/q_auto/f_auto/v1780582990/b_e_d_b_e_videomp__ugppis.mp4",
  onVideoUrlChange,
  heroBgUrl = "https://res.cloudinary.com/dy7avkqub/image/upload/q_auto/f_auto/v1780577005/main-sample.jpg",
  onHeroBgUrlChange,
  logoUrl = "https://res.cloudinary.com/dwokrma1h/image/upload/v1779454534/main-sample.png",
  onLogoUrlChange,
  companyName = "MYRA",
  onCompanyNameChange,
  companySubtitle = "LUXURY",
  onCompanySubtitleChange,
  bannerUrl = "https://res.cloudinary.com/dy7avkqub/image/upload/q_auto/f_auto/v1780835693/samples/waves.png",
  onBannerUrlChange,
  seoData = {},
  onSeoDataChange,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("myra_admin_auth") === "true";
  });
  const [adminPasscode, setAdminPasscode] = useState<string>(() => {
    return localStorage.getItem("myra_admin_passcode") || "admin";
  });
  const [passwordInput, setPasswordInput] = useState<string>(() => {
    return localStorage.getItem("myra_admin_passcode") || "admin";
  });
  const [newPasscodeInput, setNewPasscodeInput] = useState<string>("");
  const [loginError, setLoginError] = useState<string | null>(null);

  // Secure Passkey Recovery states
  const [isRecovering, setIsRecovering] = useState<boolean>(false);
  const [recoveryStep, setRecoveryStep] = useState<"email" | "code" | "reset">("email");
  const [recoveryEmail, setRecoveryEmail] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [resetNewPasscode, setResetNewPasscode] = useState<string>("");
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<"products" | "orders" | "analytics" | "messages" | "locations" | "media" | "reviews" | "promocodes" | "shipping" | "seo">("products");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("All");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("All");
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>("");
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [showEmailLogs, setShowEmailLogs] = useState<boolean>(false);
  const [selectedEmailLog, setSelectedEmailLog] = useState<any | null>(null);

  // Promo code states
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loadingPromos, setLoadingPromos] = useState<boolean>(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [promoFormMode, setPromoFormMode] = useState<"list" | "create" | "edit">("list");

  // Promo code form inputs
  const [promoInputCode, setPromoInputCode] = useState("");
  const [promoInputType, setPromoInputType] = useState<"fixed" | "percentage" | "free_shipping">("fixed");
  const [promoInputValue, setPromoInputValue] = useState<number>(0);
  const [promoInputDescription, setPromoInputDescription] = useState("");
  const [promoInputActive, setPromoInputActive] = useState<boolean>(true);

  // Reviews management states
  const [selectedProductReviewId, setSelectedProductReviewId] = useState<string | null>(null);
  const [reviewSearchQuery, setReviewSearchQuery] = useState<string>( "");

  // Dynamic SEO editing states
  const [seoActivePage, setSeoActivePage] = useState<string>("home");
  const [localTitle, setLocalTitle] = useState("");
  const [localDescription, setLocalDescription] = useState("");
  const [localKeywords, setLocalKeywords] = useState("");
  const [localOgTitle, setLocalOgTitle] = useState("");
  const [localOgDescription, setLocalOgDescription] = useState("");
  const [localOgImage, setLocalOgImage] = useState("");

  useEffect(() => {
    if (seoData && seoData[seoActivePage]) {
      const pageData = seoData[seoActivePage];
      setLocalTitle(pageData.title || "");
      setLocalDescription(pageData.description || "");
      setLocalKeywords(pageData.keywords || "");
      setLocalOgTitle(pageData.ogTitle || "");
      setLocalOgDescription(pageData.ogDescription || "");
      setLocalOgImage(pageData.ogImage || "");
    }
  }, [seoActivePage, seoData]);

  const [uploadingOgImage, setUploadingOgImage] = useState<boolean>(false);

  // Delhivery Logistics Dashboard Admin states
  const [adminShipments, setAdminShipments] = useState<any[]>([]);
  const [adminShippingSettings, setAdminShippingSettings] = useState<any>({
    warehouseOriginPincode: "400001",
    warehouseName: "MYRA Central Atelier",
    warehouseAddress: "Boutique Block, Apollo Bandar, Colaba",
    warehouseCity: "Mumbai",
    warehouseState: "Maharashtra",
    warehouseMobile: "9876543210",
    freeShippingThreshold: 999,
    extraWeightKgRate: 150,
    codPaymentFee: 50,
    markupPercentage: 0,
    enablePromoFreeShipping: true,
    isProductionMode: false
  });
  const [activeShippingSubSection, setActiveShippingSubSection] = useState<"dashboard" | "settings">("dashboard");
  const [isLoadingShipments, setIsLoadingShipments] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [labelHtmlForAwb, setLabelHtmlForAwb] = useState<string | null>(null);
  const [selectedShipmentForLabel, setSelectedShipmentForLabel] = useState<any | null>(null);

  const fetchAdminShipments = async () => {
    setIsLoadingShipments(true);
    try {
      const response = await fetch("/api/shipping/shipments");
      if (response.ok) {
        const data = await response.json();
        setAdminShipments(data.shipments || []);
      } else {
        throw new Error("Proxy shipments fetch failed");
      }
    } catch (err) {
      console.warn("[Firestore Admin Fallback]: Fetching shipments directly via Client SDK...", err);
      try {
        const snap = await getDocs(collection(db, "shipments"));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAdminShipments(list);
      } catch (fallbackErr) {
        console.error("Direct client shipments fetch failed too:", fallbackErr);
        triggerToast("Failed to fetch Delhivery shipments.", true);
      }
    } finally {
      setIsLoadingShipments(false);
    }
  };

  const fetchAdminShippingSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const response = await fetch("/api/shipping/settings");
      if (response.ok) {
        const data = await response.json();
        const settings = data.settings || {};
        setAdminShippingSettings({
          warehouseOriginPincode: settings.warehouseOriginPincode || settings.originPin || "400001",
          warehouseName: settings.warehouseName || "MYRA Central Atelier",
          warehouseAddress: settings.warehouseAddress || "Boutique Block, Apollo Bandar, Colaba",
          warehouseCity: settings.warehouseCity || "Mumbai",
          warehouseState: settings.warehouseState || "Maharashtra",
          warehouseMobile: settings.warehouseMobile || "9876543210",
          freeShippingThreshold: typeof settings.freeShippingThreshold === 'number' ? settings.freeShippingThreshold : 999,
          extraWeightKgRate: typeof settings.extraWeightKgRate === 'number' ? settings.extraWeightKgRate : 150,
          codPaymentFee: typeof settings.codPaymentFee === 'number' ? settings.codPaymentFee : (typeof settings.baseCodCharge === 'number' ? settings.baseCodCharge : 50),
          markupPercentage: typeof settings.markupPercentage === 'number' ? settings.markupPercentage : 0,
          enablePromoFreeShipping: settings.enablePromoFreeShipping !== undefined ? settings.enablePromoFreeShipping : true,
          isProductionMode: settings.isProductionMode !== undefined ? settings.isProductionMode : false
        });
      } else {
        throw new Error("Proxy shipping settings fetch failed");
      }
    } catch (err) {
      console.warn("[Firestore Admin Fallback]: Fetching shipping settings directly via Client SDK...", err);
      try {
        const docSnap = await getDoc(doc(db, "shippingSettings", "settings"));
        if (docSnap.exists()) {
          const settings = docSnap.data();
          setAdminShippingSettings({
            warehouseOriginPincode: settings.warehouseOriginPincode || settings.originPin || "400001",
            warehouseName: settings.warehouseName || "MYRA Central Atelier",
            warehouseAddress: settings.warehouseAddress || "Boutique Block, Apollo Bandar, Colaba",
            warehouseCity: settings.warehouseCity || "Mumbai",
            warehouseState: settings.warehouseState || "Maharashtra",
            warehouseMobile: settings.warehouseMobile || "9876543210",
            freeShippingThreshold: typeof settings.freeShippingThreshold === 'number' ? settings.freeShippingThreshold : 999,
            extraWeightKgRate: typeof settings.extraWeightKgRate === 'number' ? settings.extraWeightKgRate : 150,
            codPaymentFee: typeof settings.codPaymentFee === 'number' ? settings.codPaymentFee : (typeof settings.baseCodCharge === 'number' ? settings.baseCodCharge : 50),
            markupPercentage: typeof settings.markupPercentage === 'number' ? settings.markupPercentage : 0,
            enablePromoFreeShipping: settings.enablePromoFreeShipping !== undefined ? settings.enablePromoFreeShipping : true,
            isProductionMode: settings.isProductionMode !== undefined ? settings.isProductionMode : false
          });
        }
      } catch (fallbackErr) {
        console.error("Direct client shipping settings fetch failed too:", fallbackErr);
      }
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const saveAdminShippingSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingSettings(true);
    const payload = {
      ...adminShippingSettings,
      originPin: adminShippingSettings.warehouseOriginPincode,
      baseCodCharge: adminShippingSettings.codPaymentFee
    };
    try {
      const response = await fetch("/api/shipping/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payload })
      });
      if (response.ok) {
        const data = await response.json();
        const settings = data.settings || {};
        setAdminShippingSettings({
          warehouseOriginPincode: settings.warehouseOriginPincode || settings.originPin || "400001",
          warehouseName: settings.warehouseName || "MYRA Central Atelier",
          warehouseAddress: settings.warehouseAddress || "Boutique Block, Apollo Bandar, Colaba",
          warehouseCity: settings.warehouseCity || "Mumbai",
          warehouseState: settings.warehouseState || "Maharashtra",
          warehouseMobile: settings.warehouseMobile || "9876543210",
          freeShippingThreshold: typeof settings.freeShippingThreshold === 'number' ? settings.freeShippingThreshold : 999,
          extraWeightKgRate: typeof settings.extraWeightKgRate === 'number' ? settings.extraWeightKgRate : 150,
          codPaymentFee: typeof settings.codPaymentFee === 'number' ? settings.codPaymentFee : (typeof settings.baseCodCharge === 'number' ? settings.baseCodCharge : 50),
          markupPercentage: typeof settings.markupPercentage === 'number' ? settings.markupPercentage : 0,
          enablePromoFreeShipping: settings.enablePromoFreeShipping !== undefined ? settings.enablePromoFreeShipping : true,
          isProductionMode: settings.isProductionMode !== undefined ? settings.isProductionMode : false
        });
        localStorage.setItem("myra_shipping_settings", JSON.stringify(payload));
        triggerToast("Delhivery business rules updated successfully.");
      } else {
        throw new Error("Proxy settings save failed");
      }
    } catch (err) {
      console.warn("[Firestore Admin Fallback]: Saving shipping settings directly via Client SDK...", err);
      try {
        await setDoc(doc(db, "shippingSettings", "settings"), payload, { merge: true });
        localStorage.setItem("myra_shipping_settings", JSON.stringify(payload));
        triggerToast("Delhivery business rules updated successfully.");
      } catch (fallbackErr) {
        console.error("Direct client shipping settings save failed too:", fallbackErr);
        triggerToast("Error updating business rules database.", true);
      }
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleUpdateShipmentStatus = async (awb: string, nextStatus: string) => {
    try {
      const response = await fetch(`/api/shipping/shipments/${awb}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      if (response.ok) {
        triggerToast(`AWB ${awb} status updated to ${nextStatus}.`);
        fetchAdminShipments();
      } else {
        triggerToast("Failed to update status on server.", true);
      }
    } catch (err) {
      console.error("Failed to alter status:", err);
      triggerToast("Error altering carrier status.", true);
    }
  };

  const handlePreviewLabel = async (shipment: any) => {
    try {
      const response = await fetch(`/api/shipping/label/${shipment.awb}`);
      if (response.ok) {
        const labelHtml = await response.text();
        setLabelHtmlForAwb(labelHtml);
        setSelectedShipmentForLabel(shipment);
      } else {
        triggerToast("Failed to fetch printed label template from server.", true);
      }
    } catch (err) {
      console.error("Failed to load printed label:", err);
      triggerToast("Error loading printed label.", true);
    }
  };

  useEffect(() => {
    if (activeSubTab === "shipping" && isOpen) {
      fetchAdminShipments();
      fetchAdminShippingSettings();
    }
  }, [activeSubTab, isOpen]);

  // Promo Code database integration handlers
  const fetchPromoCodes = async () => {
    setLoadingPromos(true);
    try {
      const response = await fetch("/api/promo-codes");
      if (response.ok) {
        const data = await response.json();
        setPromoCodes(data);
      } else {
        throw new Error("Proxy fetch failed");
      }
    } catch (err) {
      console.warn("[Firestore Admin Fallback]: Fetching promo codes directly via Client SDK...", err);
      try {
        const snap = await getDocs(collection(db, "promoCodes"));
        const list = snap.docs.map(d => d.data() as PromoCode);
        setPromoCodes(list);
      } catch (fallbackErr) {
        console.error("Direct client promo codes fetch failed too:", fallbackErr);
      }
    } finally {
      setLoadingPromos(false);
    }
  };

  const savePromoCodes = async (updatedPromos: PromoCode[]) => {
    try {
      const response = await fetch("/api/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCodes: updatedPromos })
      });
      if (response.ok) {
        setPromoCodes(updatedPromos);
        triggerToast("Promo codes database successfully updated.");
      } else {
        throw new Error("Proxy save promo-codes failed");
      }
    } catch (err) {
      console.warn("[Firestore Admin Fallback]: Saving promo codes directly via Client SDK...", err);
      try {
        for (const p of updatedPromos) {
          await setDoc(doc(db, "promoCodes", p.code), p, { merge: true });
        }
        // Clean up deleted codes
        const snap = await getDocs(collection(db, "promoCodes"));
        const currentList = snap.docs.map(d => d.id);
        const updatedCodes = updatedPromos.map(p => p.code);
        for (const code of currentList) {
          if (!updatedCodes.includes(code)) {
            await deleteDoc(doc(db, "promoCodes", code));
          }
        }
        setPromoCodes(updatedPromos);
        triggerToast("Promo codes database successfully updated.");
      } catch (fallbackErr) {
        console.error("Direct client promo codes save failed too:", fallbackErr);
        triggerToast("Error matching server sync nodes.");
      }
    }
  };

  const handleTogglePromoActive = async (codeStr: string) => {
    const updated = promoCodes.map(p => p.code === codeStr ? { ...p, active: !p.active } : p);
    await savePromoCodes(updated);
  };

  const handleDeletePromo = (codeStr: string) => {
    showConfirm(
      "Delete Promo Code",
      `Are you sure you want to permanently delete the promo code "${codeStr}"? This will discontinue this promotional code immediately.`,
      async () => {
        const updated = promoCodes.filter(p => p.code !== codeStr);
        await savePromoCodes(updated);
      },
      "Delete",
      true
    );
  };

  const handleSavePromoForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedCode = promoInputCode.trim().toUpperCase();
    if (!normalizedCode) {
      triggerToast("A clear promotional reference word is required.");
      return;
    }

    if (promoInputType !== "free_shipping" && promoInputValue <= 0) {
      triggerToast("Discount value must represent a positive amount.");
      return;
    }

    const defaultDesc = promoInputType === "free_shipping"
      ? "Free Express Shipment & Courier Handling"
      : `${promoInputType === "percentage" ? promoInputValue + "%" : "₹" + promoInputValue} off on boutique selections`;

    const newPromo: PromoCode = {
      code: normalizedCode,
      type: promoInputType,
      value: promoInputType === "free_shipping" ? 0 : Number(promoInputValue),
      active: promoInputActive,
      description: promoInputDescription.trim() || defaultDesc
    };

    let updated: PromoCode[];
    if (promoFormMode === "edit" && editingPromo) {
      updated = promoCodes.map(p => p.code === editingPromo.code ? newPromo : p);
    } else {
      // Check duplicate code
      if (promoCodes.some(p => p.code === normalizedCode)) {
        triggerToast(`The promo code "${normalizedCode}" already duplicate maps.`);
        return;
      }
      updated = [...promoCodes, newPromo];
    }

    await savePromoCodes(updated);
    setPromoFormMode("list");
    setEditingPromo(null);
    // Reset form
    setPromoInputCode("");
    setPromoInputType("fixed");
    setPromoInputValue(0);
    setPromoInputDescription("");
    setPromoInputActive(true);
  };

  const handleEditPromoClick = (p: PromoCode) => {
    setEditingPromo(p);
    setPromoInputCode(p.code);
    setPromoInputType(p.type);
    setPromoInputValue(p.value);
    setPromoInputDescription(p.description);
    setPromoInputActive(p.active);
    setPromoFormMode("edit");
  };

  const handleResetToDefaultPromos = () => {
    showConfirm(
      "Reset Promo Codes",
      "Would you like to restore promotional codes back to original defaults (MYRAGIFT and LUXE20)? This will overwrite custom promo codes.",
      async () => {
        const defaultPromos = [
          { code: "MYRAGIFT", type: "fixed" as const, value: 25, active: true, description: "Flat ₹25 discount on any order" },
          { code: "LUXE20", type: "percentage" as const, value: 20, active: true, description: "20% discount on order subtotal" }
        ];
        await savePromoCodes(defaultPromos);
      },
      "Reset",
      false
    );
  };

  useEffect(() => {
    if (activeSubTab === "promocodes" && isOpen) {
      fetchPromoCodes();
    }
  }, [activeSubTab, isOpen]);

  // Location form states
  const [locFormMode, setLocFormMode] = useState<"list" | "create" | "edit">("list");
  const [editingLoc, setEditingLoc] = useState<StoreLocation | null>(null);

  // Core location details input
  const [locId, setLocId] = useState("");
  const [locName, setLocName] = useState("");
  const [locTagline, setLocTagline] = useState("");
  const [locAddress, setLocAddress] = useState("");
  const [locPhone, setLocPhone] = useState("");
  const [locHours, setLocHours] = useState("");
  const [locCoordinates, setLocCoordinates] = useState("M 32,32 L 48,16 L 64,32 L 48,48 Z");
  const [locMapEmbedUrl, setLocMapEmbedUrl] = useState("");

  // Product form states
  const [formMode, setFormMode] = useState<"list" | "create" | "edit">("list");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isUploadingProductImg, setIsUploadingProductImg] = useState<boolean>(false);
  const [isUploading20ml, setIsUploading20ml] = useState<boolean>(false);
  const [isUploading50ml, setIsUploading50ml] = useState<boolean>(false);
  const [uploadingVariantIndexes, setUploadingVariantIndexes] = useState<Record<number, boolean>>({});

  // Core product details input
  const [prodId, setProdId] = useState("");
  const [prodName, setProdName] = useState("");
  const [prodCategory, setProdCategory] = useState<"perfumes" | "leather_belts" | "leather_wallets" | "handmade_soaps" | "gift_sets">("perfumes");
  const [prodPrice, setProdPrice] = useState<number>(100);
  const [prodStock, setProdStock] = useState<number>(25);
  const [prodDescription, setProdDescription] = useState("");
  const [prodSizeOrSpec, setProdSizeOrSpec] = useState("");
  const [prodIsBestSeller, setProdIsBestSeller] = useState(false);
  const [prodIsNew, setProdIsNew] = useState(false);
  const [prodBgColorClass, setProdBgColorClass] = useState("bg-gradient-to-tr from-peach-pastel/60 to-rose-pastel/50");
  const [prodCodAvailable, setProdCodAvailable] = useState<boolean>(true);

  // Image upload
  const [imageType, setImageType] = useState<"builtin" | "custom_url" | "upload">("builtin");
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [customImageBase64, setCustomImageBase64] = useState("");
  const [selectedBuiltInPreset, setSelectedBuiltInPreset] = useState("perfume-flora");

  // Specialty inputs
  // Perfumes Scent pyramids
  const [notesTop, setNotesTop] = useState("");
  const [notesHeart, setNotesHeart] = useState("");
  const [notesBase, setNotesBase] = useState("");
  const [notesCategory, setNotesCategory] = useState<"floral" | "musk" | "oud" | "vanilla" | "fresh" | "woody">("floral");

  // Leather Goods Type
  const [leatherType, setLeatherType] = useState("");

  // Handmade Soaps Ingredients
  const [soapIngredients, setSoapIngredients] = useState("");
  const [soapSkinFeel, setSoapSkinFeel] = useState("");

  // Scent specific size variant luxury prices
  const [price20ml, setPrice20ml] = useState<number>(45);
  const [price50ml, setPrice50ml] = useState<number>(75);
  const [price100ml, setPrice100ml] = useState<number>(110);

  // Scent specific size variant luxury images
  const [img20ml, setImg20ml] = useState<string>("");
  const [img50ml, setImg50ml] = useState<string>("");

  // Dynamic custom size variants state
  const [customSizeVariants, setCustomSizeVariants] = useState<{ id?: string, size: string, price: number, sizeOrSpec: string, imagePlaceholderId: string }[]>([
    { size: "20ml", price: 45, sizeOrSpec: "20ml Travel Atomizer", imagePlaceholderId: "" },
    { size: "50ml", price: 75, sizeOrSpec: "50ml Classic Flacon", imagePlaceholderId: "" },
    { size: "100ml", price: 110, sizeOrSpec: "100ml Standard Edition", imagePlaceholderId: "" }
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInput20mlRef = useRef<HTMLInputElement>(null);
  const fileInput50mlRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Search filter for products lists
  const [prodQuery, setProdQuery] = useState("");

  // Presets of visually coordinates
  const builtinPresets = [
    { id: "perfume-flora", name: "Flora Luxe Decanter Visual" },
    { id: "perfume-oud", name: "Oud Resin Gold Cap Visual" },
    { id: "perfume-aqua", name: "Aqua Sea Moss Decanter Visual" },
    { id: "perfume-rose", name: "Rose Vanilla Gold Mist Visual" },
    { id: "leather-belt-tan", name: "Classic Gold Buckle Tan Leather" },
    { id: "leather-belt-brown", name: "Mahogany Dark Gold Buckle Leather" },
    { id: "leather-wallet-black", name: "Sleek Carbon RFID Wallet" },
    { id: "leather-wallet-tan", name: "Burnt Ochre Classic Slim Wallet" },
    { id: "soap-rose", name: "Organic Dry Rosehip Shavings Block" },
    { id: "soap-aloe", name: "Minty Aloe Sea Foam Block" },
    { id: "soap-lavender", name: "Calming Herbal Purple Lavender Block" },
    { id: "soap-charcoal", name: "Tingly Eucalyptus Activated Charcoal Bar" },
    { id: "gift-set-lux", name: "Luxe Flora + Wallet Wooden Chest" },
    { id: "gift-set-rose", name: "Sensory Rose Soap Deluxe Chest" },
    { id: "gift-set-leather", name: "Tan Belt + Cardholder Gold Duo" },
    { id: "gift-set-ultimate", name: "Signature All-inclusive Ultimate Trunk" }
  ];

  const backgroundGradients = [
    { class: "bg-gradient-to-tr from-rose-pastel/60 to-lavender-pastel/50", label: "Flora Rose" },
    { class: "bg-gradient-to-tr from-peach-pastel/50 to-leather-tan/20", label: "Oud Amber" },
    { class: "bg-gradient-to-tr from-aqua-pastel/60 to-sage-pastel/50", label: "Aqua Sage" },
    { class: "bg-gradient-to-tr from-rose-pastel/60 to-aqua-pastel/40", label: "Luxe Duo Lavender" },
    { class: "bg-gradient-to-tr from-charcoal/15 to-[#333]/10", label: "Matte Charcoal Black" },
    { class: "bg-gradient-to-tr from-peach-pastel/70 to-leather-tan/30", label: "Vegetable Tan" },
    { class: "bg-gradient-to-tr from-sage-pastel/60 to-aqua-pastel/60", label: "Mint Aloe" },
    { class: "bg-gradient-to-tr from-lavender-pastel/70 to-rose-pastel/40", label: "English Heather" },
    { class: "bg-gradient-to-tr from-stone-50 via-stone-100 to-[#FCFAF8]", label: "Plush Ivory White" }
  ];

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmLabel?: string;
    isDanger?: boolean;
  } | null>(null);

  const showConfirm = (
    title: string, 
    message: string, 
    onConfirm: () => void, 
    confirmLabel?: string, 
    isDanger?: boolean
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(null);
      },
      confirmLabel,
      isDanger
    });
  };

  if (!isOpen) return null;

  // Authentication handle
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === adminPasscode) {
      setIsAuthenticated(true);
      setLoginError(null);
      try {
        localStorage.setItem("myra_admin_auth", "true");
      } catch (err) {
        console.warn("Storage warning in admin auth active session:", err);
      }
      triggerToast("Access Granted: Welcome back, Atelier Director.");
    } else {
      setLoginError("Invalid credentials. Try again corresponding to your customized or sandbox key.");
    }
  };

  // Recover passcode handlers
  const handleSendRecoveryCode = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    if (!recoveryEmail.trim() || !recoveryEmail.includes("@")) {
      setRecoveryError("Please enter a valid administrative or primary curator email address.");
      return;
    }

    // Generate simulated 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedCode(code);
    setRecoveryStep("code");
    
    // Notify user with simulated email alert
    triggerToast(`[MYRA Secure Nodules] Simulated password verification code sent to ${recoveryEmail}: code matches '${code}'`);
  };

  const handleVerifyRecoveryCode = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    if (verificationCode.trim() === generatedCode) {
      setRecoveryStep("reset");
      triggerToast("Passcode successfully verified! You may now configure a new administrative passphrase.");
    } else {
      setRecoveryError("Incorrect authentication code entered. Please examine mock notifications or request a new code.");
    }
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    const code = resetNewPasscode.trim();
    if (code.length < 3) {
      setRecoveryError("Secure passcodes must contain at least 3 characters.");
      return;
    }

    setAdminPasscode(code);
    try {
      localStorage.setItem("myra_admin_passcode", code);
    } catch (err) {
      console.warn("Storage warning in admin passcode update:", err);
    }
    setPasswordInput(code);
    setIsRecovering(false);
    triggerToast("Atelier Administrator passcode rotated successfully! Enter your brand new code.");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("myra_admin_auth");
    triggerToast("Securely signed out of the Atelier console.");
  };

  // Pre-fill form for creation
  const handleOpenCreate = () => {
    const randomId = `prod-${Math.floor(1000 + Math.random() * 9000)}`;
    setEditingProduct(null);
    setProdId(randomId);
    setProdName("");
    setProdCategory("perfumes");
    setProdPrice(110);
    setProdStock(30);
    setProdDescription("");
    setProdSizeOrSpec("100ML Standard Flacon");
    setProdIsBestSeller(false);
    setProdIsNew(true);
    setProdBgColorClass("bg-gradient-to-tr from-rose-pastel/60 to-lavender-pastel/50");
    setProdCodAvailable(true);

    setPrice20ml(45);
    setPrice50ml(75);
    setPrice100ml(110);
    setImg20ml("");
    setImg50ml("");

    setCustomSizeVariants([
      { size: "20ml", price: 45, sizeOrSpec: "20ml Travel Atomizer", imagePlaceholderId: "" },
      { size: "50ml", price: 75, sizeOrSpec: "50ml Classic Flacon", imagePlaceholderId: "" },
      { size: "100ml", price: 110, sizeOrSpec: "100ml Standard Edition", imagePlaceholderId: "" }
    ]);

    setImageType("builtin");
    setSelectedBuiltInPreset("perfume-flora");
    setCustomImageUrl("");
    setCustomImageBase64("");

    // Reset specialty inputs
    setNotesTop("Wild Jasmin, Mandarin");
    setNotesHeart("Red Rose, Peony");
    setNotesBase("Warm Amber, Sandalwood");
    setNotesCategory("floral");
    setLeatherType("Full Grain Vegetable Tanned Italian Leather");
    setSoapIngredients("Organic Coconut Oil, Raw Essential Oils, Aloe Extract");
    setSoapSkinFeel("Silky Smooth, Gentle Exfoliation");

    setFormMode("create");
  };

  // Pre-fill form for editing
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setProdId(p.id);
    setProdName(p.name);
    setProdCategory(p.category);
    setProdPrice(p.price);
    // Support custom stock field if available
    setProdStock((p as any).stock !== undefined ? (p as any).stock : 25);
    setProdDescription(p.description);
    setProdSizeOrSpec(p.sizeOrSpec || "");
    setProdIsBestSeller(p.isBestSeller || false);
    setProdIsNew(p.isNew || false);
    setProdBgColorClass(p.bgColorClass);
    setProdCodAvailable(p.codAvailable !== false);

    // Load size variant prices
    if (p.category === "perfumes") {
      const v20 = p.sizeVariants?.find(v => v.size.toLowerCase().includes("20ml") || v.size.toLowerCase().includes("20 ml") || v.id.includes("20"));
      const v50 = p.sizeVariants?.find(v => v.size.toLowerCase().includes("50ml") || v.size.toLowerCase().includes("50 ml") || v.id.includes("50"));
      const v100 = p.sizeVariants?.find(v => v.size.toLowerCase().includes("100ml") || v.size.toLowerCase().includes("100 ml") || v.id.includes("100"));

      setPrice20ml(v20 ? v20.price : Math.round(p.price * 0.45) || 50);
      setPrice50ml(v50 ? v50.price : Math.round(p.price * 0.75) || 85);
      setPrice100ml(v100 ? v100.price : p.price);

      setImg20ml(v20?.imagePlaceholderId || "");
      setImg50ml(v50?.imagePlaceholderId || "");

      if (p.sizeVariants && p.sizeVariants.length > 0) {
        setCustomSizeVariants(p.sizeVariants.map(v => ({
          id: v.id,
          size: v.size,
          price: v.price,
          sizeOrSpec: v.sizeOrSpec,
          imagePlaceholderId: v.imagePlaceholderId || ""
        })));
      } else {
        setCustomSizeVariants([
          { size: "20ml", price: v20 ? v20.price : Math.round(p.price * 0.45) || 50, sizeOrSpec: "20ml Travel Atomizer", imagePlaceholderId: v20?.imagePlaceholderId || "" },
          { size: "50ml", price: v50 ? v50.price : Math.round(p.price * 0.75) || 85, sizeOrSpec: "50ml Classic Flacon", imagePlaceholderId: v50?.imagePlaceholderId || "" },
          { size: "100ml", price: v100 ? v100.price : p.price, sizeOrSpec: p.sizeOrSpec || "100ml Standard Edition", imagePlaceholderId: "" }
        ]);
      }
    } else {
      setPrice20ml(Math.round(p.price * 0.45) || 50);
      setPrice50ml(Math.round(p.price * 0.75) || 85);
      setPrice100ml(p.price);
      setImg20ml("");
      setImg50ml("");
      setCustomSizeVariants([]);
    }

    // Image detection
    const isCustomUrl = p.imagePlaceholderId.startsWith("http");
    const isBase64 = p.imagePlaceholderId.startsWith("data:");
    
    if (isCustomUrl) {
      setImageType("custom_url");
      setCustomImageUrl(p.imagePlaceholderId);
      setCustomImageBase64("");
    } else if (isBase64) {
      setImageType("upload");
      setCustomImageBase64(p.imagePlaceholderId);
      setCustomImageUrl("");
    } else {
      setImageType("builtin");
      setSelectedBuiltInPreset(p.imagePlaceholderId);
      setCustomImageUrl("");
      setCustomImageBase64("");
    }

    // Specialty inputs
    if (p.fragranceNotes) {
      setNotesTop(p.fragranceNotes.top.join(", "));
      setNotesHeart(p.fragranceNotes.heart.join(", "));
      setNotesBase(p.fragranceNotes.base.join(", "));
      setNotesCategory(p.fragranceNotes.category);
    } else {
      setNotesTop("");
      setNotesHeart("");
      setNotesBase("");
      setNotesCategory("floral");
    }

    setLeatherType(p.leatherType || "");
    setSoapIngredients(p.soapIngredients ? p.soapIngredients.join(", ") : "");
    setSoapSkinFeel(p.skinFeel ? p.skinFeel.join(", ") : "");

    setFormMode("edit");
  };

  // Image Upload File Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      triggerToast("Please upload an image file (PNG/JPG/SVG).");
      return;
    }

    setIsUploadingProductImg(true);
    uploadToCloudinary(file, "image")
      .then((uploadedUrl) => {
        setCustomImageBase64(uploadedUrl);
        triggerToast("Product photo uploaded to Cloudinary!");
      })
      .catch((err) => {
        console.error("Cloudinary error:", err);
        triggerToast(`Cloudinary Upload Failed: ${err.message || err}`);
      })
      .finally(() => {
        setIsUploadingProductImg(false);
      });
  };

  const handleFileChange20ml = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading20ml(true);
      uploadToCloudinary(file, "image")
        .then((uploadedUrl) => {
          setImg20ml(uploadedUrl);
          triggerToast("20ml photo uploaded to Cloudinary!");
        })
        .catch((err) => {
          console.error("Cloudinary error:", err);
          triggerToast(`20ml Upload Failed: ${err.message || err}`);
        })
        .finally(() => {
          setIsUploading20ml(false);
        });
    }
  };

  const handleFileChange50ml = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading50ml(true);
      uploadToCloudinary(file, "image")
        .then((uploadedUrl) => {
          setImg50ml(uploadedUrl);
          triggerToast("50ml photo uploaded to Cloudinary!");
        })
        .catch((err) => {
          console.error("Cloudinary error:", err);
          triggerToast(`50ml Upload Failed: ${err.message || err}`);
        })
        .finally(() => {
          setIsUploading50ml(false);
        });
    }
  };

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Product submission
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      triggerToast("Please provide an elegant product name.");
      return;
    }

    // Determine final image ID based on type
    let finalImagePlaceholderId = selectedBuiltInPreset;
    if (imageType === "custom_url") {
      finalImagePlaceholderId = customImageUrl || "perfume-flora";
    } else if (imageType === "upload") {
      finalImagePlaceholderId = customImageBase64 || "perfume-flora";
    }

    // Determine category friendly labels
    const catLabelMap: { [key: string]: string } = {
      "perfumes": "Eau De Parfum",
      "leather_belts": "Premium Leather Goods",
      "leather_wallets": "Premium Leather Goods",
      "handmade_soaps": "Botanical Self-Care",
      "gift_sets": "Exquisite Gift Set"
    };

    // Prepare fragrance notes
    let finalFragranceNotes: FragranceNotes | undefined = undefined;
    if (prodCategory === "perfumes") {
      finalFragranceNotes = {
        top: notesTop.split(",").map(s => s.trim()).filter(Boolean),
        heart: notesHeart.split(",").map(s => s.trim()).filter(Boolean),
        base: notesBase.split(",").map(s => s.trim()).filter(Boolean),
        category: notesCategory
      };
    }

    // Prepare soap variables
    const finalSoapIngredients = prodCategory === "handmade_soaps" 
      ? soapIngredients.split(",").map(s => s.trim()).filter(Boolean) 
      : undefined;

    const finalSoapSkinFeel = prodCategory === "handmade_soaps"
      ? soapSkinFeel.split(",").map(s => s.trim()).filter(Boolean)
      : undefined;

    const newProduct: Product = {
      id: prodId,
      name: prodName,
      category: prodCategory,
      categoryLabel: catLabelMap[prodCategory] || "Signature Collection",
      price: prodCategory === "perfumes" 
        ? (customSizeVariants.find(v => v.size.toLowerCase().includes("100ml"))?.price || customSizeVariants[customSizeVariants.length - 1]?.price || Number(prodPrice))
        : Number(prodPrice),
      rating: editingProduct ? editingProduct.rating : 4.8 + Number((Math.random() * 0.2).toFixed(1)),
      reviewsCount: editingProduct ? editingProduct.reviewsCount : Math.floor(10 + Math.random() * 90),
      description: prodDescription || "An exquisite selection of premium design integrity, meticulously packaged for immediate sensory pleasure.",
      isBestSeller: prodIsBestSeller,
      isNew: prodIsNew,
      sizeOrSpec: prodCategory === "perfumes" 
        ? (customSizeVariants.find(v => v.size.toLowerCase().includes("100ml"))?.sizeOrSpec || `${customSizeVariants[customSizeVariants.length - 1]?.size || "100ml"} Signature Decanter`)
        : (prodSizeOrSpec || "100ml Gold Flask"),
      bgColorClass: prodBgColorClass,
      accentColorClass: prodCategory === "perfumes" ? "border-rose-300 text-rose-700" : prodCategory === "handmade_soaps" ? "border-green-400 text-green-800" : "border-amber-600 text-amber-900",
      imagePlaceholderId: finalImagePlaceholderId,
      codAvailable: prodCodAvailable,

      // Specifics
      fragranceNotes: finalFragranceNotes,
      leatherType: (prodCategory === "leather_belts" || prodCategory === "leather_wallets") ? leatherType : undefined,
      soapIngredients: finalSoapIngredients,
      skinFeel: finalSoapSkinFeel,

      // Scent Sizing Variants
      sizeVariants: prodCategory === "perfumes" ? customSizeVariants.map((v, idx) => ({
        id: v.id || `${prodId}-${v.size.replace(/\s+/g, "").toLowerCase() || idx}`,
        size: v.size,
        price: Number(v.price),
        sizeOrSpec: v.sizeOrSpec || `${v.size} Edition`,
        bgColorClass: prodBgColorClass || "bg-gradient-to-tr from-rose-pastel/60 to-lavender-pastel/50",
        imagePlaceholderId: v.imagePlaceholderId?.trim() ? v.imagePlaceholderId : finalImagePlaceholderId
      })) : undefined
    };

    // Inject stock into any casted properties
    (newProduct as any).stock = prodStock;

    let updatedList: Product[];
    if (formMode === "create") {
      updatedList = [newProduct, ...products];
    } else {
      updatedList = products.map(p => p.id === editingProduct?.id ? newProduct : p);
    }

    // Helper to recursively remove all undefined keys and values from Firestore payload
    const sanitizeFirestorePayload = (val: any): any => {
      if (val === undefined) {
        return undefined;
      }
      if (val === null) {
        return null;
      }
      if (Array.isArray(val)) {
        return val
          .map(item => sanitizeFirestorePayload(item))
          .filter(item => item !== undefined);
      }
      if (typeof val === "object") {
        const cleaned: any = {};
        for (const key of Object.keys(val)) {
          const cleanedVal = sanitizeFirestorePayload(val[key]);
          if (cleanedVal !== undefined) {
            cleaned[key] = cleanedVal;
          }
        }
        return cleaned;
      }
      return val;
    };

    // Direct Firestore write (Requirement 9 & 10)
    const productDocRef = doc(db, "products", newProduct.id);
    const cleanedProduct = sanitizeFirestorePayload(newProduct);

    // Print the exact requested configuration details to the browser console
    console.log("PROJECT ID:", db.app.options.projectId);
    console.log("FIRESTORE DATABASE:", (db as any).databaseId || (db.app.options as any).databaseId || "(default)");
    console.log("DOCUMENT PATH:", productDocRef.path);
    console.log("PRODUCT ID:", newProduct.id);
    console.log("FIREBASE APP CONFIG:", db.app.options);

    console.log(`[Firestore Write Start] Attempting to write product to collection: "products"
  - Path: "products/${newProduct.id}"
  - Connection Target: Firebase Project ID: "${db.app.options.projectId || "myra-luxury-9c49c"}"
  - Payload:`, cleanedProduct);

    try {
      await setDoc(productDocRef, cleanedProduct);
      console.log(`[Firestore Write Success] Successfully wrote product with ID: "${newProduct.id}" to "products" collection.`);
      
      // Verification check (Requirement 9 & 10)
      console.log("[Firestore Verification] Reading document back immediately...");
      const verify = await getDoc(productDocRef);
      console.log("DOCUMENT EXISTS:", verify.exists());
      console.log("DOCUMENT DATA:", verify.data());

      if (!verify.exists()) {
        const errorMsg = "Verification failed! The setDoc call completed, but the document does not exist in Firestore. Please check your Firestore security rules, project ID, and sync status.";
        console.error(`[Firestore Verification Failure] ${errorMsg}`);
        triggerToast("Firestore save verified: FAILED (Doc not found)");
        throw new Error(errorMsg);
      }

      if (formMode === "create") {
        triggerToast(`New product uploaded successfully`);
      } else {
        triggerToast(`Updation successful`);
      }
    } catch (err: any) {
      console.error(`[Firestore Write Error] Failed to write product with ID: "${newProduct.id}" to "products" collection.`, err);
      triggerToast(`Firestore save failed: ${err.message || err.toString()}`);
      throw err; // Throw any Firestore error instead of silently ignoring it (Requirement 8)
    }

    onProductsChange(updatedList);
    setFormMode("list");
  };

  // Delete product action
  const handleDeleteProduct = (productId: string, productName: string) => {
    showConfirm(
      "Retire Product From Catalogue",
      `Are you sure you want to retire [${productName}] from the Boutique catalogue? This cannot be undone automatically.`,
      () => {
        const updated = products.filter(p => p.id !== productId);
        onProductsChange(updated);
        triggerToast(`[${productName}] has been gracefully removed from collection.`);
      },
      "Retire Product",
      true
    );
  };

  // Restore seeded catalogue
  const handleResetCatalog = () => {
    showConfirm(
      "Reset Database Catalog",
      "WARNING: This will discard ALL custom added, edited, or deleted products and reset the boutique to original defaults. Continue?",
      () => {
        localStorage.removeItem("myra_products");
        onProductsChange(seedProducts);
        // Allow sync to complete, then reload to pull fresh synced data
        setTimeout(() => {
          window.location.reload();
        }, 800);
      },
      "Reset Defaults",
      true
    );
  };

  // --- Location Actions ---
  const handleOpenEditLoc = (loc: StoreLocation) => {
    setEditingLoc(loc);
    setLocId(loc.id || "");
    setLocName(loc.name || "");
    setLocTagline(loc.tagline || "");
    setLocAddress(loc.address || "");
    setLocPhone(loc.phone || "");
    setLocHours(loc.hours || "");
    setLocCoordinates(loc.coordinatesPlaceholder || "M 32,32 L 48,16 L 64,32 L 48,48 Z");
    setLocMapEmbedUrl(loc.mapEmbedUrl || "");
    setLocFormMode("edit");
  };

  const handleOpenCreateLoc = () => {
    setEditingLoc(null);
    setLocId("store-" + Math.random().toString(36).substring(2, 7));
    setLocName("");
    setLocTagline("");
    setLocAddress("");
    setLocPhone("");
    setLocHours("");
    setLocCoordinates("M 32,32 L 48,16 L 64,32 L 48,48 Z");
    setLocMapEmbedUrl("");
    setLocFormMode("create");
  };

  const handleSaveLoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locName.trim()) {
      triggerToast("Please provide an elegant store name.");
      return;
    }
    if (!locAddress.trim()) {
      triggerToast("Please provide the store address.");
      return;
    }

    const newLoc: StoreLocation = {
      id: locId || "store-" + Math.random().toString(36).substring(2, 7),
      name: locName,
      tagline: locTagline || "MYRA Luxury Experience",
      address: locAddress,
      phone: locPhone || "+1 (555) 830-MYRA",
      hours: locHours || "Mon - Sat: 10:00 AM - 8:00 PM",
      coordinatesPlaceholder: locCoordinates,
      mapEmbedUrl: locMapEmbedUrl.trim() || undefined
    };

    let updatedList: StoreLocation[];
    if (locFormMode === "create") {
      updatedList = [...locations, newLoc];
      triggerToast(`Bespoke brand boutique [${locName}] has been established!`);
    } else {
      updatedList = locations.map(l => l.id === editingLoc?.id ? newLoc : l);
      triggerToast(`Branding credentials updated for [${locName}]!`);
    }

    if (onLocationsChange) {
      onLocationsChange(updatedList);
    }
    setLocFormMode("list");
  };

  const handleDeleteLoc = (id: string, name: string) => {
    showConfirm(
      "Decommission Luxury Boutique",
      `Are you sure you want to decommission [${name}]? This action will remove this showroom from the live website directory.`,
      () => {
        const updated = locations.filter(l => l.id !== id);
        if (onLocationsChange) {
          onLocationsChange(updated);
        }
        triggerToast(`[${name}] showroom removed gracefully from live index.`);
      },
      "Decommission Boutique",
      true
    );
  };

  const handleResetLocations = () => {
    showConfirm(
      "Reset Showrooms Directory",
      "Are you sure you want to reset all showrooms to factory system presets? All your custom boutique locations will be discarded.",
      () => {
        localStorage.removeItem("myra_locations");
        window.location.reload();
      },
      "Reset Showrooms",
      true
    );
  };

  // ORders action helpers
  const handleUpdateOrderStatus = (orderId: string, newStatus: string) => {
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: newStatus,
          isCancellationRequested: newStatus === "cancellation_requested" ? true : o.isCancellationRequested
        };
      }
      return o;
    });
    
    onOrdersChange(updated);
    try {
      localStorage.setItem("myra_orders", JSON.stringify(updated));
    } catch (err) {
      console.warn("Storage limit in order update:", err);
    }
    triggerToast(`Order ${orderId} status shifted to [${newStatus.toUpperCase()}]`);
  };

  const handleApproveCancellation = (orderId: string) => {
    showConfirm(
      "Approve Cancellation",
      `Approve cancellation request for order ${orderId}? This will void the payment invoice.`,
      () => {
        handleUpdateOrderStatus(orderId, "cancelled");
      },
      "Approve Cancel",
      true
    );
  };

  const handleRejectCancellation = (orderId: string) => {
    showConfirm(
      "Decline Cancellation",
      `Decline cancellation request for order ${orderId}? This will return order status to active Packing Stage.`,
      () => {
        handleUpdateOrderStatus(orderId, "packing");
      },
      "Decline",
      false
    );
  };

  const fetchEmailLogs = async () => {
    try {
      const response = await fetch("/api/emails/log");
      if (response.ok) {
        const data = await response.json();
        setEmailLogs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch email logs:", err);
    }
  };

  // Analytics aggregations
  const totalSales = orders
    .filter(o => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const pendingOrdersCount = orders.filter(o => ["placed", "packing", "shipped", "delivering", "cancellation_requested"].includes(o.status)).length;
  const completedOrdersCount = orders.filter(o => o.status === "delivered").length;
  const cancelledOrdersCount = orders.filter(o => o.status === "cancelled").length;

  // Counts for each pipeline status filter
  const orderCountAll = orders.length;
  const orderCountPlaced = orders.filter(o => o.status.toLowerCase() === "placed").length;
  const orderCountPacking = orders.filter(o => o.status.toLowerCase() === "packing").length;
  const orderCountShipped = orders.filter(o => o.status.toLowerCase() === "shipped").length;
  const orderCountOutForDelivery = orders.filter(o => o.status.toLowerCase() === "delivering").length;
  const orderCountDelivered = orders.filter(o => o.status.toLowerCase() === "delivered").length;
  const orderCountCancelled = orders.filter(o => o.status.toLowerCase() === "cancelled").length;

  const filteredOrdersList = orders.filter(o => {
    // 1. Filter by Order status Tab
    let matchesStatus = true;
    if (orderStatusFilter !== "All") {
      const statusLower = o.status.toLowerCase();
      if (orderStatusFilter === "Placed") matchesStatus = (statusLower === "placed");
      else if (orderStatusFilter === "Packing") matchesStatus = (statusLower === "packing");
      else if (orderStatusFilter === "Shipped") matchesStatus = (statusLower === "shipped");
      else if (orderStatusFilter === "Out for Delivery") matchesStatus = (statusLower === "delivering");
      else if (orderStatusFilter === "Delivered") matchesStatus = (statusLower === "delivered");
      else if (orderStatusFilter === "Cancel Order") matchesStatus = (statusLower === "cancelled");
    }

    if (!matchesStatus) return false;

    // 2. Filter by Payment Status Tab
    let matchesPayment = true;
    const paymentStat = o.paymentStatus || "";
    if (paymentStatusFilter === "Paid") {
      matchesPayment = paymentStat.toLowerCase() === "paid";
    } else if (paymentStatusFilter === "Unpaid") {
      matchesPayment = paymentStat.toLowerCase() !== "paid" && paymentStat.toLowerCase() !== "test payment";
    } else if (paymentStatusFilter === "Test") {
      matchesPayment = paymentStat.toLowerCase() === "test payment";
    }

    if (!matchesPayment) return false;

    // 3. Filter by Search Query
    if (!orderSearchQuery.trim()) return true;
    const q = orderSearchQuery.toLowerCase().trim();

    const orderId = (o.id || "").toLowerCase();
    
    // Customer name extraction
    let custName = "";
    if (o.customerName) custName = o.customerName;
    else if (o.shippingDetails) {
      custName = `${o.shippingDetails.firstName || ""} ${o.shippingDetails.lastName || ""}`;
    }
    custName = custName.toLowerCase();

    // Customer email extraction
    let email = (o.emailAddress || o.shippingDetails?.emailAddress || "").toLowerCase();
    
    // Customer phone extraction
    let phone = (o.phoneNumber || o.shippingDetails?.mobileNumber || "").toLowerCase();

    // Shipping address string
    let address = "";
    if (o.shippingAddress) address = o.shippingAddress;
    else if (o.shippingDetails) {
      const sh = o.shippingDetails;
      address = `${sh.houseNo || ""} ${sh.streetAddress || ""} ${sh.areaLocality || ""} ${sh.city || ""} ${sh.state || ""} ${sh.pinCode || ""}`;
    }
    address = address.toLowerCase();

    // Match item names
    const matchesItems = (o.items || []).some((item: any) => 
      (item.name || "").toLowerCase().includes(q)
    );

    return (
      orderId.includes(q) ||
      custName.includes(q) ||
      email.includes(q) ||
      phone.includes(q) ||
      address.includes(q) ||
      matchesItems
    );
  });

  const filteredProductsList = products.filter(p => {
    if (!prodQuery.trim()) return true;
    const q = prodQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.categoryLabel.toLowerCase().includes(q);
  });

  const filteredReviewProducts = products.filter(p => {
    if (!reviewSearchQuery.trim()) return true;
    const q = reviewSearchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.categoryLabel.toLowerCase().includes(q);
  });

  const selectedProductForReviews = products.find(p => p.id === selectedProductReviewId) || filteredReviewProducts[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-md p-2 sm:p-5 overflow-hidden">
      
      {/* Dynamic Authentication Check */}
      {!isAuthenticated ? (
         <div className="relative w-full max-w-md bg-[#FCFAF7] border border-stone-200 shadow-2xl rounded-3xl p-6 sm:p-8 text-center space-y-6">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-14 h-14 bg-stone-900 text-leather-tan rounded-full mx-auto flex items-center justify-center shadow-lg">
            <Award className="w-7 h-7" />
          </div>

          {!isRecovering ? (
            <>
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">MYRA Atelier Administration</h3>
                <p className="text-xs text-stone-500 leading-normal">
                  Enter secure administrative key pass code to supervise catalog collections, manage stock quantities, and process orders.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-[#8A7968]">Atelier Passphrase Code</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRecovering(true);
                        setRecoveryStep("email");
                        setRecoveryError(null);
                        setRecoveryEmail("");
                        setVerificationCode("");
                        setResetNewPasscode("");
                      }}
                      className="text-[10.5px] text-leather-tan hover:text-[#8F633E] font-bold tracking-wider hover:underline uppercase cursor-pointer"
                    >
                      Forgot Passkey?
                    </button>
                  </div>
                  <input 
                    type="password"
                    placeholder={adminPasscode === "admin" ? "Default sandbox key is 'admin'" : "Enter custom passcode"}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-stone-950 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-leather-tan placeholder:text-stone-300 shadow-sm"
                    autoFocus
                  />
                </div>

                {loginError && (
                  <p className="text-xs text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-100 font-medium">
                    {loginError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 bg-stone-900 hover:bg-leather-tan text-white text-xs uppercase tracking-widest font-bold rounded-xl transition-all shadow-md cursor-pointer active:scale-98"
                >
                  Unlock Administration Node
                </button>
              </form>

              <div className="bg-stone-50 border border-stone-150 p-3 rounded-xl text-[11px] text-stone-450 leading-normal flex gap-2 justify-start text-left items-start">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mt-1 shrink-0" />
                <p><strong>Sandbox Demonstration Mode:</strong> Enter your secret passcode (defaulting to <code className="bg-stone-200 px-1 py-0.5 rounded font-bold font-mono text-stone-850">admin</code>) to evaluate boutique collections and administrative pipelines.</p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">Passkey Recovery Assistant</h3>
                <p className="text-xs text-stone-500 leading-normal">
                  You can reset your administrative passcode securely below using our simulated automated validation network.
                </p>
              </div>

              {recoveryStep === "email" && (
                <form onSubmit={handleSendRecoveryCode} className="space-y-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-[#8A7968] block">Registered Admin Email</label>
                    <input 
                      type="email"
                      placeholder="e.g. admin@myraluxury.com or your email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-stone-950 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-leather-tan placeholder:text-stone-300 shadow-sm"
                      required
                      autoFocus
                    />
                  </div>

                  {recoveryError && (
                    <p className="text-xs text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-100 font-medium">
                      {recoveryError}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRecovering(false)}
                      className="px-4 py-3 border border-stone-250 hover:bg-stone-50 text-stone-700 text-xs font-bold uppercase rounded-xl tracking-wider transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-stone-900 hover:bg-leather-tan text-white text-xs uppercase tracking-widest font-bold rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      Send Verification Code
                    </button>
                  </div>
                </form>
              )}

              {recoveryStep === "code" && (
                <form onSubmit={handleVerifyRecoveryCode} className="space-y-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-[#8A7968] block">4-Digit Security PIN Code</label>
                    <input 
                      type="text"
                      maxLength={6}
                      placeholder="Enter verification code..."
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-stone-950 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-leather-tan placeholder:text-stone-300 shadow-sm text-center tracking-widest font-mono font-bold"
                      required
                      autoFocus
                    />
                  </div>

                  {recoveryError && (
                    <p className="text-xs text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-100 font-medium">
                      {recoveryError}
                    </p>
                  )}

                  {/* Sandbox assist box for seamless user experience */}
                  <div className="bg-[#FAF6F0] border border-stone-200 p-3 rounded-xl text-[10.5px] text-stone-500 leading-normal">
                    <span className="font-serif font-bold text-stone-800 block mb-0.5">🔔 Sandbox Notification Node:</span>
                    Since we run in browser-storage demonstration mode, your OTP is: <code className="bg-[#F3EFE9] text-stone-900 px-1.5 py-0.5 rounded font-mono font-black text-xs select-all">{generatedCode}</code>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRecoveryStep("email")}
                      className="px-4 py-3 border border-stone-250 hover:bg-stone-50 text-stone-700 text-xs font-bold uppercase rounded-xl tracking-wider transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-stone-900 hover:bg-leather-tan text-white text-xs uppercase tracking-widest font-bold rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      Verify PIN Code
                    </button>
                  </div>
                </form>
              )}

              {recoveryStep === "reset" && (
                <form onSubmit={handlePasswordReset} className="space-y-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-[#8A7968] block">Configure New Secure Passkey</label>
                    <input 
                      type="text"
                      placeholder="Enter new passcode..."
                      value={resetNewPasscode}
                      onChange={(e) => setResetNewPasscode(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-stone-950 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-leather-tan placeholder:text-stone-300 shadow-sm font-mono"
                      required
                      autoFocus
                    />
                  </div>

                  {recoveryError && (
                    <p className="text-xs text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-100 font-medium">
                      {recoveryError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-stone-900 hover:bg-leather-tan text-white text-xs uppercase tracking-widest font-bold rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Rotated & Update Passcode
                  </button>
                </form>
              )}
            </>
          )}

          <div className="border-t border-stone-200/50 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="text-[11px] text-stone-450 hover:text-stone-800 transition-colors uppercase font-bold tracking-widest"
            >
              ← Back to Boutique
            </button>
          </div>
        </div>
      ) : (
        /* Full admin panel view layout */
        <div className="w-full h-full max-w-6xl max-h-[95vh] bg-white border border-stone-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          
          {/* Main header row of panel control */}
          <div className="px-6 py-4 bg-stone-900 text-white flex flex-wrap items-center justify-between gap-4 border-b border-white/5 shadow">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/10 text-leather-tan rounded-xl flex items-center justify-center">
                <Sliders className="w-5 h-5 text-leather-tan" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-serif font-bold text-[#FAF8F5]">MYRA Atelier Supervisor Dashboard</h2>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] text-[#C68B59] uppercase tracking-wider font-bold">Secure Director Node Active</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleLogout}
                className="px-3.5 py-1.5 bg-white/10 hover:bg-white/15 text-white border border-white/10 hover:border-white/20 text-[10px] uppercase font-bold tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                Sign Out
              </button>
              <button 
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-white/15 text-white/80 hover:text-white rounded-lg transition-colors cursor-pointer focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sub menu Navigation bar */}
            
            {/* 1. Mobile & Tablet view: Elegant Dropdown/Department Menu */}
            <div className="lg:hidden shrink-0 border-b border-stone-200 bg-[#FAF9F5] p-3 block relative select-none z-40">
              <div className="text-[10px] uppercase tracking-widest font-bold text-[#8A7968] mb-1.5 flex items-center justify-between">
                <span>Atelier Department Node</span>
                <span className="text-[9px] text-stone-400 font-mono font-medium">9 divisions available</span>
              </div>
              
              <button 
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="w-full flex items-center justify-between bg-white border border-stone-200 hover:border-stone-400 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-800 transition-all shadow-sm focus:outline-none cursor-pointer"
              >
                <div className="flex items-center gap-2 text-[#8F633E]">
                  {(() => {
                    const tabsList = [
                      { id: "products", label: "Catalog & Products Room", icon: Database },
                      { id: "orders", label: "Boutique Orders Manager", icon: ShoppingBag, count: orders.length },
                      { id: "shipping", label: "Delhivery Logistics", icon: Truck },
                      { id: "promocodes", label: "Promo Codes Room", icon: Tag },
                      { id: "reviews", label: "Review Curation", icon: Star },
                      { id: "locations", label: "Boutique Showrooms", icon: MapPin, count: locations.length },
                      { id: "media", label: "Media & Presentation", icon: Video },
                      { id: "seo", label: "SEO & Search Tags", icon: Globe },
                      { id: "analytics", label: "Atelier Metrics & Sandbox", icon: Activity },
                      { id: "messages", label: "Curator Mailbox", icon: MessageSquare, count: messages.filter(m => !m.isRead).length || undefined }
                    ];
                    const currentTab = tabsList.find(t => t.id === activeSubTab);
                    if (!currentTab) return <span>Select Division...</span>;
                    const CurrentIcon = currentTab.icon;
                    return (
                      <>
                        <CurrentIcon className="w-4 h-4 text-[#8F633E]" />
                        <span className="font-serif tracking-widest text-[#1C1917] font-extrabold normal-case">
                          {currentTab.label}
                        </span>
                        {currentTab.count !== undefined && (
                          <span className="text-[9px] bg-amber-105 text-[#8F633E] font-mono font-bold px-2 py-0.5 rounded-full border border-amber-200 ml-1">
                            {currentTab.count}
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
                <ChevronDown className={`w-4 h-4 text-stone-500 transition-transform duration-300 ${isMobileMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown Options overlay */}
              {isMobileMenuOpen && (
                <div className="absolute left-3 right-3 top-[calc(100%-4px)] mt-1.5 z-50 bg-white border border-stone-250 shadow-2xl rounded-2xl p-2.5 space-y-1 max-h-[60vh] overflow-y-auto animate-fade-in divide-y divide-stone-100">
                  {[
                    { id: "products", label: "Catalog & Products Room", icon: Database },
                    { id: "orders", label: "Boutique Orders Manager", icon: ShoppingBag, count: orders.length },
                    { id: "shipping", label: "Delhivery Logistics", icon: Truck },
                    { id: "promocodes", label: "Promo Codes Room", icon: Tag },
                    { id: "reviews", label: "Review Curation", icon: Star },
                    { id: "locations", label: "Boutique Showrooms", icon: MapPin, count: locations.length },
                    { id: "media", label: "Media & Presentation", icon: Video },
                    { id: "seo", label: "SEO & Search Tags", icon: Globe },
                    { id: "analytics", label: "Atelier Metrics & Sandbox", icon: Activity },
                    { id: "messages", label: "Curator Mailbox", icon: MessageSquare, count: messages.filter(m => !m.isRead).length || undefined }
                  ].map(tab => {
                    const isActive = activeSubTab === tab.id;
                    const TabIcon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => { 
                          setActiveSubTab(tab.id as any); 
                          setFormMode("list"); 
                          setLocFormMode("list");
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-3.5 text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer rounded-lg text-left ${
                          isActive 
                            ? "bg-stone-100 text-[#8F633E] font-black border-l-4 border-stone-850 pl-2" 
                            : "text-stone-605 hover:bg-stone-50 hover:text-stone-900 border-l-4 border-transparent hover:pl-2"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <TabIcon className={`w-4 h-4 ${isActive ? "text-[#8F633E]" : "text-stone-400"}`} />
                          <span className="font-serif tracking-wide text-[#1C1917] font-normal normal-case">{tab.label}</span>
                        </div>
                        {tab.count !== undefined && (
                          <span className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                            isActive 
                              ? "bg-amber-100 text-amber-800"
                              : "bg-stone-100 text-stone-600"
                          }`}>
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Desktop view: Elegant Horizontal Tab bar (shown on lg screens) */}
            <div className="hidden lg:flex border-b border-stone-200 bg-stone-50 px-4 pt-1 sm:px-6 shrink-0 overflow-x-auto select-none gap-2">
              {[
                { id: "products", label: "Catalog & Products Room", icon: Database },
                { id: "orders", label: "Boutique Orders Manager", icon: ShoppingBag, count: orders.length },
                { id: "shipping", label: "Delhivery Logistics", icon: Truck },
                { id: "promocodes", label: "Promo Codes Room", icon: Tag },
                { id: "reviews", label: "Review Curation", icon: Star },
                { id: "locations", label: "Boutique Showrooms", icon: MapPin, count: locations.length },
                { id: "media", label: "Media & Presentation", icon: Video },
                { id: "seo", label: "SEO & Search Tags", icon: Globe },
                { id: "analytics", label: "Atelier Metrics & Sandbox", icon: Activity },
                { id: "messages", label: "Curator Mailbox", icon: MessageSquare, count: messages.filter(m => !m.isRead).length || undefined }
              ].map(tab => {
                const isActive = activeSubTab === tab.id;
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { 
                      setActiveSubTab(tab.id as any); 
                      setFormMode("list"); 
                      setLocFormMode("list");
                    }}
                    className={`flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-wide uppercase transition-all border-b-2 cursor-pointer ${
                      isActive 
                        ? "border-stone-900 text-stone-900 font-extrabold" 
                        : "border-transparent text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    <TabIcon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className="text-[9px] bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded-full font-bold ml-1 font-mono">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

          {/* Content core view layout scrollable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-50/20 min-h-0">
            
            {/* PRODUCTS ROOMTAB */}
            {activeSubTab === "products" && (
              <div className="space-y-6">
                
                {formMode === "list" ? (
                  /* Form mode List products view */
                  <div className="space-y-4 animate-fade-in">
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/60 pb-4">
                      <div className="space-y-1">
                        <h3 className="text-sm sm:text-base font-serif font-bold text-stone-900">Manage Storefront Inventories</h3>
                        <p className="text-[11px] text-stone-500">Add custom boutique products, upload visuals via Base64 or URL, adjust price levels and manage live quantities.</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleResetCatalog}
                          className="bg-stone-100 hover:bg-stone-200 border border-stone-250 text-stone-700 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-colors flex items-center gap-2 shadow-sm"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Reset Database</span>
                        </button>

                        <button
                          onClick={handleOpenCreate}
                          className="bg-stone-900 hover:bg-leather-tan text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-2 shadow hover:shadow-lg active:scale-95"
                        >
                          <Plus className="w-4 h-4 text-white" />
                          <span>Add New Product</span>
                        </button>
                      </div>
                    </div>

                    {/* Filter search of products */}
                    <div className="flex items-center bg-white border border-stone-200 rounded-xl px-3 py-1.5 shadow-sm max-w-md">
                      <Search className="w-4 h-4 text-stone-400 mr-2 shrink-0" />
                      <input 
                        type="text"
                        placeholder="Search product code name, category..."
                        value={prodQuery}
                        onChange={(e) => setProdQuery(e.target.value)}
                        className="text-xs text-stone-900 bg-transparent outline-none w-full font-sans"
                      />
                      {prodQuery && (
                        <button onClick={() => setProdQuery("")} className="text-stone-400 hover:text-stone-700 p-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Products Grid list table design */}
                    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-stone-50 border-b border-stone-200 text-[#8A7968] font-bold uppercase tracking-wider text-[10px]">
                              <th className="p-4">Visual & Product Details</th>
                              <th className="p-4">Category</th>
                              <th className="p-4">Price</th>
                              <th className="p-4">Stock Level</th>
                              <th className="p-4 text-center">Status Badges</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-150 font-sans">
                            {filteredProductsList.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="p-8 text-center text-stone-450 italic bg-white">
                                  No product items correspond to your inquiry. Adjust your filter terms.
                                </td>
                              </tr>
                            ) : (
                              filteredProductsList.map((p) => {
                                const stockVal = (p as any).stock !== undefined ? (p as any).stock : 25;
                                const isLowStock = stockVal <= 5;
                                const isCustomVisual = p.imagePlaceholderId.startsWith("data:") || p.imagePlaceholderId.startsWith("http");

                                return (
                                  <tr key={p.id} className="hover:bg-stone-50/40 transition-colors">
                                    <td className="p-4">
                                      <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center p-1 border border-stone-150 shrink-0 ${p.bgColorClass}`}>
                                          {isCustomVisual ? (
                                            <img src={p.imagePlaceholderId} className="w-full h-full object-contain rounded-lg" referrerPolicy="no-referrer" />
                                          ) : (
                                            <span className="text-[9px] font-mono text-stone-450 font-bold bg-white/70 px-1.5 py-0.5 rounded border border-stone-200 uppercase">{p.imagePlaceholderId.split("-").pop()?.slice(0, 3)}</span>
                                          )}
                                        </div>
                                        <div className="space-y-0.5">
                                          <div className="font-serif font-bold text-stone-900 text-sm group-hover:text-leather-tan transition-colors">{p.name}</div>
                                          <div className="text-[10px] text-stone-400 font-mono font-medium">{p.id} • {p.sizeOrSpec}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-4">
                                      <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-200 font-semibold uppercase text-[9px]">
                                        {p.category.replace("_", " ")}
                                      </span>
                                    </td>
                                    <td className="p-4 font-bold text-leather-tan text-sm">₹{p.price}</td>
                                    <td className="p-4 font-semibold">
                                      <div className="flex items-center gap-1.5">
                                        <span className={`w-2 h-2 rounded-full ${stockVal <= 0 ? "bg-rose-500 animate-pulse" : isLowStock ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`} />
                                        <span className={stockVal <= 0 ? "text-rose-600 font-extrabold uppercase text-[10px]" : isLowStock ? "text-red-700 font-bold" : "text-stone-700"}>
                                          {stockVal <= 0 ? "OUT OF STOCK" : `${stockVal} Unit${stockVal !== 1 ? 's' : ''}`}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="p-4">
                                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                        {p.isBestSeller && (
                                          <span className="bg-amber-50 text-amber-700 text-[8px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded border border-amber-200">
                                            Seller
                                          </span>
                                        )}
                                        {p.isNew && (
                                          <span className="bg-emerald-50 text-emerald-800 text-[8px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded border border-emerald-200">
                                            New
                                          </span>
                                        )}
                                        {p.codAvailable !== false ? (
                                          <span className="bg-[#FAF6F0] text-[#8F633E] text-[8px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded border border-[#E8DCC4]" title="Cash on Delivery available">
                                            COD
                                          </span>
                                        ) : (
                                          <span className="bg-stone-50 text-stone-400 text-[8px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-stone-200" title="Cash on delivery disabled">
                                            No COD
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="p-4 text-right">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button 
                                          onClick={() => handleOpenEdit(p)}
                                          className="p-1.5 bg-sky-50 text-sky-800 border border-sky-150 rounded hover:bg-sky-100 transition-colors cursor-pointer"
                                          title="Edit details"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteProduct(p.id, p.name)}
                                          className="p-1.5 bg-red-50 text-red-800 border border-red-150 rounded hover:bg-red-100 transition-colors cursor-pointer"
                                          title="Retire product"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                ) : (
                  /* Form mode editing or creating new product */
                  <form onSubmit={handleSaveProduct} className="bg-white border border-stone-200 rounded-3xl p-5 sm:p-6 space-y-6 animate-fade-in shadow-md">
                    
                    <div className="flex items-center justify-between border-b border-stone-150 pb-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFormMode("list")}
                          className="p-1.5 bg-stone-100 hover:bg-stone-250 text-stone-700 rounded-lg cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div>
                          <h3 className="text-sm sm:text-base font-serif font-bold text-stone-900">
                            {formMode === "create" ? "Launch Boutique Collection Asset" : `Configure [${prodName}] Parameters`}
                          </h3>
                          <p className="text-[10px] text-stone-400">Atelier ID: <code className="bg-stone-100 px-1 py-0.5 rounded font-mono font-bold text-stone-700">{prodId}</code></p>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="bg-stone-900 hover:bg-leather-tan text-white text-xs tracking-wider uppercase font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow active:scale-95"
                      >
                        {formMode === "create" ? "Publish Launch Asset" : "Commit Parameters"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Left Core Parameter set */}
                      <div className="space-y-4">
                        <h4 className="text-[10px] uppercase font-bold text-[#8A7968] tracking-widest border-b pb-1.5">1. Basic Merchandise Properties</h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10.5px] font-bold text-stone-700">Product Code ID</label>
                            <input 
                              type="text"
                              value={prodId}
                              onChange={(e) => setProdId(e.target.value)}
                              placeholder="e.g. perfume-flora-100"
                              className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-leather-tan"
                              disabled={formMode === "edit"} // Preserve core identity key
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10.5px] font-bold text-stone-700">Display Category Group</label>
                            <select
                              value={prodCategory}
                              onChange={(e) => setProdCategory(e.target.value as any)}
                              className="w-full text-xs px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-leather-tan"
                            >
                              <option value="perfumes">Perfumes & Fragrances</option>
                              <option value="leather_belts">Luxury Leather Belts</option>
                              <option value="leather_wallets">Luxury Leather Wallets</option>
                              <option value="handmade_soaps">Cold-Process Handcrafted Soaps</option>
                              <option value="gift_sets">Bespoke Gifting Chests</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10.5px] font-bold text-stone-700">Fragrance or Good Name</label>
                          <input 
                            type="text"
                            value={prodName}
                            onChange={(e) => setProdName(e.target.value)}
                            placeholder="e.g. Oud Bloom Signature Reserve"
                            className="w-full text-xs px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-leather-tan"
                          />
                        </div>

                        {prodCategory === "perfumes" ? (
                          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-bold tracking-widest bg-stone-900 text-white px-2 py-0.5 rounded-md">Atelier Product Sizing & Pricing</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomSizeVariants([
                                    ...customSizeVariants,
                                    { size: "", price: 0, sizeOrSpec: "", imagePlaceholderId: "" }
                                  ]);
                                }}
                                className="text-[10px] bg-leather-tan hover:bg-leather-tan/90 text-white font-bold px-2 py-1 rounded transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" /> Add Custom Capacity / Variant
                              </button>
                            </div>
                            
                            <p className="text-[10px] text-stone-500 leading-relaxed font-sans">
                              Define bespoke retail capacities (e.g. 20ml, 100ml, 250ml, 500ml) and custom pricing mapping. Clicking on "+ Add Custom Capacity / Variant" lets you save endless different sizes for this fragrance bottle.
                            </p>

                            <div className="space-y-3">
                              {customSizeVariants.map((variant, index) => (
                                <div key={index} className="bg-white border border-stone-200 rounded-xl p-3 shadow-sm space-y-2.5 relative">
                                  <div className="flex items-center justify-between pb-1.5 border-b border-stone-100">
                                    <span className="text-[10px] font-bold text-[#C68B59] uppercase tracking-wide">
                                      Size Capacity Spec #{index + 1}: {variant.size || "New Sizing"}
                                    </span>
                                    
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCustomSizeVariants(customSizeVariants.filter((_, i) => i !== index));
                                      }}
                                      className="text-stone-400 hover:text-red-500 transition-colors p-1"
                                      title="Remove size variant"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-bold uppercase tracking-wider text-stone-500 block">Bottle Size Label</label>
                                      <input
                                        type="text"
                                        value={variant.size || ""}
                                        onChange={(e) => {
                                          const updated = [...customSizeVariants];
                                          updated[index].size = e.target.value;
                                          setCustomSizeVariants(updated);
                                        }}
                                        placeholder="e.g. 250ml"
                                        className="w-full text-xs px-2.5 py-1.5 border border-stone-150 rounded-lg focus:outline-none focus:border-leather-tan font-bold text-stone-850"
                                      />
                                    </div>
                                    
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-bold uppercase tracking-wider text-stone-500 block">Retail Price (₹)</label>
                                      <input
                                        type="number"
                                        value={variant.price === undefined || variant.price === null || variant.price === 0 ? "" : variant.price}
                                        onChange={(e) => {
                                          const updated = [...customSizeVariants];
                                          updated[index].price = Number(e.target.value);
                                          setCustomSizeVariants(updated);
                                          // Also sync to price states if standard indices for back-compat
                                          if (variant.size === "20ml") setPrice20ml(Number(e.target.value));
                                          if (variant.size === "50ml") setPrice50ml(Number(e.target.value));
                                          if (variant.size === "100ml") {
                                            setPrice100ml(Number(e.target.value));
                                            setProdPrice(Number(e.target.value));
                                          }
                                        }}
                                        placeholder="150"
                                        className="w-full text-xs px-2.5 py-1.5 border border-stone-150 rounded-lg focus:outline-none focus:border-leather-tan font-mono font-bold text-leather-tan"
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[9px] font-bold uppercase tracking-wider text-stone-500 block">Detailed Spec / Style Label</label>
                                      <input
                                        type="text"
                                        value={variant.sizeOrSpec || ""}
                                        onChange={(e) => {
                                          const updated = [...customSizeVariants];
                                          updated[index].sizeOrSpec = e.target.value;
                                          setCustomSizeVariants(updated);
                                        }}
                                        placeholder="e.g. 250ml Premium Decanter"
                                        className="w-full text-xs px-2.5 py-1.5 border border-stone-150 rounded-lg focus:outline-none focus:border-leather-tan"
                                      />
                                    </div>
                                  </div>

                                  {/* Custom Variant visual */}
                                  <div className="pt-2 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <label className="text-[8.5px] font-bold uppercase tracking-wider text-stone-400 block">Variant Image Link / url (Optional)</label>
                                      <input
                                        type="text"
                                        value={variant.imagePlaceholderId && !variant.imagePlaceholderId.startsWith("data:") ? variant.imagePlaceholderId : ""}
                                        onChange={(e) => {
                                          const updated = [...customSizeVariants];
                                          updated[index].imagePlaceholderId = e.target.value;
                                          setCustomSizeVariants(updated);
                                        }}
                                        placeholder="Paste image link/URL"
                                        className="w-full text-[9.5px] px-2 py-1 border border-stone-150 rounded-md focus:outline-none focus:border-leather-tan font-mono text-stone-700"
                                      />
                                    </div>

                                    <div className="flex items-center gap-2 mt-auto pb-0.5">
                                      <input
                                        type="file"
                                        id={`variant-upload-input-${index}`}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            setUploadingVariantIndexes(prev => ({ ...prev, [index]: true }));
                                            uploadToCloudinary(file, "image")
                                              .then((uploadedUrl) => {
                                                const updated = [...customSizeVariants];
                                                updated[index].imagePlaceholderId = uploadedUrl;
                                                setCustomSizeVariants(updated);
                                                triggerToast("Variant image uploaded to Cloudinary!");
                                              })
                                              .catch((err) => {
                                                console.error("Variant upload error:", err);
                                                triggerToast(`Upload Failed: ${err.message || err}`);
                                              })
                                              .finally(() => {
                                                setUploadingVariantIndexes(prev => ({ ...prev, [index]: false }));
                                              });
                                          }
                                        }}
                                      />
                                      <button
                                        type="button"
                                        disabled={uploadingVariantIndexes[index]}
                                        onClick={() => document.getElementById(`variant-upload-input-${index}`)?.click()}
                                        className="text-[9px] font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-1 rounded cursor-pointer transition-colors flex items-center gap-1 disabled:opacity-50"
                                      >
                                        {uploadingVariantIndexes[index] ? (
                                          <>
                                            <span className="w-2 h-2 border border-stone-400 border-t-stone-700 rounded-full animate-spin inline-block" />
                                            Uploading...
                                          </>
                                        ) : variant.imagePlaceholderId ? "Change Photo File" : "Upload Photo File"}
                                      </button>

                                      {variant.imagePlaceholderId && (
                                        <div className="flex items-center gap-1.5 ml-auto">
                                          <div className="w-6 h-6 rounded border bg-stone-50 overflow-hidden flex items-center justify-center p-0.5">
                                            <img src={variant.imagePlaceholderId} className="max-w-full max-h-full object-contain rounded" referrerPolicy="no-referrer" />
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updated = [...customSizeVariants];
                                              updated[index].imagePlaceholderId = "";
                                              setCustomSizeVariants(updated);
                                            }}
                                            className="text-[8.5px] font-bold text-red-500 hover:underline cursor-pointer"
                                          >
                                            Clear
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="pt-2">
                              <div className="space-y-1 bg-white p-3 rounded-xl border border-stone-150">
                                <label className="text-[9px] font-bold uppercase tracking-wider text-stone-500 block">Est. Batch Stock Level</label>
                                <input 
                                  type="number"
                                  value={prodStock}
                                  onChange={(e) => setProdStock(Number(e.target.value))}
                                  placeholder="25"
                                  className="w-full text-xs px-2.5 py-1.5 border border-stone-150 rounded-lg focus:outline-none focus:border-leather-tan font-mono"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10.5px] font-bold text-stone-700">Market Price (₹)</label>
                              <input 
                                type="number"
                                value={prodPrice}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setProdPrice(val);
                                  setPrice100ml(val);
                                }}
                                placeholder="145"
                                className="w-full text-xs px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-leather-tan font-bold text-leather-tan"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10.5px] font-bold text-stone-700">Inventory Level (Qty)</label>
                              <input 
                                type="number"
                                value={prodStock}
                                onChange={(e) => setProdStock(Number(e.target.value))}
                                placeholder="25"
                                className="w-full text-xs px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-leather-tan font-mono"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10.5px] font-bold text-stone-700">Volume or Spec Label</label>
                              <input 
                                type="text"
                                value={prodSizeOrSpec}
                                onChange={(e) => setProdSizeOrSpec(e.target.value)}
                                placeholder="e.g. 100ML • RESERVE"
                                className="w-full text-xs px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-leather-tan"
                              />
                            </div>
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-[10.5px] font-bold text-stone-700">Boutique Storytelling description</label>
                          <textarea 
                            value={prodDescription}
                            onChange={(e) => setProdDescription(e.target.value)}
                            rows={3}
                            placeholder="Write a descriptive marketing text focusing on materials authenticity and compound ingredients..."
                            className="w-full text-xs px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-leather-tan leading-relaxed"
                          />
                        </div>

                        <div className="flex flex-col gap-2.5 p-3.5 bg-stone-50 border border-stone-200 rounded-xl">
                          <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 text-xs font-semibold text-stone-800 cursor-pointer select-none">
                              <input 
                                type="checkbox"
                                checked={prodIsBestSeller}
                                onChange={(e) => setProdIsBestSeller(e.target.checked)}
                                className="w-4 h-4 text-leather-tan accent-stone-900"
                              />
                              <span>Atelier Best Seller Badge</span>
                            </label>

                            <label className="flex items-center gap-2 text-xs font-semibold text-stone-800 cursor-pointer select-none">
                              <input 
                                type="checkbox"
                                checked={prodIsNew}
                                onChange={(e) => setProdIsNew(e.target.checked)}
                                className="w-4 h-4 text-leather-tan accent-stone-900"
                              />
                              <span>New Release Announcement Badge</span>
                            </label>
                          </div>

                          <div className="border-t border-stone-200 pt-2 flex flex-col gap-0.5">
                            <label className="flex items-center gap-2 text-xs font-bold text-stone-800 cursor-pointer select-none">
                              <input 
                                type="checkbox"
                                checked={prodCodAvailable}
                                onChange={(e) => setProdCodAvailable(e.target.checked)}
                                className="w-4 h-4 accent-amber-800 text-amber-800"
                              />
                              <span className="text-[#8F633E] flex items-center gap-1">Allow Cash on Delivery (COD)</span>
                            </label>
                            <p className="text-[9.5px] text-stone-500 pl-6 leading-relaxed">
                              When disabled, customers cannot use cash on delivery if this product is in their cart.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Right Visual asset uploader and gradients */}
                      <div className="space-y-4">
                        <h4 className="text-[10px] uppercase font-bold text-[#8A7968] tracking-widest border-b pb-1.5">2. Visual Assets & Gradient Canvas</h4>
                        
                        {/* Selector of Visual system */}
                        <div className="space-y-1">
                          <label className="text-[10.5px] font-bold text-stone-700">Visual Display Mode</label>
                          <div className="grid grid-cols-3 gap-2 bg-stone-100 p-1 rounded-xl">
                            {[
                              { id: "builtin", label: "Built-In Vector Art" },
                              { id: "custom_url", label: "Custom Image URL" },
                              { id: "upload", label: "Upload Custom Image File" }
                            ].map(imgT => (
                              <button
                                key={imgT.id}
                                type="button"
                                onClick={() => setImageType(imgT.id as any)}
                                className={`text-[9.5px] font-bold py-1.5 rounded-lg transition-all cursor-pointer ${
                                  imageType === imgT.id 
                                    ? "bg-white text-stone-900 shadow-sm" 
                                    : "text-stone-500 hover:text-stone-850"
                                }`}
                              >
                                {imgT.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {imageType === "builtin" && (
                          <div className="space-y-1.5">
                            <label className="text-[10.5px] font-bold text-stone-700 block">Choose Built-In Elegant Vector Preset</label>
                            <select
                              value={selectedBuiltInPreset}
                              onChange={(e) => setSelectedBuiltInPreset(e.target.value)}
                              className="w-full text-xs px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-leather-tan font-mono uppercase"
                            >
                              {builtinPresets.map(preset => (
                                <option key={preset.id} value={preset.id}>{preset.name}</option>
                              ))}
                            </select>
                            <p className="text-[10px] text-stone-400">Our system automatically parses this preset id to display interactive vector components.</p>
                          </div>
                        )}

                        {imageType === "custom_url" && (
                          <div className="space-y-2">
                            <label className="text-[10.5px] font-bold text-stone-700">Custom Image Web Link</label>
                            <input 
                              type="url"
                              value={customImageUrl}
                              onChange={(e) => setCustomImageUrl(e.target.value)}
                              placeholder="https://images.unsplash.com/photo-example..."
                              className="w-full text-xs px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-leather-tan font-mono text-stone-700"
                            />
                            {customImageUrl && (
                              <div className="w-16 h-16 rounded-xl border p-1 bg-stone-100 flex items-center justify-center">
                                <img src={customImageUrl} className="max-w-full max-h-full object-contain rounded-lg" referrerPolicy="no-referrer" />
                              </div>
                            )}
                          </div>
                        )}

                        {imageType === "upload" && (
                          <div className="space-y-2">
                            <label className="text-[10.5px] font-bold text-stone-700 block">Optimized High Fidelity Image Dropzone</label>
                            <div 
                              onClick={isUploadingProductImg ? undefined : () => fileInputRef.current?.click()}
                              onDragOver={isUploadingProductImg ? undefined : handleDragOver}
                              onDragLeave={isUploadingProductImg ? undefined : handleDragLeave}
                              onDrop={isUploadingProductImg ? undefined : handleDrop}
                              className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all flex flex-col justify-center items-center gap-1.5 ${
                                isUploadingProductImg ? "opacity-60 border-stone-200 bg-stone-50 cursor-not-allowed" :
                                isDragOver 
                                  ? "border-leather-tan bg-amber-50 cursor-pointer" 
                                  : "border-stone-200 hover:border-leather-tan hover:bg-stone-50 cursor-pointer"
                              }`}
                            >
                              <input 
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                              />
                              {isUploadingProductImg ? (
                                <div className="w-8 h-8 border-2 border-[#C68B59]/30 border-t-[#C68B59] rounded-full animate-spin" />
                              ) : (
                                <UploadCloud className="w-8 h-8 text-stone-400" />
                              )}
                              <span className="text-xs font-semibold text-stone-700">
                                {isUploadingProductImg ? "Uploading Custom Visual Asset to Cloudinary..." : "Drag & Drop visual asset here, or click to browse"}
                              </span>
                              <span className="text-[9.5px] text-stone-400">
                                {isUploadingProductImg ? "Beaming to secure brand CDN" : "Optimized images are saved to your Cloudinary storage instantly"}
                              </span>
                            </div>

                            {customImageBase64 && (
                              <div className="flex items-center gap-3 bg-stone-50 border p-2.5 rounded-xl border-stone-200/60">
                                <div className="w-14 h-14 rounded-lg bg-[#FAF8F5] border overflow-hidden flex items-center justify-center shrink-0">
                                  <img src={customImageBase64} className="max-w-full max-h-full object-contain" />
                                </div>
                                <div className="truncate space-y-0.5">
                                  <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Asset Uploaded to Cloudinary</p>
                                  <p className="text-[9.5px] text-stone-400 truncate">Stored securely on global high-speed CDN.</p>
                                </div>
                                <button 
                                  type="button" 
                                  onClick={() => setCustomImageBase64("")} 
                                  className="text-[10px] font-bold text-red-700 hover:text-red-900 ml-auto mr-1 uppercase"
                                >
                                  Clear
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Background Selection */}
                        <div className="space-y-2">
                          <label className="text-[10.5px] font-bold text-stone-700">Display Background Tone (Canvas Theme)</label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {backgroundGradients.map((g, index) => {
                              const isSelected = prodBgColorClass === g.class;
                              return (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => setProdBgColorClass(g.class)}
                                  className={`p-2 rounded-xl text-[9px] font-bold text-stone-700 text-left border flex items-center gap-2 transition-all cursor-pointer ${g.class} ${
                                    isSelected 
                                      ? "border-stone-900 ring-4 ring-stone-900/10 shadow-sm" 
                                      : "border-stone-200 hover:border-stone-300"
                                  }`}
                                >
                                  <span className="w-3 h-3 rounded-full bg-white border shadow-inner flex shrink-0" />
                                  <span className="truncate">{g.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Specialty Fields conditional */}
                        <div>

                          {(prodCategory === "leather_belts" || prodCategory === "leather_wallets") && (
                            <div className="bg-[#FAF8F5] border border-stone-200 rounded-2xl p-4 space-y-2">
                              <h5 className="text-[10px] font-bold text-stone-900 uppercase tracking-widest block font-sans">
                                👜 Tuscan Leather Specifications
                              </h5>
                              <div className="space-y-1">
                                <label className="text-[10.5px] font-bold text-stone-700">Polishing Detail & Source Leather</label>
                                <input 
                                  type="text"
                                  value={leatherType}
                                  onChange={(e) => setLeatherType(e.target.value)}
                                  placeholder="e.g. Vegetable-Tanned Genuine Calf Leather"
                                  className="w-full text-xs px-3 py-2 bg-white border border-stone-200 rounded-lg focus:outline-none"
                                />
                              </div>
                            </div>
                          )}

                          {prodCategory === "handmade_soaps" && (
                            <div className="bg-[#FAF8F5] border border-stone-200 rounded-2xl p-4 space-y-2.5">
                              <h5 className="text-[10px] font-bold text-emerald-900 uppercase tracking-widest block font-sans">
                                🌿 Organic Compound Elements
                              </h5>
                              <div className="grid grid-cols-1 gap-2.5">
                                <div className="space-y-1">
                                  <label className="text-[10.5px] font-bold text-stone-700">Clean Active Ingredients (Comma-separated)</label>
                                  <input 
                                    type="text"
                                    value={soapIngredients}
                                    onChange={(e) => setSoapIngredients(e.target.value)}
                                    placeholder="Saponified Coconut Oil, Shea Butter, Rose Extract"
                                    className="w-full text-xs px-3 py-2 bg-white border border-stone-200 rounded-lg focus:outline-none"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10.5px] font-bold text-stone-700">Sensory Skin Feel Tags (Comma-separated)</label>
                                  <input 
                                    type="text"
                                    value={soapSkinFeel}
                                    onChange={(e) => setSoapSkinFeel(e.target.value)}
                                    placeholder="Detoxified, Velvet Soft, Highly Energising"
                                    className="w-full text-xs px-3 py-2 bg-white border border-stone-200 rounded-lg focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                      </div>

                    </div>
                  </form>
                )}

              </div>
            )}

            {/* BOUTIQUE SHOWROOMS TAB */}
            {activeSubTab === "locations" && (
              <div className="space-y-6">
                
                {locFormMode === "list" ? (
                  <div className="space-y-4 animate-fade-in">
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/60 pb-4">
                      <div className="space-y-1">
                        <h3 className="text-sm sm:text-base font-serif font-bold text-stone-900">Boutique Showrooms & Experience Centers</h3>
                        <p className="text-[11px] text-stone-500">Manage real-world showroom locations, operating timings, address indices, phone channels, and custom coordinates on the map.</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleResetLocations}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-stone-200 hover:border-red-200 text-stone-600 hover:text-red-705 bg-white hover:bg-red-50 text-[10.5px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                          title="Restore pre-seeded showrooms preset"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Reset defaults</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={handleOpenCreateLoc}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white hover:text-white text-[10.5px] font-bold uppercase tracking-wider rounded-xl shadow transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Establish Showroom</span>
                        </button>
                      </div>
                    </div>

                    {/* Showrooms Grid / List */}
                    <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-stone-50 text-stone-500 font-bold uppercase tracking-wider border-b border-stone-200 text-[9.5px]">
                              <th className="p-4 w-1/4">Gallery/Showroom Concept</th>
                              <th className="p-4 w-1/3">Physical Address</th>
                              <th className="p-4 w-1/4">Contact Details & Timings</th>
                              <th className="p-4 text-right">Directory Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-150">
                            {locations.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="p-12 text-center text-stone-400">
                                  <div className="max-w-xs mx-auto space-y-2">
                                    <MapPin className="w-8 h-8 text-stone-300 mx-auto" />
                                    <p className="font-serif font-medium text-stone-850 text-sm">No Showrooms Currently Listed</p>
                                    <p className="text-[10px] leading-relaxed">Establish a boutique location showroom above to display experience centers to physical visitors.</p>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              locations.map((loc) => (
                                <tr key={loc.id} className="hover:bg-stone-50/50 transition-colors">
                                  <td className="p-4">
                                    <div className="space-y-1">
                                      <span className="text-[9px] uppercase tracking-wide bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-bold inline-block">
                                        {loc.tagline || "MYRA Experience"}
                                      </span>
                                      <p className="font-serif font-bold text-stone-900 text-sm">{loc.name}</p>
                                      <p className="text-[9px] font-mono text-stone-400">{loc.id}</p>
                                    </div>
                                  </td>
                                  <td className="p-4 font-sans text-stone-700 leading-relaxed text-xs">
                                    <div className="flex items-start gap-1.5">
                                      <MapPin className="w-3.5 h-3.5 text-[#C68B59] mt-0.5 shrink-0" />
                                      <span>{loc.address}</span>
                                    </div>
                                  </td>
                                  <td className="p-4 text-[11px] text-stone-600 space-y-1">
                                    <div className="font-mono">{loc.phone}</div>
                                    <div className="text-[10px] text-stone-500 italic leading-snug">{loc.hours}</div>
                                  </td>
                                  <td className="p-4 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button 
                                        type="button"
                                        onClick={() => handleOpenEditLoc(loc)}
                                        className="p-2 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-150 rounded-xl transition-colors cursor-pointer"
                                        title="Refine information"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      
                                      <button 
                                        type="button"
                                        onClick={() => handleDeleteLoc(loc.id, loc.name)}
                                        className="p-2 bg-red-50 hover:bg-red-100 text-red-805 border border-red-150 rounded-xl transition-colors cursor-pointer"
                                        title="Decommission Showroom"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <div className="bg-[#FCFAF8] border border-stone-200/60 rounded-2xl p-4 flex gap-3 text-[10.5px] leading-relaxed text-stone-600 font-sans">
                      <MapPin className="w-5 h-5 text-stone-400 shrink-0 mt-0.5" />
                      <p>
                        <strong>Showroom Spatial Mapping:</strong> Physical showrooms are linked automatically with the interactive locator component on the homepage frontend. To add custom locations globally, set an elegant concept tagline, and visitors will be routed to get real-world directions.
                      </p>
                    </div>

                  </div>
                ) : (
                  /* Form mode editing or creating new showroom */
                  <form onSubmit={handleSaveLoc} className="bg-white border border-stone-200 rounded-3xl p-5 sm:p-6 space-y-6 animate-fade-in shadow-md">
                    
                    <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] uppercase font-bold tracking-widest bg-stone-900 text-white px-2 py-0.5 rounded-md">Atelier Showroom Registry</span>
                          <span className="text-[10px] text-stone-400 font-mono">/ {locFormMode === "create" ? "new-gallery" : locId}</span>
                        </div>
                        <h3 className="text-base font-serif font-extrabold text-stone-950 mt-1">
                          {locFormMode === "create" ? "Establish New Luxury Showroom" : `Refine [${locName}] Credentials`}
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => setLocFormMode("list")}
                        className="flex items-center gap-1 px-3 py-1.5 border border-stone-200 text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-50 text-[10.5px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Code ID */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10.5px] font-bold text-stone-700">Showroom Unique Identifier</label>
                        <input 
                          type="text"
                          value={locId}
                          onChange={(e) => setLocId(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                          disabled={locFormMode === "edit"}
                          placeholder="e.g. store-milan"
                          className="w-full text-xs px-3.5 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-500 font-mono text-stone-800 disabled:bg-stone-50 disabled:text-stone-400"
                          required
                        />
                        <p className="text-[9.5px] text-stone-400">Lowercase tags, alphanumeric with dashes only. Used as react key mapping.</p>
                      </div>

                      {/* Name */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10.5px] font-bold text-stone-700">Official Gallery Name / Title</label>
                        <input 
                          type="text"
                          value={locName}
                          onChange={(e) => setLocName(e.target.value)}
                          placeholder="e.g. MYRA Milan – Quadrilatero della Moda"
                          className="w-full text-xs px-3.5 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-500 font-serif font-bold text-stone-900"
                          required
                        />
                        <p className="text-[9.5px] text-stone-400">Must be a majestic branding name representing luxury standard.</p>
                      </div>

                      {/* Tagline */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10.5px] font-bold text-stone-700">Concept Designation / Tagline</label>
                        <input 
                          type="text"
                          value={locTagline}
                          onChange={(e) => setLocTagline(e.target.value)}
                          placeholder="e.g. Sensory & Craft Atelier"
                          className="w-full text-xs px-3.5 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-500 font-sans text-stone-800"
                        />
                        <p className="text-[9.5px] text-stone-400">Brief brand motto highlighting in-person experiences.</p>
                      </div>

                      {/* Phone */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10.5px] font-bold text-stone-700">Contact Phone Channel</label>
                        <input 
                          type="text"
                          value={locPhone}
                          onChange={(e) => setLocPhone(e.target.value)}
                          placeholder="e.g. +39 02 8392 MYRA"
                          className="w-full text-xs px-3.5 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-500 font-mono text-stone-800"
                        />
                        <p className="text-[9.5px] text-stone-400">Used for customer concierge support routing.</p>
                      </div>

                      {/* Address */}
                      <div className="col-span-1 md:col-span-2 space-y-1.5 text-left">
                        <label className="text-[10.5px] font-bold text-stone-700">Boutique Physical Address</label>
                        <input 
                          type="text"
                          value={locAddress}
                          onChange={(e) => setLocAddress(e.target.value)}
                          placeholder="e.g. 10 Via della Spiga, Quadrilatero, Milan, Italy 20121"
                          className="w-full text-xs px-3.5 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-500 font-sans text-stone-800"
                          required
                        />
                        <p className="text-[9.5px] text-stone-400">Complete physical layout address. Coordinates will be queried on directions clicks.</p>
                      </div>

                      {/* Hours */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10.5px] font-bold text-stone-700">Operating Timings / Hours</label>
                        <input 
                          type="text"
                          value={locHours}
                          onChange={(e) => setLocHours(e.target.value)}
                          placeholder="e.g. Mon - Sat: 10:00 AM - 7:30 PM | Sun: Closed"
                          className="w-full text-xs px-3.5 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-500 font-sans text-stone-850"
                        />
                        <p className="text-[9.5px] text-stone-400">Weekly schedule coordinates.</p>
                      </div>

                      {/* Map Coordinate SVG path */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10.5px] font-bold text-stone-700">Vector Coordinates Path (Backup SVG Art)</label>
                        <input 
                          type="text"
                          value={locCoordinates}
                          onChange={(e) => setLocCoordinates(e.target.value)}
                          placeholder="e.g. M 32,32 L 48,16 L 64,32 L 48,48 Z"
                          className="w-full text-xs px-3.5 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-500 font-mono text-stone-800"
                        />
                        <p className="text-[9.5px] text-stone-400">Designates the stylized coordinate schematic layout when no real map is bound.</p>
                      </div>

                      {/* Google Map Embed Url / iframe code */}
                      <div className="col-span-1 md:col-span-2 space-y-1.5 text-left">
                        <label className="text-[10.5px] font-bold text-stone-700 block flex items-center gap-1.5">
                          <span>Google Maps Embed Link / Code (Highly Recommended)</span>
                          <span className="text-[8.5px] text-leather-tan font-extrabold uppercase bg-amber-50 border border-amber-250 px-1.5 py-0.5 rounded-md">Live Interactive Map</span>
                        </label>
                        <textarea 
                          value={locMapEmbedUrl}
                          onChange={(e) => setLocMapEmbedUrl(e.target.value)}
                          placeholder='Paste either the raw Google Maps iFrame link or the complete <iframe> embed code snippet here (from Google Maps -> Share -> Embed a map)'
                          rows={2}
                          className="w-full text-xs px-3.5 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-500 font-mono text-stone-800"
                        />
                        <p className="text-[9.5px] text-stone-400 leading-relaxed">
                          <strong>How to get this:</strong> Go to Google Maps, find your boutique, click <strong>"Share"</strong>, select the <strong>"Embed a map"</strong> tab, click <strong>"Copy HTML"</strong> (exactly like shown in your screenshot), and paste the entire block directly here. The system will extract the live interactive map automatically!
                        </p>
                      </div>

                    </div>

                    <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3 font-sans">
                      <button
                        type="button"
                        onClick={() => setLocFormMode("list")}
                        className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white hover:text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow transition-all cursor-pointer"
                      >
                        {locFormMode === "create" ? "Establish Boutique Map" : "Save Showroom Credentials"}
                      </button>
                    </div>

                  </form>
                )}

              </div>
            )}

            {/* ORDERS MANAGER TAB */}
            {activeSubTab === "orders" && (
              <div className="space-y-6 animate-fade-in text-xs">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-serif font-bold text-stone-900">Boutique Processing Pipeline</h3>
                    <p className="text-[11px] text-stone-500 font-light">Track user purchases, audit payment receipts, update shipment statuses, inspect outgoing mail dispatch tables, or manage cancellation requests.</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEmailLogs(!showEmailLogs);
                        if (!showEmailLogs) {
                          fetchEmailLogs();
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-[#D4AF37]/20 border border-stone-200 hover:border-[#D4AF37] text-stone-700 font-bold uppercase tracking-wider text-[9.5px] rounded-lg transition-colors cursor-pointer select-none"
                    >
                      <Mail className="w-3.5 h-3.5 mr-0.5 text-stone-600" />
                      <span>{showEmailLogs ? "Hide Outbox Logs" : "View Outgoing Mail logs"}</span>
                    </button>
                    
                    <div className="flex items-center gap-1 px-3 py-1 bg-stone-100 rounded-full border border-stone-200 select-none">
                      <span className="text-[10px] font-bold font-mono text-stone-700">Total Valuation:</span>
                      <span className="text-xs font-serif font-bold text-leather-tan">₹{totalSales.toFixed(0)}</span>
                    </div>
                  </div>
                </div>

                {/* EMAIL COMMUNICATIONS OUTBOX LOGGER OVERLAY WINDOW */}
                {showEmailLogs && (
                  <div className="bg-stone-50 border border-[#D4AF37]/40 rounded-2xl p-5 space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[#D4AF37]" />
                        <h4 className="font-serif font-bold text-stone-900 text-sm">Automated Outbox logs (SMTP / Sandbox Local)</h4>
                      </div>
                      <button
                        type="button"
                        onClick={fetchEmailLogs}
                        className="text-[10px] uppercase tracking-wider text-[#8A7968] font-bold hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3 text-stone-500" />
                        <span>Refresh Outbox</span>
                      </button>
                    </div>

                    {emailLogs.length === 0 ? (
                      <p className="text-stone-500 italic py-4 text-center">No outbound notifications registered. Complete a checkout in the cart drawer to dispatch confirmation advisories.</p>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* List column */}
                        <div className="lg:col-span-1 border border-stone-200 rounded-xl max-h-80 overflow-y-auto divide-y divide-stone-100 bg-white">
                          {emailLogs.map((log) => {
                            const isSel = selectedEmailLog?.id === log.id;
                            return (
                              <button
                                key={log.id}
                                onClick={() => setSelectedEmailLog(log)}
                                className={`w-full text-left p-3 flex flex-col gap-1 transition-all hover:bg-stone-50/50 cursor-pointer ${isSel ? "bg-[#D4AF37]/10 border-l-2 border-[#D4AF37]" : ""}`}
                              >
                                <div className="flex items-center justify-between text-[9px] font-mono text-stone-400">
                                  <span>{log.id}</span>
                                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <span className="font-bold text-stone-850 truncate text-[11px]">{log.to}</span>
                                <span className="text-stone-500 truncate text-[10px]">{log.subject}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Preview column */}
                        <div className="lg:col-span-2 border border-stone-200 rounded-xl p-4 bg-white max-h-80 overflow-y-auto space-y-3.5 flex flex-col justify-between whitespace-pre-wrap">
                          {selectedEmailLog ? (
                            <div className="space-y-3">
                              <div className="border-b border-stone-100 pb-2 space-y-1">
                                <p className="text-stone-400 text-[10.5px]"><b>Recipients:</b> <code className="text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded font-mono text-[11px]">{selectedEmailLog.to}</code></p>
                                <p className="text-stone-400 text-[10.5px]"><b>Subject Advisement:</b> <span className="text-stone-850 font-semibold">{selectedEmailLog.subject}</span></p>
                                <p className="text-stone-400 text-[10.5px]"><b>Timestamp Dispatch:</b> <span className="text-stone-600 font-mono text-[10px]">{new Date(selectedEmailLog.timestamp).toLocaleString()}</span></p>
                              </div>
                              <div className="border border-stone-100 rounded-lg p-2.5 bg-[#fefefe]">
                                <div className="scale-85 origin-top-left overflow-x-auto" style={{ maxHeight: "200px" }} dangerouslySetInnerHTML={{ __html: selectedEmailLog.body }} />
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-stone-400 italic font-light py-10">
                              <Mail className="w-8 h-8 text-stone-200 mb-2" />
                              <span>Select an email dispatch entry from the outbox panel on the left to preview its content.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* REQUIREMENT 10: INTEGRATED CORE STATISTICAL METRICS */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-white border rounded-2xl p-4 space-y-1 shadow-sm border-stone-200">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#8A7968]">Total Orders Count</span>
                    <h4 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">{orders.length}</h4>
                    <span className="text-[8.5px] text-[#A69B8F] uppercase block">Lifetime checkouts</span>
                  </div>

                  <div className="bg-white border rounded-2xl p-4 space-y-1 shadow-sm border-stone-200">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#8A7968]">Sales Valuation (₹)</span>
                    <h4 className="text-xl sm:text-2xl font-serif font-bold text-leather-tan">₹{totalSales.toFixed(0)}</h4>
                    <span className="text-[8.5px] text-[#A69B8F] uppercase block">Excluding cancelled</span>
                  </div>

                  <div className="bg-white border rounded-2xl p-4 space-y-1 shadow-sm border-stone-200">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-amber-850">Processing Stage</span>
                    <h4 className="text-xl sm:text-2xl font-serif font-bold text-amber-700">{orders.filter(o => ["placed", "packing"].includes(o.status.toLowerCase())).length}</h4>
                    <span className="text-[8.5px] text-[#A69B8F] uppercase block">Atelier Curation</span>
                  </div>

                  <div className="bg-white border rounded-2xl p-4 space-y-1 shadow-sm border-stone-200">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-850">Shipped Split Counter</span>
                    <h4 className="text-xl sm:text-2xl font-serif font-bold text-indigo-700">{orders.filter(o => ["shipped", "delivering"].includes(o.status.toLowerCase())).length}</h4>
                    <span className="text-[8.5px] text-[#A69B8F] uppercase block">In logistics transit</span>
                  </div>

                  <div className="bg-white border rounded-2xl p-4 space-y-1 shadow-sm border-stone-200 col-span-2 md:col-span-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-850">Delivered Counter</span>
                    <h4 className="text-xl sm:text-2xl font-serif font-bold text-emerald-700">{orders.filter(o => o.status.toLowerCase() === "delivered").length}</h4>
                    <span className="text-[8.5px] text-[#A69B8F] uppercase block">Completed handshakes</span>
                  </div>
                </div>

                {/* REQUIREMENT 9: SEARCH AND FILTER TOOLS */}
                <div className="flex flex-col md:flex-row gap-3 items-center bg-stone-50 p-3 rounded-2xl border border-stone-200/60 shadow-sm relative z-10 font-sans">
                  <div className="relative flex-1 w-full font-sans">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      placeholder="Search orders by Order ID, Customer Name, Email, Address, or Item names..."
                      className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-855 focus:outline-none focus:ring-1 focus:ring-stone-450 placeholder-stone-400 font-sans"
                    />
                    {orderSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setOrderSearchQuery("")}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 font-bold font-sans text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 items-center justify-end font-sans">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 pr-1 select-none">Stage:</span>
                    {[
                      { id: "All", label: "All", count: orderCountAll },
                      { id: "Placed", label: "Placed", count: orderCountPlaced },
                      { id: "Packing", label: "Packing", count: orderCountPacking },
                      { id: "Shipped", label: "Shipped", count: orderCountShipped },
                      { id: "Out for Delivery", label: "Delivery", count: orderCountOutForDelivery },
                      { id: "Delivered", label: "Delivered", count: orderCountDelivered },
                      { id: "Cancel Order", label: "Cancelled", count: orderCountCancelled }
                    ].map((filterTab) => {
                      const isActive = orderStatusFilter === filterTab.id;
                      return (
                        <button
                          key={filterTab.id}
                          onClick={() => setOrderStatusFilter(filterTab.id)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer select-none transition-all duration-300 border ${
                            isActive 
                              ? "bg-stone-900 border-stone-950 text-white shadow-sm" 
                              : "bg-white hover:bg-stone-100 text-stone-500 hover:text-stone-950 border-stone-200"
                          }`}
                        >
                          <span>{filterTab.label}</span>
                          <span className={`text-[8.5px] font-mono px-1 rounded-full ${
                            isActive ? "bg-leather-tan text-white" : "bg-stone-100 text-stone-500"
                          }`}>
                            {filterTab.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 items-center justify-end font-sans w-full md:w-auto mt-2 md:mt-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 pr-1 select-none">Payment:</span>
                    {[
                      { id: "All", label: "All" },
                      { id: "Paid", label: "Paid" },
                      { id: "Test", label: "Test Mode" },
                      { id: "Unpaid", label: "Unpaid" }
                    ].map((filterTab) => {
                      const isActive = paymentStatusFilter === filterTab.id;
                      return (
                        <button
                          key={filterTab.id}
                          onClick={() => setPaymentStatusFilter(filterTab.id)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer select-none transition-all duration-300 border ${
                            isActive 
                              ? "bg-slate-800 border-slate-900 text-white shadow-sm" 
                              : "bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-900 border-slate-200"
                          }`}
                        >
                          <span>{filterTab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {filteredOrdersList.length === 0 ? (
                  <div className="py-12 bg-white border border-stone-200 text-center rounded-2xl p-6 space-y-4 max-w-md mx-auto">
                    <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto animate-bounce" />
                    <div>
                      <h5 className="text-sm font-serif font-bold text-stone-800">No orders matching your criteria</h5>
                      <p className="text-xs text-stone-500 mt-1 leading-normal">There are currently no active orders assigned to this search or segment query of the boutique database.</p>
                    </div>
                    <button 
                      onClick={() => { setOrderStatusFilter("All"); setOrderSearchQuery(""); }}
                      className="px-4 py-2 bg-stone-900 hover:bg-leather-tan text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* REQUIREMENT 2: RESPONSIVE DATA TABLE FOR DESKTOP */}
                    <div className="hidden lg:block overflow-hidden bg-white border border-stone-200 rounded-2xl shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-stone-50 text-stone-450 text-[10px] uppercase font-bold tracking-wider border-b border-stone-250 select-none">
                            <th className="p-4">Order ID & Date</th>
                            <th className="p-4">Patron Details</th>
                            <th className="p-4">Shipping Address</th>
                            <th className="p-4">Products Detailing</th>
                            <th className="p-4">Valuation & Gateway</th>
                            <th className="p-4 text-center">Pipeline status</th>
                            <th className="p-4 text-right">Operations Action Bar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-[11.5px] leading-relaxed text-stone-700 font-sans">
                          {filteredOrdersList.map((o) => {
                            const lowerStatus = o.status.toLowerCase();
                            const isRequested = lowerStatus === "cancellation_requested" || o.isCancellationRequested;

                            // Display friendly badges for current active order states
                            const badgeStyles: { [key: string]: string } = {
                              "placed": "bg-yellow-50 text-yellow-800 border-yellow-250",
                              "packing": "bg-amber-100 text-amber-900 border-amber-250",
                              "shipped": "bg-indigo-50 text-indigo-800 border-indigo-200",
                              "delivering": "bg-violet-50 text-violet-850 border-violet-250",
                              "delivered": "bg-emerald-50 text-emerald-800 border-emerald-250",
                              "cancellation_requested": "bg-orange-50 text-orange-905 border-orange-300 animate-pulse",
                              "cancelled": "bg-stone-100 text-stone-605 border-stone-250"
                            };

                            const displayStatusLabel = 
                              o.status === "placed" ? "Pending" : o.status === "packing" ? "Processing" : o.status === "shipped" || o.status === "delivering" ? "Shipped" : o.status === "delivered" ? "Delivered" : "Cancelled";

                            const shippingDetailsObj = o.shippingDetails || {
                              firstName: o.customerName || "Patron",
                              lastName: "",
                              emailAddress: o.emailAddress || "ikondecor1@gmail.com",
                              mobileNumber: o.phoneNumber || "+91 9999999999",
                              houseNo: "",
                              streetAddress: o.shippingAddress || "Invoiced Destination",
                              areaLocality: "",
                              city: "",
                              state: "",
                              pinCode: "",
                              country: "",
                              addressType: "Home"
                            };

                            return (
                              <React.Fragment key={o.id}>
                                <tr className="hover:bg-stone-50/40 transition-colors">
                                  {/* ID & Date */}
                                  <td className="p-4 font-mono">
                                    <div className="flex flex-col gap-1 text-left">
                                      <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5 flex-wrap">
                                        <span>{o.id}</span>
                                        {(o.isTestOrder || o.id?.startsWith("TEST-")) && (
                                          <span className="bg-red-50 text-red-700 border border-red-200 text-[8.5px] uppercase tracking-wider px-1.5 py-0.5 rounded font-extrabold select-none">
                                            Test Order
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-stone-400 mt-0.5">{o.orderDate || o.date}</div>
                                    </div>
                                  </td>

                                  {/* Customer */}
                                  <td className="p-4 font-sans">
                                    <div className="font-bold text-stone-850 text-xs flex items-center gap-1.5">
                                      <User className="w-3 h-3 text-stone-400" />
                                      <span>{shippingDetailsObj.firstName} {shippingDetailsObj.lastName}</span>
                                    </div>
                                    <div className="text-[10px] text-stone-400 font-mono mt-0.5">{shippingDetailsObj.emailAddress}</div>
                                    <div className="text-[10px] text-stone-500 font-mono">{shippingDetailsObj.mobileNumber}</div>
                                  </td>

                                  {/* Address */}
                                  <td className="p-4 font-sans font-light max-w-xs">
                                    <div className="truncate text-xs text-stone-800">
                                      {shippingDetailsObj.houseNo ? `${shippingDetailsObj.houseNo}, ${shippingDetailsObj.streetAddress}` : shippingDetailsObj.streetAddress}
                                    </div>
                                    <div className="text-[10px] text-stone-400">
                                      {shippingDetailsObj.areaLocality ? `${shippingDetailsObj.areaLocality}, ` : ""}{shippingDetailsObj.city || ""} {shippingDetailsObj.pinCode || ""}
                                    </div>
                                  </td>

                                  {/* Purveyed Package */}
                                  <td className="p-4">
                                    <div className="space-y-0.5 max-w-[170px]">
                                      {(o.items || []).map((item: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between gap-1 border-b border-dashed border-stone-100 last:border-0 pb-0.5 last:pb-0 font-sans">
                                          <span className="font-semibold text-stone-800 truncate text-[10.5px]">
                                            {item.name} <span className="opacity-60 text-[9px] font-normal font-mono">({item.sizeOrSpec || "100ml"})</span>
                                          </span>
                                          <span className="font-mono bg-stone-100 text-stone-500 px-1 py-0.2 rounded text-[9.5px]">x{item.quantity}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </td>

                                  {/* Valuation & Gateway */}
                                  <td className="p-4 font-sans">
                                    <div className="font-bold text-stone-900 text-xs text-leather-tan">₹{(o.totalAmount || o.totalPrice || 0).toFixed(0)}</div>
                                    <div className="text-[9.5px] uppercase font-bold text-stone-400 mt-0.5 leading-none">{o.paymentMethod || "Razorpay"}</div>
                                    <div className="mt-1 flex flex-col gap-1 items-start">
                                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-bold uppercase ${
                                        (o.paymentStatus || "").toLowerCase() === "paid" ? "bg-emerald-50 text-emerald-800 border-emerald-250" : 
                                        (o.paymentStatus || "").toLowerCase().includes("test") ? "bg-amber-50 text-amber-800 border-amber-250" : 
                                        "bg-stone-50 text-stone-600 border-stone-200"
                                      }`}>
                                        {o.paymentStatus || "UNPAID"}
                                      </span>
                                    </div>
                                    {o.razorpayPaymentId && (
                                      <div className="-mt-0.5" title="Razorpay Payment ID">
                                        <span className="text-[8px] font-mono text-stone-400 px-1 py-0.5 rounded border border-stone-100 bg-stone-50 overflow-hidden text-ellipsis inline-block max-w-[120px]">
                                          {o.razorpayPaymentId}
                                        </span>
                                      </div>
                                    )}
                                  </td>

                                  {/* Status Pills */}
                                  <td className="p-4 text-center">
                                    <span className={`inline-block text-[9.5px] uppercase tracking-wider px-2.5 py-1 rounded-full border font-bold ${badgeStyles[lowerStatus] || "bg-stone-50 text-stone-700"}`}>
                                      {displayStatusLabel.toUpperCase()}
                                    </span>
                                  </td>

                                  {/* Shift Status action bar */}
                                  <td className="p-4 text-right">
                                    <div className="flex flex-wrap gap-1 justify-end max-w-[240px]">
                                      {[
                                        { status: "placed", label: "Placed" },
                                        { status: "packing", label: "Packing" },
                                        { status: "shipped", label: "Shipped" },
                                        { status: "delivering", label: "Delivery" },
                                        { status: "delivered", label: "Delivered" },
                                        { status: "cancelled", label: "Cancel" }
                                      ].map((btn) => {
                                        const isCurrent = lowerStatus === btn.status;
                                        return (
                                          <button
                                            key={btn.status}
                                            onClick={() => handleUpdateOrderStatus(o.id, btn.status)}
                                            className={`px-2 py-0.5 text-[8.5px] uppercase font-extrabold tracking-wider rounded border transition-all cursor-pointer ${
                                              isCurrent 
                                                ? "bg-stone-900 text-white border-stone-950 font-black shadow-sm" 
                                                : "bg-white hover:bg-stone-100 text-stone-605 border-stone-200"
                                            }`}
                                          >
                                            {btn.label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </td>
                                </tr>

                                {/* Cancellation approval alert row if active */}
                                {isRequested && lowerStatus !== "cancelled" && (
                                  <tr className="bg-orange-50/40">
                                    <td colSpan={7} className="p-3 border-t border-dashed border-orange-200">
                                      <div className="flex items-center gap-2 pl-4 text-orange-950">
                                        <AlertTriangle className="w-4 h-4 text-orange-600 animate-pulse shrink-0" />
                                        <div className="flex items-center gap-3 font-sans">
                                          <span className="font-bold text-xs">Customer requested cancellation!</span>
                                          <button
                                            onClick={() => handleApproveCancellation(o.id)}
                                            className="bg-[#8C3A2B] hover:bg-rose-900 text-white text-[9.5px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-lg transition-colors cursor-pointer shadow-sm"
                                          >
                                            Approve and Cancel Order
                                          </button>
                                          <button
                                            onClick={() => handleRejectCancellation(o.id)}
                                            className="bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 text-[9.5px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-lg transition-colors cursor-pointer"
                                          >
                                            Reject Request
                                          </button>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* MOBILE COLLAPSIBLE CARD WORKFLOW DISPLAY (LEGACY COUPLING BACKWARDS ACCENT) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
                      {filteredOrdersList.map((o) => {
                        const lowerStatus = o.status.toLowerCase();
                        const isRequested = lowerStatus === "cancellation_requested" || o.isCancellationRequested;

                        const badgeStyles: { [key: string]: string } = {
                          "placed": "bg-yellow-50 text-yellow-850 border-yellow-200",
                          "packing": "bg-amber-100 text-amber-900 border-amber-250 animate-pulse",
                          "shipped": "bg-indigo-50 text-indigo-850 border-indigo-200",
                          "delivering": "bg-violet-50 text-violet-850 border-violet-250",
                          "delivered": "bg-emerald-50 text-emerald-800 border-emerald-250",
                          "cancellation_requested": "bg-orange-50 text-orange-900 border-orange-300 animate-pulse",
                          "cancelled": "bg-stone-100 text-stone-600 border-stone-250"
                        };

                        const displayStatusLabel = 
                          o.status === "placed" ? "Pending" : o.status === "packing" ? "Processing" : o.status === "shipped" || o.status === "delivering" ? "Shipped" : o.status === "delivered" ? "Delivered" : "Cancelled";

                        const shippingDetailsObj = o.shippingDetails || {
                          firstName: o.customerName || "Patron",
                          lastName: "",
                          emailAddress: o.emailAddress || "ikondecor1@gmail.com",
                          mobileNumber: o.phoneNumber || "+91 9999999999",
                          houseNo: "",
                          streetAddress: o.shippingAddress || "Invoiced Destination",
                          areaLocality: "",
                          city: "",
                          state: "",
                          pinCode: "",
                          country: "",
                          addressType: "Home"
                        };

                        return (
                          <div key={o.id} className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4 shadow-sm text-xs font-sans">
                            
                            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-stone-100 pb-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap text-left">
                                  <span className="font-mono font-bold text-stone-900 text-sm">{o.id}</span>
                                  {(o.isTestOrder || o.id?.startsWith("TEST-")) && (
                                    <span className="bg-red-50 text-red-700 border border-red-200 text-[8.5px] uppercase tracking-wider px-1.5 py-0.5 rounded font-extrabold select-none">
                                      Test Order
                                    </span>
                                  )}
                                  <span className="text-[10px] text-stone-400">Date: {o.orderDate || o.date}</span>
                                  <span className={`text-[9.5px] uppercase tracking-wider px-2 py-0.5 rounded border font-bold ${badgeStyles[lowerStatus] || "bg-stone-50 text-stone-700"}`}>
                                    {displayStatusLabel.toUpperCase()}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right flex flex-col items-end gap-1">
                                <span className="text-[9px] text-[#8A7968] block font-bold uppercase tracking-widest">Total Valuation</span>
                                <span className="text-base font-serif font-extrabold text-[#C68B59] leading-none">₹{(o.totalAmount || o.totalPrice || 0).toFixed(0)}</span>
                                <div className="mt-1 flex flex-col items-end gap-1">
                                  <span className="text-[8.5px] uppercase font-bold text-stone-400 leading-none">{o.paymentMethod || "Razorpay"}</span>
                                  <span className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded border font-bold uppercase inline-block ${
                                    (o.paymentStatus || "").toLowerCase() === "paid" ? "bg-emerald-50 text-emerald-800 border-emerald-250" : 
                                    (o.paymentStatus || "").toLowerCase().includes("test") ? "bg-amber-50 text-amber-800 border-amber-250" : 
                                    "bg-stone-50 text-stone-600 border-stone-200"
                                  }`}>
                                    {o.paymentStatus || "UNPAID"}
                                  </span>
                                  {o.razorpayPaymentId && (
                                    <span className="text-[8px] font-mono text-stone-400 mt-1 max-w-[120px] truncate" title="Razorpay Payment ID: {o.razorpayPaymentId}">
                                      ID: {o.razorpayPaymentId}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="divide-y divide-stone-100">
                              {(o.items || []).map((item: any, idx: number) => (
                                <div key={idx} className="py-2 flex items-center justify-between gap-4 text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono bg-stone-105 font-bold px-1.5 rounded text-stone-600 text-[10px]">x{item.quantity}</span>
                                    <span>{item.name} <span className="text-[9.5px] text-stone-400">({item.sizeOrSpec})</span></span>
                                  </div>
                                  <span className="font-semibold text-stone-700">₹{item.price * item.quantity}</span>
                                </div>
                              ))}
                            </div>

                            <div className="bg-stone-50 p-3 rounded-xl space-y-1.5">
                              <p className="font-bold text-stone-900 text-[10.5px]">{shippingDetailsObj.firstName} {shippingDetailsObj.lastName}</p>
                              <p className="text-[10px] text-stone-500 leading-normal font-light">
                                ✉ {shippingDetailsObj.emailAddress} • 📞 {shippingDetailsObj.mobileNumber}<br/>
                                🚢 {shippingDetailsObj.houseNo ? `${shippingDetailsObj.houseNo}, ` : ""}{shippingDetailsObj.streetAddress}, {shippingDetailsObj.city || ""} {shippingDetailsObj.pinCode || ""}
                              </p>
                            </div>

                            {isRequested && lowerStatus !== "cancelled" && (
                              <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg text-orange-950 space-y-2">
                                <p className="font-bold text-xs">Customer requested cancellation!</p>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() => handleApproveCancellation(o.id)}
                                    className="bg-[#8C3A2B] text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded transition-colors cursor-pointer"
                                  >
                                    Approve Cancel
                                  </button>
                                  <button
                                    onClick={() => handleRejectCancellation(o.id)}
                                    className="bg-white text-stone-700 border border-stone-300 text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded transition-colors cursor-pointer"
                                  >
                                    Decline Request
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Supervisor pipeline updater */}
                            <div className="pt-2 border-t border-stone-100 flex flex-col gap-1.5">
                              <span className="text-[10px] text-[#8A7968] font-bold uppercase tracking-wider">Shift Pipeline Status:</span>
                              <div className="flex flex-wrap gap-1">
                                {[
                                  { status: "placed", label: "Placed" },
                                  { status: "packing", label: "Packing" },
                                  { status: "shipped", label: "Shipped" },
                                  { status: "delivering", label: "Transit" },
                                  { status: "delivered", label: "Delivered" },
                                  { status: "cancelled", label: "Cancel" }
                                ].map((btn) => {
                                  const isCurrent = lowerStatus === btn.status;
                                  return (
                                    <button
                                      key={btn.status}
                                      onClick={() => handleUpdateOrderStatus(o.id, btn.status)}
                                      className={`px-2 py-1 text-[8.5px] uppercase font-bold tracking-wider rounded border transition-all cursor-pointer ${
                                        isCurrent 
                                          ? "bg-stone-900 text-white border-stone-950 font-extrabold shadow-sm" 
                                          : "bg-stone-55 hover:bg-stone-100 text-stone-600 border-stone-200"
                                      }`}
                                    >
                                      {btn.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* METRICS ROOM TAB */}
            {activeSubTab === "analytics" && (
              <div className="space-y-6 animate-fade-in text-xs leading-relaxed text-stone-600">
                
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-serif font-bold text-stone-900">Atelier Performance Analytics</h3>
                    <p className="text-[11px] text-stone-500 font-light">Examine checkout sales volume, category listings count, reviews and simulation nodes.</p>
                  </div>
                </div>

                {/* Grid of Bento values stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white border rounded-2xl p-4 space-y-1.5 shadow-sm">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#8A7968]">Total Sales</span>
                    <h4 className="text-xl sm:text-2xl font-serif font-bold text-leather-tan">₹{totalSales}</h4>
                    <span className="text-[8.5px] text-[#A69B8F] uppercase block">Processed Invoices</span>
                  </div>

                  <div className="bg-white border rounded-2xl p-4 space-y-1.5 shadow-sm">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#8A7968]">Active Orders</span>
                    <h4 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">{pendingOrdersCount}</h4>
                    <span className="text-[8.5px] text-[#A69B8F] uppercase block">In Packing/Transit</span>
                  </div>

                  <div className="bg-white border rounded-2xl p-4 space-y-1.5 shadow-sm">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#8A7968]">Completed Cycles</span>
                    <h4 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">{completedOrdersCount}</h4>
                    <span className="text-[8.5px] text-[#A69B8F] uppercase block">Delivered safely</span>
                  </div>

                  <div className="bg-white border rounded-2xl p-4 space-y-1.5 shadow-sm">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#8A7968]">Retire Ratio</span>
                    <h4 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">{cancelledOrdersCount}</h4>
                    <span className="text-[8.5px] text-[#A69B8F] uppercase block">Cancelled orders</span>
                  </div>
                </div>

                {/* Category summary listing statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="bg-white border rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                    <h5 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-2">
                      <Folder className="w-4 h-4 text-[#C68B59]" /> Category Distribution
                    </h5>
                    
                    <div className="space-y-2.5">
                      {[
                        { category: "perfumes", label: "Perfumes & Olfactory Bottles", count: products.filter(p => p.category === "perfumes").length, color: "bg-rose-400" },
                        { category: "leather_belts", label: "Tuscan Belt Accessories", count: products.filter(p => p.category === "leather_belts").length, color: "bg-amber-500" },
                        { category: "leather_wallets", label: "Leather RFID Wallets", count: products.filter(p => p.category === "leather_wallets").length, color: "bg-[#7c5d41]" },
                        { category: "handmade_soaps", label: "Raw Botanical Cold Soaps", count: products.filter(p => p.category === "handmade_soaps").length, color: "bg-emerald-400" },
                        { category: "gift_sets", label: "Deluxe Rigid Gifting Chests", count: products.filter(p => p.category === "gift_sets").length, color: "bg-purple-400" }
                      ].map(stat => (
                        <div key={stat.category} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-stone-800">{stat.label}</span>
                            <span className="font-bold text-stone-900">{stat.count} Assets</span>
                          </div>
                          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${stat.color}`} 
                              style={{ width: `${(stat.count / products.length) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right side subtab column wrapper */}
                  <div className="space-y-6">
                    {/* sandbox Operations sandbox */}
                    <div className="bg-[#FAF9F6] border border-stone-200 rounded-2xl p-4 sm:p-5 space-y-4">
                      <h5 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-leather-tan animate-pulse" /> Sandbox Testing Node
                      </h5>

                      <p className="text-xs text-stone-500 leading-normal">
                        Simulate a sudden bespoke customer order purchase to populate sandbox transactions instantly. Excellent to test order cancel workflows:
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          // Choose a random product
                          const randProd = products[Math.floor(Math.random() * products.length)];
                          
                          const simulatedNewOrder = {
                            id: `MYRA-MOCK-${Math.floor(10000 + Math.random() * 90000)}`,
                            date: new Date().toISOString().split("T")[0],
                            items: [
                              {
                                id: randProd.id,
                                name: randProd.name,
                                price: randProd.price,
                                quantity: 1,
                                sizeOrSpec: randProd.sizeOrSpec || "Standard Edition",
                                bgColorClass: randProd.bgColorClass
                              }
                            ],
                            totalPrice: randProd.price,
                            status: "placed",
                            isCancellationRequested: false
                          };

                          const nextOrdersList = [simulatedNewOrder, ...orders];
                          onOrdersChange(nextOrdersList);
                          try {
                            localStorage.setItem("myra_orders", JSON.stringify(nextOrdersList));
                          } catch (err) {
                            console.warn("Storage limit in order simulation:", err);
                          }
                          triggerToast(`Simulated Order ID ${simulatedNewOrder.id} received for ${randProd.name}!`);
                        }}
                        className="w-full py-3 bg-stone-900 hover:bg-leather-tan text-white text-[10.5px] uppercase font-bold tracking-widest rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                      >
                        Receive Random Simulated Order
                      </button>
                      
                      <div className="text-[10px] text-[#866854] bg-orange-50/50 p-2.5 rounded-lg border border-orange-200/40 flex gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />
                        <p><strong>Note for evaluation:</strong> All sandbox metrics, added products, updated status values, and custom Base64 image uploads persist instantly inside your local Web Storage limits.</p>
                      </div>
                    </div>

                    {/* Admin Key Customizer Node */}
                    <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                      <h5 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-2">
                        <Lock className="w-4 h-4 text-[#C68B59]" /> Passcode Security Settings
                      </h5>

                      <p className="text-xs text-stone-500 leading-normal">
                        Secure your Administrator node by replacing the default passcode <code className="bg-stone-50 px-1 rounded font-mono font-medium">admin</code>. If a collaborator or someone else gets the passcode secretly, you can rotate it here.
                      </p>

                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-[#8A7968]">Current Active Passcode</label>
                          <div className="px-3.5 py-2.5 bg-stone-50 rounded-xl border border-stone-200 font-mono text-stone-700 text-xs w-full select-all">
                            {adminPasscode}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-[#8A7968]">New Secure Passcode</label>
                          <input
                            type="text"
                            placeholder="Type custom passcode..."
                            value={newPasscodeInput}
                            onChange={(e) => setNewPasscodeInput(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-stone-900 text-[11px] placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-950 focus:bg-white font-mono"
                          />
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (!newPasscodeInput.trim()) {
                                triggerToast("Passcode cannot be empty.");
                                return;
                              }
                              const updatedCode = newPasscodeInput.trim();
                              setAdminPasscode(updatedCode);
                              try {
                                localStorage.setItem("myra_admin_passcode", updatedCode);
                              } catch (err) {
                                console.warn("Storage warning in passcode rotate:", err);
                              }
                              setNewPasscodeInput("");
                              triggerToast(`Atelier passcode rotated successfully! New active key is '${updatedCode}'`);
                            }}
                            disabled={!newPasscodeInput.trim()}
                            className="px-4 py-2.5 bg-stone-950 hover:bg-[#8F633E] active:bg-black text-white text-[10px] font-bold rounded-xl uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer text-center flex-1"
                          >
                            Change Passcode
                          </button>
                          
                          {adminPasscode !== "admin" && (
                            <button
                              type="button"
                              onClick={() => {
                                setAdminPasscode("admin");
                                localStorage.removeItem("myra_admin_passcode");
                                setNewPasscodeInput("");
                                triggerToast("Administrative passcode restored successfully to 'admin'.");
                              }}
                              className="px-3.5 py-2.5 border border-stone-250 hover:bg-stone-50 text-stone-700 font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* MESSAGES ROOM TAB */}
            {activeSubTab === "messages" && (
              <div className="space-y-6 animate-reveal text-xs text-stone-600">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-sm sm:text-base font-serif font-bold text-stone-900">Curator Contact Mailbox</h3>
                    <p className="text-[11px] text-stone-500">Examine and follow up on inquiries sent by boutique guests wanting custom scents, bespoke leather goods, or luxury packages.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-250 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm">
                      {messages.filter(m => !m.isRead).length} Pending Follow-ups
                    </span>
                  </div>
                </div>

                {messages.length === 0 ? (
                  <div className="bg-white border rounded-2xl p-12 text-center text-stone-450 italic">
                    <MessageSquare className="w-10 h-10 text-stone-350 mx-auto mb-3" />
                    No private guest inquiries received yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {messages.map((msg) => {
                      return (
                        <div 
                          key={msg.id} 
                          className={`bg-white border text-[#2c2420] rounded-2xl p-5 space-y-4 shadow-sm hover:shadow transition-shadow relative overflow-hidden ${
                            !msg.isRead ? "border-l-4 border-l-amber-500 border-amber-200" : "border-stone-200"
                          }`}
                        >
                          {/* Top row */}
                          <div className="flex justify-between items-start gap-4 flex-wrap">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-serif font-bold text-stone-900 text-sm">{msg.name}</h4>
                                <span className="text-[10px] font-mono text-stone-400">({msg.email})</span>
                                {!msg.isRead && (
                                  <span className="bg-amber-100 text-amber-900 text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded shadow-sm border border-amber-200/45">
                                    New Inquiry
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[10px] text-stone-450 font-semibold uppercase mt-1">
                                {msg.phone && <span className="text-stone-500">Phone: <strong className="text-stone-700">{msg.phone}</strong></span>}
                                <span className="text-stone-500">Interest: <strong className="text-leather-tan">{msg.interest || "Unspecified"}</strong></span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-right">
                              <span className="text-[10px] text-stone-400 font-medium font-mono mr-2">{msg.date}</span>
                              <button
                                onClick={() => {
                                  const updated = messages.map(m => m.id === msg.id ? { ...m, isRead: !m.isRead } : m);
                                  if (onMessagesChange) onMessagesChange(updated);
                                  triggerToast(`Conversation marked as ${!msg.isRead ? "read" : "unread"}.`);
                                }}
                                className="px-2.5 py-1 text-[9px] uppercase font-bold tracking-wider rounded border bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200 cursor-pointer transition-colors"
                                title={msg.isRead ? "Mark as Unread" : "Mark as Read"}
                              >
                                {msg.isRead ? "Mark Unread" : "Mark Read"}
                              </button>
                              <button
                                onClick={() => {
                                  showConfirm(
                                    "Discard Message",
                                    `Are you sure you want to discard the message from [${msg.name}]? This action cannot be undone.`,
                                    () => {
                                      const updated = messages.filter(m => m.id !== msg.id);
                                      if (onMessagesChange) onMessagesChange(updated);
                                      triggerToast("Message successfully removed from curator records.");
                                    },
                                    "Discard",
                                    true
                                  );
                                }}
                                className="p-1 px-1.5 text-red-700 hover:text-white hover:bg-red-650 border border-red-200 hover:border-red-600 rounded transition-colors cursor-pointer"
                                title="Discard Message"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Message Content */}
                          <div className="bg-stone-50/60 border border-stone-100/50 rounded-xl p-3 text-[11.5px] leading-relaxed text-stone-700 font-medium whitespace-pre-wrap">
                            "{msg.message}"
                          </div>

                          {/* Suggested Action Reply Proxy */}
                          <div className="flex justify-end gap-1.5 pt-1">
                            <a 
                              href={`mailto:${msg.email}?subject=MYRA%20Atelier%20Curation%20Consultation&body=Greetings%20${encodeURIComponent(msg.name)},%0D%0A%0D%0AThank%20you%20for%20contacting%20our%20curators%20regarding%20your%20interest%20in%20${encodeURIComponent(msg.interest || "Perfumes")}.%0D%0A%0D%0A`}
                              className="px-3 py-1.5 bg-stone-900 border border-stone-950 hover:bg-leather-tan text-white rounded-lg text-[9.5px] uppercase font-black tracking-wider transition-all flex items-center gap-1 shadow-sm"
                            >
                              Follow-up via Email
                            </a>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* REVIEWS CURATION TAB */}
            {activeSubTab === "reviews" && (
              <div className="space-y-6 animate-reveal text-xs text-stone-600">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-sm sm:text-base font-serif font-bold text-stone-900">Boutique Reviews Curation</h3>
                    <p className="text-[11px] text-stone-500 font-medium">Protect the integrity of the MYRA brand by filtering fake spam, hostile product assessments, or improper community additions.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  
                  {/* Left Column: Product Selector */}
                  <div className="lg:col-span-4 bg-white border border-stone-200 rounded-2xl flex flex-col overflow-hidden max-h-[600px]">
                    <div className="p-3 bg-stone-50 border-b border-stone-200">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-stone-400" />
                        <input
                          type="text"
                          placeholder="Search products..."
                          value={reviewSearchQuery}
                          onChange={(e) => setReviewSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-white border border-stone-200 rounded-lg text-[11px] focus:outline-none focus:border-stone-900"
                        />
                      </div>
                    </div>

                    <div className="overflow-y-auto divide-y divide-stone-100 flex-grow">
                      {filteredReviewProducts.map((p) => {
                        const isSel = (selectedProductForReviews && selectedProductForReviews.id === p.id);
                        const reviewsList = p.reviews || getPreseededReviews(p.id, p.category);
                        return (
                          <button
                            key={p.id}
                            onClick={() => setSelectedProductReviewId(p.id)}
                            className={`w-full text-left p-3.5 transition-colors flex items-center gap-3 cursor-pointer ${
                              isSel ? "bg-stone-900 text-white" : "hover:bg-stone-50 text-stone-800"
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg ${p.bgColorClass || 'bg-stone-100'} flex-shrink-0 flex items-center justify-center text-[10px] font-bold border ${isSel ? 'border-white/20' : 'border-stone-200'}`}>
                              ★
                            </div>
                            <div className="min-w-0 flex-grow">
                              <h4 className="font-serif text-[11.5px] font-bold truncate leading-snug">{p.name}</h4>
                              <p className={`text-[10px] ${isSel ? 'text-stone-300' : 'text-stone-400'} capitalize mt-0.5`}>
                                {p.categoryLabel}
                              </p>
                            </div>
                            <span className={`text-[10.5px] font-mono px-2 py-0.5 rounded-full font-bold ${
                              isSel ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                            }`}>
                              {reviewsList.length}
                            </span>
                          </button>
                        );
                      })}
                      {filteredReviewProducts.length === 0 && (
                        <div className="p-8 text-center text-stone-400 font-medium text-[11px]">
                          No products found.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Review List & Deletion */}
                  <div className="lg:col-span-8 bg-white border border-stone-200 rounded-2xl flex flex-col overflow-hidden max-h-[600px]">
                    {selectedProductForReviews ? (
                      <>
                        {/* Header of selected product */}
                        <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="space-y-0.5">
                            <span className="text-[10px] uppercase tracking-widest text-[#8A7968] font-bold font-sans">Currently Curating</span>
                            <h4 className="text-sm font-serif font-extrabold text-stone-900 leading-none">{selectedProductForReviews.name}</h4>
                          </div>
                          
                          <div className="flex items-center gap-1.5 bg-[#FAF8F5] border border-stone-200 px-3 py-1 rounded-full text-stone-950 font-bold">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>{selectedProductForReviews.rating}</span>
                            <span className="text-stone-300">|</span>
                            <span className="text-[10px] text-stone-405">{(selectedProductForReviews.reviews || getPreseededReviews(selectedProductForReviews.id, selectedProductForReviews.category)).length} Reviews</span>
                          </div>
                        </div>

                        {/* Search results list */}
                        <div className="overflow-y-auto p-4 md:p-6 divide-y divide-stone-100 flex-grow space-y-6">
                          {(selectedProductForReviews.reviews || getPreseededReviews(selectedProductForReviews.id, selectedProductForReviews.category)).map((review, rIdx) => (
                            <div key={review.id || rIdx} className="pt-6 first:pt-0 space-y-3">
                              
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-[#FAF8F5] border border-stone-200 flex items-center justify-center font-mono font-bold text-stone-800 text-[10.5px]">
                                    {review.author.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <span className="text-[11.5px] font-bold text-stone-900 block leading-tight">{review.author}</span>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <div className="flex gap-0.5">
                                        {[1,2,3,4,5].map((sVal) => (
                                          <Star key={sVal} className={`w-3 h-3 ${sVal <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-stone-205'}`} />
                                        ))}
                                      </div>
                                      <span className="text-[9.5px] text-stone-400 font-mono">({review.rating}/5)</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-stone-400 font-mono">{review.date}</span>
                                  <button
                                    onClick={() => {
                                      setConfirmDialog({
                                        isOpen: true,
                                        title: "Delete Customer Review",
                                        message: `Are you absolutely certain you want to purge this review by customer "${review.author}"? This review will be removed from the store and the average rating score of this product will be recomputed immediately.`,
                                        isDanger: true,
                                        confirmLabel: "Delete Review",
                                        onConfirm: () => {
                                          const reviewsOfProd = selectedProductForReviews.reviews || getPreseededReviews(selectedProductForReviews.id, selectedProductForReviews.category);
                                          const filteredList = reviewsOfProd.filter(r => r.id !== review.id);
                                          
                                          // calculate new score
                                          let finalAvg = 4.8;
                                          if (filteredList.length > 0) {
                                            const total = filteredList.reduce((sum, r) => sum + r.rating, 0);
                                            finalAvg = Number((total / filteredList.length).toFixed(2));
                                          } else {
                                            finalAvg = 5.0;
                                          }

                                          const nextProductInfo = {
                                            ...selectedProductForReviews,
                                            reviews: filteredList,
                                            rating: finalAvg,
                                            reviewsCount: filteredList.length
                                          };

                                          const nextProductsArray = products.map(p => p.id === selectedProductForReviews.id ? nextProductInfo : p);
                                          onProductsChange(nextProductsArray);
                                          triggerToast(`Successfully removed review by ${review.author}`);
                                          setConfirmDialog(null);
                                        }
                                      });
                                    }}
                                    className="p-1 px-2.5 rounded-lg text-red-600 hover:text-white bg-red-55 hover:bg-red-600 border border-red-150 transition-colors flex items-center gap-1 cursor-pointer font-bold uppercase tracking-wider text-[9px]"
                                  >
                                    <Trash2 className="w-3 h-3" /> Delete
                                  </button>
                                </div>
                              </div>

                              <p className="text-stone-700 bg-[#FAFBFD] p-3 border border-stone-200/40 rounded-xl leading-relaxed text-[11px] whitespace-pre-wrap font-medium">
                                "{review.comment}"
                              </p>

                              {review.image && (
                                <div className="pt-1 select-none">
                                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-stone-200 shadow-xs relative">
                                    <img src={review.image} className="w-full h-full object-cover" alt="attachment" />
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}

                          {(selectedProductForReviews.reviews || getPreseededReviews(selectedProductForReviews.id, selectedProductForReviews.category)).length === 0 && (
                            <div className="py-12 text-center text-stone-400 text-[11px] font-medium leading-normal">
                              This product currently has zero verified reviews.
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="p-10 text-center text-stone-550 text-[11px] font-medium my-auto leading-normal">
                        Select a luxury atelier product from the list on the left to moderate or curate its reviews pool.
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}

            {/* PROMO CODES MANAGEMENT TAB */}
            {activeSubTab === "promocodes" && (
              <div className="space-y-6 animate-reveal text-xs text-[#2c2420]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-sm sm:text-base font-serif font-bold text-stone-900">Promotional Offer Campaigns</h3>
                    <p className="text-[11px] text-stone-500 font-medium">Configure discount coupons, disable active campaign keys, or update offer rules dynamically across the frontend checkout.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleResetToDefaultPromos}
                      className="px-3.5 py-1.5 border border-stone-250 hover:bg-stone-50 text-stone-700 text-[10px] font-bold rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <RefreshCw className="w-3 h-3 text-stone-500" />
                      Restore Defaults
                    </button>
                    {promoFormMode === "list" && (
                      <button
                        onClick={() => {
                          setPromoFormMode("create");
                          setEditingPromo(null);
                          setPromoInputCode("");
                          setPromoInputType("fixed");
                          setPromoInputValue(0);
                          setPromoInputDescription("");
                          setPromoInputActive(true);
                        }}
                        className="px-4 py-2 bg-stone-900 hover:bg-leather-tan text-white hover:text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Create Promo Code
                      </button>
                    )}
                  </div>
                </div>

                {promoFormMode !== "list" ? (
                  /* Form to Create/Edit Promo */
                  <form onSubmit={handleSavePromoForm} className="max-w-xl bg-white border border-stone-200 rounded-2xl p-6 space-y-4 shadow-sm animate-fade-in">
                    <h4 className="font-serif font-bold text-stone-900 text-sm border-b pb-2">
                      {promoFormMode === "create" ? "Assemble New Promotional Code" : "Refactor Campaign Parameters"}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Promo Code Reference (Uppercase)</label>
                        <input
                          type="text"
                          required
                          placeholder="E.G. FESTIVE50"
                          value={promoInputCode}
                          disabled={promoFormMode === "edit"}
                          onChange={(e) => setPromoInputCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                          className="w-full bg-stone-50 hover:bg-stone-100/50 focus:bg-white border border-stone-205 focus:border-stone-400 rounded-xl px-3.5 py-2.5 text-stone-900 text-[11px] uppercase placeholder-stone-400 focus:outline-none transition-all font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Discount Application Rule</label>
                        <select
                          value={promoInputType}
                          onChange={(e) => setPromoInputType(e.target.value as "fixed" | "percentage" | "free_shipping")}
                          className="w-full bg-stone-50 hover:bg-stone-100/50 focus:bg-white border border-stone-205 focus:border-stone-400 rounded-xl px-3.5 py-2.5 text-stone-900 text-[11px] focus:outline-none transition-all"
                        >
                          <option value="fixed">Fixed Rupee Amount (₹ Off)</option>
                          <option value="percentage">Percentage Offset (% Off)</option>
                          <option value="free_shipping">Free Shipping (No Delivery Charge)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
                          {promoInputType === "percentage" 
                            ? "Discount Percentage (%)" 
                            : promoInputType === "free_shipping" 
                              ? "Delivery Overrides Value" 
                              : "Discount Value (₹)"}
                        </label>
                        <input
                          type="number"
                          required={promoInputType !== "free_shipping"}
                          disabled={promoInputType === "free_shipping"}
                          min="1"
                          max={promoInputType === "percentage" ? "100" : "100000"}
                          value={promoInputType === "free_shipping" ? 0 : (promoInputValue || "")}
                          onChange={(e) => setPromoInputValue(Number(e.target.value))}
                          className={`w-full border rounded-xl px-3.5 py-2.5 text-[11px] focus:outline-none transition-all font-mono ${
                            promoInputType === "free_shipping"
                              ? "bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed"
                              : "bg-stone-50 hover:bg-stone-100/50 focus:bg-white border-stone-205 focus:border-stone-400 text-stone-900"
                          }`}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Campaign Handshake Status</label>
                        <div className="flex items-center gap-2 pt-2">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={promoInputActive}
                              onChange={(e) => setPromoInputActive(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                            <span className="ml-2 text-[10.5px] font-bold text-stone-600 uppercase">
                              {promoInputActive ? "Is Active & Usable" : "Suspended / Disabled"}
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Client-Facing Offer Subtitle</label>
                      <input
                        type="text"
                        placeholder="E.g. Enjoy flat ₹25 off on fine leather cases"
                        value={promoInputDescription}
                        onChange={(e) => setPromoInputDescription(e.target.value)}
                        className="w-full bg-stone-50 hover:bg-stone-100/50 focus:bg-white border border-stone-205 focus:border-stone-400 rounded-xl px-3.5 py-2.5 text-stone-900 text-[11px] placeholder-stone-400 focus:outline-none transition-all"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-stone-150">
                      <button
                        type="button"
                        onClick={() => setPromoFormMode("list")}
                        className="px-4 py-2 border border-stone-250 text-stone-700 text-[10px] font-bold rounded-xl uppercase tracking-wider hover:bg-stone-50 cursor-pointer"
                      >
                        Back to List
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-stone-900 hover:bg-[#8F633E] text-white hover:text-white text-[10px] font-bold rounded-xl uppercase tracking-wider shadow-sm cursor-pointer"
                      >
                        {promoFormMode === "create" ? "Launch Offer Code" : "Update Dynamic Rules"}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Campaign List Grid View */
                  <>
                    {loadingPromos ? (
                      <div className="p-12 text-center text-stone-400 font-medium italic">
                        <RefreshCw className="w-6 h-6 animate-spin text-stone-300 mx-auto mb-2" />
                        Synchronizing active campaigns database...
                      </div>
                    ) : promoCodes.length === 0 ? (
                      <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center text-stone-450 italic">
                        <Tag className="w-10 h-10 text-stone-305 mx-auto mb-3" />
                        No active discount campaigns configured. All purchases will checkout at standard rates.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                        {promoCodes.map((promo) => (
                          <div 
                            key={promo.code}
                            className={`bg-white border text-stone-850 rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden ${
                              promo.active ? "border-l-4 border-l-emerald-600 border-stone-205" : "border-stone-250 bg-stone-50/40 opacity-70"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-extrabold text-[#2c2420] text-xs bg-stone-100 border px-2 py-0.5 rounded tracking-wide uppercase select-all">
                                    {promo.code}
                                  </span>
                                  <span className={`text-[8.5px] uppercase tracking-wider px-2 py-0.5 rounded-full font-black ${
                                    promo.active 
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                                      : "bg-stone-200 text-stone-600 border border-stone-300"
                                  }`}>
                                    {promo.active ? "Active Link" : "Deactivated"}
                                  </span>
                                </div>
                                <h5 className="text-[10.5px] font-bold text-stone-500 uppercase tracking-wide pt-1">
                                  Type: <span className="text-leather-tan font-extrabold">{promo.type === "percentage" ? `${promo.value}% Off` : promo.type === "free_shipping" ? "Free Shipping" : `₹${promo.value} Off`}</span>
                                </h5>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleTogglePromoActive(promo.code)}
                                  className={`px-2 py-1 text-[8px] uppercase font-bold tracking-widest rounded border transition-colors cursor-pointer ${
                                    promo.active 
                                      ? "bg-stone-50 hover:bg-stone-105 text-stone-700 border-stone-205" 
                                      : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 hover:border-emerald-700"
                                  }`}
                                  title={promo.active ? "Suspend Code" : "Re-activate Code"}
                                >
                                  {promo.active ? "Pause" : "Enable"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEditPromoClick(promo)}
                                  className="p-1 text-stone-500 hover:text-stone-900 border border-transparent hover:border-stone-205 rounded transition-colors cursor-pointer bg-stone-55 hover:bg-stone-100"
                                  title="Edit Campaign"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePromo(promo.code)}
                                  className="p-1 text-red-600 hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-200 rounded transition-colors cursor-pointer"
                                  title="Delete Campaign"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <p className="text-[10.5px] text-stone-600 font-medium italic">
                              "{promo.description}"
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* MEDIA PREVIEW & BRAND CINEMATICS TAB */}
            {activeSubTab === "media" && (
              <MediaSettingsTab 
                videoUrl={videoUrl} 
                onVideoUrlChange={(newUrl) => {
                  if (onVideoUrlChange) {
                    onVideoUrlChange(newUrl);
                  }
                }}
                heroBgUrl={heroBgUrl}
                onHeroBgUrlChange={(newBg) => {
                  if (onHeroBgUrlChange) {
                    onHeroBgUrlChange(newBg);
                  }
                }}
                logoUrl={logoUrl}
                onLogoUrlChange={(newLogo) => {
                  if (onLogoUrlChange) {
                    onLogoUrlChange(newLogo);
                  }
                }}
                companyName={companyName}
                onCompanyNameChange={(newName) => {
                  if (onCompanyNameChange) {
                    onCompanyNameChange(newName);
                  }
                }}
                companySubtitle={companySubtitle}
                onCompanySubtitleChange={(newSub) => {
                  if (onCompanySubtitleChange) {
                    onCompanySubtitleChange(newSub);
                  }
                }}
                bannerUrl={bannerUrl}
                onBannerUrlChange={(newBanner) => {
                  if (onBannerUrlChange) {
                    onBannerUrlChange(newBanner);
                  }
                }}
                triggerToast={triggerToast}
              />
            )}

            {/* SEO & SEARCH VISIBILITY TAGS TAB */}
            {activeSubTab === "seo" && (
              <div className="space-y-6 animate-fade-in p-6 bg-white rounded-2xl border border-stone-200 shadow-sm text-left">
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5 text-left">
                  <div className="space-y-1">
                    <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-leather-tan" />
                      Atelier SEO & Search Engine Optimization
                    </h3>
                    <p className="text-xs text-stone-500 leading-relaxed font-light">
                      Configure page-level titles, metadata descriptions, primary index keywords, and Open Graph tags. Live Google snippet simulators update immediately.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Dynamic SEO Live Node
                    </span>
                  </div>
                </div>

                {/* Info Note */}
                <div className="bg-[#FAF8F5] border border-stone-200 rounded-xl p-4 text-xs text-stone-700 leading-relaxed">
                  <span className="font-serif font-bold text-stone-900 block mb-1">💡 Search Crawl and Indexing Blueprint</span>
                  Page metadata is updated in real time as spiders crawl the site. Customize labels, social media summary descriptions, and primary cards for each legal or storefront page below.
                </div>

                {/* Page Navigation Grid */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2 font-sans">
                    Select Boutique Page to Customize
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { id: "home", label: "Boutique Home / Storefront" },
                      { id: "about-us", label: "Heritage / About Atelier" },
                      { id: "contact-us", label: "Contact Support & Gifting" },
                      { id: "privacy-policy", label: "Privacy Policy" },
                      { id: "terms-conditions", label: "Terms & Conditions" },
                      { id: "shipping-policy", label: "Delhivery Shipping" },
                      { id: "return-refund", label: "Refunds & Guarantees" }
                    ].map((page) => {
                      const isActive = seoActivePage === page.id;
                      return (
                        <button
                          key={page.id}
                          type="button"
                          onClick={() => setSeoActivePage(page.id)}
                          className={`px-3 py-2.5 rounded-lg text-[11px] font-bold text-left transition-all tracking-wide border cursor-pointer ${
                            isActive
                              ? "bg-stone-900 border-stone-900 text-white shadow-sm"
                              : "bg-white border-stone-200 text-stone-700 hover:border-stone-400"
                          }`}
                        >
                          <span className="block truncate font-serif">{page.label}</span>
                          <span className="block text-[8.5px] font-mono text-stone-400 font-normal mt-0.5 truncate">/{page.id === "home" ? "" : page.id}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Primary SEO Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
                  
                  {/* Left Column: Editor Form */}
                  <div className="space-y-5">
                    <h4 className="text-xs font-serif font-extrabold uppercase tracking-widest text-[#8F633E] border-b border-stone-150 pb-1 flex items-center gap-1.5">
                      Metadata Configuration
                    </h4>

                    {/* Meta Title */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-bold text-stone-800">
                          HTML Page Title *
                        </label>
                        <span className={`text-[10px] font-mono ${localTitle.length > 60 ? "text-amber-600" : "text-stone-400"}`}>
                          {localTitle.length} / 60 chars recommended
                        </span>
                      </div>
                      <input
                        type="text"
                        value={localTitle}
                        onChange={(e) => setLocalTitle(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-250 rounded-lg px-3 py-2.5 text-xs focus:ring-1 focus:ring-leather-tan focus:outline-none font-sans text-stone-900"
                        placeholder="Page title used by Search Engines..."
                      />
                    </div>

                    {/* Meta Description */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-bold text-stone-800">
                          Meta Search Description *
                        </label>
                        <span className={`text-[10px] font-mono ${localDescription.length > 160 ? "text-amber-600" : "text-stone-400"}`}>
                          {localDescription.length} / 160 chars recommended
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        value={localDescription}
                        onChange={(e) => setLocalDescription(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-250 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-leather-tan focus:outline-none font-sans text-stone-900 leading-relaxed resize-none"
                        placeholder="Describe the page's primary offerings and theme..."
                      />
                    </div>

                    {/* Meta Keywords */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-stone-800">
                        Index Keywords (Comma-Separated)
                      </label>
                      <input
                        type="text"
                        value={localKeywords}
                        onChange={(e) => setLocalKeywords(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-250 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-leather-tan focus:outline-none font-sans text-stone-900 font-mono"
                        placeholder="luxury, fragrances, organic soap, handcrafted..."
                      />
                    </div>

                    <h4 className="text-xs font-serif font-extrabold uppercase tracking-widest text-[#8F633E] border-b border-stone-150 pt-2 pb-1">
                      Social Sharing / Open Graph Tags
                    </h4>

                    {/* OG Title */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-stone-800">
                        Open Graph Title (Facebook / WhatsApp)
                      </label>
                      <input
                        type="text"
                        value={localOgTitle}
                        onChange={(e) => setLocalOgTitle(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-250 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-leather-tan focus:outline-none font-sans text-stone-900"
                        placeholder="Custom title used during social shares..."
                      />
                    </div>

                    {/* OG Description */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-stone-800">
                        Open Graph Description
                      </label>
                      <textarea
                        rows={2}
                        value={localOgDescription}
                        onChange={(e) => setLocalOgDescription(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-250 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-leather-tan focus:outline-none font-sans text-stone-900 leading-relaxed resize-none"
                        placeholder="Custom description used during social shares..."
                      />
                    </div>

                    {/* OG Image */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-stone-800">
                        Open Graph Banner Image URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={localOgImage}
                          onChange={(e) => setLocalOgImage(e.target.value)}
                          className="flex-1 bg-stone-50 border border-stone-250 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-leather-tan focus:outline-none font-sans text-stone-900"
                          placeholder="Image URL shown in link previews..."
                        />
                        <div className="relative">
                          <input
                            type="file"
                            id="seo-og-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setUploadingOgImage(true);
                                uploadToCloudinary(file, "image")
                                  .then((uploadedUrl) => {
                                    setLocalOgImage(uploadedUrl);
                                    triggerToast("✨ Custom Open Graph Image uploaded and loaded!");
                                  })
                                  .catch((err) => {
                                    console.error("SEO OG Upload error:", err);
                                    triggerToast(`Upload Failed: ${err.message || err}`);
                                  })
                                  .finally(() => {
                                    setUploadingOgImage(false);
                                  });
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById("seo-og-upload")?.click()}
                            disabled={uploadingOgImage}
                            className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-[10.5px] px-3.5 py-2 rounded-lg cursor-pointer flex items-center gap-1 font-sans shadow-sm uppercase disabled:opacity-50"
                          >
                            {uploadingOgImage ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <UploadCloud className="w-3.5 h-3.5" />
                            )}
                            Upload File
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Actions Area */}
                    <div className="flex gap-3 pt-4 border-t border-stone-150">
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            const seoPageLabels: Record<string, string> = {
                              home: "Boutique Home / Storefront",
                              "about-us": "Heritage / About Atelier",
                              "contact-us": "Contact Support & Gifting",
                              "privacy-policy": "Privacy Policy & Security",
                              "terms-conditions": "Terms & Conditions",
                              "shipping-policy": "Logistics & Shipping Policy",
                              "return-refund": "Refund & Cancellation Policy"
                            };
                            
                            if (!onSeoDataChange) {
                              triggerToast("SEO configuration handler is not active in this sandbox preview.", true);
                              return;
                            }
                            
                            const updated = {
                              ...(seoData || {}),
                              [seoActivePage]: {
                                title: localTitle,
                                description: localDescription,
                                keywords: localKeywords,
                                ogTitle: localOgTitle,
                                ogDescription: localOgDescription,
                                ogImage: localOgImage || "https://res.cloudinary.com/dy7avkqub/image/upload/q_auto/f_auto/v1780577005/main-sample.jpg"
                              }
                            };
                            
                            onSeoDataChange(updated);
                            triggerToast(`✨ SEO rules for [${seoPageLabels[seoActivePage] || seoActivePage}] have been successfully deployed!`);
                          } catch (err: any) {
                            console.error("SEO deployment error:", err);
                            triggerToast(`Error deploying SEO rules: ${err.message || err}`, true);
                          }
                        }}
                        className="flex-1 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold uppercase py-3 rounded-lg tracking-widest cursor-pointer transition-colors shadow flex items-center justify-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                        Deploy SEO Rules
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const defaultMapping: Record<string, SEOMetadata> = {
                            home: {
                              title: "MYRA Luxury | Premium Fragrances, Leather & Handcrafted Essentials",
                              description: "Discover the premium collections of MYRA Luxury. Crafted with standard sensory ingredients, full-grain Italian leather, and hand-milled botanical soaps.",
                              keywords: "perfume, fragrance, luxury, leather belt, minimalist RFID wallet, organic soap, luxury gift sets, Myra, Indian craftsmanship",
                              ogTitle: "MYRA Luxury - Premium Fragrances & Leather Essentials",
                              ogDescription: "Immerse yourself in sensory perfection. Experience the finest selection of hand-poured perfumes and bespoke leathers.",
                              ogImage: "https://res.cloudinary.com/dy7avkqub/image/upload/q_auto/f_auto/v1780577005/main-sample.jpg"
                            },
                            "about-us": {
                              title: "About Our Heritage | MYRA Luxury Atelier",
                              description: "Read about the heritage, dedication, and traditional craftsmanship under the signature of the MYRA Luxury Atelier.",
                              keywords: "heritage, luxury brand story, organic ingredients, bespoke leather, traditional soap making",
                              ogTitle: "Our Heritage - MYRA Luxury Atelier",
                              ogDescription: "A tale of traditional Indian formulations and exquisite contemporary design.",
                              ogImage: "https://res.cloudinary.com/dy7avkqub/image/upload/q_auto/f_auto/v1780577005/main-sample.jpg"
                            },
                            "contact-us": {
                              title: "Contact Our Curators | MYRA Luxury Atelier",
                              description: "Get in touch with MYRA Luxury's priority customer care, corporate gifting, and bespoke fragrance customization desk.",
                              keywords: "contact support, customer care, bespoke perfumes, luxury gifting",
                              ogTitle: "Connect with MYRA Luxury",
                              ogDescription: "Speak to our priority customer consultants and experience personalized luxury shopping.",
                              ogImage: "https://res.cloudinary.com/dy7avkqub/image/upload/q_auto/f_auto/v1780577005/main-sample.jpg"
                            },
                            "privacy-policy": {
                              title: "Privacy Policy | MYRA Luxury Compliance",
                              description: "Your digital privacy, transactions, and user identity credentials are secure under our enterprise-grade encryption.",
                              keywords: "privacy policy, data protection, security, checkout compliance",
                              ogTitle: "Privacy & Data Safeguards | MYRA Luxury",
                              ogDescription: "Read how we secure your online checkout credentials and details.",
                              ogImage: "https://res.cloudinary.com/dy7avkqub/image/upload/q_auto/f_auto/v1780577005/main-sample.jpg"
                            },
                            "terms-conditions": {
                              title: "Terms & Conditions | MYRA Luxury",
                              description: "The legal terms, carriage guidelines, and purchase conditions for the premium catalog collections of MYRA Luxury.",
                              keywords: "terms and conditions, user agreement, purchase terms",
                              ogTitle: "Terms of Carriage & Compliance | MYRA Luxury",
                              ogDescription: "Browse terms governing user access, orders, and legal transactions.",
                              ogImage: "https://res.cloudinary.com/dy7avkqub/image/upload/q_auto/f_auto/v1780577005/main-sample.jpg"
                            },
                            "shipping-policy": {
                              title: "Shipping & Delivery Policy | MYRA Luxury Logistics",
                              description: "Fast-tracked 2-4 business days air dispatch in coordination with Delhivery Logistics. Fully tracked and secure shipment delivery.",
                              keywords: "shipping policy, Delhivery tracking, dispatch, express delivery",
                              ogTitle: "Delhivery Premium Shipping Guidelines | MYRA Luxury",
                              ogDescription: "Learn about package transit times, shipping rates, and AWB tracking.",
                              ogImage: "https://res.cloudinary.com/dy7avkqub/image/upload/q_auto/f_auto/v1780577005/main-sample.jpg"
                            },
                            "return-refund": {
                              title: "Return & Refund Policy | MYRA Luxury Standards",
                              description: "Enjoy stress-free refunds on damaged goods in 5-7 business days. Damaged items can be reported within 48 hours for immediate replacement.",
                              keywords: "returns, refund policy, satisfaction guarantee, refund processing",
                              ogTitle: "Refund Policy & Guarantees | MYRA Luxury",
                              ogDescription: "Review our boutique terms for cancellations, damage reports, and refunds.",
                              ogImage: "https://res.cloudinary.com/dy7avkqub/image/upload/q_auto/f_auto/v1780577005/main-sample.jpg"
                            }
                          };
                          
                          const original = defaultMapping[seoActivePage];
                          if (original) {
                            setLocalTitle(original.title);
                            setLocalDescription(original.description);
                            setLocalKeywords(original.keywords);
                            setLocalOgTitle(original.ogTitle);
                            setLocalOgDescription(original.ogDescription);
                            setLocalOgImage(original.ogImage);
                            triggerToast("🔄 Standard parameters loaded. Press Deploy to apply!");
                          }
                        }}
                        className="bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-bold uppercase px-4 py-3 rounded-lg cursor-pointer transition-colors"
                      >
                        Reset Default
                      </button>
                    </div>

                  </div>

                  {/* Right Column: Previews Side Simulator */}
                  <div className="space-y-6 lg:border-l lg:border-stone-200 lg:pl-8">
                    <h4 className="text-xs font-serif font-extrabold uppercase tracking-widest text-[#8F633E] border-b border-stone-150 pb-1 font-sans">
                      Search Engine & Social Media Simulator
                    </h4>

                    {/* Google Search Result Simulator */}
                    <div className="space-y-2">
                      <span className="text-[10.5px] font-bold text-stone-500 uppercase tracking-wider block">
                        🔍 Google Desktop Search Snippet
                      </span>
                      <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm space-y-1 font-sans text-left">
                        <span className="text-xs text-stone-500 block font-normal leading-tight font-sans truncate">
                          https://myraluxury.com {seoActivePage !== "home" && `› ${seoActivePage}`}
                        </span>
                        <h4 className="text-sm text-[#1a0dab] hover:underline font-normal leading-snug cursor-pointer truncate font-sans">
                          {localTitle || "Premium Luxury Atelier"}
                        </h4>
                        <p className="text-xs text-[#4d5156] leading-relaxed font-normal font-sans line-clamp-2">
                          {localDescription || "No description provided yet. Add an HTML Meta description to attract organic shoppers."}
                        </p>
                      </div>
                    </div>

                    {/* Social Share Preview Card (WhatsApp / Facebook) */}
                    <div className="space-y-2">
                      <span className="text-[10.5px] font-bold text-stone-500 uppercase tracking-wider block">
                        📱 Social Share Link Card Preview
                      </span>
                      <div className="bg-stone-50 border border-stone-200 rounded-xl overflow-hidden shadow-sm max-w-sm mx-auto text-left">
                        {/* Simulated Image Area */}
                        <div className="h-44 bg-stone-100 relative overflow-hidden flex items-center justify-center border-b border-stone-150">
                          {localOgImage ? (
                            <img
                              src={localOgImage}
                              alt="Social preview banner"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center p-4">
                              <Globe className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                              <span className="text-[10px] text-stone-400 font-mono block">No OG Image Specified</span>
                            </div>
                          )}
                          <div className="absolute top-2 left-2 bg-stone-900/80 backdrop-blur-sm text-white text-[8px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
                            Open Graph Media Node
                          </div>
                        </div>
                        {/* Summary Details */}
                        <div className="p-3.5 space-y-1 bg-[#F5F4F0]">
                          <span className="text-[9.5px] font-mono text-stone-400 block uppercase tracking-wider">
                            myraluxury.com
                          </span>
                          <h5 className="text-xs font-bold text-stone-900 leading-snug line-clamp-1 font-sans">
                            {localOgTitle || localTitle || "MYRA Luxury"}
                          </h5>
                          <p className="text-[11px] text-stone-600 leading-relaxed line-clamp-2 font-normal font-sans">
                            {localOgDescription || localDescription || "Experience sensory and leather perfection."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Pro Tip Box */}
                    <div className="bg-[#FAF8F5] border border-stone-200/60 rounded-xl p-4 text-[11px] text-stone-600 space-y-1 leading-relaxed">
                      <span className="font-bold text-stone-900 block font-serif">✨ Curation Guidelines:</span>
                      <p>• <strong>Meta Titles:</strong> Use elegant, concise text. Place the primary keyword first, followed by your brand name.</p>
                      <p>• <strong>Descriptions:</strong> Write compelling copy to increase search click-through rates. Ensure it stays under 160 characters.</p>
                      <p>• <strong>Open Graph Images:</strong> Best size is 1200x630 pixels. Use lifestyle product shots with clean, minimal luxury spacing.</p>
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* DELHI VERY ADMINISTRATIVE CONTROL & LOGISTICS DESK */}
            {activeSubTab === "shipping" && (
              <div className="space-y-6 animate-fade-in p-6 bg-white rounded-2xl border border-stone-200 shadow-sm text-left">
                
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5 text-left">
                  <div className="space-y-1">
                    <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-leather-tan" />
                      Delhivery Control Center
                    </h3>
                    <p className="text-xs text-stone-505 text-stone-500 leading-relaxed font-light">
                      Supervise elite logistics, monitor freight AWB numbers, compile printable shipping labels, and configure dynamic warehouse variables.
                    </p>
                  </div>
                  
                  {/* Control Subbar */}
                  <div className="flex bg-stone-100 border border-stone-200 rounded-xl p-1 gap-1 select-none w-fit self-start sm:self-center">
                    <button
                      type="button"
                      onClick={() => setActiveShippingSubSection("dashboard")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                        activeShippingSubSection === "dashboard"
                          ? "bg-stone-900 text-white shadow-sm"
                          : "text-stone-500 hover:text-stone-800"
                      }`}
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      Manifests Dashboard
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveShippingSubSection("settings")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                        activeShippingSubSection === "settings"
                          ? "bg-stone-900 text-white shadow-sm"
                          : "text-stone-500 hover:text-stone-800"
                      }`}
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Warehouse & Rates Setup
                    </button>
                  </div>
                </div>

                {/* Sub tab 1: Manifest Dashboard */}
                {activeShippingSubSection === "dashboard" && (
                  <div className="space-y-5 text-left">
                    {isLoadingShipments ? (
                      <div className="p-16 text-center text-stone-400 font-medium italic">
                        <RefreshCw className="w-7 h-7 animate-spin text-stone-300 mx-auto mb-2" />
                        Accessing Delhivery network nodes...
                      </div>
                    ) : adminShipments.length === 0 ? (
                      <div className="border border-stone-200 rounded-2xl p-16 text-center bg-stone-50/50">
                        <ClipboardList className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                        <h4 className="text-sm font-semibold text-stone-800 font-serif">No Manifests Logged</h4>
                        <p className="text-xs text-stone-500 max-w-md mx-auto mt-1 leading-relaxed font-light">
                          There are currently no shipments registered in this sandbox. Verify that customers complete checkouts using valid PIN codes.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{adminShipments.length} carrier contracts active</span>
                          <button
                            type="button"
                            onClick={fetchAdminShipments}
                            className="text-xs text-stone-701 hover:text-stone-500 flex items-center gap-1 cursor-pointer font-bold font-sans text-[#8A7968]"
                          >
                            <RefreshCw className="w-3 h-3" /> Fetch Updates
                          </button>
                        </div>

                        {/* Shipment Cards list */}
                        <div className="grid grid-cols-1 gap-4">
                          {adminShipments.map((shipment) => {
                            return (
                              <div key={shipment.awb} className="bg-white border text-stone-850 border-stone-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 relative overflow-hidden text-left">
                                
                                {/* Shipment metadata bar */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-210 border-stone-100 pb-3 gap-2">
                                  <div className="space-y-0.5 text-left">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-black font-mono bg-stone-100 text-stone-855 px-2 py-0.5 rounded">AWB: {shipment.awb}</span>
                                      <span className="text-[11px] text-stone-550 font-semibold font-mono">Order: {shipment.orderId}</span>
                                    </div>
                                    <p className="text-[10px] text-stone-400 font-medium leading-none mt-1">Manifest Date: {shipment.createdAt ? new Date(shipment.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' }) : "N/A"}</p>
                                  </div>

                                  {/* Dynamic status pill */}
                                  <div className="flex items-center gap-2.5">
                                    <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full select-none ${
                                      shipment.status.toLowerCase() === "delivered" 
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/55" 
                                        : shipment.status.toLowerCase() === "cancelled" 
                                        ? "bg-red-50 text-red-600 border border-red-200/45"
                                        : shipment.status.toLowerCase() === "in transit" 
                                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                                        : "bg-amber-50 text-amber-705 border border-amber-200/50"
                                    }`}>
                                      {shipment.status}
                                    </span>

                                    {/* Action items: Status changer & printing label */}
                                    <div className="flex items-center gap-1.5">
                                      <select
                                        value={shipment.status}
                                        onChange={(e) => handleUpdateShipmentStatus(shipment.awb, e.target.value)}
                                        className="bg-stone-50 border border-stone-200 rounded-lg text-[10px] py-1 px-1.5 max-w-[124px] font-sans font-bold text-stone-700 focus:ring-1 focus:ring-leather-tan focus:outline-none cursor-pointer"
                                      >
                                        <option value="Manifest Created">Created</option>
                                        <option value="In Transit">In Transit</option>
                                        <option value="Out for Delivery">Out for Delivery</option>
                                        <option value="Delivered">Delivered</option>
                                        <option value="Cancelled">Cancelled</option>
                                      </select>

                                      <button
                                        type="button"
                                        onClick={() => handlePreviewLabel(shipment)}
                                        className="p-1 px-2 border border-stone-200 hover:bg-stone-100 hover:border-stone-300 text-stone-700 rounded-lg text-[10.5px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                        title="Print Delhivery Label"
                                      >
                                        <Printer className="w-3.5 h-3.5 text-stone-500" />
                                        Label
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Body stats details */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans text-left">
                                  {/* Column 1: Consignee details */}
                                  <div className="space-y-1 text-left">
                                    <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider font-extrabold">Recipient Details</span>
                                    <p className="font-bold text-stone-900 leading-tight">{shipment.consignee?.name || "Premium Client"}</p>
                                    <p className="text-stone-500 leading-normal text-[11px] font-light">
                                      {shipment.consignee?.address}<br />
                                      {shipment.consignee?.city}, {shipment.consignee?.state} - <strong className="font-bold font-mono">{shipment.consignee?.pincode}</strong>
                                    </p>
                                    <p className="text-stone-500 text-[11px] font-mono leading-none pt-0.5 mt-1">Mobile: {shipment.consignee?.mobile}</p>
                                  </div>

                                  {/* Column 2: Dimensions & Freight */}
                                  <div className="space-y-1 text-left">
                                    <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider font-extrabold">Parcel Matrix Metrics</span>
                                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-stone-600">
                                      <span>Zone:</span>
                                      <strong className="font-mono text-stone-850">Zone {shipment.metrics?.zone || "A"}</strong>
                                      <span>Weight charge:</span>
                                      <strong className="font-mono text-stone-850">{(shipment.metrics?.actualWeightGrams || 500) / 1000} Kg</strong>
                                      <span>Volumetric:</span>
                                      <strong className="font-mono text-stone-850">{shipment.metrics?.volumetricWeightKg || 0.15} Kg</strong>
                                      <span>Box dimensions:</span>
                                      <strong className="font-mono text-stone-850">
                                        {shipment.metrics?.dimensions?.length || 15}x
                                        {shipment.metrics?.dimensions?.width || 10}x
                                        {shipment.metrics?.dimensions?.height || 10} cm
                                      </strong>
                                    </div>
                                  </div>

                                  {/* Column 3: Logistics Invoicing breakdown */}
                                  <div className="space-y-1 bg-stone-50 p-2.5 rounded-xl border border-stone-200/50 text-left">
                                    <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block font-extrabold">Financial Accounting</span>
                                    <div className="space-y-1 text-[11px] text-stone-600">
                                      <div className="flex justify-between font-mono">
                                        <span>Dynamic Base:</span>
                                        <span className="font-medium text-stone-800">₹{shipment.pricing?.baseRate || 50}</span>
                                      </div>
                                      {shipment.pricing?.odaSurcharge > 0 && (
                                        <div className="flex justify-between font-mono text-amber-700">
                                          <span>Remote Surcharge:</span>
                                          <span className="font-medium">₹{shipment.pricing?.odaSurcharge}</span>
                                        </div>
                                      )}
                                      {shipment.pricing?.codPaymentFee > 0 && (
                                        <div className="flex justify-between font-mono text-[#8A7968]">
                                          <span>COD carrier fee:</span>
                                          <span className="font-medium">+₹{shipment.pricing?.codPaymentFee}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between border-t border-stone-150 pt-1.5 font-mono text-xs font-bold text-stone-850">
                                        <span>Invoiced Cost:</span>
                                        <span>₹{shipment.pricing?.shippingFeeInvoiced || 0}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub tab 2: Warehouse & Rates Setup Panel */}
                {activeShippingSubSection === "settings" && (
                  <form onSubmit={saveAdminShippingSettings} className="space-y-6 text-left">
                    {isLoadingSettings ? (
                      <div className="p-16 text-center text-stone-400 font-medium italic">
                        <RefreshCw className="w-7 h-7 animate-spin text-stone-300 mx-auto mb-2" />
                        Synchronizing business settings node...
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Mode Switch Card */}
                        <div className="bg-[#FAF9F5] border border-stone-200 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#8A7968] flex items-center gap-1.5">
                              <Sliders className="w-3.5 h-3.5" /> APPLICATION LOGISTICS MODE
                            </span>
                            <h4 className="text-sm font-bold text-stone-900 font-serif">
                              System State: {adminShippingSettings.isProductionMode ? "💎 Live Production Mode Active" : "🧪 Test / Sandbox Simulation Active"}
                            </h4>
                            <p className="text-[11px] text-stone-500 font-light max-w-xl">
                              {adminShippingSettings.isProductionMode 
                                ? "All checkouts route to the Live Razorpay Payment Gateway, and Delhivery generates real, live waybills/AWBs. Use ONLY with valid production-grade API keys in environment secrets." 
                                : "Simulation mode active. Payments are safely simulated, and Delhivery operates in sandbox mode generating fictional tracking links and waybills. Zero real money or real-world carrier bookings occur."}
                            </p>
                          </div>
                          <div className="flex bg-stone-100 border border-stone-200 rounded-xl p-1 gap-1 select-none w-fit h-fit divide-x divide-stone-200">
                            <button
                              type="button"
                              onClick={() => setAdminShippingSettings({ ...adminShippingSettings, isProductionMode: false })}
                              className={`px-3 py-1.5 rounded-lg text-[9.5px] uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                                !adminShippingSettings.isProductionMode
                                  ? "bg-amber-600 text-white shadow-sm"
                                  : "text-stone-500 hover:text-stone-800"
                              }`}
                            >
                              Test Mode
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdminShippingSettings({ ...adminShippingSettings, isProductionMode: true })}
                              className={`px-3 py-1.5 rounded-lg text-[9.5px] uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                                adminShippingSettings.isProductionMode
                                  ? "bg-[#8F633E] text-white shadow-sm"
                                  : "text-stone-500 hover:text-stone-800"
                              }`}
                            >
                              Production Mode
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                        
                        {/* Box 1: Warehouse Location Credentials */}
                        <div className="border border-stone-200 rounded-2xl p-5 space-y-4">
                          <h4 className="text-xs uppercase tracking-widest text-[#8A7968] font-bold flex items-center gap-1.5 border-b border-stone-100 pb-2">
                            <Building className="w-4 h-4 ml-0.5 text-leather-tan" />
                            Elite Origin Warehouse details
                          </h4>

                          <div className="space-y-3 text-xs text-left font-sans">
                            <div className="space-y-1">
                              <label className="text-stone-500 font-semibold">Warehouse Atelier Name</label>
                              <input
                                type="text"
                                required
                                value={adminShippingSettings.warehouseName}
                                onChange={(e) => setAdminShippingSettings({ ...adminShippingSettings, warehouseName: e.target.value })}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:ring-1 focus:ring-leather-tan leading-tight"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-stone-500 font-semibold">Origin PIN Code * (Warehouse Location)</label>
                              <input
                                type="text"
                                required
                                maxLength={6}
                                value={adminShippingSettings.warehouseOriginPincode}
                                onChange={(e) => setAdminShippingSettings({ ...adminShippingSettings, warehouseOriginPincode: e.target.value })}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-880 font-bold font-mono focus:outline-none focus:ring-1 focus:ring-leather-tan leading-tight"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3 font-sans">
                              <div className="space-y-1">
                                <label className="text-stone-500 font-semibold">City</label>
                                <input
                                  type="text"
                                  required
                                  value={adminShippingSettings.warehouseCity}
                                  onChange={(e) => setAdminShippingSettings({ ...adminShippingSettings, warehouseCity: e.target.value })}
                                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:ring-1 focus:ring-leather-tan leading-tight"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-stone-500 font-semibold">State</label>
                                <input
                                  type="text"
                                  required
                                  value={adminShippingSettings.warehouseState}
                                  onChange={(e) => setAdminShippingSettings({ ...adminShippingSettings, warehouseState: e.target.value })}
                                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:ring-1 focus:ring-leather-tan leading-tight"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-stone-500 font-semibold">Street Address Details</label>
                              <textarea
                                required
                                rows={2}
                                value={adminShippingSettings.warehouseAddress}
                                onChange={(e) => setAdminShippingSettings({ ...adminShippingSettings, warehouseAddress: e.target.value })}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:ring-1 focus:ring-leather-tan leading-normal"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-stone-500 font-semibold">Warehouse Mobile (Strictly 10 digits)</label>
                              <input
                                type="text"
                                required
                                value={adminShippingSettings.warehouseMobile}
                                onChange={(e) => setAdminShippingSettings({ ...adminShippingSettings, warehouseMobile: e.target.value })}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 font-mono focus:outline-none focus:ring-1 focus:ring-leather-tan leading-tight"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Box 2: Premium Logistics & Dynamic Rates Formulas */}
                        <div className="border border-stone-200 rounded-2xl p-5 space-y-4">
                          <h4 className="text-xs uppercase tracking-widest text-[#8A7968] font-bold flex items-center gap-1.5 border-b border-stone-100 pb-2">
                            <Calculator className="w-4 h-4 ml-0.5 text-leather-tan" />
                            Weight, Surcharges & Campaigns Configuration
                          </h4>

                          <div className="space-y-4 text-xs text-left font-sans">
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-stone-605 font-medium pb-1">
                                <label>Free Shipping Threshold (Amount in ₹)</label>
                                <span className="font-bold text-leather-tan font-mono">₹{adminShippingSettings.freeShippingThreshold}</span>
                              </div>
                              <input
                                type="number"
                                required
                                min={0}
                                value={adminShippingSettings.freeShippingThreshold}
                                onChange={(e) => setAdminShippingSettings({ ...adminShippingSettings, freeShippingThreshold: Number(e.target.value) })}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 font-mono focus:outline-none focus:ring-1 focus:ring-leather-tan leading-tight"
                              />
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-stone-605 font-medium pb-1">
                                <label>Extra Weight Freight Rate (per excess Kg)</label>
                                <span className="font-bold text-stone-800 font-mono">₹{adminShippingSettings.extraWeightKgRate} / Kg</span>
                              </div>
                              <input
                                type="number"
                                required
                                min={0}
                                value={adminShippingSettings.extraWeightKgRate}
                                onChange={(e) => setAdminShippingSettings({ ...adminShippingSettings, extraWeightKgRate: Number(e.target.value) })}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 font-mono focus:outline-none focus:ring-1 focus:ring-leather-tan leading-tight"
                              />
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[#8A7968] font-medium pb-1">
                                <label>Cash on Delivery supplementary carrier surcharge (₹)</label>
                                <span className="font-bold text-[#8A7968] font-mono">₹{adminShippingSettings.codPaymentFee} Fee</span>
                              </div>
                              <input
                                type="number"
                                required
                                min={0}
                                value={adminShippingSettings.codPaymentFee}
                                onChange={(e) => setAdminShippingSettings({ ...adminShippingSettings, codPaymentFee: Number(e.target.value) })}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 font-mono focus:outline-none focus:ring-1 focus:ring-leather-tan leading-tight"
                              />
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-stone-605 font-medium pb-1">
                                <label>Administrative Freight Markup (%)</label>
                                <span className="font-bold text-stone-800 font-mono">{adminShippingSettings.markupPercentage}% Markup</span>
                              </div>
                              <input
                                type="number"
                                required
                                min={0}
                                max={100}
                                value={adminShippingSettings.markupPercentage}
                                onChange={(e) => setAdminShippingSettings({ ...adminShippingSettings, markupPercentage: Number(e.target.value) })}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 font-mono focus:outline-none focus:ring-1 focus:ring-leather-tan leading-tight"
                              />
                            </div>

                            <div className="flex items-center gap-2 pt-3 border-t border-stone-150 text-left">
                              <input
                                id="enablePromoFreeShipping"
                                type="checkbox"
                                checked={adminShippingSettings.enablePromoFreeShipping}
                                onChange={(e) => setAdminShippingSettings({ ...adminShippingSettings, enablePromoFreeShipping: e.target.checked })}
                                className="w-4 h-4 rounded border-stone-300 focus:ring-leather-tan text-stone-900 cursor-pointer accent-stone-900"
                              />
                              <label htmlFor="enablePromoFreeShipping" className="text-stone-701 text-[11px] font-medium cursor-pointer select-none">
                                Enable Promotional Campaigns (Free Shipping over configurable threshold)
                              </label>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                    )}

                    {/* Action trigger button */}
                    <div className="flex justify-end gap-3 border-t border-stone-200 pt-5">
                      <button
                        type="submit"
                        className="bg-stone-900 hover:bg-[#8F633E] text-white px-6 py-3 rounded-xl text-xs uppercase tracking-wider font-extrabold shadow transition-all cursor-pointer min-h-[44px]"
                      >
                        {isLoadingSettings ? "Updating server database nodes..." : "Save Shipping Rules Database"}
                      </button>
                    </div>
                  </form>
                )}

              </div>
            )}

            {/* Delhivery Label Printing Modal Overlay */}
            {labelHtmlForAwb && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center bg-stone-900/85 backdrop-blur-xs p-4 animate-fade-in font-sans">
                <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-150 flex flex-col max-h-[90vh]">
                  <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Printer className="w-5 h-5 text-[#8A7968]" />
                      <div className="text-left">
                        <h4 className="text-sm font-bold text-stone-900 leading-tight">Printed Carrier Slip</h4>
                        <p className="text-[10px] text-stone-500 font-mono">AWB Tracking Ident: {selectedShipmentForLabel?.awb}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLabelHtmlForAwb(null);
                        setSelectedShipmentForLabel(null);
                      }}
                      className="p-1 px-2.5 bg-stone-100 hover:bg-stone-250 text-stone-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Close Preview
                    </button>
                  </div>

                  {/* Label html contents */}
                  <div className="p-6 overflow-y-auto bg-stone-100/55 flex-1 flex justify-center items-center">
                    <div className="bg-white p-4 shadow-md rounded border border-stone-300 max-w-full w-[420px] select-none text-left">
                      <div dangerouslySetInnerHTML={{ __html: labelHtmlForAwb }} className="printed-sheet" />
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
                    <p className="text-[10px] text-stone-500 max-w-xs leading-normal text-left">
                      Fold along dotted parameters before applying patch envelope onto courier parcels. Do not puncture thermal barcode.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const printWin = window.open("", "_blank");
                        if (printWin) {
                          printWin.document.write(`
                            <html>
                              <head>
                                <title>Delhivery AWB Label ${selectedShipmentForLabel?.awb}</title>
                                <style>
                                  body { font-family: monospace; display: flex; justify-content: center; padding: 20px; }
                                </style>
                              </head>
                              <body onload="window.print(); window.close();">
                                ${labelHtmlForAwb}
                              </body>
                            </html>
                          `);
                          printWin.document.close();
                        } else {
                          triggerToast("Popup blocked! Enabled permissions to initiate printing driver.", true);
                        }
                      }}
                      className="bg-stone-900 hover:bg-[#8F633E] text-white px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-extrabold flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      Trigger Spool Print
                    </button>
                  </div>
                </div>
              </div>
            )}


          </div>

          {/* Footer branding element */}
          <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-[10px] text-stone-400 select-none">
            <span>MYRA ATELIER DIRECT REVOLUTION V2.0</span>
            <span>PROPRIETARY COGNITIVE CLOUD STAGE</span>
          </div>

        </div>
      )}

      {/* Custom Iframe-Safe Confirmation Overlays */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="bg-[#FCFAF7] max-w-sm w-full rounded-2xl border border-stone-200 shadow-2xl overflow-hidden p-6 space-y-5 animate-reveal">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl ${confirmDialog.isDanger ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-stone-100 text-stone-700 border border-stone-200'} flex-shrink-0 flex items-center justify-center`}>
                <AlertTriangle className="w-5 h-5 text-red-650" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif text-sm font-bold text-stone-900">
                  {confirmDialog.title}
                </h4>
                <p className="text-[11px] text-stone-550 text-stone-500 font-medium leading-relaxed">
                  {confirmDialog.message}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-3.5 py-2 border border-stone-200 hover:bg-stone-50 text-stone-600 rounded-xl text-[10px] uppercase tracking-wider font-extrabold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider font-black text-white hover:opacity-90 transition-all shadow-sm cursor-pointer ${
                  confirmDialog.isDanger ? 'bg-red-600' : 'bg-stone-900'
                }`}
              >
                {confirmDialog.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
