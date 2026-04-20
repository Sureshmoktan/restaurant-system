/**
 * seedFillGap.js
 * Fills missing data: Feb 16, 2026 → Apr 10, 2026
 * Usage: node seeds/seedFillGap.js
 */

const mongoose = require("mongoose")
const MONGO_URI = "mongodb://localhost:27017/restaurant-system"

const VAT_PERCENT     = 13
const PAYMENT_METHODS = ["cash", "esewa", "khalti", "card"]

const OrderSchema = new mongoose.Schema({
  tableNumber:   { type: String },
  items:         { type: Array, default: [] },
  status:        { type: String, default: "billed" },
  totalAmount:   { type: Number },
  cancelReason:  { type: String, default: null },
  cancelledAt:   { type: Date,   default: null },
  cancelledBy:   { type: mongoose.Schema.Types.ObjectId, default: null },
  statusHistory: { type: Array,  default: [] },
}, { timestamps: true })

const BillSchema = new mongoose.Schema({
  tableNumber:        { type: String },
  orders:             [{ type: mongoose.Schema.Types.ObjectId }],
  subtotal:           { type: Number },
  vatPercent:         { type: Number, default: 13 },
  vatAmount:          { type: Number },
  tipAmount:          { type: Number, default: 0 },
  discountAmount:     { type: Number, default: 0 },
  appliedOffers:      { type: Array,  default: [] },
  discountedSubtotal: { type: Number, default: 0 },
  totalAmount:        { type: Number },
  paymentMethod:      { type: String },
  paymentStatus:      { type: String, default: "paid" },
  generatedBy:        { type: mongoose.Schema.Types.ObjectId, default: null },
  paidAt:             { type: Date },
  note:               { type: String, default: "" },
}, { timestamps: true })

const Order = mongoose.model("Order", OrderSchema)
const Bill  = mongoose.model("Bill",  BillSchema)

