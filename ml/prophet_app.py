"""
prophet_app.py
Flask server that reads forecast CSVs and serves them as API
Runs on: http://localhost:5001
Usage: python prophet_app.py
"""

import pandas as pd
from flask import Flask, jsonify

app = Flask(__name__)

# ─── Load CSVs once at startup ────────────────────────────────────────────────
print("📦 Loading forecast data...")

try:
    orders_df    = pd.read_csv("forecast_orders.csv")
    print(f"   ✅ forecast_orders.csv    — {len(orders_df)} days")
except Exception as e:
    print(f"   ❌ forecast_orders.csv not found: {e}")
    orders_df = pd.DataFrame()

try:
    revenue_df   = pd.read_csv("forecast_revenue.csv")
    print(f"   ✅ forecast_revenue.csv   — {len(revenue_df)} days")
except Exception as e:
    print(f"   ❌ forecast_revenue.csv not found: {e}")
    revenue_df = pd.DataFrame()

try:
    items_df     = pd.read_csv("forecast_items.csv")
    print(f"   ✅ forecast_items.csv     — {len(items_df)} rows")
except Exception as e:
    print(f"   ❌ forecast_items.csv not found: {e}")
    items_df = pd.DataFrame()

try:
    hours_df     = pd.read_csv("forecast_hours.csv")
    print(f"   ✅ forecast_hours.csv     — {len(hours_df)} hours")
except Exception as e:
    print(f"   ❌ forecast_hours.csv not found: {e}")
    hours_df = pd.DataFrame()

try:
    hours_dow_df = pd.read_csv("forecast_hours_dow.csv")
    print(f"   ✅ forecast_hours_dow.csv — {len(hours_dow_df)} rows")
except Exception as e:
    print(f"   ❌ forecast_hours_dow.csv not found: {e}")
    hours_dow_df = pd.DataFrame()

try:
    least_df = pd.read_csv("forecast_least_items.csv")
    print(f"   ✅ forecast_least_items.csv — {len(least_df)} slow sellers")
except Exception as e:
    print(f"   ❌ forecast_least_items.csv not found: {e}")
    least_df = pd.DataFrame()

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status":  "ok",
        "message": "Himalaya Kitchen Prophet server running",
        "models":  {
            "orders":      not orders_df.empty,
            "revenue":     not revenue_df.empty,
            "items":       not items_df.empty,
            "hours":       not hours_df.empty,
            "hours_dow":   not hours_dow_df.empty,
            "least_items": not least_df.empty,
        }
    })

@app.route("/forecast/orders", methods=["GET"])
def forecast_orders():
    if orders_df.empty:
        return jsonify({ "success": False, "message": "No order forecast data" }), 500

    data = orders_df.head(14).to_dict(orient="records")
    # Next 7 days summary
    next7      = orders_df.head(7)
    total      = int(next7["yhat"].sum())
    daily_avg  = round(next7["yhat"].mean(), 1)
    peak_day   = next7.loc[next7["yhat"].idxmax(), "ds"]
    peak_count = int(next7["yhat"].max())

    return jsonify({
        "success":   True,
        "forecast":  data,
        "summary": {
            "next_7_days_total": total,
            "daily_average":     daily_avg,
            "peak_day":          peak_day,
            "peak_day_orders":   peak_count,
        }
    })

@app.route("/forecast/revenue", methods=["GET"])
def forecast_revenue():
    if revenue_df.empty:
        return jsonify({ "success": False, "message": "No revenue forecast data" }), 500

    data = revenue_df.head(14).to_dict(orient="records")
    next7         = revenue_df.head(7)
    total         = int(next7["yhat"].sum())
    daily_avg     = int(next7["yhat"].mean())
    peak_day      = next7.loc[next7["yhat"].idxmax(), "ds"]
    peak_revenue  = int(next7["yhat"].max())

    return jsonify({
        "success":  True,
        "forecast": data,
        "summary": {
            "next_7_days_total": total,
            "daily_average":     daily_avg,
            "peak_day":          peak_day,
            "peak_day_revenue":  peak_revenue,
        }
    })

@app.route("/forecast/items", methods=["GET"])
def forecast_items():
    if items_df.empty:
        return jsonify({ "success": False, "message": "No item forecast data" }), 500

    # Group by item
    result = {}
    for item_name, group in items_df.groupby("item"):
        result[item_name] = group[["ds", "yhat"]].to_dict(orient="records")

    # Top item next 7 days
    item_totals = items_df.groupby("item")["yhat"].sum().sort_values(ascending=False)
    top_item    = item_totals.index[0] if not item_totals.empty else None

    return jsonify({
        "success":   True,
        "forecasts": result,
        "top_items": item_totals.index.tolist(),
        "summary": {
            "highest_demand_item":  top_item,
            "highest_demand_count": int(item_totals.iloc[0]) if not item_totals.empty else 0,
        }
    })

@app.route("/forecast/hours", methods=["GET"])
def forecast_hours():
    if hours_df.empty:
        return jsonify({ "success": False, "message": "No hours data" }), 500

    hourly     = hours_df.to_dict(orient="records")
    hourly_dow = hours_dow_df.to_dict(orient="records") if not hours_dow_df.empty else []

    # Peak hours
    top3 = hours_df.nlargest(3, "count")
    peak_hours = [
        { "hour": int(row["hour"]), "count": int(row["count"]) }
        for _, row in top3.iterrows()
    ]

    # Label hours nicely
    def label(h):
        if h == 0:   return "12 AM"
        if h < 12:   return f"{h} AM"
        if h == 12:  return "12 PM"
        return f"{h-12} PM"

    for row in hourly:
        row["label"] = label(int(row["hour"]))

    return jsonify({
        "success":    True,
        "hourly":     hourly,
        "hourly_dow": hourly_dow,
        "peak_hours": peak_hours,
        "summary": {
            "busiest_hour":       peak_hours[0]["hour"] if peak_hours else None,
            "busiest_hour_label": label(peak_hours[0]["hour"]) if peak_hours else None,
        }
    })

@app.route("/forecast/suggestions", methods=["GET"])
def forecast_suggestions():
    if least_df.empty:
        return jsonify({ "success": True, "suggestions": [], "message": "No slow-seller data — retrain model first" })

    suggestions = []
    for _, row in least_df.iterrows():
        suggestions.append({
            "item":               row["item"],
            "forecasted_qty":     round(float(row["forecasted_qty"]), 2),
            "avg_qty":            round(float(row["avg_qty"]), 2),
            "gap_pct":            round(float(row["gap_pct"]), 2),
            "suggested_discount": round(float(row["suggested_discount"]), 1),
        })

    return jsonify({ "success": True, "suggestions": suggestions })

# ─── Start ────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("\n🚀 Starting Himalaya Kitchen Prophet server on port 5001...")
    print("   Health:       http://localhost:5001/health")
    print("   Orders:       http://localhost:5001/forecast/orders")
    print("   Revenue:      http://localhost:5001/forecast/revenue")
    print("   Items:        http://localhost:5001/forecast/items")
    print("   Hours:        http://localhost:5001/forecast/hours")
    print("   Suggestions:  http://localhost:5001/forecast/suggestions")
    app.run(host="0.0.0.0", port=5001, debug=False)