const mongoose = require("mongoose");
const Menu = require("../models/Menu");
const Ingredient = require("../models/Ingredient");

const MONGO_URI = "mongodb://localhost:27017/restaurant-system";

// Recipes for the 42 skipped items — matched by EXACT name (case-insensitive)
const RECIPES = {
  // ==================== BEER ====================
  "carlsberg 🍺": [
    { ingredient: "Tuborg Beer", quantity: 1 }, // treated as similar beer
  ],

  // ==================== BEVERAGES ====================
  "cold drinks": [
    { ingredient: "Coke/Pepsi", quantity: 1 },
  ],

  // ==================== BREAKFAST ====================
  "nepali breakfast set": [
    { ingredient: "Egg", quantity: 2 },
    { ingredient: "Atta (Wheat Flour)", quantity: 0.1 },
    { ingredient: "Potato", quantity: 0.1 },
    { ingredient: "Onion", quantity: 0.05 },
    { ingredient: "Tea Leaves", quantity: 0.005 },
    { ingredient: "Milk", quantity: 0.15 },
    { ingredient: "Cooking Oil", quantity: 0.03 },
  ],
  "continental breakfast": [
    { ingredient: "Bread", quantity: 0.25 },
    { ingredient: "Egg", quantity: 2 },
    { ingredient: "Butter/Ghee", quantity: 0.02 },
    { ingredient: "Milk", quantity: 0.15 },
    { ingredient: "Coffee Powder", quantity: 0.008 },
  ],

  // ==================== DESSERTS ====================
  "rasbari": [
    { ingredient: "Milk", quantity: 0.15 },
    { ingredient: "Sugar", quantity: 0.04 },
  ],
  "lalmohan": [
    { ingredient: "Milk", quantity: 0.05 },
    { ingredient: "Maida (Flour)", quantity: 0.03 },
    { ingredient: "Sugar", quantity: 0.05 },
    { ingredient: "Cooking Oil", quantity: 0.03 },
  ],

  // ==================== HARD DRINKS ====================
  "old durbar 🥃": [
    { ingredient: "Whiskey (Local)", quantity: 0.03 },
  ],
  "golden oak 🥃": [
    { ingredient: "Whiskey (Local)", quantity: 0.03 },
  ],
  "black label 🥃": [
    { ingredient: "Whiskey (Imported)", quantity: 0.03 },
  ],

  // ==================== NON-VEG SPECIAL ====================
  "sekuwa": [
    { ingredient: "Chicken", quantity: 0.25 },
    { ingredient: "Onion", quantity: 0.04 },
    { ingredient: "Cooking Oil", quantity: 0.03 },
  ],
  "choila": [
    { ingredient: "Buff (Buffalo)", quantity: 0.25 },
    { ingredient: "Onion", quantity: 0.05 },
    { ingredient: "Cooking Oil", quantity: 0.03 },
  ],
  "grill platter": [
    { ingredient: "Chicken", quantity: 0.2 },
    { ingredient: "Buff (Buffalo)", quantity: 0.15 },
    { ingredient: "Onion", quantity: 0.06 },
    { ingredient: "Capsicum", quantity: 0.04 },
    { ingredient: "Cooking Oil", quantity: 0.04 },
  ],
  "tandoori": [
    { ingredient: "Chicken", quantity: 0.3 },
    { ingredient: "Butter/Ghee", quantity: 0.02 },
    { ingredient: "Onion", quantity: 0.05 },
    { ingredient: "Cooking Oil", quantity: 0.03 },
  ],
  "buff sukuti": [
    { ingredient: "Buff (Buffalo)", quantity: 0.2 },
    { ingredient: "Onion", quantity: 0.04 },
    { ingredient: "Cooking Oil", quantity: 0.03 },
  ],
  "chicken chilli": [
    { ingredient: "Chicken", quantity: 0.25 },
    { ingredient: "Onion", quantity: 0.05 },
    { ingredient: "Capsicum", quantity: 0.05 },
    { ingredient: "Cooking Oil", quantity: 0.04 },
  ],
  "pork special": [
    { ingredient: "Pork", quantity: 0.3 },
    { ingredient: "Onion", quantity: 0.06 },
    { ingredient: "Tomato", quantity: 0.05 },
    { ingredient: "Cooking Oil", quantity: 0.04 },
  ],
  "fish special": [
    { ingredient: "Fish", quantity: 0.25 },
    { ingredient: "Onion", quantity: 0.05 },
    { ingredient: "Tomato", quantity: 0.05 },
    { ingredient: "Cooking Oil", quantity: 0.04 },
  ],
  "egg special": [
    { ingredient: "Egg", quantity: 3 },
    { ingredient: "Onion", quantity: 0.05 },
    { ingredient: "Tomato", quantity: 0.05 },
    { ingredient: "Cooking Oil", quantity: 0.03 },
  ],

  // ==================== SEASONAL DRINKS ====================
  "virgin pina colada 🍍": [
    { ingredient: "Fresh Juice", quantity: 0.2 },
    { ingredient: "Milk", quantity: 0.05 },
    { ingredient: "Sugar", quantity: 0.02 },
  ],
  "blue lagoon 🫙": [
    { ingredient: "Soda", quantity: 1 },
    { ingredient: "Sugar", quantity: 0.02 },
  ],
  "shirley temple 🌸": [
    { ingredient: "Fanta/Sprite", quantity: 1 },
    { ingredient: "Sugar", quantity: 0.01 },
  ],
  "passion fruit fizz 🧡": [
    { ingredient: "Fresh Juice", quantity: 0.2 },
    { ingredient: "Soda", quantity: 1 },
    { ingredient: "Sugar", quantity: 0.02 },
  ],
  "rose lemonade 🌹": [
    { ingredient: "Soda", quantity: 1 },
    { ingredient: "Sugar", quantity: 0.02 },
  ],
  "fresh lime soda 🍋": [
    { ingredient: "Soda", quantity: 1 },
    { ingredient: "Sugar", quantity: 0.015 },
  ],
  "ginger lemonade 🫚": [
    { ingredient: "Soda", quantity: 1 },
    { ingredient: "Sugar", quantity: 0.02 },
  ],
  "cucumber mint cooler 🥒": [
    { ingredient: "Soda", quantity: 1 },
    { ingredient: "Sugar", quantity: 0.015 },
  ],

  // ==================== SNACKS ====================
  "sadeko": [
    { ingredient: "Chicken", quantity: 0.15 },
    { ingredient: "Onion", quantity: 0.05 },
    { ingredient: "Tomato", quantity: 0.03 },
    { ingredient: "Cooking Oil", quantity: 0.02 },
  ],
  "spring roll": [
    { ingredient: "Maida (Flour)", quantity: 0.08 },
    { ingredient: "Cabbage", quantity: 0.05 },
    { ingredient: "Onion", quantity: 0.03 },
    { ingredient: "Cooking Oil", quantity: 0.04 },
  ],
  "chatpate": [
    { ingredient: "Onion", quantity: 0.03 },
    { ingredient: "Tomato", quantity: 0.03 },
    { ingredient: "Potato", quantity: 0.05 },
  ],
  "soup": [
    { ingredient: "Chicken", quantity: 0.08 },
    { ingredient: "Onion", quantity: 0.03 },
    { ingredient: "Cabbage", quantity: 0.03 },
    { ingredient: "Cooking Oil", quantity: 0.01 },
  ],

  // ==================== SPECIAL ====================
  "chef's mixed platter": [
    { ingredient: "Chicken", quantity: 0.2 },
    { ingredient: "Buff (Buffalo)", quantity: 0.15 },
    { ingredient: "Paneer", quantity: 0.08 },
    { ingredient: "Onion", quantity: 0.06 },
    { ingredient: "Capsicum", quantity: 0.04 },
    { ingredient: "Cooking Oil", quantity: 0.05 },
  ],
  "khasi ko masu": [
    { ingredient: "Buff (Buffalo)", quantity: 0.3 },
    { ingredient: "Onion", quantity: 0.08 },
    { ingredient: "Tomato", quantity: 0.08 },
    { ingredient: "Cooking Oil", quantity: 0.04 },
  ],
  "biryani": [
    { ingredient: "Rice", quantity: 0.3 },
    { ingredient: "Chicken", quantity: 0.2 },
    { ingredient: "Onion", quantity: 0.06 },
    { ingredient: "Tomato", quantity: 0.05 },
    { ingredient: "Butter/Ghee", quantity: 0.02 },
    { ingredient: "Cooking Oil", quantity: 0.03 },
  ],
  "himalayan special rack": [
    { ingredient: "Buff (Buffalo)", quantity: 0.3 },
    { ingredient: "Onion", quantity: 0.06 },
    { ingredient: "Cooking Oil", quantity: 0.04 },
  ],
  "dessert special": [
    { ingredient: "Ice Cream (Vanilla)", quantity: 0.1 },
    { ingredient: "Ice Cream (Chocolate)", quantity: 0.1 },
    { ingredient: "Milk", quantity: 0.1 },
    { ingredient: "Sugar", quantity: 0.02 },
  ],

  // ==================== THAKALI ====================
  "nepali khana": [
    { ingredient: "Rice", quantity: 0.3 },
    { ingredient: "Potato", quantity: 0.1 },
    { ingredient: "Onion", quantity: 0.05 },
    { ingredient: "Tomato", quantity: 0.05 },
    { ingredient: "Cauliflower", quantity: 0.06 },
    { ingredient: "Cooking Oil", quantity: 0.03 },
  ],
  "thakali khana set": [
    { ingredient: "Rice", quantity: 0.3 },
    { ingredient: "Chicken", quantity: 0.15 },
    { ingredient: "Potato", quantity: 0.1 },
    { ingredient: "Onion", quantity: 0.05 },
    { ingredient: "Tomato", quantity: 0.05 },
    { ingredient: "Butter/Ghee", quantity: 0.02 },
    { ingredient: "Cooking Oil", quantity: 0.03 },
  ],
  "thakali dhedo set": [
    { ingredient: "Atta (Wheat Flour)", quantity: 0.2 },
    { ingredient: "Chicken", quantity: 0.15 },
    { ingredient: "Potato", quantity: 0.1 },
    { ingredient: "Onion", quantity: 0.05 },
    { ingredient: "Tomato", quantity: 0.05 },
    { ingredient: "Butter/Ghee", quantity: 0.02 },
    { ingredient: "Cooking Oil", quantity: 0.03 },
  ],

  // ==================== WINE ====================
  // Wine items — since there's no wine ingredient, we'll skip these
  // Add wine as an ingredient first if you want to track them
};

