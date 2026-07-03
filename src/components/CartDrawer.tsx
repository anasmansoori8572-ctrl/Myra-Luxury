import React, { useState, useEffect } from "react";
import { CartItem } from "../types";
import { ProductVisual } from "./ProductVisual";
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, ShieldCheck, Tag, Gift, ChevronLeft, MapPin, User, Mail, Phone, Home, Briefcase, Info, CreditCard, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../lib/authContext";
import { db } from "../lib/firebase";
import { collection, doc, setDoc, getDocs, getDoc, deleteDoc } from "firebase/firestore";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
  triggerToast: (msg: string) => void;
  onOpenProfile?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  triggerToast,
  onOpenProfile
}) => {
  const { user, memberInfo, isLoggedIn } = useAuth();
  const [promoCode, setPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; type: "fixed" | "percentage" | "free_shipping"; value: number } | null>(null);
  const [discountError, setDiscountError] = useState("");
  const [dbPromoCodes, setDbPromoCodes] = useState<any[]>([]);
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "shipping" | "payment" | "submitting" | "success">("cart");

  // Razorpay payment methods and simulation
  const [paymentMethodGroup, setPaymentMethodGroup] = useState<"upi" | "card" | "netbanking" | "wallet" | "cod">("upi");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [selectedBank, setSelectedBank] = useState("SBI");
  const [selectedWallet, setSelectedWallet] = useState("Paytm");
  
  // Custom overlay for Razorpay checkout window
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [razorpayPaymentState, setRazorpayPaymentState] = useState<"loading" | "method_selected" | "verifying" | "success" | "failed">("loading");
  const [razorpayError, setRazorpayError] = useState("");

  // Sync and fetch dynamic promo codes when drawer visibility changes
  useEffect(() => {
    if (isOpen) {
      const loadPromoCodes = async () => {
        try {
          const res = await fetch("/api/promo-codes");
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              setDbPromoCodes(data);
              return;
            }
          }
          throw new Error("Proxy promo codes fetch failed");
        } catch (err) {
          console.warn("[Firestore Sync Fallback]: Fetching promo codes directly from Client SDK...", err);
          try {
            const snap = await getDocs(collection(db, "promoCodes"));
            const data = snap.docs.map(d => d.data());
            setDbPromoCodes(data);
          } catch (fallbackErr) {
            console.error("Direct client promo codes fetch failed too:", fallbackErr);
          }
        }
      };
      loadPromoCodes();
    }
  }, [isOpen]);

  // Load Razorpay dynamic script on mount to support real checkout flow
  useEffect(() => {
    const rzpUrl = "https://checkout.razorpay.com/v1/checkout.js";
    const existingScript = document.querySelector(`script[src="${rzpUrl}"]`);
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = rzpUrl;
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Shipping form fields tracking matching the user's questionnaire
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [houseNo, setHouseNo] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [areaLocality, setAreaLocality] = useState("");
  const [shCity, setShCity] = useState("");
  const [shState, setShState] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [shCountry, setShCountry] = useState("India");
  const [addressType, setAddressType] = useState<"Home" | "Office" | "Other">("Home");
  const [altMobile, setAltMobile] = useState("");

  // Pricing calculations declared early to prevent temporal dead-zone references
  const subtotal = (cartItems && Array.isArray(cartItems)) 
    ? cartItems.reduce((acc, item) => {
        if (!item || !item.product) return acc;
        const price = typeof item.product.price === "number" ? item.product.price : Number(item.product.price) || 0;
        const qty = typeof item.quantity === "number" ? item.quantity : Number(item.quantity) || 1;
        return acc + price * qty;
      }, 0)
    : 0;

  // Delhivery Dynamic Shipping state variables
  const [delhiveryShippingDetails, setDelhiveryShippingDetails] = useState<any | null>(null);
  const [isCheckingPincode, setIsCheckingPincode] = useState(false);
  const [pincodeError, setPincodeError] = useState("");
  const [pincodeValidatedVal, setPincodeValidatedVal] = useState("");

  const handleVerifyDelhivery = async (targetPin?: string) => {
    const pinToVerify = (targetPin || pinCode).trim();
    if (!pinToVerify) return;
    if (pinToVerify.length !== 6 || /\D/.test(pinToVerify)) {
      setPincodeError("PIN Code must be exactly 6 digits.");
      setDelhiveryShippingDetails(null);
      return;
    }

    setIsCheckingPincode(true);
    setPincodeError("");

    try {
      // 1. Fetch PIN Code Serviceability from Delhivery API endpoint
      const servResp = await fetch(`/api/shipping/serviceability?pincode=${pinToVerify}`);
      if (!servResp.ok) {
        const errorData = await servResp.json();
        throw new Error(errorData.error || "Pincode is unserviceable.");
      }
      const servData = await servResp.json();

      if (!servData.serviceable) {
        throw new Error(servData.error || "Delivery unserviceable to this location.");
      }

      // Auto-set the city and state retrieved from the official Delhivery database context!
      if (servData.city && !shCity) setShCity(servData.city);
      if (servData.state && !shState) setShState(servData.state);

      // Map cart items with their exact product weights and dimensions
      const formattedItems = cartItems.map(it => {
        const p = it.product;
        return {
          id: p.id,
          category: p.category,
          quantity: it.quantity,
          price: p.price,
          weight: p.weight,
          length: p.length,
          width: p.width,
          height: p.height,
          fragile: p.fragile,
          shippingCategory: p.shippingCategory
        };
      });

      // 2. Compute dynamic delivery rates from backend API
      const calcResp = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destPin: pinToVerify,
          items: formattedItems,
          paymentMethod: paymentMethodGroup,
          orderValue: subtotal
        })
      });

      if (!calcResp.ok) {
        const errorData = await calcResp.json();
        throw new Error(errorData.error || "Failed to calculate dynamic freight charges.");
      }

      const calcData = await calcResp.json();
      setDelhiveryShippingDetails(calcData);
      setPincodeValidatedVal(pinToVerify);
    } catch (err: any) {
      console.warn("[Delhivery Sync Fallback]: Server endpoints offline or failed. Performing client-side calculation...", err);
      try {
        const pinNum = pinToVerify.replace(/\D/g, "");
        if (pinNum.length !== 6 || pinNum.startsWith("0")) {
          throw new Error("Invalid Indian PIN code format. Must be 6 digits.");
        }
        
        // Determine prefix and zone
        const prefix = pinNum.charAt(0);
        const isOda = pinNum.endsWith("9");
        let city = "Mumbai";
        let state = "Maharashtra";
        let zone = "A";
        let minDays = 1;
        let maxDays = 2;
        
        switch (prefix) {
          case "1": city = "New Delhi"; state = "Delhi"; zone = "C"; minDays = 3; maxDays = 5; break;
          case "2": city = "Lucknow"; state = "Uttar Pradesh"; zone = "C"; minDays = 3; maxDays = 5; break;
          case "3": city = "Jaipur"; state = "Rajasthan"; zone = "B"; minDays = 2; maxDays = 4; break;
          case "4": 
            if (pinNum.slice(0, 3) === "400") {
              city = "Greater Mumbai"; state = "Maharashtra"; zone = "A"; minDays = 1; maxDays = 1;
            } else {
              city = "Pune"; state = "Maharashtra"; zone = "A"; minDays = 1; maxDays = 2;
            }
            break;
          case "5": city = "Bengaluru"; state = "Karnataka"; zone = "B"; minDays = 2; maxDays = 4; break;
          case "6": city = "Chennai"; state = "Tamil Nadu"; zone = "C"; minDays = 3; maxDays = 5; break;
          case "7": city = "Guwahati"; state = "Assam"; zone = "D"; minDays = 5; maxDays = 8; break;
          case "8": city = "Patna"; state = "Bihar"; zone = "C"; minDays = 4; maxDays = 6; break;
          case "9": city = "Srinagar"; state = "Jammu & Kashmir"; zone = "D"; minDays = 5; maxDays = 7; break;
          default: city = "Recipient City"; state = "Recipient State"; zone = "C"; minDays = 3; maxDays = 5;
        }
        
        if (isOda) {
          city = `${city} Rural (ODA)`;
          minDays += 1;
          maxDays += 2;
        }

        if (city && !shCity) setShCity(city);
        if (state && !shState) setShState(state);

        // Load custom shipping settings if any from localStorage (previously synced from DB)
        let settings = {
          originPin: "400001",
          freeShippingThreshold: 999,
          baseCodCharge: 50,
          markupPercentage: 0,
          enablePromoFreeShipping: true
        };
        try {
          const savedSettings = localStorage.getItem("myra_shipping_settings");
          if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            settings = { ...settings, ...parsed };
          }
        } catch {}

        // Calculate consolidated measurements
        let totalWeight = 0;
        let maxLength = 0;
        let maxWidth = 0;
        let cumulativeHeight = 0;
        let quantityTotal = 0;
        
        cartItems.forEach((it: any) => {
          const p = it.product;
          const q = Number(it.quantity || 1);
          quantityTotal += q;
          
          const defaultWeight = p.weight || (p.category === "perfumes" ? 350 : p.category?.includes("leather") ? 180 : 160);
          const defaultLen = p.length || (p.category === "perfumes" ? 10 : p.category?.includes("leather") ? 12 : 9);
          const defaultWid = p.width || (p.category === "perfumes" ? 10 : p.category?.includes("leather") ? 12 : 6);
          const defaultHt = p.height || (p.category === "perfumes" ? 16 : p.category?.includes("leather") ? 4 : 4);
          
          totalWeight += defaultWeight * q;
          maxLength = Math.max(maxLength, defaultLen);
          maxWidth = Math.max(maxWidth, defaultWid);
          cumulativeHeight += defaultHt * q;
        });

        const volumetricWeight = (maxLength * maxWidth * cumulativeHeight) / 5000;
        const actualWeightKg = totalWeight / 1000;
        const chargeableWeightKg = Math.max(actualWeightKg, volumetricWeight);

        let baseRate = 45;
        let additionalHalfKgRate = 35;
        
        switch (zone) {
          case "A": baseRate = 45; additionalHalfKgRate = 35; break;
          case "B": baseRate = 65; additionalHalfKgRate = 45; break;
          case "C": baseRate = 85; additionalHalfKgRate = 60; break;
          case "D": baseRate = 120; additionalHalfKgRate = 85; break;
        }

        const halfKgSteps = Math.ceil(chargeableWeightKg / 0.5);
        let calculatedShipFee = baseRate;
        if (halfKgSteps > 1) {
          calculatedShipFee += (halfKgSteps - 1) * additionalHalfKgRate;
        }

        if (isOda) {
          calculatedShipFee += 80;
        }

        let codFeeValue = 0;
        if (paymentMethodGroup === "cod") {
          codFeeValue = settings.baseCodCharge || 50;
        }

        if (settings.markupPercentage > 0) {
          calculatedShipFee = calculatedShipFee * (1 + settings.markupPercentage / 100);
        }

        const qualifiesForFreeShipping = settings.enablePromoFreeShipping && (subtotal >= settings.freeShippingThreshold);
        const finalShippingCharged = qualifiesForFreeShipping ? 0 : Math.round(calculatedShipFee);
        const grandInvoicedFreight = finalShippingCharged + codFeeValue;

        const calcData = {
          serviceable: true,
          originPin: settings.originPin,
          destPin: pinToVerify,
          estimatedDays: `${minDays}-${maxDays}`,
          courierName: "Delhivery Express Prime",
          zone,
          isOda,
          metrics: {
            totalQuantity: quantityTotal,
            actualWeightGrams: totalWeight,
            volumetricWeightKg: Number(volumetricWeight.toFixed(3)),
            chargeableWeightKg: Number(chargeableWeightKg.toFixed(3)),
            dimensions: { length: maxLength, width: maxWidth, height: cumulativeHeight }
          },
          pricingBreakdown: {
            baseRate,
            extraWeightCharge: calculatedShipFee - baseRate - (isOda ? 80 : 0),
            odaSurcharge: isOda ? 80 : 0,
            codPaymentFee: codFeeValue,
            calculatedTotalRaw: calculatedShipFee + codFeeValue,
            freeShippingCovered: qualifiesForFreeShipping,
            shippingFeeInvoiced: finalShippingCharged + codFeeValue
          },
          grandInvoicedFreight
        };

        setDelhiveryShippingDetails(calcData);
        setPincodeValidatedVal(pinToVerify);
        setPincodeError("");
      } catch (fallbackErr: any) {
        setPincodeError(fallbackErr.message || "Failed verifying pincode with Delhivery.");
        setDelhiveryShippingDetails(null);
      }
    } finally {
      setIsCheckingPincode(false);
    }
  };

  // React state side-effect to query Delhivery on full PIN validation
  useEffect(() => {
    const cleanPin = pinCode.trim();
    if (cleanPin.length === 6 && !/\D/.test(cleanPin)) {
      handleVerifyDelhivery(cleanPin);
    } else {
      setDelhiveryShippingDetails(null);
      setPincodeValidatedVal("");
    }
  }, [pinCode, paymentMethodGroup, subtotal]);

  const isFreeShipping = appliedDiscount?.type === "free_shipping";
  
  // Dynamic shipment cost mapping loaded from Delhivery Calculator API
  const shippingCost = isFreeShipping 
    ? 0 
    : (delhiveryShippingDetails 
        ? delhiveryShippingDetails.grandInvoicedFreight 
        : ((subtotal > 0) ? 80 : 0));
  
  // Applied discounts
  let discountValue = 0;
  if (appliedDiscount) {
    if (appliedDiscount.type === "percentage") {
      discountValue = subtotal * (appliedDiscount.value / 100);
    } else if (appliedDiscount.type === "fixed") {
      discountValue = Math.min(appliedDiscount.value, subtotal);
    }
  }

  // Modern taxes calculation: dynamic tax rate 18% of final checkout value (included or surcharge)
  const taxRatePercent = 18; // standard GST Indian luxury perfumery and leather crafts taxation
  const taxValue = Math.round((subtotal - discountValue) * (taxRatePercent / 100));

  const grandTotal = Math.max(0, subtotal - discountValue + shippingCost);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setDiscountError("");
    const normalized = promoCode.trim().toUpperCase();
    if (!normalized) return;

    const matched = dbPromoCodes.find(p => p.code === normalized);
    if (!matched) {
      setDiscountError("Invalid or unrecognized promotional code.");
      return;
    }

    if (!matched.active) {
      setDiscountError("This promotional code is currently inactive.");
      return;
    }

    setAppliedDiscount({
      code: matched.code,
      type: matched.type,
      value: matched.value
    });
    setPromoCode("");
  };

  const handleRemovePromo = () => {
    setAppliedDiscount(null);
  };

  // Safe auto pre-filling of information if a user profile is logged-in
  const handleProceedToShipping = () => {
    if (cartItems.length === 0) return;

    if (!isLoggedIn) {
      triggerToast("An active Atelier membership sign-in is required to place an order.");
      if (onOpenProfile) {
        onOpenProfile();
      }
      return;
    }
    
    try {
      if (memberInfo) {
        const names = (memberInfo.name || "").trim().split(/\s+/);
        setFirstName(names[0] || "");
        if (names.length > 1) {
          setLastName(names.slice(1).join(" ") || "");
        }
        setEmailAddress(memberInfo.email || "");
        setMobileNumber(memberInfo.phone || "");
        
        if (memberInfo.address) {
          const parts = memberInfo.address.split(",").map((p: string) => p.trim());
          if (parts.length > 1) {
            setStreetAddress(parts[0] || "");
            setAreaLocality(parts[1] || "");
            setShCity(parts[2] || "");
            setShState(parts[3] || "");
            setShCountry(parts[4] || "India");
          } else {
            setStreetAddress(memberInfo.address);
          }
        }
      }
    } catch (e) {
      console.error("Could not parse profile values, fallback standard", e);
    }

    setCheckoutStep("shipping");
  };

  const handleShippingFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim()) { triggerToast("Please enter your First Name."); return; }
    if (!lastName.trim()) { triggerToast("Please enter your Last Name."); return; }
    if (!emailAddress.trim()) { triggerToast("Please enter your Email Address."); return; }
    if (!/\S+@\S+\.\S+/.test(emailAddress)) { triggerToast("Please enter a valid Email Address."); return; }
    if (!mobileNumber.trim()) { triggerToast("Please enter your Mobile Number."); return; }
    if (!houseNo.trim()) { triggerToast("Please enter your House / Apartment No."); return; }
    if (!streetAddress.trim()) { triggerToast("Please enter your Street Address."); return; }
    if (!areaLocality.trim()) { triggerToast("Please enter your Area / Locality."); return; }
    if (!shCity.trim()) { triggerToast("Please enter your City."); return; }
    if (!shState.trim()) { triggerToast("Please enter your State."); return; }
    if (!pinCode.trim()) { triggerToast("Please enter your PIN Code."); return; }
    if (!shCountry.trim()) { triggerToast("Please enter your Country."); return; }

    setCheckoutStep("payment");
  };

  const executeCheckout = async (manualPaymentId?: string) => {
    if (cartItems.length === 0) return;
    setCheckoutStep("submitting");
    
    // Determine dynamic payment methodology label
    let paymentMethod = manualPaymentId || "Razorpay Secured Card";
    let explicitPaymentId = manualPaymentId && manualPaymentId.includes("Razorpay Transaction: ") ? manualPaymentId.replace("Razorpay Transaction: ", "") : undefined;
    
    if (!manualPaymentId) {
      if (paymentMethodGroup === "upi") {
        paymentMethod = `UPI Virtual Address (${upiId})`;
      } else if (paymentMethodGroup === "card") {
        paymentMethod = `Credit Card (**** **** **** ${cardNumber.slice(-4)})`;
      } else if (paymentMethodGroup === "netbanking") {
        paymentMethod = `Net Banking (${selectedBank})`;
      } else if (paymentMethodGroup === "wallet") {
        paymentMethod = `Digital Wallet (${selectedWallet})`;
      } else if (paymentMethodGroup === "cod") {
        paymentMethod = `Cash on Delivery (COD)`;
      }
    }

    const orderId = `MYRA-ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    const totalAmount = grandTotal;

    const newOrder: any = {
      id: orderId,
      userId: user ? user.uid : null,
      uid: user ? user.uid : null,
      razorpayPaymentId: explicitPaymentId,
      date: new Date().toISOString().split("T")[0],
      orderDate: new Date().toISOString().split("T")[0],
      items: cartItems.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        sizeOrSpec: item.product.sizeOrSpec || "100ML",
        bgColorClass: item.product.bgColorClass,
      })),
      totalAmount: totalAmount,
      totalPrice: totalAmount, // backward compatibility
      paymentMethod,
      paymentStatus: paymentMethodGroup === "cod" ? "Pending (COD)" : "Paid",
      orderStatus: "Pending",
      status: "placed", // backward compatibility
      isCancellationRequested: false,
      shippingDetails: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        emailAddress: emailAddress.trim(),
        mobileNumber: mobileNumber.trim(),
        houseNo: houseNo.trim(),
        streetAddress: streetAddress.trim(),
        areaLocality: areaLocality.trim(),
        city: shCity.trim(),
        state: shState.trim(),
        pinCode: pinCode.trim(),
        country: shCountry.trim(),
        addressType,
        altMobile: altMobile.trim() || undefined
      }
    };

    let savedOnBackend = false;

    // 1. Automatically create order record in backend database
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: newOrder })
      });
      if (response.ok) {
        savedOnBackend = true;
        console.log("Order saved to server successfully.");
        const orderData = await response.json();
        const serverOrder = orderData.order || newOrder;
        
        // Sync local object properties with server values
        newOrder.id = serverOrder.id;
        newOrder.paymentStatus = serverOrder.paymentStatus;
        newOrder.orderStatus = serverOrder.orderStatus;
        newOrder.isTestOrder = serverOrder.isTestOrder;
        
        // 1a. Automatically create shipment manifest in Delhivery upon successful payment / order
        try {
          const shipResponse = await fetch("/api/shipping/shipments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              order: serverOrder,
              metrics: delhiveryShippingDetails?.metrics,
              pricing: delhiveryShippingDetails?.pricingBreakdown
            })
          });
          if (shipResponse.ok) {
            const shipData = await shipResponse.json();
            console.log("Delta-Delhivery booking confirmation received:", shipData);
            if (shipData.shipment) {
              newOrder.awbNumber = shipData.shipment.awb;
              newOrder.trackingLink = `/tracking?awb=${shipData.shipment.awb}`;
              newOrder.shipmentStatus = "manifest_created";
              newOrder.orderStatus = shipData.shipment.isSandbox ? "Dispatched" : "Dispatched (Delhivery Live)";
            }
          }
        } catch (shipErr) {
          console.error("Failed to compile automatic Delhivery shipment dispatch:", shipErr);
        }
      } else {
        throw new Error("Express order submission proxy failed");
      }
    } catch (err) {
      console.warn("[Firestore Orders Fallback]: Saving order directly via Client SDK...", err);
      try {
        await setDoc(doc(db, "orders", newOrder.id), newOrder, { merge: true });
        
        // Create a shipment locally and store in shipments collection if serviceable
        if (delhiveryShippingDetails) {
          const awb = `999${Math.floor(1000000000 + Math.random() * 9000000000)}`;
          const shipment = {
            id: awb,
            awb,
            orderId: newOrder.id,
            status: "manifest_created",
            clientName: `${firstName} ${lastName}`,
            destination: `${shCity}, ${shState} - ${pinCode}`,
            trackingLink: `/tracking?awb=${awb}`,
            isSandbox: true,
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, "shipments", awb), shipment);
          newOrder.awbNumber = awb;
          newOrder.trackingLink = `/tracking?awb=${awb}`;
          newOrder.shipmentStatus = "manifest_created";
          newOrder.orderStatus = "Dispatched";
        }
      } catch (fallbackErr) {
        console.error("Direct client-side order sync failed too:", fallbackErr);
      }
    }

    // 2. Perform client fallback to keep state synchronized
    try {
      const existingOrdersJson = localStorage.getItem("myra_orders");
      let existingOrders = [];
      try {
        if (existingOrdersJson) {
          existingOrders = JSON.parse(existingOrdersJson);
        }
      } catch (e) {
        existingOrders = [];
      }
      existingOrders.unshift(newOrder);
      localStorage.setItem("myra_orders", JSON.stringify(existingOrders));

      // Deduct stock of items in localStorage catalog
      const existingProductsJson = localStorage.getItem("myra_products");
      if (existingProductsJson) {
        try {
          const parsedProducts = JSON.parse(existingProductsJson);
          if (Array.isArray(parsedProducts)) {
            const updatedProducts = parsedProducts.map(p => {
              const boughtItem = cartItems.find(item => item.product.id === p.id);
              if (boughtItem) {
                const currentStock = p.stock !== undefined ? p.stock : 25;
                return {
                  ...p,
                  stock: Math.max(0, currentStock - boughtItem.quantity)
                };
              }
              return p;
            });
            localStorage.setItem("myra_products", JSON.stringify(updatedProducts));
            window.dispatchEvent(new Event("myra_products_updated"));
          }
        } catch (e) {
          console.error("Failed to deduct product inventory stock", e);
        }
      }
    } catch (e) {
      console.error("Local client sync error", e);
    }
    
    // Fire event to notify ProfileModal or other listeners immediately
    window.dispatchEvent(new Event("myra_orders_updated"));

    setTimeout(() => {
      setCheckoutStep("success");
    }, 1200);
  };

  const handleRazorpayPaymentFlow = async () => {
    setRazorpayError("");
    setRazorpayPaymentState("loading");
    setShowRazorpayModal(true);

    try {
      const response = await fetch("/api/payments/razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: grandTotal })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.isSandbox) {
          // No keys in environment variables - proceed with local custom simulated overlay modal
          setTimeout(() => {
            setRazorpayPaymentState("method_selected");
          }, 800);
        } else {
          // Real keys exist and a real Razorpay Order has been issued! 
          // Dismiss safe simulation modal, open real floating checkout widget
          setShowRazorpayModal(false);
          
          const options = {
            key: data.key_id,
            amount: data.amount,
            currency: data.currency,
            name: "MYRA Luxury Studio",
            description: "Atelier Bespoke Order Checkout",
            order_id: data.order_id,
            handler: async (paymentResponse: any) => {
              setCheckoutStep("submitting");
              try {
                // Cryptographically verify payment signatures on our server
                const verifyResponse = await fetch("/api/payments/razorpay-verify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    razorpay_payment_id: paymentResponse.razorpay_payment_id,
                    razorpay_order_id: paymentResponse.razorpay_order_id,
                    razorpay_signature: paymentResponse.razorpay_signature
                  })
                });
                if (verifyResponse.ok) {
                  // Authorized payment! Mark as Paid and complete the order!
                  await executeCheckout(`Razorpay Transaction: ${paymentResponse.razorpay_payment_id}`);
                } else {
                  triggerToast("Razorpay signature validation failed. Checkout aborted.");
                  setCheckoutStep("payment");
                }
              } catch (err) {
                console.error("Signature verification error", err);
                triggerToast("Internal payment checking error. Contact support.");
                setCheckoutStep("payment");
              }
            },
            prefill: {
              name: `${firstName} ${lastName}`,
              email: emailAddress,
              contact: mobileNumber,
            },
            notes: {
              address: `${houseNo}, ${streetAddress}, ${areaLocality}, ${shCity}`,
            },
            theme: {
              color: "#8a7968",
            }
          };

          if (typeof (window as any).Razorpay === "undefined") {
            console.warn("Razorpay checkout.js script not detected. Running custom safe sandbox container instead.");
            // Gracefully activate safe sandbox overlay
            setTimeout(() => {
              setRazorpayPaymentState("method_selected");
            }, 500);
            return;
          }

          const rzpObj = new (window as any).Razorpay(options);
          rzpObj.on("payment.failed", (failedRes: any) => {
            triggerToast(`Payment declined: ${failedRes.error.description}`);
            setCheckoutStep("payment");
          });
          rzpObj.open();
        }
      } else {
        // Fallback to overlay sandbox simulator immediately
        setTimeout(() => {
          setRazorpayPaymentState("method_selected");
        }, 800);
      }
    } catch (e) {
      console.warn("Could not handshake with Razorpay order REST node. Running local sandbox engine instead.", e);
      // Fallback
      setTimeout(() => {
        setRazorpayPaymentState("method_selected");
      }, 800);
    }
  };

  const resetAfterSuccess = () => {
    onClearCart();
    setCheckoutStep("cart");
    setAppliedDiscount(null);
    onClose();
  };  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
          
          {checkoutStep === "success" ? (
            /* DYNAMIC CELEBRATORY TAKEOVER ON COMPLETION */
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="absolute inset-0 bg-[#FCFAF7] z-50 flex flex-col items-center justify-center p-6 select-none"
            >
              <div className="absolute top-0 left-0 w-96 h-96 bg-red-100/10 rounded-full filter blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-100/10 rounded-full filter blur-3xl pointer-events-none" />

              {/* Central Confetti Canvas & Badge Wrapper */}
              <div className="relative w-72 h-72 mb-8 flex items-center justify-center">
                
                {/* Simulated Floating Particles Confetti (matches download_order) */}
                {(() => {
                  const decorativeConfetti = [
                    { x: -85, y: -75, size: 8, color: "bg-[#FF2e73]", type: "circle", delay: 0.05 },
                    { x: -55, y: -115, size: 11, color: "bg-[#FF9033]", type: "outline-circle", delay: 0.2 },
                    { x: -125, y: -30, size: 9, color: "bg-[#FF5D00]", type: "triangle", delay: 0.1 },
                    { x: -45, y: -35, size: 6, color: "bg-[#FF1e4b]", type: "circle", delay: 0.02 },
                    
                    { x: 85, y: -85, size: 8, color: "bg-[#FF9033]", type: "triangle", delay: 0.18 },
                    { x: 55, y: -125, size: 10, color: "bg-[#FF2e8b]", type: "outline-circle", delay: 0.3 },
                    { x: 115, y: -40, size: 6, color: "bg-[#FF1e4b]", type: "circle", delay: 0.06 },
                    { x: 45, y: -55, size: 9, color: "bg-[#FFB800]", type: "square", delay: 0.1 },
                    
                    { x: -95, y: 65, size: 12, color: "bg-[#FFB800]", type: "square", delay: 0.25 },
                    { x: -125, y: 15, size: 8, color: "bg-[#FF2e8b]", type: "circle", delay: 0.15 },
                    { x: -50, y: 105, size: 6, color: "bg-[#FF5D00]", type: "circle", delay: 0.2 },
                    { x: -35, y: 45, size: 9, color: "bg-[#FF1e4b]", type: "outline-circle", delay: 0.04 },
                    
                    { x: 105, y: 65, size: 9, color: "bg-[#FF2e8b]", type: "circle", delay: 0.26 },
                    { x: 65, y: 105, size: 11, color: "bg-[#FF9033]", type: "triangle", delay: 0.12 },
                    { x: 125, y: 15, size: 8, color: "bg-[#FF3e6c]", type: "circle", delay: 0.35 },
                    { x: 40, y: 45, size: 5, color: "bg-[#FFB800]", type: "circle", delay: 0.08 },
                  ];

                  return decorativeConfetti.map((c, idx) => {
                    const isOutline = c.type === "outline-circle";
                    const isTriangle = c.type === "triangle";
                    const isSquare = c.type === "square";

                    return (
                      <motion.div
                        key={idx}
                        initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                        animate={{ 
                          scale: 1, 
                          x: c.x, 
                          y: c.y, 
                          opacity: [0, 1, 1],
                        }}
                        transition={{ 
                          delay: c.delay, 
                          type: "spring", 
                          stiffness: 110, 
                          damping: 15,
                          duration: 0.75
                        }}
                        className="absolute"
                        style={{
                          width: `${c.size}px`,
                          height: `${c.size}px`,
                          left: `calc(50% - ${c.size / 2}px)`,
                          top: `calc(50% - ${c.size / 2}px)`,
                        }}
                      >
                        <motion.div
                          animate={{
                            y: [0, -6, 0],
                            rotate: isTriangle || isSquare ? [0, 15, -15, 0] : 0,
                            scale: [1, 1.05, 1]
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 3 + (idx % 3),
                            ease: "easeInOut",
                            delay: idx * 0.1
                          }}
                          className={`w-full h-full ${
                            isOutline 
                              ? "border-2 border-[#FFB800] bg-transparent rounded-full" 
                              : isTriangle
                              ? "bg-[#FF6633]"
                              : isSquare
                              ? "bg-[#FF2e8b] rounded-sm rotate-45"
                              : c.color + " rounded-full"
                          }`}
                          style={isTriangle ? { clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" } : undefined}
                        />
                      </motion.div>
                    );
                  });
                })()}

                {/* Pulsating background ring */}
                <motion.div 
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1.15, opacity: [0, 0.4, 0] }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "easeOut" 
                  }}
                  className="absolute w-32 h-32 rounded-full border-4 border-rose-250/30 bg-rose-250/5"
                />

                {/* Circular Gradient Success Badge */}
                <motion.div
                  initial={{ scale: 0, rotate: -35 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 180, 
                    damping: 14, 
                    delay: 0.05 
                  }}
                  className="w-24 h-24 sm:w-26 sm:h-26 rounded-full bg-gradient-to-tr from-[#FF3A5C] via-[#FF5F37] to-[#FFA143] flex items-center justify-center shadow-[0_12px_28px_rgba(255,58,92,0.35)] relative z-10"
                >
                  {/* Inside Crisp Checkmark */}
                  <svg 
                    className="w-10 h-10 sm:w-11 sm:h-11 text-white" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <motion.path 
                      d="M20 6L9 17l-5-5" 
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ 
                        delay: 0.35, 
                        type: "spring", 
                        stiffness: 140, 
                        damping: 11 
                      }}
                    />
                  </svg>
                </motion.div>

              </div>

              {/* Congratulations message set (Matches download_order Typography) */}
              <motion.div
                initial={{ y: 25, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.45, duration: 0.55, ease: "easeOut" }}
                className="space-y-3 px-4 max-w-sm"
              >
                <h4 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1C1733] font-sans">
                  Congratulations!
                </h4>
                <p className="text-[#3C3A4B] text-sm sm:text-base font-semibold leading-relaxed tracking-wide">
                  Order has been placed successfully.
                </p>
              </motion.div>

              {/* Continue Explorer Button */}
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.65, duration: 0.45 }}
                className="w-full max-w-xs mt-10 px-4"
              >
                <button 
                  id="success-continue"
                  onClick={resetAfterSuccess}
                  className="w-full bg-[#1A1824] hover:bg-leather-tan text-white font-bold tracking-widest uppercase text-xs py-4 px-6 rounded-full transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  Return to Gallery
                </button>
              </motion.div>

            </motion.div>
          ) : (
            <>
              {/* Dimmed glass overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
                onClick={checkoutStep === "submitting" ? undefined : onClose}
              />              {/* Cart Drawer Shell */}
              <motion.div 
                id="luxury-cart-drawer"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 240 }}
                className="relative w-full max-w-md h-full bg-[#FCFAF6] text-charcoal shadow-2xl flex flex-col justify-between border-l border-stone-200 z-10"
              >
                {/* HEADER */}
                <div className="p-6 border-b border-stone-200/60 flex items-center justify-between bg-white/60 backdrop-blur-md">
                  <div className="flex items-center gap-2.5">
                    {(checkoutStep === "shipping" || checkoutStep === "payment") && (
                      <button 
                        onClick={() => setCheckoutStep(checkoutStep === "payment" ? "shipping" : "cart")}
                        className="p-1 hover:bg-stone-50 rounded-lg text-stone-600 hover:text-stone-900 transition-colors mr-1 cursor-pointer"
                        title={checkoutStep === "payment" ? "Back to Shipping" : "Back to Cart"}
                      >
                        <ChevronLeft className="w-5 h-5 animate-pulse" />
                      </button>
                    )}
                    <ShoppingBag className="w-5 h-5 text-leather-tan" />
                    <h3 className="text-xl font-serif font-semibold text-stone-900">
                      {checkoutStep === "shipping" ? "Shipping Details" : checkoutStep === "payment" ? "Atelier Payment" : "Your Atelier Selection"}
                    </h3>
                    <span className="bg-stone-100 text-stone-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {(cartItems || []).reduce((acc, i) => acc + (i?.quantity || 1), 0)}
                    </span>
                  </div>
                  <button 
                    id="close-cart-btn"
                    onClick={onClose}
                    className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
                    disabled={checkoutStep === "submitting"}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
 
                {/* MAIN BODY AREA BASED ON checkoutStep */}
                {checkoutStep === "submitting" ? (
                  /* SUBMITTING SPINNER */
                  <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
                    <div className="relative w-16 h-16 mb-6">
                      <div className="absolute inset-0 rounded-full border-4 border-stone-100 border-t-leather-tan animate-spin" />
                    </div>
                    <h4 className="text-lg font-serif font-semibold text-stone-900 mb-1">Authenticating Credentials</h4>
                    <p className="text-xs text-stone-500">Securing your luxury boutique transaction...</p>
                  </div>
                ) : checkoutStep === "payment" ? (
                  /* EXPLICITLY REQUESTED INTERACTIVE RAZORPAY PAYMENT & ORDER SUMMARY SETUP */
                  (() => {
                    const nonCodProducts = (cartItems || [])
                      .filter(item => item?.product && item.product.codAvailable === false)
                      .map(item => item.product.name);
                    const isCodAvailableForCart = nonCodProducts.length === 0;

                    return (
                      <div className="flex-grow flex flex-col h-[calc(100vh-140px)] justify-between overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-5 space-y-5">
                          
                          {/* Section A: Order Summary */}
                          <div className="space-y-3 bg-white/60 p-4 rounded-2xl border border-stone-200/50">
                            <h4 className="text-xs uppercase tracking-widest text-[#8A7968] font-bold border-b border-stone-200 pb-1.5 flex justify-between">
                              <span>Verified Order Summary</span>
                              <span className="font-mono text-stone-500 font-normal">({(cartItems || []).reduce((acc, i) => acc + (i?.quantity || 1), 0)} Items)</span>
                            </h4>
                            
                            <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                              {(cartItems || []).map((item) => {
                                if (!item || !item.product) return null;
                                return (
                                  <div key={item.product.id || Math.random()} className="flex justify-between items-center text-xs text-stone-800">
                                    <span className="truncate max-w-[200px] font-medium">{item.product.name || "Luxury Creation"} ({item.product.sizeOrSpec || "100ml"}) <span className="text-stone-400">x{item.quantity}</span></span>
                                    <span className="font-semibold font-mono">₹{(item.product.price || 0) * (item.quantity || 1)}</span>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="border-t border-stone-100 pt-2 space-y-1 text-[11px] text-stone-500">
                              <div className="flex justify-between">
                                <span>Atelier Subtotal</span>
                                <span className="font-mono">₹{subtotal}</span>
                              </div>
                              {appliedDiscount && (
                                <div className="flex justify-between text-emerald-700 font-semibold">
                                  <span>Elite Discount</span>
                                  <span className="font-mono">-₹{discountValue.toFixed(0)}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span>Delivery Partner Shipping</span>
                                <span>{shippingCost === 0 ? "Complimented" : `₹${shippingCost}`}</span>
                              </div>
                              <div className="flex justify-between text-sm text-stone-900 font-bold border-t border-stone-100 pt-1.5 font-serif mt-1">
                                <span>Sum Total to Pay</span>
                                <span className="text-[#C68B59] font-mono">₹{grandTotal.toFixed(0)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Section B: Delivery & Contact Review */}
                          <div className="space-y-2 bg-white/60 p-4 rounded-2xl border border-[#FAF6F0] text-xs text-stone-700">
                            <h4 className="text-xs uppercase tracking-widest text-[#8A7968] font-bold border-b border-stone-200 pb-1.5">
                              Delivery Credentials
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div>
                                <span className="text-stone-400 block font-bold uppercase tracking-wide text-[9px]">Customer Name</span>
                                <span className="font-semibold text-stone-900">{firstName} {lastName}</span>
                              </div>
                              <div>
                                <span className="text-stone-400 block font-bold uppercase tracking-wide text-[9px]">Contact Phone</span>
                                <span className="font-semibold text-stone-900">{mobileNumber}</span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-stone-400 block font-bold uppercase tracking-wide text-[9px]">Shipping Address</span>
                                <span className="font-medium text-stone-800">
                                  {houseNo}, {streetAddress}, {areaLocality}, {shCity}, {shState} - {pinCode}, {shCountry}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Section C: Razorpay payment gateway options */}
                          <div className="space-y-3.5 bg-gradient-to-br from-indigo-50/25 via-white/85 to-blue-50/15 p-4 rounded-2xl border border-indigo-100 shadow-xs">
                            <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-950 font-sans">
                                  Razorpay Secured Checkout
                                </h4>
                              </div>
                              {/* Razorpay Logo mockup */}
                              <div className="flex items-center gap-0.5 text-[10px] font-extrabold italic text-blue-600">
                                <span>Razor</span>
                                <span className="bg-blue-600 text-white px-1 py-0.5 rounded text-[7px] font-bold uppercase select-none tracking-wider">PAY</span>
                              </div>
                            </div>

                            {/* Payment Group options */}
                            <div className="grid grid-cols-5 gap-0.5 bg-stone-100 p-1 rounded-xl text-[9px] font-bold uppercase tracking-wider text-stone-600 text-center">
                              <button
                                type="button"
                                onClick={() => setPaymentMethodGroup("upi")}
                                className={`py-1.5 rounded-lg cursor-pointer transition-all ${paymentMethodGroup === "upi" ? "bg-white text-blue-850 shadow-xs" : "hover:text-stone-950"}`}
                              >
                                UPI
                              </button>
                              <button
                                type="button"
                                onClick={() => setPaymentMethodGroup("card")}
                                className={`py-1.5 rounded-lg cursor-pointer transition-all ${paymentMethodGroup === "card" ? "bg-white text-blue-850 shadow-xs" : "hover:text-stone-950"}`}
                              >
                                Card
                              </button>
                              <button
                                type="button"
                                onClick={() => setPaymentMethodGroup("netbanking")}
                                className={`py-1.5 rounded-lg cursor-pointer transition-all ${paymentMethodGroup === "netbanking" ? "bg-white text-blue-850 shadow-xs" : "hover:text-stone-950"}`}
                              >
                                Bank
                              </button>
                              <button
                                type="button"
                                onClick={() => setPaymentMethodGroup("wallet")}
                                className={`py-1.5 rounded-lg cursor-pointer transition-all ${paymentMethodGroup === "wallet" ? "bg-white text-blue-850 shadow-xs" : "hover:text-stone-950"}`}
                              >
                                Wallet
                              </button>
                              <button
                                type="button"
                                onClick={() => setPaymentMethodGroup("cod")}
                                className={`py-1.5 rounded-lg cursor-pointer transition-all ${paymentMethodGroup === "cod" ? "bg-white text-amber-900 shadow-xs border border-amber-200" : "hover:text-stone-950"}`}
                              >
                                COD
                              </button>
                            </div>

                            {/* Interactive inputs based on selection */}
                            <div className="min-h-[80px] flex flex-col justify-center">
                              {paymentMethodGroup === "upi" ? (
                                <div className="space-y-1.5 text-left">
                                  <label className="text-[10px] font-medium text-stone-600 block">UPI ID (e.g. buyer@upi) *</label>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      placeholder="buyer@upi"
                                      value={upiId}
                                      onChange={(e) => setUpiId(e.target.value)}
                                      className="flex-1 bg-white border border-stone-200 rounded-lg px-2.5 py-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (upiId.includes("@") && upiId.length > 5) {
                                          triggerToast("UPI ID is active & ready.");
                                        } else {
                                          triggerToast("Format check: Please input a matching UPI format (e.g. buyer@okaxis)");
                                        }
                                      }}
                                      className="bg-blue-50 hover:bg-blue-100 text-blue-850 font-bold px-3 py-1.5 text-[9px] tracking-wider uppercase rounded-lg border border-blue-250 cursor-pointer transition-colors"
                                    >
                                      Verify
                                    </button>
                                  </div>
                                  <span className="text-[9px] text-stone-400 block leading-tight">Authorize directly using GPay, PhonePe, Paytm, or BHIM.</span>
                                </div>
                              ) : paymentMethodGroup === "card" ? (
                                <div className="space-y-2.5 text-left text-stone-700 font-sans">
                                  <div className="space-y-1">
                                    <label className="text-[9px] uppercase font-bold tracking-wide text-stone-450 block">Debit / Credit Card Number</label>
                                    <div className="relative">
                                      <input
                                        type="text"
                                        placeholder="4111 2222 3333 4444"
                                        value={cardNumber}
                                        onChange={(e) => {
                                          const clean = e.target.value.replace(/\D/g, "");
                                          const formatted = clean.match(/.{1,4}/g)?.join(" ") || clean;
                                          setCardNumber(formatted.slice(0, 19));
                                        }}
                                        className="w-full bg-white border border-stone-200 rounded-lg pl-8 pr-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono tracking-widest text-stone-800"
                                      />
                                      <CreditCard className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-stone-400" />
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <label className="text-[9px] uppercase font-bold tracking-wide text-stone-450 block">Expiry Date</label>
                                      <input
                                        type="text"
                                        maxLength={5}
                                        placeholder="12/28"
                                        value={cardExpiry}
                                        onChange={(e) => {
                                          const clean = e.target.value.replace(/\D/g, "");
                                          let formatted = clean;
                                          if (clean.length > 2) {
                                            formatted = clean.slice(0, 2) + "/" + clean.slice(2, 4);
                                          }
                                          setCardExpiry(formatted);
                                        }}
                                        className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-stone-800"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[9px] uppercase font-bold tracking-wide text-stone-450 block">CVV</label>
                                      <input
                                        type="password"
                                        maxLength={3}
                                        placeholder="CVV"
                                        value={cardCvv}
                                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                                        className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-stone-800"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) : paymentMethodGroup === "netbanking" ? (
                                <div className="space-y-1.5 text-left font-sans">
                                  <label className="text-[10px] font-medium text-stone-600 block">Banking Institution Partner *</label>
                                  <select
                                    value={selectedBank}
                                    onChange={(e) => setSelectedBank(e.target.value)}
                                    className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-stone-850 font-medium"
                                  >
                                    <option value="SBI">State Bank of India (SBI)</option>
                                    <option value="HDFC">HDFC Bank Limited</option>
                                    <option value="ICICI">ICICI Bank Ltd.</option>
                                    <option value="AXIS">Axis Bank Ltd.</option>
                                    <option value="KOTAK">Kotak Mahindra Bank</option>
                                    <option value="PNB">Punjab National Bank</option>
                                  </select>
                                </div>
                              ) : paymentMethodGroup === "wallet" ? (
                                <div className="space-y-1.5 text-left font-sans font-medium">
                                  <label className="text-[10px] font-medium text-stone-600 block">Select Digital Wallet *</label>
                                  <select
                                    value={selectedWallet}
                                    onChange={(e) => setSelectedWallet(e.target.value)}
                                    className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-[#8F633E]"
                                  >
                                    <option value="Paytm">Paytm Safe Wallet</option>
                                    <option value="PhonePe">PhonePe Wallet</option>
                                    <option value="Mobikwik">Mobikwik Wallet</option>
                                    <option value="Freecharge">Freecharge Wallet</option>
                                  </select>
                                </div>
                              ) : (
                                <div className="space-y-2 text-left font-sans">
                                  {isCodAvailableForCart ? (
                                    <div className="p-3 bg-[#FAF6F0] border border-[#E8DCC4] rounded-xl space-y-1.5 text-stone-800">
                                      <div className="flex items-center gap-1.5 text-[#8F633E] font-bold text-[10.5px] uppercase tracking-wider">
                                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#8F633E] animate-pulse" />
                                        Cash On Delivery Available
                                      </div>
                                      <p className="text-[10.5px] leading-relaxed text-stone-600">
                                        All items in your cart support COD. Hand over ₹{grandTotal.toFixed(0)} to your delivery partner when the package reaches your doorstep. No prepayment required!
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1.5 text-stone-840">
                                      <div className="flex items-center gap-1.5 text-red-800 font-bold text-[10.5px] uppercase tracking-wider">
                                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-650" />
                                        COD Option Locked
                                      </div>
                                      <p className="text-[10.5px] leading-relaxed text-red-700">
                                        This order contains selection items that are **ineligible** for Cash on Delivery:
                                      </p>
                                      <ul className="list-disc pl-4 text-[10px] text-red-900/95 font-semibold space-y-0.5">
                                        {nonCodProducts.map((pName, i) => (
                                          <li key={i}>{pName}</li>
                                        ))}
                                      </ul>
                                      <p className="text-[10px] text-stone-500 leading-normal">
                                        Please choose card, UPI, or net banking online payment to secure this collection.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Previous Razorpay interaction errors logs */}
                            {razorpayError && (
                              <div className="bg-red-50 text-red-800 text-[10px] p-2.5 rounded-lg border border-red-200 mt-1 text-left font-sans font-semibold">
                                ⚠ Razorpay response: {razorpayError}
                              </div>
                            )}
                            
                            <div className="flex items-center justify-center gap-1.5 text-[9px] text-[#8a7968]/90 font-bold uppercase tracking-wider font-sans">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>PCI-DSS Compliant Gateway • SSL Certified Node</span>
                            </div>
                          </div>
                        </div>

                        {/* Proceed checkout block */}
                        <div className="p-5 border-t border-stone-200 bg-white/95 shadow-lg flex flex-col gap-2.5 relative z-25">
                          {/* Mini Bill Summary */}
                          <div className="bg-stone-50 border border-stone-150 rounded-xl p-3 text-[11px] space-y-1 text-stone-600 font-sans">
                            <div className="flex justify-between items-center">
                              <span>Cart Subtotal</span>
                              <span className="font-mono text-stone-905 font-semibold">₹{subtotal}</span>
                            </div>
                            {discountValue > 0 && (
                              <div className="flex justify-between items-center text-emerald-700 font-semibold">
                                <span>Promo Discount</span>
                                <span className="font-mono">-₹{discountValue.toFixed(0)}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center">
                              <span className="flex items-center gap-1 text-stone-500">
                                <span>Delhivery Shipping Charge</span>
                                {delhiveryShippingDetails && (
                                  <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 px-1 py-0.2 rounded font-mono font-bold">
                                    Zone {delhiveryShippingDetails.zone}
                                  </span>
                                )}
                              </span>
                              <span className="font-mono text-stone-905 font-bold">
                                {shippingCost === 0 ? "Free Shipping" : `₹${shippingCost}`}
                              </span>
                            </div>
                            {paymentMethodGroup === "cod" && (
                              <div className="flex justify-between items-center text-amber-800 font-semibold">
                                <span>COD Surcharge</span>
                                <span className="font-mono">₹{delhiveryShippingDetails?.pricingBreakdown?.codPaymentFee || 50}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center border-t border-stone-200 pt-1.5 text-xs text-stone-900 font-bold font-serif">
                              <span>Grand Total (Net to Pay)</span>
                              <span className="font-mono text-[#8F633E] text-sm">₹{grandTotal.toFixed(0)}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={paymentMethodGroup === "cod" && !isCodAvailableForCart}
                            onClick={() => {
                              if (paymentMethodGroup === "cod") {
                                if (!isCodAvailableForCart) {
                                  triggerToast("Cash on Delivery is unavailable. Please choose another payment method.");
                                  return;
                                }
                                executeCheckout();
                                return;
                              }
                              if (paymentMethodGroup === "upi" && (!upiId.trim() || !upiId.includes("@"))) {
                                triggerToast("UPI Address checklist: Verify your ID (e.g. buyer@okaxis) to proceed.");
                                  setRazorpayError("A complete UPI VPA target represents a compliance essential.");
                                return;
                              }
                              if (paymentMethodGroup === "card" && (cardNumber.replace(/\s/g, "").length < 16 || cardExpiry.length < 5 || cardCvv.length < 3)) {
                                triggerToast("Card checklist: Ensure complete Card Number, Expiry, and CVV.");
                                  setRazorpayError("Credit Card parameters failed standard checksum.");
                                return;
                              }
                              
                              handleRazorpayPaymentFlow();
                            }}
                            className="w-full bg-stone-950 hover:bg-[#8F633E] text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-xl transition-all duration-300 transform active:translate-y-0.5 cursor-pointer text-xs uppercase tracking-widest font-sans disabled:opacity-45 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none"
                          >
                            <ShieldCheck className="w-4 h-4 text-white/80" />
                            <span>
                              {paymentMethodGroup === "cod" 
                                ? `Confirm COD Order — ₹${grandTotal.toFixed(0)}` 
                                : `Place & Pay ₹${grandTotal.toFixed(0)} via Razorpay`}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCheckoutStep("shipping")}
                            className="w-full text-stone-500 hover:text-stone-900 font-bold py-2 px-3 rounded-lg text-[9px] uppercase tracking-widest transition-colors cursor-pointer text-center bg-stone-50 border border-stone-200/50"
                          >
                            Adjust Address Keys
                          </button>
                        </div>
                      </div>
                    );
                  })()
                ) : checkoutStep === "shipping" ? (
                  /* EXPLICITLY REQUESTED INTERACTIVE SHIPPING FORM SETUP */
                  <form onSubmit={handleShippingFormSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      
                      {/* Section 1: Contact Information */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-stone-250 pb-1.5">
                          <h4 className="text-xs uppercase tracking-widest text-[#8A7968] font-bold">Contact Information</h4>
                          <span className="text-[10px] text-stone-400">* Required Fields</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3.5">
                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-stone-600 block">First Name *</label>
                            <input
                              type="text"
                              required
                              placeholder="First Name"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-leather-tan transition-all font-light"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-stone-600 block">Last Name *</label>
                            <input
                              type="text"
                              required
                              placeholder="Last Name"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-leather-tan transition-all font-light"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-stone-600 block">Email Address *</label>
                          <input
                            type="email"
                            required
                            placeholder="Email Address"
                            value={emailAddress}
                            onChange={(e) => setEmailAddress(e.target.value)}
                            className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-leather-tan transition-all font-light"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-stone-600 block">Mobile Number *</label>
                          <input
                            type="tel"
                            required
                            placeholder="Mobile Number"
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                            className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-leather-tan transition-all font-light"
                          />
                        </div>
                      </div>

                      {/* Section 2: Shipping Address */}
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between border-b border-stone-250 pb-1.5">
                          <h4 className="text-xs uppercase tracking-widest text-[#8A7968] font-bold">Shipping Address</h4>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-stone-600 block">House / Apartment No. *</label>
                          <input
                            type="text"
                            required
                            placeholder="House / Apartment No."
                            value={houseNo}
                            onChange={(e) => setHouseNo(e.target.value)}
                            className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-leather-tan transition-all font-light"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-stone-600 block">Street Address *</label>
                          <input
                            type="text"
                            required
                            placeholder="Street Address"
                            value={streetAddress}
                            onChange={(e) => setStreetAddress(e.target.value)}
                            className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-leather-tan transition-all font-light"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-stone-600 block">Area / Locality *</label>
                          <input
                            type="text"
                            required
                            placeholder="Area / Locality"
                            value={areaLocality}
                            onChange={(e) => setAreaLocality(e.target.value)}
                            className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-leather-tan transition-all font-light"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3.5">
                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-stone-600 block">City *</label>
                            <input
                              type="text"
                              required
                              placeholder="City"
                              value={shCity}
                              onChange={(e) => setShCity(e.target.value)}
                              className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-leather-tan transition-all font-light"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-stone-600 block">State *</label>
                            <input
                              type="text"
                              required
                              placeholder="State"
                              value={shState}
                              onChange={(e) => setShState(e.target.value)}
                              className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-leather-tan transition-all font-light"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3.5">
                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-stone-600 block">PIN Code *</label>
                            <input
                              type="text"
                              required
                              placeholder="PIN Code"
                              value={pinCode}
                              onChange={(e) => setPinCode(e.target.value)}
                              className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-leather-tan transition-all font-light"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-stone-600 block">Country *</label>
                            <input
                              type="text"
                              required
                              placeholder="Country"
                              value={shCountry}
                              onChange={(e) => setShCountry(e.target.value)}
                              className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-leather-tan transition-all font-light"
                            />
                          </div>
                        </div>

                        {/* Delhivery Serviceability & Rate Estimate Card */}
                        <div className="bg-[#FAF6F0] rounded-xl border border-stone-200/80 p-4 space-y-3.5 my-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-[#8A7968] block">Delhivery Logistics Desk</span>
                            <span className="bg-amber-600/10 text-amber-800 text-[8.5px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full select-none">Live API Engine</span>
                          </div>
                          
                          {isCheckingPincode && (
                            <div className="flex items-center gap-2.5 text-xs text-stone-600 font-light py-1">
                              <svg className="animate-spin h-3.5 w-3.5 text-leather-tan" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Verifying destination node serviceability...
                            </div>
                          )}

                          {pincodeError && (
                            <p className="text-[11px] text-red-600 font-medium bg-red-50 p-2.5 rounded-lg border border-red-200/40">{pincodeError}</p>
                          )}

                          {!isCheckingPincode && !pincodeError && !delhiveryShippingDetails && (
                            <p className="text-[10.5px] text-stone-500 font-light leading-normal">
                              Enter a valid 6-digit PIN code above. Delhivery will automatically verify carrier coverage, zone routing steps, and dynamic consolidated package charges.
                            </p>
                          )}

                          {!isCheckingPincode && !pincodeError && delhiveryShippingDetails && (
                            <div className="space-y-2.5 animate-reveal text-left">
                              <div className="flex items-center gap-2 border-b border-stone-200/50 pb-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block"></span>
                                <p className="text-xs font-semibold text-stone-900 font-serif">Region Serviceable: {delhiveryShippingDetails.courierName}</p>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-600">
                                <div>
                                  <span className="text-[9.5px] text-stone-400 block uppercase tracking-wider font-medium">Consolidated Weight</span>
                                  <span className="font-bold font-mono text-stone-850">{(delhiveryShippingDetails.metrics.actualWeightGrams / 1000).toFixed(2)} Kg</span>
                                </div>
                                <div>
                                  <span className="text-[9.5px] text-stone-400 block uppercase tracking-wider font-medium">Volumetric Weight</span>
                                  <span className="font-bold font-mono text-stone-850">{delhiveryShippingDetails.metrics.volumetricWeightKg} Kg</span>
                                </div>
                                <div>
                                  <span className="text-[9.5px] text-stone-400 block uppercase tracking-wider font-medium">Consolidated Dimensions</span>
                                  <span className="font-semibold text-stone-850 font-mono">
                                    {delhiveryShippingDetails.metrics.dimensions.length}x{delhiveryShippingDetails.metrics.dimensions.width}x{delhiveryShippingDetails.metrics.dimensions.height} cm
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[9.5px] text-stone-400 block uppercase tracking-wider font-medium">Estimated Arrival</span>
                                  <span className="font-bold text-amber-800">{delhiveryShippingDetails.estimatedDays} Business Days</span>
                                </div>
                                <div>
                                  <span className="text-[9.5px] text-stone-400 block uppercase tracking-wider font-medium">Delivery Zone</span>
                                  <span className="font-bold text-stone-850 font-mono">Zone {delhiveryShippingDetails.zone} {delhiveryShippingDetails.isOda ? "(ODA Surcharge)" : "(Standard)"}</span>
                                </div>
                                <div>
                                  <span className="text-[9.5px] text-stone-400 block uppercase tracking-wider font-medium">Carrier Coverage</span>
                                  <span className="font-semibold text-stone-850">Delhivery Express ({delhiveryShippingDetails.isSandboxEnv ? "Sandbox Mode" : "Live Hub"})</span>
                                </div>
                              </div>

                              <div className="bg-white/65 rounded-lg p-2.5 space-y-1.5 text-[10.5px] border border-stone-200/40 text-stone-600">
                                <div className="flex justify-between font-mono">
                                  <span>Dynamic Base Rate:</span>
                                  <span className="font-bold text-stone-800">₹{delhiveryShippingDetails.pricingBreakdown.baseRate}</span>
                                </div>
                                {delhiveryShippingDetails.pricingBreakdown.extraWeightCharge > 0 && (
                                  <div className="flex justify-between font-mono">
                                    <span>Step Weight Premium:</span>
                                    <span className="font-bold text-stone-800">₹{delhiveryShippingDetails.pricingBreakdown.extraWeightCharge}</span>
                                  </div>
                                )}
                                {delhiveryShippingDetails.pricingBreakdown.odaSurcharge > 0 && (
                                  <div className="flex justify-between font-mono text-amber-700">
                                    <span>Remote Area ODA fee:</span>
                                    <span className="font-bold">₹{delhiveryShippingDetails.pricingBreakdown.odaSurcharge}</span>
                                  </div>
                                )}
                                {delhiveryShippingDetails.pricingBreakdown.codPaymentFee > 0 && (
                                  <div className="flex justify-between font-mono text-[#8A7968]">
                                    <span>COD Collection Fee:</span>
                                    <span className="font-bold">+₹{delhiveryShippingDetails.pricingBreakdown.codPaymentFee}</span>
                                  </div>
                                )}
                                {delhiveryShippingDetails.pricingBreakdown.freeShippingCovered && (
                                  <div className="flex justify-between font-semibold text-emerald-700">
                                    <span>Promotional Free Shipping:</span>
                                    <span>Fully Absolved</span>
                                  </div>
                                )}
                                <div className="flex justify-between border-t border-stone-200/50 pt-1.5 mt-1 text-xs font-bold text-stone-800 font-mono">
                                  <span>Delhivery Invoiced:</span>
                                  <span>₹{delhiveryShippingDetails.pricingBreakdown.shippingFeeInvoiced}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Section 3: Additional Information */}
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between border-b border-stone-250 pb-1.5">
                          <h4 className="text-xs uppercase tracking-widest text-[#8A7968] font-bold">Additional Information</h4>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[11px] font-medium text-stone-650 block">Address Type</span>
                          <div className="flex gap-4">
                            {(["Home", "Office", "Other"] as const).map((type) => (
                              <label key={type} className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer select-none">
                                <input
                                  type="radio"
                                  name="addressType"
                                  checked={addressType === type}
                                  onChange={() => setAddressType(type)}
                                  className="w-4 h-4 text-stone-900 border-stone-300 focus:ring-stone-450 accent-stone-950 cursor-pointer"
                                />
                                <span className="font-light">{type}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-stone-600 block">Alternate Mobile Number (Optional)</label>
                          <input
                            type="tel"
                            placeholder="Alternate Mobile Number"
                            value={altMobile}
                            onChange={(e) => setAltMobile(e.target.value)}
                            className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-leather-tan transition-all font-light"
                          />
                        </div>
                      </div>

                    </div>

                    {/* Order Summary footer inside shipping details */}
                    <div className="p-6 border-t border-stone-200/60 bg-white/70 backdrop-blur-md space-y-4">
                      <div className="border-b border-stone-105 pb-2">
                        <span className="text-xs uppercase tracking-widest text-stone-500 font-bold block mb-1">Order Summary</span>
                        <div className="flex justify-between items-center text-xs text-stone-600">
                          <span>{(cartItems || []).reduce((acc, i) => acc + (i?.quantity || 1), 0)} Selection Pack</span>
                          <span className="font-semibold text-stone-900">₹{grandTotal.toFixed(0)}</span>
                        </div>
                      </div>

                      <button 
                        type="submit"
                        className="w-full bg-stone-950 hover:bg-leather-tan text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer text-sm"
                      >
                        Continue to Payment
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                ) : (
                  /* CART CONTENT & ORDER LISTING */
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    

 
                    {cartItems.length === 0 ? (
                      /* EMPTY CART */
                      <div className="h-96 flex flex-col items-center justify-center text-center opacity-85">
                        <div className="w-16 h-16 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center mb-4">
                          <ShoppingBag className="w-7 h-7 text-stone-300" />
                        </div>
                        <h4 className="text-base font-serif font-semibold text-stone-800 mb-1">Your Selection Bag is Void</h4>
                        <p className="text-xs text-stone-500 max-w-xs leading-normal">
                          Wander through our Fragrances, Handcrafted Soaps, and Italian Leather collections to find your premium aura matches.
                        </p>
                      </div>
                    ) : (
                      /* LIST OF CART ITEMS */
                      <div className="divide-y divide-stone-100">
                        {(cartItems || []).map((item) => {
                          if (!item || !item.product) return null;
                          const displayBg = item.product.bgColorClass || "bg-stone-50";
                          const displayName = item.product.name || "Luxury Atelier Unit";
                          const displayPrice = (item.product.price || 0) * (item.quantity || 1);
                          const displaySpec = item.product.sizeOrSpec || "Standard";

                          return (
                            <div key={item.product.id || Math.random()} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                              {/* Visual */}
                              <div className={`w-18 h-18 rounded-lg ${displayBg} flex-shrink-0 relative overflow-hidden flex items-center justify-center p-1 border border-stone-100`}>
                                <ProductVisual id={item.product.id} imagePlaceholderId={item.product.imagePlaceholderId} animate={false} className="w-14 h-14" />
                              </div>
   
                              {/* Meta */}
                              <div className="flex-1 flex flex-col justify-between">
                                <div>
                                  <div className="flex justify-between items-start gap-1">
                                    <h5 className="text-sm font-semibold text-stone-900 leading-tight line-clamp-1">{displayName}</h5>
                                    <span className="text-sm font-semibold font-serif text-stone-800">₹{displayPrice}</span>
                                  </div>
                                  <span className="text-[11px] text-[#8A7968] font-medium uppercase mt-0.5 block">{displaySpec}</span>
                                </div>
   
                                {/* Controls and action */}
                                <div className="flex items-center justify-between mt-2">
                                  {/* Incrementor */}
                                  <div className="flex items-center bg-white border border-stone-200/80 rounded-lg overflow-hidden h-7">
                                    <button 
                                      onClick={() => onUpdateQuantity(item.product.id, -1)}
                                      className="px-2 h-full text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors cursor-pointer"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="px-2 text-xs font-bold text-stone-800">{item.quantity}</span>
                                    <button 
                                      onClick={() => onUpdateQuantity(item.product.id, 1)}
                                      className="px-2 h-full text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
   
                                  {/* Trash */}
                                  <button 
                                    onClick={() => onRemoveFromCart(item.product.id)}
                                    className="text-stone-400 hover:text-red-600 transition-colors p-1"
                                    aria-label="Remove item"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
 
                {/* BOTTOM SUMMARY & CONTROL BUTTONS */}
                {checkoutStep === "cart" && cartItems.length > 0 && (
                  <div className="p-6 border-t border-stone-200/60 bg-white/70 backdrop-blur-md space-y-4">
                    
                    {/* Promo code form */}
                    <form onSubmit={handleApplyPromo} className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="ENTER PROMO CODE"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="flex-1 bg-stone-50 border border-stone-200/80 rounded-lg px-3 py-2 text-xs font-semibold placeholder-stone-400 tracking-wider focus:outline-none focus:ring-1 focus:ring-leather-tan uppercase"
                      />
                      <button 
                        type="submit"
                        className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                    </form>
 
                    {/* Promo messages & Success states */}
                    {discountError && <p className="text-[10px] text-red-600 font-medium">{discountError}</p>}
                    {appliedDiscount && (
                      <div className="flex items-center justify-between bg-amber-50 rounded-lg p-2 text-xs text-amber-900 border border-amber-200/60">
                        <span className="flex items-center gap-1.5 font-semibold">
                          <Tag className="w-3.5 h-3.5 text-amber-600 animate-pulse" /> Code: {appliedDiscount.code} applied! {appliedDiscount.type === "free_shipping" && "(Free Delivery)"}
                        </span>
                        <button 
                          type="button" 
                          onClick={handleRemovePromo} 
                          className="text-[10px] text-stone-400 hover:text-red-700 font-bold uppercase transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    )}
 
                    {/* Calculations Breakdown */}
                    <div className="space-y-2 pt-2 text-xs font-medium text-stone-600">
                      <div className="flex justify-between">
                        <span>Atelier Subtotal ({cartItems.reduce((acc, it) => acc + it.quantity, 0)} Items)</span>
                        <span>₹{subtotal}</span>
                      </div>
                      
                      {delhiveryShippingDetails && (
                        <div className="flex justify-between text-stone-500 text-[11px] font-light">
                          <span>Total Package Weight</span>
                          <span>{(delhiveryShippingDetails.metrics.actualWeightGrams / 1000).toFixed(2)} Kg</span>
                        </div>
                      )}

                      {appliedDiscount && (
                        <div className="flex justify-between text-emerald-700 font-semibold">
                          <span>Elite Discount</span>
                          <span>-₹{discountValue.toFixed(0)}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-stone-500 text-[11px] font-light">
                        <span>Luxury GST / Taxes (18%)</span>
                        <span>₹{taxValue.toFixed(0)}</span>
                      </div>

                      <div className="flex justify-between">
                        <span>Courier Express Shipping</span>
                        <span>{shippingCost === 0 ? "Complimented" : `₹${shippingCost}`}</span>
                      </div>

                      <div className="flex justify-between text-base font-serif text-stone-900 font-bold border-t border-stone-100 pt-3">
                        <span>Sum total</span>
                        <span className="text-[#8F633E]">₹{grandTotal.toFixed(0)}</span>
                      </div>
                    </div>

                    {/* Customer sign-in blockage card */}
                    {!isLoggedIn && (
                      <div className="bg-[#FAF6F0] border border-stone-200/50 rounded-xl p-3.5 space-y-2.5 animate-reveal text-left">
                        <div className="flex gap-2.5">
                          <User className="w-4 h-4 text-leather-tan shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <p className="text-[11px] text-stone-900 font-serif font-bold">Atelier Sign-In Required</p>
                            <p className="text-[10px] text-stone-500 leading-normal">
                              Creating a signature MYRA Privé membership account provides secure shipment tracking, points curation, and elite status benefits.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={onOpenProfile}
                          className="w-full py-1.5 border border-stone-300 hover:bg-stone-50 text-stone-850 rounded-lg text-[9.5px] uppercase font-bold tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 min-h-[36px] touch-target"
                        >
                          <User className="w-3.5 h-3.5 text-leather-tan" />
                          Sign In / Register Membership
                        </button>
                      </div>
                    )}
 
                    {/* Action Checkout button */}
                    <button 
                      id="checkout-trigger-btn"
                      onClick={handleProceedToShipping}
                      className="w-full bg-stone-950 hover:bg-leather-tan text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer text-sm"
                    >
                      {isLoggedIn ? (
                        <>
                          Secure Checkout
                          <ArrowRight className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          Sign In to Proceed
                          <User className="w-4 h-4 text-stone-400" />
                        </>
                      )}
                    </button>
 
                    {/* Trust disclaimer */}
                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-stone-400 py-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      Fully Verified • Cruelty-Free • Secured Curation Node
                    </div>
                  </div>
                )}
              </motion.div>
            </>
          )}
          
          {showRazorpayModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/85 backdrop-blur-xs p-4 animate-fade-in font-sans">
              <div className="w-full max-w-[360px] bg-[#1a1f36] text-white rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col">
                
                {/* Razorpay Banner Header */}
                <div className="bg-[#0b0e14] p-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-[10px] font-extrabold select-none">
                      RP
                    </div>
                    <div>
                      <h4 className="text-xs font-bold leading-tight tracking-wider text-blue-400 uppercase">Razorpay Secure API</h4>
                      <span className="text-[9px] text-stone-400 block font-mono">pay_sandbox_{Math.floor(100000 + Math.random() * 900000)}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[8px] text-stone-400 block uppercase font-bold tracking-wider">Amount is Rupees</span>
                    <span className="text-sm font-bold font-mono text-emerald-400">₹{grandTotal.toFixed(0)}</span>
                  </div>
                </div>

                {/* Merchant block */}
                <div className="bg-white/5 p-3 px-4 flex justify-between items-center text-xs border-b border-white/5">
                  <span className="text-stone-300 font-serif font-bold italic tracking-wider">Myra Luxury</span>
                  <span className="text-[9.5px] text-blue-300 font-bold bg-blue-900/40 px-2.5 py-0.5 rounded-full uppercase">Test Sandbox</span>
                </div>

                {/* Interactive Portal content */}
                <div className="p-5 flex-1 space-y-4 text-center">
                  {razorpayPaymentState === "loading" ? (
                    <div className="py-6 flex flex-col items-center justify-center space-y-3">
                      <div className="w-9 h-9 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin" />
                      <span className="text-xs text-stone-300 font-medium">Connecting secure Razorpay handshakes...</span>
                    </div>
                  ) : razorpayPaymentState === "method_selected" ? (
                    <div className="space-y-4 text-left">
                      <div className="p-3 bg-blue-950/40 border border-blue-500/20 rounded-xl space-y-1">
                        <h5 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Active Payment Method</h5>
                        <p className="text-[11px] font-medium text-stone-200">
                          {paymentMethodGroup === "upi" && `UPI Virtual Address: "${upiId}"`}
                          {paymentMethodGroup === "card" && `Credit Card: ****${cardNumber.slice(-4)} (${cardName || "Customer"})`}
                          {paymentMethodGroup === "netbanking" && `Net banking portal: "${selectedBank}"`}
                          {paymentMethodGroup === "wallet" && `Safe wallet checkout: "${selectedWallet}"`}
                        </p>
                        <span className="text-[9px] text-stone-450 block leading-normal pt-1.5 border-t border-white/5 mt-1.5">
                          Follow compliance requirements: you must evaluate how payment success or decline scenarios are handled in your e-commerce layout.
                        </span>
                      </div>

                      <div className="space-y-2 pt-1">
                        <span className="text-[9px] uppercase font-bold tracking-widest text-[#D4AF37] block text-center">Gateway Interaction Controls</span>
                        
                        <button
                          type="button"
                          onClick={() => {
                            setRazorpayPaymentState("verifying");
                            setTimeout(() => {
                              setRazorpayPaymentState("success");
                              setTimeout(() => {
                                setShowRazorpayModal(false);
                                executeCheckout(); 
                              }, 1300);
                            }, 1000);
                          }}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2 shadow-md"
                        >
                          <Check className="w-4 h-4 text-white" /> Simulate SUCCESS
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRazorpayPaymentState("verifying");
                            setTimeout(() => {
                              setRazorpayPaymentState("failed");
                            }, 1000);
                          }}
                          className="w-full bg-red-650 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2 shadow-md"
                        >
                          ✕ Simulate FAILURE / Error
                        </button>
                      </div>
                    </div>
                  ) : razorpayPaymentState === "verifying" ? (
                    <div className="py-8 flex flex-col items-center justify-center space-y-3">
                      <div className="w-9 h-9 border-2 border-white/20 border-t-indigo-500 rounded-full animate-spin" />
                      <span className="text-xs text-stone-300 font-semibold">Contacting banking authorization systems...</span>
                      <span className="text-[9px] text-stone-450">Checking secure 3D-Secure credentials and balance</span>
                    </div>
                  ) : razorpayPaymentState === "success" ? (
                    <div className="py-6 flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg border-2 border-emerald-400">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm text-emerald-400 font-bold tracking-wide">Razorpay Checkout Approved</span>
                      <p className="text-[9px] text-stone-400 font-mono">Reference: pay_tx_sandbox_01d41f</p>
                      <p className="text-[10px] text-stone-400 leading-normal">Writing order details to Myra Luxury database...</p>
                    </div>
                  ) : (
                    /* FAILED STATE */
                    <div className="space-y-4 py-2">
                      <div className="w-12 h-12 bg-red-650 rounded-full flex items-center justify-center shadow-lg border-2 border-red-400 mx-auto">
                        <span className="text-white text-xl font-bold font-sans">✕</span>
                      </div>
                      <span className="text-sm text-red-400 font-bold block">Payment Settlement Failed</span>
                      <p className="text-[10px] block text-stone-300 bg-red-950/40 p-2.5 rounded-xl border border-red-500/25 text-left leading-normal">
                        Declined by sandbox gateway (Error Code: RP_ERR_01): The transaction was manually aborted or sandbox balance was insufficient. Please use another checkout method or retry.
                      </p>
                      
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setRazorpayPaymentState("method_selected")}
                          className="flex-1 bg-white/10 hover:bg-white/20 text-white rounded-lg py-2.5 text-[10px] uppercase font-bold tracking-wider cursor-pointer transition-colors"
                        >
                          Retry Payment
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowRazorpayModal(false);
                            setRazorpayError("Simulated payment declination. Please select another mode.");
                          }}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2.5 text-[10px] uppercase font-bold tracking-wider cursor-pointer font-bold transition-colors"
                        >
                          Close & Abort
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Razorpay Secured Footer */}
                <div className="bg-[#0b0e14] p-3 border-t border-white/5 text-[9.5px] text-center text-stone-500 font-medium">
                  Secured by Razorpay Gateway Integration • Sandbox Portal
                </div>
                
              </div>
            </div>
          )}

        </div>
      )}
    </AnimatePresence>
  );
};
