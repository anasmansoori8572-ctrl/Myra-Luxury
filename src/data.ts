import { Product, StoreLocation, Review } from "./types";

export const products: Product[] = [
  // --- PERFUMES ---
  {
    id: "perfume-flora-100",
    name: "Flora Luxe Eau De Parfum",
    category: "perfumes",
    categoryLabel: "Eau De Parfum",
    price: 185,
    rating: 4.9,
    reviewsCount: 124,
    description: "Our signature bouquet masterpiece. Elegantly layered, blooming with delicate wild jasmine, French red rose, and deep warm amber notes. A captivating tribute to natural luxury.",
    sizeOrSpec: "100ml Standard Edition",
    bgColorClass: "bg-gradient-to-tr from-rose-pastel/60 to-lavender-pastel/50",
    accentColorClass: "border-rose-300 text-rose-700",
    isBestSeller: true,
    weight: 350,
    length: 12,
    width: 8,
    height: 14,
    fragile: true,
    shippingCategory: "Liquids",
    fragranceNotes: {
      top: ["Wild Jasmine", "Neroli", "Mandarin"],
      heart: ["Red Rose", "Peony", "Ylang-Ylang"],
      base: ["Warm Amber", "Sensual Musk", "Sandalwood"],
      category: "floral"
    },
    imagePlaceholderId: "perfume-flora",
    sizeVariants: [
      { id: "perfume-flora-10", size: "10ml", price: 38, sizeOrSpec: "10ml Travel Rollerball", bgColorClass: "bg-gradient-to-tr from-peach-pastel/60 to-rose-pastel/50", imagePlaceholderId: "perfume-mini" },
      { id: "perfume-flora-25", size: "25ml", price: 75, sizeOrSpec: "25ml Travel Flacon", bgColorClass: "bg-gradient-to-tr from-lavender-pastel/50 to-rose-pastel/40", imagePlaceholderId: "perfume-flora-25" },
      { id: "perfume-flora-50", size: "50ml", price: 115, sizeOrSpec: "50ml Classic", bgColorClass: "bg-gradient-to-tr from-rose-pastel/50 to-peach-pastel/50", imagePlaceholderId: "perfume-flora-50" },
      { id: "perfume-flora-100", size: "100ml", price: 185, sizeOrSpec: "100ml Standard Edition", bgColorClass: "bg-gradient-to-tr from-rose-pastel/60 to-lavender-pastel/50", imagePlaceholderId: "perfume-flora" }
    ]
  },
  {
    id: "perfume-oud-100",
    name: "Oud Bloom Eau De Parfum",
    category: "perfumes",
    categoryLabel: "Eau De Parfum",
    price: 210,
    rating: 4.9,
    reviewsCount: 96,
    description: "A mysterious, opulent olfactory experience. Rich agarwood resin fused with velvety damask rose and smoky patchouli, settled on pure Madagascan vanilla.",
    sizeOrSpec: "100ml Reserve Edition",
    bgColorClass: "bg-gradient-to-tr from-peach-pastel/50 to-leather-tan/20",
    accentColorClass: "border-amber-400 text-amber-950",
    isNew: true,
    fragranceNotes: {
      top: ["Saffron", "Cardamom"],
      heart: ["Damask Rose", "Geranium"],
      base: ["Indonesian Oud", "Patchouli", "Vanilla Absolute"],
      category: "oud"
    },
    imagePlaceholderId: "perfume-oud",
    sizeVariants: [
      { id: "perfume-oud-20", size: "20ml", price: 75, sizeOrSpec: "20ml Travel Flacon", bgColorClass: "bg-gradient-to-tr from-peach-pastel/30 to-leather-tan/10", imagePlaceholderId: "perfume-oud-20" },
      { id: "perfume-oud-50", size: "50ml", price: 135, sizeOrSpec: "50ml Atelier Bottle", bgColorClass: "bg-gradient-to-tr from-peach-pastel/45 to-leather-tan/20", imagePlaceholderId: "perfume-oud-50" },
      { id: "perfume-oud-80", size: "80ml", price: 180, sizeOrSpec: "80ml House Reserve", bgColorClass: "bg-gradient-to-tr from-peach-pastel/50 to-leather-tan/25", imagePlaceholderId: "perfume-oud-80" },
      { id: "perfume-oud-100", size: "100ml", price: 210, sizeOrSpec: "100ml Reserve Edition", bgColorClass: "bg-gradient-to-tr from-peach-pastel/55 to-leather-tan/30", imagePlaceholderId: "perfume-oud" }
    ]
  },
  {
    id: "perfume-aqua-100",
    name: "Aqua Mist Eau De Parfum",
    category: "perfumes",
    categoryLabel: "Eau De Parfum",
    price: 165,
    rating: 4.8,
    reviewsCount: 74,
    description: "An invigorating coastal escape. Pure marine minerals, salty air, and fresh Italian bergamot balanced with drift oakmoss and light green sage.",
    sizeOrSpec: "100ml Mist Flacon",
    bgColorClass: "bg-gradient-to-tr from-aqua-pastel/60 to-sage-pastel/50",
    accentColorClass: "border-teal-300 text-teal-800",
    fragranceNotes: {
      top: ["Sea Salt", "Bergamot", "Lemon Peel"],
      heart: ["Crisp Marine", "Clary Sage"],
      base: ["Driftwood", "Ambergris", "Oakmoss"],
      category: "fresh"
    },
    imagePlaceholderId: "perfume-aqua",
    sizeVariants: [
      { id: "perfume-aqua-20", size: "20ml", price: 65, sizeOrSpec: "20ml Travel Spritzer", bgColorClass: "bg-gradient-to-tr from-aqua-pastel/40 to-sage-pastel/40", imagePlaceholderId: "perfume-aqua-20" },
      { id: "perfume-aqua-50", size: "50ml", price: 110, sizeOrSpec: "50ml Mid-Size Flacon", bgColorClass: "bg-gradient-to-tr from-aqua-pastel/50 to-sage-pastel/45", imagePlaceholderId: "perfume-aqua-50" },
      { id: "perfume-aqua-80", size: "80ml", price: 145, sizeOrSpec: "80ml Master Flacon", bgColorClass: "bg-gradient-to-tr from-aqua-pastel/55 to-sage-pastel/50", imagePlaceholderId: "perfume-aqua-80" },
      { id: "perfume-aqua-100", size: "100ml", price: 165, sizeOrSpec: "100ml Mist Flacon", bgColorClass: "bg-gradient-to-tr from-aqua-pastel/60 to-sage-pastel/55", imagePlaceholderId: "perfume-aqua" }
    ]
  },
  {
    id: "perfume-rose-100",
    name: "Rose Aura Eau De Parfum",
    category: "perfumes",
    categoryLabel: "Eau De Parfum",
    price: 175,
    rating: 4.9,
    reviewsCount: 104,
    description: "Soft velvet petalled dreamscape. Centered around morning-dew rose petals with green ivy trails, finishing with soft vanilla and comforting white wood cords.",
    sizeOrSpec: "100ml Special Edition",
    bgColorClass: "bg-gradient-to-tr from-rose-pastel/60 to-aqua-pastel/40",
    accentColorClass: "border-rose-400 text-rose-800",
    fragranceNotes: {
      top: ["Green Ivy", "Lychee"],
      heart: ["Morning Rose", "Magnolia"],
      base: ["White Musk", "Cedarwood", "Vanilla Bean"],
      category: "vanilla"
    },
    imagePlaceholderId: "perfume-rose",
    sizeVariants: [
      { id: "perfume-rose-20", size: "20ml", price: 70, sizeOrSpec: "20ml Travel Spray", bgColorClass: "bg-gradient-to-tr from-rose-pastel/40 to-aqua-pastel/30", imagePlaceholderId: "perfume-rose-20" },
      { id: "perfume-rose-50", size: "50ml", price: 115, sizeOrSpec: "50ml Classic Spritzer", bgColorClass: "bg-gradient-to-tr from-rose-pastel/50 to-aqua-pastel/35", imagePlaceholderId: "perfume-rose-50" },
      { id: "perfume-rose-80", size: "80ml", price: 150, sizeOrSpec: "80ml Collection Edition", bgColorClass: "bg-gradient-to-tr from-rose-pastel/55 to-aqua-pastel/40", imagePlaceholderId: "perfume-rose-80" },
      { id: "perfume-rose-100", size: "100ml", price: 175, sizeOrSpec: "100ml Special Edition", bgColorClass: "bg-gradient-to-tr from-rose-pastel/60 to-aqua-pastel/45", imagePlaceholderId: "perfume-rose" }
    ]
  },

  // --- LEATHER BELTS ---
  {
    id: "leather-belt-classic-tan",
    name: "Classic Tan Leather Belt",
    category: "leather_belts",
    categoryLabel: "Premium Leather Goods",
    price: 120,
    rating: 4.8,
    reviewsCount: 110,
    description: "Premium vegetable-tanned genuine leather with flawless edge paint finish. Designed with a solid brass brushed buckle that ages gorgeously with use.",
    sizeOrSpec: "Width 35mm / Full Grain Italian",
    bgColorClass: "bg-gradient-to-tr from-peach-pastel/70 to-leather-tan/30",
    accentColorClass: "border-amber-600 text-amber-900",
    isBestSeller: true,
    leatherType: "Vegetable Tanned Leather",
    imagePlaceholderId: "leather-belt-tan"
  },
  {
    id: "leather-belt-deep-brown",
    name: "Deep Brown Leather Belt",
    category: "leather_belts",
    categoryLabel: "Premium Leather Goods",
    price: 125,
    rating: 4.9,
    reviewsCount: 63,
    description: "Dark mahogany deep chocolate shade crafted in hand-polished full-grain leather. Hand-stitched with durable oiled thread for enduring strength.",
    sizeOrSpec: "Width 35mm / Brushed Gold Buckle",
    bgColorClass: "bg-gradient-to-tr from-leather-tan/20 to-leather-dark/40",
    accentColorClass: "border-stone-500 text-stone-900",
    leatherType: "Hand-Polished Full Grain Leather",
    imagePlaceholderId: "leather-belt-brown"
  },

  // --- LEATHER WALLETS ---
  {
    id: "leather-wallet-black-premium",
    name: "Black Premium Leather Wallet",
    category: "leather_wallets",
    categoryLabel: "Premium Leather Goods",
    price: 95,
    rating: 4.9,
    reviewsCount: 142,
    description: "A luxurious bifold layout in buttery-smooth full-grain black calf leather. Includes RFID blocking protection, 6 card slots, and an artisanal currency sleeve.",
    sizeOrSpec: "Bifold Classic / RFID Safe",
    bgColorClass: "bg-gradient-to-tr from-charcoal/10 to-stone-400/20",
    accentColorClass: "border-stone-700 text-stone-950",
    isBestSeller: true,
    leatherType: "Matte Black Calf Leather",
    imagePlaceholderId: "leather-wallet-black"
  },
  {
    id: "leather-wallet-tan-slim",
    name: "Tan Slim Leather Wallet",
    category: "leather_wallets",
    categoryLabel: "Premium Leather Goods",
    price: 85,
    rating: 4.7,
    reviewsCount: 78,
    description: "Ultra-thin minimal cardholder format. Perfect front-pocket security, hand-burnished edges, featuring a dual-exit quick-draw slot.",
    sizeOrSpec: "Minimalist Slim Wallet / RFID Safe",
    bgColorClass: "bg-gradient-to-tr from-peach-pastel/50 to-leather-tan/40",
    accentColorClass: "border-amber-500/50 text-amber-900",
    isNew: true,
    leatherType: "Full Grain Tan Leather",
    imagePlaceholderId: "leather-wallet-tan"
  },

  // --- HANDMADE SOAPS ---
  {
    id: "soap-rose-glow",
    name: "Rose Glow Handmade Soap",
    category: "handmade_soaps",
    categoryLabel: "Botanical Self-Care",
    price: 24,
    rating: 4.9,
    reviewsCount: 185,
    description: "Indulgent cold-process soap bar rich with skin-plumping wild rose oil, gently exfoliating rose-clay mineral, and deeply conditioning organic shear butter.",
    sizeOrSpec: "150g Fresh-Cut Bar",
    bgColorClass: "bg-gradient-to-tr from-rose-pastel/70 to-peach-pastel/50",
    accentColorClass: "border-rose-400 text-rose-700",
    isBestSeller: true,
    soapIngredients: ["Saponified Coconut Oil", "Pure Wild Rosehip Oil", "French Red Pink Clay", "Raw Shear Butter", "Geranium Essential Oil"],
    skinFeel: ["Fresh", "Soft", "Gently Exfoliating", "Velvet Radiance"],
    imagePlaceholderId: "soap-rose",
    sizeVariants: [
      { id: "soap-rose-100g", size: "100g", price: 18, sizeOrSpec: "100g Petite Guest Bar", bgColorClass: "bg-gradient-to-tr from-rose-pastel/50 to-peach-pastel/40", imagePlaceholderId: "soap-rose" },
      { id: "soap-rose-150g", size: "150g", price: 24, sizeOrSpec: "150g Standard Classic Bar", bgColorClass: "bg-gradient-to-tr from-rose-pastel/70 to-peach-pastel/50", imagePlaceholderId: "soap-rose" },
      { id: "soap-rose-250g", size: "250g", price: 36, sizeOrSpec: "250g Luxury Atelier Block", bgColorClass: "bg-gradient-to-tr from-rose-pastel/80 to-peach-pastel/60", imagePlaceholderId: "soap-rose" }
    ]
  },
  {
    id: "soap-aloe-fresh",
    name: "Aloe Fresh Handmade Soap",
    category: "handmade_soaps",
    categoryLabel: "Botanical Self-Care",
    price: 22,
    rating: 4.8,
    reviewsCount: 92,
    description: "Extremely cooling bar with wild home-harvested organic aloe vera juice, anti-oxidants from green tea extract, and moisturising mountain honey extract.",
    sizeOrSpec: "150g Organic Bar",
    bgColorClass: "bg-gradient-to-tr from-sage-pastel/60 to-aqua-pastel/60",
    accentColorClass: "border-green-400 text-green-800",
    soapIngredients: ["Organic Aloe Leaf Extract", "Hydrating Avocado Oil", "Green Tea Infused Water", "Raw Mountain Honey"],
    skinFeel: ["Crisp", "Hydrating", "Natural Aloe Feel", "Cooling Calmer"],
    imagePlaceholderId: "soap-aloe",
    sizeVariants: [
      { id: "soap-aloe-100g", size: "100g", price: 16, sizeOrSpec: "100g Petite Guest Bar", bgColorClass: "bg-gradient-to-tr from-sage-pastel/50 to-aqua-pastel/50", imagePlaceholderId: "soap-aloe" },
      { id: "soap-aloe-150g", size: "150g", price: 22, sizeOrSpec: "150g Standard Organic Bar", bgColorClass: "bg-gradient-to-tr from-sage-pastel/60 to-aqua-pastel/60", imagePlaceholderId: "soap-aloe" },
      { id: "soap-aloe-250g", size: "250g", price: 32, sizeOrSpec: "250g Luxury Collective Block", bgColorClass: "bg-gradient-to-tr from-sage-pastel/70 to-aqua-pastel/70", imagePlaceholderId: "soap-aloe" }
    ]
  },
  {
    id: "soap-lavender-calm",
    name: "Lavender Calm Handmade Soap",
    category: "handmade_soaps",
    categoryLabel: "Botanical Self-Care",
    price: 24,
    rating: 4.9,
    reviewsCount: 165,
    description: "Ultimate night-time selfcare comfort. Contains premium English lavender oil and organic crushed lavender buds to sweep away stresses of the day.",
    sizeOrSpec: "150g Handcrafted Cold-Cured",
    bgColorClass: "bg-gradient-to-tr from-lavender-pastel/70 to-rose-pastel/40",
    accentColorClass: "border-purple-300 text-purple-800",
    isBestSeller: true,
    soapIngredients: ["Pure Lavender Oil", "Extra Virgin Olive Oil", "Crushed Lavender Petals", "Organic Goat Milk"],
    skinFeel: ["Relaxing", "Soft Moisture", "Silky Lather", "Stress Relief"],
    imagePlaceholderId: "soap-lavender",
    sizeVariants: [
      { id: "soap-lavender-100g", size: "100g", price: 18, sizeOrSpec: "100g Guest Comfort Bar", bgColorClass: "bg-gradient-to-tr from-lavender-pastel/65 to-rose-pastel/35", imagePlaceholderId: "soap-lavender" },
      { id: "soap-lavender-150g", size: "150g", price: 24, sizeOrSpec: "150g Handcrafted Cold-Cured", bgColorClass: "bg-gradient-to-tr from-lavender-pastel/70 to-rose-pastel/40", imagePlaceholderId: "soap-lavender" },
      { id: "soap-lavender-250g", size: "250g", price: 36, sizeOrSpec: "250g Grand Calming Slabs", bgColorClass: "bg-gradient-to-tr from-lavender-pastel/80 to-rose-pastel/50", imagePlaceholderId: "soap-lavender" }
    ]
  },
  {
    id: "soap-charcoal-cleanse",
    name: "Charcoal Cleanse Handmade Soap",
    category: "handmade_soaps",
    categoryLabel: "Botanical Self-Care",
    price: 22,
    rating: 4.7,
    reviewsCount: 84,
    description: "Deeply detoxifying medical-grade activated bamboo charcoal bar blended with cooling tea-tree oil and refreshing eucalyptus stems.",
    sizeOrSpec: "150g Deep Detox Bar",
    bgColorClass: "bg-gradient-to-tr from-charcoal/10 to-sage-pastel/50",
    accentColorClass: "border-stone-600 text-stone-900",
    soapIngredients: ["Activated Bamboo Charcoal", "Tea Tree Essential Oil", "Pure Peppermint Extract", "Kaolin Clay"],
    skinFeel: ["Deep Cleanse", "Tingly Fresh", "Pore Detox", "Exfoliated Matte"],
    imagePlaceholderId: "soap-charcoal",
    sizeVariants: [
      { id: "soap-charcoal-100g", size: "100g", price: 16, sizeOrSpec: "100g Compact Cleanse Bar", bgColorClass: "bg-gradient-to-tr from-charcoal/5 to-sage-pastel/40", imagePlaceholderId: "soap-charcoal" },
      { id: "soap-charcoal-155g", size: "155g", price: 22, sizeOrSpec: "150g Standard Detox Bar", bgColorClass: "bg-gradient-to-tr from-charcoal/10 to-sage-pastel/50", imagePlaceholderId: "soap-charcoal" },
      { id: "soap-charcoal-250g", size: "250g", price: 32, sizeOrSpec: "250g Grand Detox Block", bgColorClass: "bg-gradient-to-tr from-charcoal/15 to-sage-pastel/60", imagePlaceholderId: "soap-charcoal" }
    ]
  },

  // --- GIFT SETS ---
  {
    id: "gift-set-perfume-wallet",
    name: "Flora Perfume & Leather Wallet Set",
    category: "gift_sets",
    categoryLabel: "Exquisite Gift Set",
    price: 250,
    rating: 5.0,
    reviewsCount: 42,
    description: "Gorgeously arrayed premium box wrapping our flagship 100ml Flora Luxe Eau De Parfum together with the Tan Slim Leather Wallet. An unparalleled gesture of absolute luxury.",
    sizeOrSpec: "Signature Gift Set (2 Items)",
    bgColorClass: "bg-gradient-to-tr from-lavender-pastel/60 to-peach-pastel/60",
    accentColorClass: "border-purple-400 text-purple-950",
    isBestSeller: true,
    imagePlaceholderId: "gift-set-lux"
  },
  {
    id: "gift-set-perfume-soap",
    name: "Perfume + Rose Soap Deluxe Set",
    category: "gift_sets",
    categoryLabel: "Exquisite Gift Set",
    price: 195,
    rating: 4.9,
    reviewsCount: 31,
    description: "A gorgeous pairing of 50ml Flora Luxe Mid-Size together with our beloved Rose Glow Handmade Soap bar. Housed in a soft pink velvet lined rigid chest.",
    sizeOrSpec: "Luxe Self-Care Chest (2 Items)",
    bgColorClass: "bg-gradient-to-tr from-rose-pastel/70 to-lavender-pastel/40",
    accentColorClass: "border-rose-400 text-rose-950",
    isNew: true,
    imagePlaceholderId: "gift-set-rose"
  },
  {
    id: "gift-set-belt-wallet-combo",
    name: "Leather Belt & Wallet Elite Duo",
    category: "gift_sets",
    categoryLabel: "Exquisite Gift Set",
    price: 185,
    rating: 4.9,
    reviewsCount: 56,
    description: "Perfect synchronization of leather essentials. Combining our Classic Tan Leather Belt and Tan Slim Leather Wallet, bundled in a tan leather-bound wooden gift box.",
    sizeOrSpec: "Elite Leather Duo (2 Items)",
    bgColorClass: "bg-gradient-to-tr from-peach-pastel/60 to-leather-tan/30",
    accentColorClass: "border-amber-600 text-amber-950",
    imagePlaceholderId: "gift-set-leather"
  },
  {
    id: "gift-set-complete-box",
    name: "The Ultimate MYRA Lifestyle Chest",
    category: "gift_sets",
    categoryLabel: "Exquisite Gift Set",
    price: 360,
    rating: 5.0,
    reviewsCount: 28,
    description: "The complete premium lifestyle collection. Contains 100ml Flora Luxe scent, Classic Tan Leather Belt, Black Premium Leather Wallet, Rose Glow Soap, and lavender calm soap. A breathtaking experience of brand legacy.",
    sizeOrSpec: "Signature Wooden Trunk / All-inclusive",
    bgColorClass: "bg-gradient-to-tr from-peach-pastel/40 to-lavender-pastel/40",
    accentColorClass: "border-amber-500 text-stone-900",
    isBestSeller: true,
    imagePlaceholderId: "gift-set-ultimate"
  }
];

