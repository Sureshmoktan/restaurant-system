"""
prophet_train.py
Trains 4 Prophet models and saves forecasts as CSV (consistent with rules.csv)
Usage: python prophet_train.py
"""

import pandas as pd
from pymongo import MongoClient
from prophet import Prophet
import warnings
warnings.filterwarnings("ignore")

MONGO_URI = "mongodb://localhost:27017"
DB_NAME   = "restaurant-system"

# ─── Connect ──────────────────────────────────────────────────────────────────
print("📦 Connecting to MongoDB...")
client = MongoClient(MONGO_URI)
db     = client[DB_NAME]

print("📊 Loading orders and bills...")
orders = list(db["orders"].find(
    { "status": "billed" },
    { "createdAt": 1, "items": 1, "totalAmount": 1 }
))
bills = list(db["bills"].find(
    { "paymentStatus": "paid" },
    { "createdAt": 1, "totalAmount": 1 }
))
print(f"   Orders: {len(orders)}")
print(f"   Bills:  {len(bills)}")

def to_df(records, date_field="createdAt"):
    df = pd.DataFrame(records)
    df[date_field] = pd.to_datetime(df[date_field])
    return df

# ═══════════════════════════════════════════════════════════════════════════════
# MODEL 1 — Daily Order Volume → forecast_orders.csv
# ═══════════════════════════════════════════════════════════════════════════════
print("\n🔮 Training Model 1: Daily Order Volume...")

orders_df = to_df(orders)
daily_orders = (
    orders_df.groupby(orders_df["createdAt"].dt.date)
    .size()
    .reset_index()
)
daily_orders.columns = ["ds", "y"]
daily_orders["ds"] = pd.to_datetime(daily_orders["ds"])

m1 = Prophet(
    yearly_seasonality=False,
    weekly_seasonality=True,
    daily_seasonality=False,
    seasonality_mode="additive",
)
m1.fit(daily_orders)

future1   = m1.make_future_dataframe(periods=14, freq="D")
forecast1 = m1.predict(future1).tail(14)[["ds", "yhat", "yhat_lower", "yhat_upper"]]
forecast1["ds"]         = forecast1["ds"].dt.strftime("%Y-%m-%d")
forecast1["yhat"]       = forecast1["yhat"].round(0).clip(lower=0)
forecast1["yhat_lower"] = forecast1["yhat_lower"].round(0).clip(lower=0)
forecast1["yhat_upper"] = forecast1["yhat_upper"].round(0).clip(lower=0)
forecast1.to_csv("forecast_orders.csv", index=False)

print(f"   ✅ Trained on {len(daily_orders)} days → saved forecast_orders.csv")
print(f"   Next 7 days: {forecast1['yhat'].head(7).astype(int).tolist()} orders/day")

# ═══════════════════════════════════════════════════════════════════════════════
# MODEL 2 — Daily Revenue → forecast_revenue.csv
# ═══════════════════════════════════════════════════════════════════════════════
print("\n🔮 Training Model 2: Daily Revenue...")

bills_df = to_df(bills)
daily_revenue = (
    bills_df.groupby(bills_df["createdAt"].dt.date)["totalAmount"]
    .sum()
    .reset_index()
)
daily_revenue.columns = ["ds", "y"]
daily_revenue["ds"] = pd.to_datetime(daily_revenue["ds"])

m2 = Prophet(
    yearly_seasonality=False,
    weekly_seasonality=True,
    daily_seasonality=False,
    seasonality_mode="multiplicative",
)
m2.fit(daily_revenue)

future2   = m2.make_future_dataframe(periods=14, freq="D")
forecast2 = m2.predict(future2).tail(14)[["ds", "yhat", "yhat_lower", "yhat_upper"]]
forecast2["ds"]         = forecast2["ds"].dt.strftime("%Y-%m-%d")
forecast2["yhat"]       = forecast2["yhat"].round(0).clip(lower=0)
forecast2["yhat_lower"] = forecast2["yhat_lower"].round(0).clip(lower=0)
forecast2["yhat_upper"] = forecast2["yhat_upper"].round(0).clip(lower=0)
forecast2.to_csv("forecast_revenue.csv", index=False)

print(f"   ✅ Trained on {len(daily_revenue)} days → saved forecast_revenue.csv")
print(f"   Next 7 days: Rs. {forecast2['yhat'].head(7).astype(int).tolist()} /day")

# ═══════════════════════════════════════════════════════════════════════════════
# MODEL 3 — Top 5 Item Demand → forecast_items.csv
# ═══════════════════════════════════════════════════════════════════════════════
print("\n🔮 Training Model 3: Top Item Demand...")

rows = []
for order in orders:
    date = pd.to_datetime(order["createdAt"]).date()
    for item in order.get("items", []):
        rows.append({ "date": date, "name": item.get("name"), "qty": item.get("quantity", 1) })

items_df = pd.DataFrame(rows)

top_items = (
    items_df.groupby("name")["qty"]
    .sum()
    .sort_values(ascending=False)
    .head(5)
    .index.tolist()
)
print(f"   Top 5 items: {top_items}")

all_item_forecasts = []

for item_name in top_items:
    item_daily = (
        items_df[items_df["name"] == item_name]
        .groupby("date")["qty"]
        .sum()
        .reset_index()
    )
    item_daily.columns = ["ds", "y"]
    item_daily["ds"] = pd.to_datetime(item_daily["ds"])

    if len(item_daily) < 10:
        print(f"   ⚠️  Skipping {item_name} — not enough data")
        continue

    m = Prophet(
        yearly_seasonality=False,
        weekly_seasonality=True,
        daily_seasonality=False,
        seasonality_mode="additive",
    )
    m.fit(item_daily)

    future   = m.make_future_dataframe(periods=7, freq="D")
    forecast = m.predict(future).tail(7)[["ds", "yhat"]]
    forecast["ds"]   = forecast["ds"].dt.strftime("%Y-%m-%d")
    forecast["yhat"] = forecast["yhat"].round(0).clip(lower=0)
    forecast["item"] = item_name
    all_item_forecasts.append(forecast)
    print(f"   ✅ {item_name} → {forecast['yhat'].astype(int).tolist()}")

