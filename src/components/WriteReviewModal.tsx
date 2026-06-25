import React, { useState, useRef } from "react";
import { Product, Review } from "../types";
import { X, Star, Upload, ArrowLeft, CheckCircle, Image as ImageIcon } from "lucide-react";

interface WriteReviewModalProps {
  isOpen: boolean;
  product: Product;
  onClose: () => void;
  onSubmitReview: (review: Omit<Review, "id" | "date" | "verified"> & { image?: string }) => void;
  triggerToast?: (message: string) => void;
}

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  isOpen,
  product,
  onClose,
  onSubmitReview,
  triggerToast
}) => {
  const [step, setStep] = useState<number>(1);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [authorName, setAuthorName] = useState<string>("");
  const [imageBase64, setImageBase64] = useState<string>("");
  const [imageFileName, setImageFileName] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Rating label
  const getRatingLabel = (val: number) => {
    switch (val) {
      case 1: return "Poor";
      case 2: return "Fair";
      case 3: return "Average";
      case 4: return "Good";
      case 5: return "Great";
      default: return "";
    }
  };

  // Convert uploaded image file to permanent Base64
  const handleImageFile = (file: File) => {
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      if (triggerToast) triggerToast("File size too large. Please upload an image under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageBase64(reader.result);
        setImageFileName(file.name);
        if (triggerToast) triggerToast("Photo attached and optimized!");
      }
    };
    reader.onerror = () => {
      if (triggerToast) triggerToast("Error processing file.");
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

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
    if (file) handleImageFile(file);
  };

  const handleCancelImage = () => {
    setImageBase64("");
    setImageFileName("");
  };

  const handleNext = () => {
    if (step === 1 && rating === 0) {
      if (triggerToast) triggerToast("Please select a rating to continue.");
      return;
    }
    if (step === 2) {
      if (!comment.trim()) {
        if (triggerToast) triggerToast("Please write a small review narrative.");
        return;
      }
      if (!authorName.trim()) {
        if (triggerToast) triggerToast("Please enter your name.");
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = () => {
    onSubmitReview({
      author: authorName.trim(),
      rating,
      comment: comment.trim(),
      image: imageBase64 || undefined
    });
    
    // Close and reset
    onClose();
    setStep(1);
    setRating(0);
    setComment("");
    setAuthorName("");
    setImageBase64("");
    setImageFileName("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-stone-950/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div 
        id="write-review-dialog"
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-100 z-10 flex flex-col p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header Close */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* STEP 1: SELECT RATING */}
        {step === 1 && (
          <div className="flex flex-col items-center justify-center text-center py-4 space-y-6">
            <div className="space-y-2 mt-4">
              <h3 className="text-2xl font-serif font-medium text-stone-900">How would you rate this product?</h3>
              <p className="text-sm text-stone-500 max-w-md mx-auto">
                We would love it if you would share a bit about your experience.
              </p>
            </div>

            {/* Product Center card */}
            <div className="flex flex-col items-center bg-[#FAF8F5] border border-stone-100 rounded-2xl p-4 w-44 hover:shadow-md transition-shadow">
              <div className="w-20 h-20 relative flex items-center justify-center bg-stone-100/50 rounded-xl overflow-hidden mb-2">
                <img 
                  src={
                    product.imagePlaceholderId === "perfume-flora" ? "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=300" :
                    product.imagePlaceholderId === "perfume-oud" ? "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=300" :
                    product.imagePlaceholderId === "perfume-aqua" ? "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=300" :
                    product.imagePlaceholderId === "perfume-rose" ? "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=300" :
                    product.category === "handmade_soaps" ? "https://images.unsplash.com/photo-1607006342411-9a3363e639a9?auto=format&fit=crop&q=80&w=300" :
                    "https://images.unsplash.com/photo-1627124357626-8c4d8ce4a7e9?auto=format&fit=crop&q=80&w=300"
                  } 
                  alt={product.name}
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-xs font-serif font-medium text-stone-800 line-clamp-1">{product.name}</span>
            </div>

            {/* Interacting Star Selection */}
            <div className="flex flex-col items-center space-y-2">
              <div className="flex gap-2.5">
                {[1, 2, 3, 4, 5].map((val) => {
                  const isGold = (hoverRating || rating) >= val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onMouseEnter={() => setHoverRating(val)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(val)}
                      className="transition-transform duration-150 hover:scale-125 focus:outline-none cursor-pointer p-1"
                    >
                      <Star 
                        className={`w-10 h-10 transition-colors ${
                          isGold 
                            ? "fill-[#008080] text-[#008080]" 
                            : "text-stone-300"
                        }`}
                        strokeWidth={1.5}
                      />
                    </button>
                  );
                })}
              </div>
              
              {/* Labels matching given image */}
              <div className="flex justify-between w-64 text-xs font-sans text-stone-500 px-1 mt-1">
                <span>Poor</span>
                <span className="font-semibold text-[#008080]">{getRatingLabel(hoverRating || rating)}</span>
                <span>Great</span>
              </div>
            </div>

            {/* Footer Navigation */}
            <div className="w-full pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                disabled={rating === 0}
                className={`py-3.5 px-8 rounded-xl font-medium tracking-wide transition-all ${
                  rating > 0 
                  ? "bg-[#008080] hover:bg-[#006666] text-white shadow-lg shadow-[#008080]/10 cursor-pointer" 
                  : "bg-stone-100 text-stone-400 cursor-not-allowed"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: REVIEW DESCRIPTION */}
        {step === 2 && (
          <div className="flex flex-col py-2 space-y-5">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold tracking-widest text-leather-tan uppercase">Product Specification Details</span>
              <h3 className="text-lg font-serif text-stone-900 font-semibold">{product.name}</h3>
            </div>

            {/* Stars summary on top */}
            <div className="flex items-center gap-1.5 pb-3 border-b border-stone-105">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((val) => (
                  <Star 
                    key={val} 
                    className={`w-5 h-5 ${val <= rating ? "fill-[#008080] text-[#008080]" : "text-stone-200"}`} 
                    strokeWidth={1.5}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-[#008080]">{getRatingLabel(rating)}</span>
            </div>

            {/* User credentials */}
            <div className="space-y-2.5">
              <label className="text-xs uppercase tracking-widest font-bold text-stone-700">Written Credential (Your Name)</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Juliet Sterling"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#008080] text-sm text-stone-800"
              />
            </div>

            {/* Description textarea */}
            <div className="space-y-2.5">
              <label className="text-xs uppercase tracking-widest font-bold text-stone-700">Review content (Required)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="Start writing here... Tell us what makes you fall in love with this luxury piece, how the fragrance behaves, or the artisanal texture."
                className="w-full p-4 rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#008080] text-sm text-stone-800 resize-none leading-relaxed"
              />
            </div>

            <p className="text-[10px] text-stone-400 leading-normal">
              We'll only contact you about your review if necessary. By submitting your review, you agree to our <span className="underline cursor-pointer hover:text-stone-600">terms and conditions</span> and <span className="underline cursor-pointer hover:text-stone-600">privacy policy</span>.
            </p>

            {/* Footer Buttons */}
            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              
              <button
                type="button"
                onClick={handleNext}
                disabled={!comment.trim() || !authorName.trim()}
                className={`py-3.5 px-8 rounded-xl font-medium tracking-wide transition-all ${
                  comment.trim() && authorName.trim()
                  ? "bg-[#008080] hover:bg-[#006666] text-white shadow-lg shadow-[#008080]/15 cursor-pointer" 
                  : "bg-stone-100 text-stone-400 cursor-not-allowed"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PHOTO UPLOAD */}
        {step === 3 && (
          <div className="flex flex-col py-2 space-y-6">
            <div className="space-y-2 text-center mt-3">
              <h3 className="text-2xl font-serif font-medium text-stone-900">Share a picture</h3>
              <p className="text-sm text-stone-500">
                Upload a photo to support your review.
              </p>
            </div>

            {/* Drag and drop panel */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[180px] relative ${
                isDragOver 
                  ? "border-[#008080] bg-[#008080]/5" 
                  : imageBase64 
                    ? "border-stone-200 bg-stone-50/50" 
                    : "border-stone-300 hover:border-[#008080] hover:bg-stone-50"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleInputChange}
                accept="image/*"
                className="hidden"
              />

              {imageBase64 ? (
                <div className="relative flex flex-col items-center py-2">
                  <div className="w-24 h-24 rounded-xl border border-stone-200 overflow-hidden shadow-sm relative group">
                    <img 
                      src={imageBase64} 
                      alt="Review attachment" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelImage();
                      }}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold rounded-xl transition-opacity font-mono"
                    >
                      Delete
                    </button>
                  </div>
                  <span className="text-xs text-stone-500 font-mono mt-3 max-w-[200px] truncate">{imageFileName}</span>
                  <span className="text-[10px] text-stone-400 mt-0.5">Click preview to remove, or drop a new one</span>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-3 py-4">
                  <div className="p-3.5 rounded-full bg-stone-100 text-stone-500 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-stone-450" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-stone-800">
                      Click to upload <span className="font-normal text-stone-500">or drag and drop</span>
                    </p>
                    <p className="text-xs text-stone-400 font-mono">PNG, JPG, JPEG up to 5MB</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              
              <button
                type="button"
                onClick={handleSubmit}
                className="py-3.5 px-8 rounded-xl font-medium tracking-wide bg-[#008080] hover:bg-[#006666] text-white shadow-lg shadow-[#008080]/15 cursor-pointer transition-all"
              >
                Submit Review
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
