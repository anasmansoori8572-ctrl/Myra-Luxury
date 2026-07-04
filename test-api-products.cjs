const http = require("http");

http.get("http://localhost:3000/api/products", (res) => {
  let data = "";
  res.on("data", (chunk) => { data += chunk; });
  res.on("end", () => {
    try {
      const products = JSON.parse(data);
      console.log("STATUS:", res.statusCode);
      console.log("PRODUCTS RETURNED:", products.length);
      products.forEach(p => {
        console.log(`- ID: ${p.id}, Name: ${p.name}`);
      });
    } catch (e) {
      console.error("Failed to parse response:", e);
      console.log("RAW DATA:", data);
    }
  });
}).on("error", (err) => {
  console.error("HTTP GET Error:", err);
});
