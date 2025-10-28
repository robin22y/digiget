// seedFirestore.js
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDUBVjVH22qIBvHeknfeGXteQuT6jikvAA",
  authDomain: "digiget-l9.firebaseapp.com",
  projectId: "digiget-l9",
  storageBucket: "digiget-l9.appspot.com",  // ✅ correct
  messagingSenderId: "66838869613",
  appId: "1:66838869613:web:51bf0664d55a3c164e3164"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedData() {
  const shopRef = doc(db, "shops", "shop_001");
  await setDoc(shopRef, {
    name: "EyeWorld Opticians",
    user_id: "owner_123",
    created_at: new Date().toISOString()
  });

  const subcollections = [
    ["employees", "emp_001", { name: "Alice", role: "Optometrist" }],
    ["customers", "cust_001", { name: "John Doe", phone: "+447700900111" }],
    ["clock_entries", "entry_001", { employee_id: "emp_001", clock_in: new Date().toISOString() }],
    ["tasks", "task_001", { title: "Clean front glass", status: "pending" }],
    ["task_completions", "comp_001", { task_id: "task_001", employee_id: "emp_001" }],
    ["incidents", "inc_001", { description: "Broken mirror", status: "resolved" }],
    ["appointments", "appt_001", { customer_id: "cust_001", time: "2025-10-30T14:00:00Z" }],
    ["flash_offers", "offer_001", { title: "20% off frames" }],
    ["loyalty_transactions", "txn_001", { customer_id: "cust_001", points_added: 20 }],
    ["clock_in_requests", "req_001", { employee_id: "emp_001", status: "approved" }]
  ];

  for (const [sub, id, data] of subcollections) {
    await setDoc(doc(collection(shopRef, sub), id), data);
  }

  console.log("✅ Firestore seed data created successfully!");
}

seedData().catch(console.error);