// ─── Menu items ───────────────────────────────────────────────────────────────
const KITCHEN_ITEMS = [
  { _id: "69da538c43fcf2e7506be770", name: "Momo",                 category: "Snacks",          destination: "kitchen", price: 180 },
  { _id: "69da538c43fcf2e7506be771", name: "Chowmein",             category: "Snacks",          destination: "kitchen", price: 180 },
  { _id: "69da538c43fcf2e7506be772", name: "Thukpa",               category: "Snacks",          destination: "kitchen", price: 200 },
  { _id: "69da538c43fcf2e7506be773", name: "Sadeko",               category: "Snacks",          destination: "kitchen", price: 200 },
  { _id: "69da538c43fcf2e7506be774", name: "Samosa",               category: "Snacks",          destination: "kitchen", price: 120 },
  { _id: "69da538c43fcf2e7506be775", name: "Spring Roll",          category: "Snacks",          destination: "kitchen", price: 180 },
  { _id: "69da538c43fcf2e7506be776", name: "Pakoda",               category: "Snacks",          destination: "kitchen", price: 150 },
  { _id: "69da538c43fcf2e7506be777", name: "Chatpate",             category: "Snacks",          destination: "kitchen", price: 80  },
  { _id: "69da538c43fcf2e7506be778", name: "French Fries",         category: "Snacks",          destination: "kitchen", price: 150 },
  { _id: "69da538c43fcf2e7506be779", name: "Soup",                 category: "Snacks",          destination: "kitchen", price: 180 },
  { _id: "69d9d6cd70123d7b1123579c", name: "Thakali Khana Set",    category: "Thakali",         destination: "kitchen", price: 380 },
  { _id: "69d9d6cd70123d7b1123579d", name: "Thakali Dhedo Set",    category: "Thakali",         destination: "kitchen", price: 400 },
  { _id: "69d9ebc2797116c224ffaa9c", name: "Sekuwa",               category: "Non-Veg Special", destination: "kitchen", price: 320 },
  { _id: "69d9ebc2797116c224ffaa9d", name: "Choila",               category: "Non-Veg Special", destination: "kitchen", price: 300 },
  { _id: "69d9ebc2797116c224ffaa9e", name: "Grill Platter",        category: "Non-Veg Special", destination: "kitchen", price: 480 },
  { _id: "69d9ebc2797116c224ffaa9f", name: "Tandoori",             category: "Non-Veg Special", destination: "kitchen", price: 480 },
  { _id: "69d9ebc2797116c224ffaaa0", name: "Buff Sukuti",          category: "Non-Veg Special", destination: "kitchen", price: 340 },
  { _id: "69d9ebc2797116c224ffaaa1", name: "Chicken Chilli",       category: "Non-Veg Special", destination: "kitchen", price: 380 },
  { _id: "69d9ebc2797116c224ffaaa2", name: "Pork Special",         category: "Non-Veg Special", destination: "kitchen", price: 380 },
  { _id: "69d9ebc2797116c224ffaaa3", name: "Fish Special",         category: "Non-Veg Special", destination: "kitchen", price: 420 },
  { _id: "69d9dc34cb9ecf1c708fd75b", name: "Nepali Breakfast",     category: "Breakfast",       destination: "kitchen", price: 320 },
  { _id: "69d9dc34cb9ecf1c708fd75c", name: "Bread Omelette",       category: "Breakfast",       destination: "kitchen", price: 280 },
  { _id: "69d9dc34cb9ecf1c708fd75e", name: "Aloo Paratha",         category: "Breakfast",       destination: "kitchen", price: 260 },
  { _id: "69d9dc34cb9ecf1c708fd761", name: "Continental Breakfast",category: "Breakfast",       destination: "kitchen", price: 350 },
  { _id: "69d9dc34cb9ecf1c708fd762", name: "Pancakes",             category: "Breakfast",       destination: "kitchen", price: 320 },
  { _id: "69d9dc34cb9ecf1c708fd763", name: "French Toast",         category: "Breakfast",       destination: "kitchen", price: 300 },
  { _id: "69da55ea28ac01aa7b4d0dd5", name: "Veg Pizza",            category: "Pizza",           destination: "kitchen", price: 320 },
  { _id: "69da55ea28ac01aa7b4d0dd6", name: "Non-Veg Pizza",        category: "Pizza",           destination: "kitchen", price: 440 },
  { _id: "69da5a97c257f0aa33ee1d8c", name: "Chef's Mixed Platter", category: "Special",         destination: "kitchen", price: 780 },
  { _id: "69da5a97c257f0aa33ee1d8d", name: "Khasi ko Masu",        category: "Special",         destination: "kitchen", price: 520 },
  { _id: "69da5a97c257f0aa33ee1d8e", name: "Biryani",              category: "Special",         destination: "kitchen", price: 320 },
  { _id: "69da5a97c257f0aa33ee1d8f", name: "Himalayan Special Rack",category: "Special",        destination: "kitchen", price: 980 },
  { _id: "69d8565e4ba61f070ba77b87", name: "Rasbari",              category: "Desserts",        destination: "kitchen", price: 80  },
  { _id: "69d8567a4ba61f070ba77b8b", name: "LalMohan",             category: "Desserts",        destination: "kitchen", price: 80  },
  { _id: "69d7b0c3fc3985beec989111", name: "Ice Cream",            category: "Desserts",        destination: "kitchen", price: 120 },
]

