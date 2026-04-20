"""
app.py
Flask server that loads Apriori rules and serves recommendations
Usage: python app.py
Runs on: http://localhost:5000
"""
import ast
import pandas as pd
from flask import Flask, request, jsonify

app = Flask(__name__)

# ─── Load rules once at startup ───────────────────────────────────────────────
print("📦 Loading Apriori rules...")
try:
    rules = pd.read_csv("rules.csv")
    rules["antecedents"] = rules["antecedents"].apply(lambda x: set(x.split(",")))
    rules["consequents"] = rules["consequents"].apply(lambda x: set(x.split(",")))
    print(f"✅ Loaded {len(rules)} rules from rules.csv")
except FileNotFoundError:
    print("❌ rules.csv not found. Run train.py first!")
    rules = pd.DataFrame()

# ─── Helper: get recommendations ─────────────────────────────────────────────
def get_recommendations(ordered_items, top_n=5):
    """
    Given a list of items already ordered,
    return top N recommended items not already in the order.
    """
    if rules.empty:
        return []

    ordered_set = set(ordered_items)
    scores = {}

    for _, row in rules.iterrows():
        antecedents = set(row["antecedents"])
        consequents = set(row["consequents"])

        # Check if any ordered item matches the antecedent
        if antecedents.issubset(ordered_set):
            for item in consequents:
                # Don't recommend items already ordered
                if item not in ordered_set:
                    # Score = confidence * lift (higher = better recommendation)
                    score = row["confidence"] * row["lift"]
                    if item in scores:
                        scores[item] = max(scores[item], score)
                    else:
                        scores[item] = score

    # Sort by score descending
    sorted_items = sorted(scores.items(), key=lambda x: x[1], reverse=True)

    return [item for item, score in sorted_items[:top_n]]

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "rules_loaded": len(rules),
        "message": "Himalaya Kitchen ML server is running"
    })

@app.route("/recommend", methods=["GET"])
def recommend():
    """
    GET /recommend?items=Momo,Sekuwa
    Returns recommended items based on current order
    """
    items_param = request.args.get("items", "")

    if not items_param:
        return jsonify({
            "success": False,
            "message": "No items provided. Use ?items=Momo,Sekuwa",
            "recommendations": []
        }), 400

    # Parse items
    ordered_items = [item.strip() for item in items_param.split(",") if item.strip()]

    if not ordered_items:
        return jsonify({
            "success": False,
            "message": "Invalid items format",
            "recommendations": []
        }), 400

    recommendations = get_recommendations(ordered_items, top_n=5)

    return jsonify({
        "success":         True,
        "ordered_items":   ordered_items,
        "recommendations": recommendations,
        "count":           len(recommendations)
    })

@app.route("/recommend", methods=["POST"])
def recommend_post():
    """
    POST /recommend
    Body: { "items": ["Momo", "Sekuwa"] }
    Returns recommended items based on current order
    """
    data = request.get_json()

    if not data or "items" not in data:
        return jsonify({
            "success": False,
            "message": "Request body must have 'items' array",
            "recommendations": []
        }), 400

    ordered_items = data["items"]

    if not isinstance(ordered_items, list) or len(ordered_items) == 0:
        return jsonify({
            "success": False,
            "message": "items must be a non-empty array",
            "recommendations": []
        }), 400

    recommendations = get_recommendations(ordered_items, top_n=5)

    return jsonify({
        "success":         True,
        "ordered_items":   ordered_items,
        "recommendations": recommendations,
        "count":           len(recommendations)
    })

# ─── Start server ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("🚀 Starting Himalaya Kitchen ML server on port 5000...")
    print("   Health check: http://localhost:5000/health")
    print("   Recommend:    http://localhost:5000/recommend?items=Momo,Sekuwa")
    app.run(host="0.0.0.0", port=5000, debug=False)