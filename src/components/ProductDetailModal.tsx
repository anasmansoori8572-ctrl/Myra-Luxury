import React, { useState, useEffect, useMemo } from "react";
import { Product, SizeVariant, Review } from "../types";
import { ProductVisual } from "./ProductVisual";
import { getVersionedCloudinaryUrl } from "../cloudinary";
import { X, Sparkles, Star, Tag, ShoppingBag, ShieldCheck, Milestone, Heart, Camera, ArrowUpDown, Check, User, Trash2 } from "lucide-react";
import { WriteReviewModal } from "./WriteReviewModal";

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: () => void;
  onUpdateProduct?: (product: Product) => void;
  triggerToast?: (message: string) => void;
}

// Pre-seeded luxurious catalog reviews to show true authenticity
export const getPreseededReviews = (productId: string, category: string): Review[] => {
  if (category === "perfumes") {
    return [
      {
        id: `seed-p-1-${productId}`,
        author: "Rohitsethi",
        rating: 5,
        date: "06/04/2026",
        comment: "Amazing fragrance with excellent longevity, and delivery was super fast.",
        verified: true,
        image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=300"
      },
      {
        id: `seed-p-2-${productId}`,
        author: "Aanya Sen",
        rating: 5,
        date: "05/29/2026",
        comment: "Absolute masterpiece! The sillage is wonderful and it has this sophisticated depth that gets compliments wherever I go. Will order another backup bottle.",
        verified: true,
        image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=300"
      },
      {
        id: `seed-p-3-${productId}`,
        author: "Siddharth Mehta",
        rating: 4,
        date: "05/15/2026",
        comment: "The scent is incredibly refined, beautifully balanced by velvety musk and warm spices. Truly bespoke craft curation.",
        verified: true
      },
      {
        id: `seed-p-4-${productId}`,
        author: "Elena Rostova",
        rating: 5,
        date: "05/08/2026",
        comment: "Beautiful presentation, heavy boutique glass, smells heavenly. Worth every single rupee.",
        verified: true
      }
    ];
  } else if (category.includes("leather")) {
    return [
      {
        id: `seed-l-1-${productId}`,
        author: "Aditya Roy",
        rating: 5,
        date: "06/03/2026",
        comment: "Premium vegetable tanned leather of the highest caliber. Smells wonderfully rich and authentic. The stitching details are flawless.",
        verified: true,
        image: "https://images.unsplash.com/photo-1627124357626-8c4d8ce4a7e9?auto=format&fit=crop&q=80&w=300"
      },
      {
        id: `seed-l-2-${productId}`,
        author: "Meera Nair",
        rating: 5,
        date: "05/25/2026",
        comment: "Got this for my father and he is absolutely enamored with the tactile finish. It is starting to show a beautiful rich patina.",
        verified: true
      },
      {
        id: `seed-l-3-${productId}`,
        author: "Vikram Malhotra",
        rating: 4,
        date: "04/18/2026",
        comment: "Robust leather grain, represents proper bespoke craftsmanship. High-end solid brass details are beautiful.",
        verified: true
      }
    ];
  } else {
    // Handmade soaps
    return [
      {
        id: `seed-s-1-${productId}`,
        author: "Dr. Ananya Sharma",
        rating: 5,
        date: "06/01/2026",
        comment: "Extremely gentle on skin with luscious, soft botanical lathering. The sandalwood notes elevate my bathing routine into a sanctuary.",
        verified: true,
        image: "https://images.unsplash.com/photo-1607006342411-9a3363e639a9?auto=format&fit=crop&q=80&w=300"
      },
      {
        id: `seed-s-2-${productId}`,
        author: "Karan Johar",
        rating: 5,
        date: "05/20/2026",
        comment: "Produces a rich premium cream lather without synthetic foaming agents. Skin feels highly moisturized and nourished.",
        verified: true
      },
      {
        id: `seed-s-3-${productId}`,
        author: "Priya Patel",
        rating: 5,
        date: "05/11/2026",
        comment: "Exquisite presentation, conscious slow-processed ingredients. Smells wonderfully clean and high-end.",
        verified: true
      }
    ];
  }
};

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ 
  product, 
  onClose, 
  onAddToCart,
  isWishlisted = false,
  onToggleWishlist,
  onUpdateProduct,
  triggerToast
}) => {
  const [activeVariants, setActiveVariants] = useState<SizeVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<SizeVariant | null>(null);
  
  // Reviews & Write Review state
  const [productReviews, setProductReviews] = useState<Review[]>([]);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<"most_recent" | "highest_rating" | "lowest_rating">("most_recent");
  
  // Image Lightbox zoom state
  const [activeZoomImage, setActiveZoomImage] = useState<string | null>(null);

  // Initialize and synchronize Product size variants
  useEffect(() => {
    if (product) {
      let variantsToUse: SizeVariant[] = [];
      
      if (product.category === "perfumes") {
        const basePrice = product.price;
        const baseImage = product.imagePlaceholderId || product.id;
        
        if (product.sizeVariants && product.sizeVariants.length > 0) {
          variantsToUse = [...product.sizeVariants];
        } else {
          variantsToUse = [
            {
              id: `${product.id}-20ml`,
              size: "20ml",
              price: Math.round(basePrice * 0.4) || 20,
              sizeOrSpec: "20ml Petite Travel Spritzer",
              bgColorClass: product.bgColorClass || "bg-gradient-to-tr from-peach-pastel/60 to-rose-pastel/50",
              imagePlaceholderId: baseImage
            },
            {
              id: `${product.id}-50ml`,
              size: "50ml",
              price: Math.round(basePrice * 0.7) || 50,
              sizeOrSpec: "50ml Classic Flacon",
              bgColorClass: product.bgColorClass || "bg-gradient-to-tr from-rose-pastel/50 to-peach-pastel/50",
              imagePlaceholderId: baseImage
            },
            {
              id: `${product.id}-100ml`,
              size: "100ml",
              price: basePrice,
              sizeOrSpec: product.sizeOrSpec || "100ml Standard Edition",
              bgColorClass: product.bgColorClass || "bg-gradient-to-tr from-rose-pastel/60 to-lavender-pastel/50",
              imagePlaceholderId: baseImage
            }
          ];
        }
      } else if (product.sizeVariants && product.sizeVariants.length > 0) {
        variantsToUse = [...product.sizeVariants];
      }
      
      setActiveVariants(variantsToUse);
      
      if (variantsToUse.length > 0) {
        const defaultMatch = variantsToUse.find(v => v.size.includes("100ml")) || variantsToUse[variantsToUse.length - 1];
        setSelectedVariant(defaultMatch);
      } else {
        setSelectedVariant(null);
      }

      // Populate custom or default local reviews
      if (product.reviews && product.reviews.length > 0) {
        setProductReviews(product.reviews);
      } else {
        const seeded = getPreseededReviews(product.id, product.category);
        setProductReviews(seeded);
      }
    } else {
      setActiveVariants([]);
      setSelectedVariant(null);
      setProductReviews([]);
    }
  }, [product?.id, product?.price, product?.reviews]);

  const isOutOfStock = product ? (product.stock !== undefined ? product.stock <= 0 : false) : false;

  const handleAddToCartClick = () => {
    if (!product || isOutOfStock) return;
    if (selectedVariant) {
      const variantProduct: Product = {
        ...product,
        id: selectedVariant.id,
        price: selectedVariant.price,
        sizeOrSpec: selectedVariant.sizeOrSpec,
        bgColorClass: selectedVariant.bgColorClass,
        imagePlaceholderId: selectedVariant.imagePlaceholderId,
      };
      onAddToCart(variantProduct);
    } else {
      onAddToCart(product);
    }
  };

  const handleScrollToReviews = () => {
    const reviewsEl = document.getElementById("customer-reviews-section");
    if (reviewsEl) {
      reviewsEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Star ratings computation
  const ratingDetails = useMemo(() => {
    const totalCount = productReviews.length;
    if (totalCount === 0) {
      return {
        average: 4.8,
        total: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }
    
    let sum = 0;
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    
    productReviews.forEach(r => {
      sum += r.rating;
      // round or cap
      const rounded = Math.min(5, Math.max(1, Math.round(r.rating))) as 5 | 4 | 3 | 2 | 1;
      distribution[rounded]++;
    });

    const average = Number((sum / totalCount).toFixed(2));
    
    const percentages = {
      5: Math.round((distribution[5] / totalCount) * 100),
      4: Math.round((distribution[4] / totalCount) * 100),
      3: Math.round((distribution[3] / totalCount) * 100),
      2: Math.round((distribution[2] / totalCount) * 100),
      1: Math.round((distribution[1] / totalCount) * 100),
    };

    return {
      average,
      total: totalCount,
      distribution,
      percentages
    };
  }, [productReviews]);

  // Handle new submitted review
  const handleReviewSubmit = (newReview: Omit<Review, "id" | "date" | "verified"> & { image?: string; userId?: string }) => {
    if (!product) return;
    const freshReview: Review = {
      id: `rev-${Date.now()}`,
      author: newReview.author,
      rating: newReview.rating,
      comment: newReview.comment,
      verified: true,
      date: new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }),
      image: newReview.image,
      userId: newReview.userId
    };

    const updatedReviewsList = [freshReview, ...productReviews];
    setProductReviews(updatedReviewsList);

    // Calculate updated metrics
    const totalRating = updatedReviewsList.reduce((acc, r) => acc + r.rating, 0);
    const avgRating = Number((totalRating / updatedReviewsList.length).toFixed(2));

    const updatedProductState: Product = {
      ...product,
      reviews: updatedReviewsList,
      rating: avgRating,
      reviewsCount: updatedReviewsList.length
    };

    if (onUpdateProduct) {
      onUpdateProduct(updatedProductState);
    }

    if (triggerToast) {
      triggerToast("Successful! Your luxury curation rating has been added.");
    }
  };

  // Sort and filter actual printed reviews lists
  const sortedReviews = useMemo(() => {
    return [...productReviews].sort((a, b) => {
      if (sortBy === "highest_rating") {
        return b.rating - a.rating;
      }
      if (sortBy === "lowest_rating") {
        return a.rating - b.rating;
      }
      // "most_recent"
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [productReviews, sortBy]);

  // Collect any review images for the "Customer Photos" grid
  const customerUploadedPhotos = useMemo(() => {
    return productReviews
      .filter(r => r.image)
      .map(r => ({
        reviewId: r.id,
        imageUrl: r.image!,
        author: r.author
      }));
  }, [productReviews]);

  if (!product) return null;

  // Star rendering small function
  const renderStars = (count: number, classes = "w-3.5 h-3.5 text-amber-500 fill-amber-500") => {
    return (
      <div className="flex gap-0.5 items-center">
        {[1, 2, 3, 4, 5].map(v => (
          <Star 
            key={v} 
            className={`w-3.5 h-3.5 ${v <= count ? "text-amber-500 fill-amber-500" : "text-stone-200 fill-transparent"}`}
            strokeWidth={1.5}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div 
        id="luxury-product-modal"
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#FDFBF7] shadow-2xl text-charcoal flex flex-col border border-stone-200/50 z-10 transition-transform duration-500 transform scale-100"
      >
        {/* Close Button top-right */}
        <button 
          id="close-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2.5 rounded-full bg-white/80 hover:bg-stone-100 text-stone-700 hover:text-stone-950 shadow-md border border-stone-100 transition-all duration-300 z-30 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* TOP COMPONENT CONTAINER - DUAL PANEL GRID */}
        <div className="flex flex-col md:flex-row w-full border-b border-stone-200/40">
          
          {/* Left Column: Interactive Image Area */}
          <div className={`w-full md:w-1/2 p-8 flex flex-col items-center justify-center ${selectedVariant ? selectedVariant.bgColorClass : product.bgColorClass} relative overflow-hidden min-h-[320px] md:min-h-[450px] transition-all duration-500 md:rounded-tl-3xl`}>
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#C68B59_1px,transparent_1px)] [background-size:16px_16px]" />
            
            {isOutOfStock && (
              <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px] flex items-center justify-center z-15">
                <span className="bg-stone-950/90 text-white font-mono text-xs tracking-widest font-extrabold px-6 py-3 rounded-full border border-white/20 shadow-2xl uppercase">
                  OUT OF STOCK
                </span>
              </div>
            )}

            {/* Accent Ribbons */}
            {isOutOfStock ? (
              <div className="absolute top-6 left-6 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-rose-100/95 text-rose-900 border border-rose-200/55 shadow-sm z-20 font-mono">
                Out Of Stock
              </div>
            ) : (
              <>
                {product.isBestSeller && (
                  <div className="absolute top-6 left-6 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-amber-100/95 text-amber-900 border border-amber-200/55 shadow-sm z-20">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin" style={{ animationDuration: "6s" }} /> Best Seller
                  </div>
                )}
                {product.isNew && !product.isBestSeller && (
                  <div className="absolute top-6 left-6 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-emerald-100/95 text-emerald-950 border border-emerald-200/55 shadow-sm z-20">
                    New Atelier Edition
                  </div>
                )}
              </>
            )}

            {/* Main Premium Graphic */}
            <div className="w-64 h-64 md:w-80 md:h-80 relative drop-shadow-2xl hover:scale-105 transition-transform duration-500">
              <ProductVisual id={selectedVariant ? (selectedVariant.imagePlaceholderId || selectedVariant.id) : (product.imagePlaceholderId || product.id)} animate={true} />
            </div>

            <div className="text-center mt-3 z-10">
              <span className="text-xs tracking-widest text-[#8A7968] font-medium uppercase font-mono">
                {selectedVariant ? selectedVariant.sizeOrSpec : product.sizeOrSpec}
              </span>
            </div>
          </div>

          {/* Right Column: Detailed Product Storytelling */}
          <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-between">
            <div>
              {/* Breadcrumb row */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs uppercase tracking-widest text-leather-tan font-semibold font-sans flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  {product.categoryLabel}
                </span>
                <span className="text-stone-300">•</span>
                <span className="text-xs text-stone-500 font-medium">Boutique Exclusive</span>
              </div>

              {/* Title */}
              <h2 className="text-3xl md:text-4xl font-serif font-medium text-stone-900 leading-tight mb-3">
                {product.name}
              </h2>

              {/* Price & Rating triggers smooth scroll */}
              <div className="flex flex-wrap items-center gap-4 mb-4 pb-4 border-b border-stone-100">
                <span className="text-3xl font-serif text-[#C68B59] font-semibold">
                  Key Pricing: ₹{selectedVariant ? selectedVariant.price : product.price}
                </span>
                <button
                  type="button"
                  onClick={handleScrollToReviews}
                  className="flex items-center gap-1.5 bg-[#FAF8F5] px-3 py-1 hover:bg-[#F2EFE9] rounded-full border border-stone-200/60 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer text-stone-800"
                >
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-semibold">{ratingDetails.average}</span>
                  <span className="text-xs text-stone-400">({ratingDetails.total} reviews)</span>
                </button>
              </div>

              {/* Cash on Delivery Availability Info */}
              <div className="mb-6 flex flex-wrap items-center gap-2">
                {product.codAvailable !== false ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FAF6F0] border border-[#E8DCC4] text-[#8F633E] rounded-full text-xs font-bold uppercase tracking-wider">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" /> COD Eligible
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-200 text-red-850 rounded-full text-xs font-bold uppercase tracking-wider" title="Prepayment with credit/debit card, UPI, or banking is required for this artisanal item">
                    <X className="w-3.5 h-3.5 stroke-[2.5]" /> Prepaid Only
                  </span>
                )}
                <span className="text-[10.5px] text-stone-400 font-medium italic">Atelier Handcrafted Shipping Rules</span>
              </div>

              {/* Narrative Context */}
              <p className="text-stone-600 leading-relaxed font-sans text-sm md:text-base mb-6">
                {product.description}
              </p>

              {/* Scent Capacity / Soap Weight size selectors */}
              {activeVariants && activeVariants.length > 0 && (
                <div className="mb-6 p-4 rounded-2xl bg-stone-50 border border-stone-100">
                  <span className="block text-xs uppercase tracking-widest text-[#8A7968] font-bold mb-3 flex items-center gap-1.5 font-sans">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    {product.category === "perfumes" ? "Atelier Bottle Volume" : "Handmade Soap Weight"}
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {activeVariants.map((v) => {
                      const isSelected = selectedVariant?.id === v.id;
                      return (
                        <button
                          key={v.id}
                          id={`variant-btn-${v.id}`}
                          onClick={() => setSelectedVariant(v)}
                          className={`flex-1 min-w-[75px] max-w-[125px] px-3 py-2.5 rounded-xl transition-all duration-300 border text-center flex flex-col justify-center items-center cursor-pointer ${
                            isSelected
                              ? "bg-stone-900 border-stone-900 text-white shadow-lg shadow-stone-900/15 transform scale-[1.03]"
                              : "bg-white border-stone-200 text-stone-700 hover:bg-stone-100 hover:border-stone-300"
                          }`}
                        >
                          <span className="text-xs font-bold leading-none">{v.size}</span>
                          <span className={`text-[10px] mt-1 font-semibold ${isSelected ? "text-stone-300" : "text-[#C68B59]"}`}>
                            ₹{v.price}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Material specifications */}
              {product.leatherType && (
                <div className="mb-6 bg-[#FAF8F5] p-4 rounded-2xl border border-stone-100/80">
                  <h4 className="text-xs uppercase tracking-widest text-[#8A7968] font-bold mb-2 flex items-center gap-1.5 font-sans">
                    <Milestone className="w-4 h-4 text-leather-tan" /> Material Specifications
                  </h4>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-leather-tan" />
                    <span className="text-xs font-semibold text-stone-800">{product.leatherType}</span>
                  </div>
                  <p className="text-stone-500 text-xs mt-1.5 leading-normal">
                    Sourced from premium tanneries, ensuring highly exquisite durability and long-term vintage leather aroma.
                  </p>
                </div>
              )}

              {/* Handmade Soap specifics */}
              {product.soapIngredients && (
                <div className="mb-6 space-y-4">
                  {product.skinFeel && (
                    <div className="flex flex-wrap gap-1.5">
                      {product.skinFeel.map((feel) => (
                        <span key={feel} className="px-2.5 py-1 bg-sage-pastel/55 text-stone-800 text-xs font-semibold rounded-lg border border-sage-pastel uppercase tracking-wider font-mono">
                          🌿 {feel}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-stone-150">
                    <h4 className="text-xs uppercase tracking-widest text-stone-900 font-bold mb-2 font-sans">
                      Pure Active Ingredients
                    </h4>
                    <p className="text-xs text-stone-600 leading-normal">
                      {product.soapIngredients.join(" • ")}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Add-To-Cart trigger */}
            <div className="mt-6 pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button 
                id={`detail-add-to-cart-${product.id}`}
                onClick={handleAddToCartClick}
                disabled={isOutOfStock}
                className={`flex-grow font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2.5 transition-all duration-300 group whitespace-nowrap ${
                  isOutOfStock
                    ? "bg-stone-200 text-stone-400 border border-stone-100 cursor-not-allowed shadow-none"
                    : "bg-stone-950 hover:bg-leather-tan text-white cursor-pointer shadow-xl active:scale-98"
                }`}
              >
                <ShoppingBag className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                {isOutOfStock ? "OUT OF STOCK" : `Add To Cart — ₹${selectedVariant ? selectedVariant.price : product.price}`}
              </button>

              {onToggleWishlist && (
                <button
                  type="button"
                  id={`detail-wishlist-toggle-${product.id}`}
                  onClick={onToggleWishlist}
                  className={`p-4 rounded-xl border flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-95 ${
                    isWishlisted
                      ? "bg-rose-50 border-rose-200 text-[#C68B59] hover:bg-rose-100/80"
                      : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                  }`}
                  title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM FULL-WIDTH COMPONENT: CUSTOMER REVIEWS & PICTURES */}
        <div id="customer-reviews-section" className="w-full bg-white p-6 md:p-10 space-y-10">
          
          <div className="text-center space-y-1">
            <h3 className="text-2xl font-serif font-medium tracking-[0.2em] text-stone-900 uppercase">
              Customer Reviews
            </h3>
            <div className="w-16 h-[1.5px] bg-leather-tan mx-auto opacity-70" />
          </div>

          {/* REVIEWS GRID METRICS INTERFACE matching Image 2 closely */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center bg-[#FAF8F5] border border-stone-150 rounded-2xl p-6 md:p-8">
            
            {/* Left Box: Average star output */}
            <div className="flex flex-col items-center justify-center text-center space-y-2 md:border-r border-stone-200 md:pr-6">
              <div className="flex items-center gap-1">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(v => (
                    <Star 
                      key={v} 
                      className={`w-6 h-6 ${v <= Math.round(ratingDetails.average) ? "fill-[#008080] text-[#008080]" : "text-stone-200"}`} 
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
              </div>
              <h4 className="text-2xl font-serif font-bold text-stone-900">{ratingDetails.average} <span className="text-sm font-sans font-normal text-stone-500">out of 5</span></h4>
              <p className="text-xs text-stone-500 font-sans tracking-wide">Based on {ratingDetails.total} verified reviews</p>
              
              <div className="flex items-center gap-1.5 text-[11px] text-[#008080] bg-[#008080]/5 px-3 py-1 rounded-full font-sans font-semibold mt-1">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% Shopper Trust Guaranteed
              </div>
            </div>

            {/* Middle Box: Star distribution bars */}
            <div className="space-y-2.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingDetails.distribution[star as 5|4|3|2|1] || 0;
                const percent = ratingDetails.percentages[star as 5|4|3|2|1] || 0;
                return (
                  <div key={star} className="flex items-center gap-3.5 text-xs text-stone-600">
                    <span className="w-3 font-semibold text-right">{star}★</span>
                    <div className="flex-grow h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-stone-900 rounded-full transition-all duration-1000"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-8 text-stone-400 font-mono text-left">({count})</span>
                  </div>
                );
              })}
            </div>

            {/* Right Box: Call to action Trigger write-review modal */}
            <div className="flex flex-col items-center justify-center md:pl-6 space-y-3">
              <p className="text-xs text-stone-500 font-sans text-center max-w-[200px]">
                Possess this piece? Share your genuine atelier experience with other collectors.
              </p>
              <button
                type="button"
                onClick={() => setIsWriteModalOpen(true)}
                className="w-full max-w-[220px] bg-stone-950 hover:bg-[#008080] text-white text-xs font-sans font-bold py-3 px-5 uppercase tracking-widest rounded-xl transition-all duration-300 shadow-md hover:shadow-lg active:scale-97 cursor-pointer"
              >
                Write a review
              </button>
            </div>
          </div>

          {/* CUSTOMER PHOTOS ROW matches Image 2 "Customer photos & videos" */}
          {customerUploadedPhotos.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-widest text-stone-700 font-bold font-sans">
                Customer photos
              </h4>
              <div className="flex flex-wrap gap-3.5 items-center">
                {customerUploadedPhotos.map((photo, index) => (
                  <div 
                    key={index} 
                    onClick={() => setActiveZoomImage(photo.imageUrl)}
                    className="w-16 h-16 rounded-xl border border-stone-200 overflow-hidden shadow-sm relative group cursor-zoom-in transition-all duration-300 hover:scale-110 hover:shadow-md"
                  >
                    <img 
                      src={getVersionedCloudinaryUrl(photo.imageUrl)} 
                      alt={`Customer review by ${photo.author}`} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-stone-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-4 h-4 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REVIEWS LIST DISPLAY & INTERACTIVE FILTERS */}
          <div className="space-y-6 pt-2">
            
            {/* Header sorting filter row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-stone-100 gap-3">
              <h4 className="text-sm uppercase tracking-wider text-stone-900 font-bold font-sans">
                Athelier Reviews ({productReviews.length})
              </h4>
              
              <div className="flex items-center gap-2 text-xs text-stone-600 font-sans">
                <ArrowUpDown className="w-3.5 h-3.5 text-leather-tan" />
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-[#FAF8F5] border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#008080] font-sans font-medium cursor-pointer"
                >
                  <option value="most_recent">Most Recent</option>
                  <option value="highest_rating">Highest Rated</option>
                  <option value="lowest_rating">Lowest Rated</option>
                </select>
              </div>
            </div>

            {/* Rendered List */}
            <div className="divide-y divide-stone-100">
              {sortedReviews.map((review) => (
                <div key={review.id} className="py-6 first:pt-0 last:pb-0 space-y-3.5">
                  
                  {/* Stars Row & Date */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating)}
                      {review.verified && (
                        <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-mono font-medium">
                          Verified Collector
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {localStorage.getItem("myra_admin_auth") === "true" && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete this review by ${review.author}?`)) {
                              const updatedReviews = productReviews.filter(r => r.id !== review.id);
                              setProductReviews(updatedReviews);
                              
                              const totalRating = updatedReviews.reduce((acc, r) => acc + r.rating, 0);
                              const avgRating = updatedReviews.length > 0 ? Number((totalRating / updatedReviews.length).toFixed(2)) : 5.0;
                              
                              const updatedProductState = {
                                ...product,
                                reviews: updatedReviews,
                                rating: avgRating,
                                reviewsCount: updatedReviews.length
                              };
                              if (onUpdateProduct) {
                                onUpdateProduct(updatedProductState);
                              }
                              if (triggerToast) {
                                triggerToast("Successful! Review has been deleted.");
                              }
                            }
                          }}
                          className="px-2.5 py-1 text-[10px] uppercase font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3 text-red-650" /> Delete Review
                        </button>
                      )}
                      <span className="text-xs text-stone-400 font-mono">{review.date}</span>
                    </div>
                  </div>

                  {/* Author Name and Circular luxury tag */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center border border-stone-200 text-stone-700 text-xs font-bold font-mono">
                      {review.author.charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-sm font-semibold text-stone-900 block leading-none">{review.author}</span>
                      <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                        <Check className="w-3 h-3 stroke-[3]" /> Verified Purchase
                      </span>
                    </div>
                  </div>

                  {/* Narrative text */}
                  <p className="text-stone-600 text-sm leading-relaxed max-w-3xl font-sans">
                    {review.comment}
                  </p>

                  {/* Uploaded Base64 or Unsplash attachment thumbnail */}
                  {review.image && (
                    <div className="pt-1 select-none">
                      <div 
                        onClick={() => setActiveZoomImage(review.image!)}
                        className="w-28 h-28 rounded-xl overflow-hidden border border-stone-200 cursor-zoom-in group relative shadow-xs hover:shadow-md transition-all inline-block"
                      >
                        <img 
                          src={review.image} 
                          alt="Review attachment graphic" 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-stone-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              ))}
            </div>

          </div>

        </div>

      </div>

      {/* MULTI-STEP WRITE REAL REVIEWS SYSTEM OVERLAY */}
      <WriteReviewModal
        isOpen={isWriteModalOpen}
        product={product}
        onClose={() => setIsWriteModalOpen(false)}
        onSubmitReview={handleReviewSubmit}
        triggerToast={triggerToast}
      />

      {/* FULL-SCREEN PREMIUM LIGHTBOX OVERLAY FOR CUSTOMER REVIEW IMAGES */}
      {activeZoomImage && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xs">
          {/* Backdrop closer */}
          <div className="absolute inset-0" onClick={() => setActiveZoomImage(null)} />
          
          <button
            onClick={() => setActiveZoomImage(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-stone-800 hover:bg-stone-750 text-stone-200 hover:text-white transition-all duration-300 cursor-pointer shadow-lg z-30"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-stone-805 flex flex-col z-20 animate-in zoom-in-95 duration-200">
            <div className="p-1 max-h-[70vh] overflow-hidden flex items-center justify-center bg-stone-900">
              <img 
                src={getVersionedCloudinaryUrl(activeZoomImage)} 
                className="max-w-full max-h-[70vh] object-contain rounded-t-xl" 
                alt="Bespoke Customer Zoom View" 
              />
            </div>
            <div className="p-5 bg-white text-stone-800 text-xs font-sans flex items-center justify-between border-t border-stone-100">
              <span className="font-semibold tracking-wide text-stone-605">ATELIER CUSTOMER CAPTURE</span>
              <button 
                type="button"
                onClick={() => setActiveZoomImage(null)}
                className="text-[#008080] font-bold hover:underline"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
