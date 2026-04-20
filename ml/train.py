"""
train.py
Reads orders from MongoDB, runs Apriori, saves rules to rules.pkl
Usage: python train.py
"""

import pickle
import pandas as pd
from pymongo import MongoClient
from mlxtend.frequent_patterns import apriori, association_rules
from mlxtend.preprocessing import TransactionEncoder

# ─── Config ───────────────────────────────────────────────────────────────────
MONGO_URI   = "mongodb://localhost:27017"
DB_NAME     = "restaurant-system"
COLLECTION  = "orders"

MIN_SUPPORT    = 0.02   # item combo must appear in at least 2% of orders
MIN_CONFIDENCE = 0.3    # rule must be correct at least 30% of the time
MIN_LIFT       = 1.2    # items must be more likely together than by chance

OUTPUT_FILE = "rules.pkl"

# ─── Step 1: Load orders from MongoDB ─────────────────────────────────────────
print("📦 Connecting to MongoDB...")
client = MongoClient(MONGO_URI)
db     = client[DB_NAME]

orders = list(db[COLLECTION].find(
    { "status": "billed" },
    { "items.name": 1, "_id": 0 }
))

print(f"✅ Loaded {len(orders)} orders from MongoDB")

# ─── Step 2: Build transactions ───────────────────────────────────────────────
# Each order becomes a list of item names
# e.g. [["Momo", "Sekuwa", "Gorkha Beer"], ["Thakali Khana Set", "Tea"], ...]

transactions = []
for order in orders:
    items = order.get("items", [])
    names = list(set([item["name"] for item in items if "name" in item]))
    if len(names) >= 2:   # skip single item orders — no association possible
        transactions.append(names)

print(f"✅ {len(transactions)} valid transactions (2+ items)")

if len(transactions) < 50:
    print("⚠️  Warning: Too few transactions. Add more order data for better rules.")

# ─── Step 3: Encode transactions ──────────────────────────────────────────────
print("⚙️  Encoding transactions...")
te     = TransactionEncoder()
te_arr = te.fit(transactions).transform(transactions)
df     = pd.DataFrame(te_arr, columns=te.columns_)

print(f"✅ {df.shape[0]} transactions, {df.shape[1]} unique items")

# ─── Step 4: Run Apriori ──────────────────────────────────────────────────────
print(f"🔍 Running Apriori (min_support={MIN_SUPPORT})...")
frequent_itemsets = apriori(
    df,
    min_support=MIN_SUPPORT,
    use_colnames=True,
    max_len=4          # max 4 items in a combo
)

print(f"✅ Found {len(frequent_itemsets)} frequent itemsets")

if len(frequent_itemsets) == 0:
    print("❌ No frequent itemsets found. Try lowering MIN_SUPPORT.")
    exit(1)

# ─── Step 5: Generate association rules ───────────────────────────────────────
print(f"📐 Generating rules (min_confidence={MIN_CONFIDENCE}, min_lift={MIN_LIFT})...")
rules = association_rules(
    frequent_itemsets,
    metric="confidence",
    min_threshold=MIN_CONFIDENCE,
    num_itemsets=len(frequent_itemsets)
)

# Filter by lift
rules = rules[rules["lift"] >= MIN_LIFT]

# Sort by lift descending (strongest rules first)
rules = rules.sort_values("lift", ascending=False).reset_index(drop=True)

print(f"✅ Generated {len(rules)} association rules")

if len(rules) == 0:
    print("❌ No rules found. Try lowering MIN_CONFIDENCE or MIN_LIFT.")
    exit(1)

# ─── Step 6: Preview top rules ────────────────────────────────────────────────
print("\n🏆 Top 10 Rules:")
print("-" * 70)
for _, row in rules.head(10).iterrows():
    antecedents = list(row["antecedents"])
    consequents = list(row["consequents"])
    print(f"  {antecedents} → {consequents}")
    print(f"    confidence: {row['confidence']:.0%}  lift: {row['lift']:.2f}  support: {row['support']:.2%}")
    print()

# ─── Step 7: Save rules to file ───────────────────────────────────────────────
print(f"💾 Saving rules to rules.csv...")
rules["antecedents"] = rules["antecedents"].apply(lambda x: ",".join(list(x)))
rules["consequents"] = rules["consequents"].apply(lambda x: ",".join(list(x)))
rules.to_csv("rules.csv", index=False)

print(f"✅ Rules saved to rules.csv")

print(f"\n🎯 Training complete! Run app.py to start the recommendation server.")

client.close()