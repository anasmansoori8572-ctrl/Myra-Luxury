import React, { useState, useEffect, useRef } from "react";
import { products, storeLocations } from "./data";
import { Product, CartItem, ContactMessage, StoreLocation, SEOMetadata } from "./types";
import { ProductVisual } from "./components/ProductVisual";
import { ProductDetailModal } from "./components/ProductDetailModal";
import { CartDrawer } from "./components/CartDrawer";
import { ProfileModal } from "./components/ProfileModal";
import { AdminPortal } from "./components/AdminPortal";
import { useAuth } from "./lib/authContext";
import { db } from "./lib/firebase";
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, onSnapshot, writeBatch } from "firebase/firestore";
import { getVersionedCloudinaryUrl } from "./cloudinary";
import { 
  Search, 
  ShoppingBag, 
  User, 
  Sparkles, 
  Menu, 
  X, 
  Star, 
  ArrowRight,
  ArrowLeft, 
  Mail, 
  MapPin, 
  Phone, 
  Clock, 
  Compass, 
  Heart, 
  Send, 
  Check, 
  Instagram, 
  Youtube,
  Gift,
  Bookmark,
  ChevronRight,
  ShieldCheck,
  Flower2,
  Plus
} from "lucide-react";

export default function App() {
  const { user, profile, toggleWishlistItem } = useAuth();
  const isLocalChange = useRef<boolean>(false);

  // --- Hero Section Adaptive Background Banner Measuring ---
  const heroRef = useRef<HTMLElement>(null);
  const [heroBottom, setHeroBottom] = useState<number>(1000);

  useEffect(() => {
    const handleResize = () => {
      if (heroRef.current) {
        setHeroBottom(heroRef.current.offsetTop + heroRef.current.offsetHeight);
      }
    };
    
    handleResize();
    
    // Interval ensures any late visual elements, image loads, or font rendering adjustments are accounted for
    const interval = setInterval(handleResize, 400);
    
    const win = typeof window !== "undefined" ? window : null;
    
    if (win) {
      if ("ResizeObserver" in (win as any)) {
        const resizeObserver = new (win as any).ResizeObserver(handleResize);
        if (heroRef.current) {
          resizeObserver.observe(heroRef.current);
        }
        return () => {
          resizeObserver.disconnect();
          clearInterval(interval);
        };
      } else {
        (win as any).addEventListener("resize", handleResize);
        return () => {
          (win as any).removeEventListener("resize", handleResize);
          clearInterval(interval);
        };
      }
    }
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  // --- States ---
  const [dbProducts, setDbProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem("myra_products");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Backward compatibility upgrade: merge fresh sizeVariants from source data
          // if the cached product does not have any sizeVariants stored.
          return parsed.map((p: Product) => {
            const seedInfo = products.find((sp) => sp.id === p.id);
            if (seedInfo && seedInfo.sizeVariants && (!p.sizeVariants || p.sizeVariants.length === 0)) {
              return { ...p, sizeVariants: seedInfo.sizeVariants };
            }
            return p;
          });
        }
      }
    } catch {}
    return products;
  });

  const [orders, setOrders] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("myra_orders");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [adminOpen, setAdminOpen] = useState<boolean>(false);

  const [selectedCategory, setSelectedCategory] = useState<string>("Perfumes");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("myra_cart");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => item && item.product && typeof item.product === "object");
        }
      }
    } catch (err) {
      console.error("Error reading initial cart from localStorage:", err);
    }
    return [];
  });

  const [activeDetailProduct, setActiveDetailProduct] = useState<Product | null>(null);
  
  // Compliance pages state and SEO effects
  const [activeLegalPage, setActiveLegalPage] = useState<string | null>(null);

  const [seoData, setSeoData] = useState<Record<string, SEOMetadata>>(() => {
    try {
      const saved = localStorage.getItem("myra_seo_data");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {
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
  });

  useEffect(() => {
    const currentPageKey = activeLegalPage || "home";
    const currentSEO = seoData[currentPageKey];
    
    if (currentSEO) {
      if (activeLegalPage) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      
      document.title = currentSEO.title;
      
      // Helper to get or create a meta tag
      const setMetaTag = (attributeName: string, attributeValue: string, contentValue: string) => {
        let tag = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
        if (!tag) {
          tag = document.createElement("meta");
          tag.setAttribute(attributeName, attributeValue);
          document.head.appendChild(tag);
        }
        tag.setAttribute("content", contentValue);
      };

      // Set standard description & keywords
      setMetaTag("name", "description", currentSEO.description);
      setMetaTag("name", "keywords", currentSEO.keywords);

      // Set Open Graph tags
      setMetaTag("property", "og:title", currentSEO.ogTitle);
      setMetaTag("property", "og:description", currentSEO.ogDescription);
      setMetaTag("property", "og:image", currentSEO.ogImage);
      setMetaTag("property", "og:type", "website");
      setMetaTag("property", "og:url", window.location.href);

      // Set Twitter Card tags
      setMetaTag("name", "twitter:card", "summary_large_image");
      setMetaTag("name", "twitter:title", currentSEO.ogTitle);
      setMetaTag("name", "twitter:description", currentSEO.ogDescription);
      setMetaTag("name", "twitter:image", currentSEO.ogImage);
    }
  }, [activeLegalPage, seoData]);
  
  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState<string>("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState<boolean>(false);

  // Contact form state
  const [contactName, setContactName] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");
  const [contactEmail, setContactEmail] = useState<string>("");
  const [contactInterest, setContactInterest] = useState<string>("Perfumes");
  const [contactMessage, setContactMessage] = useState<string>("");
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);

  // Dynamic brand background video URL
  const [videoUrl, setVideoUrl] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("myra_video_url");
      if (saved) return saved;
    } catch {}
    return "https://res.cloudinary.com/dy7avkqub/video/upload/q_auto/f_auto/v1780582990/b_e_d_b_e_videomp__ugppis.mp4";
  });

  // Dynamic brand background image (Hero section)
  const [heroBgUrl, setHeroBgUrl] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("myra_hero_bg_url");
      if (saved) return saved;
    } catch {}
    return "https://res.cloudinary.com/dy7avkqub/image/upload/q_auto/f_auto/v1780577005/main-sample.jpg";
  });

  // Dynamic branding logo URL
  const [logoUrl, setLogoUrl] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("myra_logo_url");
      if (saved) return saved;
    } catch {}
    return "https://res.cloudinary.com/dwokrma1h/image/upload/v1779454534/main-sample.png";
  });

  // Dynamic company name
  const [companyName, setCompanyName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("myra_company_name");
      if (saved) return saved;
    } catch {}
    return "MYRA";
  });

  // Dynamic company subtitle
  const [companySubtitle, setCompanySubtitle] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("myra_company_subtitle");
      if (saved) return saved;
    } catch {}
    return "LUXURY";
  });

  // Dynamic campaign banner image (Waves section)
  const [bannerUrl, setBannerUrl] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("myra_banner_url");
      if (saved) return saved;
    } catch {}
    return "https://res.cloudinary.com/dy7avkqub/image/upload/q_auto/f_auto/v1780835693/samples/waves.png";
  });

  // Private Messages list
  const [messages, setMessages] = useState<ContactMessage[]>(() => {
    try {
      const saved = localStorage.getItem("myra_messages");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [
      {
        id: "msg-101",
        name: "Alphonse de Laborde",
        email: "alphonse@paris-atelier.fr",
        phone: "+33 6 1234 5678",
        interest: "Perfumes",
        message: "Exquisite presentation. I would love to request a private scent consultation for a bespoke monogrammed Oud flacon for my wife's upcoming anniversary in Saint-Tropez. Please let me know your availability for a call.",
        date: "2026-05-24",
        isRead: false
      },
      {
        id: "msg-102",
        name: "Olivia Sterling",
        email: "o.sterling@londonlux.co.uk",
        phone: "+44 20 7946 0958",
        interest: "Leather Belts",
        message: "Do you offer sizing customization for the Full Grain Reserve leather belts? I'm highly interested in ordering a bespoke set of 5 with solid brass buckles for a private yacht crew gathering.",
        date: "2026-05-25",
        isRead: true
      },
      {
        id: "msg-103",
        name: "Mubasshir Niyaz",
        email: "ikondecor1@gmail.com",
        phone: "+91 98765 43210",
        interest: "Handmade Soaps",
        message: "Absolutely in love with the Sandalwood Cream cold-processed soap description. Is there any wholesale curation option for luxury boutique hotels in Rajasthan?",
        date: "2026-05-26",
        isRead: false
      }
    ];
  });

  const [dbLocations, setDbLocations] = useState<StoreLocation[]>(() => {
    try {
      const saved = localStorage.getItem("myra_locations");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return storeLocations;
  });

  // Mobile menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Profile modal toggle
  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const [profileInitialTab, setProfileInitialTab] = useState<"card" | "orders" | "edit">("card");

  // Wishlist state persisted in 'myra_wishlist'
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("myra_wishlist");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Quick Notification Banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Helper to safely write to localStorage without crashing on exceptions like QuotaExceededError
  const safeSetLocalStorage = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (err: any) {
      console.warn(`[LocalStorage Safety Catch] Failed to save key "${key}":`, err);
      if (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED' || err.code === 22) {
        // Only trigger toast periodically or silently log to prevent spamming the client.
        triggerToast("Atelier notice: Browser local storage is full. Custom changes may not persist until some older assets or browser cache are cleared.");
      }
    }
  };

  // --- Effects ---
  // Synchronize wishlist from real Firebase Auth Profile
  useEffect(() => {
    if (profile && profile.wishlist) {
      setWishlist(profile.wishlist);
    } else if (!user) {
      try {
        const saved = localStorage.getItem("myra_wishlist");
        if (saved) {
          setWishlist(JSON.parse(saved));
        } else {
          setWishlist([]);
        }
      } catch {}
    }
  }, [profile, user]);

  // --- Firestore Integration Synchronization Engine ---
  const [isFirestoreLoaded, setIsFirestoreLoaded] = useState<boolean>(false);

  // Load all persistent data from Firestore on app startup
  useEffect(() => {
    const loadAllFromFirestore = async () => {
      try {
        console.log("[Firestore Sync]: Fetching boutique collections from Cloud DB via proxy...");
        // 1. Fetch Products
        let productsList: Product[] = [];
        try {
          const prodRes = await fetch("/api/products");
          if (prodRes.ok) {
            productsList = await prodRes.json();
          } else {
            throw new Error("Proxy products fetch failed");
          }
        } catch (err) {
          console.warn("[Firestore Sync Fallback]: Fetching products directly from Client SDK...", err);
          try {
            const snap = await getDocs(collection(db, "products"));
            productsList = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[];
          } catch (fallbackErr) {
            console.error("Direct client products fetch failed too:", fallbackErr);
          }
        }
        if (Array.isArray(productsList) && productsList.length > 0) {
          setDbProducts(productsList);
          localStorage.setItem("myra_products", JSON.stringify(productsList));
        }

        // 2. Fetch Locations
        let locationsList: StoreLocation[] = [];
        try {
          const locRes = await fetch("/api/locations");
          if (locRes.ok) {
            locationsList = await locRes.json();
          } else {
            throw new Error("Proxy locations fetch failed");
          }
        } catch (err) {
          console.warn("[Firestore Sync Fallback]: Fetching locations directly from Client SDK...", err);
          try {
            const snap = await getDocs(collection(db, "locations"));
            locationsList = snap.docs.map(d => ({ id: d.id, ...d.data() })) as StoreLocation[];
          } catch (fallbackErr) {
            console.error("Direct client locations fetch failed too:", fallbackErr);
          }
        }
        if (Array.isArray(locationsList) && locationsList.length > 0) {
          setDbLocations(locationsList);
          localStorage.setItem("myra_locations", JSON.stringify(locationsList));
        }

        // 3. Fetch Branding Configurations
        let brandingData: any = null;
        try {
          const brandingRes = await fetch("/api/configs/branding");
          if (brandingRes.ok) {
            brandingData = await brandingRes.json();
          } else {
            throw new Error("Proxy branding fetch failed");
          }
        } catch (err) {
          console.warn("[Firestore Sync Fallback]: Fetching branding directly from Client SDK...", err);
          try {
            const docSnap = await getDoc(doc(db, "configs", "branding"));
            if (docSnap.exists()) {
              brandingData = docSnap.data();
            }
          } catch (fallbackErr) {
            console.error("Direct client branding fetch failed too:", fallbackErr);
          }
        }
        if (brandingData && Object.keys(brandingData).length > 0) {
          if (brandingData.videoUrl) {
            setVideoUrl(brandingData.videoUrl);
            localStorage.setItem("myra_video_url", brandingData.videoUrl);
          }
          if (brandingData.heroBgUrl) {
            setHeroBgUrl(brandingData.heroBgUrl);
            localStorage.setItem("myra_hero_bg_url", brandingData.heroBgUrl);
          }
          if (brandingData.logoUrl) {
            setLogoUrl(brandingData.logoUrl);
            localStorage.setItem("myra_logo_url", brandingData.logoUrl);
          }
          if (brandingData.companyName) {
            setCompanyName(brandingData.companyName);
            localStorage.setItem("myra_company_name", brandingData.companyName);
          }
          if (brandingData.companySubtitle) {
            setCompanySubtitle(brandingData.companySubtitle);
            localStorage.setItem("myra_company_subtitle", brandingData.companySubtitle);
          }
          if (brandingData.bannerUrl) {
            setBannerUrl(brandingData.bannerUrl);
            localStorage.setItem("myra_banner_url", brandingData.bannerUrl);
          }
        }

        // 4. Fetch SEO configurations
        let seoDataFetched: any = null;
        try {
          const seoRes = await fetch("/api/configs/seo");
          if (seoRes.ok) {
            seoDataFetched = await seoRes.json();
          } else {
            throw new Error("Proxy seo fetch failed");
          }
        } catch (err) {
          console.warn("[Firestore Sync Fallback]: Fetching SEO directly from Client SDK...", err);
          try {
            const docSnap = await getDoc(doc(db, "configs", "seo"));
            if (docSnap.exists()) {
              seoDataFetched = docSnap.data();
            }
          } catch (fallbackErr) {
            console.error("Direct client SEO fetch failed too:", fallbackErr);
          }
        }
        if (seoDataFetched && Object.keys(seoDataFetched).length > 0) {
          setSeoData(seoDataFetched);
          localStorage.setItem("myra_seo_data", JSON.stringify(seoDataFetched));
        }

        // 5. Fetch Messages
        let messagesList: ContactMessage[] = [];
        try {
          const msgRes = await fetch("/api/messages");
          if (msgRes.ok) {
            messagesList = await msgRes.json();
          } else {
            throw new Error("Proxy messages fetch failed");
          }
        } catch (err) {
          console.warn("[Firestore Sync Fallback]: Fetching messages directly from Client SDK...", err);
          try {
            const snap = await getDocs(collection(db, "messages"));
            messagesList = snap.docs.map(d => ({ id: d.id, ...d.data() })) as ContactMessage[];
          } catch (fallbackErr) {
            console.error("Direct client messages fetch failed too:", fallbackErr);
          }
        }
        if (Array.isArray(messagesList) && messagesList.length > 0) {
          setMessages(messagesList);
          localStorage.setItem("myra_messages", JSON.stringify(messagesList));
        }
      } catch (err) {
        console.error("[Firestore Sync Error]: Failed to populate boutique states on boot, using offline cache fallback.", err);
      } finally {
        setIsFirestoreLoaded(true);
      }
    };

    loadAllFromFirestore();
  }, []);

  // Persist wishlist changes
  useEffect(() => {
    safeSetLocalStorage("myra_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    safeSetLocalStorage("myra_cart", JSON.stringify(cart));
  }, [cart]);

  // Synchronize dbProducts changes to Firestore
  useEffect(() => {
    safeSetLocalStorage("myra_products", JSON.stringify(dbProducts));
    
    if (!isFirestoreLoaded) return;
    if (!isLocalChange.current) return;
    
    const syncProducts = async () => {
      try {
        console.log("[Firestore Sync]: Syncing products catalog via proxy API...");
        const res = await fetch("/api/products/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dbProducts)
        });
        if (!res.ok) throw new Error(await res.text());
        console.log("[Firestore Sync]: Products catalog atomically synced successfully!");
      } catch (err) {
        console.warn("[Firestore Sync Fallback]: Syncing products directly via Client SDK...", err);
        try {
          const batch = writeBatch(db);
          for (const p of dbProducts) {
            batch.set(doc(db, "products", p.id), p, { merge: true });
          }
          const snap = await getDocs(collection(db, "products"));
          const currentList = snap.docs.map(d => ({ id: d.id }));
          const updatedIds = dbProducts.map((p: any) => p.id);
          for (const docObj of currentList) {
            if (!updatedIds.includes(docObj.id)) {
              batch.delete(doc(db, "products", docObj.id));
            }
          }
          await batch.commit();
          console.log("[Firestore Sync Fallback]: Atomic fallback sync succeeded.");
        } catch (fallbackErr) {
          console.error("Direct client products sync failed too:", fallbackErr);
        }
      } finally {
        // Reset the flag ONLY after the synchronization is fully complete
        isLocalChange.current = false;
      }
    };
    syncProducts();
  }, [dbProducts, isFirestoreLoaded]);

  // Real-time products listener to update other active users' clients
  useEffect(() => {
    if (!isFirestoreLoaded) return;

    console.log("[Firestore Sync]: Setting up real-time products listener...");
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      // If a local change is currently syncing, ignore incoming snapshot updates
      // to prevent racing/flickering/overwriting local uncommitted changes.
      if (isLocalChange.current) {
        console.log("[Firestore Sync]: Local change actively syncing, ignoring remote snapshot.");
        return;
      }

      const productsList = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Product[];
      if (productsList.length > 0) {
        setDbProducts((prevProducts) => {
          const prevJson = JSON.stringify(prevProducts);
          const nextJson = JSON.stringify(productsList);
          if (prevJson !== nextJson) {
            console.log("[Firestore Sync]: Real-time product inventory updated from Firestore.");
            localStorage.setItem("myra_products", nextJson);
            return productsList;
          }
          return prevProducts;
        });
      }
    }, (error) => {
      console.error("Real-time products snapshot failed:", error);
    });

    return () => unsubscribe();
  }, [isFirestoreLoaded]);

  // Synchronize orders changes locally
  useEffect(() => {
    safeSetLocalStorage("myra_orders", JSON.stringify(orders));
  }, [orders]);

  // Synchronize support messages to Firestore
  useEffect(() => {
    safeSetLocalStorage("myra_messages", JSON.stringify(messages));

    if (!isFirestoreLoaded) return;

    const syncMessages = async () => {
      try {
        console.log("[Firestore Sync]: Syncing support messages via proxy API...");
        const res = await fetch("/api/messages/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(messages)
        });
        if (!res.ok) throw new Error(await res.text());
      } catch (err) {
        console.warn("[Firestore Sync Fallback]: Syncing messages directly via Client SDK...", err);
        try {
          for (const m of messages) {
            await setDoc(doc(db, "messages", m.id || `msg-${Date.now()}`), m, { merge: true });
          }
        } catch (fallbackErr) {
          console.error("Direct client messages sync failed too:", fallbackErr);
        }
      }
    };
    syncMessages();
  }, [messages, isFirestoreLoaded]);

  // Synchronize locations changes to Firestore
  useEffect(() => {
    safeSetLocalStorage("myra_locations", JSON.stringify(dbLocations));

    if (!isFirestoreLoaded) return;

    const syncLocations = async () => {
      try {
        console.log("[Firestore Sync]: Syncing boutique locations via proxy API...");
        const res = await fetch("/api/locations/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dbLocations)
        });
        if (!res.ok) throw new Error(await res.text());
      } catch (err) {
        console.warn("[Firestore Sync Fallback]: Syncing locations directly via Client SDK...", err);
        try {
          for (const l of dbLocations) {
            await setDoc(doc(db, "locations", l.id), l, { merge: true });
          }
          const snap = await getDocs(collection(db, "locations"));
          const currentList = snap.docs.map(d => ({ id: d.id }));
          const updatedIds = dbLocations.map((l: any) => l.id);
          for (const docObj of currentList) {
            if (!updatedIds.includes(docObj.id)) {
              await deleteDoc(doc(db, "locations", docObj.id));
            }
          }
        } catch (fallbackErr) {
          console.error("Direct client locations sync failed too:", fallbackErr);
        }
      }
    };
    syncLocations();
  }, [dbLocations, isFirestoreLoaded]);

  // Synchronize branding presentation changes to Firestore
  useEffect(() => {
    safeSetLocalStorage("myra_video_url", videoUrl);
    safeSetLocalStorage("myra_hero_bg_url", heroBgUrl);
    safeSetLocalStorage("myra_logo_url", logoUrl);
    safeSetLocalStorage("myra_company_name", companyName);
    safeSetLocalStorage("myra_company_subtitle", companySubtitle);
    safeSetLocalStorage("myra_banner_url", bannerUrl);

    if (!isFirestoreLoaded) return;

    const syncBranding = async () => {
      try {
        console.log("[Firestore Sync]: Syncing branding configuration via proxy API...");
        const res = await fetch("/api/configs/branding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoUrl,
            heroBgUrl,
            logoUrl,
            companyName,
            companySubtitle,
            bannerUrl,
            updatedAt: new Date().toISOString()
          })
        });
        if (!res.ok) throw new Error(await res.text());
      } catch (err) {
        console.warn("[Firestore Sync Fallback]: Syncing branding directly via Client SDK...", err);
        try {
          await setDoc(doc(db, "configs", "branding"), {
            videoUrl,
            heroBgUrl,
            logoUrl,
            companyName,
            companySubtitle,
            bannerUrl,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (fallbackErr) {
          console.error("Direct client branding sync failed too:", fallbackErr);
        }
      }
    };
    syncBranding();
  }, [videoUrl, heroBgUrl, logoUrl, companyName, companySubtitle, bannerUrl, isFirestoreLoaded]);

  // Synchronize SEO changes to Firestore
  useEffect(() => {
    safeSetLocalStorage("myra_seo_data", JSON.stringify(seoData));

    if (!isFirestoreLoaded) return;

    const syncSeo = async () => {
      try {
        console.log("[Firestore Sync]: Syncing SEO configurations via proxy API...");
        const res = await fetch("/api/configs/seo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(seoData)
        });
        if (!res.ok) throw new Error(await res.text());
      } catch (err) {
        console.warn("[Firestore Sync Fallback]: Syncing SEO directly via Client SDK...", err);
        try {
          await setDoc(doc(db, "configs", "seo"), seoData, { merge: true });
        } catch (fallbackErr) {
          console.error("Direct client SEO sync failed too:", fallbackErr);
        }
      }
    };
    syncSeo();
  }, [seoData, isFirestoreLoaded]);

  // Listen to external product/order updates (e.g. from checkout in CartDrawer or other places)
  useEffect(() => {
    const handleProductsUpdated = () => {
      try {
        const saved = localStorage.getItem("myra_products");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDbProducts(parsed);
          }
        }
      } catch {}
    };

    const handleOrdersUpdated = () => {
      try {
        const saved = localStorage.getItem("myra_orders");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setOrders(parsed);
          }
        }
      } catch {}
    };

    window.addEventListener("myra_products_updated", handleProductsUpdated);
    window.addEventListener("myra_orders_updated", handleOrdersUpdated);
    
    // Fetch orders from persistent database
    const syncDatabaseOrders = async () => {
      try {
        const response = await fetch("/api/orders");
        if (response.ok) {
          const serverOrders = await response.json();
          if (Array.isArray(serverOrders) && serverOrders.length > 0) {
            setOrders(serverOrders);
            localStorage.setItem("myra_orders", JSON.stringify(serverOrders));
            return;
          }
        } else {
          throw new Error("Proxy orders fetch failed");
        }
      } catch (err) {
        console.warn("[Firestore Sync Fallback]: Fetching orders directly via Client SDK...", err);
        try {
          const snap = await getDocs(collection(db, "orders"));
          const serverOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          if (serverOrders.length > 0) {
            setOrders(serverOrders);
            localStorage.setItem("myra_orders", JSON.stringify(serverOrders));
            return;
          }
        } catch (fallbackErr) {
          console.error("Direct client orders fetch failed too:", fallbackErr);
        }
      }

      // Safe fallback to local storage
      try {
        const existingOrders = localStorage.getItem("myra_orders");
        if (existingOrders) {
          const parsed = JSON.parse(existingOrders);
          if (Array.isArray(parsed)) {
            const preseededIds = ["MYRA-ORD-74092", "MYRA-ORD-38104", "MYRA-ORD-38192", "MYRA-ORD-11945"];
            const filtered = parsed.filter(o => !preseededIds.includes(o.id));
            if (filtered.length !== parsed.length) {
              localStorage.setItem("myra_orders", JSON.stringify(filtered));
              setOrders(filtered);
            }
          }
        } else {
          localStorage.setItem("myra_orders", JSON.stringify([]));
          setOrders([]);
        }
      } catch {}
    };

    syncDatabaseOrders();

    return () => {
      window.removeEventListener("myra_products_updated", handleProductsUpdated);
      window.removeEventListener("myra_orders_updated", handleOrdersUpdated);
    };
  }, []);

  // Toast helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const toggleWishlist = async (productId: string) => {
    const prod = dbProducts.find(p => p.id === productId);
    const nameStr = prod ? prod.name : "Item";

    if (user) {
      const added = await toggleWishlistItem(productId);
      triggerToast(added ? `Added "${nameStr}" to your wishlist.` : `Removed "${nameStr}" from your wishlist.`);
    } else {
      setWishlist(prev => {
        const exists = prev.includes(productId);
        const updated = exists 
          ? prev.filter(id => id !== productId) 
          : [...prev, productId];
        triggerToast(exists ? `Removed "${nameStr}" from your wishlist.` : `Added "${nameStr}" to your wishlist. Sign in to save to your cloud account.`);
        return updated;
      });
    }
  };

  const isWishlisted = (productId: string) => wishlist.includes(productId);

  // --- Cart Actions ---
  const handleAddToCart = (product: Product) => {
    console.log("handleAddToCart triggered with:", product);
    if (!product || typeof product !== "object" || !product.id) {
      console.warn("handleAddToCart was called with an invalid product object:", product);
      triggerToast("Error: Selection is not formatted correctly.");
      return;
    }
    try {
      const baseId = String(product.id).split("-")[0];
      const dbMatch = Array.isArray(dbProducts) ? dbProducts.find(p => p && (p.id === product.id || p.id === baseId)) : undefined;
      const actualStock = dbMatch?.stock !== undefined ? dbMatch.stock : (product.stock !== undefined ? product.stock : 25);
      
      if (actualStock <= 0) {
        triggerToast(`Sorry, ${product.name || "item"} is currently out of stock.`);
        return;
      }

      setCart(prevCart => {
        const safeCart = Array.isArray(prevCart) ? prevCart : [];
        const existing = safeCart.find(item => item && item.product && item.product.id === product.id);
        if (existing) {
          triggerToast(`Added another ${product.name || "item"} to selection.`);
          return safeCart.map(item => 
            (item && item.product && item.product.id === product.id)
              ? { ...item, quantity: (item.quantity || 1) + 1 }
              : item
          );
        }
        triggerToast(`Added ${product.name || "item"} to selection.`);
        return [...safeCart, { product, quantity: 1 }];
      });
      setCartOpen(true);
    } catch (err) {
      console.error("Crash during handleAddToCart runtime execution:", err);
      triggerToast("An error occurred adding this item to your Selection Bag.");
    }
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    console.log(`handleUpdateCartQuantity, productId=${productId}, delta=${delta}`);
    if (!productId) return;
    try {
      setCart(prevCart => {
        const safeCart = Array.isArray(prevCart) ? prevCart : [];
        return safeCart.map(item => {
          if (item && item.product && item.product.id === productId) {
            const baseId = String(item.product.id).split("-")[0];
            const dbMatch = Array.isArray(dbProducts) ? dbProducts.find(p => p && (p.id === item.product.id || p.id === baseId)) : undefined;
            const maxStock = dbMatch?.stock !== undefined ? dbMatch.stock : (item.product.stock !== undefined ? item.product.stock : 25);
            
            const nextQ = (item.quantity || 1) + delta;
            if (delta > 0 && nextQ > maxStock) {
              triggerToast(`Maximum stock limit of ${maxStock} items reached for this variant.`);
              return item;
            }
            return nextQ > 0 ? { ...item, quantity: nextQ } : item;
          }
          return item;
        });
      });
    } catch (err) {
      console.error("Crash in handleUpdateCartQuantity:", err);
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    console.log("handleRemoveFromCart:", productId);
    if (!productId) return;
    try {
      const safeCart = Array.isArray(cart) ? cart : [];
      const item = safeCart.find(i => i && i.product && i.product.id === productId);
      if (item && item.product) {
        triggerToast(`Removed ${item.product.name || "item"} from selection.`);
      }
      setCart(prevCart => {
        const safeCart = Array.isArray(prevCart) ? prevCart : [];
        return safeCart.filter(item => item && item.product && item.product.id !== productId);
      });
    } catch (err) {
      console.error("Crash in handleRemoveFromCart:", err);
    }
  };

  const handleClearCart = () => {
    try {
      setCart([]);
    } catch (err) {
      console.error("Crash in handleClearCart:", err);
    }
  };

  // --- Filtering Logic ---
  const categoriesList = [
    "Perfumes", 
    "Leather Belts", 
    "Leather Wallets", 
    "Handmade Soaps", 
    "Gift Sets", 
    "Premium Range",
    "Wishlist"
  ];

  // Map user readable category tab text to DB category codes
  const categoryMap: { [key: string]: string } = {
    "Perfumes": "perfumes",
    "Leather Belts": "leather_belts",
    "Leather Wallets": "leather_wallets",
    "Handmade Soaps": "handmade_soaps",
    "Gift Sets": "gift_sets"
  };

  const filteredProducts = dbProducts.filter(prod => {
    // 1. Filter by category (only if search query is empty; otherwise bypass to query globally)
    if (searchQuery.trim() === "" && selectedCategory !== "All Products") {
      if (selectedCategory === "Premium Range") {
        // Assume products valued above ₹150 are classified as premium range
        if (prod.price < 150) return false;
      } else if (selectedCategory === "Wishlist") {
        if (!wishlist.includes(prod.id)) return false;
      } else {
        const targetDbKey = categoryMap[selectedCategory];
        if (prod.category !== targetDbKey) return false;
      }
    }

    // 2. Filter by search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      const matchesTitle = prod.name.toLowerCase().includes(query);
      const matchesDesc = prod.description.toLowerCase().includes(query);
      const matchesNotes = prod.fragranceNotes?.top.some(n => n.toLowerCase().includes(query)) ||
                           prod.fragranceNotes?.heart.some(n => n.toLowerCase().includes(query)) ||
                           prod.fragranceNotes?.base.some(n => n.toLowerCase().includes(query)) || false;
      const matchesIngredients = prod.soapIngredients?.some(i => i.toLowerCase().includes(query)) || false;
      const matchesSkinFeel = prod.skinFeel?.some(sf => sf.toLowerCase().includes(query)) || false;
      const matchesCategory = prod.category.toLowerCase().replace('_', ' ').includes(query);
      const matchesCategoryLabel = prod.categoryLabel.toLowerCase().includes(query);
      return matchesTitle || matchesDesc || matchesNotes || matchesIngredients || matchesSkinFeel || matchesCategory || matchesCategoryLabel;
    }

    return true;
  });

  // Search input handler with smooth-scrolling & category auto-reset
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val.trim() !== "") {
      setSelectedCategory("All Products");
      setTimeout(() => {
        const element = document.getElementById("signature");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 50);
    } else {
      setSelectedCategory("Perfumes");
    }
  };

  // --- Handlers ---
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterSubscribed(true);
    triggerToast("Thank you! You've been granted Priority Curation access keys.");
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim()) {
      triggerToast("Please enter a valid name and email address.");
      return;
    }

    const newMessage: ContactMessage = {
      id: `msg-${Date.now()}`,
      name: contactName,
      email: contactEmail,
      phone: contactPhone || undefined,
      interest: contactInterest,
      message: contactMessage || "No message content provided.",
      date: new Date().toISOString().split("T")[0],
      isRead: false
    };

    setMessages(prev => [newMessage, ...prev]);
    setFormSubmitted(true);
    triggerToast("Your private message was securely dispatched to MYRA curators.");
  };

  // Quick list filters
  const perfumesList = dbProducts.filter(p => p.category === "perfumes").slice(0, 4);
  const leatherList = dbProducts.filter(p => p.category === "leather_belts" || p.category === "leather_wallets").slice(0, 4);
  const soapList = dbProducts.filter(p => p.category === "handmade_soaps").slice(0, 4);
  const giftSetsList = dbProducts.filter(p => p.category === "gift_sets").slice(0, 4);
  const popularList = dbProducts.filter(p => p.isBestSeller).slice(0, 6);

  return (
    <div className="lotus-bg min-h-screen relative flex flex-col font-sans text-stone-800 antialiased selection:bg-leather-tan selection:text-white">
      
      {/* Top Banner Background Overlay (Header & Hero Area up to Black Strip) */}
      {activeLegalPage === null && (
        <div 
          className="absolute top-0 left-0 right-0 z-0 pointer-events-none"
          style={{
            height: `${heroBottom}px`,
            backgroundImage: `linear-gradient(rgba(253, 251, 247, 0.65), rgba(253, 251, 247, 0.65)), url("${getVersionedCloudinaryUrl(heroBgUrl)}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-[9999] bg-stone-900 border border-white/10 text-white rounded-2xl px-5 py-3.5 shadow-2xl flex items-center gap-3 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold tracking-wide font-sans">{toastMessage}</span>
        </div>
      )}

      {/* STICKY GLASSMORPHIC NAVBAR */}
      <header className="sticky top-0 z-40 px-4 py-3 md:px-6">
        <nav className="max-w-7xl mx-auto rounded-full glass-navbar shadow-md px-5 py-3 flex items-center justify-between border border-white/40">
          
          {/* Logo with Lotus Icon */}
          <a href="#home" className="flex items-center gap-2 group focus:outline-none">
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shadow-md border border-stone-200/40 bg-white transition-transform duration-500 group-hover:scale-105">
              <img 
                src={getVersionedCloudinaryUrl(logoUrl)} 
                alt={`${companyName} Logo`} 
                className="w-full h-full object-cover rounded-full" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-serif font-bold tracking-widest text-stone-900 group-hover:text-leather-tan transition-colors">
                {companyName}
              </span>
              <span className="text-[8px] font-sans font-semibold tracking-widest uppercase text-stone-500 -mt-1.5 font-bold">
                {companySubtitle}
              </span>
            </div>
          </a>

          {/* Desktop Center Menu */}
          <div className="hidden lg:flex items-center gap-7 xl:gap-9 text-xs font-semibold uppercase tracking-widest text-stone-700">
            <a href="#home" onClick={() => setActiveLegalPage(null)} className="hover:text-leather-tan transition-colors py-1">Home</a>
            <a href="#signature" onClick={() => setActiveLegalPage(null)} className="hover:text-leather-tan transition-colors py-1">Collection</a>
            <a href="#perfumes" onClick={() => setActiveLegalPage(null)} className="hover:text-leather-tan transition-colors py-1">Perfumes</a>
            <a href="#leather" onClick={() => setActiveLegalPage(null)} className="hover:text-leather-tan transition-colors py-1">Leather Goods</a>
            <a href="#soaps" onClick={() => setActiveLegalPage(null)} className="hover:text-leather-tan transition-colors py-1">Handmade Soaps</a>
            <a href="#giftsets" onClick={() => setActiveLegalPage(null)} className="hover:text-leather-tan transition-colors py-1">Gift Sets</a>
            <a href="#about" onClick={() => setActiveLegalPage(null)} className="hover:text-leather-tan transition-colors py-1">About</a>
            <button onClick={() => { setActiveLegalPage(null); setProfileInitialTab("orders"); setProfileOpen(true); }} className="hover:text-leather-tan transition-colors py-1 cursor-pointer bg-transparent border-none p-0 uppercase tracking-widest font-semibold font-sans outline-none">My Orders</button>
          </div>

          {/* Right Menu Icons */}
          <div className="flex items-center gap-3">
            {/* Search Toggle field */}
            <div className="relative flex items-center">
              {showSearch && (
                <input 
                  type="text"
                  placeholder="Query scent/leather..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  autoFocus
                  className="bg-white/80 border border-stone-200/60 rounded-full px-4 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-leather-tan w-40 md:w-52 transition-all mr-2"
                />
              )}
              <button 
                id="search-toggle-btn"
                onClick={() => {
                  if (showSearch) {
                    setSearchQuery("");
                    setSelectedCategory("Perfumes");
                  }
                  setShowSearch(!showSearch);
                }}
                className="p-2 rounded-full hover:bg-white/60 text-stone-700 hover:text-stone-950 transition-colors cursor-pointer"
                title="Search collection"
              >
                <Search className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Wishlist Trigger Button with Badge */}
            <button 
              id="header-wishlist-trigger"
              onClick={() => {
                if (selectedCategory === "Wishlist") {
                  setSelectedCategory("Perfumes");
                } else {
                  setSelectedCategory("Wishlist");
                  // Smooth scroll to signature section
                  setTimeout(() => {
                    const signatureSec = document.getElementById("signature");
                    if (signatureSec) signatureSec.scrollIntoView({ behavior: "smooth" });
                  }, 50);
                  triggerToast("Curating your boutique wishlist.");
                }
              }}
              className={`p-2 rounded-full transition-all duration-300 relative flex items-center justify-center cursor-pointer ${
                selectedCategory === "Wishlist"
                  ? "bg-rose-50 text-red-600 hover:text-red-700"
                  : "bg-transparent hover:bg-white/60 text-stone-700 hover:text-stone-950"
              }`}
              title="My Wishlist"
            >
              <Heart className={`w-4.5 h-4.5 ${wishlist.length > 0 ? "fill-red-500 text-red-500" : ""}`} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 border border-white text-white font-bold text-[8px] w-4.5 h-4.5 rounded-full flex items-center justify-center animate-bounce">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Profile trigger (fully workable login values) */}
            <button 
              id="header-profile-trigger"
              onClick={() => setProfileOpen(true)}
              className="inline-block p-2 rounded-full hover:bg-white/60 text-stone-700 hover:text-stone-950 transition-colors cursor-pointer"
              title="Membership Area & Profile"
            >
              <User className="w-4.5 h-4.5" />
            </button>

            {/* Cart Trigger with floating badge count */}
            <button 
              id="cart-trigger-btn"
              onClick={() => setCartOpen(true)}
              className="p-2 rounded-full bg-stone-900 hover:bg-leather-tan text-white relative flex items-center justify-center transition-all duration-300 transform hover:scale-105 cursor-pointer shadow-md"
              title="Selection Bag"
            >
              <ShoppingBag className="w-4.5 h-4.5" />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-pastel border border-stone-100 text-stone-900 font-bold text-[9px] w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>

            {/* Mobile Menu trigger */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-full bg-white/60 hover:bg-white text-stone-700 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile menu expanded container */}
        {mobileMenuOpen && (
          <div className="mt-2.5 rounded-3xl bg-white/95 glass-panel p-6 shadow-xl border border-stone-100 divide-y divide-stone-100 lg:hidden animate-fade-in-down">
            <div className="flex flex-col gap-3 pb-4 text-sm font-semibold uppercase tracking-widest text-stone-700">
              <a href="#home" onClick={() => { setMobileMenuOpen(false); setActiveLegalPage(null); }} className="hover:text-leather-tan transition-colors">Home</a>
              <a href="#signature" onClick={() => { setMobileMenuOpen(false); setActiveLegalPage(null); }} className="hover:text-leather-tan transition-colors">Collection</a>
              <a href="#perfumes" onClick={() => { setMobileMenuOpen(false); setActiveLegalPage(null); }} className="hover:text-leather-tan transition-colors">Perfumes</a>
              <a href="#leather" onClick={() => { setMobileMenuOpen(false); setActiveLegalPage(null); }} className="hover:text-leather-tan transition-colors">Leather Goods</a>
              <a href="#soaps" onClick={() => { setMobileMenuOpen(false); setActiveLegalPage(null); }} className="hover:text-leather-tan transition-colors">Handmade Soaps</a>
              <a href="#giftsets" onClick={() => { setMobileMenuOpen(false); setActiveLegalPage(null); }} className="hover:text-leather-tan transition-colors">Gift Sets</a>
              <a href="#about" onClick={() => { setMobileMenuOpen(false); setActiveLegalPage(null); }} className="hover:text-leather-tan transition-colors">About</a>
              <button onClick={() => { setMobileMenuOpen(false); setActiveLegalPage(null); setProfileInitialTab("orders"); setProfileOpen(true); }} className="text-left hover:text-leather-tan transition-colors cursor-pointer bg-transparent border-none p-0 w-full uppercase tracking-widest font-semibold outline-none block">My Orders</button>
              <a href="#contact" onClick={() => { setMobileMenuOpen(false); setActiveLegalPage(null); }} className="hover:text-leather-tan transition-colors">Contact</a>
            </div>
            <div className="pt-4 flex items-center justify-between">
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  setProfileOpen(true);
                }}
                className="flex items-center gap-1.5 text-xs text-stone-700 hover:text-leather-tan font-bold uppercase transition-colors cursor-pointer border-none bg-transparent"
              >
                <User className="w-4.5 h-4.5 text-leather-tan" /> Account Profile
              </button>
              <span className="text-[10px] text-stone-400 font-bold">Priority Curation Mode</span>
            </div>
          </div>
        )}
      </header>

      {activeLegalPage === null ? (
        <>
          {/* HERO SECTION */}
          <section id="home" ref={heroRef} className="relative z-10 min-h-[85vh] py-12 px-6 flex items-center justify-center overflow-hidden">
        {/* Soft Background Moving Blob Accents */}
        <div className="absolute top-20 left-12 w-64 h-64 bg-lavender-pastel/50 rounded-full blur-[90px] -z-10 animate-pulse" style={{ animationDuration: "10s" }} />
        <div className="absolute bottom-16 right-16 w-80 h-80 bg-rose-pastel/50 rounded-full blur-[100px] -z-10 animate-pulse" style={{ animationDuration: "14s" }} />
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-peach-pastel/40 rounded-full blur-[90px] -z-10" />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero text copy */}
          <div className="lg:col-span-6 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-stone-100 text-stone-800 border border-stone-200/50">
              <Sparkles className="w-3.5 h-3.5 text-leather-tan animate-pulse" />
              Private Lifestyle Atelier
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-semibold text-stone-900 leading-tight">
              Luxury Crafted <br />
              <span className="font-light italic text-[#C68B59] shimmer-text">For Your Aura & Lifestyle</span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-stone-600 font-sans max-w-xl mx-auto lg:mx-0 leading-relaxed font-light">
              Discover elegant perfumes, premium leather accessories, and handmade soaps designed to leave a lasting impression.
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <a 
                href="#signature"
                className="w-full sm:w-auto px-8 py-4 bg-stone-950 hover:bg-leather-tan text-white font-bold rounded-xl text-center shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer"
              >
                Explore Collection
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </a>
              <a 
                href="#signature"
                onClick={() => {
                  setSelectedCategory("Perfumes");
                }}
                className="w-full sm:w-auto px-8 py-4 bg-white/70 hover:bg-white text-stone-900 border border-stone-200 font-semibold rounded-xl text-center shadow-sm transition-all duration-300 hover:border-leather-tan cursor-pointer"
              >
                Shop Now
              </a>
            </div>

            {/* Extra trust badges */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-stone-200/40 text-left max-w-md mx-auto lg:mx-0">
              <div>
                <span className="block text-xl font-serif font-bold text-stone-900">100%</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Pure Botanicals</span>
              </div>
              <div className="border-l border-stone-200/60 pl-4">
                <span className="block text-xl font-serif font-bold text-stone-900">Atelier</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Hand Stitched</span>
              </div>
              <div className="border-l border-stone-200/60 pl-4">
                <span className="block text-xl font-serif font-bold text-stone-900">Exclusive</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Luxury Cords</span>
              </div>
            </div>
          </div>

          {/* Hero mockup and showcase area (center right) */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            
            {/* The multi-product luxury showcase mockup circle backdrop */}
            <div className="relative w-full max-w-[345px] sm:max-w-[450px] aspect-square bg-gradient-to-tr from-rose-pastel/50 via-lavender-pastel/50 to-peach-pastel/40 rounded-full flex items-center justify-center shadow-inner overflow-hidden border border-white/40">
              
              {/* Product Visual Center Overlap mockups */}
              <div className="z-10 grid grid-cols-2 gap-3.5 sm:gap-4 w-[90%] h-[90%] relative p-3 sm:p-5">
                
                {/* 1. Fragrance bottle mockup left */}
                <div className="group/card bg-white/95 rounded-2xl shadow-lg border border-white p-2.5 sm:p-3 flex flex-col justify-between hover:scale-105 transition-transform duration-500 transform -rotate-3 hover:-rotate-1 cursor-pointer relative" onClick={() => {
                  const target = dbProducts.find(p => p.id === "perfume-flora-100");
                  if (target) setActiveDetailProduct(target);
                }}>
                  {/* Direct Add to Cart floating button */}
                  <button
                    id="add-cart-hero-flora"
                    onClick={(e) => {
                      e.stopPropagation();
                      const target = dbProducts.find(p => p.id === "perfume-flora-100");
                      if (target) handleAddToCart(target);
                    }}
                    className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-20 bg-stone-900 hover:bg-leather-tan text-white p-1 sm:p-1.5 rounded-full transition-all duration-300 active:scale-90 shadow-md cursor-pointer flex items-center justify-center gap-1 group/btn"
                    title="Add directly to cart"
                  >
                    <Plus className="w-3 h-3 text-white" />
                    <ShoppingBag className="w-3 h-3 text-white" />
                  </button>

                  <div className="h-24 sm:h-32 flex items-center justify-center">
                    <ProductVisual id="perfume-flora-100" imagePlaceholderId={dbProducts.find(p => p.id === "perfume-flora-100")?.imagePlaceholderId} />
                  </div>
                  <div className="text-center">
                    <span className="text-[7.5px] sm:text-[8px] uppercase tracking-widest bg-rose-pastel/70 text-stone-800 px-1.5 py-0.5 rounded font-bold">MYRA Perfume</span>
                    <h4 className="text-[9px] sm:text-[10px] font-serif font-bold text-stone-900 mt-1 truncate">Flora Luxe 100ml</h4>
                    <span className="block text-[9.5px] sm:text-[11px] font-sans font-bold text-leather-tan mt-0.5">₹185</span>
                  </div>
                </div>

                {/* 2. Premium leather wallet mockup right */}
                <div className="group/card bg-white/95 rounded-2xl shadow-lg border border-white p-2.5 sm:p-3 flex flex-col justify-between hover:scale-105 transition-transform duration-500 transform rotate-2 hover:rotate-1 cursor-pointer relative" onClick={() => {
                  const target = dbProducts.find(p => p.id === "leather-wallet-black-premium");
                  if (target) setActiveDetailProduct(target);
                }}>
                  {/* Direct Add to Cart floating button */}
                  <button
                    id="add-cart-hero-wallet"
                    onClick={(e) => {
                      e.stopPropagation();
                      const target = dbProducts.find(p => p.id === "leather-wallet-black-premium");
                      if (target) handleAddToCart(target);
                    }}
                    className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-20 bg-stone-900 hover:bg-leather-tan text-white p-1 sm:p-1.5 rounded-full transition-all duration-300 active:scale-90 shadow-md cursor-pointer flex items-center justify-center gap-1"
                    title="Add directly to cart"
                  >
                    <Plus className="w-3 h-3 text-white" />
                    <ShoppingBag className="w-3 h-3 text-white" />
                  </button>

                  <div className="h-24 sm:h-32 flex items-center justify-center">
                    <ProductVisual id="leather-wallet-black" imagePlaceholderId={dbProducts.find(p => p.id === "leather-wallet-black-premium")?.imagePlaceholderId} />
                  </div>
                  <div className="text-center">
                    <span className="text-[7.5px] sm:text-[8px] uppercase tracking-widest bg-stone-100 text-stone-800 px-1.5 py-0.5 rounded font-bold">Premium Leather</span>
                    <h4 className="text-[9px] sm:text-[10px] font-sans font-bold text-stone-900 mt-1 truncate">Standard Bifold</h4>
                    <span className="block text-[9.5px] sm:text-[11px] font-sans font-bold text-leather-tan mt-0.5">₹95</span>
                  </div>
                </div>

                {/* 3. Handmade soap mockup bottom-left */}
                <div className="group/card bg-white/95 rounded-2xl shadow-lg border border-white p-2.5 sm:p-3 flex flex-col justify-between hover:scale-105 transition-transform duration-500 transform rotate-1 hover:rotate-0 cursor-pointer relative" onClick={() => {
                  const target = dbProducts.find(p => p.id === "soap-rose-glow");
                  if (target) setActiveDetailProduct(target);
                }}>
                  {/* Direct Add to Cart floating button */}
                  <button
                    id="add-cart-hero-soap"
                    onClick={(e) => {
                      e.stopPropagation();
                      const target = dbProducts.find(p => p.id === "soap-rose-glow");
                      if (target) handleAddToCart(target);
                    }}
                    className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-20 bg-stone-900 hover:bg-leather-tan text-white p-1 sm:p-1.5 rounded-full transition-all duration-300 active:scale-90 shadow-md cursor-pointer flex items-center justify-center gap-1"
                    title="Add directly to cart"
                  >
                    <Plus className="w-3 h-3 text-white" />
                    <ShoppingBag className="w-3 h-3 text-white" />
                  </button>

                  <div className="h-24 sm:h-32 flex items-center justify-center">
                    <ProductVisual id="soap-rose" imagePlaceholderId={dbProducts.find(p => p.id === "soap-rose-glow")?.imagePlaceholderId} />
                  </div>
                  <div className="text-center">
                    <span className="text-[7.5px] sm:text-[8px] uppercase tracking-widest bg-rose-pastel/70 text-rose-800 px-1.5 py-0.5 rounded font-bold">Organic Soap</span>
                    <h4 className="text-[9px] sm:text-[10px] font-serif font-bold text-stone-900 mt-1 truncate">Rose Glow Soap</h4>
                    <span className="block text-[9.5px] sm:text-[11px] font-sans font-bold text-leather-tan mt-0.5">₹24</span>
                  </div>
                </div>

                {/* 4. Luxury belt mockup bottom-right */}
                <div className="group/card bg-white/95 rounded-2xl shadow-lg border border-white p-2.5 sm:p-3 flex flex-col justify-between hover:scale-105 transition-transform duration-500 transform -rotate-2 hover:rotate-0 cursor-pointer relative" onClick={() => {
                  const target = dbProducts.find(p => p.id === "leather-belt-classic-tan");
                  if (target) setActiveDetailProduct(target);
                }}>
                  {/* Direct Add to Cart floating button */}
                  <button
                    id="add-cart-hero-belt"
                    onClick={(e) => {
                      e.stopPropagation();
                      const target = dbProducts.find(p => p.id === "leather-belt-classic-tan");
                      if (target) handleAddToCart(target);
                    }}
                    className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-20 bg-stone-900 hover:bg-leather-tan text-white p-1 sm:p-1.5 rounded-full transition-all duration-300 active:scale-90 shadow-md cursor-pointer flex items-center justify-center gap-1"
                    title="Add directly to cart"
                  >
                    <Plus className="w-3 h-3 text-white" />
                    <ShoppingBag className="w-3 h-3 text-white" />
                  </button>

                  <div className="h-24 sm:h-32 flex items-center justify-center">
                    <ProductVisual id="leather-belt-tan" imagePlaceholderId={dbProducts.find(p => p.id === "leather-belt-classic-tan")?.imagePlaceholderId} />
                  </div>
                  <div className="text-center">
                    <span className="text-[7.5px] sm:text-[8px] uppercase tracking-widest bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold">Tanned Belt</span>
                    <h4 className="text-[9px] sm:text-[10px] font-sans font-bold text-stone-900 mt-1 truncate">Classic Tan Belt</h4>
                    <span className="block text-[9.5px] sm:text-[11px] font-sans font-bold text-leather-tan mt-0.5">₹120</span>
                  </div>
                </div>

              </div>
            </div>

            {/* FLOATING DECORATIVE TAGS & CARDS (around hero) */}
            
            {/* Tag 1: Herb Leaf / Soap Ingredients Card */}
            <div className="absolute -top-4 right-6 sm:right-12 z-20 bg-[#FDFBF9] rounded-2xl p-3.5 shadow-xl border border-stone-200/30 max-w-[130px] hidden sm:block hover:rotate-2 transition-transform">
              <span className="text-[8px] uppercase font-bold tracking-widest text-emerald-800 bg-[#E2F0CB] px-1.5 py-0.5 rounded">Organic Soap</span>
              <p className="text-[9px] text-[#4A3B32] font-semibold mt-1.5 leading-snug">
                Raw Shear Butter &amp; Aloe Squeeze
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[7px] text-stone-400 uppercase font-semibold">100% Handmade</span>
              </div>
            </div>

            {/* Tag 2: Luxury Leather Spec Label card */}
            <div className="absolute bottom-16 -left-6 z-20 bg-white rounded-2xl p-3.5 shadow-xl border border-stone-200/30 max-w-[140px] hidden sm:block hover:-rotate-3 transition-transform">
              <span className="text-[8px] uppercase font-bold tracking-widest text-amber-800 bg-[#FCF4DD] px-1.5 py-0.5 rounded">Leather Craft</span>
              <p className="text-[9px] text-[#4A3B32] font-semibold mt-1.5 leading-snug">
                Hand-polished full grain Italian calf hides
              </p>
              <span className="text-[8px] font-serif font-bold text-[#C68B59] block mt-1">Brass Buckling</span>
            </div>

            {/* Tag 3: Perfume Notes Card */}
            <div className="absolute top-24 -left-12 z-20 bg-[#FCFAF6] rounded-2xl p-3 shadow-xl border border-stone-200/30 max-w-[120px] text-center hidden sm:block hover:scale-105 transition-transform">
              <span className="text-[8px] uppercase tracking-widest bg-[#E8DFF5] text-[#522b31] px-1.5 py-0.5 rounded font-bold">Flora Notes</span>
              <div className="mt-1.5 space-y-0.5">
                <span className="text-[7px] text-stone-500 block">TOP: Jasmine</span>
                <span className="text-[7px] text-rose-700 block font-semibold">HEART: Red Rose</span>
                <span className="text-[7px] text-stone-500 block">BASE: Amber</span>
              </div>
            </div>

            {/* Tag 4: Gold Luxury Crest */}
            <div className="absolute bottom-6 right-12 z-20 bg-[#2C2C2C] text-white rounded-2xl p-3 shadow-xl border border-white/10 max-w-[100px] text-center hidden sm:block">
              <div className="w-6 h-6 rounded-full overflow-hidden mx-auto bg-white border border-[#D4AF37]/40 shadow-inner p-0.5 mb-1 animate-pulse">
                <img 
                  src={getVersionedCloudinaryUrl(logoUrl)} 
                  alt={`${companyName} Logo`} 
                  className="w-full h-full object-cover rounded-full" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-[8px] uppercase tracking-widest font-semibold text-amber-200 block">GIFT SET</span>
              <span className="text-[7px] text-stone-400 block mt-0.5">Dual Curations</span>
            </div>

          </div>
        </div>
      </section>

      {/* REVOLVING DIAGONAL BRAND RIBBON / MARQUEE */}
      <div className="relative py-3.5 bg-stone-900 border-y border-white/10 overflow-hidden w-full rotate-1 scale-[1.02] z-20 shadow-lg">
        <div className="flex whitespace-nowrap gap-8 animate-marquee text-white text-[10px] md:text-xs font-serif font-semibold tracking-widest uppercase">
          {Array(8).fill(`${companyName} ${companySubtitle} • Perfumes • Leather Goods • Handmade Soaps • ${companyName} ${companySubtitle} •`).map((text, i) => (
            <span key={i} className="flex items-center gap-4 text-stone-100">
              <div className="w-5 h-5 rounded-full overflow-hidden bg-white border border-[#D4AF37]/50 p-0.5 shrink-0 flex items-center justify-center">
                <img 
                  src={getVersionedCloudinaryUrl(logoUrl)} 
                  alt="" 
                  className="w-full h-full object-cover rounded-full" 
                  referrerPolicy="no-referrer"
                />
              </div>
              {text}
            </span>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
      `}</style>

      {/* THE FEATURED PRODUCTS / SIGNATURE SECTION */}
      <section id="signature" className="py-24 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs uppercase tracking-widest text-[#C68B59] font-bold">Bespoke Highlights</span>
          <h2 className="text-3xl md:text-5xl font-serif font-medium text-stone-900">Signature Collection</h2>
          <div className="w-12 h-0.5 bg-leather-tan mx-auto mt-2" />
        </div>

        {/* CATEGORY TABS FILTER */}
        <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3 mb-10 pb-4">
          {categoriesList.map((catName) => {
            const isActive = selectedCategory === catName;
            return (
              <button
                key={catName}
                onClick={() => {
                  setSelectedCategory(catName);
                  setSearchQuery("");
                  triggerToast(`Showing ${catName} line.`);
                }}
                className={`px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider transition-all duration-300 outline-none cursor-pointer ${
                  isActive 
                    ? "bg-stone-950 text-white shadow-md shadow-stone-950/20" 
                    : "bg-white text-stone-700 hover:bg-stone-50 border border-stone-200/50 hover:border-stone-300 shadow-sm"
                }`}
              >
                {catName}
              </button>
            );
          })}
        </div>

        {/* 8 PRODUCT SIGNATURE GRID OR DYNAMIC FILTER MATCH */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-stone-50 rounded-3xl border border-stone-200/40 p-10">
            <h4 className="text-lg font-serif font-bold text-stone-800">
              {selectedCategory === "Wishlist" ? "Your Boutique Wishlist is Empty" : "No curations match search query"}
            </h4>
            <p className="text-sm text-stone-500 mt-2">
              {selectedCategory === "Wishlist" 
                ? "Tap the heart icon on any product in our collections to curate your personal boutique list." 
                : "Adjust your category choices or spellings to find boutique items."}
            </p>
            <button 
              onClick={() => {
                setSelectedCategory("Perfumes");
                setSearchQuery("");
              }}
              className="mt-6 px-5 py-2.5 bg-stone-950 text-white text-xs font-semibold rounded-xl"
            >
              {selectedCategory === "Wishlist" ? "Explore Masterpieces" : "Reset Filters"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((prod) => (
              <div 
                key={prod.id}
                id={`sig-product-card-${prod.id}`}
                className="group relative bg-white rounded-3xl p-5 border border-stone-100 flex flex-col justify-between overflow-hidden shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:border-leather-tan/20 cursor-pointer"
                onClick={() => setActiveDetailProduct(prod)}
              >
                {/* Background decorative shimmer or gradient tag */}
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-5 rounded-bl-full`} />

                <div>
                  {/* Image Placeholder Frame */}
                  <div className={`relative w-full h-52 ${prod.bgColorClass} rounded-2xl flex items-center justify-center p-3.5 overflow-hidden transition-all duration-500`}>
                    {/* Floating elements inside image framed category tag */}
                    <div className="absolute top-3 left-3 flex items-center gap-1 z-10">
                      {prod.stock !== undefined && prod.stock <= 0 ? (
                        <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold bg-rose-100 text-rose-700 border border-rose-200/50 uppercase tracking-widest shadow-sm">
                          Out Of Stock
                        </span>
                      ) : (
                        <>
                          {prod.isBestSeller && (
                            <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold bg-white/90 text-stone-800 uppercase tracking-widest shadow-sm">
                              Best Seller
                            </span>
                          )}
                          {prod.isNew && (
                            <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold bg-[#E2F0CB] text-[#2e7d32] uppercase tracking-widest shadow-sm">
                              New
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Wishlist toggle button */}
                    <button
                      type="button"
                      id={`sig-product-wishlist-${prod.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(prod.id);
                      }}
                      className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/80 hover:bg-white text-stone-600 hover:text-red-500 transition-colors shadow-sm cursor-pointer"
                      title={isWishlisted(prod.id) ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isWishlisted(prod.id) ? "fill-red-500 text-red-500 animate-pulse-quick" : "text-stone-600"}`} />
                    </button>

                    <div className="w-full h-full transform group-hover:scale-[1.06] transition-all duration-500 drop-shadow-lg flex items-center justify-center">
                      <ProductVisual id={prod.imagePlaceholderId || prod.id} animate={true} />
                    </div>
                  </div>

                  {/* Metadata labels */}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#8A7968]">
                      {prod.categoryLabel}
                    </span>
                    <span className="text-xs text-stone-400 font-semibold">{prod.sizeOrSpec}</span>
                  </div>

                  {/* Product title */}
                  <h3 className="text-base font-serif font-bold text-stone-900 mt-1.5 group-hover:text-leather-tan transition-colors line-clamp-1">
                    {prod.name}
                  </h3>

                  {/* Fragrance details minimal look if perfume */}
                  {prod.fragranceNotes && (
                    <div className="mt-2 text-[10px] text-stone-500 flex flex-wrap gap-1 leading-none line-clamp-1">
                      <span>Notes: </span>
                      <span className="font-semibold text-stone-700">{prod.fragranceNotes.heart[0]}</span>
                      <span>•</span>
                      <span>{prod.fragranceNotes.base[0]}</span>
                    </div>
                  )}

                  {/* Leather Type minimal look if belt/wallet */}
                  {prod.leatherType && (
                    <p className="mt-2 text-[10px] text-amber-900 font-medium italic">
                      {prod.leatherType}
                    </p>
                  )}

                  {/* Soap ingredients/feel list */}
                  {prod.skinFeel && (
                    <div className="mt-2 flex flex-wrap gap-1 text-[9px] text-[#2e7d32] font-semibold">
                      {prod.skinFeel.slice(0, 2).map((feel) => (
                        <span key={feel} className="bg-[#E2F0CB]/60 px-1.5 py-0.5 rounded uppercase">
                          {feel}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pricing and Cart control trigger */}
                <div className="mt-5 pt-3.5 border-t border-stone-100 flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-[#8A7968] tracking-widest">Atelier Price</span>
                    <span className="text-lg font-serif font-bold text-stone-900">₹{prod.price}</span>
                  </div>
                  
                  {/* Subtle Add To Cart Button */}
                  <button 
                    id={`add-cart-sig-${prod.id}`}
                    onClick={(e) => {
                      e.stopPropagation(); // don't open details modal
                      if (prod.stock !== undefined && prod.stock <= 0) return;
                      handleAddToCart(prod);
                    }}
                    disabled={prod.stock !== undefined && prod.stock <= 0}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 active:scale-95 whitespace-nowrap ${
                      prod.stock !== undefined && prod.stock <= 0
                        ? "bg-stone-200 border-stone-150 text-stone-400 cursor-not-allowed shadow-none"
                        : "bg-stone-900 hover:bg-leather-tan text-white cursor-pointer shadow-md"
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{prod.stock !== undefined && prod.stock <= 0 ? "Out of Stock" : "Add to Cart"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* LUXURY FRAGRANCE FOCUS SECTION */}
      <section id="perfumes" className="py-24 bg-gradient-to-tr from-[#FCF8F5] via-[#FCFAF6] to-[#E8DFF5]/30 relative overflow-hidden">
        {/* Soft Background Art Details */}
        <div className="absolute top-1/4 right-0 w-80 h-80 bg-rose-pastel/20 rounded-full blur-[120px]" />
        
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="text-center space-y-3 mb-16">
            <span className="text-xs uppercase tracking-widest text-purple-700 font-bold">The Perfumer’s Sanctuary</span>
            <h2 className="text-3xl md:text-5xl font-serif font-medium text-stone-900">Luxury Fragrances</h2>
            <div className="w-12 h-0.5 bg-purple-300 mx-auto mt-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {perfumesList.map((perfume) => (
              <div 
                key={perfume.id}
                className="bg-white/70 glass-panel hover:bg-white rounded-3xl p-6 border border-white flex flex-col justify-between shadow-md transition-all duration-500 hover:-translate-y-2 group cursor-pointer"
                onClick={() => setActiveDetailProduct(perfume)}
              >
                <div>
                  {/* Flacon Container */}
                  <div className={`aspect-square w-full ${perfume.bgColorClass} rounded-2xl flex items-center justify-center p-2.5 relative overflow-hidden shadow-inner`}>
                    {/* Floating elements inside image framed category tag */}
                    <div className="absolute top-3 left-3 flex items-center gap-1 z-10">
                      {perfume.stock !== undefined && perfume.stock <= 0 ? (
                        <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold bg-rose-100 text-rose-700 border border-rose-200/50 uppercase tracking-widest shadow-sm">
                          Out Of Stock
                        </span>
                      ) : (
                        <>
                          {perfume.isBestSeller && (
                            <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold bg-white/90 text-stone-800 uppercase tracking-widest shadow-sm">
                              Best Seller
                            </span>
                          )}
                          {perfume.isNew && (
                            <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold bg-[#E2F0CB] text-[#2e7d32] uppercase tracking-widest shadow-sm">
                              New
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Wishlist button */}
                    <button
                      type="button"
                      id={`prefume-wishlist-${perfume.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(perfume.id);
                      }}
                      className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/80 hover:bg-white text-stone-600 hover:text-red-500 transition-colors shadow-sm cursor-pointer"
                      title={isWishlisted(perfume.id) ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isWishlisted(perfume.id) ? "fill-red-500 text-red-500 animate-pulse-quick" : "text-stone-600"}`} />
                    </button>

                    <div className="w-full h-full transform group-hover:scale-[1.06] transition-all duration-500 drop-shadow-xl animate-reveal flex items-center justify-center">
                      <ProductVisual id={perfume.imagePlaceholderId || perfume.id} />
                    </div>
                  </div>

                  {/* Scent notes and attributes */}
                  <div className="mt-5 space-y-2">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-purple-700 bg-[#E8DFF5] px-2 py-0.5 rounded-md">
                      {perfume.fragranceNotes?.category || "floral"} notes
                    </span>
                    <h3 className="text-lg font-serif font-semibold text-stone-900 group-hover:text-leather-tan transition-colors">
                      {perfume.name}
                    </h3>
                  </div>
                </div>

                {/* Price Area */}
                <div className="mt-6 flex items-center justify-between border-t border-stone-100 pt-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400">Atelier Price</span>
                    <span className="block text-xl font-serif font-bold text-stone-900">₹{perfume.price}</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (perfume.stock !== undefined && perfume.stock <= 0) return;
                        handleAddToCart(perfume);
                      }}
                      disabled={perfume.stock !== undefined && perfume.stock <= 0}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-all whitespace-nowrap ${
                        perfume.stock !== undefined && perfume.stock <= 0
                          ? "bg-stone-200 border-stone-150 text-stone-400 cursor-not-allowed shadow-none"
                          : "bg-stone-950 hover:bg-leather-tan text-white cursor-pointer"
                      }`}
                    >
                      {perfume.stock !== undefined && perfume.stock <= 0 ? "Out of Stock" : "Add To Cart"}
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LEATHER FOCUS SECTION */}
      <section id="leather" className="py-24 bg-gradient-to-tr from-[#2C2623] via-[#41352E] to-[#251f1c] text-white relative overflow-hidden">
        {/* Abstract Gold Accent overlays */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C68B59]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#DFBA6B]/5 rounded-full blur-[100px]" />

        <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
          <div className="text-center space-y-3 mb-16">
            <span className="text-xs uppercase tracking-widest text-leather-tan font-bold">Tuscan Leather Guild</span>
            <h2 className="text-3xl md:text-5xl font-serif font-medium text-[#FDFBF7]">Premium Leather Essentials</h2>
            <div className="w-12 h-0.5 bg-[#C68B59] mx-auto mt-2" />
            <p className="text-xs text-stone-400 font-sans tracking-widest max-w-md mx-auto line-height">
              MASCHILE-FEMMINILE BALANCED LUXURY CRAFT
            </p>
          </div>

          {/* Leather Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {leatherList.map((leather) => (
              <div 
                key={leather.id}
                className="bg-[#3A322C]/70 rounded-3xl p-6 border border-[#52443C]/50 flex flex-col justify-between hover:bg-[#453A33]/80 hover:border-[#DFBA6B]/30 shadow-2xl transition-all duration-500 hover:-translate-y-2 group cursor-pointer"
                onClick={() => setActiveDetailProduct(leather)}
              >
                <div>
                  {/* Visual */}
                  <div className="aspect-square w-full bg-gradient-to-tr from-[#2c2420] to-[#51433b] rounded-2xl flex items-center justify-center p-2.5 relative overflow-hidden shadow-inner">
                    {/* Floating elements inside image framed category tag */}
                    <div className="absolute top-3 left-3 flex items-center gap-1 z-10">
                      {leather.stock !== undefined && leather.stock <= 0 ? (
                        <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold bg-rose-100 text-rose-700 border border-rose-200/50 uppercase tracking-widest shadow-sm">
                          Out Of Stock
                        </span>
                      ) : (
                        <>
                          {leather.isBestSeller && (
                            <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold bg-white/90 text-stone-800 uppercase tracking-widest shadow-sm">
                              Best Seller
                            </span>
                          )}
                          {leather.isNew && (
                            <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold bg-[#E2F0CB] text-[#2e7d32] uppercase tracking-widest shadow-sm">
                              New
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Wishlist button */}
                    <button
                      type="button"
                      id={`leather-wishlist-${leather.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(leather.id);
                      }}
                      className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/80 hover:bg-white text-stone-600 hover:text-red-500 transition-colors shadow-sm cursor-pointer"
                      title={isWishlisted(leather.id) ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isWishlisted(leather.id) ? "fill-red-500 text-red-500 animate-pulse-quick" : "text-stone-600"}`} />
                    </button>

                    <div className="w-full h-full transform group-hover:scale-[1.06] transition-all duration-500 drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] flex items-center justify-center">
                      <ProductVisual id={leather.imagePlaceholderId || leather.id} />
                    </div>
                  </div>

                  {/* Leather properties */}
                  <div className="mt-5 space-y-2">
                    <div className="flex items-center gap-1.5 justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#ECCAA6]">
                        {leather.leatherType || "Tuscan Leather"}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-stone-400 font-sans">{leather.sizeOrSpec}</span>
                    </div>
                    <h3 className="text-lg font-serif font-semibold text-white group-hover:text-[#F3E5AB] transition-colors">
                      {leather.name}
                    </h3>
                    <p className="text-xs text-stone-400 leading-relaxed font-sans line-clamp-2">
                      {leather.description}
                    </p>
                  </div>
                </div>

                {/* Pricing & buy area */}
                <div className="mt-6 flex items-center justify-between border-t border-[#4E413B] pt-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-stone-400">Atelier Value</span>
                    <span className="block text-xl font-serif font-bold text-[#F3E5AB]">₹{leather.price}</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (leather.stock !== undefined && leather.stock <= 0) return;
                      handleAddToCart(leather);
                    }}
                    disabled={leather.stock !== undefined && leather.stock <= 0}
                    className={`font-semibold px-4 py-2.5 rounded-xl text-xs transition-all duration-300 transform group-hover:scale-102 active:scale-95 whitespace-nowrap ${
                      leather.stock !== undefined && leather.stock <= 0
                        ? "bg-stone-700/60 text-stone-400 border border-stone-600 cursor-not-allowed shadow-none"
                        : "bg-[#D4AF37] hover:bg-white text-stone-900 cursor-pointer shadow-lg"
                    }`}
                  >
                    {leather.stock !== undefined && leather.stock <= 0 ? "Out of Stock" : "Add To Cart"}
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HANDMADE SOAP SECTION */}
      <section id="soaps" className="py-24 bg-white relative overflow-hidden">
        {/* Soft Botanical Leaf outline decorations */}
        <div className="absolute top-10 left-10 w-44 h-44 border border-rose-pastel/40 rounded-full select-none pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-72 h-72 border border-sage-pastel/40 rounded-full select-none pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
          <div className="text-center space-y-3 mb-16">
            <span className="text-xs uppercase tracking-widest text-[#2e7d32] font-semibold">Botanical Self-Care</span>
            <h2 className="text-3xl md:text-5xl font-serif font-medium text-stone-900">Handmade Soaps, Crafted With Care</h2>
            <div className="w-12 h-0.5 bg-sage-pastel/80 mx-auto mt-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {soapList.map((soap) => (
              <div 
                key={soap.id}
                className="bg-[#FCFAF8] rounded-3xl p-6 border border-stone-150 flex flex-col justify-between hover:bg-white hover:border-[#C68B59]/30 hover:scale-[1.01] shadow-sm hover:shadow-xl transition-all duration-500 group cursor-pointer animate-reveal"
                onClick={() => setActiveDetailProduct(soap)}
              >
                <div>
                  {/* Soap image mockup container */}
                  <div className={`aspect-square w-full ${soap.bgColorClass} rounded-2xl flex items-center justify-center p-2.5 relative overflow-hidden shadow-inner`}>
                    {/* Floating elements inside image framed category tag */}
                    <div className="absolute top-3 left-3 flex items-center gap-1 z-10">
                      {soap.stock !== undefined && soap.stock <= 0 ? (
                        <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold bg-rose-100 text-rose-700 border border-rose-200/50 uppercase tracking-widest shadow-sm">
                          Out Of Stock
                        </span>
                      ) : (
                        <>
                          {soap.isBestSeller && (
                            <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold bg-white/90 text-stone-800 uppercase tracking-widest shadow-sm">
                              Best Seller
                            </span>
                          )}
                          {soap.isNew && (
                            <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold bg-[#E2F0CB] text-[#2e7d32] uppercase tracking-widest shadow-sm">
                              New
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Wishlist button */}
                    <button
                      type="button"
                      id={`soap-wishlist-${soap.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(soap.id);
                      }}
                      className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/80 hover:bg-white text-stone-600 hover:text-red-500 transition-colors shadow-sm cursor-pointer"
                      title={isWishlisted(soap.id) ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isWishlisted(soap.id) ? "fill-red-500 text-red-500 animate-pulse-quick" : "text-stone-600"}`} />
                    </button>
                    
                    {/* Tiny animated bubble effects inside image frames */}
                    <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.73)_1px,transparent_1.5px)] [background-size:12px_12px] opacity-20" />
                    
                    <div className="w-full h-full transform group-hover:scale-[1.06] transition-all duration-500 drop-shadow-md flex items-center justify-center">
                      <ProductVisual id={soap.imagePlaceholderId || soap.id} />
                    </div>
                  </div>

                  {/* Soap content */}
                  <div className="mt-5 space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {soap.skinFeel && soap.skinFeel.map((feel) => (
                        <span key={feel} className="px-1.5 py-0.5 bg-white text-[8px] text-[#2e7d32] font-semibold tracking-wider font-sans border border-sage-pastel uppercase rounded">
                          {feel}
                        </span>
                      ))}
                    </div>

                    <h3 className="text-lg font-serif font-semibold text-stone-900 group-hover:text-leather-tan transition-colors">
                      {soap.name}
                    </h3>

                    {/* Ingredients summary */}
                    {soap.soapIngredients && (
                      <p className="text-[10px] text-stone-500 leading-normal line-clamp-2 italic font-sans">
                        Ingredients: {soap.soapIngredients.join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Buy Soap */}
                <div className="mt-6 flex items-center justify-between border-t border-stone-100 pt-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-stone-400">Atelier Value</span>
                    <span className="block text-xl font-serif font-bold text-stone-900">₹{soap.price}</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (soap.stock !== undefined && soap.stock <= 0) return;
                      handleAddToCart(soap);
                    }}
                    disabled={soap.stock !== undefined && soap.stock <= 0}
                    className={`font-semibold px-4 py-2 rounded-xl text-xs transition-all whitespace-nowrap ${
                      soap.stock !== undefined && soap.stock <= 0
                        ? "bg-stone-200 border-stone-150 text-stone-400 cursor-not-allowed shadow-none"
                        : "bg-stone-955 hover:bg-leather-tan text-white cursor-pointer"
                    }`}
                  >
                    {soap.stock !== undefined && soap.stock <= 0 ? "Out of Stock" : "Add To Cart"}
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BRAND BANNER SLOGAN SECTION */}
      <section className="py-24 px-6 bg-gradient-to-tr from-peach-pastel/40 via-rose-pastel/30 to-lavender-pastel/50 relative overflow-hidden border-y border-stone-200/20 text-center">
        {/* Floating elements inside banner */}
        <div className="absolute top-10 left-10 w-8 h-8 rounded-full bg-indigo-100 opacity-40 animate-ping" />
        <div className="absolute bottom-10 right-1/4 w-12 h-12 rounded-full bg-pink-100 opacity-40 animate-ping" />
        
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div 
            className="w-12 h-12 rounded-full overflow-hidden bg-white border border-leather-tan/40 shadow-lg mx-auto flex items-center justify-center p-0.5 animate-spin" 
            style={{ animationDuration: "12s" }}
          >
            <img 
              src={getVersionedCloudinaryUrl(logoUrl)} 
              alt={`${companyName} Logo`} 
              className="w-full h-full object-cover rounded-full" 
              referrerPolicy="no-referrer"
            />
          </div>
          
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif font-medium leading-tight text-stone-900 tracking-tight">
            “A Fragrance, A Touch, A Lifestyle <br />
            <span className="italic text-leather-tan">That Speaks Before You Do</span>”
          </h2>
          
          <p className="text-xs uppercase tracking-[0.3em] font-semibold text-stone-500">
            {companyName} {companySubtitle} • Perfumes • Leather Goods • Handmade Soaps
          </p>

          <div className="pt-4">
            <a 
              href="#contact" 
              className="inline-flex items-center gap-2 group text-xs uppercase tracking-widest font-bold text-stone-900 hover:text-leather-tan transition-colors"
            >
              Order Personal Consultation
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* POPULAR PRODUCTS - MOST LOVED */}
      <section id="popular" className="py-24 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-2 mb-16">
          <span className="text-xs uppercase tracking-widest text-[#C68B59] font-bold">Atelier Favorites</span>
          <h2 className="text-3xl md:text-5xl font-serif font-medium text-stone-900">Most Loved</h2>
          <div className="w-12 h-0.5 bg-leather-tan mx-auto mt-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {popularList.map((popProduct) => (
            <div 
              key={popProduct.id}
              className="bg-white rounded-3xl p-6 border border-stone-200/50 flex flex-col justify-between hover:shadow-xl hover:border-leather-tan/20 transition-all duration-500 group cursor-pointer relative"
              onClick={() => setActiveDetailProduct(popProduct)}
            >
              {/* Wishlist button */}
              <button
                type="button"
                id={`pop-wishlist-${popProduct.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWishlist(popProduct.id);
                }}
                className="absolute top-4 right-4 z-20 p-1.5 rounded-full bg-stone-50 hover:bg-stone-100 text-stone-600 hover:text-red-500 transition-colors shadow-sm cursor-pointer"
                title={isWishlisted(popProduct.id) ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart className={`w-3.5 h-3.5 ${isWishlisted(popProduct.id) ? "fill-red-500 text-red-500 animate-pulse-quick" : "text-stone-600"}`} />
              </button>

              <div className="flex gap-4">
                {/* Product side visual thumbnail */}
                <div className={`w-24 h-24 rounded-2xl ${popProduct.bgColorClass} flex-shrink-0 flex items-center justify-center p-2 relative overflow-hidden shadow-inner`}>
                  <ProductVisual id={popProduct.imagePlaceholderId || popProduct.id} animate={false} className="w-20 h-20" />
                </div>

                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-bold text-stone-800">{popProduct.rating}</span>
                    <span className="text-[10px] text-stone-400 font-semibold uppercase">{popProduct.sizeOrSpec}</span>
                    {popProduct.stock !== undefined && popProduct.stock <= 0 && (
                      <span className="ml-auto px-2 py-0.5 rounded-lg text-[8px] font-bold bg-rose-100 text-rose-700 border border-rose-200/50 uppercase tracking-widest shadow-sm">
                        Out Of Stock
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-base font-serif font-bold text-stone-900 mt-1 group-hover:text-leather-tan transition-colors line-clamp-2">
                    {popProduct.name}
                  </h3>
                  
                  <span className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">
                    {popProduct.categoryLabel}
                  </span>
                </div>
              </div>

              {/* pricing */}
              <div className="mt-5 pt-3.5 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase font-bold text-stone-400">Atelier Value</span>
                  <span className="block text-lg font-serif font-semibold text-stone-950">₹{popProduct.price}</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    id={`add-cart-pop-${popProduct.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (popProduct.stock !== undefined && popProduct.stock <= 0) return;
                      handleAddToCart(popProduct);
                    }}
                    disabled={popProduct.stock !== undefined && popProduct.stock <= 0}
                    className={`text-xs px-4 py-2.5 rounded-xl font-bold transition-all shadow flex items-center gap-1.5 whitespace-nowrap ${
                      popProduct.stock !== undefined && popProduct.stock <= 0
                        ? "bg-stone-200 border-stone-150 text-stone-400 cursor-not-allowed shadow-none"
                        : "bg-stone-950 hover:bg-leather-tan text-white hover:text-white cursor-pointer"
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{popProduct.stock !== undefined && popProduct.stock <= 0 ? "Out of Stock" : "Add to Cart"}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* EXQUISITE INTERACTIVE WAVE BANNER */}
      <section className="relative px-6 py-6 max-w-7xl mx-auto w-full overflow-hidden" id="wave-banner">
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-stone-200/50 w-full bg-stone-100 flex flex-col items-center justify-center group">
          {/* Dynamic automatic-aspect responsive banner image */}
          <div className="w-full h-auto overflow-hidden relative">
            <img 
              src={getVersionedCloudinaryUrl(bannerUrl)} 
              alt="Campaign Banner"
              className="w-full h-auto object-contain block filter brightness-[1.01] contrast-[1.02] transition-transform duration-700 luxury-banner-pulse"
              referrerPolicy="no-referrer"
            />
            
            {/* Sliding physical reflective glaze/sheen overlay across the surface */}
            <div className="absolute inset-y-0 left-0 w-1/3 luxury-banner-sheen pointer-events-none z-1" />
            
            {/* Subtle premium light vignette mask */}
            <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/5 pointer-events-none z-1" />
          </div>
          
          {/* Dynamic glass border outline framing that conforms perfectly to actual height */}
          <div className="absolute inset-3 sm:inset-5 border border-white/20 rounded-xl sm:rounded-2xl z-2 pointer-events-none transition-all duration-700 group-hover:inset-4 sm:group-hover:inset-6" />
        </div>
      </section>

      {/* GIFT SET SECTION */}
      <section id="giftsets" className="py-24 bg-gradient-to-tr from-[#FCF8F5] to-orange-50/50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="text-center space-y-3 mb-16">
            <span className="text-xs uppercase tracking-widest text-[#C68B59] font-bold">Uncompromising Presentation</span>
            <h2 className="text-3xl md:text-5xl font-serif font-medium text-stone-900">Luxury Gift Sets</h2>
            <div className="w-12 h-0.5 bg-leather-tan mx-auto mt-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {giftSetsList.map((gift) => (
              <div 
                key={gift.id}
                className="bg-white/80 glass-panel hover:bg-white rounded-3xl p-6 border border-stone-100 flex flex-col justify-between hover:shadow-2xl transition-all duration-500 group cursor-pointer"
                onClick={() => setActiveDetailProduct(gift)}
              >
                <div>
                  {/* Gift Box visual container */}
                  <div className={`aspect-square w-full ${gift.bgColorClass} rounded-2xl flex items-center justify-center p-2.5 relative overflow-hidden shadow-inner`}>
                    {/* Floating elements inside image framed category tag */}
                    <div className="absolute top-3 left-3 flex items-center gap-1 z-10">
                      {gift.stock !== undefined && gift.stock <= 0 ? (
                        <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold bg-rose-100 text-rose-700 border border-rose-200/50 uppercase tracking-widest shadow-sm">
                          Out Of Stock
                        </span>
                      ) : (
                        <>
                          <span className="bg-stone-950 text-amber-200 text-[8px] font-bold px-2 py-0.5 rounded-md tracking-wider uppercase flex items-center gap-1 shadow-md">
                            <Gift className="w-2.5 h-2.5" /> Gifting Box
                          </span>
                          {gift.isNew && (
                            <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold bg-[#E2F0CB] text-[#2e7d32] uppercase tracking-widest shadow-sm">
                              New
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Wishlist button */}
                    <button
                      type="button"
                      id={`gift-wishlist-${gift.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(gift.id);
                      }}
                      className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/80 hover:bg-white text-stone-600 hover:text-red-500 transition-colors shadow-sm cursor-pointer"
                      title={isWishlisted(gift.id) ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isWishlisted(gift.id) ? "fill-red-500 text-red-500 animate-pulse-quick" : "text-stone-600"}`} />
                    </button>
                    
                    <div className="w-full h-full transform group-hover:scale-[1.06] transition-all duration-500 drop-shadow-lg flex items-center justify-center">
                      <ProductVisual id={gift.imagePlaceholderId || gift.id} />
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    <span className="text-[9px] uppercase font-bold text-amber-900 tracking-widest">
                      {gift.sizeOrSpec}
                    </span>
                    <h3 className="text-lg font-serif font-semibold text-stone-900 group-hover:text-leather-tan transition-colors">
                      {gift.name}
                    </h3>
                    <p className="text-xs text-stone-500 leading-relaxed font-sans line-clamp-2">
                      {gift.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-stone-100 pt-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400">Atelier Price</span>
                    <span className="block text-xl font-serif font-bold text-stone-900">₹{gift.price}</span>
                  </div>
                  <button 
                    id={`add-cart-gift-${gift.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (gift.stock !== undefined && gift.stock <= 0) return;
                      handleAddToCart(gift);
                    }}
                    disabled={gift.stock !== undefined && gift.stock <= 0}
                    className={`font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                      gift.stock !== undefined && gift.stock <= 0
                        ? "bg-stone-200 border-stone-150 text-stone-400 cursor-not-allowed shadow-none"
                        : "bg-stone-950 hover:bg-leather-tan text-white cursor-pointer"
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{gift.stock !== undefined && gift.stock <= 0 ? "Out of Stock" : "Add to Cart"}</span>
                  </button>
                </div>

              </div>
            ))}
          </div>

          {/* Create Your Gift Box banner card */}
          <div className="mt-12 bg-gradient-to-tr from-stone-900 to-[#3A322C] text-white rounded-3xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 border border-white/10 shadow-xl">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FFF_1px,transparent_1px)] [background-size:24px_24px]" />
            <div className="space-y-3 text-center md:text-left z-10">
              <span className="text-xs uppercase font-extrabold tracking-widest text-amber-300">Custom Curation Studio</span>
              <h3 className="text-2xl md:text-3xl font-serif font-medium">Create Your Elite Gift Box</h3>
              <p className="text-stone-300 text-xs md:text-sm max-w-xl font-light">
                Indulge your peers. Select distinct flacons, tanner’s leather creations, and hand-cut botanical selfcare bars for personalized presentation coffrets with handmade wax stamps.
              </p>
            </div>
            <button 
              onClick={() => {
                triggerToast("Custom Curation Studio has been loaded. Select elements to bind.");
                setSelectedCategory("Gift Sets");
                setSearchQuery("");
                window.scrollTo({ top: document.getElementById("signature")?.offsetTop, behavior: "smooth" });
              }}
              className="px-6 py-4 bg-[#D4AF37] hover:bg-white text-stone-950 font-bold rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 whitespace-nowrap z-10 cursor-pointer"
            >
              Create Your Gift Box
            </button>
          </div>
        </div>
      </section>

      {/* BRAND STORY - ABOUT SECTION */}
      <section id="about" className="py-24 max-w-7xl mx-auto px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Half Story */}
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs uppercase tracking-widest text-[#C68B59] font-bold flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-[#D4AF37]" /> The Legacy of Elegancy
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium text-stone-900 leading-tight">
              About MYRA Luxury
            </h2>
            <div className="w-12 h-0.5 bg-leather-tan" />
            
            <p className="text-stone-600 font-sans text-sm sm:text-base leading-relaxed font-light">
              MYRA Luxury brings together elegance, confidence, craftsmanship, and timeless lifestyle essentials. From unforgettable fragrances to premium leather accessories and handmade soaps, every MYRA product is designed to feel personal, premium, and memorable.
            </p>
            
            <p className="text-stone-500 font-sans text-xs sm:text-sm leading-relaxed font-light">
              Starting as a small family apothecary scent laboratory, our legacy grew by anchoring our olfactory pyramids to traditional leatherwork methods. Today, our master craftspeople in Italy and botanists custom cure each element to ensure that when it reaches your boundary, it inspires absolute composure.
            </p>

            <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-stone-200/50">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-leather-tan" />
                <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">100% Traceable Logs</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#2e7d32]" />
                <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">Cruelty-Free Tested</span>
              </div>
            </div>
          </div>

          {/* Half label mockup on right Side */}
          <div className="lg:col-span-6 flex items-center justify-center relative">
            
            {/* Visual background luxury elements */}
            <div className="absolute inset-0 bg-gradient-to-tr from-rose-pastel/20 to-lavender-pastel/30 rounded-3xl -z-10 filter blur-xl transform scale-95" />
            
            {/* Visual branding video presentation */}
            <div className="w-full max-w-md rounded-3xl shadow-2xl relative overflow-hidden ring-1 ring-black/5 flex items-center justify-center bg-stone-950 aspect-square md:aspect-[4/5]">
              <video 
                key={videoUrl}
                className="absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity duration-700 ease-in-out hover:opacity-100"
                autoPlay 
                loop 
                muted 
                playsInline
                src={videoUrl}
              />
            </div>
                        
          </div>

        </div>
      </section>

      {/* BOUTIQUE LOCATIONS SECTION */}
      {dbLocations.length === 0 ? (
        <section id="location" className="py-2.5 bg-stone-50/50 text-center select-none">
          <span className="text-[9px] uppercase tracking-[0.25em] font-medium text-stone-400/80 font-sans">
            COMING SOON
          </span>
        </section>
      ) : (
        <section id="location" className="py-24 bg-gradient-to-tr from-stone-50 via-stone-100 to-[#FCFAF8] border-y border-stone-200/50">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <div className="text-center space-y-3 mb-16">
              <span className="text-xs uppercase tracking-widest text-[#C68B59] font-bold">Experience In Person</span>
              <h2 className="text-3xl md:text-5xl font-serif font-medium text-stone-900">Find MYRA Luxury Near You</h2>
              <div className="w-12 h-0.5 bg-leather-tan mx-auto mt-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dbLocations.map((loc) => {
                // Parse potential full iframe string or raw URL
                const getMapEmbedSrc = (urlOrIframe: string | undefined): string | null => {
                  if (!urlOrIframe) return null;
                  const match = urlOrIframe.match(/src="([^"]+)"/);
                  if (match && match[1]) {
                    return match[1];
                  }
                  return urlOrIframe.trim();
                };
                const embedSrc = getMapEmbedSrc(loc.mapEmbedUrl);
                
                // Fallback custom keyless URL coordinate to ensure map shows immediately on front-end
                const finalEmbedSrc = embedSrc || `https://maps.google.com/maps?q=${encodeURIComponent(loc.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

                return (
                  <div 
                    key={loc.id}
                    className="bg-white rounded-3xl p-6 border border-stone-200/50 hover:border-leather-tan shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Visual Map Placeholder or Live Google Maps Embed */}
                      <div className="w-full h-32 rounded-2xl mb-4 overflow-hidden border border-stone-200/30 shadow-inner bg-stone-100 relative group/map cursor-pointer">
                        <iframe
                          src={finalEmbedSrc}
                          className="w-full h-full border-0 pointer-events-none select-none"
                          allowFullScreen={false}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        {/* Hover Overlay triggers beautiful live maps copy interaction */}
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            navigator.clipboard.writeText(loc.address);
                            triggerToast(`Copied "${loc.name}" address seamlessly! Opening Google Maps...`);
                          }}
                          className="absolute inset-0 bg-stone-900/5 group-hover/map:bg-stone-900/35 transition-all flex items-center justify-center opacity-0 group-hover/map:opacity-100 duration-300"
                        >
                          <span className="bg-white text-stone-950 font-serif text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-lg font-bold select-none flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-leather-tan" />
                            Open Live Maps
                          </span>
                        </a>
                      </div>

                      <h3 className="text-base font-serif font-bold text-stone-900 group-hover:text-leather-tan transition-colors">
                        {loc.name}
                      </h3>
                      
                      <div className="space-y-2 mt-3 text-xs text-stone-600 font-sans">
                        <p className="flex items-start gap-1.5 leading-normal">
                          <MapPin className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
                          <span>{loc.address}</span>
                        </p>
                        <p className="flex items-center gap-1.5 leading-normal">
                          <Phone className="w-4 h-4 text-stone-400 flex-shrink-0" />
                          <span>{loc.phone}</span>
                        </p>
                        <p className="flex items-start gap-1.5 leading-normal">
                          <Clock className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
                          <span>{loc.hours}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 pt-3 border-t border-stone-100">
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          navigator.clipboard.writeText(loc.address);
                          triggerToast(`Copied "${loc.name}" address securely! Launching routing directions...`);
                        }}
                        className="w-full py-2 bg-stone-50 hover:bg-stone-950 text-stone-700 hover:text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer block text-center"
                      >
                        Get Directions
                      </a>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* PREMIUM CONTACT SECTION & SUBMISSION STORY */}
      <section id="contact" className="py-24 px-6 max-w-4xl mx-auto w-full">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs uppercase tracking-widest text-[#C68B59] font-bold">Priority Curation</span>
          <h2 className="text-3xl md:text-5xl font-serif font-medium text-stone-900">Contact Curators</h2>
          <div className="w-12 h-0.5 bg-leather-tan mx-auto mt-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          
          {/* Form left Column */}
          <div className="md:col-span-12">
            
            {formSubmitted ? (
              /* Thank You Card with Sparkles and Anim arrows */
              <div className="bg-white rounded-3xl p-8 shadow-xl text-center border border-[#E2F0CB]/50 flex flex-col items-center justify-center p-12 relative overflow-hidden h-full">
                
                {/* Sparkle background elements */}
                <span className="absolute top-8 left-1/4 text-rose-pastel text-2xl animate-ping">✨</span>
                <span className="absolute bottom-8 right-1/4 text-purple-200 text-3xl animate-pulse">✨</span>
                
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-6">
                  <Check className="w-8 h-8 text-emerald-600 animate-pulse" />
                </div>

                <h3 className="text-3xl font-serif font-bold text-stone-900 mb-2">Thank You, {contactName}!</h3>
                <p className="text-[#C68B59] font-serif italic text-lg mb-4">“Your luxury journey starts here.”</p>
                
                <p className="text-stone-500 text-xs md:text-sm max-w-md mx-auto leading-relaxed mb-6">
                  Our sensory, scent, and leather curators are preparing dynamic response keys. A private coordinator will respond to your selected interest in <strong>{contactInterest}</strong> at <strong>{contactEmail}</strong>. 
                </p>

                <div className="flex items-center gap-1 text-[11px] text-stone-400 font-bold uppercase tracking-wider animate-bounce mt-4">
                  Curators standing by <ArrowRight className="w-3.5 h-3.5 text-leather-tan ml-1" />
                </div>

                <button 
                  onClick={() => {
                    setFormSubmitted(false);
                    setContactName("");
                    setContactEmail("");
                    setContactPhone("");
                    setContactMessage("");
                  }}
                  className="mt-8 px-6 py-2.5 bg-stone-950 hover:bg-leather-tan text-white text-xs font-semibold rounded-lg shadow cursor-pointer transition-colors"
                >
                  Message Curators Again
                </button>
              </div>
            ) : (
              /* Contact Form */
              <form onSubmit={handleContactSubmit} className="bg-white rounded-3xl p-6 md:p-10 shadow-lg border border-stone-200/50 space-y-6">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-stone-600" htmlFor="contact-name">
                      Full Name *
                    </label>
                    <input 
                      id="contact-name"
                      type="text" 
                      required
                      placeholder="e.g. Elena Rostova"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-leather-tan"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-stone-600" htmlFor="contact-phone">
                      Phone Number
                    </label>
                    <input 
                      id="contact-phone"
                      type="tel" 
                      placeholder="+1 (555) 000-0000"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-leather-tan"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-stone-600" htmlFor="contact-email">
                      Email Address *
                    </label>
                    <input 
                      id="contact-email"
                      type="email" 
                      required
                      placeholder="elena@example.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-leather-tan"
                    />
                  </div>

                  {/* Dropdown product interest */}
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-stone-600" htmlFor="product-interest">
                      Bespoke Product Interest
                    </label>
                    <select 
                      id="product-interest"
                      value={contactInterest}
                      onChange={(e) => setContactInterest(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-leather-tan text-stone-800"
                    >
                      <option value="Perfumes">Perfumes / Eau De Parfum</option>
                      <option value="Leather Belts">Premium Leather Belts</option>
                      <option value="Leather Wallets">Premium Leather Wallets</option>
                      <option value="Handmade Soaps">Handcrafted Bio Soaps</option>
                      <option value="Gift Sets">Exquisite Multi Gift Boxes</option>
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-stone-600" htmlFor="contact-msg">
                    Aesthetic Vision / Inquiry Details
                  </label>
                  <textarea 
                    id="contact-msg"
                    rows={4}
                    placeholder="Describe your premium sensory goals or address matching requirements..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-leather-tan"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[10px] text-stone-400 font-medium">
                    * Required fields for priority curation matching
                  </span>
                  
                  <button 
                    id="send-curators-btn"
                    type="submit"
                    className="bg-stone-950 hover:bg-leather-tan text-white font-bold px-8 py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md active:translate-y-0.5 cursor-pointer flex items-center gap-2"
                  >
                    Send Message <Send className="w-4 h-4" />
                  </button>
                </div>

              </form>
            )}

          </div>

        </div>
      </section>
        </>
      ) : (
        /* SPECIALIZED LUXURY COMPLIANCE & POLICY PAGES SECTION */
        <div className="pt-24 sm:pt-28 pb-16 bg-[#FAF8F5] min-h-[80vh] flex flex-col justify-center font-sans tracking-wide">
          <div className="max-w-4xl mx-auto px-6 w-full space-y-10 animate-fade-in text-stone-800">
            
            {/* Breadcrumbs and back indicators */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <button 
                onClick={() => setActiveLegalPage(null)}
                className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-widest uppercase text-stone-500 hover:text-stone-900 transition-colors cursor-pointer border-none bg-transparent"
              >
                <ArrowLeft className="w-4 h-4 text-[#C68B59]" /> Back to Collection
              </button>
              <div className="text-[10px] uppercase font-bold tracking-widest text-[#8A7968]">
                <span>Myra Luxury</span>
                <span className="text-stone-300 mx-2">/</span>
                <span className="text-stone-800">{activeLegalPage.replace("-", " ")}</span>
              </div>
            </div>

            {/* Render dynamic blocks */}
            {activeLegalPage === "about-us" && (
              <div className="space-y-8">
                <div className="space-y-2 text-center sm:text-left">
                  <h2 className="text-3xl sm:text-4xl font-serif font-light text-stone-950 italic">About Our Heritage</h2>
                  <p className="text-xs uppercase tracking-widest text-[#C68B59] font-bold">Defining the Art of Curation at Myra Luxury</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-4">
                  <div className="space-y-4 text-xs text-stone-600 leading-relaxed font-light">
                    <p>
                      Founded upon a passion for sensory excellence, <strong className="text-stone-900 font-medium">Myra Luxury</strong> represents a modern Indian atelier dedicated to traditional artisanship married with contemporary aesthetics. Each of our collections embodies rigorous material sourcing, fine formulation, and conscious creation patterns.
                    </p>
                    <p>
                      Our signature line of <strong className="text-stone-900 font-medium font-serif">Eau De Parfums</strong> is formulated using absolute extracts sourced directly from native flowers—sustainably harvested Indian Jasmine Sambac and Himalayan cedarwood extracts—blended in small cold-milled batches for exceptional carriage and sillage.
                    </p>
                  </div>
                  
                  {/* Photo mockup inside card */}
                  <div className="bg-white/80 p-6 rounded-3xl border border-stone-200/40 shadow-xs space-y-3">
                    <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-[#C68B59] font-serif font-bold italic border border-stone-200 text-sm">M</div>
                    <h4 className="text-xs uppercase tracking-widest font-bold text-stone-800 font-sans">Corporate Foundations</h4>
                    <p className="text-[11px] text-stone-500 leading-normal font-light">
                      We celebrate conscious luxury: utilizing 100% cruelty-free formulation parameters, locally burnished and vegetable-dyed Tuscan leathers, and cold-process botanical solutions. Crafted for those who appreciate sensory discretion.
                    </p>
                  </div>
                </div>

                {/* Sub-sections of our products */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
                  <div className="bg-white p-5 rounded-2xl border border-stone-100 space-y-2">
                    <h3 className="text-xs uppercase tracking-wider font-extrabold text-stone-850">Luxury Perfumes</h3>
                    <p className="text-[11px] text-stone-500 leading-relaxed font-light">Cruelty-free, pure absolutes, multi-layered base structures resulting in pristine, safe, long-lasting sensory paths.</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-stone-100 space-y-2">
                    <h3 className="text-xs uppercase tracking-wider font-extrabold text-stone-850">Tuscan Leather</h3>
                    <p className="text-[11px] text-[#8a7968] leading-relaxed font-light font-medium">No synthetic vinyl. Pure vegetable-dyed, master burnished, solid cast hardware for elite luxury wear.</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-stone-100 space-y-2">
                    <h3 className="text-xs uppercase tracking-wider font-extrabold text-stone-850">Botanical Soaps</h3>
                    <p className="text-[11px] text-stone-500 leading-relaxed font-light">Hand-milled and cold-cured over 45 days. Formulated with organic shea, avocado fats, and botanical oil cuts.</p>
                  </div>
                </div>
              </div>
            )}

            {activeLegalPage === "contact-us" && (
              <div className="space-y-8">
                <div className="space-y-2 text-center sm:text-left">
                  <h2 className="text-3xl sm:text-4xl font-serif font-light text-stone-900 italic">Contact Our Curators</h2>
                  <p className="text-xs uppercase tracking-widest text-[#C68B59] font-bold">Standard lines for Priority Support & Partnership Inquiries</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4">
                  
                  {/* Left core location keys */}
                  <div className="md:col-span-5 space-y-6 font-light">
                    <div className="bg-white p-6 rounded-3xl border border-stone-200/40 shadow-xs space-y-4">
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase tracking-widest font-extrabold text-stone-400 block">Registered Office Address</span>
                        <address className="text-xs text-stone-850 not-italic leading-relaxed">
                          Myra Luxury<br />
                          Block No-10, Flat 2, Ashiyana Housing Society<br />
                          Jajmau, Kanpur<br />
                          Uttar Pradesh - 208010<br />
                          India
                        </address>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-stone-100">
                        <div>
                          <span className="text-[9px] uppercase tracking-widest font-extrabold text-stone-400 block">Support Hotlines</span>
                          <span className="text-xs text-stone-850 font-semibold font-mono leading-relaxed block">+91 92502 12044</span>
                          <span className="text-xs text-stone-850 font-semibold font-mono leading-relaxed block">+91 82990 70868</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase tracking-widest font-extrabold text-stone-400 block">Digital Mailer Keys</span>
                          <span className="text-xs text-stone-850 font-semibold font-mono block leading-relaxed">supportmyraluxury@gmail.com</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right contact interactive form */}
                  <div className="md:col-span-7 bg-white p-6 rounded-3xl border border-stone-200/40 shadow-xs">
                    {formSubmitted ? (
                      <div className="py-8 text-center space-y-3.5">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600 border border-emerald-300">
                          <Check className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-bold uppercase tracking-wider text-stone-800">Curation Query Placed</h4>
                        <p className="text-[11.5px] text-stone-500 leading-relaxed font-light">
                          Thank you for connecting with Myra Luxury. A senior curation partner has been dispatched to evaluate your specifications. We will revert within 4-6 business hours.
                        </p>
                        <button
                          type="button"
                          onClick={() => setFormSubmitted(false)}
                          className="bg-stone-100 hover:bg-stone-200 text-stone-750 font-bold px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider cursor-pointer font-sans"
                        >
                          Submit new form
                        </button>
                      </div>
                    ) : (
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (contactName.trim() && contactEmail.trim()) {
                            setFormSubmitted(true);
                            triggerToast("Contact ledger updated successfully.");
                          } else {
                            triggerToast("Ensure Name and Email are filled.");
                          }
                        }} 
                        className="space-y-4"
                      >
                        <div className="border-b border-stone-200 pb-1.5 flex justify-between items-center bg-transparent">
                          <h4 className="text-[10px] uppercase tracking-widest font-bold text-[#8A7968]">Submit Sensory Inquiry</h4>
                          <span className="text-[8px] text-stone-450 uppercase font-bold">* Essential</span>
                        </div>

                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9.5px] font-bold uppercase tracking-wider text-stone-500 block">Your Name *</label>
                              <input
                                type="text"
                                required
                                value={contactName}
                                onChange={(e) => setContactName(e.target.value)}
                                placeholder="E.g. David Kapoor"
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-leather-tan"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9.5px] font-bold uppercase tracking-wider text-stone-500 block">Mobile Phone</label>
                              <input
                                type="text"
                                value={contactPhone}
                                onChange={(e) => setContactPhone(e.target.value)}
                                placeholder="+91 9XXXXXXXXX"
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-leather-tan font-mono"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9.5px] font-bold uppercase tracking-wider text-stone-500 block">Email Address *</label>
                            <input
                              type="email"
                              required
                              value={contactEmail}
                              onChange={(e) => setContactEmail(e.target.value)}
                              placeholder="E.g. dkapoor@outlook.com"
                              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-leather-tan"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9.5px] font-bold uppercase tracking-wider text-stone-500 block">Category of Vision</label>
                            <select
                              value={contactInterest}
                              onChange={(e) => setContactInterest(e.target.value)}
                              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-leather-tan text-stone-700"
                            >
                              <option value="Perfumes">Eau De EDP Perfumes</option>
                              <option value="Leather Belts">Hand-burnished Leather Belts</option>
                              <option value="Leather Wallets">Premium Bi-Fold Wallets</option>
                              <option value="Handmade Soaps">Handcrafted Bio Soaps</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9.5px] font-bold uppercase tracking-wider text-stone-500 block">Inquiry Specification *</label>
                            <textarea
                              rows={3}
                              required
                              value={contactMessage}
                              onChange={(e) => setContactMessage(e.target.value)}
                              placeholder="Describe your match request..."
                              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-leather-tan"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-[#1c1917] hover:bg-leather-tan text-white font-bold py-3 mt-1.5 rounded-xl text-[10px] uppercase tracking-widest cursor-pointer transition-colors"
                        >
                          Send Inquiry Message
                        </button>
                      </form>
                    )}
                  </div>

                </div>
              </div>
            )}

            {activeLegalPage === "privacy-policy" && (
              <div className="space-y-6">
                <div className="space-y-2 text-center sm:text-left">
                  <h2 className="text-3xl sm:text-4xl font-serif font-light text-stone-950 italic">Privacy Policy</h2>
                  <p className="text-xs uppercase tracking-widest text-[#C68B59] font-bold">Governing credentials, security hashes, and payment pathways</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-stone-200/40 text-xs text-stone-600 leading-relaxed font-light space-y-4">
                  <p>
                    At <strong className="text-stone-900 font-medium">Myra Luxury</strong>, protecting your private credential keys represents our absolute top priority. This document outlines how we collect, store, and process customer credentials in absolute safety in accordance with the Indian Information Technology Act, 2000.
                  </p>
                  
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs uppercase font-extrabold text-stone-850">1. Payment Credential Processing Safety</h4>
                    <p>
                      All checkout cards, net banking institution logs, and mobile UPI addresses are processed exclusively over 128-bit Secure Sockets Layer (SSL) certificates and PCI-DSS verified endpoints using the **Razorpay Payment Gateway API integration**. No billing logs or cvv parameters are written to Myra Luxury servers.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs uppercase font-extrabold text-stone-850">2. Device Storage & Local States</h4>
                    <p>
                      To ensure seamless cart actions, our platform reserves secure client cache logs inside your browser **LocalStorage**. This maintains selected product IDs and local profile settings between sessions. This data is entirely secure, localized, and under your command.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs uppercase font-extrabold text-[#8a7968]">3. Connection Secure Logs</h4>
                    <p>
                      Your private emails and mobile credentials are never distributed, leased or licensed to secondary operations. You have absolute sovereignty over your profile datasets.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeLegalPage === "terms-conditions" && (
              <div className="space-y-6">
                <div className="space-y-2 text-center sm:text-left">
                  <h2 className="text-3xl sm:text-4xl font-serif font-light text-stone-900 italic">Terms & Conditions</h2>
                  <p className="text-xs uppercase tracking-widest text-[#C68B59] font-bold">Governing online transactions, site usage, and Carriage laws</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-stone-200/40 text-xs text-stone-600 leading-relaxed font-light space-y-4">
                  <p>
                    Please review these Terms & Conditions preceding your acquisition of limited-batch curations from Myra Luxury. Using our boutique services represents contract ratification.
                  </p>

                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs uppercase font-extrabold text-stone-850">1. Commercial Accuracy</h4>
                    <p>
                      All prices, discount codes, shipping fees, or tax parameters rendered across Myra Luxury pages are subject to operational modifications. Items displayed are subject to physical stock limits. If we are unable to process stock due to raw botanical limits, we will trigger instant refunds via Razorpay within 24 business hours.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs uppercase font-extrabold text-stone-850">2. Carriage Limitations</h4>
                    <p>
                      Purchase parameters, customer name, email address, telecommunication lines, and shipping targets provided during the checkout sequence represent carriage instructions. Providing matching, authentic, and deliverable targets remains the buyer's sole liability.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs uppercase font-extrabold text-[#8a7968]">3. Jurisdiction of Uttar Pradesh</h4>
                    <p>
                      All customer disputes, billing controversies, or legal carriages arising from transactions on this ecommerce node will be settled exclusively in courts situated in Kanpur, Uttar Pradesh, India.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeLegalPage === "shipping-policy" && (
              <div className="space-y-6">
                <div className="space-y-2 text-center sm:text-left">
                  <h2 className="text-3xl sm:text-4xl font-serif font-light text-stone-900 italic">Shipping & Logistics Policy</h2>
                  <p className="text-xs uppercase tracking-widest text-[#C68B59] font-bold">Standard India transit timelines, courier associates, and fee structures</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-stone-200/40 text-xs text-stone-600 leading-relaxed font-light space-y-4">
                  <p>
                    To secure maximum transport safety for your luxury items, Myra Luxury processes logistical services exclusively through premium domestic courier associates.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="p-3 bg-stone-50 border border-stone-200/40 rounded-xl space-y-1">
                      <span className="text-[9px] uppercase tracking-widest font-extrabold text-stone-400 block">Delivery Partners</span>
                      <span className="text-xs text-stone-900 font-bold block">Delhivery • BlueDart Express • First Flight</span>
                    </div>

                    <div className="p-3 bg-stone-50 border border-stone-200/40 rounded-xl space-y-1">
                      <span className="text-[9px] uppercase tracking-widest font-extrabold text-stone-400 block">Packaging standards</span>
                      <p className="text-[11px] text-stone-600 font-light">
                        Perfumes are secured in double-strength bubble buffers. Leathers are encased in custom silk duster sleeves and signature gold foil boxes to retain shape.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs uppercase font-extrabold text-stone-850">Logistical Timelines & Charges:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-stone-500">
                      <li><strong className="text-stone-800 font-medium">Boutique Dispatch:</strong> Hand-packed and disengaged to logistics hubs within 24 to 48 hours of secure digital receipt.</li>
                      <li><strong className="text-stone-800 font-medium">Metro Delivery Duration:</strong> 3 to 5 business days for major Indian metropolitan targets (Delhi NCR, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata).</li>
                      <li><strong className="text-stone-800 font-medium">Rest of India Duration:</strong> 5 to 7 business days depending on localized courier accessibility.</li>
                      <li><strong className="text-stone-800 font-medium">Logistical Charges:</strong> Standard carriage charges of ₹50 apply to all deliveries across India.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeLegalPage === "return-refund" && (
              <div className="space-y-6">
                <div className="space-y-2 text-center sm:text-left">
                  <h2 className="text-3xl sm:text-4xl font-serif font-light text-stone-900 italic">Return & Refund Policy</h2>
                  <p className="text-xs uppercase tracking-widest text-[#C68B59] font-bold">Rigorous rules governing damaged item reporting and Razorpay refund settlements</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-stone-200/40 text-xs text-stone-600 leading-relaxed font-light space-y-4">
                  <p>
                    Due to the highly sensitive physical, hygiene, and boutique constraints of our luxury formulations, we operate inside strict, clear-cut trade terms.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-3.5 bg-rose-50/40 border border-rose-200/40 rounded-xl space-y-1">
                      <span className="text-[9px] uppercase tracking-widest font-extrabold text-rose-700 block">Accepted Return Triggers</span>
                      <p className="text-[11px] text-stone-600">
                        Item damage during logistical carriage, physical container leakages, or delivery of wrong item variants.
                      </p>
                    </div>
                    
                    <div className="p-3.5 bg-amber-50/45 border border-amber-200/40 rounded-xl space-y-1">
                      <span className="text-[9px] uppercase tracking-widest font-extrabold text-amber-700 block">Reporting threshold</span>
                      <p className="text-[11px] text-stone-650 leading-tight font-semibold">
                        Must be reported via supportmyraluxury@gmail.com with unedited packaging photos within **48 hours** of delivery receipt.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs uppercase font-extrabold text-stone-850">Mandatory Rules to Ratify Return Approval:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-stone-500">
                      <li>The boutique formulation, bottle, belt, or soap must be entirely **unused**.</li>
                      <li>Item must remain secured in original luxury box packaging inserts and labels intact.</li>
                      <li>Decisions surrounding returns evaluated and granted by senior curators are final.</li>
                    </ul>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-stone-100 pt-3">
                    <h4 className="text-xs uppercase font-extrabold text-emerald-800">Razorpay Refund Settlement Timelines:</h4>
                    <p>
                      Approved refunds are credited directly back to your original source node coordinates (debit card, credit card, net banking account, or UPI VPA) processed securely through Razorpay gateway nodes. This settlement operates and materializes securely within **5 to 7 business days** (complying with Indian Banking System regulations).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Back trigger button */}
            <div className="pt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setActiveLegalPage(null)}
                className="bg-[#1c1917] hover:bg-leather-tan text-white font-bold py-3 px-8 rounded-xl text-xs uppercase tracking-widest transition-colors cursor-pointer font-sans shadow-md"
              >
                Back to main Collection
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FOOTER AREA */}

      <footer className="mt-auto bg-stone-950 text-stone-400 py-16 px-6 relative overflow-hidden border-t border-white/10">
        
        {/* Large Faded Background Watermark Text */}
        <div className="absolute -bottom-10 left-12 right-12 text-center text-stone-900/40 select-none text-[8vw] font-serif font-extrabold tracking-[0.2em] pointer-events-none uppercase">
          {companyName} {companySubtitle}
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 relative z-10 pb-8 border-b border-white/10">
          
          {/* Logo Brand line Column left */}
          <div className="md:col-span-5 space-y-4">
            <a href="#home" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-white border border-white/20 shadow-md">
                <img 
                  src={getVersionedCloudinaryUrl(logoUrl)} 
                  alt={`${companyName} Logo`} 
                  className="w-full h-full object-cover rounded-full" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xl font-serif font-bold tracking-widest text-white">{companyName}</span>
                <span className="text-[9px] font-semibold tracking-widest uppercase text-amber-200 -mt-1.5">{companySubtitle} ATELIER</span>
              </div>
            </a>
            <p className="text-stone-400 text-xs leading-relaxed max-w-sm font-light">
              Premium perfumes, leather essentials, and handmade care products crafted for lasting memories. Dedicated to olfactory composition, sustainably hand-burnished Tuscan leathers, and cold-process botanical cures.
            </p>
            {/* Social Icons row */}
            <div className="flex items-center gap-3 pt-2">
              <a 
                href="https://www.instagram.com/myra_luxury.official?igsh=bDNncTZid2JndHQ0&utm_source=qr" 
                target="_blank" 
                rel="noopener noreferrer" 
                title="Instagram"
                className="w-8 h-8 rounded-full bg-stone-900 hover:bg-leather-tan text-white hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a 
                href="https://youtube.com/@myraluxury?si=XwJASMjQxDSATn7U" 
                target="_blank" 
                rel="noopener noreferrer" 
                title="YouTube"
                className="w-8 h-8 rounded-full bg-stone-900 hover:bg-leather-tan text-white hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a 
                href="mailto:myraluxury.in@gmail.com" 
                title="Email Us"
                className="w-8 h-8 rounded-full bg-stone-900 hover:bg-leather-tan text-white hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links Middle column */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs uppercase font-bold tracking-widest text-[#D4AF37]">Explore Lineage</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <a href="#home" className="hover:text-[#F3E5AB] transition-colors py-1 block">Home</a>
              <a href="#signature" className="hover:text-[#F3E5AB] transition-colors py-1 block">Collection</a>
              <a href="#perfumes" className="hover:text-[#F3E5AB] transition-colors py-1 block">Perfumes</a>
              <a href="#leather" className="hover:text-[#F3E5AB] transition-colors py-1 block">Leather Goods</a>
              <a href="#soaps" className="hover:text-[#F3E5AB] transition-colors py-1 block">Handmade Soaps</a>
              <a href="#giftsets" className="hover:text-[#F3E5AB] transition-colors py-1 block">Gift Sets</a>
              <a href="#about" className="hover:text-[#F3E5AB] transition-colors py-1 block">About Story</a>
              <a href="#contact" className="hover:text-[#F3E5AB] transition-colors py-1 block">Contact</a>
            </div>
          </div>

          {/* Email Subscription Column Right */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="text-xs uppercase font-bold tracking-widest text-[#D4AF37]">Priority Curation Updates</h4>
            <p className="text-xs text-stone-400 font-light leading-normal">
              Subscribe to standard sensory notifications. Be notified of limited batch perfume cuts, newly imported tanner shipments, and botanical seasonal soap drops.
            </p>
            
            {newsletterSubscribed ? (
              <div className="bg-stone-900/60 p-3 rounded-lg border border-emerald-500/30 text-xs text-emerald-400 font-sans font-semibold">
                ✓ priority access credentials confirmed. Check inbox!
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input 
                  type="email" 
                  required
                  placeholder="Insert premium email address" 
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="bg-stone-900 border border-stone-850 rounded-xl px-4 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] flex-1 min-w-0"
                />
                <button 
                  type="submit"
                  className="bg-white hover:bg-[#D4AF37] text-stone-950 hover:text-stone-950 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Confirm
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Footer legal bar */}
        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-stone-600 relative z-10 font-medium">
          <span>&copy; {new Date().getFullYear()} {companyName} {companySubtitle} S.p.A. All Curation Rights Reserved.</span>
          <div className="flex flex-wrap gap-x-4 gap-y-2 items-center justify-center sm:justify-end text-stone-500">
            <button onClick={() => setActiveLegalPage("about-us")} className="hover:text-amber-200 transition-all cursor-pointer bg-transparent border-none p-0 outline-none uppercase font-bold text-[9px] tracking-wider">About Us</button>
            <span className="text-stone-800">•</span>
            <button onClick={() => setActiveLegalPage("contact-us")} className="hover:text-amber-200 transition-all cursor-pointer bg-transparent border-none p-0 outline-none uppercase font-bold text-[9px] tracking-wider">Contact Us</button>
            <span className="text-stone-800">•</span>
            <button onClick={() => setActiveLegalPage("privacy-policy")} className="hover:text-amber-200 transition-all cursor-pointer bg-transparent border-none p-0 outline-none uppercase font-bold text-[9px] tracking-wider">Privacy Policy</button>
            <span className="text-stone-800">•</span>
            <button onClick={() => setActiveLegalPage("terms-conditions")} className="hover:text-amber-200 transition-all cursor-pointer bg-transparent border-none p-0 outline-none uppercase font-bold text-[9px] tracking-wider">Terms & Conditions</button>
            <span className="text-stone-800">•</span>
            <button onClick={() => setActiveLegalPage("shipping-policy")} className="hover:text-amber-200 transition-all cursor-pointer bg-transparent border-none p-0 outline-none uppercase font-bold text-[9px] tracking-wider">Shipping Policy</button>
            <span className="text-stone-800">•</span>
            <button onClick={() => setActiveLegalPage("return-refund")} className="hover:text-amber-200 transition-all cursor-pointer bg-transparent border-none p-0 outline-none uppercase font-bold text-[9px] tracking-wider">Return & Refund</button>
            <span className="text-stone-800 hidden sm:inline">•</span>
            <button 
              onClick={() => setAdminOpen(true)} 
              className="text-[#D4AF37] hover:text-white transition-colors cursor-pointer font-bold tracking-widest uppercase text-[9px] bg-stone-900 hover:bg-stone-800 px-2.5 py-1 rounded-lg border border-[#D4AF37]/40 hover:border-[#D4AF37] shadow-sm flex items-center gap-1.5 font-sans"
            >
              <span className="w-1 h-1 rounded-full bg-[#D4AF37]" />
              Atelier Supervisor Node
            </button>
          </div>
        </div>

      </footer>

      {/* ATELIER DETAILS SLIDE OVER / CENTER DIALOG MODAL */}
      <ProductDetailModal 
        product={activeDetailProduct}
        onClose={() => setActiveDetailProduct(null)}
        onAddToCart={handleAddToCart}
        isWishlisted={activeDetailProduct ? isWishlisted(activeDetailProduct.id) : false}
        onToggleWishlist={activeDetailProduct ? () => toggleWishlist(activeDetailProduct.id) : undefined}
        onUpdateProduct={(updatedProd) => {
          setDbProducts(prev => prev.map(p => p.id === updatedProd.id ? updatedProd : p));
          setActiveDetailProduct(updatedProd);
        }}
        triggerToast={triggerToast}
      />

      {/* ATELIER CART FLOATING SIDE PANEL */}
      <CartDrawer 
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={handleClearCart}
        triggerToast={triggerToast}
        onOpenProfile={() => {
          setCartOpen(false);
          setProfileOpen(true);
        }}
      />

      {/* MYRA PRIVÉ CLUB PROFILE MODAL */}
      <ProfileModal 
        isOpen={profileOpen}
        onClose={() => {
          setProfileOpen(false);
          setProfileInitialTab("card"); // Reset when closed
        }}
        initialTab={profileInitialTab}
        triggerToast={triggerToast}
      />

      {/* MYRA ADMIN CONSOLE CONTROLLER */}
      {adminOpen && (
        <AdminPortal 
          isOpen={adminOpen}
          onClose={() => setAdminOpen(false)}
          products={dbProducts}
          orders={orders}
          onProductsChange={(updatedProducts) => {
            isLocalChange.current = true;
            setDbProducts(updatedProducts);
          }}
          onOrdersChange={(updatedOrders) => {
            setOrders(updatedOrders);
          }}
          messages={messages}
          onMessagesChange={(updatedMessages) => {
            setMessages(updatedMessages);
          }}
          locations={dbLocations}
          onLocationsChange={(updatedLocations) => {
            setDbLocations(updatedLocations);
          }}
          triggerToast={triggerToast}
          videoUrl={videoUrl}
          onVideoUrlChange={(newUrl) => {
            setVideoUrl(newUrl);
          }}
          heroBgUrl={heroBgUrl}
          onHeroBgUrlChange={(newBg) => {
            setHeroBgUrl(newBg);
          }}
          logoUrl={logoUrl}
          onLogoUrlChange={setLogoUrl}
          companyName={companyName}
          onCompanyNameChange={setCompanyName}
          companySubtitle={companySubtitle}
          onCompanySubtitleChange={setCompanySubtitle}
          bannerUrl={bannerUrl}
          onBannerUrlChange={setBannerUrl}
          seoData={seoData}
          onSeoDataChange={(newSeoData) => {
            setSeoData(newSeoData);
            localStorage.setItem("myra_seo_data", JSON.stringify(newSeoData));
          }}
        />
      )}

    </div>
  );
}

