import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  sendEmailVerification, 
  updateProfile,
  signInWithPopup,
  User
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove 
} from "firebase/firestore";
import { auth, db, googleProvider, appleProvider } from "./firebase";

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  phoneNumber: string;
  createdAt: string;
  membershipTier: "standard" | "vip";
  savedAddresses: string[];
  wishlist: string[];
  preferredCategory?: string;
  scentNotes?: string;
  loyaltyPoints?: number;
}

export interface MemberInfo {
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

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  memberInfo: MemberInfo | null;
  isLoggedIn: boolean;
  loading: boolean;
  signUpWithEmail: (email: string, password: string, displayName: string, phone: string, tier?: "standard" | "vip") => Promise<User>;
  loginWithEmail: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  loginWithApple: () => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerification: () => Promise<void>;
  updateProfileInFirestore: (data: Partial<UserProfile>) => Promise<void>;
  toggleWishlistItem: (productId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Map our rich Firestore profile format back to the standard luxury UI's MemberInfo format
  const getMemberInfo = (p: UserProfile | null): MemberInfo | null => {
    if (!p) return null;
    
    // Format "Month Year" for memberSince
    let memberSinceStr = "June 2026";
    try {
      const date = new Date(p.createdAt);
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      memberSinceStr = `${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch {}

    const isVip = p.membershipTier === "vip";
    const shortUid = p.uid ? p.uid.substring(0, 4).toUpperCase() : "ATEL";

    return {
      name: p.displayName || "Atelier Patron",
      email: p.email || "",
      phone: p.phoneNumber || "+91 99999 99999",
      address: p.savedAddresses?.[0] || "Residential Curation, Atelier House, Delhi, India",
      preferredCategory: p.preferredCategory || "Perfumes",
      scentNotes: p.scentNotes || "Warm Saffron, Damask Rose & Oud Noir",
      tier: isVip ? "Maison Elite Client" : "Valued Standard Client",
      loyaltyPoints: p.loyaltyPoints ?? (isVip ? 1250 : 25),
      memberId: `MYRA-${shortUid}-${isVip ? "VIP" : "STD"}`,
      memberSince: memberSinceStr,
      accountType: p.membershipTier
    };
  };

  const memberInfo = getMemberInfo(profile);
  const isLoggedIn = !!user;

  // Sync state to localStorage for any backward compatibility with unmigrated components
  useEffect(() => {
    if (user && profile && memberInfo) {
      localStorage.setItem("myra_member_logged_in", "true");
      localStorage.setItem("myra_member_info", JSON.stringify(memberInfo));
      localStorage.setItem("myra_member_profile", JSON.stringify(memberInfo));
      localStorage.setItem("myra_wishlist", JSON.stringify(profile.wishlist || []));
      // Dispatch custom events so active components update immediately
      window.dispatchEvent(new Event("myra_member_updated"));
      window.dispatchEvent(new Event("myra_wishlist_updated"));
    } else {
      localStorage.setItem("myra_member_logged_in", "false");
      localStorage.removeItem("myra_member_info");
      localStorage.removeItem("myra_member_profile");
      localStorage.removeItem("myra_wishlist");
      window.dispatchEvent(new Event("myra_member_updated"));
      window.dispatchEvent(new Event("myra_wishlist_updated"));
    }
  }, [user, profile, memberInfo]);

  // Handle Firebase user creation/retrieval in Firestore
  const getOrCreateProfile = async (firebaseUser: User, additionalData?: { displayName?: string, phone?: string, tier?: "standard" | "vip" }): Promise<UserProfile> => {
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const data = userDocSnap.data() as UserProfile;
      // Merge values just in case
      return {
        ...data,
        uid: firebaseUser.uid,
        email: firebaseUser.email || data.email,
        displayName: data.displayName || firebaseUser.displayName || "Atelier Patron",
        photoURL: data.photoURL || firebaseUser.photoURL || "",
        phoneNumber: data.phoneNumber || firebaseUser.phoneNumber || "",
      };
    } else {
      // Create new profile doc
      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        displayName: additionalData?.displayName || firebaseUser.displayName || "Atelier Patron",
        email: firebaseUser.email || "",
        photoURL: firebaseUser.photoURL || "",
        phoneNumber: additionalData?.phone || firebaseUser.phoneNumber || "",
        createdAt: new Date().toISOString(),
        membershipTier: additionalData?.tier || "standard",
        savedAddresses: [],
        wishlist: [],
        preferredCategory: "Perfumes",
        scentNotes: "Warm Saffron, Damask Rose & Oud Noir",
        loyaltyPoints: additionalData?.tier === "vip" ? 1250 : 25
      };

      await setDoc(userDocRef, newProfile);
      return newProfile;
    }
  };

  // Listen to Auth State changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userProf = await getOrCreateProfile(currentUser);
          setProfile(userProf);
        } catch (err) {
          console.error("Error reading/writing Firestore user doc:", err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUpWithEmail = async (email: string, password: string, displayName: string, phone: string, tier: "standard" | "vip" = "standard") => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update Firebase Profile
      await updateProfile(userCredential.user, { displayName });
      // Create Firestore Doc
      const userProf = await getOrCreateProfile(userCredential.user, { displayName, phone, tier });
      setProfile(userProf);
      
      // Attempt to send email verification
      try {
        await sendEmailVerification(userCredential.user);
      } catch (evErr) {
        console.warn("Failed to send email verification:", evErr);
      }

      return userCredential.user;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userProf = await getOrCreateProfile(userCredential.user);
      setProfile(userProf);
      return userCredential.user;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const userProf = await getOrCreateProfile(userCredential.user);
      setProfile(userProf);
      return userCredential.user;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const loginWithApple = async () => {
    setLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, appleProvider);
      const userProf = await getOrCreateProfile(userCredential.user);
      setProfile(userProf);
      return userCredential.user;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    setLoading(true);
    await signOut(auth);
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const sendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const updateProfileInFirestore = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error("No authenticated user session found");
    const userDocRef = doc(db, "users", user.uid);
    
    // Clean up data
    const cleaned = JSON.parse(JSON.stringify(data));
    await updateDoc(userDocRef, cleaned);
    
    setProfile(prev => prev ? { ...prev, ...cleaned } : null);
  };

  const toggleWishlistItem = async (productId: string): Promise<boolean> => {
    if (!user || !profile) {
      // Return false indicating action failed due to lack of auth
      return false;
    }

    const userDocRef = doc(db, "users", user.uid);
    const isWishlisted = profile.wishlist?.includes(productId) || false;

    if (isWishlisted) {
      await updateDoc(userDocRef, {
        wishlist: arrayRemove(productId)
      });
      setProfile(prev => prev ? { ...prev, wishlist: (prev.wishlist || []).filter(id => id !== productId) } : null);
      return false; // returned false because it was removed
    } else {
      await updateDoc(userDocRef, {
        wishlist: arrayUnion(productId)
      });
      setProfile(prev => prev ? { ...prev, wishlist: [...(prev.wishlist || []), productId] } : null);
      return true; // returned true because it was added
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      memberInfo,
      isLoggedIn,
      loading,
      signUpWithEmail,
      loginWithEmail,
      loginWithGoogle,
      loginWithApple,
      logout,
      resetPassword,
      sendVerification,
      updateProfileInFirestore,
      toggleWishlistItem
    }}>
      {children}
    </AuthContext.Provider>
  );
};
