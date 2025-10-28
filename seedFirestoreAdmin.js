// seedFirestoreAdmin.js
import admin from "firebase-admin";

// Initialize using your local Firebase CLI credentials
admin.initializeApp({
  projectId: "digiget-l9",
});

const db = admin.firestore();

async function seedShop(shopId, data) {
  const shopRef = db.collection("shops").doc(shopId);
  await shopRef.set(data);

  const subcollections = [
    ["employees", "emp_001", { name: "Alice", role: "Optometrist" }],
    ["customers", "cust_001", { name: "John Doe", phone: "+447700900111" }],
    ["tasks", "task_001", { title: "Clean front glass", status: "pending" }],
  ];

  for (const [sub, id, docData] of subcollections) {
    await shopRef.collection(sub).doc(id).set(docData);
  }

  console.log(`✅ Seeded ${data.name}`);
}

async function main() {
  console.log("🌱 Starting Firestore seeding...");

  await seedShop("shop_001", {
    name: "EyeWorld Opticians",
    user_id: "owner_001",
    created_at: new Date().toISOString(),
  });

  await seedShop("shop_002", {
    name: "Athena Street Food",
    user_id: "owner_002",
    created_at: new Date().toISOString(),
  });

  await seedShop("shop_003", {
    name: "The Cove Bar",
    user_id: "owner_003",
    created_at: new Date().toISOString(),
  });

  console.log("🎉 All shops seeded successfully!");
}

main().catch(console.error);