const BAR_ITEMS = [
  { _id: "69d9ea1b0c239717539e54a3", name: "Tea",               category: "Beverages",       destination: "bar", price: 120  },
  { _id: "69d9ea1b0c239717539e54a4", name: "Coffee",            category: "Beverages",       destination: "bar", price: 150  },
  { _id: "69d9ea1b0c239717539e54a5", name: "Cold Drinks",       category: "Beverages",       destination: "bar", price: 120  },
  { _id: "69d9d65f69d199f36f09b21f", name: "Classic Mojito",    category: "Seasonal Drinks", destination: "bar", price: 350  },
  { _id: "69d9d65f69d199f36f09b220", name: "Strawberry Mojito", category: "Seasonal Drinks", destination: "bar", price: 390  },
  { _id: "69d9d65f69d199f36f09b221", name: "Mango Mojito",      category: "Seasonal Drinks", destination: "bar", price: 390  },
  { _id: "69d9d65f69d199f36f09b222", name: "Watermelon Mojito", category: "Seasonal Drinks", destination: "bar", price: 390  },
  { _id: "69d9d65f69d199f36f09b223", name: "Virgin Pina Colada",category: "Seasonal Drinks", destination: "bar", price: 420  },
  { _id: "69d9d65f69d199f36f09b229", name: "Fresh Lime Soda",   category: "Seasonal Drinks", destination: "bar", price: 280  },
  { _id: "69d9d65f69d199f36f09b22a", name: "Ginger Lemonade",   category: "Seasonal Drinks", destination: "bar", price: 320  },
  { _id: "69d9cee03dac0bd1c53dd51b", name: "Gorkha Beer",       category: "Beer",            destination: "bar", price: 230  },
  { _id: "69d9cee03dac0bd1c53dd51c", name: "Gorkha Strong",     category: "Beer",            destination: "bar", price: 230  },
  { _id: "69d9cee03dac0bd1c53dd51e", name: "Nepal Ice",         category: "Beer",            destination: "bar", price: 215  },
  { _id: "69d9cee03dac0bd1c53dd51f", name: "Tuborg",            category: "Beer",            destination: "bar", price: 425  },
  { _id: "69d9cee03dac0bd1c53dd520", name: "Carlsberg",         category: "Beer",            destination: "bar", price: 480  },
  { _id: "69d7ae66fc3985beec9890ea", name: "Big Master Wine",   category: "Wine",            destination: "bar", price: 950  },
  { _id: "69d7aed4fc3985beec9890ee", name: "Divine Wine",       category: "Wine",            destination: "bar", price: 815  },
  { _id: "69d7aefafc3985beec9890f2", name: "Hinwa Wine",        category: "Wine",            destination: "bar", price: 810  },
  { _id: "69d7af24fc3985beec9890f6", name: "Manang Valley Wine",category: "Wine",            destination: "bar", price: 1300 },
  { _id: "69d9ca19e73a25d58b95c0a2", name: "Old Durbar",        category: "Hard Drinks",     destination: "bar", price: 1350 },
  { _id: "69d9ca19e73a25d58b95c0a3", name: "Khukri Rum",        category: "Hard Drinks",     destination: "bar", price: 380  },
  { _id: "69d9ca19e73a25d58b95c0a4", name: "Ruslan Vodka",      category: "Hard Drinks",     destination: "bar", price: 550  },
  { _id: "69d9ca19e73a25d58b95c0a7", name: "Signature Whisky",  category: "Hard Drinks",     destination: "bar", price: 1100 },
]

const TABLES = ["G1","G2","G3","G4","G5","G6","RT1","RT2","RT4","RT5","FR1","FR2","FR3","PR1","PR2"]

