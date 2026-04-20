const mongoose = require("mongoose");
const Ingredient = require("../models/Ingredient");

const MONGO_URI = "mongodb://localhost:27017/restaurant-system";

const ingredients = [
  // ==================== MEAT & PROTEIN (kitchen) ====================
  { name: "Chicken", category: "meat", currentStock: 10, unit: "kg", minThreshold: 2, costPerUnit: 450, destination: "kitchen" },
  { name: "Buff (Buffalo)", category: "meat", currentStock: 8, unit: "kg", minThreshold: 2, costPerUnit: 550, destination: "kitchen" },
  { name: "Egg", category: "meat", currentStock: 60, unit: "pieces", minThreshold: 12, costPerUnit: 18, destination: "kitchen" },
  { name: "Paneer", category: "dairy", currentStock: 3, unit: "kg", minThreshold: 1, costPerUnit: 500, destination: "kitchen" },
  { name: "Pork", category: "meat", currentStock: 5, unit: "kg", minThreshold: 1.5, costPerUnit: 480, destination: "kitchen" },
  { name: "Fish", category: "meat", currentStock: 4, unit: "kg", minThreshold: 1, costPerUnit: 600, destination: "kitchen" },

  // ==================== GRAINS & BASE (kitchen) ====================
  { name: "Rice", category: "grains", currentStock: 30, unit: "kg", minThreshold: 5, costPerUnit: 80, destination: "kitchen" },
  { name: "Maida (Flour)", category: "grains", currentStock: 20, unit: "kg", minThreshold: 4, costPerUnit: 60, destination: "kitchen" },
  { name: "Noodles", category: "grains", currentStock: 15, unit: "kg", minThreshold: 3, costPerUnit: 120, destination: "kitchen" },
  { name: "Bread", category: "grains", currentStock: 10, unit: "packets", minThreshold: 3, costPerUnit: 50, destination: "kitchen" },
  { name: "Atta (Wheat Flour)", category: "grains", currentStock: 10, unit: "kg", minThreshold: 3, costPerUnit: 55, destination: "kitchen" },

  // ==================== VEGETABLES (kitchen) ====================
  { name: "Onion", category: "vegetables", currentStock: 10, unit: "kg", minThreshold: 2, costPerUnit: 60, destination: "kitchen" },
  { name: "Tomato", category: "vegetables", currentStock: 8, unit: "kg", minThreshold: 2, costPerUnit: 80, destination: "kitchen" },
  { name: "Potato", category: "vegetables", currentStock: 15, unit: "kg", minThreshold: 3, costPerUnit: 40, destination: "kitchen" },
  { name: "Capsicum", category: "vegetables", currentStock: 3, unit: "kg", minThreshold: 1, costPerUnit: 150, destination: "kitchen" },
  { name: "Cabbage", category: "vegetables", currentStock: 5, unit: "kg", minThreshold: 1.5, costPerUnit: 50, destination: "kitchen" },
  { name: "Mushroom", category: "vegetables", currentStock: 2, unit: "kg", minThreshold: 0.5, costPerUnit: 300, destination: "kitchen" },
  { name: "Green Peas", category: "vegetables", currentStock: 3, unit: "kg", minThreshold: 1, costPerUnit: 120, destination: "kitchen" },
  { name: "Cauliflower", category: "vegetables", currentStock: 4, unit: "kg", minThreshold: 1, costPerUnit: 70, destination: "kitchen" },

  // ==================== OIL & DAIRY (kitchen) ====================
  { name: "Cooking Oil", category: "oil", currentStock: 15, unit: "L", minThreshold: 3, costPerUnit: 220, destination: "kitchen" },
  { name: "Butter/Ghee", category: "dairy", currentStock: 3, unit: "kg", minThreshold: 1, costPerUnit: 600, destination: "kitchen" },
  { name: "Milk", category: "dairy", currentStock: 10, unit: "L", minThreshold: 2, costPerUnit: 80, destination: "kitchen" },
  { name: "Cheese", category: "dairy", currentStock: 2, unit: "kg", minThreshold: 0.5, costPerUnit: 700, destination: "kitchen" },

  // ==================== ALCOHOL (bar) ====================
  { name: "Tuborg Beer", category: "alcohol", currentStock: 48, unit: "bottles", minThreshold: 12, costPerUnit: 250, destination: "bar" },
  { name: "Nepal Ice Beer", category: "alcohol", currentStock: 48, unit: "bottles", minThreshold: 12, costPerUnit: 220, destination: "bar" },
  { name: "Gorkha Beer", category: "alcohol", currentStock: 36, unit: "bottles", minThreshold: 12, costPerUnit: 230, destination: "bar" },
  { name: "Whiskey (Local)", category: "alcohol", currentStock: 10, unit: "bottles", minThreshold: 3, costPerUnit: 800, destination: "bar" },
  { name: "Whiskey (Imported)", category: "alcohol", currentStock: 5, unit: "bottles", minThreshold: 2, costPerUnit: 3500, destination: "bar" },
  { name: "Rum", category: "alcohol", currentStock: 8, unit: "bottles", minThreshold: 3, costPerUnit: 700, destination: "bar" },
  { name: "Vodka", category: "alcohol", currentStock: 5, unit: "bottles", minThreshold: 2, costPerUnit: 900, destination: "bar" },

  // ==================== BEVERAGES — NON-ALCOHOLIC (bar) ====================
  { name: "Coke/Pepsi", category: "beverages", currentStock: 48, unit: "bottles", minThreshold: 12, costPerUnit: 40, destination: "bar" },
  { name: "Fanta/Sprite", category: "beverages", currentStock: 36, unit: "bottles", minThreshold: 10, costPerUnit: 40, destination: "bar" },
  { name: "Mineral Water", category: "beverages", currentStock: 48, unit: "bottles", minThreshold: 12, costPerUnit: 25, destination: "bar" },
  { name: "Fresh Juice", category: "beverages", currentStock: 10, unit: "L", minThreshold: 3, costPerUnit: 150, destination: "bar" },
  { name: "Soda", category: "beverages", currentStock: 36, unit: "bottles", minThreshold: 10, costPerUnit: 30, destination: "bar" },
  { name: "Tea Leaves", category: "beverages", currentStock: 2, unit: "kg", minThreshold: 0.5, costPerUnit: 800, destination: "bar" },
  { name: "Coffee Powder", category: "beverages", currentStock: 1, unit: "kg", minThreshold: 0.3, costPerUnit: 1200, destination: "bar" },

  // ==================== DESSERT & OTHER (kitchen) ====================
  { name: "Ice Cream (Vanilla)", category: "dairy", currentStock: 5, unit: "L", minThreshold: 2, costPerUnit: 300, destination: "kitchen" },
  { name: "Ice Cream (Chocolate)", category: "dairy", currentStock: 5, unit: "L", minThreshold: 2, costPerUnit: 320, destination: "kitchen" },
  { name: "Sugar", category: "other", currentStock: 5, unit: "kg", minThreshold: 1.5, costPerUnit: 90, destination: "kitchen" },
];

