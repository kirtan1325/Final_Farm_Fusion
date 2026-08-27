// backend/config/seed.js
const mongoose        = require("mongoose");
const dotenv          = require("dotenv");
dotenv.config();

const User             = require("../models/User");
const Crop             = require("../models/Crop");
const PurchaseRequest  = require("../models/PurchaseRequest");
const Order            = require("../models/Order");
const GovernmentScheme = require("../models/GovernmentScheme");
const CropPrice        = require("../models/CropPrice");
const CropAdvisory     = require("../models/CropAdvisory");
const ForumPost        = require("../models/ForumPost");
const ForumComment     = require("../models/ForumComment");
const Notification     = require("../models/Notification");

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB...\n");

  // Clear all collections
  await Promise.all([
    User.deleteMany({}), Crop.deleteMany({}),
    PurchaseRequest.deleteMany({}), Order.deleteMany({}),
    GovernmentScheme.deleteMany({}), CropPrice.deleteMany({}),
    CropAdvisory.deleteMany({}), ForumPost.deleteMany({}),
    ForumComment.deleteMany({}), Notification.deleteMany({}),
  ]);
  console.log("✅ Cleared all collections");

  // ── Users ─────────────────────────────────────────────
  const [farmer1, farmer2, buyer1, buyer2, admin] = await User.insertMany([
    { name: "Samuel Green",  email: "samuel@farmfusion.com", password: "password123", role: "farmer", farmName: "Green Acres Farm",    location: "Gujarat, India",    tierLevel: "silver", isActive: true },
    { name: "Mike Root",     email: "mike@farmfusion.com",   password: "password123", role: "farmer", farmName: "Root Farm",            location: "Maharashtra, India", tierLevel: "gold",   isActive: true },
    { name: "Sarah Jenkins", email: "sarah@farmfusion.com",  password: "password123", role: "buyer",  companyName: "FreshMart Co.",     location: "Mumbai, India",     isPremium: true,     isActive: true },
    { name: "Alex Morgan",   email: "alex@farmfusion.com",   password: "password123", role: "buyer",  companyName: "Organic Wholesale", location: "Delhi, India",      isPremium: false,    isActive: true },
    { name: "Admin User",    email: "admin@farmfusion.com",  password: "password123", role: "admin",  isActive: true },
  ]);
  console.log("✅ Users seeded");

  // ── Crops ─────────────────────────────────────────────
  const [tomato, potato, wheat, spinach, carrot, corn, rice, onion] = await Crop.insertMany([
    { farmer: farmer1._id, name: "Organic Tomatoes",  subtitle: "Harvested 2 days ago", category: "vegetables", quantity: 250,  unit: "kg",   pricePerUnit: 25,  status: "available", badge: "organic",    emoji: "🍅", location: "Gujarat" },
    { farmer: farmer1._id, name: "Golden Potatoes",   subtitle: "Storage Grade A",       category: "vegetables", quantity: 1200, unit: "kg",   pricePerUnit: 18,  status: "available", badge: null,         emoji: "🥔", location: "Gujarat" },
    { farmer: farmer1._id, name: "Organic Wheat",     subtitle: "Premium Grade",         category: "grains",     quantity: 5000, unit: "kg",   pricePerUnit: 22,  status: "available", badge: "organic",    emoji: "🌾", location: "Gujarat" },
    { farmer: farmer2._id, name: "Baby Spinach",      subtitle: "Earth washed",          category: "vegetables", quantity: 150,  unit: "kg",   pricePerUnit: 40,  status: "available", badge: "flash_sale", emoji: "🥬", location: "Maharashtra" },
    { farmer: farmer2._id, name: "Heirloom Carrots",  subtitle: "Fresh harvest",         category: "vegetables", quantity: 300,  unit: "kg",   pricePerUnit: 32,  status: "available", badge: "flash_sale", emoji: "🥕", location: "Maharashtra" },
    { farmer: farmer2._id, name: "Golden Corn",       subtitle: "Sweet variety",         category: "vegetables", quantity: 800,  unit: "unit", pricePerUnit: 25,  status: "available", badge: null,         emoji: "🌽", location: "Maharashtra" },
    { farmer: farmer1._id, name: "Basmati Rice",      subtitle: "Long grain variety",    category: "grains",     quantity: 2000, unit: "kg",   pricePerUnit: 55,  status: "available", badge: "best_deal",  emoji: "🍚", location: "Gujarat" },
    { farmer: farmer2._id, name: "Red Onions",        subtitle: "Grade A, dry",          category: "vegetables", quantity: 500,  unit: "kg",   pricePerUnit: 20,  status: "available", badge: null,         emoji: "🧅", location: "Maharashtra" },
  ]);
  console.log("✅ Crops seeded");

  // ── Purchase Requests ──────────────────────────────────
  const [req1, req2, req3, req4] = await PurchaseRequest.insertMany([
    { buyer: buyer1._id, farmer: farmer1._id, crop: tomato._id, quantity: 100, unit: "kg", totalPrice: 2500, status: "pending",  message: "Need by Friday" },
    { buyer: buyer2._id, farmer: farmer1._id, crop: wheat._id,  quantity: 500, unit: "kg", totalPrice: 11000, status: "accepted", isPaid: true, paidAt: new Date() },
    { buyer: buyer1._id, farmer: farmer2._id, crop: corn._id,   quantity: 200, unit: "unit", totalPrice: 5000, status: "rejected", rejectedReason: "Stock unavailable for requested delivery date." },
    { buyer: buyer2._id, farmer: farmer2._id, crop: spinach._id,quantity: 50,  unit: "kg", totalPrice: 2000, status: "pending" },
  ]);
  console.log("✅ Purchase requests seeded");

  // ── Orders ─────────────────────────────────────────────
  await Order.insertMany([
    { purchaseRequest: req2._id, buyer: buyer2._id, farmer: farmer1._id, crop: wheat._id, quantity: 500, totalPrice: 11000, status: "shipped", paymentMethod: "card", transactionId: "TXN_001", trackingNumber: "FF-TRK-001" },
  ]);
  console.log("✅ Orders seeded");

  // ── Government Schemes ─────────────────────────────────
  await GovernmentScheme.insertMany([
    {
      title: "PM-KISAN Samman Nidhi",
      description: "Direct income support of ₹6000 per year to small and marginal farmers in three equal installments of ₹2000.",
      category: "subsidy",
      eligibility: "All landholding farmers with cultivable land. Excludes institutional landholders and government employees.",
      benefits: "₹6000 per year directly into bank account in 3 installments of ₹2000 each.",
      howToApply: "Register on pmkisan.gov.in or visit nearest CSC/agricultural department office.",
      isActive: true,
      tags: ["income support", "small farmers", "direct benefit"],
      officialLink: "https://pmkisan.gov.in",
      addedBy: admin._id,
    },
    {
      title: "Pradhan Mantri Fasal Bima Yojana",
      description: "Crop insurance scheme providing financial support to farmers suffering crop loss due to unforeseen events.",
      category: "insurance",
      eligibility: "All farmers growing notified crops in notified areas. Compulsory for loanee farmers.",
      benefits: "Full insurance coverage against crop loss. Premium: 2% for Kharif, 1.5% for Rabi, 5% for commercial crops.",
      howToApply: "Apply through nearest bank branch or Common Service Centre before the cut-off date.",
      isActive: true,
      tags: ["crop insurance", "natural disaster", "weather risk"],
      officialLink: "https://pmfby.gov.in",
      addedBy: admin._id,
    },
    {
      title: "Kisan Credit Card",
      description: "Provides farmers with timely credit for their agricultural operations and allied activities.",
      category: "loan",
      eligibility: "All farmers — individual/joint borrowers, SHGs or JLGs of farmers.",
      benefits: "Short-term credit limit based on operational land holding. Interest subvention of 2% + 3% prompt repayment incentive.",
      howToApply: "Apply at nearest cooperative/regional/commercial bank branch with land documents.",
      isActive: true,
      tags: ["credit", "loan", "working capital"],
      officialLink: "https://www.nabard.org",
      addedBy: admin._id,
    },
    {
      title: "National Mission for Sustainable Agriculture",
      description: "Promotes sustainable agriculture practices through better adaptation measures to climate change.",
      category: "training",
      eligibility: "Farmer groups, FPOs, and individual farmers across all states.",
      benefits: "Training programs, soil health cards, micro-irrigation subsidies up to 55% for small farmers.",
      howToApply: "Contact district agriculture officer or register on mkisan.gov.in portal.",
      isActive: true,
      tags: ["organic", "sustainable", "climate", "soil health"],
      officialLink: "https://nmsa.dac.gov.in",
      addedBy: admin._id,
    },
    {
      title: "Sub-Mission on Agricultural Mechanization",
      description: "Promotes farm mechanization to reduce drudgery, improve efficiency and boost crop productivity.",
      category: "equipment",
      eligibility: "Individual farmers, SHGs, FPOs. Priority to small and marginal farmers.",
      benefits: "Subsidy of 40-50% on farm machinery purchase. Custom Hiring Centres supported with 40% grant.",
      howToApply: "Apply through state agriculture department. Equipment purchased from empanelled manufacturers.",
      isActive: true,
      tags: ["tractor", "machinery", "mechanization", "subsidy"],
      officialLink: "https://agrimachinery.nic.in",
      addedBy: admin._id,
    },
  ]);
  console.log("✅ Government schemes seeded");

  // ── Crop Prices (Mandi Prices) ─────────────────────────
  await CropPrice.insertMany([
    { cropName: "Wheat",        emoji: "🌾", category: "grains",     minPrice: 2000, maxPrice: 2300, modalPrice: 2150, unit: "quintal", market: "Ahmedabad Mandi",  state: "Gujarat",     trend: "up",     changePercent: 2.5  },
    { cropName: "Rice",         emoji: "🍚", category: "grains",     minPrice: 2800, maxPrice: 3200, modalPrice: 3000, unit: "quintal", market: "Pune Mandi",       state: "Maharashtra", trend: "stable", changePercent: 0.5  },
    { cropName: "Tomato",       emoji: "🍅", category: "vegetables", minPrice: 800,  maxPrice: 1500, modalPrice: 1100, unit: "quintal", market: "Surat Mandi",      state: "Gujarat",     trend: "down",   changePercent: -5.2 },
    { cropName: "Potato",       emoji: "🥔", category: "vegetables", minPrice: 600,  maxPrice: 1000, modalPrice: 800,  unit: "quintal", market: "Nashik Mandi",     state: "Maharashtra", trend: "up",     changePercent: 3.1  },
    { cropName: "Onion",        emoji: "🧅", category: "vegetables", minPrice: 1200, maxPrice: 2000, modalPrice: 1600, unit: "quintal", market: "Lasalgaon Mandi",  state: "Maharashtra", trend: "up",     changePercent: 8.4  },
    { cropName: "Carrot",       emoji: "🥕", category: "vegetables", minPrice: 1500, maxPrice: 2200, modalPrice: 1800, unit: "quintal", market: "Rajkot Mandi",     state: "Gujarat",     trend: "stable", changePercent: 1.0  },
    { cropName: "Spinach",      emoji: "🥬", category: "vegetables", minPrice: 500,  maxPrice: 900,  modalPrice: 700,  unit: "quintal", market: "Mumbai Mandi",     state: "Maharashtra", trend: "down",   changePercent: -2.8 },
    { cropName: "Corn/Maize",   emoji: "🌽", category: "grains",     minPrice: 1500, maxPrice: 1900, modalPrice: 1700, unit: "quintal", market: "Baroda Mandi",     state: "Gujarat",     trend: "stable", changePercent: 0.3  },
    { cropName: "Cotton",       emoji: "🌿", category: "other",      minPrice: 6000, maxPrice: 7500, modalPrice: 6800, unit: "quintal", market: "Rajkot Mandi",     state: "Gujarat",     trend: "up",     changePercent: 4.2  },
    { cropName: "Soybean",      emoji: "🫘", category: "grains",     minPrice: 4200, maxPrice: 4800, modalPrice: 4500, unit: "quintal", market: "Indore Mandi",     state: "MP",          trend: "up",     changePercent: 1.8  },
    { cropName: "Garlic",       emoji: "🧄", category: "vegetables", minPrice: 8000, maxPrice: 12000, modalPrice: 10000, unit: "quintal", market: "Neemuch Mandi",   state: "MP",          trend: "up",     changePercent: 12.5 },
    { cropName: "Chilli",       emoji: "🌶️", category: "vegetables", minPrice: 5000, maxPrice: 8000, modalPrice: 6500, unit: "quintal", market: "Guntur Mandi",    state: "AP",          trend: "stable", changePercent: 0.8  },
  ]);
  console.log("✅ Crop prices seeded");

  // ── Crop Advisories ────────────────────────────────────
  await CropAdvisory.insertMany([
    {
      cropName: "Rice", emoji: "🍚", category: "grains",
      season: "Kharif", soilType: "Clay/Loamy", waterNeeds: "High",
      temperature: "20°C – 35°C", sowingTime: "June – July", harvestTime: "November – December",
      fertilizer: "NPK 120:60:60 kg/ha. Apply urea in 3 splits.",
      commonPests: "Brown planthopper, stem borer, leaf folder",
      tips: [
        "Maintain 2-5 cm water level during vegetative stage",
        "Drain field 10 days before harvest for uniform ripening",
        "Use certified seeds for better yield",
        "Practice crop rotation to break pest cycle",
      ],
      diseases: [
        { name: "Blast", symptom: "Diamond-shaped lesions on leaves", remedy: "Spray Tricyclazole 75WP @ 0.6g/L" },
        { name: "Bacterial Leaf Blight", symptom: "Water-soaked yellow margins", remedy: "Copper-based bactericide spray" },
      ],
    },
    {
      cropName: "Wheat", emoji: "🌾", category: "grains",
      season: "Rabi", soilType: "Well-drained Loamy", waterNeeds: "Medium",
      temperature: "15°C – 25°C", sowingTime: "October – November", harvestTime: "March – April",
      fertilizer: "NPK 120:60:40 kg/ha. Nitrogen in 2 splits.",
      commonPests: "Aphids, termites, rust",
      tips: [
        "Sow at optimal time for maximum yield",
        "First irrigation at Crown Root Initiation (21 days)",
        "Avoid water logging — fatal for wheat",
        "Use rust-resistant varieties",
      ],
      diseases: [
        { name: "Yellow Rust", symptom: "Yellow powdery stripes on leaves", remedy: "Propiconazole 25EC @ 1ml/L water" },
        { name: "Loose Smut", symptom: "Black smutted ears", remedy: "Seed treatment with Carboxin" },
      ],
    },
    {
      cropName: "Tomato", emoji: "🍅", category: "vegetables",
      season: "All Year", soilType: "Sandy Loam to Clay Loam", waterNeeds: "Medium",
      temperature: "18°C – 27°C", sowingTime: "June-July (Kharif), Nov-Dec (Rabi)",
      harvestTime: "60-80 days after transplanting",
      fertilizer: "FYM 25 t/ha + NPK 120:80:80 kg/ha",
      commonPests: "Fruit borer, whitefly, thrips",
      tips: [
        "Stake plants for better air circulation",
        "Drip irrigation preferred — reduces disease",
        "Mulching conserves moisture and controls weeds",
        "Pick fruits at breaker stage for distant markets",
      ],
      diseases: [
        { name: "Early Blight", symptom: "Brown concentric rings on older leaves", remedy: "Mancozeb 75WP @ 2g/L spray" },
        { name: "Late Blight", symptom: "Water-soaked dark lesions", remedy: "Metalaxyl + Mancozeb spray" },
      ],
    },
    {
      cropName: "Cotton", emoji: "🌿", category: "other",
      season: "Kharif", soilType: "Deep Black/Alluvial", waterNeeds: "Medium",
      temperature: "21°C – 30°C", sowingTime: "April – June",
      harvestTime: "October – February (multiple pickings)",
      fertilizer: "NPK 100:50:50 kg/ha + micronutrients",
      commonPests: "Bollworm (major pest), whitefly, aphids",
      tips: [
        "Use Bt cotton for bollworm resistance",
        "Inter-crop with soybean or groundnut",
        "Avoid excess nitrogen — attracts pests",
        "Install pheromone traps @ 5/ha for monitoring",
      ],
      diseases: [
        { name: "Bacterial Blight", symptom: "Angular water-soaked spots on leaves", remedy: "Streptocycline 100ppm spray" },
        { name: "Root Rot", symptom: "Sudden wilting, dark stem base", remedy: "Soil drench with Carbendazim" },
      ],
    },
    {
      cropName: "Potato", emoji: "🥔", category: "vegetables",
      season: "Rabi", soilType: "Sandy Loam", waterNeeds: "Medium",
      temperature: "15°C – 25°C", sowingTime: "October – November",
      harvestTime: "90-120 days after planting",
      fertilizer: "NPK 150:100:120 kg/ha. High potassium for tuber quality.",
      commonPests: "Aphids (virus vector), tuber moth, white grub",
      tips: [
        "Use certified disease-free seed tubers",
        "Earth up soil around plants at 30-45 days",
        "Desiccate haulms 2 weeks before harvest",
        "Cure harvested tubers in shade before storage",
      ],
      diseases: [
        { name: "Late Blight", symptom: "Brown patches on leaves in cool humid weather", remedy: "Ridomil Gold MZ spray at first sign" },
        { name: "Common Scab", symptom: "Rough corky spots on tuber surface", remedy: "Maintain soil pH below 5.5" },
      ],
    },
    {
      cropName: "Onion", emoji: "🧅", category: "vegetables",
      season: "Rabi", soilType: "Well-drained Sandy Loam", waterNeeds: "Medium",
      temperature: "13°C – 24°C", sowingTime: "October – November (Rabi), May-June (Kharif)",
      harvestTime: "90-120 days after transplanting",
      fertilizer: "NPK 100:50:100 kg/ha + Boron 2 kg/ha",
      commonPests: "Thrips (major), armyworm",
      tips: [
        "Stop irrigation 15 days before harvest for better storage",
        "Cure in shade for 10-15 days before storage",
        "Avoid nitrogen after bulb initiation",
        "Plant nursery in raised beds for better seedling quality",
      ],
      diseases: [
        { name: "Purple Blotch", symptom: "Purple lesions with yellow margins", remedy: "Mancozeb + Iprodione spray" },
        { name: "Basal Rot", symptom: "Rotting at neck after harvest", remedy: "Pre-harvest Carbendazim dip" },
      ],
    },
  ]);
  console.log("✅ Crop advisories seeded");

  // ── Forum Posts ────────────────────────────────────────
  const post1 = await ForumPost.create({
    author: farmer1._id,
    title: "My tomato leaves are turning yellow — what's the cause?",
    content: "I have a 2-acre tomato field in Gujarat. For the last week I'm noticing yellowing leaves starting from the older lower leaves. Plants are otherwise growing well. I'm irrigating every 3 days. Has anyone faced this? Is it nitrogen deficiency or some disease?",
    category: "disease",
    tags: ["tomato", "yellowing", "leaves", "disease"],
    views: 45,
  });

  const post2 = await ForumPost.create({
    author: buyer1._id,
    title: "Best time to buy onions wholesale for storage?",
    content: "I want to buy onions in bulk for my business. Which season gives the best quality onions at lowest price? And how long can they be stored? Looking for guidance from experienced farmers or traders.",
    category: "market",
    tags: ["onion", "wholesale", "storage", "market"],
    views: 23,
  });

  const post3 = await ForumPost.create({
    author: farmer2._id,
    title: "Drip irrigation vs flood irrigation for wheat — which is better?",
    content: "I want to switch from flood irrigation to drip for my wheat crop. Initial cost is high but I've heard water savings are 40-50%. Has anyone done this transition? What was your experience and did yields improve?",
    category: "technique",
    tags: ["wheat", "drip irrigation", "water saving"],
    views: 67,
    isPinned: true,
  });

  // Comments
  await ForumComment.insertMany([
    { post: post1._id, author: admin._id,   content: "Yellow lower leaves on tomato usually indicate nitrogen deficiency or Magnesium deficiency. Check your fertilizer schedule — if you haven't applied urea recently, that's likely the cause. Also check for early blight symptoms (concentric rings). Apply urea foliar spray @ 2% as immediate remedy.", isExpert: true },
    { post: post1._id, author: farmer2._id, content: "I faced the same last season. In my case it was magnesium deficiency. Applied MgSO4 foliar spray and plants recovered in a week." },
    { post: post2._id, author: farmer2._id, content: "Best time is March-April after Rabi harvest when supply is peak and prices are lowest. Maharashtra Nashik and Lasalgaon mandi are best sources. For storage beyond 3 months you need cold storage at 1-3°C temperature." },
    { post: post3._id, author: admin._id,   content: "Drip irrigation for wheat is excellent! Water savings of 30-40% and 10-15% yield increase reported in Gujarat studies. Initial setup cost ₹45,000-60,000/acre is recovered in 3-4 seasons through water savings and yield improvement.", isExpert: true },
  ]);
  console.log("✅ Forum posts and comments seeded");

  // ── Notifications ──────────────────────────────────────
  await Notification.insertMany([
    { recipient: farmer1._id, sender: buyer1._id, type: "request_received",  title: "New Purchase Request",    message: "Sarah Jenkins sent a purchase request for 100 kg Organic Tomatoes",              link: "/farmer/requests", isRead: false },
    { recipient: buyer2._id,  sender: farmer1._id, type: "request_accepted", title: "Request Accepted! 🎉",   message: "Samuel Green accepted your request for 500 kg Organic Wheat. Proceed to payment.", link: "/buyer/orders",    isRead: false },
    { recipient: buyer1._id,  sender: farmer2._id, type: "request_rejected", title: "Request Update",          message: "Mike Root rejected your request for Golden Corn. Reason: Stock unavailable.",     link: "/buyer/orders",    isRead: true  },
    { recipient: farmer2._id, type: "system", title: "Welcome to Farm Fusion!", message: "Your farmer profile is active. Start adding crops to the marketplace to receive purchase requests.", link: "/farmer/dashboard", isRead: true },
  ]);
  console.log("✅ Notifications seeded");

  console.log("\n🎉 Database seeded successfully!\n");
  console.log("─────────────────────────────────────────────");
  console.log("Login credentials (password: password123):");
  console.log("  Farmer  → samuel@farmfusion.com");
  console.log("  Farmer  → mike@farmfusion.com");
  console.log("  Buyer   → sarah@farmfusion.com");
  console.log("  Buyer   → alex@farmfusion.com");
  console.log("  Admin   → admin@farmfusion.com");
  console.log("─────────────────────────────────────────────\n");

  mongoose.disconnect();
};

seed().catch(err => {
  console.error("Seed error:", err);
  mongoose.disconnect();
});