const COMBOS = [
  { kitchen: ["Momo","Sekuwa"],                bar: ["Gorkha Beer","Gorkha Beer"],          weight: 12 },
  { kitchen: ["Momo","Choila"],                bar: ["Gorkha Beer","Nepal Ice"],            weight: 10 },
  { kitchen: ["Sekuwa","Buff Sukuti"],         bar: ["Old Durbar","Gorkha Beer"],           weight: 8  },
  { kitchen: ["Momo","French Fries"],          bar: ["Cold Drinks","Cold Drinks"],          weight: 9  },
  { kitchen: ["Thakali Khana Set"],            bar: ["Tea"],                                weight: 11 },
  { kitchen: ["Thakali Dhedo Set"],            bar: ["Tea"],                                weight: 8  },
  { kitchen: ["Thakali Khana Set","Rasbari"],  bar: ["Tea","Tea"],                          weight: 6  },
  { kitchen: ["Sekuwa","Choila"],              bar: ["Signature Whisky","Gorkha Beer"],     weight: 7  },
  { kitchen: ["Grill Platter"],               bar: ["Old Durbar","Gorkha Beer"],            weight: 6  },
  { kitchen: ["Tandoori","Momo"],             bar: ["Khukri Rum","Cold Drinks"],            weight: 5  },
  { kitchen: ["Khasi ko Masu"],               bar: ["Old Durbar"],                          weight: 5  },
  { kitchen: ["Himalayan Special Rack"],      bar: ["Manang Valley Wine","Divine Wine"],    weight: 4  },
  { kitchen: ["Chef's Mixed Platter"],        bar: ["Big Master Wine"],                     weight: 4  },
  { kitchen: ["Biryani"],                     bar: ["Classic Mojito","Fresh Lime Soda"],    weight: 6  },
  { kitchen: ["Nepali Breakfast"],            bar: ["Tea","Tea"],                           weight: 8  },
  { kitchen: ["Bread Omelette"],              bar: ["Tea","Coffee"],                        weight: 7  },
  { kitchen: ["Aloo Paratha"],               bar: ["Tea"],                                  weight: 6  },
  { kitchen: ["Continental Breakfast"],      bar: ["Coffee"],                               weight: 5  },
  { kitchen: ["Pancakes","French Toast"],    bar: ["Coffee","Cold Drinks"],                 weight: 4  },
  { kitchen: ["Momo","Spring Roll"],         bar: ["Mango Mojito","Strawberry Mojito"],     weight: 7  },
  { kitchen: ["French Fries","Samosa"],      bar: ["Classic Mojito","Fresh Lime Soda"],     weight: 6  },
  { kitchen: ["Chatpate","Sadeko"],          bar: ["Ginger Lemonade","Fresh Lime Soda"],    weight: 5  },
  { kitchen: ["Non-Veg Pizza"],             bar: ["Tuborg","Carlsberg"],                    weight: 5  },
  { kitchen: ["Veg Pizza"],                 bar: ["Cold Drinks","Classic Mojito"],          weight: 4  },
  { kitchen: ["Thakali Khana Set","Rasbari","LalMohan"], bar: ["Tea"],                      weight: 4  },
  { kitchen: ["Biryani","Ice Cream"],       bar: ["Fresh Lime Soda"],                       weight: 3  },
  { kitchen: ["Buff Sukuti","Chatpate"],    bar: ["Gorkha Beer","Gorkha Beer","Nepal Ice"],  weight: 6  },
  { kitchen: ["Sekuwa"],                    bar: ["Gorkha Strong","Gorkha Strong"],          weight: 5  },
  { kitchen: ["Soup","Thukpa"],             bar: ["Tea"],                                    weight: 4  },
  { kitchen: ["Soup","Momo"],               bar: ["Tea","Coffee"],                           weight: 4  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function pickRandom(arr)   { return arr[Math.floor(Math.random() * arr.length)] }

function weightedCombo() {
  const total = COMBOS.reduce((s, c) => s + c.weight, 0)
  let r = Math.random() * total
  for (const combo of COMBOS) { r -= combo.weight; if (r <= 0) return combo }
  return COMBOS[0]
}

function getMealHour(period) {
  if (period === "breakfast") return randInt(7, 10)
  if (period === "lunch")     return randInt(11, 14)
  if (period === "evening")   return randInt(15, 18)
  return randInt(18, 22)
}

function isWeekend(date) { const d = date.getDay(); return d === 0 || d === 6 }

function buildItems(combo) {
  const items = []
  const all   = [
    ...combo.kitchen.map(n => KITCHEN_ITEMS.find(i => i.name === n)),
    ...combo.bar.map(n => BAR_ITEMS.find(i => i.name === n)),
  ].filter(Boolean)

  for (const found of all) {
    const existing = items.find(i => i.name === found.name)
    if (existing) { existing.quantity++ }
    else {
      items.push({
        menuItem:            new mongoose.Types.ObjectId(found._id),
        name:                found.name,
        price:               found.price,
        category:            found.category,
        destination:         found.destination,
        quantity:            1,
        selectedIngredients: [],
        removedIngredients:  [],
        selectedOptions:     [],
      })
    }
  }
  return items
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(MONGO_URI)
  console.log("✅ Connected to MongoDB")
  console.log("📅 Filling gap: Feb 16, 2026 → Apr 10, 2026\n")

  const START = new Date("2026-02-16T00:00:00.000Z")
  const END   = new Date("2026-04-10T23:59:59.000Z")

  const allOrders = []

  let current = new Date(START)
  while (current <= END) {
    const weekend = isWeekend(current)
    const ordersToday = weekend ? randInt(8, 12) : randInt(4, 8)

    for (let i = 0; i < ordersToday; i++) {
      const r = Math.random()
      let period
      if      (r < 0.15) period = "breakfast"
      else if (r < 0.40) period = "lunch"
      else if (r < 0.60) period = "evening"
      else               period = "dinner"

      const hour  = getMealHour(period)
      const table = pickRandom(TABLES)

      let combo
      if (period === "breakfast") {
        const bCombos = COMBOS.filter(c =>
          c.kitchen.some(k => ["Nepali Breakfast","Bread Omelette","Aloo Paratha","Continental Breakfast","Pancakes","French Toast"].includes(k))
        )
        combo = Math.random() < 0.7 ? pickRandom(bCombos) : weightedCombo()
      } else {
        combo = weightedCombo()
      }

      const orderTime = new Date(current)
      orderTime.setHours(hour, randInt(0, 59), randInt(0, 59), 0)

      const items    = buildItems(combo)
      const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
      if (subtotal === 0) continue

      const vatAmount   = Math.round(subtotal * VAT_PERCENT / 100)
      const totalAmount = subtotal + vatAmount
      const billedTime  = new Date(orderTime.getTime() + randInt(20, 45) * 60000)

      allOrders.push({
        orderDoc: {
          tableNumber: table,
          items,
          status:      "billed",
          totalAmount: subtotal,
          statusHistory: [
            { status: "pending", changedAt: new Date(orderTime.getTime()) },
            { status: "cooking", changedAt: new Date(orderTime.getTime() + randInt(2,5)  * 60000) },
            { status: "ready",   changedAt: new Date(orderTime.getTime() + randInt(10,20)* 60000) },
            { status: "served",  changedAt: new Date(orderTime.getTime() + randInt(20,30)* 60000) },
            { status: "billed",  changedAt: billedTime },
          ],
          createdAt: orderTime,
          updatedAt: billedTime,
        },
        subtotal, vatAmount, totalAmount, billedTime, table,
      })
    }

    current.setDate(current.getDate() + 1)
  }

  // ── Insert in batches of 50 ──────────────────────────────────────────────────
  const BATCH = 50
  let createdOrders = 0
  let createdBills  = 0

  console.log(`📦 Inserting ${allOrders.length} orders...`)

  for (let i = 0; i < allOrders.length; i += BATCH) {
    const batch    = allOrders.slice(i, i + BATCH)
    const inserted = await Order.insertMany(batch.map(b => b.orderDoc), { timestamps: false })
    createdOrders += inserted.length

    const bills = inserted.map((order, idx) => {
      const b = batch[idx]
      return {
        tableNumber:        b.table,
        orders:             [order._id],
        subtotal:           b.subtotal,
        vatPercent:         VAT_PERCENT,
        vatAmount:          b.vatAmount,
        tipAmount:          0,
        discountAmount:     0,
        appliedOffers:      [],
        discountedSubtotal: 0,
        totalAmount:        b.totalAmount,
        paymentMethod:      pickRandom(PAYMENT_METHODS),
        paymentStatus:      "paid",
        paidAt:             b.billedTime,
        note:               "",
        createdAt:          b.billedTime,
        updatedAt:          b.billedTime,
      }
    })

    const insertedBills = await Bill.insertMany(bills, { timestamps: false })
    createdBills += insertedBills.length

    process.stdout.write(`\r   Progress: ${createdOrders}/${allOrders.length} orders`)
  }

  console.log(`\n\n✅ Done!`)
  console.log(`   Orders inserted: ${createdOrders}`)
  console.log(`   Bills inserted:  ${createdBills}`)
  console.log(`   Date range:      Feb 16, 2026 → Apr 10, 2026`)
  console.log(`\n🎯 Gap filled! Ready for Apriori + Prophet.`)

  await mongoose.disconnect()
}

seed().catch(err => {
  console.error("❌ Seed failed:", err)
  mongoose.disconnect()
  process.exit(1)
})