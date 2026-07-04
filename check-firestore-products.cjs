const fs = require("fs");
const path = require("path");
const { initializeApp, getApps } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

async function checkProducts() {
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

    const snap = await getDocs(collection(db, "products"));
    console.log("SUCCESS! Connected to Firestore.");
    console.log("Total products in Firestore:", snap.size);
    snap.forEach(doc => {
      console.log(`- ID: ${doc.id}, Name: ${doc.data().name}`);
    });
  } catch (err) {
    console.error("Failed to connect or fetch from Firestore:", err);
  }
}

checkProducts();
