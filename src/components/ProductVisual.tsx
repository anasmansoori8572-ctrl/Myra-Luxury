import React from "react";
import { motion, AnimatePresence } from "motion/react";

interface ProductVisualProps {
  id: string;
  imagePlaceholderId?: string;
  className?: string;
  animate?: boolean;
}

export const CoreProductVisual: React.FC<ProductVisualProps> = ({ id = "", imagePlaceholderId, className = "w-full h-full", animate = true }) => {
  // Ensure we use the imagePlaceholderId if provided, falling back to the standard id
  const safeId = id || "";
  const targetId = imagePlaceholderId || safeId;

  // Let's create distinct visual renderings based on the visual categories
  
  // Detect if targetId is an external URL, absolute path or uploaded image base64
  const isCustomImage = typeof targetId === "string" && (targetId.startsWith("http://") || targetId.startsWith("https://") || targetId.startsWith("data:") || targetId.startsWith("/"));
  
  if (isCustomImage) {
    return (
      <div className={`relative flex items-center justify-center w-full h-full ${className}`}>
        {/* Soft elegant shadow behind image */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#C68B59]/5 to-transparent opacity-20 pointer-events-none" />
        <img 
          src={targetId} 
          alt="Luxury Creation" 
          className="max-w-[98%] max-h-[98%] object-contain rounded-xl drop-shadow-xl scale-[1.28] hover:scale-[1.35] transition-all duration-500 ease-out"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // If custom image path fails, render a premium fallback container
            const imgEl = e.target as HTMLImageElement;
            imgEl.style.display = "none";
            // Add a text placeholder
            const parent = imgEl.parentElement;
            if (parent) {
              const fallback = document.createElement("div");
              fallback.className = "flex flex-col items-center justify-center text-stone-400 p-4 text-center";
              fallback.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 text-[#C68B59] opacity-75 mb-1.5"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                <span class="text-[9px] font-bold uppercase tracking-widest text-[#8A7968]">Curation Active</span>
              `;
              parent.appendChild(fallback);
            }
          }}
        />
      </div>
    );
  }

  if (safeId.startsWith("perfume-flora") || safeId.includes("mini") || safeId.startsWith("perfume-")) {
    // Elegant Perfume Bottle SVG
    const isMini = safeId.includes("mini");
    const isOud = safeId.includes("oud");
    const isAqua = safeId.includes("aqua");
    const isRose = safeId.includes("rose") || safeId.includes("flora");
    
    // Choose fluid pastel colors for liquid and labels
    const liquidColor = isOud ? "#f4dfc8" : isAqua ? "#e0fcf6" : isRose ? "#fce1e4" : "#f5e6fc";
    const labelBg = isOud ? "#4a3b32" : isAqua ? "#1f4e5b" : isRose ? "#fae1e3" : "#e4d3f5";
    const labelText = isOud ? "#f9ebe2" : isAqua ? "#ffffff" : isRose ? "#522b31" : "#441d4f";
    const nameStr = isOud ? "OUD BLOOM" : isAqua ? "AQUA MIST" : isMini ? "MINI LUXE" : "FLORA LUXE";
    
    return (
      <svg viewBox="20 0 160 220" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} transition-all duration-700`}>
        <defs>
          <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DFBA6B" />
            <stop offset="50%" stopColor="#F6E7C1" />
            <stop offset="100%" stopColor="#B48D3F" />
          </linearGradient>
          <linearGradient id="liquid-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={liquidColor} stopOpacity="0.85" />
            <stop offset="70%" stopColor={liquidColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="bottle-reflection" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6"/>
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.08"/>
          </radialGradient>
        </defs>

        {/* Ambient Glow */}
        <circle cx="100" cy="120" r="60" fill={liquidColor} opacity="0.18" className={animate ? "animate-pulse" : ""} style={{ animationDuration: "5s" }} />

        {/* Outer Mist rings */}
        <ellipse cx="100" cy="180" rx="70" ry="12" fill="#E8DFF5" opacity="0.15" />

        {/* Gold Cap / Spray nozzle */}
        <g transform="translate(0, 0)">
          {/* Stem atomizer */}
          <rect x="94" y="32" width="12" height="15" fill="url(#gold-gradient)" rx="1"/>
          <line x1="94" y1="41" x2="106" y2="41" stroke="#AA862B" strokeWidth="1"/>
          {/* Spray Cap */}
          <rect x="86" y="10" width="28" height="24" fill="url(#gold-gradient)" rx="4"/>
          {/* Ribbed patterns on cap */}
          <line x1="91" y1="14" x2="91" y2="30" stroke="#AA862B" strokeWidth="1.5" strokeOpacity="0.6"/>
          <line x1="100" y1="14" x2="100" y2="30" stroke="#AA862B" strokeWidth="1.5" strokeOpacity="0.6"/>
          <line x1="109" y1="14" x2="109" y2="30" stroke="#AA862B" strokeWidth="1.5" strokeOpacity="0.6"/>
          {/* Golden Collar */}
          <rect x="80" y="44" width="40" height="6" fill="url(#gold-gradient)" rx="1"/>
        </g>

        {/* Glass Bottle Body */}
        {isMini ? (
          // Sleek Rollerball cylinder
          <rect x="75" y="50" width="50" height="150" rx="16" fill="url(#liquid-gradient)" stroke="url(#gold-gradient)" strokeWidth="3" />
        ) : (
          // Premium heavy crystal decanter
          <path d="M 68 50 L 132 50 C 145 50, 158 58, 158 72 L 158 178 C 158 196, 142 208, 124 208 L 76 208 C 58 208, 42 196, 42 178 L 42 72 C 42 58, 55 50, 68 50 Z" 
                fill="url(#liquid-gradient)" 
                stroke="url(#gold-gradient)" 
                strokeWidth="2.5" />
        )}

        {/* inner atomizer spray tube */}
        <line x1="100" y1="48" x2="100" y2="190" stroke="#DFBA6B" strokeWidth="1.5" strokeDasharray="4,2" strokeOpacity="0.7" />

        {/* Elegant Perfume Label Layout */}
        <g transform={isMini ? "translate(79, 78)" : "translate(54, 95)"}>
          {/* Label Card */}
          <rect x="0" y="0" width={isMini ? "42" : "92"} height={isMini ? "55" : "60"} fill={labelBg} rx="6" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.06))" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
          {/* Gold Decorative Border */}
          <rect x="3" y="3" width={isMini ? "36" : "86"} height={isMini ? "49" : "54"} fill="none" stroke="url(#gold-gradient)" strokeWidth="1" rx="4" strokeOpacity="0.8" />
          
          {/* Lotus Emblem minimal */}
          <path d={isMini ? "M 21 14 C 18 10, 24 10, 21 14 Z" : "M 46 16 C 41 11, 51 11, 46 16 Z"} fill="url(#gold-gradient)"/>
          <path d={isMini ? "M 21 14 C 23 11, 23 15, 21 14 Z" : "M 46 16 C 51 12, 49 19, 46 16 M 46 16 C 41 12, 43 19, 46 16"} fill="none" stroke="url(#gold-gradient)" strokeWidth="0.8"/>
          
          {/* Label text */}
          <text x={isMini ? "21" : "46"} y={isMini ? "28" : "32"} textAnchor="middle" fill={labelText} fontSize={isMini ? "5px" : "8px"} fontWeight="700" letterSpacing="1" fontFamily="var(--font-serif)">
            MYRA
          </text>
          <text x={isMini ? "21" : "46"} y={isMini ? "36" : "42"} textAnchor="middle" fill={labelText} fontSize={isMini ? "4px" : "6px"} letterSpacing="1.5" fontWeight="400" fontFamily="var(--font-sans)">
            {nameStr}
          </text>
          <text x={isMini ? "21" : "46"} y={isMini ? "44" : "50"} textAnchor="middle" fill={labelText} opacity="0.6" fontSize={isMini ? "3px" : "4px"} letterSpacing="1" fontFamily="var(--font-serif)">
            {safeId.includes("10") ? "10ML • LUX" : 
             safeId.includes("20") ? "20ML • PETITE" : 
             safeId.includes("25") ? "25ML • TRAVEL" : 
             safeId.includes("50") ? "50ML • ATELIER" : 
             safeId.includes("80") ? "80ML • RESERVE" : 
             "100ML • EAU DE PARFUM"}
          </text>
        </g>

        {/* Glass Bottle Reflection Overlay */}
        {isMini ? (
          <rect x="75" y="50" width="50" height="150" rx="16" fill="url(#bottle-reflection)" pointerEvents="none" />
        ) : (
          <path d="M 68 50 L 132 50 C 145 50, 158 58, 158 72 L 158 178 C 158 196, 142 208, 124 208 L 76 208 C 58 208, 42 196, 42 178 L 42 72 C 42 58, 55 50, 68 50 Z" 
                fill="url(#bottle-reflection)" 
                pointerEvents="none" />
        )}

        {/* Floating Sparkles around the product */}
        {animate && (
          <g>
            <path d="M 30,70 L 32,74 L 36,75 L 32,76 L 30,80 L 28,76 L 24,75 L 28,74 Z" fill="#F6E7C1" opacity="0.8" className="animate-pulse" style={{ animationDelay: "1s" }} />
            <path d="M 170,120 L 171.5,123 L 175,124 L 171.5,125 L 170,128 L 168.5,125 L 165,124 L 168.5,123 Z" fill="#F6E7C1" opacity="0.6" className="animate-pulse" style={{ animationDelay: "2s" }} />
            <path d="M 155,60 L 156.5,63 L 160,64 L 156.5,65 L 155,68 L 153.5,65 L 150,64 L 153.5,63 Z" fill="#FDFBF7" opacity="0.75" className="animate-pulse" style={{ animationDelay: "0.5s" }} />
          </g>
        )}
      </svg>
    );
  }

  if (safeId.startsWith("leather-belt")) {
    // Beautiful Italian Leather Belt Vector
    const isDeep = safeId.includes("deep") || safeId.includes("brown");
    const leatherColor = isDeep ? "#3a2b22" : "#9e6137";
    const highlightColor = isDeep ? "#513a2d" : "#bf7947";
    
    return (
      <svg viewBox="18 15 164 165" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className}`}>
        <defs>
          <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DFBA6B" />
            <stop offset="50%" stopColor="#F6E7C1" />
            <stop offset="100%" stopColor="#96722C" />
          </linearGradient>
          <linearGradient id="leather-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={leatherColor} />
            <stop offset="100%" stopColor="#251a14" />
          </linearGradient>
          <filter id="shadow-effect" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#2e221b" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Leather curves suggesting quality folded leather */}
        <g filter="url(#shadow-effect)">
          {/* Background Loop 1 */}
          <path d="M 30,120 C 30,160, 170,160, 170,120 C 170,80, 30,80, 30,120 Z" fill="none" stroke={leatherColor} strokeWidth="16" strokeLinecap="round" opacity="0.2" />
          
          {/* Folded Overbelt Loop 2 */}
          <path d="M 36,110 C 36,150, 164,150, 164,110 C 164,70, 40,70, 48,105" fill="none" stroke="url(#leather-gradient)" strokeWidth="16" strokeLinecap="round" />
          
          {/* Fine Stitches Top Edge */}
          <path d="M 36,110 C 36,150, 164,150, 164,110" fill="none" stroke="#ECCAA6" strokeWidth="1.2" strokeDasharray="3,3" strokeOpacity="0.5" />
          
          {/* Leather Belt Tip exiting the lock */}
          <path d="M 44,114 C 40,135, 80,140, 115,135" fill="none" stroke="url(#leather-gradient)" strokeWidth="16" strokeLinecap="round" />
          <path d="M 44,114 C 40,135, 80,140, 115,135" fill="none" stroke="#F1D7B8" strokeWidth="1.2" strokeDasharray="3,3" strokeOpacity="0.4" />
        </g>

        {/* Massive Luxury Brass Buckle */}
        <g transform="translate(110, 85)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.15))">
          {/* Buckle Outer frame */}
          <rect x="-5" y="-12" width="46" height="56" rx="10" fill="none" stroke="url(#gold-gradient)" strokeWidth="7" />
          {/* Buckle Inner Plate bar */}
          <line x1="18" y1="-10" x2="18" y2="42" stroke="url(#gold-gradient)" strokeWidth="5" />
          {/* Buckle Prong */}
          <path d="M 18,16 L 34,16" stroke="url(#gold-gradient)" strokeWidth="4.5" strokeLinecap="round" />
          {/* Luxury debossed tag loop holder */}
          <rect x="-18" y="-1" width="10" height="34" rx="2" fill={leatherColor} stroke="url(#gold-gradient)" strokeWidth="1" />
        </g>

        {/* Tiny Premium Monogram label */}
        <text x="100" y="32" textAnchor="middle" fill="#C68B59" letterSpacing="4" fontSize="9" fontWeight="500" fontFamily="var(--font-serif)">
          MYRA LUXURY
        </text>
        <text x="100" y="44" textAnchor="middle" fill="#8B7B70" letterSpacing="1" fontSize="6" fontWeight="300" fontFamily="var(--font-sans)">
          GENUINE ITALIAN CRAFT
        </text>

        {/* Small Golden Stars */}
        <path d="M 35,45 L 36.5,47 L 39,47.5 L 36.5,48 L 35,51 L 33.5,48 L 31,47.5 L 33.5,47 Z" fill="#DFBA6B" opacity="0.6" className="animate-pulse" />
      </svg>
    );
  }

  if (safeId.startsWith("leather-wallet")) {
    // Elegant Leather Wallet Vector representation
    const isBlack = safeId.includes("black");
    const walletColor = isBlack ? "#222222" : "#a86c3e";
    const stitchingColor = isBlack ? "#4f4f4f" : "#ffd2a6";
    
    return (
      <svg viewBox="18 25 164 140" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className}`}>
        <defs>
          <linearGradient id="metal-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E2C175" />
            <stop offset="50%" stopColor="#FBF2CC" />
            <stop offset="100%" stopColor="#9C772F" />
          </linearGradient>
          <linearGradient id="leather-wallet-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={walletColor} />
            <stop offset="100%" stopColor={isBlack ? "#0d0d0d" : "#5d3214"} />
          </linearGradient>
          <filter id="soft-wallet-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="12" stdDeviation="8" floodColor="#000" floodOpacity="0.22" />
          </filter>
        </defs>

        {/* Ambient Warmth Glow */}
        <circle cx="100" cy="110" r="50" fill={isBlack ? "#666" : "#E5A967"} opacity="0.1" />

        {/* The Folded Bifold body */}
        <g filter="url(#soft-wallet-shadow)" transform="translate(25, 38)">
          {/* Main Leather flaps */}
          <rect x="0" y="0" width="150" height="110" rx="12" fill="url(#leather-wallet-grad)" stroke="#FFFFFF" strokeOpacity="0.1" strokeWidth="1" />
          
          {/* Subtle textured grid lines to simulate vintage fine hand grain */}
          <rect x="3" y="3" width="144" height="104" rx="10" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="2" strokeDasharray="1,2" />
          
          {/* Elegant Stitching borders around the entire wallet perimeter */}
          <rect x="6" y="6" width="138" height="98" fill="none" stroke={stitchingColor} strokeWidth="1.2" strokeDasharray="4,2" strokeOpacity={isBlack ? "0.3" : "0.5"} rx="8" />

          {/* Luxury Center Gold Logo Plaque */}
          <g transform="translate(75, 55)">
            {/* Logo box */}
            <circle cx="0" cy="-6" r="14" fill="rgba(0,0,0,0.4)" stroke="url(#metal-gold)" strokeWidth="1" />
            
            {/* Lotus icon logo design */}
            <path d="M 0,-12 C -4,-16 4,-16 0,-12 M -6,-7 C -10,-11 -4,-11 -6,-7 M 6,-7 C 10,-11 4,-11 6,-7" fill="none" stroke="url(#metal-gold)" strokeWidth="0.8" />
            
            <text x="0" y="18" textAnchor="middle" fill="url(#metal-gold)" fontSize="6" fontWeight="700" letterSpacing="2" fontFamily="var(--font-serif)">
              MYRA
            </text>
            <text x="0" y="25" textAnchor="middle" fill="url(#metal-gold)" opacity="0.7" fontSize="3.5" letterSpacing="1" fontFamily="var(--font-sans)">
              LUXURY ATELIER
            </text>
          </g>

          {/* Card Slot Overlay on fold */}
          <path d="M 6,65 L 144,65 C 130,75, 20,75, 6,65 Z" fill="rgba(0,0,0,0.15)" stroke={stitchingColor} strokeWidth="0.8" strokeDasharray="2,2" strokeOpacity="0.4" />
        </g>

        {/* RFID Block tag label watermarked */}
        <rect x="34" y="112" width="26" height="10" rx="2" fill="rgba(255,255,255,0.1)" stroke="url(#metal-gold)" strokeWidth="0.5" strokeOpacity="0.4" />
        <text x="47" y="119" textAnchor="middle" fill="#ECD599" fontSize="3" letterSpacing="1.2" fontWeight="700">RFID SAFE</text>

        {/* Fine gold sparkles */}
        <path d="M 160,50 L 161.5,52 L 164,52.5 L 161.5,53 L 160,55 L 158.5,53 L 156,52.5 L 158.5,52 Z" fill="#DFBA6B" opacity="0.5" className="animate-ping" style={{ animationDuration: "3s" }} />
      </svg>
    );
  }

  if (safeId.startsWith("soap-")) {
    // Botanical Handmade Soap design with petals, bubbles, and raw texture
    const isRose = safeId.includes("rose");
    const isAloe = safeId.includes("aloe");
    const isLavender = safeId.includes("lavender");
    
    // Choose natural pastel tones
    const soapColor = isRose ? "#fce1e4" : isAloe ? "#e2f0cb" : isLavender ? "#e8dff5" : "#e0e0e0";
    const botanicalAccent = isRose ? "#ec5870" : isAloe ? "#2e7d32" : isLavender ? "#7e57c2" : "#424242";
    const labelTitle = isRose ? "ROSE GLOW" : isAloe ? "ALOE FRESH" : isLavender ? "LAVENDER" : "CHARCOAL";

    return (
      <svg viewBox="18 18 164 150" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className}`}>
        <defs>
          <filter id="soap-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="2" dy="10" stdDeviation="6" floodColor="#8B8678" floodOpacity="0.18" />
          </filter>
          <linearGradient id="soap-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="35%" stopColor={soapColor} />
            <stop offset="100%" stopColor={soapColor} stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Ambient Bubbles for natural handcrafted vibe */}
        {animate && (
          <g opacity="0.5">
            <circle cx="45" cy="50" r="6" fill="none" stroke="#DDFFF7" strokeWidth="1" className="animate-bounce" style={{ animationDuration: "2.5s", animationDelay: "0.2s" }} />
            <circle cx="165" cy="140" r="4" fill="none" stroke="#E8DFF5" strokeWidth="1" className="animate-bounce" style={{ animationDuration: "3s", animationDelay: "0.8s" }} />
            <circle cx="155" cy="45" r="8" fill="none" stroke="#FCF4DD" strokeWidth="1" className="animate-bounce" style={{ animationDuration: "2.2s", animationDelay: "0.5s" }} />
            <circle cx="35" cy="145" r="5" fill="none" stroke="#E2F0CB" strokeWidth="1" className="animate-bounce" style={{ animationDuration: "3.5s" }} />
          </g>
        )}

        {/* Handcrafted rustic, organic-beveled soap bar */}
        <g filter="url(#soap-shadow)" transform="translate(30, 45)">
          {/* Main rustic soap slab */}
          <path d="M 12 0 L 128 0 C 135 0, 140 10, 137 20 L 122 95 C 120 102, 114 108, 106 108 L 14 108 C 6 108, 0 102, 2 95 L 8 20 C 10 10, 5 0, 12 0 Z" 
                fill="url(#soap-grad)" stroke="#FFFFFF" strokeWidth="1.5" />
          
          {/* Marbled gold/botanical vein details in the soap */}
          <path d="M 20,30 Q 50,20 80,45 T 120,25" fill="none" stroke={soapColor === "#e0e0e0" ? "#444" : "#F6E7C1"} strokeWidth="5" opacity="0.3" strokeLinecap="round" />
          <path d="M 15,85 Q 60,65 90,95 T 115,75" fill="none" stroke={soapColor === "#e0e0e0" ? "#fff" : "#F6E7C1"} strokeWidth="4.5" opacity="0.25" strokeLinecap="round" />

          {/* Pressed botanical Leaf emblem stamp inside the soap */}
          <g transform="translate(70, 38)" opacity="0.32" stroke={botanicalAccent} strokeWidth="1.5" fill="none" strokeLinecap="round">
            {/* Elegant leaf spray */}
            <path d="M 0,25 Q -10,12 0,0" />
            <path d="M 0,25 Q 10,12 0,0" />
            <path d="M 0,25 L 0,30" />
            <path d="M -5,12 Q 0,8 0,12" />
            <path d="M 5,12 Q 0,8 0,12" />
            <path d="M -4,6 Q 0,2 0,6" />
            <path d="M 4,6 Q 0,2 0,6" />
          </g>

          {/* Rustic parchment-paper product wrap band */}
          <g transform="translate(30, 48)">
            {/* The Paper Wrapper */}
            <rect x="0" y="0" width="80" height="42" fill="#FCFBF7" rx="3" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.08))" stroke="#EBE4D5" strokeWidth="1" />
            
            {/* Monogram Seal */}
            <text x="40" y="14" textAnchor="middle" fill="#C68B59" letterSpacing="2" fontSize="5.5" fontWeight="700" fontFamily="var(--font-serif)">
              MYRA LUXURY
            </text>
            <line x1="12" y1="18" x2="68" y2="18" stroke="#EBE4D5" strokeWidth="0.8" />
            
            <text x="40" y="27" textAnchor="middle" fill="#4A3B32" letterSpacing="1" fontSize="5.5" fontWeight="600" fontFamily="var(--font-sans)">
              {labelTitle}
            </text>
            <text x="40" y="34" textAnchor="middle" fill="#8B8678" fontSize="4" letterSpacing="0.8">
              RAW BOTANICAL BAR • 150G
            </text>
          </g>
        </g>

        {/* Small floating botanical leaf art element */}
        <g stroke="#C68B59" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.5" className={animate ? "animate-pulse" : ""}>
          <path d="M 160,35 Q 170,25 175,35 M 175,35 Q 165,45 160,35 Z" fill="#E2F0CB" />
          <line x1="160" y1="35" x2="175" y2="35" />
        </g>
      </svg>
    );
  }

  // Fallback / GIFT SET BOX DESIGN
  return (
    <svg viewBox="18 18 164 155" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className}`}>
      <defs>
        <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DFBA6B" />
          <stop offset="50%" stopColor="#F6E7C1" />
          <stop offset="100%" stopColor="#B48D3F" />
        </linearGradient>
        <filter id="box-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="12" stdDeviation="8" floodColor="#3F3935" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* Luxury Rigid Chest Box */}
      <g filter="url(#box-shadow)" transform="translate(30, 42)">
        {/* Box Base Bottom Body */}
        <path d="M 5,30 L 135,30 L 135,110 C 135,116, 130,120, 124,120 L 16,120 C 10,120, 5,116, 5,110 Z" fill="#F4EFE6" stroke="url(#gold-gradient)" strokeWidth="1.5" />
        
        {/* Base Interior Dark Velvet padding split */}
        <path d="M 9,33 C 25,31, 115,31, 131,33 L 131,100 C 131,108, 9,108, 9,100 Z" fill="#2C2C2C" opacity="0.08" />

        {/* Outer Premium Ribbon Ribbon Loop Vertically */}
        <rect x="62" y="5" width="16" height="115" fill="#fce1e4" stroke="url(#gold-gradient)" strokeWidth="0.8" rx="1" />
        <rect x="66" y="5" width="8" height="115" fill="#ec5870" opacity="0.3" />

        {/* Box Lid (Slightly tilted open for premium touch) */}
        <g transform="rotate(-6, 70, 25)">
          {/* Lid Core Cap */}
          <rect x="0" y="5" width="140" height="28" rx="4" fill="#FFFFFF" stroke="url(#gold-gradient)" strokeWidth="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))" />
          
          {/* Ribbon on the lid */}
          <rect x="62" y="5" width="16" height="28" fill="#fce1e4" stroke="url(#gold-gradient)" strokeWidth="0.5" />
          
          {/* Decal Gold Lines on Lid */}
          <rect x="5" y="10" width="130" height="18" fill="none" stroke="url(#gold-gradient)" strokeWidth="0.8" rx="2" strokeOpacity="0.5" />

          {/* Luxury Label in central position */}
          <rect x="35" y="12" width="70" height="14" fill="#FDFBF7" stroke="url(#gold-gradient)" strokeWidth="1" rx="2" />
          <text x="70" y="21" textAnchor="middle" fill="#4A3B32" fontSize="5.5" fontWeight="600" letterSpacing="1.5" fontFamily="var(--font-serif)">
            MYRA LUXURY
          </text>
        </g>

        {/* Beautiful Silk Satin Bow */}
        <g transform="translate(70, 25)" filter="drop-shadow(0 3px 5px rgba(236,88,112,0.3))">
          {/* Left Bow Loop */}
          <path d="M 0,0 Q -24,-18 -12,-6 Q 0,6 0,0" fill="#fce1e4" stroke="url(#gold-gradient)" strokeWidth="1" />
          {/* Right Bow Loop */}
          <path d="M 0,0 Q 24,-18 12,-6 Q 0,6 0,0" fill="#fce1e4" stroke="url(#gold-gradient)" strokeWidth="1" />
          {/* Knot center */}
          <rect x="-5" y="-5" width="10" height="10" rx="3" fill="#ec5870" stroke="url(#gold-gradient)" strokeWidth="1" />
          {/* Dangling Bow tails */}
          <path d="M -3,4 Q -15,22 -8,25 Q -1,28 -1,1" fill="#fce1e4" stroke="url(#gold-gradient)" strokeWidth="0.8" />
          <path d="M 3,4 Q 15,22 8,25 Q 1,28 1,1" fill="#fce1e4" stroke="url(#gold-gradient)" strokeWidth="0.8" />
        </g>
      </g>

      {/* Floating elegant flora tag petal decoration */}
      <path d="M 25,120 A 10,12 0 0,1 32,135 A 8,10 0 0,0 25,120" fill="#fce1e4" opacity="0.6" className="animate-bounce" style={{ animationDuration: "3.5s" }} />
      <path d="M 175,100 A 12,14 0 0,1 168,118 A 10,12 0 0,0 175,100" fill="#E8DFF5" opacity="0.6" className="animate-bounce" style={{ animationDuration: "2.8s" }} />
    </svg>
  );
};

export const ProductVisual: React.FC<ProductVisualProps> = (props) => {
  const targetId = props.imagePlaceholderId || props.id;
  
  if (props.animate === false) {
    return (
      <div className="w-full h-full relative flex items-center justify-center">
        <CoreProductVisual {...props} />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative flex items-center justify-center">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={targetId}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full h-full flex items-center justify-center absolute"
        >
          <CoreProductVisual {...props} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
