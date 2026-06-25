import React, { useState, useEffect } from "react";
import { 
  X, 
  User, 
  Sparkles, 
  Award, 
  Gift, 
  Copy, 
  Check, 
  Edit, 
  Save, 
  LogOut, 
  Clock, 
  ShieldCheck, 
  ShoppingBag, 
  Heart,
  ChevronRight,
  TrendingUp,
  Info,
  Lock,
  CreditCard,
  Package,
  Truck,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Chrome,
  Apple
} from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerToast: (msg: string) => void;
  initialTab?: "card" | "orders" | "edit";
}

interface MemberInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  preferredCategory: string;
  scentNotes: string;
  tier: string;
  loyaltyPoints: number;
  memberId: string;
  memberSince: string;
  accountType: "standard" | "vip";
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, triggerToast, initialTab }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("myra_member_logged_in");
      return saved === "true";
    } catch {
      return false;
    }
  });

  const [member, setMember] = useState<MemberInfo>(() => {
    try {
      const saved = localStorage.getItem("myra_member_info");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    
    // Default logged in luxury member pre-fill for stunning initial experience
    return {
      name: "Lady Elena Rostova",
      email: "elena.rostova@luxury.com",
      phone: "+39 333 4839 902",
      address: "Piazza di Spagna, 14, Rome, Italy 00187",
      preferredCategory: "Perfumes",
      scentNotes: "Rose, Warm Amberwood & White Musk",
      tier: "Maison Elite Client",
      loyaltyPoints: 1250,
      memberId: "MYRA-9042-STD",
      memberSince: "May 2024",
      accountType: "standard"
    };
  });

  const [companyName, setCompanyName] = useState<string>("MYRA");
  const [companySubtitle, setCompanySubtitle] = useState<string>("LUXURY");

  useEffect(() => {
    if (isOpen) {
      try {
        const name = localStorage.getItem("myra_company_name") || "MYRA";
        const subtitle = localStorage.getItem("myra_company_subtitle") || "LUXURY";
        setCompanyName(name);
        setCompanySubtitle(subtitle);
      } catch {}
    }
  }, [isOpen]);

  const [activeTab, setActiveTab] = useState<"card" | "orders" | "edit">("card");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Sync state for user orders loaded from localStorage
  const [orders, setOrders] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("myra_orders");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {}
    return [];
  });

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Sync orders from event custom listener
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem("myra_orders");
        if (saved) {
          setOrders(JSON.parse(saved));
        }
      } catch {}
    };

    window.addEventListener("myra_orders_updated", handleSync);
    return () => {
      window.removeEventListener("myra_orders_updated", handleSync);
    };
  }, []);

  // Switch between Standard and VIP registration modes in registration screen
  const [regAccountType, setRegAccountType] = useState<"standard" | "vip">("standard");

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || "card");
      if (!isLoggedIn) {
        setShowCheckout(false);
      }
    }
  }, [isOpen, initialTab, isLoggedIn]);

  // Edit states pre-filled based on current member info or empty
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCategory, setEditCategory] = useState("Perfumes");
  const [editScent, setEditScent] = useState("");

  // Custom Authentication and Registration state parameters matching the requested aesthetic
  const [authMode, setAuthMode] = useState<"register" | "login">("register");
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToNewsletter, setAgreedToNewsletter] = useState(false);
  const [activeSocialModal, setActiveSocialModal] = useState<"google" | "apple" | null>(null);
  const [socialLoading, setSocialLoading] = useState<boolean>(false);

  // Sign-in mode variables
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Payment integration states
  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const [checkoutType, setCheckoutType] = useState<"register" | "upgrade">("register");
  const [payCardName, setPayCardName] = useState("");
  const [payCardNumber, setPayCardNumber] = useState("");
  const [payExpiry, setPayExpiry] = useState("");
  const [payCvv, setPayCvv] = useState("");
  const [isPaying, setIsPaying] = useState<boolean>(false);
  const [saveCardForFuture, setSaveCardForFuture] = useState<boolean>(true);

  // Sync edits when state loads or changes
  useEffect(() => {
    if (member) {
      setEditName(member.name);
      setEditEmail(member.email);
      setEditPhone(member.phone);
      setEditAddress(member.address);
      setEditCategory(member.preferredCategory);
      setEditScent(member.scentNotes);
    }
  }, [member, isOpen]);

  // Keep payCardName updated with entered name until they customize it
  useEffect(() => {
    if (!payCardName && editName) {
      setPayCardName(editName);
    }
  }, [editName]);

  // Save member profile state
  useEffect(() => {
    try {
      localStorage.setItem("myra_member_info", JSON.stringify(member));
      localStorage.setItem("myra_member_logged_in", isLoggedIn ? "true" : "false");
    } catch (err) {
      console.warn("[Profile Storage Catch] Unable to save member info in localStorage:", err);
    }
  }, [member, isLoggedIn]);

  if (!isOpen) return null;

  // Handles immediate Standard registration or login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (authMode === "register") {
      if (!regFirstName.trim() || !regLastName.trim() || !regEmail.trim()) {
        triggerToast("Please provide your first name, last name, and email address to proceed.");
        return;
      }
      if (!agreedToTerms) {
        triggerToast("You must agree to the Terms & Conditions to activate your digital card.");
        return;
      }
      if (!agreedToNewsletter) {
        triggerToast("Please check 'Send me exclusive fragrance launches and offers' to activate your digital card.");
        return;
      }

      const compositeFullName = `${regFirstName.trim()} ${regLastName.trim()}`;
      const randId = Math.floor(1000 + Math.random() * 9000);
      const newMember: MemberInfo = {
        name: compositeFullName,
        email: regEmail,
        phone: regPhone || "+39 333 4839 902",
        address: editAddress || "Residential Curation, NY, USA",
        preferredCategory: editCategory || "Perfumes",
        scentNotes: editScent || "Damask Rose & Warm Amberwood",
        tier: "Valued Standard Client",
        loyaltyPoints: 25, // Standard welcome score
        memberId: `MYRA-${randId}-STD`,
        memberSince: "May 2026",
        accountType: "standard"
      };

      setMember(newMember);
      setIsLoggedIn(true);
      setActiveTab("card");
      triggerToast(`Welcome back, ${newMember.name}! Your Standard boutique account is active.`);
    } else {
      // Login mode processing
      if (!loginEmail.trim()) {
        triggerToast("Please enter your registered email address.");
        return;
      }
      
      const compositeFullName = loginEmail.toLowerCase().includes("elena") 
        ? "Lady Elena Rostova" 
        : "Elena Rostova";

      const randId = Math.floor(1000 + Math.random() * 9000);
      const newMember: MemberInfo = {
        name: compositeFullName,
        email: loginEmail,
        phone: "+39 333 4839 902",
        address: "Piazza di Spagna, 14, Rome, Italy 00187",
        preferredCategory: "Perfumes",
        scentNotes: "Rose, Warm Amberwood & White Musk",
        tier: "Maison Elite Client",
        loyaltyPoints: 1250,
        memberId: `MYRA-${randId}-STD`,
        memberSince: "May 2024",
        accountType: "standard"
      };

      setMember(newMember);
      setIsLoggedIn(true);
      setActiveTab("card");
      triggerToast(`Welcome back, ${newMember.name}! Authorized successfully.`);
    }
  };

  // Live Card number dynamic formatter to insert spaces every 4 digits
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length <= 16) {
      const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
      setPayCardNumber(formatted);
    }
  };

  // Live Expiry formatter to insert '/'
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "");
    if (raw.length <= 4) {
      if (raw.length > 2) {
        raw = raw.substring(0, 2) + "/" + raw.substring(2);
      }
      setPayExpiry(raw);
    }
  };

  // Live CVV digits constraint
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length <= 4) {
      setPayCvv(raw);
    }
  };

  // Secure payment execution simulation
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payCardName.trim()) {
      triggerToast("Please provide the Cardholder Name.");
      return;
    }
    if (payCardNumber.replace(/\s/g, "").length < 15) {
      triggerToast("Please enter a valid credit card number.");
      return;
    }
    if (payExpiry.length < 5) {
      triggerToast("Please enter card expiry date (MM/YY).");
      return;
    }
    if (payCvv.length < 3) {
      triggerToast("Please enter your card's secure verification code (CVV).");
      return;
    }

    setIsPaying(true);
    triggerToast("Acquiring token & contacting MYRA merchant gateway...");

    // Simulate high-end payment transaction delay
    setTimeout(() => {
      setIsPaying(false);
      setShowCheckout(false);

      if (checkoutType === "register") {
        const randId = Math.floor(1000 + Math.random() * 9000);
        const newMember: MemberInfo = {
          name: editName,
          email: editEmail,
          phone: editPhone || "+1 (555) 304-4090",
          address: editAddress || "Residential Curation, NY, USA",
          preferredCategory: editCategory,
          scentNotes: editScent || "Citrus, Leather Aura & Sandalwood",
          tier: "Maison Platinum Elite",
          loyaltyPoints: 250, // Premium welcome points bonus
          memberId: `MYRA-${randId}-STD`,
          memberSince: "May 2026",
          accountType: "standard"
        };
        setMember(newMember);
        setIsLoggedIn(true);
        setActiveTab("card");
        triggerToast(`Payment Received! Welcome to MYRA Privé, ${editName}. 250 Gilded points verified.`);
      } else {
        // Upgrade existing standard account
        setMember(prev => ({
          ...prev,
          tier: "Maison Platinum Elite",
          loyaltyPoints: prev.loyaltyPoints + 250,
          memberId: prev.memberId,
          accountType: "standard"
        }));
        setActiveTab("card");
        triggerToast("Congratulations! Upgrade Payment Received. Premium Elite status fully unlocked.");
      }

      // Clear standard test card input values
      setPayCardNumber("");
      setPayExpiry("");
      setPayCvv("");
    }, 2800);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setMember(prev => ({
      ...prev,
      name: editName,
      email: editEmail,
      phone: editPhone,
      address: editAddress,
      preferredCategory: editCategory,
      scentNotes: editScent
    }));
    triggerToast("Your boutique client file has been securely updated.");
    setActiveTab("card");
  };

  // Standard account clicks "Instant Elite Upgrade" inside card workspace
  const handleUpgradeToVip = () => {
    setPayCardName(member.name);
    setCheckoutType("upgrade");
    setShowCheckout(true);
  };

  // Cancel Order callback: requested can go to admin if only "placed" or "packing" status.
  const handleCancelOrder = (orderId: string) => {
    let cancelAttemptStatus = "";
    
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        cancelAttemptStatus = o.status.toLowerCase();
        
        // Cannot cancel if shipping starts (shipped, delivering, delivered)
        const isShippedOrPassed = ["shipped", "delivering", "delivered", "cancelled"].includes(cancelAttemptStatus);
        if (isShippedOrPassed) {
          return o; // block handled in UX showing alert
        }
        
        return {
          ...o,
          status: "cancellation_requested",
          isCancellationRequested: true
        };
      }
      return o;
    });
    
    const isShippedOrPassed = ["shipped", "delivering", "delivered", "cancelled"].includes(cancelAttemptStatus);
    if (isShippedOrPassed) {
      triggerToast("Once shipped, orders cannot be cancelled!");
      return;
    }

    setOrders(updated);
    try {
      localStorage.setItem("myra_orders", JSON.stringify(updated));
    } catch {}
    triggerToast("Your cancellation request goes to admin for further process!");
  };

  // Status simulation progression helper (allows testing all stages easily)
  const handleSimulateStatus = (orderId: string, newStatus: string) => {
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: newStatus,
          // Reset cancellation request if status changes back to packing or placed
          isCancellationRequested: newStatus === "cancellation_requested" ? true : o.isCancellationRequested
        };
      }
      return o;
    });
    
    setOrders(updated);
    try {
      localStorage.setItem("myra_orders", JSON.stringify(updated));
    } catch {}
    triggerToast(`Pipeline update: Simulated stage to [${newStatus.toUpperCase()}]`);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowCheckout(false);
    // Overwrite with empty inputs
    setEditName("");
    setEditEmail("");
    setEditPhone("");
    setEditAddress("");
    setEditCategory("Perfumes");
    setEditScent("");
    triggerToast("Successfully signed out from your profile.");
  };

  const copyToClipboard = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedCode(text);
      triggerToast(`Voucher code Copy Success: ${label}`);
      setTimeout(() => setCopiedCode(null), 3000);
    } catch {
      triggerToast("Failed to copy code. Please write it down: " + text);
    }
  };

  const promoOffers = [
    { code: "MYRA-AURA-15", label: "15% Off Olfactory Sprays", desc: "Applicable on all 100ml signature perfume orders", type: "Voucher", vipOnly: false },
    { code: "TUSCAN-GOLD", label: "Complimentary 24k Matte Engraving", desc: "Gold hot-stamp engraving on any leather wallet or belt selection", type: "Gift", vipOnly: false },
    { code: "COMP-ROSE-SOAP", label: "Free Luxurious Rose Glow Soap", desc: "Unlock with any purchase over ₹150 at boutique checkout", type: "Gift", vipOnly: false }
  ];

  const currentType = member.accountType;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-stone-950/65 backdrop-blur-md transition-opacity duration-300 animate-fade-in"
        onClick={() => {
          if (!isPaying) onClose();
        }}
      />

      {/* Main Container */}
      <div 
        id="luxury-membership-modal"
        className={`relative w-full overflow-y-auto rounded-3xl border transition-all duration-500 flex flex-col text-stone-800 z-10 ${
          isLoggedIn 
            ? "max-w-2xl max-h-[85vh] bg-[#FAF9F6] border-white shadow-2xl" 
            : "max-w-md max-h-[92vh] bg-gradient-to-b from-[#FCFAF8] via-[#F3EDE6] to-[#FCFAF8] border-stone-250 shadow-[0_24px_50px_rgba(40,30,20,0.14)]"
        }`}
      >
        {/* Close Button */}
        <button 
          id="close-membership-btn"
          disabled={isPaying}
          onClick={onClose}
          className="absolute top-5 right-5 z-20 p-2.5 rounded-full bg-white/90 hover:bg-stone-100 text-stone-700 hover:text-stone-950 shadow-md border border-stone-200/50 transition-all duration-300 cursor-pointer disabled:opacity-40"
          aria-label="Close membership panel"
        >
          <X className="w-4.5 h-4.5" />
        </button>

        {/* Dynamic checkout layout vs Regular profile layouts */}
        {showCheckout ? (
          /* PRESTIGE VIP SECURE SUBSCRIPTION CHECKOUT SUB-SCREEN */
          <div className="flex flex-col flex-1">
            {/* Header banner specialized for VIP checkout */}
            <div className="p-6 sm:p-8 text-[#FAF8F5] relative overflow-hidden shrink-0 bg-gradient-to-tr from-stone-950 via-[#1f1a16] to-stone-900 border-b border-stone-800">
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#C68B59_1px,transparent_1px)] [background-size:16px_16px]" />
              
              <button 
                type="button" 
                disabled={isPaying}
                onClick={() => setShowCheckout(false)}
                className="text-[#C68B59] hover:text-white text-xs font-bold uppercase tracking-wider mb-3.5 block transition-colors bg-transparent border-none cursor-pointer disabled:opacity-50"
              >
                ← Back to Registration Details
              </button>

              <div className="flex items-center gap-3 relative z-10">
                <span className="p-2 bg-leather-tan/20 rounded-xl border border-leather-tan/30 text-[#D4AF37]">
                  <Lock className="w-5 h-5 shrink-0" />
                </span>
                <div>
                  <span className="text-[9px] tracking-[0.25em] uppercase font-bold text-leather-tan block">Secure Billing Verification</span>
                  <h3 className="text-lg sm:text-xl font-serif font-semibold">MYRA Privé Member Pass</h3>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              
              {/* Dynamic luxury golden physical card mockup preview */}
              <div className="relative mx-auto max-w-sm w-full h-44 rounded-2xl bg-gradient-to-tr from-stone-950 via-[#27231e] to-stone-900 p-5 text-white shadow-xl border border-white/10 flex flex-col justify-between overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C68B59_1px,transparent_1px)] [background-size:10px_10px]" />
                <div className="absolute top-2 right-4 w-12 h-12 bg-leather-tan/20 rounded-full blur-xl font-sans" />
                
                <div className="flex justify-between items-start relative z-10">
                  <span className="text-[8px] uppercase tracking-[0.2em] text-leather-tan font-bold">MYRA Privé Charter</span>
                  {/* Small gold simulation chip */}
                  <div className="w-8 h-6 rounded bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-500 border border-white/20 opacity-80" />
                </div>

                <div className="relative z-10 py-1">
                  <div className="text-sm sm:text-base font-mono tracking-widest text-[#FAF8F5] leading-none mb-1.5">
                    {payCardNumber || "•••• •••• •••• ••••"}
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-stone-400 font-mono">
                    <span>CARDHOLDER: {payCardName.toUpperCase() || "LADY ELENA ROSTOVA"}</span>
                    <span>EXP: {payExpiry || "MM/YY"}</span>
                  </div>
                </div>

                <div className="flex justify-between items-end border-t border-white/5 pt-2 relative z-10">
                  <span className="text-[8px] text-stone-400 tracking-wider">SECURE DIGITAL LEDGER AUTHORIZATION</span>
                  <span className="text-xs font-serif font-bold text-[#D4AF37]">Privé Club</span>
                </div>
              </div>

              {/* Informative Price details */}
              <div className="bg-stone-100 border border-stone-200/50 rounded-2xl p-4.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-705 mb-2">Subscription & Point Accreditations</h4>
                <div className="space-y-1.5 text-xs text-stone-605">
                  <div className="flex justify-between">
                    <span>MYRA Privé Annual Pass Membership</span>
                    <span className="font-semibold text-stone-900">₹149.00 / year</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Priority Boutique Point Accred.(Instant Welcome)</span>
                    <span className="text-emerald-700 font-medium">+250 Gilded PTS</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-stone-400">
                    <span>Maison Consultation Consultations & Free Shipping</span>
                    <span className="font-medium text-stone-500">Free Lifetime Curation</span>
                  </div>
                  <div className="border-t border-stone-200 pt-1.5 flex justify-between font-bold text-stone-900">
                    <span>Total Due Today</span>
                    <span className="text-leather-tan font-serif text-sm">₹149.00 / year</span>
                  </div>
                </div>
              </div>

              {/* Secure payment checkout details form */}
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-1">
                    Cardholder Full Name on Card
                  </label>
                  <input 
                    type="text" 
                    required
                    disabled={isPaying}
                    value={payCardName}
                    onChange={(e) => setPayCardName(e.target.value)}
                    placeholder="Elena Rostova"
                    className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-sans text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-leather-tan disabled:opacity-60 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1.5">
                    <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-1">
                      Credit Card Number
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        required
                        disabled={isPaying}
                        value={payCardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="4111 2222 3333 4444"
                        className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-leather-tan disabled:opacity-60 transition-all"
                      />
                      <CreditCard className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-1">
                      Expiry Date
                    </label>
                    <input 
                      type="text" 
                      required
                      maxLength={5}
                      disabled={isPaying}
                      value={payExpiry}
                      onChange={handleExpiryChange}
                      placeholder="MM/YY"
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-xs font-mono text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-leather-tan text-center disabled:opacity-60 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-1">
                      Secure CVV
                    </label>
                    <input 
                      type="password" 
                      required
                      maxLength={4}
                      disabled={isPaying}
                      value={payCvv}
                      onChange={handleCvvChange}
                      placeholder="•••"
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-xs font-mono text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-leather-tan text-center disabled:opacity-60 transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 py-0.5">
                  <input
                    type="checkbox"
                    id="save-card-toggle"
                    disabled={isPaying}
                    checked={saveCardForFuture}
                    onChange={(e) => setSaveCardForFuture(e.target.checked)}
                    className="w-4 h-4 text-leather-tan border-stone-300 rounded focus:ring-leather-tan accent-[#C68B59] cursor-pointer disabled:opacity-50"
                  />
                  <label htmlFor="save-card-toggle" className="text-xs text-stone-500 select-none cursor-pointer disabled:opacity-50">
                    Securely save card in my private digital locker for automatic renewal benefits.
                  </label>
                </div>

                <div className="bg-amber-50/50 border border-amber-200/40 p-3 rounded-xl block text-[10px] text-stone-500 leading-relaxed">
                  <strong>Sandbox Testing Environment Notice:</strong> Since this is a boutique preview, feel free to use standard mock cards (e.g. <strong>4111 2222 3333 4444</strong>, standard CVV 123) to fully simulate the successful checkout. No actual bank charge will occur.
                </div>

                <div className="pt-3 border-t border-stone-200/40 flex items-center justify-between gap-4">
                  <button 
                    type="button"
                    disabled={isPaying}
                    onClick={() => setShowCheckout(false)}
                    className="text-stone-500 hover:text-stone-900 text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isPaying}
                    className="bg-stone-950 hover:bg-leather-tan disabled:bg-stone-800 text-white text-xs font-bold uppercase tracking-widest px-6 py-4 rounded-xl cursor-pointer shadow-md transition-all active:scale-95 duration-300 flex items-center gap-2"
                  >
                    {isPaying ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin text-leather-tan shrink-0" />
                        <span>Verifying Authorization Ledger...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-leather-tan shrink-0" />
                        <span>Authorize & Subscribe (₹149.00/yr)</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : !isLoggedIn ? (
          /* MAGNIFICENT IVORY SIGN-UP / LOGIN LUXURY FORM (SCREENSHOT 1) */
          <div className="p-6 sm:p-8 flex flex-col space-y-5 animate-fade-in text-stone-850">
            {/* Logo of MYRA LUXURY */}
            <div className="flex flex-col items-center justify-center space-y-1 mb-1">
              <div className="flex items-center gap-1.5 text-stone-300">
                <Sparkles className="w-4 h-4 text-leather-tan/70 shrink-0" />
                <span className="text-stone-300 text-xs font-light select-none shrink-0">+</span>
                <Award className="w-4 h-4 text-leather-tan/70 shrink-0" />
              </div>
              <span className="text-[9px] uppercase tracking-[0.35em] font-bold text-stone-500 font-sans text-center">
                {companyName} {companySubtitle}
              </span>
            </div>

            {/* Elegant Title */}
            <div className="text-center space-y-1.5">
              <h3 className="text-2xl sm:text-3xl font-serif text-stone-900 font-medium tracking-wide">
                {authMode === "register" ? "Create Your Account" : "Log In to Your Account"}
              </h3>
              
              {/* Decorative golden active diamond separator */}
              <div className="relative flex py-1 items-center justify-center w-full max-w-sm mx-auto">
                <div className="flex-grow border-t border-stone-200/65"></div>
                <span className="flex-shrink mx-3 text-leather-tan font-serif text-[10px] transform rotate-45 select-none text-xs">
                  ◆
                </span>
                <div className="flex-grow border-t border-stone-200/65"></div>
              </div>
            </div>

            {/* Authentication Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {authMode === "register" ? (
                <>
                  {/* Name fields row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wide text-stone-750 font-semibold mb-1">
                        First Name <span className="text-leather-tan">*</span>
                      </label>
                      <input 
                        type="text" 
                        required
                        value={regFirstName}
                        onChange={(e) => setRegFirstName(e.target.value)}
                        placeholder="Enter first name"
                        className="w-full bg-white border border-stone-200/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-leather-tan transition-all font-light"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wide text-stone-750 font-semibold mb-1">
                        Last Name <span className="text-leather-tan">*</span>
                      </label>
                      <input 
                        type="text" 
                        required
                        value={regLastName}
                        onChange={(e) => setRegLastName(e.target.value)}
                        placeholder="Enter last name"
                        className="w-full bg-white border border-stone-200/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-leather-tan transition-all font-light"
                      />
                    </div>
                  </div>

                  {/* Contact fields row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wide text-stone-755 font-semibold mb-1">
                        Email Address <span className="text-leather-tan">*</span>
                      </label>
                      <input 
                        type="email" 
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="Enter email address"
                        className="w-full bg-white border border-stone-200/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-leather-tan transition-all font-light"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wide text-stone-755 font-semibold mb-1">
                        Mobile Number <span className="text-leather-tan">*</span>
                      </label>
                      <input 
                        type="tel" 
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="Enter mobile number"
                        className="w-full bg-white border border-stone-200/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-leather-tan transition-all font-light"
                      />
                    </div>
                  </div>

                  {/* Password field */}
                  <div>
                    <label className="block text-[11px] uppercase tracking-wide text-stone-755 font-semibold mb-1">
                      Password <span className="text-leather-tan">*</span>
                    </label>
                    <input 
                      type="password" 
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Choose a strong password"
                      className="w-full bg-white border border-stone-200/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-leather-tan transition-all font-light"
                    />
                  </div>

                  {/* Checkbox settings styled uniquely */}
                  <div className="space-y-2 pt-1">
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-stone-600 select-none">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-stone-900 border-stone-300 rounded focus:ring-stone-400 accent-stone-950 cursor-pointer"
                      />
                      <span>
                        I agree to the{" "}
                        <span className="text-leather-tan font-semibold hover:underline">
                          Terms & Conditions
                        </span>
                      </span>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-stone-600 select-none">
                      <input
                        type="checkbox"
                        checked={agreedToNewsletter}
                        onChange={(e) => setAgreedToNewsletter(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-stone-900 border-stone-300 rounded focus:ring-stone-400 accent-stone-950 cursor-pointer"
                      />
                      <span>Send me exclusive fragrance launches and offers</span>
                    </label>
                  </div>
                </>
              ) : (
                <>
                  {/* Login Fields */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wide text-stone-755 font-semibold mb-1">
                        Email Address <span className="text-leather-tan">*</span>
                      </label>
                      <input 
                        type="email" 
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="Enter email address"
                        className="w-full bg-white border border-stone-200/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-leather-tan transition-all font-light"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase tracking-wide text-stone-755 font-semibold mb-1">
                        Password <span className="text-leather-tan">*</span>
                      </label>
                      <input 
                        type="password" 
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your account password"
                        className="w-full bg-white border border-stone-200/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-leather-tan transition-all font-light"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Primary Capsule Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-stone-950 hover:bg-leather-tan text-white text-xs sm:text-sm font-semibold uppercase tracking-widest py-3 rounded-full cursor-pointer shadow-md transition-all active:scale-98 duration-300 flex items-center justify-center gap-1.5"
                >
                  <span>
                    {authMode === "register" ? "Create Account" : "Log In"}
                  </span>
                  <ChevronRight className="w-4.5 h-4.5 text-white" />
                </button>
              </div>
            </form>

            {/* Secure Divider */}
            <div id="social-or-divider" className="relative flex py-1 items-center justify-center w-full">
              <div className="flex-grow border-t border-stone-200/60"></div>
              <span className="flex-shrink mx-4 text-[10px] text-stone-400 font-mono tracking-widest">
                OR
              </span>
              <div className="flex-grow border-t border-stone-200/60"></div>
            </div>

            {/* Social logins */}
            <div id="social-sign-in-pills" className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveSocialModal("google");
                  setSocialLoading(false);
                }}
                className="flex items-center justify-center gap-2 border border-stone-200 bg-white hover:bg-stone-50 text-[11px] sm:text-xs font-semibold text-stone-750 py-2.5 px-3 rounded-full shadow-sm transition-all active:scale-98 cursor-pointer"
              >
                <Chrome className="w-4 h-4 text-red-500 shrink-0" />
                <span className="truncate">Continue with Google</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveSocialModal("apple");
                  setSocialLoading(false);
                }}
                className="flex items-center justify-center gap-2 border border-stone-200 bg-white hover:bg-stone-50 text-[11px] sm:text-xs font-semibold text-stone-750 py-2.5 px-3 rounded-full shadow-sm transition-all active:scale-98 cursor-pointer"
              >
                <Apple className="w-4 h-4 text-stone-900 shrink-0" />
                <span className="truncate">Continue with Apple</span>
              </button>
            </div>

            {/* Footer auth switch toggle link */}
            <div className="pt-1 text-center text-xs text-stone-600">
              {authMode === "register" ? (
                <span>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setLoginEmail("");
                      setLoginPassword("");
                    }}
                    className="text-leather-tan hover:underline focus:outline-none font-bold cursor-pointer transition-colors"
                  >
                    Log In
                  </button>
                </span>
              ) : (
                <span>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("register");
                      setRegFirstName("");
                      setRegLastName("");
                      setRegEmail("");
                      setRegPhone("");
                      setRegPassword("");
                    }}
                    className="text-leather-tan hover:underline focus:outline-none font-bold cursor-pointer transition-colors"
                  >
                    Create Account
                  </button>
                </span>
              )}
            </div>
          </div>
        ) : (
          /* REGULAR TAB PROFILE INTERFACE FOR LOGGED IN ACCOUNT */
          <>
            {/* Modal Premium Header banner */}
            <div className="p-6 sm:p-8 text-[#FAF8F5] relative overflow-hidden shrink-0 transition-all duration-500 bg-gradient-to-r from-stone-900 via-[#272624] to-stone-900 border-b border-stone-850">
              {/* Subtle grid layout background */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C68B59_1px,transparent_1px)] [background-size:20px_20px]" />
              <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-leather-tan/20 rounded-full blur-2xl font-sans" />

              <div className="flex items-center gap-3.5 mb-2 relative z-10">
                <span className="p-2.5 rounded-xl border transition-all bg-stone-700/50 border-stone-650 text-stone-300">
                  <User className="w-5 h-5 sm:w-6 sm:h-6" />
                </span>
                <div>
                  <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-leather-tan block">
                    Maison Client Hub
                  </span>
                  <h2 className="text-xl sm:text-2xl font-serif font-semibold">
                    {`${member.name.split(' ')[0]}'s Account Workspace`}
                  </h2>
                </div>
              </div>
              <p className="text-stone-400 text-xs font-light max-w-md relative z-10">
                Access your digital boutique privileges, track active delivery logs, and personalize your luxury sensory profile.
              </p>
            </div>

            <div className="flex flex-col flex-1 min-h-0">
                {/* Tab navigation */}
                <div className="flex border-b border-stone-200 bg-stone-50 px-4 pt-1 sm:px-6 shrink-0 overflow-x-auto scrollbar-none">
                  {[
                    { id: "card", label: "Member Card", icon: Award },
                    { id: "orders", label: "My Orders", icon: ShoppingBag },
                    { id: "edit", label: "Edit Information", icon: Edit }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-1.5 py-4 px-3 text-xs font-semibold tracking-wide border-b-2 transition-all cursor-pointer ${
                          active 
                            ? "border-leather-tan text-stone-950 font-bold" 
                            : "border-transparent text-stone-500 hover:text-stone-900"
                        }`}
                      >
                        <Icon className="w-4 h-4 text-stone-600" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                  
                  <button 
                    onClick={handleLogout}
                    className="ml-auto flex items-center gap-1.5 text-stone-400 hover:text-rose-700 py-4 px-2 text-xs transition-colors cursor-pointer font-bold uppercase tracking-wider"
                    title="Sign out securely"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>

                {/* Content Body */}
                <div className="p-6 sm:p-8 flex-1">
                  
                  {/* Tab 1: Member Card showing standard client status */}
                  {activeTab === "card" && (
                    <div className="space-y-6">
                      {/* Minimalist gorgeous Standard Card design */}
                      <div className="relative overflow-hidden w-full h-48 sm:h-52 rounded-2xl bg-gradient-to-tr from-stone-100 via-stone-50 to-[#FAF9F6] p-5 sm:p-6 text-stone-800 shadow-lg border border-stone-200/50 flex flex-col justify-between transition-all duration-500">
                        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:12px_12px]" />
                        
                        <div className="flex items-start justify-between relative z-10">
                          <div>
                            <span className="text-[10px] tracking-[0.25em] uppercase text-stone-500 font-bold block mb-0.5">MYRA BOUTIQUE CLIENT</span>
                            <span className="text-xs text-stone-400 font-light italic">Standard Registration</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] tracking-widest text-stone-700 bg-stone-250 px-2.5 py-1 rounded border border-stone-200 font-semibold font-mono">
                              {member.memberId}
                            </span>
                          </div>
                        </div>

                        <div className="relative z-10">
                          <h4 className="text-lg sm:text-xl font-serif text-stone-900 tracking-wide font-medium">
                            {member.name}
                          </h4>
                          <span className="text-[10px] text-stone-500 font-medium block mt-1">
                            Standard Access Enabled • Preferred: {member.preferredCategory}
                          </span>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-stone-200/80 relative z-10">
                          <div className="flex items-center gap-1.5 text-[11px] text-stone-500 font-medium">
                            <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span>Standard Member Account</span>
                          </div>
                          <div className="text-right flex items-baseline gap-1.5">
                            <span className="text-[9px] text-stone-500 uppercase font-bold tracking-wider">Account Scale:</span>
                            <span className="text-base font-serif font-bold text-stone-900 leading-none">{member.loyaltyPoints} PTS</span>
                          </div>
                        </div>
                      </div>

                      {/* Quick details summary indices */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white border border-stone-200/55 p-4 rounded-xl flex gap-3 items-center">
                          <div className={`p-2.5 rounded-lg shrink-0 ${currentType === 'vip' ? 'bg-amber-50 text-leather-tan' : 'bg-stone-100 text-stone-600'}`}>
                            <TrendingUp className="w-4 h-4" />
                          </div>
                          <div>
                            <h5 className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">Account Tier</h5>
                            <p className="text-xs sm:text-sm text-stone-900 font-serif font-bold mt-0.5">{member.tier}</p>
                          </div>
                        </div>

                        <div className="bg-white border border-stone-200/55 p-4 rounded-xl flex gap-3 items-center">
                          <div className={`p-2.5 rounded-lg shrink-0 ${currentType === 'vip' ? 'bg-rose-50 text-rose-800' : 'bg-slate-50 text-slate-600'}`}>
                            <Award className="w-4 h-4" />
                          </div>
                          <div>
                            <h5 className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">Accumulated Balance</h5>
                            <p className="text-xs sm:text-sm text-stone-900 font-sans font-bold mt-0.5">{member.loyaltyPoints} PTS</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "orders" && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                        <div>
                          <h4 className="text-sm font-serif font-bold text-stone-900">Your Boutique Curation Orders</h4>
                          <p className="text-[11px] text-stone-500 font-light">Track shipping progress and manage custom order file cancellations</p>
                        </div>
                        <span className="text-[10px] bg-stone-200/60 px-2.5 py-1 rounded-full text-stone-750 font-bold font-sans">
                          {orders.length} Selection{orders.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {orders.length === 0 ? (
                        <div className="py-12 text-center bg-white border border-stone-200/50 rounded-2xl p-6">
                          <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                          <h5 className="text-sm font-serif font-semibold text-stone-800">Your Curation History is Void</h5>
                          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 leading-normal">
                            Explore our fragrance atelier, cold-pour botanical bars or signature full grain leather belts to make your first selection.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {orders.map((order) => {
                            const isExpanded = expandedOrderId === order.id;
                            const currentStatusVal = order.status.toLowerCase();
                            
                            // Check if tracking order status is equal to or passes through "shipping" status
                            // stages sequence: ["placed", "packing", "shipped", "delivering", "delivered"]
                            // Once "shipped" or beyond, order cancellation is NOT allowed.
                            const passesShipping = ["shipped", "delivering", "delivered", "cancelled"].includes(currentStatusVal);
                            const canCancelState = !passesShipping && currentStatusVal !== "cancellation_requested";

                            // Custom color badges based on status
                            const getBadgeStyle = (status: string) => {
                              switch (status) {
                                case "placed":
                                  return "bg-amber-50 text-amber-800 border-amber-200";
                                case "packing":
                                  return "bg-yellow-50 text-yellow-800 border-yellow-200";
                                case "shipped":
                                  return "bg-indigo-50 text-indigo-800 border-indigo-200";
                                case "delivering":
                                  return "bg-violet-50 text-violet-800 border-violet-200";
                                case "delivered":
                                  return "bg-emerald-50 text-emerald-800 border-emerald-200";
                                case "cancellation_requested":
                                  return "bg-orange-50 text-orange-900 border-orange-300 animate-pulse";
                                case "cancelled":
                                  return "bg-stone-100 text-stone-600 border-stone-300";
                                default:
                                  return "bg-stone-50 text-stone-600 border-stone-200";
                              }
                            };

                            const getStatusLabel = (status: string) => {
                              switch (status) {
                                case "placed": return "Order Placed";
                                case "packing": return "Atelier Packing Stage";
                                case "shipped": return "Shipped / In Transit";
                                case "delivering": return "Out for Delivery";
                                case "delivered": return "Delivered Successfully";
                                case "cancellation_requested": return "Cancellation Requested";
                                case "cancelled": return "Order Cancelled";
                                default: return status.toUpperCase();
                              }
                            };

                            return (
                              <div key={order.id} className="bg-white border border-stone-200/75 rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                                {/* Order header */}
                                <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 bg-stone-50/50">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-mono font-bold text-stone-900">{order.id}</span>
                                      <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border font-semibold ${getBadgeStyle(currentStatusVal)}`}>
                                        {getStatusLabel(currentStatusVal)}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-stone-400 font-medium">Boutique Purchase Verified: {order.date}</p>
                                  </div>

                                  <div className="text-right">
                                    <span className="text-[10px] text-stone-400 block tracking-wider uppercase font-bold">Sum Total</span>
                                    <span className="text-sm sm:text-base font-serif font-bold text-leather-tan">₹{order.totalPrice}</span>
                                  </div>
                                </div>

                                {/* Order items */}
                                <div className="p-4 sm:p-5 divide-y divide-stone-100 bg-white">
                                  {order.items.map((item: any, idx: number) => (
                                    <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded bg-stone-50 border border-stone-200/65 flex items-center justify-center font-bold text-[10px] text-stone-400 font-mono">
                                          {item.quantity}x
                                        </div>
                                        <div>
                                          <h5 className="text-xs font-semibold text-stone-800">{item.name}</h5>
                                          <span className="text-[10px] text-stone-400 block font-light">
                                            {item.sizeOrSpec}
                                          </span>
                                        </div>
                                      </div>
                                      <span className="text-xs font-semibold text-stone-700">₹{item.price * item.quantity}</span>
                                    </div>
                                  ))}
                                </div>

                                {/* Controls row */}
                                <div className="px-4 py-3 sm:px-5 bg-stone-50/30 border-t border-stone-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
                                  <button
                                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                    className="w-full sm:w-auto flex items-center justify-center gap-1 py-1 text-xs font-semibold text-stone-700 hover:text-leather-tan transition-colors cursor-pointer"
                                  >
                                    <span>Track Order</span>
                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-stone-500" /> : <ChevronDown className="w-4 h-4 text-stone-500" />}
                                  </button>

                                  <div className="w-full sm:w-auto flex flex-col items-center sm:items-end gap-1.5">
                                    {order.status === "cancellation_requested" ? (
                                      <div className="flex items-center gap-1.5 text-orange-850 text-[11px] font-semibold bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200">
                                        <AlertTriangle className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
                                        <span>CANCELLATION REQUESTED - ADMIN WILL PROCESS</span>
                                      </div>
                                    ) : order.status === "cancelled" ? (
                                      <div className="text-stone-500 text-[11px] font-semibold bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200">
                                        <span>ORDER CANCELLED</span>
                                      </div>
                                    ) : (
                                      <>
                                        {canCancelState ? (
                                          <button
                                            onClick={() => handleCancelOrder(order.id)}
                                            className="w-full sm:w-auto bg-[#8C3A2B] hover:bg-rose-900 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-sm active:scale-95"
                                          >
                                            Cancel Order
                                          </button>
                                        ) : (
                                          <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
                                            <button
                                              disabled
                                              className="w-full sm:w-auto bg-stone-205 text-stone-300 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg cursor-not-allowed border border-stone-200/50"
                                            >
                                              Cancel Order
                                            </button>
                                            <p className="text-[9px] text-red-700 font-sans font-extrabold tracking-wider block mt-1 uppercase text-center sm:text-right">
                                              YOU CAN'T CANCEL YOUR ORDER AFTER SHIPPING
                                            </p>
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Tracking stepper details */}
                                {isExpanded && (
                                  <div className="p-5 sm:p-6 border-t border-stone-150 bg-[#FCFAF7] space-y-6">
                                    <div className="space-y-4">
                                      <h6 className="text-[10px] uppercase tracking-widest text-[#8A7968] font-bold font-sans">Live Delivery Progress Tracking</h6>
                                      
                                      {/* Stepper graphics */}
                                      <div className="relative pt-2 pb-6">
                                        {/* Progress line */}
                                        <div className="absolute top-[17px] left-5 right-5 h-1 bg-stone-200 rounded-full z-0">
                                          <div 
                                            className="bg-leather-tan h-full transition-all duration-500 rounded-full"
                                            style={{
                                              width: `${
                                                ["placed", "packing", "shipped", "delivering", "delivered"].includes(currentStatusVal)
                                                  ? `${(["placed", "packing", "shipped", "delivering", "delivered"].indexOf(currentStatusVal) / 4) * 100}%`
                                                  : "0%"
                                              }`
                                            }}
                                          />
                                        </div>

                                        {/* Stepper points */}
                                        <div className="relative z-10 flex justify-between">
                                          {[
                                            { key: "placed", index: 0, label: "Placed", icon: Clock },
                                            { key: "packing", index: 1, label: "Packing Stage", icon: Package },
                                            { key: "shipped", index: 2, label: "Shipped", icon: Truck },
                                            { key: "delivering", index: 3, label: "Transit", icon: Truck },
                                            { key: "delivered", index: 4, label: "Delivered", icon: CheckCircle }
                                          ].map((step) => {
                                            const stepsList = ["placed", "packing", "shipped", "delivering", "delivered"];
                                            const stepIndex = stepsList.indexOf(currentStatusVal);
                                            const isCompleted = stepIndex >= step.index;
                                            const isActive = stepIndex === step.index;
                                            const StepIcon = step.icon;

                                            return (
                                              <div key={step.key} className="flex flex-col items-center">
                                                <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-500 ${
                                                  isActive 
                                                    ? "bg-[#FCFAF7] border-dashed border-leather-tan text-leather-tan ring-4 ring-leather-tan/15" 
                                                    : isCompleted 
                                                      ? "bg-stone-900 border-stone-900 text-leather-tan" 
                                                      : "bg-stone-100 border-stone-200 text-stone-400"
                                                }`}>
                                                  <StepIcon className="w-4 h-4" />
                                                </div>
                                                <span className={`text-[9px] font-bold mt-2 font-sans ${isActive ? "text-leather-tan" : isCompleted ? "text-stone-800" : "text-stone-400"}`}>
                                                  {step.label}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>

                                      {/* Tracking descriptive explanation */}
                                      <div className="bg-white border border-stone-200 rounded-xl p-3.5 text-xs text-stone-650 font-light leading-relaxed flex gap-3">
                                        <Info className="w-4 h-4 text-leather-tan shrink-0 mt-0.5" />
                                        <div>
                                          {currentStatusVal === "placed" && (
                                            <p>Your order has been authorized on the digital blockchain ledger. A dedicated curation clerk will begin choosing perfume materials and premium leather hides in the next business cycle.</p>
                                          )}
                                          {currentStatusVal === "packing" && (
                                            <p><strong>Artisan Packing stage:</strong> Individual sensory ingredients and custom monogram details are being packaged and wax-sealed at the MYRA central workspace.</p>
                                          )}
                                          {currentStatusVal === "shipped" && (
                                            <p><strong>Shipping In-Transit:</strong> The private courier handler has accepted your curated pack. Terminal safety scans are complete and routing schedules are active.</p>
                                          )}
                                          {currentStatusVal === "delivering" && (
                                            <p><strong>Out for Delivery:</strong> Regional shipping companions have scanned your padded pack and are travelling to your residential location today.</p>
                                          )}
                                          {currentStatusVal === "delivered" && (
                                            <p><strong>Delivered Successfully!</strong> The package has been verified and signed off. Thank you for selecting MYRA boutique craft.</p>
                                          )}
                                          {currentStatusVal === "cancellation_requested" && (
                                            <p className="text-orange-900 font-semibold">Our system has logged your cancellation request. The admin team has been notified to freeze materials extraction and issue points/financial refunds.</p>
                                          )}
                                          {currentStatusVal === "cancelled" && (
                                            <p className="text-stone-500">Order transaction successfully cancelled. Accounts ledgers are synchronized.</p>
                                          )}
                                        </div>
                                      </div>

                                      {/* Shipping Destination coordinates if available */}
                                      {order.shippingDetails && (
                                        <div className="bg-stone-50/50 border border-stone-200 p-4 rounded-xl space-y-3">
                                          <div className="flex items-center justify-between border-b border-stone-200/50 pb-1.5">
                                            <span className="text-[10px] tracking-widest uppercase font-bold text-[#8A7968]">Sensory Package Dispatch Label</span>
                                            <span className="text-[9px] bg-stone-200/60 font-semibold px-2 rounded-full text-stone-700">
                                              {order.shippingDetails.addressType || "Home"} Deliver
                                            </span>
                                          </div>
                                          
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs leading-relaxed text-stone-650">
                                            <div>
                                              <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block">Addressee Nominee</span>
                                              <strong className="text-stone-850 block">{order.shippingDetails.firstName} {order.shippingDetails.lastName}</strong>
                                              <p className="text-[11px]">📞 {order.shippingDetails.mobileNumber}</p>
                                              <p className="text-[11px]">✉️ {order.shippingDetails.emailAddress}</p>
                                            </div>
                                            <div>
                                              <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block">Atelier Shipping Addresses</span>
                                              <p className="text-[11px] text-stone-850">
                                                {order.shippingDetails.houseNo}, {order.shippingDetails.streetAddress}
                                                <br />
                                                {order.shippingDetails.areaLocality}, {order.shippingDetails.city}
                                                <br />
                                                {order.shippingDetails.state} - <strong className="text-stone-900">{order.shippingDetails.pinCode}</strong>
                                                <br />
                                                {order.shippingDetails.country}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Atelier administration simulator panel */}
                                    {localStorage.getItem("myra_admin_auth") === "true" && (
                                      <div className="bg-stone-100/70 border border-stone-200 p-4 rounded-2xl space-y-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/60 pb-2">
                                          <span className="text-[9px] tracking-widest uppercase font-bold text-stone-500 font-sans block">Atelier Pipeline Simulator</span>
                                          <span className="text-[8px] bg-leather-tan/20 text-[#8A7968] font-bold font-mono px-2 py-0.5 rounded uppercase">Sandbox Testing Node</span>
                                        </div>
                                        
                                        <p className="text-[10px] text-stone-500 leading-normal">
                                          Use this sandbox pipeline simulation switcher to advance or regress this order's status to test how the user cancellation constraint responds:
                                        </p>

                                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                                          {[
                                            { status: "placed", label: "Placed" },
                                            { status: "packing", label: "Packing Stage" },
                                            { status: "shipped", label: "Shipped" },
                                            { status: "delivering", label: "Delivery Transit" },
                                            { status: "delivered", label: "Delivered" }
                                          ].map((sim) => {
                                            const isActiveSim = currentStatusVal === sim.status;
                                            return (
                                              <button
                                                key={sim.status}
                                                onClick={() => handleSimulateStatus(order.id, sim.status)}
                                                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded border transition-all cursor-pointer ${
                                                  isActiveSim 
                                                    ? "bg-stone-900 text-[#FAF8F5] border-stone-950 font-extrabold shadow-sm" 
                                                    : "bg-white hover:bg-stone-100 text-stone-700 border-stone-200 hover:text-stone-900"
                                                }`}
                                              >
                                                {sim.label}
                                              </button>
                                            );
                                          })}
                                          
                                          <button
                                            onClick={() => handleSimulateStatus(order.id, "cancelled")}
                                            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded border transition-all cursor-pointer ${
                                              currentStatusVal === "cancelled" 
                                                ? "bg-[#8C3A2B] text-white border-[#8C3A2B] font-extrabold" 
                                                : "bg-[#FFF5F5] hover:bg-red-50 text-red-800 border-red-105"
                                            }`}
                                          >
                                            Sim Cancelled
                                          </button>
                                        </div>

                                        <div className="text-[9px] text-stone-450 italic flex gap-1 items-center bg-white/50 p-2 rounded-lg border border-stone-200/30">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                          <span>Test parameter: switch to "Shipped" or above to display <strong>"YOU CAN'T CANCEL YOUR ORDER AFTER SHIPPING"</strong>.</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

              {/* Tab 4: Modify Profile data */}
              {activeTab === "edit" && (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-1">
                        Display Name
                      </label>
                      <input 
                        type="text" 
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2 text-xs font-sans text-stone-900 focus:outline-none focus:ring-1 focus:ring-leather-tan"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-1">
                        Email Address *
                      </label>
                      <input 
                        type="email" 
                        required
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2 text-xs font-sans text-stone-900 focus:outline-none focus:ring-1 focus:ring-leather-tan"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-1">
                        Private Phone Line
                      </label>
                      <input 
                        type="text" 
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2 text-xs font-sans text-stone-900 focus:outline-none focus:ring-1 focus:ring-leather-tan"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-1">
                        Bespoke Craft Interest
                      </label>
                      <select 
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-leather-tan"
                      >
                        <option value="Perfumes">Olfactory Perfumes & Oils</option>
                        <option value="Leather Goods">Artisanal Leatherwork</option>
                        <option value="Handmade Soaps">Botanical Cold-pour Soaps</option>
                        <option value="Gift Sets">All Curation Collections</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-1">
                      Billing / Courier Delivery Location
                    </label>
                    <input 
                      type="text" 
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2 text-xs font-sans text-stone-900 focus:outline-none focus:ring-1 focus:ring-leather-tan"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-1">
                      Olfactory & Botanical Sensory Tone Preferences
                    </label>
                    <input 
                      type="text" 
                      value={editScent}
                      onChange={(e) => setEditScent(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2 text-xs font-sans text-stone-900 focus:outline-none focus:ring-1 focus:ring-leather-tan"
                    />
                  </div>

                  <div className="pt-3.5 flex justify-end">
                    <button 
                      type="submit"
                      className="bg-stone-900 hover:bg-leather-tan text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl cursor-pointer shadow flex items-center gap-1.5 transition-colors duration-300"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Account Update
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </>
      )}

      {/* Google-Style Secure Accounts Chooser Overlay Sim */}
      {activeSocialModal === "google" && (
        <div id="google-oauth-sim" className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in/10">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-stone-100 overflow-hidden text-stone-800 flex flex-col font-sans transition-all transform scale-100 duration-300">
            {/* Google secure header indicator */}
            <div className="bg-stone-50 border-b border-stone-200/80 px-4 py-3 flex items-center justify-between text-xs text-stone-500 font-medium">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span className="font-mono tracking-tight text-[10px]">accounts.google.com/oauth2</span>
              </div>
              <button 
                type="button"
                onClick={() => setActiveSocialModal(null)}
                className="text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {socialLoading ? (
              /* Simulated authentic Google exchange keys keyway loader */
              <div className="p-10 flex flex-col items-center justify-center space-y-4 text-center">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-4 border-stone-100 animate-pulse absolute"></div>
                  <div className="w-12 h-12 rounded-full border-4 border-t-cyan-500 border-r-amber-500 border-b-rose-500 border-l-emerald-500 animate-spin absolute"></div>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-stone-900">Connecting Secure ID...</h4>
                  <p className="text-[11px] text-stone-400 font-light">Exchanging credential keys with MYRA LUXURY</p>
                </div>
              </div>
            ) : (
              <div className="p-6 flex flex-col space-y-5">
                {/* Brand Identity / Title header */}
                <div className="flex flex-col items-center space-y-2.5 text-center">
                  {/* Custom colored icon */}
                  <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center shadow-sm border border-stone-100 shrink-0">
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5.04c1.7 0 3.23.59 4.44 1.74l3.3-3.3C17.75 1.58 15.02 1 12 1 7.35 1 3.4 3.65 1.56 7.56l3.82 2.96C6.27 7.56 8.92 5.04 12 5.04z" />
                      <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.45h6.44c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-2 3.43-4.94 3.43-8.55z" />
                      <path fill="#FBBC05" d="M5.38 10.52a6.99 6.99 0 0 1 0-4.04L1.56 3.52a11.96 11.96 0 0 0 0 10.04l3.82-3.04z" />
                      <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.7-2.87c-1.03.69-2.35 1.1-4.26 1.1-3.08 0-5.73-2.52-6.62-5.48l-3.82 2.96C3.4 20.35 7.35 23 12 23z" />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-stone-900 font-sans tracking-tight">Sign in with Google</h3>
                    <p className="text-[11px] text-stone-500">to continue to <strong className="text-stone-850 font-semibold font-serif">MYRA LUXURY</strong></p>
                  </div>
                </div>

                {/* Account list options */}
                <div className="space-y-2">
                  <p className="text-[10px] text-stone-400 font-bold tracking-wider uppercase">Select accounts</p>
                  
                  {/* Lady Elena Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSocialLoading(true);
                      setTimeout(() => {
                        const randId = Math.floor(1000 + Math.random() * 9000);
                        const newMember: MemberInfo = {
                          name: "Lady Elena Rostova",
                          email: "elena.rostova@luxury.com",
                          phone: "+39 333 4839 902",
                          address: "Piazza di Spagna, 14, Rome, Italy 00187",
                          preferredCategory: "Perfumes",
                          scentNotes: "Rose, Warm Amberwood & White Musk",
                          tier: "Maison Elite Client",
                          loyaltyPoints: 1250,
                          memberId: `MYRA-${randId}-STD`,
                          memberSince: "May 2024",
                          accountType: "standard"
                        };
                        setRegFirstName("Elena");
                        setRegLastName("Rostova");
                        setRegEmail("elena.rostova@luxury.com");
                        setLoginEmail("elena.rostova@luxury.com");
                        setAgreedToTerms(true);
                        setAgreedToNewsletter(true);
                        setMember(newMember);
                        setIsLoggedIn(true);
                        setActiveTab("card");
                        setActiveSocialModal(null);
                        setSocialLoading(false);
                        triggerToast("Google Sign-In completed securely. Welcome Lady Elena Rostova!");
                      }, 1200);
                    }}
                    className="w-full flex items-center justify-between p-3 border border-stone-200 hover:border-stone-950 rounded-xl hover:bg-stone-50/50 text-left transition-all duration-200 group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#E5D5C5] text-stone-800 font-bold font-serif flex items-center justify-center text-xs shadow-sm">
                        ER
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-stone-900 leading-tight">Elena Rostova</span>
                        <span className="text-[10px] text-stone-500">elena.rostova@luxury.com</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-[#D4AF37] font-semibold uppercase tracking-wider bg-amber-50 px-1.5 py-0.5 rounded">
                      Elite Client
                    </span>
                  </button>

                  {/* Alexandra Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSocialLoading(true);
                      setTimeout(() => {
                        const randId = Math.floor(1000 + Math.random() * 9000);
                        const newMember: MemberInfo = {
                          name: "Alexandra Dubois",
                          email: "alexandra.dubois@chic.fr",
                          phone: "+33 6 5293 8401",
                          address: "Avenue Montaigne, 42, Paris, France 75008",
                          preferredCategory: "Perfumes",
                          scentNotes: "Vanilla Suede, Jasmine & Cashmere",
                          tier: "Bespoke Connoisseur",
                          loyaltyPoints: 1500,
                          memberId: `MYRA-${randId}-STD`,
                          memberSince: "June 2024",
                          accountType: "standard"
                        };
                        setRegFirstName("Alexandra");
                        setRegLastName("Dubois");
                        setRegEmail("alexandra.dubois@chic.fr");
                        setLoginEmail("alexandra.dubois@chic.fr");
                        setAgreedToTerms(true);
                        setAgreedToNewsletter(true);
                        setMember(newMember);
                        setIsLoggedIn(true);
                        setActiveTab("card");
                        setActiveSocialModal(null);
                        setSocialLoading(false);
                        triggerToast("Google Sign-In completed securely. Welcome Alexandra Dubois!");
                      }, 1200);
                    }}
                    className="w-full flex items-center justify-between p-3 border border-stone-200 hover:border-stone-950 rounded-xl hover:bg-stone-50/50 text-left transition-all duration-200 group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#8A7968]/20 text-[#8A7968] font-bold font-serif flex items-center justify-center text-xs shadow-sm">
                        AD
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-stone-900 leading-tight">Alexandra Dubois</span>
                        <span className="text-[10px] text-stone-500">alexandra.dubois@chic.fr</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-stone-400 font-semibold uppercase tracking-wider group-hover:text-stone-950 transition-colors">
                      Select
                    </span>
                  </button>
                </div>

                <p className="text-[10.5px] text-stone-400 leading-relaxed font-light font-sans">
                  The Google identity network transmits authenticated email claims only. View MYRA LUXURY's <span className="underline hover:text-stone-700 cursor-pointer">Privacy Policy</span> and secure certification protocols.
                </p>

                {/* Footer buttons */}
                <div className="flex justify-end pt-1">
                  <button 
                    type="button" 
                    onClick={() => setActiveSocialModal(null)}
                    className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Apple-Style Secure iOS Authenticator Overlay Sim */}
      {activeSocialModal === "apple" && (
        <div id="apple-oauth-sim" className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in/10">
          <div className="bg-stone-950 w-full max-w-sm rounded-[24px] shadow-2xl border border-stone-850 overflow-hidden text-neutral-200 flex flex-col font-sans transition-all transform scale-100 duration-300">
            {/* Apple custom title header bar */}
            <div className="bg-stone-900 border-b border-stone-850 px-4 py-3 flex items-center justify-between text-xs text-stone-400 font-medium font-sans">
              <div className="flex items-center gap-1.5">
                <Apple className="w-3.5 h-3.5 text-white" />
                <span className="font-semibold text-white">Apple ID Authentication</span>
              </div>
              <button 
                type="button"
                onClick={() => setActiveSocialModal(null)}
                className="text-stone-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {socialLoading ? (
              /* Simulated Apple Private Relay FaceID scanner pulse loop */
              <div className="p-10 flex flex-col items-center justify-center space-y-6 text-center">
                <div className="relative flex items-center justify-center w-16 h-16">
                  <div className="w-16 h-16 rounded-full border-2 border-stone-800 absolute"></div>
                  <div className="w-16 h-16 rounded-full border-2 border-t-white border-r-stone-700 animate-spin absolute"></div>
                  <Apple className="w-6 h-6 text-white absolute shrink-0" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs uppercase tracking-widest font-bold text-white">Verifying Touch ID...</h4>
                  <p className="text-[10px] text-stone-500 font-light font-mono">ENCRYPTING RELAY CLAIMS</p>
                </div>
              </div>
            ) : (
              <div className="p-6 flex flex-col space-y-5">
                <div className="flex flex-col items-center space-y-2 text-center">
                  <Apple className="w-10 h-10 text-white" />
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold tracking-tight text-white font-sans">Sign in with Apple ID</h3>
                    <p className="text-[11px] text-stone-400 leading-normal">Authorize secure connection with password or Face ID</p>
                  </div>
                </div>

                {/* Profile choice lists */}
                <div className="space-y-2">
                  <span className="text-[9px] text-stone-500 font-bold uppercase tracking-wider">Apple ID accounts found</span>
                  
                  {/* Preloaded Choice 1 */}
                  <button
                    type="button"
                    onClick={() => {
                      setSocialLoading(true);
                      setTimeout(() => {
                        const randId = Math.floor(1000 + Math.random() * 9000);
                        const newMember: MemberInfo = {
                          name: "Lady Elena Rostova",
                          email: "elena.rostova@luxury.com",
                          phone: "+39 333 4839 902",
                          address: "Piazza di Spagna, 14, Rome, Italy 00187",
                          preferredCategory: "Perfumes",
                          scentNotes: "Rose, Warm Amberwood & White Musk",
                          tier: "Maison Elite Client",
                          loyaltyPoints: 1250,
                          memberId: `MYRA-${randId}-STD`,
                          memberSince: "May 2024",
                          accountType: "standard"
                        };
                        setRegFirstName("Elena");
                        setRegLastName("Rostova");
                        setRegEmail("elena.rostova@luxury.com");
                        setLoginEmail("elena.rostova@luxury.com");
                        setAgreedToTerms(true);
                        setAgreedToNewsletter(true);
                        setMember(newMember);
                        setIsLoggedIn(true);
                        setActiveTab("card");
                        setActiveSocialModal(null);
                        setSocialLoading(false);
                        triggerToast("Apple ID authenticated successfully via Secure Touch ID!");
                      }, 1200);
                    }}
                    className="w-full flex items-center justify-between p-3 bg-stone-900 border border-stone-800 hover:border-white text-white rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-xs">
                        🛡️
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold leading-tight text-white">Elena Rostova</span>
                        <span className="text-[9px] text-stone-400">elena.rostova@luxury.com</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* Preloaded Choice 2 */}
                  <button
                    type="button"
                    onClick={() => {
                      setSocialLoading(true);
                      setTimeout(() => {
                        const randId = Math.floor(1000 + Math.random() * 9000);
                        const newMember: MemberInfo = {
                          name: "Arthur de Rohan",
                          email: "arthur.rohan@chateau.fr",
                          phone: "+33 7 9423 1032",
                          address: "Rue du Faubourg Saint-Honoré, 73, Paris, France",
                          preferredCategory: "Perfumes",
                          scentNotes: "Sandalwood, Spiced Cedar & Vetiver Tincture",
                          tier: "Maison Royal Elite",
                          loyaltyPoints: 3100,
                          memberId: `MYRA-${randId}-STD`,
                          memberSince: "March 2024",
                          accountType: "standard"
                        };
                        setRegFirstName("Arthur");
                        setRegLastName("Rohan");
                        setRegEmail("arthur.rohan@chateau.fr");
                        setLoginEmail("arthur.rohan@chateau.fr");
                        setAgreedToTerms(true);
                        setAgreedToNewsletter(true);
                        setMember(newMember);
                        setIsLoggedIn(true);
                        setActiveTab("card");
                        setActiveSocialModal(null);
                        setSocialLoading(false);
                        triggerToast("Apple ID authenticated successfully via Private Relay!");
                      }, 1200);
                    }}
                    className="w-full flex items-center justify-between p-3 bg-stone-900 border border-stone-800 hover:border-white text-white rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-xs font-serif font-bold text-[#D4AF37]">
                        AR
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold leading-tight text-white">Arthur de Rohan</span>
                        <span className="text-[9px] text-stone-400 font-mono">arthur.rohan@chateau.fr</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                <p className="text-[10px] text-stone-500 font-sans leading-relaxed text-center font-light pt-1">
                  Apple Hide My Email options are supported. Access is mediated by Apple's secure hardware sandbox.
                </p>

                {/* Footer action link */}
                <div className="flex justify-center">
                  <button 
                    type="button" 
                    onClick={() => setActiveSocialModal(null)}
                    className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]/80 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel Secure Sign-In
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
  );
};
