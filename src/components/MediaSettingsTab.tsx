import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  RefreshCw, 
  Check, 
  Trash2, 
  UploadCloud, 
  FileVideo, 
  Info,
  Link as LinkIcon,
  Image as ImageIcon,
  Film,
  Award,
  Type,
  Layout
} from "lucide-react";
import { uploadToCloudinary } from "../cloudinary";

interface MediaSettingsTabProps {
  videoUrl: string;
  onVideoUrlChange: (url: string) => void;
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
  triggerToast?: (msg: string) => void;
}

const DEFAULT_VIDEO = "https://res.cloudinary.com/dy7avkqub/video/upload/q_auto/f_auto/v1780582990/b_e_d_b_e_videomp__ugppis.mp4";
const DEFAULT_BG = "https://res.cloudinary.com/dy7avkqub/image/upload/q_auto/f_auto/v1780577005/main-sample.jpg";
const DEFAULT_LOGO = "https://res.cloudinary.com/dwokrma1h/image/upload/v1779454534/main-sample.png";
const DEFAULT_BANNER = "https://res.cloudinary.com/dy7avkqub/image/upload/q_auto/f_auto/v1780835693/samples/waves.png";

export const MediaSettingsTab: React.FC<MediaSettingsTabProps> = ({ 
  videoUrl, 
  onVideoUrlChange,
  heroBgUrl = DEFAULT_BG,
  onHeroBgUrlChange,
  logoUrl = DEFAULT_LOGO,
  onLogoUrlChange,
  companyName = "MYRA",
  onCompanyNameChange,
  companySubtitle = "LUXURY",
  onCompanySubtitleChange,
  bannerUrl = DEFAULT_BANNER,
  onBannerUrlChange,
  triggerToast
}) => {
  // General Tab Selection: "background" or "video" or "logo" or "banner"
  const [activeMode, setActiveMode] = useState<"background" | "video" | "logo" | "banner">("background");

  const [isUploadingBg, setIsUploadingBg] = useState<boolean>(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState<boolean>(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState<boolean>(false);

  // --- VIDEO PORTION ---
  const [currentUrl, setCurrentUrl] = useState<string>(videoUrl);
  const [previewUrl, setPreviewUrl] = useState<string>(videoUrl);
  const [isUrlValid, setIsUrlValid] = useState<boolean>(true);
  
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string; isBase64: boolean } | null>(() => {
    if (videoUrl.startsWith("data:video")) {
      return { name: "custom_uploaded_campaign_video.mp4", size: "~3.8 MB", isBase64: true };
    }
    if (videoUrl.startsWith("blob:")) {
      return { name: "active_cached_video_session.mp4", size: "High-Speed Virtual Clip", isBase64: false };
    }
    return null;
  });
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadNote, setUploadNote] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if videoUrl changes externally
  useEffect(() => {
    setCurrentUrl(videoUrl);
    setPreviewUrl(videoUrl);
    
    if (videoUrl === DEFAULT_VIDEO) {
      setUploadedFile(null);
      setUploadError(null);
      setUploadNote(null);
    } else if (videoUrl.startsWith("data:video")) {
      setUploadedFile({ name: "custom_uploaded_campaign_video.mp4", size: "~3.8 MB", isBase64: true });
    } else if (videoUrl.startsWith("blob:")) {
      setUploadedFile({ name: "active_cached_video_session.mp4", size: "High-Speed Virtual Clip", isBase64: false });
    } else {
      try {
        const namePart = videoUrl.split("/").pop()?.split("?")[0] || "custom_video_source.mp4";
        setUploadedFile({ name: namePart, size: "Network Endpoint URL", isBase64: false });
      } catch {
        setUploadedFile({ name: "custom_brand_video.mp4", size: "Network Endpoint URL", isBase64: false });
      }
    }
  }, [videoUrl]);

  const triggerFileSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("video/")) {
      setUploadError("Invalid element type. Please upload a structured video file (such as .mp4, .webm, or .mov).");
      setUploadNote(null);
      return;
    }

    setUploadError(null);
    setUploadNote(null);
    setIsUrlValid(true);

    const sizeInMB = file.size / (1024 * 1024);
    const formattedSize = `${sizeInMB.toFixed(1)} MB`;

    setIsUploadingVideo(true);
    uploadToCloudinary(file, "video")
      .then((uploadedUrl) => {
        onVideoUrlChange(uploadedUrl);
        setPreviewUrl(uploadedUrl);
        setCurrentUrl(uploadedUrl);
        setUploadedFile({ name: file.name, size: formattedSize, isBase64: false });
        setUploadNote("Successfully uploaded to your Cloudinary stream directory! Custom live stream is now persistent.");
        if (triggerToast) triggerToast("Video uploaded to Cloudinary successfully!");
      })
      .catch((err) => {
        console.error("Cloudinary video upload error:", err);
        setUploadError(`Failed to upload to Cloudinary: ${err.message || err}`);
      })
      .finally(() => {
        setIsUploadingVideo(false);
      });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleApplyCustomUrl = () => {
    if (!currentUrl.trim()) return;
    setIsUrlValid(true);
    setUploadError(null);
    setUploadNote(null);
    onVideoUrlChange(currentUrl.trim());
    setPreviewUrl(currentUrl.trim());
    if (triggerToast) triggerToast("Updation successful");
  };

  const handleResetToDefault = () => {
    setUploadedFile(null);
    setUploadError(null);
    setUploadNote(null);
    setIsUrlValid(true);
    setCurrentUrl(DEFAULT_VIDEO);
    onVideoUrlChange(DEFAULT_VIDEO);
    setPreviewUrl(DEFAULT_VIDEO);
    if (triggerToast) triggerToast("Updation successful");
  };

  const handleClearUpload = () => {
    setUploadedFile(null);
    setUploadError(null);
    setUploadNote(null);
    setIsUrlValid(true);
    setCurrentUrl(DEFAULT_VIDEO);
    onVideoUrlChange(DEFAULT_VIDEO);
    setPreviewUrl(DEFAULT_VIDEO);
    if (triggerToast) triggerToast("Updation successful");
  };


  // --- BACKGROUND PORTION ---
  const [currentBgUrl, setCurrentBgUrl] = useState<string>(heroBgUrl);
  const [previewBgUrl, setPreviewBgUrl] = useState<string>(heroBgUrl);
  const [isBgValid, setIsBgValid] = useState<boolean>(true);

  const [dragOverBg, setDragOverBg] = useState<boolean>(false);
  const [uploadedBgFile, setUploadedBgFile] = useState<{ name: string; size: string; isBase64: boolean } | null>(() => {
    if (heroBgUrl.startsWith("data:image")) {
      return { name: "custom_atelier_background.png", size: "~1.5 MB", isBase64: true };
    }
    return null;
  });
  const [uploadBgError, setUploadBgError] = useState<string | null>(null);
  const [uploadBgNote, setUploadBgNote] = useState<string | null>(null);

  const bgFileInputRef = useRef<HTMLInputElement>(null);

  const bgPresets = [
    {
      name: "Scented Carafes (Classic)",
      description: "Original luxurious glass rendering",
      thumbnail: "https://res.cloudinary.com/dy7avkqub/image/upload/q_auto/f_auto/v1780577005/main-sample.jpg",
    },
    {
      name: "Golden Sand & Silk",
      description: "Sun-kissed luxury fabric drapery",
      thumbnail: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800",
    },
    {
      name: "Geometric Ivory Stones",
      description: "Sleek architectural marble structures",
      thumbnail: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
    },
    {
      name: "Atelier Amber Glow",
      description: "Rich warm honey tones with soft refractions",
      thumbnail: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=800",
    }
  ];

  // Sync state if heroBgUrl changes externally
  useEffect(() => {
    setCurrentBgUrl(heroBgUrl);
    setPreviewBgUrl(heroBgUrl);

    if (heroBgUrl === DEFAULT_BG) {
      setUploadedBgFile(null);
      setUploadBgError(null);
      setUploadBgNote(null);
    } else if (heroBgUrl.startsWith("data:image")) {
      setUploadedBgFile({ name: "custom_atelier_background.png", size: "~1.5 MB", isBase64: true });
    } else {
      try {
        const namePart = heroBgUrl.split("/").pop()?.split("?")[0] || "external_web_image.jpg";
        setUploadedBgFile({ name: namePart, size: "Direct Image Asset Link", isBase64: false });
      } catch {
        setUploadedBgFile({ name: "external_web_image.jpg", size: "Direct Image Asset Link", isBase64: false });
      }
    }
  }, [heroBgUrl]);

  const triggerBgFileSelector = () => {
    if (bgFileInputRef.current) {
      bgFileInputRef.current.click();
    }
  };

  const processBgFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadBgError("Invalid file type. Please upload a structured image file (such as .png, .jpg, .jpeg, or .webp).");
      setUploadBgNote(null);
      return;
    }

    setUploadBgError(null);
    setUploadBgNote(null);
    setIsBgValid(true);

    const sizeInMB = file.size / (1024 * 1024);
    const formattedSize = `${sizeInMB.toFixed(2)} MB`;

    setIsUploadingBg(true);
    uploadToCloudinary(file, "image")
      .then((uploadedUrl) => {
        if (onHeroBgUrlChange) {
          onHeroBgUrlChange(uploadedUrl);
          setPreviewBgUrl(uploadedUrl);
          setCurrentBgUrl(uploadedUrl);
          setUploadedBgFile({ name: file.name, size: formattedSize, isBase64: false });
          setUploadBgNote("Wallpaper uploaded to Cloudinary! High fidelity image CDN representation is active.");
          if (triggerToast) triggerToast("Wallpaper uploaded to Cloudinary successfully!");
        }
      })
      .catch((err) => {
        console.error("Cloudinary background upload error:", err);
        setUploadBgError(`Failed to upload to Cloudinary: ${err.message || err}`);
      })
      .finally(() => {
        setIsUploadingBg(false);
      });
  };

  const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processBgFile(e.target.files[0]);
    }
  };

  const handleBgDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverBg(true);
  };

  const handleBgDragLeave = () => {
    setDragOverBg(false);
  };

  const handleBgDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverBg(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processBgFile(e.dataTransfer.files[0]);
    }
  };

  const handleApplyCustomBgUrl = () => {
    if (!currentBgUrl.trim() || !onHeroBgUrlChange) return;
    setIsBgValid(true);
    setUploadBgError(null);
    setUploadBgNote(null);
    onHeroBgUrlChange(currentBgUrl.trim());
    setPreviewBgUrl(currentBgUrl.trim());
    if (triggerToast) triggerToast("Updation successful");
  };

  const handleResetBgToDefault = () => {
    if (onHeroBgUrlChange) {
      setUploadedBgFile(null);
      setUploadBgError(null);
      setUploadBgNote(null);
      setIsBgValid(true);
      setCurrentBgUrl(DEFAULT_BG);
      onHeroBgUrlChange(DEFAULT_BG);
      setPreviewBgUrl(DEFAULT_BG);
      if (triggerToast) triggerToast("Updation successful");
    }
  };

  const handleClearBgUpload = () => {
    handleResetBgToDefault();
  };


  // --- LOGO & IDENTITY PORTION ---
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string>(logoUrl);
  const [previewLogoUrl, setPreviewLogoUrl] = useState<string>(logoUrl);
  const [isLogoValid, setIsLogoValid] = useState<boolean>(true);

  const [dragOverLogo, setDragOverLogo] = useState<boolean>(false);
  const [uploadedLogoFile, setUploadedLogoFile] = useState<{ name: string; size: string; isBase64: boolean } | null>(() => {
    if (logoUrl.startsWith("data:image")) {
      return { name: "custom_brand_logo.png", size: "~300 KB", isBase64: true };
    }
    return null;
  });
  const [uploadLogoError, setUploadLogoError] = useState<string | null>(null);
  const [uploadLogoNote, setUploadLogoNote] = useState<string | null>(null);

  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Identity inputs
  const [inputCompanyName, setInputCompanyName] = useState<string>(companyName);
  const [inputCompanySubtitle, setInputCompanySubtitle] = useState<string>(companySubtitle);

  const logoPresets = [
    {
      name: "Classic Silhouette (Lotus)",
      thumbnail: "https://res.cloudinary.com/dwokrma1h/image/upload/v1779454534/main-sample.png",
      style: "Warm Gold Minimalist Emblem"
    },
    {
      name: "Regal Crown (Golden Emblem)",
      thumbnail: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=300",
      style: "Baroque Hand-drawn Floral Crest"
    },
    {
      name: "Botanical Whisper (Laurel)",
      thumbnail: "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&q=80&w=300",
      style: "Fine-Line Ivory Wreath Curation"
    },
    {
      name: "Modern Monogram (Cursive)",
      thumbnail: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=300",
      style: "Symmetric Aesthetic Diamond Plaque"
    }
  ];

  // Sync inputs on props update
  useEffect(() => {
    setInputCompanyName(companyName);
  }, [companyName]);

  useEffect(() => {
    setInputCompanySubtitle(companySubtitle);
  }, [companySubtitle]);

  // Sync state if logoUrl changes externally
  useEffect(() => {
    setCurrentLogoUrl(logoUrl);
    setPreviewLogoUrl(logoUrl);

    if (logoUrl === DEFAULT_LOGO) {
      setUploadedLogoFile(null);
      setUploadLogoError(null);
      setUploadLogoNote(null);
    } else if (logoUrl.startsWith("data:image")) {
      setUploadedLogoFile({ name: "custom_brand_logo.png", size: "~300 KB", isBase64: true });
    } else {
      try {
        const namePart = logoUrl.split("/").pop()?.split("?")[0] || "external_logo.png";
        setUploadedLogoFile({ name: namePart, size: "Direct Link Asset", isBase64: false });
      } catch {
        setUploadedLogoFile({ name: "external_logo.png", size: "Direct Link Asset", isBase64: false });
      }
    }
  }, [logoUrl]);

  const triggerLogoFileSelector = () => {
    if (logoFileInputRef.current) {
      logoFileInputRef.current.click();
    }
  };

  const processLogoFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadLogoError("Invalid file. Please select a valid brand image profile (such as .png, .jpg, or .svg).");
      setUploadLogoNote(null);
      return;
    }

    setUploadLogoError(null);
    setUploadLogoNote(null);
    setIsLogoValid(true);

    const sizeInKB = file.size / 1024;
    const formattedSize = `${sizeInKB.toFixed(1)} KB`;

    setIsUploadingLogo(true);
    uploadToCloudinary(file, "image")
      .then((uploadedUrl) => {
        if (onLogoUrlChange) {
          onLogoUrlChange(uploadedUrl);
          setPreviewLogoUrl(uploadedUrl);
          setCurrentLogoUrl(uploadedUrl);
          setUploadedLogoFile({ name: file.name, size: formattedSize, isBase64: false });
          setUploadLogoNote("Boutique brand logo uploaded to Cloudinary! Loaded seamlessly onto all live storefront instances.");
          if (triggerToast) triggerToast("Brand logo uploaded to Cloudinary successfully!");
        }
      })
      .catch((err) => {
        console.error("Cloudinary logo upload error:", err);
        setUploadLogoError(`Failed to upload to Cloudinary: ${err.message || err}`);
      })
      .finally(() => {
        setIsUploadingLogo(false);
      });
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processLogoFile(e.target.files[0]);
    }
  };

  const handleLogoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverLogo(true);
  };

  const handleLogoDragLeave = () => {
    setDragOverLogo(false);
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverLogo(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processLogoFile(e.dataTransfer.files[0]);
    }
  };

  const handleApplyCustomLogoUrl = () => {
    if (!currentLogoUrl.trim() || !onLogoUrlChange) return;
    setIsLogoValid(true);
    setUploadLogoError(null);
    setUploadLogoNote(null);
    onLogoUrlChange(currentLogoUrl.trim());
    setPreviewLogoUrl(currentLogoUrl.trim());
    if (triggerToast) triggerToast("Updation successful");
  };

  const handleSaveTextIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCompanyName.trim()) return;
    if (onCompanyNameChange) {
      onCompanyNameChange(inputCompanyName.trim().toUpperCase());
    }
    if (onCompanySubtitleChange) {
      onCompanySubtitleChange(inputCompanySubtitle.trim().toUpperCase());
    }
    if (triggerToast) triggerToast("Updation successful");
  };

  const handleResetLogoToDefault = () => {
    if (onLogoUrlChange) {
      setUploadedLogoFile(null);
      setUploadLogoError(null);
      setUploadLogoNote(null);
      setIsLogoValid(true);
      setCurrentLogoUrl(DEFAULT_LOGO);
      onLogoUrlChange(DEFAULT_LOGO);
      setPreviewLogoUrl(DEFAULT_LOGO);
    }
    if (onCompanyNameChange) {
      onCompanyNameChange("MYRA");
      setInputCompanyName("MYRA");
    }
    if (onCompanySubtitleChange) {
      onCompanySubtitleChange("LUXURY");
      setInputCompanySubtitle("LUXURY");
    }
    if (triggerToast) triggerToast("Updation successful");
  };


  // --- CAMPAIGN BANNER PORTION ---
  const [currentBannerUrl, setCurrentBannerUrl] = useState<string>(bannerUrl);
  const [previewBannerUrl, setPreviewBannerUrl] = useState<string>(bannerUrl);
  const [isBannerValid, setIsBannerValid] = useState<boolean>(true);

  const [dragOverBanner, setDragOverBanner] = useState<boolean>(false);
  const [uploadedBannerFile, setUploadedBannerFile] = useState<{ name: string; size: string; isBase64: boolean } | null>(() => {
    if (bannerUrl.startsWith("data:image")) {
      return { name: "custom_campaign_banner.png", size: "~1.2 MB", isBase64: true };
    }
    return null;
  });
  const [uploadBannerError, setUploadBannerError] = useState<string | null>(null);
  const [uploadBannerNote, setUploadBannerNote] = useState<string | null>(null);

  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  const bannerPresets = [
    {
      name: "Luxury Waves (Oceanic)",
      description: "Default signature warm organic sand waves banner",
      thumbnail: "https://res.cloudinary.com/dy7avkqub/image/upload/q_auto/f_auto/v1780835693/samples/waves.png",
    },
    {
      name: "Sensing Gold Sand",
      description: "Silky sand ripples reflecting luxury sunlight",
      thumbnail: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200",
    },
    {
      name: "Abstract Bronze Shimmer",
      description: "Mesmerizing warm luxury liquid satin wave",
      thumbnail: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=1200",
    },
    {
      name: "Ethereal Botanical Leaves",
      description: "Lush soft-focus cream luxury backdrop",
      thumbnail: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&q=80&w=1200",
    }
  ];

  // Sync state if bannerUrl changes externally
  useEffect(() => {
    setCurrentBannerUrl(bannerUrl);
    setPreviewBannerUrl(bannerUrl);

    if (bannerUrl === DEFAULT_BANNER) {
      setUploadedBannerFile(null);
      setUploadBannerError(null);
      setUploadBannerNote(null);
    } else if (bannerUrl.startsWith("data:image")) {
      setUploadedBannerFile({ name: "custom_campaign_banner.png", size: "~1.2 MB", isBase64: true });
    } else {
      try {
        const namePart = bannerUrl.split("/").pop()?.split("?")[0] || "external_banner_image.jpg";
        setUploadedBannerFile({ name: namePart, size: "Direct Image Asset Link", isBase64: false });
      } catch {
        setUploadedBannerFile({ name: "external_banner_image.jpg", size: "Direct Image Asset Link", isBase64: false });
      }
    }
  }, [bannerUrl]);

  const triggerBannerFileSelector = () => {
    if (bannerFileInputRef.current) {
      bannerFileInputRef.current.click();
    }
  };

  const processBannerFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadBannerError("Invalid file type. Please upload a structured image file (such as .png, .jpg, .jpeg, or .webp).");
      setUploadBannerNote(null);
      return;
    }

    setUploadBannerError(null);
    setUploadBannerNote(null);
    setIsBannerValid(true);

    const sizeInMB = file.size / (1024 * 1024);
    const formattedSize = `${sizeInMB.toFixed(2)} MB`;

    setIsUploadingBanner(true);
    uploadToCloudinary(file, "image")
      .then((uploadedUrl) => {
        if (onBannerUrlChange) {
          onBannerUrlChange(uploadedUrl);
          setPreviewBannerUrl(uploadedUrl);
          setCurrentBannerUrl(uploadedUrl);
          setUploadedBannerFile({ name: file.name, size: formattedSize, isBase64: false });
          setUploadBannerNote("Banner uploaded to Cloudinary! Luxury dynamic decoration loaded successfully.");
          if (triggerToast) triggerToast("Campaign banner uploaded to Cloudinary successfully!");
        }
      })
      .catch((err) => {
        console.error("Cloudinary banner upload error:", err);
        setUploadBannerError(`Failed to upload to Cloudinary: ${err.message || err}`);
      })
      .finally(() => {
        setIsUploadingBanner(false);
      });
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processBannerFile(e.target.files[0]);
    }
  };

  const handleBannerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverBanner(true);
  };

  const handleBannerDragLeave = () => {
    setDragOverBanner(false);
  };

  const handleBannerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverBanner(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processBannerFile(e.dataTransfer.files[0]);
    }
  };

  const handleApplyCustomBannerUrl = () => {
    if (!currentBannerUrl.trim() || !onBannerUrlChange) return;
    setIsBannerValid(true);
    setUploadBannerError(null);
    setUploadBannerNote(null);
    onBannerUrlChange(currentBannerUrl.trim());
    setPreviewBannerUrl(currentBannerUrl.trim());
    if (triggerToast) triggerToast("Updation successful");
  };

  const handleResetBannerToDefault = () => {
    if (onBannerUrlChange) {
      setUploadedBannerFile(null);
      setUploadBannerError(null);
      setUploadBannerNote(null);
      setIsBannerValid(true);
      setCurrentBannerUrl(DEFAULT_BANNER);
      onBannerUrlChange(DEFAULT_BANNER);
      setPreviewBannerUrl(DEFAULT_BANNER);
      if (triggerToast) triggerToast("Updation successful");
    }
  };
  
  
  return (
    <div className="space-y-6 animate-reveal text-xs text-stone-600 font-sans" id="media-curator-tab">
      
      {/* Dynamic Sub-navigation control strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-3.5">
        <div className="space-y-1">
          <h3 className="text-sm sm:text-base font-serif font-bold text-stone-900" id="media-curator-title">
            Creative Branding &amp; Media Hub
          </h3>
          <p className="text-[11px] text-stone-500">
            Rotate background wallpapers, curate ambient cinema streams, and design custom company logo &amp; brand parameters.
          </p>
        </div>
        <div className="flex flex-wrap bg-stone-100 rounded-xl p-1 border border-stone-200 gap-1 shrink-0 self-start sm:self-auto shadow-inner">
          <button
            type="button"
            onClick={() => setActiveMode("background")}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-[9px] uppercase font-bold tracking-wider transition-all cursor-pointer ${
              activeMode === "background"
                ? "bg-white text-stone-950 shadow-sm font-extrabold"
                : "text-stone-500 hover:text-stone-850"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Atelier Wallpaper
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("video")}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-[9px] uppercase font-bold tracking-wider transition-all cursor-pointer ${
              activeMode === "video"
                ? "bg-white text-stone-950 shadow-sm font-extrabold"
                : "text-stone-500 hover:text-stone-850"
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            Brand Cinema
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("logo")}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-[9px] uppercase font-bold tracking-wider transition-all cursor-pointer ${
              activeMode === "logo"
                ? "bg-white text-stone-950 shadow-sm font-extrabold"
                : "text-stone-500 hover:text-stone-850"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Company Logo &amp; Identity
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("banner")}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-[9px] uppercase font-bold tracking-wider transition-all cursor-pointer ${
              activeMode === "banner"
                ? "bg-white text-stone-950 shadow-sm font-extrabold"
                : "text-stone-500 hover:text-stone-850"
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            Campaign Banner
          </button>
        </div>
      </div>

      {/* RENDER MODE A: BACKGROUND IMAGE CURATION */}
      {activeMode === "background" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-reveal">
          
          {/* Left Side: Mock layout simulation of Hero backdrop */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase text-stone-800 tracking-wider">Atelier Display Preview</span>
              <span className="px-2 py-0.5 bg-brand-light text-[#8C6239] border border-stone-200 rounded-full font-mono text-[8px] font-bold tracking-widest flex items-center gap-1">
                ACTIVE THEME
              </span>
            </div>

            <div 
              className="relative w-full aspect-square rounded-2xl overflow-hidden bg-stone-950 border border-stone-250 shadow-md flex flex-col justify-end p-5 select-none transition-all duration-500 hover:shadow-lg"
              style={{
                backgroundImage: `linear-gradient(rgba(253, 251, 247, 0.62), rgba(253, 251, 247, 0.62)), url("${previewBgUrl}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              <div className="relative z-10 text-left space-y-2">
                <span className="text-[8px] tracking-[0.2em] uppercase font-extrabold text-[#8F633E] bg-white/50 backdrop-blur-xs px-2 py-1 rounded">
                  Private Lifestlye Atelier
                </span>
                <h4 className="text-stone-950 font-serif font-bold text-xl tracking-tight leading-tight">
                  Luxury Crafted <br/>
                  <span className="text-[#8F633E] font-medium italic">For Your Aura</span>
                </h4>
                <p className="text-[9.5px] text-stone-600 max-w-[200px] leading-relaxed">
                  Discover elegant perfumes, premium leather accessories, and handmade herbal soaps.
                </p>
                <div className="flex gap-1.5 pt-1">
                  <div className="w-16 h-6 bg-stone-950 rounded-md shadow-xs opacity-70" />
                  <div className="w-16 h-6 border border-stone-400 bg-white/40 rounded-md" />
                </div>
              </div>

              {/* Watermark badge */}
              <div className="absolute top-4 left-4 bg-black/45 backdrop-blur-md border border-white/10 px-3 py-1 rounded-xl pointer-events-none">
                <span className="text-[7.5px] font-mono tracking-[0.2em] text-white/90">HERO WALLPAPER</span>
              </div>
            </div>

            <p className="text-[10px] text-stone-400 font-medium italic text-center">
              Your modifications update immediately on the collection storefront.
            </p>
          </div>

          {/* Right Side: Primary interactive tools & selector */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* 1. SEAMLESS PRESETER SWATCHES */}
            <div className="space-y-2.5 bg-[#FAF9F6] border border-stone-200 rounded-2xl p-4.5">
              <span className="font-bold uppercase text-stone-800 tracking-wider">Bespoke Textures &amp; Atmospheres</span>
              <p className="text-[10.5px] text-stone-500">
                Select from our curated high-fashion atelier atmospheres for near-instant visual re-styling:
              </p>

              <div className="grid grid-cols-2 gap-3 pt-1">
                {bgPresets.map((preset) => {
                  const isSelected = previewBgUrl === preset.thumbnail;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        if (onHeroBgUrlChange) {
                          onHeroBgUrlChange(preset.thumbnail);
                          setPreviewBgUrl(preset.thumbnail);
                          setCurrentBgUrl(preset.thumbnail);
                          setUploadedBgFile({ name: preset.name, size: "Internal Asset", isBase64: false });
                          setUploadBgNote(null);
                          setUploadBgError(null);
                          if (triggerToast) triggerToast("Updation successful");
                        }
                      }}
                      className={`group relative text-left border rounded-xl overflow-hidden p-2.5 transition-all outline-none ${
                        isSelected 
                          ? "border-[#8F633E] bg-[#FAF6F0] shadow-sm select-none" 
                          : "border-stone-200 bg-white hover:border-stone-400 cursor-pointer"
                      }`}
                    >
                      <div className="flex gap-2.5 items-center">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-100 shrink-0 border border-stone-200 shadow-inner">
                          <img 
                            src={preset.thumbnail} 
                            alt={preset.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="overflow-hidden space-y-0.5">
                          <h5 className="font-serif font-extrabold text-stone-900 text-[10.5px] leading-tight truncate">
                            {preset.name}
                          </h5>
                          <p className="text-[9px] text-stone-400 leading-tight truncate">
                            {preset.description}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-[#8F633E] text-white p-0.5 rounded-full">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. CUSTOM DEVICE PHOTO DRAG & DROP */}
            <div className="space-y-2.5">
              <span className="font-bold uppercase text-stone-800 tracking-wider">Upload Custom Wallpaper</span>
              
              <div
                onDragOver={isUploadingBg ? undefined : handleBgDragOver}
                onDragLeave={isUploadingBg ? undefined : handleBgDragLeave}
                onDrop={isUploadingBg ? undefined : handleBgDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[200px] select-none ${
                  isUploadingBg ? "opacity-60 bg-stone-50 border-stone-200" :
                  dragOverBg 
                    ? "border-[#C68B59] bg-[#FAF6F0]" 
                    : "border-stone-255 bg-white hover:border-stone-400"
                }`}
              >
                <input
                  type="file"
                  ref={bgFileInputRef}
                  onChange={handleBgFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <div className="w-11 h-11 rounded-full bg-stone-50 text-stone-600 flex items-center justify-center mb-2.5 border border-stone-100">
                  {isUploadingBg ? (
                    <div className="w-5.5 h-5.5 border-2 border-[#C68B59]/30 border-t-[#C68B59] rounded-full animate-spin" />
                  ) : (
                    <UploadCloud className="w-5.5 h-5.5 text-stone-400" />
                  )}
                </div>

                <p className="text-stone-900 font-serif font-bold text-xs mb-1">
                  {isUploadingBg ? "Uploading Wallpaper to Cloudinary..." : "Drag & Drop Your Custom Wallpaper Here"}
                </p>
                
                <p className="text-[10px] text-stone-500 mb-4 max-w-xs leading-relaxed">
                  Automatically uploads securely to your brand's Cloudinary storage for high-performance global CDN delivery.
                </p>

                <button
                  type="button"
                  id="select-computer-bg-btn"
                  onClick={triggerBgFileSelector}
                  disabled={isUploadingBg}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-[#8F633E] text-white rounded-xl text-[10px] uppercase font-bold tracking-wider transition-all shadow-sm flex items-center gap-1.5 cursor-pointer min-h-[40px] disabled:opacity-50"
                >
                  {isUploadingBg ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Uploading File...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-3.5 h-3.5 text-stone-300" />
                      Select Wallpaper File
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 3. UPLOAD STATUS MONITOR */}
            {uploadedBgFile && (
              <div className="bg-[#FAF8F5] border border-stone-200/80 rounded-2xl p-4 flex items-start gap-3.5 animate-reveal">
                <div className="p-2 bg-stone-100 rounded-lg text-stone-600 border border-stone-200/50">
                  <ImageIcon className="w-5 h-5 text-stone-500" />
                </div>
                <div className="flex-1 space-y-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-stone-955 truncate pr-2 block">
                      {uploadedBgFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={handleClearBgUpload}
                      className="p-1 hover:bg-stone-200/50 rounded-lg text-stone-400 hover:text-red-650 transition-all cursor-pointer"
                      title="Reset Wallpaper"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-stone-500">
                    <span>File Volume: <strong className="text-stone-700 font-semibold">{uploadedBgFile.size}</strong></span>
                    {uploadedBgFile.isBase64 ? (
                      <span className="px-1.5 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded font-mono text-[8px] font-bold">
                        Clipped to local storage
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-amber-50 text-amber-500 border border-amber-100 rounded font-mono text-[8px] font-bold">
                        Active preset
                      </span>
                    )}
                  </div>

                  {uploadBgNote && (
                    <div className="text-[9.5px] text-stone-500 leading-normal bg-white border border-stone-200 p-2 rounded-xl mt-2 flex items-start gap-1">
                      <Info className="w-3 h-3 text-[#C68B59] shrink-0 mt-0.5" />
                      <span>{uploadBgNote}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {uploadBgError && (
              <div className="bg-red-50/50 border border-red-200 text-red-800 rounded-2xl p-4 text-[10.5px] leading-relaxed flex items-start gap-2 animate-reveal">
                <span className="font-bold">Error:</span>
                <span>{uploadBgError}</span>
              </div>
            )}

            {/* 4. LINK PASTER */}
            <div className="bg-white border border-stone-200 rounded-2xl p-4.5 space-y-3.5 shadow-xs">
              <div className="space-y-1">
                <span className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-stone-450" />
                  Custom Image Feed Address (URL)
                </span>
                <p className="text-[10.5px] text-stone-500 leading-relaxed">
                  Have an image hosted online? You can paste its absolute direct link below to render it on your front page:
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/your-custom-luxury-shot.jpg"
                  value={currentBgUrl.startsWith("data:") ? "" : currentBgUrl}
                  onChange={(e) => {
                    setIsBgValid(true);
                    setCurrentBgUrl(e.target.value);
                  }}
                  className="flex-1 bg-stone-50 border border-stone-250 rounded-xl px-3.5 py-2.5 text-stone-900 text-[11px] placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white font-mono"
                />
                <button
                  type="button"
                  id="apply-campaign-bg-url-btn"
                  onClick={handleApplyCustomBgUrl}
                  disabled={!currentBgUrl.trim() || currentBgUrl.startsWith("data:")}
                  className="px-4 py-2.5 bg-stone-950 hover:bg-stone-850 text-white text-[10px] font-black rounded-xl uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer min-h-[40px] flex items-center"
                >
                  Save link
                </button>
              </div>
            </div>

            {/* Restore option */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleResetBgToDefault}
                disabled={previewBgUrl === DEFAULT_BG}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-stone-200 hover:bg-stone-50 disabled:opacity-40 text-stone-700 rounded-xl text-[10.5px] uppercase font-bold tracking-wider transition-colors cursor-pointer min-h-[40px]"
              >
                <RefreshCw className="w-3 h-3 text-stone-400" />
                Restore Default Wallpaper
              </button>
            </div>

          </div>

        </div>
      )}

      {/* RENDER MODE B: CINEMATIC VIDEO */}
      {activeMode === "video" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-reveal">
          
          {/* Left Side: Live Feedback Presentation Board (Live Player in action) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase text-stone-800 tracking-wider">Atelier Display Preview</span>
              <span className="px-2 py-0.5 bg-stone-900 text-stone-100 border border-stone-800 rounded-full font-mono text-[8px] font-bold tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" />
                LIVE VIDEO
              </span>
            </div>

            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-stone-950 border border-stone-250 shadow-md flex items-center justify-center">
              {isUrlValid ? (
                <video
                  key={previewUrl}
                  src={previewUrl}
                  className="w-full h-full object-cover opacity-90"
                  autoPlay
                  loop
                  muted
                  playsInline
                  onError={() => setIsUrlValid(false)}
                />
              ) : (
                <div className="p-6 text-center text-stone-400 flex flex-col items-center justify-center space-y-2">
                  <p className="text-stone-300 font-bold uppercase tracking-widest text-[9px] text-red-100">Unable to Stream Video</p>
                  <p className="text-[10px] text-stone-500 max-w-xs leading-relaxed">
                    The loaded URL or binary profile can not be read. Please upload an alternative .mp4 campaign video clip.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsUrlValid(true)}
                    className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-100 rounded-xl text-[10px] uppercase tracking-wider font-extrabold cursor-pointer"
                  >
                    Clear stream &amp; Retest
                  </button>
                </div>
              )}

              {/* Watermark over video screen */}
              <div className="absolute bottom-4 left-4 bg-black/45 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-xl flex items-center gap-2 select-none pointer-events-none">
                <span className="text-[8px] font-mono tracking-[0.25em] text-white/90">MYRA CAMPAIGN LOOP</span>
              </div>
            </div>

            <p className="text-[10px] text-stone-400 font-medium italic text-center">
              Any alterations are live! Preview your frontpage cinematic player.
            </p>
          </div>

          {/* Right Side: Primary Upload controls */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* DRAG AND DROP FILE ZONE */}
            <div className="space-y-2.5">
              <span className="font-bold uppercase text-stone-800 tracking-wider">Device File Integrator</span>
              
              <div
                onDragOver={isUploadingVideo ? undefined : handleDragOver}
                onDragLeave={isUploadingVideo ? undefined : handleDragLeave}
                onDrop={isUploadingVideo ? undefined : handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[220px] select-none ${
                  isUploadingVideo ? "opacity-60 bg-stone-50 border-stone-200" :
                  dragOver 
                    ? "border-[#C68B59] bg-[#FAF6F0]" 
                    : "border-stone-250 bg-white hover:border-stone-400"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="video/*"
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-full bg-stone-50 text-stone-600 flex items-center justify-center mb-3 border border-stone-100">
                  {isUploadingVideo ? (
                    <div className="w-6 h-6 border-2 border-[#C68B59]/30 border-t-[#C68B59] rounded-full animate-spin" />
                  ) : (
                    <UploadCloud className="w-6 h-6 text-stone-400" />
                  )}
                </div>

                <p className="text-stone-900 font-serif font-bold text-xs mb-1">
                  {isUploadingVideo ? "Uploading Cinema to Cloudinary..." : "Drag & Drop Your Campaign Video Here"}
                </p>
                
                <p className="text-[10px] text-stone-500 mb-4 max-w-xs leading-relaxed">
                  Instantly uploads to your Cloudinary dashboard. Fully persistent streaming with zero local buffer weight.
                </p>

                <button
                  type="button"
                  id="select-computer-video-btn"
                  onClick={triggerFileSelector}
                  disabled={isUploadingVideo}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-[#8F633E] hover:bg-stone-800 active:bg-stone-950 text-white rounded-xl text-[10px] uppercase font-bold tracking-wider transition-all shadow-sm flex items-center gap-1.5 cursor-pointer min-h-[40px] select-none disabled:opacity-50"
                >
                  {isUploadingVideo ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Uploading File...
                    </>
                  ) : (
                    <>
                      <FileVideo className="w-3.5 h-3.5 text-stone-300" />
                      Select File From Folders
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* UPLOAD STATUS MONITOR */}
            {uploadedFile && (
              <div className="bg-[#FAF8F5] border border-stone-200/80 rounded-2xl p-4 flex items-start gap-3.5 animate-reveal">
                <div className="p-2 bg-stone-100 rounded-lg text-stone-600 border border-stone-200/50">
                  <FileVideo className="w-5 h-5 text-stone-500" />
                </div>
                <div className="flex-1 space-y-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-stone-955 truncate pr-2 block">
                      {uploadedFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={handleClearUpload}
                      className="p-1 hover:bg-stone-200/50 rounded-lg text-stone-400 hover:text-red-655 transition-all cursor-pointer"
                      title="Remove File Upload"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-stone-500">
                    <span>File Volume: <strong className="text-stone-700 font-semibold">{uploadedFile.size}</strong></span>
                    {uploadedFile.isBase64 ? (
                      <span className="px-1.5 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded font-mono text-[8px] font-bold">
                        Stored in LocalDB
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded font-mono text-[8px] font-bold">
                        Local Speed Stream
                      </span>
                    )}
                  </div>

                  {uploadNote && (
                    <div className="text-[9.5px] text-stone-500 leading-normal bg-white border border-stone-205 p-2 rounded-xl mt-2 flex items-start gap-1">
                      <Info className="w-3 h-3 text-[#C68B59] shrink-0 mt-0.5" />
                      <span>{uploadNote}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {uploadError && (
              <div className="bg-red-50/50 border border-red-200 text-red-800 rounded-2xl p-4 text-[10.5px] leading-relaxed flex items-start gap-2">
                <span className="font-bold">Error:</span>
                <span>{uploadError}</span>
              </div>
            )}

            {/* BACKUP OPTION: CUSTOM MEDIA URL */}
            <div className="bg-white border border-stone-200 rounded-2xl p-4.5 space-y-3.5 shadow-xs font-sans">
              <div className="space-y-1">
                <span className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-stone-450" />
                  Custom Video Stream Route
                </span>
                <p className="text-[10.5px] text-stone-500 leading-relaxed">
                  Alternatively, paste direct video endpoint files hosting commercial trailers (.mp4 feed URL) to link external server assets:
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://yourserver/campaign.mp4"
                  value={currentUrl.startsWith("data:") || currentUrl.startsWith("blob:") ? "" : currentUrl}
                  onChange={(e) => {
                    setIsUrlValid(true);
                    setCurrentUrl(e.target.value);
                  }}
                  className="flex-1 bg-stone-50 border border-stone-250 rounded-xl px-3.5 py-2.5 text-stone-900 text-[11px] placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white font-mono"
                />
                <button
                  type="button"
                  id="apply-campaign-video-url-btn"
                  onClick={handleApplyCustomUrl}
                  disabled={!currentUrl.trim() || currentUrl.startsWith("data:") || currentUrl.startsWith("blob:")}
                  className="px-4 py-2.5 bg-stone-950 hover:bg-stone-850 text-white text-[10px] font-black rounded-xl uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer min-h-[40px] flex items-center shadow-sm"
                >
                  Save link
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                id="restore-video-default-btn"
                onClick={handleResetToDefault}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-[10.5px] uppercase font-bold tracking-wider transition-colors cursor-pointer min-h-[40px]"
              >
                <RefreshCw className="w-3 h-3 text-stone-400" />
                Restore Default Video
              </button>
            </div>

          </div>

        </div>
      )}

      {/* RENDER MODE C: COMPANY LOGO & IDENTITY CURATION */}
      {activeMode === "logo" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-reveal font-sans">
          
          {/* Left Side: Brand presentation board and navbar preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase text-stone-850 tracking-wider">Storefront Identity Preview</span>
              <span className="px-2 py-0.5 bg-[#FAF6F0] text-[#8C6239] border border-stone-250 rounded-full font-mono text-[8px] font-bold tracking-widest uppercase">
                Live Rendering
              </span>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-4 shadow-sm select-none">
              
              {/* Navbar simulated preview */}
              <div className="space-y-1.5 pb-3.5 border-b border-stone-200/60">
                <span className="text-[8px] font-semibold text-stone-400 block uppercase tracking-widest">Simulated Sticky Header</span>
                <div className="p-3 bg-white/70 backdrop-blur-md border border-stone-200/50 rounded-full flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center border border-stone-200 bg-stone-50 shadow-inner">
                      <img 
                        src={previewLogoUrl} 
                        alt="Logo" 
                        className="w-full h-full object-cover rounded-full" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-serif font-black tracking-widest text-stone-900 leading-none">
                        {inputCompanyName || "MYRA"}
                      </span>
                      <span className="text-[6.5px] font-sans font-bold tracking-widest text-[#8C6239] leading-none mt-0.5">
                        {inputCompanySubtitle || "LUXURY"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-stone-100" />
                    <div className="w-2.5 h-2.5 rounded-full bg-stone-100" />
                    <div className="w-6 h-4.5 rounded-full bg-stone-900" />
                  </div>
                </div>
              </div>

              {/* simulated gift ribbon/crest */}
              <div className="space-y-1.5 pb-3.5 border-b border-stone-200/60">
                <span className="text-[8px] font-semibold text-stone-400 block uppercase tracking-widest">Plaque / Gift Set Crest</span>
                <div className="p-4 bg-stone-900 rounded-xl flex items-center gap-3.5 border border-white/10 shadow hover:border-amber-500/20 transition-all duration-300">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-white border border-[#D4AF37]/40 shadow p-0.5 shrink-0 flex items-center justify-center">
                    <img 
                      src={previewLogoUrl} 
                      alt="Brand Logo" 
                      className="w-full h-full object-cover rounded-full" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase tracking-widest text-amber-200 font-serif font-bold block">{inputCompanyName || "MYRA"} CREST</span>
                    <span className="text-[8px] text-stone-400 block">Exquisite Dual curation signature</span>
                  </div>
                </div>
              </div>

              {/* Large Slogan representation */}
              <div className="space-y-1">
                <span className="text-[8px] font-semibold text-stone-400 block uppercase tracking-widest">Footer Watermark Presentation</span>
                <div className="p-4 bg-[#FAF9F6] border border-stone-200 rounded-xl text-center space-y-1.5">
                  <div className="w-7 h-7 rounded-full overflow-hidden border border-[#8C6239]/20 shadow-xs mx-auto flex items-center justify-center p-0.5">
                    <img 
                      src={previewLogoUrl} 
                      alt="Logo" 
                      className="w-full h-full object-cover rounded-full" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h5 className="text-[9.5px] uppercase tracking-widest font-extrabold text-[#8C6239]">
                    &copy; {new Date().getFullYear()} {inputCompanyName} {inputCompanySubtitle} S.p.A.
                  </h5>
                  <p className="text-[8px] text-stone-400 leading-normal font-sans">
                    All curate digital placements update dynamically. Check your changes across client sessions!
                  </p>
                </div>
              </div>

            </div>

            <p className="text-[10px] text-stone-400 font-medium italic text-center">
              Alterations persist instantly via local storage. 
            </p>
          </div>

          {/* Right Side: Identity Name Editor + Logo Uploaders */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* 1. TEXT IDENTITIES ENHANCEMENT */}
            <form onSubmit={handleSaveTextIdentity} className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4 shadow-xs">
              <span className="font-bold uppercase text-stone-900 tracking-wider flex items-center gap-1.5 text-xs">
                <Type className="w-4 h-4 text-stone-500" />
                Company Brand Titles
              </span>
              <p className="text-[10.5px] text-stone-500 leading-normal">
                Define the primary name text representing your brand in navigation headers, footer credentials, and notification templates:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-stone-800 tracking-wide">Company Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MYRA"
                    value={inputCompanyName}
                    onChange={(e) => setInputCompanyName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-250 rounded-xl px-3.5 py-2.5 text-stone-900 text-[11px] placeholder-stone-400 font-bold tracking-widest uppercase focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-stone-800 tracking-wide">Brand Subtitle</label>
                  <input
                    type="text"
                    placeholder="e.g. LUXURY"
                    value={inputCompanySubtitle}
                    onChange={(e) => setInputCompanySubtitle(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-250 rounded-xl px-3.5 py-2.5 text-stone-900 text-[11px] placeholder-stone-400 font-semibold tracking-wider uppercase focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={!inputCompanyName.trim() || (inputCompanyName === companyName && inputCompanySubtitle === companySubtitle)}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-[#8F633E] disabled:opacity-40 text-white rounded-xl text-[10px] uppercase font-bold tracking-wider transition-all shadow-sm cursor-pointer min-h-[40px] flex items-center select-none"
                >
                  Save Text Identity
                </button>
              </div>
            </form>

            {/* 2. CHOOSE AMBIENT PRESETS */}
            <div className="space-y-2.5 bg-[#FAF9F6] border border-stone-200 rounded-2xl p-4.5">
              <span className="font-bold uppercase text-stone-800 tracking-wider text-[11px]">Bespoke Logo Presets</span>
              <p className="text-[10.5px] text-stone-500">
                Instantly trigger gorgeous minimal luxury logos created by atelier graphic designers:
              </p>

              <div className="grid grid-cols-2 gap-3 pt-1">
                {logoPresets.map((preset) => {
                  const isSelected = previewLogoUrl === preset.thumbnail;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        if (onLogoUrlChange) {
                          onLogoUrlChange(preset.thumbnail);
                          setPreviewLogoUrl(preset.thumbnail);
                          setCurrentLogoUrl(preset.thumbnail);
                          setUploadedLogoFile({ name: preset.name, size: "System Preset", isBase64: false });
                          setUploadLogoNote(null);
                          setUploadLogoError(null);
                          if (triggerToast) triggerToast("Updation successful");
                        }
                      }}
                      className={`group relative text-left border rounded-xl overflow-hidden p-2.5 transition-all outline-none ${
                        isSelected 
                          ? "border-[#8F633E] bg-[#FAF6F0] shadow-sm select-none" 
                          : "border-stone-200 bg-white hover:border-stone-400 cursor-pointer"
                      }`}
                    >
                      <div className="flex gap-2.5 items-center">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-white shrink-0 border border-stone-200 shadow-inner p-0.5">
                          <img 
                            src={preset.thumbnail} 
                            alt={preset.name} 
                            className="w-full h-full object-cover rounded-full transition-transform duration-500 group-hover:scale-105" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="overflow-hidden space-y-0.5">
                          <h5 className="font-serif font-extrabold text-stone-900 text-[10px] leading-tight truncate">
                            {preset.name}
                          </h5>
                          <p className="text-[8.5px] text-stone-400 leading-tight truncate">
                            {preset.style}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-[#8F633E] text-white p-0.5 rounded-full">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. UPLOAD CUSTOM GRAPHIC DECOR */}
            <div className="space-y-2.5">
              <span className="font-bold uppercase text-stone-850 tracking-wider">Device Logo Integrator</span>
              
              <div
                onDragOver={isUploadingLogo ? undefined : handleLogoDragOver}
                onDragLeave={isUploadingLogo ? undefined : handleLogoDragLeave}
                onDrop={isUploadingLogo ? undefined : handleLogoDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[190px] select-none ${
                  isUploadingLogo ? "opacity-60 bg-stone-50 border-stone-200" :
                  dragOverLogo 
                    ? "border-[#C68B59] bg-[#FAF6F0]" 
                    : "border-stone-250 bg-white hover:border-stone-400"
                }`}
              >
                <input
                  type="file"
                  ref={logoFileInputRef}
                  onChange={handleLogoFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <div className="w-11 h-11 rounded-full bg-stone-50 text-stone-600 flex items-center justify-center mb-2.5 border border-stone-100">
                  {isUploadingLogo ? (
                    <div className="w-5.5 h-5.5 border-2 border-[#C68B59]/30 border-t-[#C68B59] rounded-full animate-spin" />
                  ) : (
                    <UploadCloud className="w-5.5 h-5.5 text-stone-400" />
                  )}
                </div>

                <p className="text-stone-900 font-serif font-bold text-xs mb-1">
                  {isUploadingLogo ? "Uploading Logo to Cloudinary..." : "Drag & Drop Your Brand Logo Graphic Here"}
                </p>
                
                <p className="text-[10px] text-stone-500 mb-4 max-w-xs leading-relaxed">
                  Secures your luxurious visual watermark permanently onto highly optimized Cloudinary servers.
                </p>

                <button
                  type="button"
                  id="select-computer-logo-btn"
                  onClick={triggerLogoFileSelector}
                  disabled={isUploadingLogo}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-[#8F633E] text-white rounded-xl text-[10px] uppercase font-bold tracking-wider transition-all shadow-sm flex items-center gap-1.5 cursor-pointer min-h-[40px] select-none disabled:opacity-50"
                >
                  {isUploadingLogo ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Uploading File...
                    </>
                  ) : (
                    <>
                      <Award className="w-3.5 h-3.5 text-stone-350" />
                      Select Computer Image
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* STATUS MONITOR */}
            {uploadedLogoFile && (
              <div className="bg-[#FAF8F5] border border-stone-200/80 rounded-2xl p-4 flex items-start gap-3.5 animate-reveal">
                <div className="p-2 bg-stone-100 rounded-lg border border-stone-200/50 flex items-center justify-center">
                  <img src={previewLogoUrl} alt="" className="w-6 h-6 object-cover rounded-full" />
                </div>
                <div className="flex-1 space-y-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-stone-955 truncate pr-2 block">
                      {uploadedLogoFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={handleResetLogoToDefault}
                      className="p-1 hover:bg-stone-200/50 rounded-lg text-stone-400 hover:text-red-650 transition-all cursor-pointer"
                      title="Reset Brand Logo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-stone-500">
                    <span>File Volume: <strong className="text-stone-700 font-semibold">{uploadedLogoFile.size}</strong></span>
                    {uploadedLogoFile.isBase64 ? (
                      <span className="px-1.5 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded font-mono text-[8px] font-bold">
                        Compiled to local cache
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded font-mono text-[8px] font-bold font-semibold">
                        Custom preset active
                      </span>
                    )}
                  </div>

                  {uploadLogoNote && (
                    <div className="text-[9.5px] text-stone-500 leading-normal bg-white border border-stone-200 p-2 rounded-xl mt-2 flex items-start gap-1">
                      <Info className="w-3 h-3 text-[#C68B59] shrink-0 mt-0.5" />
                      <span>{uploadLogoNote}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {uploadLogoError && (
              <div className="bg-red-50/50 border border-red-200 text-red-800 rounded-2xl p-4 text-[10.5px] leading-relaxed flex items-start gap-2 animate-reveal">
                <span className="font-bold">Error:</span>
                <span>{uploadLogoError}</span>
              </div>
            )}

            {/* 4. LINK PASTER */}
            <div className="bg-white border border-stone-200 rounded-2xl p-4.5 space-y-3.5 shadow-xs">
              <div className="space-y-1">
                <span className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-stone-450" />
                  Logo Image Feed Address (URL)
                </span>
                <p className="text-[10.5px] text-stone-500 leading-relaxed">
                  Have your brand logo hosted somewhere online? Paste its direct, accessible file path URL below:
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://yourserver/yourlogo-transparent.png"
                  value={currentLogoUrl.startsWith("data:") ? "" : currentLogoUrl}
                  onChange={(e) => {
                    setIsLogoValid(true);
                    setCurrentLogoUrl(e.target.value);
                  }}
                  className="flex-1 bg-stone-50 border border-stone-250 rounded-xl px-3.5 py-2.5 text-stone-900 text-[11px] placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white font-mono"
                />
                <button
                  type="button"
                  id="apply-campaign-logo-url-btn"
                  onClick={handleApplyCustomLogoUrl}
                  disabled={!currentLogoUrl.trim() || currentLogoUrl.startsWith("data:")}
                  className="px-4 py-2.5 bg-stone-950 hover:bg-stone-850 text-white text-[10px] font-black rounded-xl uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer min-h-[40px] flex items-center"
                >
                  Save URL
                </button>
              </div>
            </div>

            {/* RESTORE BOUTIQUE OPTIONS */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleResetLogoToDefault}
                disabled={previewLogoUrl === DEFAULT_LOGO && companyName === "MYRA" && companySubtitle === "LUXURY"}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-stone-200 hover:bg-stone-50 disabled:opacity-40 text-stone-700 rounded-xl text-[10.5px] uppercase font-bold tracking-wider transition-colors cursor-pointer min-h-[40px]"
              >
                <RefreshCw className="w-3 h-3 text-stone-400" />
                Restore Default Logo &amp; Identity
              </button>
            </div>

          </div>

        </div>
      )}

      {/* RENDER MODE D: CAMPAIGN BANNER CURATION */}
      {activeMode === "banner" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-reveal text-xs text-stone-600 font-sans">
          
          {/* Left Side: Mock layout simulation of the Active storefront Campaign Banner */}
          <div className="lg:col-span-5 space-y-3">
            <span className="font-bold uppercase text-stone-800 tracking-wider">Live Banner View Mockup</span>
            
            <div className="border border-stone-200 bg-[#FCF8F5] rounded-3xl p-4.5 space-y-4 shadow-sm relative overflow-hidden">
              <span className="text-[9px] uppercase tracking-widest text-stone-400 font-bold block">Front Desk Simulator</span>
              
              {/* Actual banner card clone as visible on store wrapper */}
              <div className="relative rounded-2xl overflow-hidden shadow-md border border-stone-200/40 w-full bg-stone-100 flex flex-col items-center justify-center">
                <div className="w-full h-auto overflow-hidden relative">
                  <img 
                    src={previewBannerUrl} 
                    alt="Waves of Luxury"
                    className="w-full h-auto object-contain block filter brightness-[1.01] contrast-[1.02] luxury-banner-pulse"
                    referrerPolicy="no-referrer"
                  />
                  {/* Sliding gloss sweep overlay */}
                  <div className="absolute inset-y-0 left-0 w-1/3 luxury-banner-sheen pointer-events-none z-1" />
                  
                  {/* Vignette overlay */}
                  <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/5 pointer-events-none z-1" />
                </div>
                
                {/* Frame border */}
                <div className="absolute inset-2 border border-white/20 rounded-lg pointer-events-none z-2" />
              </div>

              <div className="rounded-xl bg-orange-50/50 border border-orange-100 p-3 flex gap-2.5 items-start">
                <Info className="w-3.5 h-3.5 text-[#8C6239] shrink-0 mt-0.5" />
                <div className="space-y-1 text-stone-600 leading-relaxed text-[10.5px]">
                  <p className="font-semibold text-stone-900">Campaign Banner Context</p>
                  <p>
                    This is the dynamic graphical canvas visible right above the <strong className="text-stone-800">Luxury Gift Sets</strong> layout. Swap it dynamically here using our handpicked luxury wave presets or upload a custom visual.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Configuration console */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* 1. BRAND NEW DESIGN PRESETS */}
            <div className="bg-white border border-stone-200 rounded-2xl p-4.5 space-y-3.5 shadow-xs">
              <div className="space-y-1">
                <span className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#D1A054]" />
                  Curated Banner Waves (Presets)
                </span>
                <p className="text-[10.5px] text-stone-500 font-light">
                  Instantly refresh the look of your boutique using our beautifully optimized high-contrast seasonal branding canvases:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {bannerPresets.map((preset, index) => {
                  const isSelected = previewBannerUrl === preset.thumbnail;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        if (onBannerUrlChange) {
                          onBannerUrlChange(preset.thumbnail);
                          if (triggerToast) triggerToast("Updation successful");
                        }
                      }}
                      className={`text-left rounded-xl border p-2.5 flex items-center gap-3 transition-all duration-300 cursor-pointer ${
                        isSelected 
                          ? "bg-[#FCF8F5] border-[#8C6239] shadow-xs" 
                          : "bg-stone-50 border-stone-200 hover:border-stone-350 hover:bg-white"
                      }`}
                    >
                      <div className="w-14 h-10 rounded-lg overflow-hidden shrink-0 border border-stone-200 relative bg-stone-100">
                        <img src={preset.thumbnail} alt="" className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-[#8C6239]/20 flex items-center justify-center">
                            <div className="bg-white rounded-full p-0.5 shadow-sm">
                              <Check className="w-2.5 h-2.5 text-leather-tan stroke-[3px]" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <span className="font-bold text-stone-900 text-[10.5px] block truncate">{preset.name}</span>
                        <span className="text-[9px] text-stone-400 block truncate">{preset.description}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. DRAG AND DROP / CUSTOM UPLOAD ARCHITECTURE */}
            <div className="bg-white border border-stone-200 rounded-2xl p-4.5 space-y-3.5 shadow-xs">
              <div className="space-y-1">
                <span className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <UploadCloud className="w-3.5 h-3.5 text-stone-450" />
                  Upload Custom Banner Image
                </span>
                <p className="text-[10.5px] text-stone-500 font-light">
                  Select or drag-and-drop a beautiful custom wave banner. Recommended resolution: <strong className="text-stone-700">1200x400</strong>.
                </p>
              </div>

              {/* Box */}
              <div
                onDragOver={isUploadingBanner ? undefined : handleBannerDragOver}
                onDragLeave={isUploadingBanner ? undefined : handleBannerDragLeave}
                onDrop={isUploadingBanner ? undefined : handleBannerDrop}
                onClick={isUploadingBanner ? undefined : triggerBannerFileSelector}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center gap-2 ${
                  isUploadingBanner ? "opacity-60 bg-stone-150 border-stone-200" :
                  dragOverBanner 
                    ? "border-leather-tan bg-[#FCF8F5] cursor-pointer" 
                    : "border-stone-255 bg-stone-50 hover:bg-stone-100/50 hover:border-stone-350 cursor-pointer"
                }`}
              >
                <input
                  type="file"
                  ref={bannerFileInputRef}
                  onChange={handleBannerFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-stone-400 shadow-xs border border-stone-150">
                  {isUploadingBanner ? (
                    <div className="w-5 h-5 border-2 border-[#C68B59]/30 border-t-[#C68B59] rounded-full animate-spin" />
                  ) : (
                    <UploadCloud className="w-5 h-5 text-stone-450" />
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-stone-900 text-[11px] font-bold">
                    {isUploadingBanner ? "Uploading Banner to Cloudinary..." : "Click to browse files or drop image here"}
                  </p>
                  <p className="text-stone-450 text-[9.5px]">
                    {isUploadingBanner ? "Securing visual header to highly optimized CDN stream." : "PNG, JPEG, WEBP files up to 4.5 MB of premium allocation"}
                  </p>
                </div>
              </div>

              {/* Uploaded File status bar */}
              {uploadedBannerFile && (
                <div className="rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded bg-stone-200 overflow-hidden shrink-0">
                      <img src={previewBannerUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-stone-900 font-bold truncate">{uploadedBannerFile.name}</p>
                      <p className="text-stone-400 text-[9px]">{uploadedBannerFile.size}</p>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleResetBannerToDefault}
                    className="p-1 text-stone-400 hover:text-red-300 rounded transition-colors cursor-pointer"
                    title="Remove custom banner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {uploadBannerNote && (
                <div className="p-2.5 bg-green-50 border border-green-100 rounded-xl text-green-800 text-[10px] leading-relaxed animate-reveal">
                  {uploadBannerNote}
                </div>
              )}

              {uploadBannerError && (
                <div className="p-2.5 bg-red-50 border border-red-150 rounded-xl text-red-750 text-[10px] leading-relaxed flex items-start gap-1 animate-reveal">
                  <span className="font-bold text-red-900">Error:</span>
                  <span>{uploadBannerError}</span>
                </div>
              )}
            </div>

            {/* 3. URL PASTER */}
            <div className="bg-white border border-stone-200 rounded-2xl p-4.5 space-y-3.5 shadow-xs">
              <div className="space-y-1">
                <span className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-stone-450" />
                  Custom Banner URL
                </span>
                <p className="text-[10.5px] text-stone-500 font-light">
                  Prefer a direct remote image host? Paste any direct image link address below:
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://yourserver/your-custom-banner.png"
                  value={currentBannerUrl.startsWith("data:") ? "" : currentBannerUrl}
                  onChange={(e) => {
                    setIsBannerValid(true);
                    setCurrentBannerUrl(e.target.value);
                  }}
                  className="flex-1 bg-stone-50 border border-stone-250 rounded-xl px-3.5 py-2.5 text-stone-900 text-[11px] placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white font-mono animate-reveal"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomBannerUrl}
                  disabled={!currentBannerUrl.trim() || currentBannerUrl.startsWith("data:")}
                  className="px-4 py-2.5 bg-stone-950 hover:bg-stone-850 text-white text-[10px] font-black rounded-xl uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer min-h-[40px] flex items-center"
                >
                  Save URL
                </button>
              </div>
            </div>

            {/* RESTORE BOUTIQUE OPTIONS */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleResetBannerToDefault}
                disabled={previewBannerUrl === DEFAULT_BANNER}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-stone-200 hover:bg-stone-50 disabled:opacity-40 text-stone-700 rounded-xl text-[10.5px] uppercase font-bold tracking-wider transition-colors cursor-pointer min-h-[40px]"
              >
                <RefreshCw className="w-3 h-3 text-stone-400" />
                Restore Default Signature Banner
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