const seedIngredients = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB\n");

    // Clear existing ingredients
    await Ingredient.deleteMany({});
    console.log("Cleared existing ingredients\n");

    // Insert all ingredients
    const created = await Ingredient.insertMany(ingredients);
    console.log(`Seeded ${created.length} ingredients\n`);

    // Group and display by category
    const grouped = {};
    created.forEach((item) => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(`  ${item.name} — ${item.currentStock} ${item.unit} (threshold: ${item.minThreshold}, Rs ${item.costPerUnit}/${item.unit}) [${item.destination}]`);
    });

    Object.keys(grouped).sort().forEach((cat) => {
      console.log(`${cat.toUpperCase()} (${grouped[cat].length} items):`);
      grouped[cat].forEach((line) => console.log(line));
      console.log("");
    });

    // Summary
    const totalValue = created.reduce((sum, i) => sum + i.currentStock * i.costPerUnit, 0);
    console.log("=".repeat(50));
    console.log(`Total ingredients: ${created.length}`);
    console.log(`Total inventory value: Rs ${totalValue.toLocaleString()}`);
    console.log(`Kitchen items: ${created.filter((i) => i.destination === "kitchen").length}`);
    console.log(`Bar items: ${created.filter((i) => i.destination === "bar").length}`);

    await mongoose.connection.close();
    console.log("\nDone! MongoDB connection closed.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exit(1);
  }
};

seedIngredients();