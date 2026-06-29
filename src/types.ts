export interface FragranceNotes {
  top: string[];
  heart: string[];
  base: string[];
  category: "floral" | "musk" | "oud" | "vanilla" | "fresh" | "woody";
}

export interface SizeVariant {
  id: string;
  size: string; // e.g. "20ml", "50ml", "80ml", "100ml"
  price: number;
  sizeOrSpec: string;
  bgColorClass: string;
  imagePlaceholderId: string;
}

export interface Product {
  id: string;
  name: string;
  category: "perfumes" | "leather_belts" | "leather_wallets" | "handmade_soaps" | "gift_sets";
  categoryLabel: string;
  price: number;
  rating: number;
  reviewsCount: number;
  description: string;
  isBestSeller?: boolean;
  isNew?: boolean;
  sizeOrSpec?: string; // e.g. "100ml", "Full Grain Tan", "Handcrafted Cold Process"
  sizeVariants?: SizeVariant[];
  
  // Custom theme attributes
  bgColorClass: string; // Tailwind class or custom hex background for boutique look
  accentColorClass: string; // Border or tag color
  textColorClass?: string;
  
  // Specific Product Specifics
  fragranceNotes?: FragranceNotes;
  leatherType?: string; // e.g. "Vegetable Tanned Leather", "Full Grain Italian Leather"
  soapIngredients?: string[];
  skinFeel?: string[]; // e.g. ["Fresh", "Soft", "Hydrating", "Natural"]
  
  // High quality premium placeholder SVG or reference identifier
  imagePlaceholderId: string;
  stock?: number;
  reviews?: Review[];
  codAvailable?: boolean;

  // Shipping configuration parameters (Delhivery Integration)
  weight?: number; // Weight in grams
  length?: number; // Length in cm
  width?: number; // Width in cm
  height?: number; // Height in cm
  fragile?: boolean; // Is fragile item
  shippingCategory?: string; // Shipping category (e.g. "Liquids", "Leathers", "Standard")
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface StoreLocation {
  id: string;
  name: string;
  tagline: string;
  address: string;
  phone: string;
  hours: string;
  coordinatesPlaceholder: string; // simple SVG map or location art
  mapEmbedUrl?: string; // real embeddable Google Maps iframe src
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
  image?: string;
  userId?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  interest?: string;
  message: string;
  date: string;
  isRead?: boolean;
}

export interface PromoCode {
  code: string;
  type: "fixed" | "percentage" | "free_shipping";
  value: number;
  active: boolean;
  description: string;
}

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
}