const seedRecipes = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB\n");

    // Load all ingredients into a lookup map (name -> _id)
    const ingredients = await Ingredient.find({ isActive: true });
    const ingredientMap = {};
    ingredients.forEach((ing) => {
      ingredientMap[ing.name.toLowerCase()] = ing._id;
    });
    console.log(`Loaded ${ingredients.length} ingredients\n`);

    // Load all menu items
    const menuItems = await Menu.find({});
    console.log(`Found ${menuItems.length} menu items\n`);

    let matchedCount = 0;
    let skippedCount = 0;
    const matchedByCategory = {};
    const skippedByCategory = {};

    for (const menuItem of menuItems) {
      const menuName = menuItem.name.toLowerCase();
      const category = menuItem.category || "Uncategorized";

      // Skip items that already have a recipe (from previous seed)
      if (menuItem.recipe && menuItem.recipe.length > 0) {
        continue;
      }

      // Try exact match first
      let matchedKey = null;
      if (RECIPES[menuName]) {
        matchedKey = menuName;
      }

      if (matchedKey) {
        const recipeTemplate = RECIPES[matchedKey];
        const recipe = [];

        for (const r of recipeTemplate) {
          const ingId = ingredientMap[r.ingredient.toLowerCase()];
          if (ingId) {
            recipe.push({ ingredient: ingId, quantity: r.quantity });
          } else {
            console.log(`  WARNING: Ingredient "${r.ingredient}" not found for "${menuItem.name}"`);
          }
        }

        if (recipe.length > 0) {
          await Menu.findByIdAndUpdate(
            menuItem._id,
            { $set: { recipe: recipe } },
            { runValidators: false }
          );
          matchedCount++;
          if (!matchedByCategory[category]) matchedByCategory[category] = [];
          matchedByCategory[category].push(`  ${menuItem.name} -> "${matchedKey}" (${recipe.length} ingredients)`);
        }
      } else {
        skippedCount++;
        if (!skippedByCategory[category]) skippedByCategory[category] = [];
        skippedByCategory[category].push(`  ${menuItem.name}`);
      }
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log(`MATCHED (${matchedCount}):`);
    console.log(`${"=".repeat(60)}`);
    Object.keys(matchedByCategory).sort().forEach((cat) => {
      console.log(`\n[${cat}]`);
      matchedByCategory[cat].forEach((line) => console.log(line));
    });

    if (skippedCount > 0) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`STILL SKIPPED (${skippedCount}):`);
      console.log(`${"=".repeat(60)}`);
      Object.keys(skippedByCategory).sort().forEach((cat) => {
        console.log(`\n[${cat}]`);
        skippedByCategory[cat].forEach((line) => console.log(line));
      });
      console.log(`\nWine items: add a "Wine" ingredient first, then add recipe manually.`);
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log(`SUMMARY: ${matchedCount} matched, ${skippedCount} still skipped`);
    console.log(`${"=".repeat(60)}`);

    await mongoose.connection.close();
    console.log("\nDone!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

seedRecipes();