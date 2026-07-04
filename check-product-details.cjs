const fs = require("fs");
const path = require("path");
const { initializeApp } = require("firebase/app");
const { getFirestore, doc, getDoc } = require("firebase/firestore");

async function checkProductDetails() {
  try {
    let config = {};
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    }

    const firebaseConfig = {
      apiKey: config.apiKey || "AIzaSyCImJm7OxF68YHgLhUo1euYXteVfZ3YzkU",
      authDomain: config.authDomain || "protean-beanbag-42fsp.firebaseapp.com",
      projectId: config.projectId || "protean-beanbag-42fsp",
      storageBucket: config.storageBucket || "protean-beanbag-42fsp.firebasestorage.app",
      messagingSenderId: config.messagingSenderId || "953918959845",
      appId: config.appId || "1:953918959845:web:142cda9f349bebf7d9e40c"
    };

    const app = initializeApp(firebaseConfig);
    const databaseId = config.firestoreDatabaseId || "(default)";
    
    let db;
    if (databaseId && databaseId !== "(default)") {
      db = getFirestore(app, databaseId);
    } else {
      db = getFirestore(app);
    }

    const docRef = doc(db, "products", "perfume-test-1783163076776");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      console.log("SUCCESS! Product properties:\n", JSON.stringify(snap.data(), null, 2));
    } else {
      console.log("Product not found by exact ID.");
    }
  } catch (err) {
    console.error("Failed:", err);
  } finally {
    process.exit(0);
  }
}

checkProductDetails();