items_csv = pd.concat(all_item_forecasts, ignore_index=True)
items_csv = items_csv[["item", "ds", "yhat"]]
items_csv.to_csv("forecast_items.csv", index=False)
print(f"   ✅ Saved forecast_items.csv")

# ═══════════════════════════════════════════════════════════════════════════════
# MODEL 4 — Hourly Patterns → forecast_hours.csv + forecast_hours_dow.csv
# ═══════════════════════════════════════════════════════════════════════════════
print("\n🔮 Computing Model 4: Hourly Patterns...")

orders_df["hour"] = orders_df["createdAt"].dt.hour
orders_df["dow"]  = orders_df["createdAt"].dt.dayofweek  # 0=Mon 6=Sun

# Overall hourly
hourly = (
    orders_df.groupby("hour")
    .size()
    .reset_index()
)
hourly.columns = ["hour", "count"]
hourly.to_csv("forecast_hours.csv", index=False)

# By day of week + hour
hourly_dow = (
    orders_df.groupby(["dow", "hour"])
    .size()
    .reset_index()
)
hourly_dow.columns = ["dow", "hour", "count"]
hourly_dow.to_csv("forecast_hours_dow.csv", index=False)

peak_hours = hourly.nlargest(3, "count")["hour"].tolist()
print(f"   Peak hours: {peak_hours}")
print(f"   ✅ Saved forecast_hours.csv + forecast_hours_dow.csv")

# ═══════════════════════════════════════════════════════════════════════════════
# MODEL 5 — Least Selling Items → forecast_least_items.csv
# ═══════════════════════════════════════════════════════════════════════════════
print("\n🔮 Detecting least selling items for discount suggestions...")

# Get all items (not just top 5) that have enough data
all_items = items_df.groupby("name")["qty"].sum()
all_item_names = all_items.index.tolist()

least_item_forecasts = []

for item_name in all_item_names:
    item_daily = (
        items_df[items_df["name"] == item_name]
        .groupby("date")["qty"]
        .sum()
        .reset_index()
    )
    item_daily.columns = ["ds", "y"]
    item_daily["ds"] = pd.to_datetime(item_daily["ds"])

    if len(item_daily) < 5:
        continue

    m = Prophet(
        yearly_seasonality=False,
        weekly_seasonality=False,
        daily_seasonality=False,
        seasonality_mode="additive",
    )
    m.fit(item_daily)

    future   = m.make_future_dataframe(periods=7, freq="D")
    forecast = m.predict(future).tail(7)[["ds", "yhat"]]
    forecast["yhat"] = forecast["yhat"].clip(lower=0)

    forecasted_qty = round(forecast["yhat"].mean(), 2)
    avg_qty        = round(item_daily["y"].mean(), 2)

    least_item_forecasts.append({
        "item":           item_name,
        "forecasted_qty": forecasted_qty,
        "avg_qty":        avg_qty,
    })

if least_item_forecasts:
    least_df = pd.DataFrame(least_item_forecasts)

    # Only consider items where avg_qty > 0
    least_df = least_df[least_df["avg_qty"] > 0].copy()

    # Gap = how far below average (positive means below average)
    least_df["gap_pct"] = ((least_df["avg_qty"] - least_df["forecasted_qty"]) / least_df["avg_qty"] * 100).round(2)

    # Keep only slow sellers: 20%+ below average
    slow_sellers = least_df[least_df["gap_pct"] >= 20].copy()

    # Sort by gap_pct descending, take 5 worst
    slow_sellers = slow_sellers.sort_values("gap_pct", ascending=False).head(5)

    # Suggest discount: scale 10–25% based on gap (20%→10%, 100%→25%)
    def suggest_discount(gap_pct):
        clamped = min(max(gap_pct, 20), 100)
        return round(10 + (clamped - 20) / 80 * 15, 1)

    slow_sellers["suggested_discount"] = slow_sellers["gap_pct"].apply(suggest_discount)
    slow_sellers = slow_sellers[["item", "forecasted_qty", "avg_qty", "gap_pct", "suggested_discount"]]
    slow_sellers.to_csv("forecast_least_items.csv", index=False)
    print(f"   ✅ Found {len(slow_sellers)} slow-selling items → saved forecast_least_items.csv")
    for _, row in slow_sellers.iterrows():
        print(f"      {row['item']}: {row['gap_pct']}% below avg → suggest {row['suggested_discount']}% discount")
else:
    # Write empty CSV with correct columns
    pd.DataFrame(columns=["item", "forecasted_qty", "avg_qty", "gap_pct", "suggested_discount"]).to_csv(
        "forecast_least_items.csv", index=False
    )
    print("   ℹ️  Not enough item data for slow-seller detection")

# ─── Summary ──────────────────────────────────────────────────────────────────
print("\n" + "="*50)
print("✅ All models trained! CSV files saved:")
print("   forecast_orders.csv      — 14 day order volume")
print("   forecast_revenue.csv     — 14 day revenue")
print("   forecast_items.csv       — 7 day top item demand")
print("   forecast_hours.csv       — hourly order pattern")
print("   forecast_hours_dow.csv   — hourly by day of week")
print("   forecast_least_items.csv — slow-seller discount suggestions")
print("\n🎯 Run prophet_app.py to start the forecast server.")

client.close()