export const storeLocations: StoreLocation[] = [
  {
    id: "store-main",
    name: "MYRA Luxury Store – Flagship Boutique",
    tagline: "Sensory & Craft Atelier",
    address: "712 Fifth Avenue, Suite A, New York, NY 10019",
    phone: "+1 (555) 830-MYRA",
    hours: "Mon - Sat: 10:00 AM - 8:00 PM | Sun: 11:00 AM - 6:00 PM",
    coordinatesPlaceholder: "M 32,32 L 48,16 L 64,32 L 48,48 Z" // visual representation
  },
  {
    id: "store-perfume",
    name: "MYRA Perfume & Scent Lounge",
    tagline: "Custom Olfactory Journey",
    address: "83 Via del Corso, Centro Storico, Rome, Italy 00186",
    phone: "+39 06 482 MYRA",
    hours: "Mon - Sun: 10:30 AM - 9:00 PM",
    coordinatesPlaceholder: "M 20,40 C 20,20 40,10 40,30"
  },
  {
    id: "store-leather",
    name: "MYRA Leather & Bespoke Studio",
    tagline: "Handcrafted Custom Monograms",
    address: "32 New Bond Street, Mayfair, London W1S 2RE",
    phone: "+44 20 7946 0912",
    hours: "Mon - Sat: 9:30 AM - 7:30 PM | Sun: Closed",
    coordinatesPlaceholder: "M 10,10 H 50 V 50 H 10 Z"
  },
  {
    id: "store-soap",
    name: "MYRA Botanical & Self-Care Haven",
    tagline: "Raw Botanicals & Fresh Soap-Cutting",
    address: "415 Rue Saint-Honoré, 75001 Paris, France",
    phone: "+33 1 42 68 83 91",
    hours: "Mon - Sat: 10:00 AM - 7:00 PM",
    coordinatesPlaceholder: "M 30,50 A 20,20 0 1,0 50,30"
  }
];

export const reviews: Review[] = [
  {
    id: "rev-1",
    author: "Elena Rostova",
    rating: 5,
    date: "2026-04-12",
    comment: "The Flora Luxe scent is utterly divine. I get compliments daily, and the packaging makes it feel like a cherished relic. The handmade rose soap transformed my skincare routine! Simply spectacular.",
    verified: true
  },
  {
    id: "rev-2",
    author: "Maximilian V.",
    rating: 5,
    date: "2026-05-02",
    comment: "Unmatched leather work. The Tan Belt has taken on a stunning classic vintage patina in just weeks, and the solid brass buckle is clearly premium. Truly modern Starbucks-like product aesthetic-wise, but fully unique.",
    verified: true
  },
  {
    id: "rev-3",
    author: "Sophia Sterling",
    rating: 5,
    date: "2026-05-18",
    comment: "Perfect corporate and house gifts. I customized 10 of the Perfume + Soap Gift Boxes for our elite guests, and every single recipient was in absolute awe. Outstanding, elegant brand ethos.",
    verified: true
  }
];
