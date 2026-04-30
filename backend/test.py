from pymongo import MongoClient

MONGO_URI = "mongodb+srv://Priorify:1234567890@moeezdatabases.nyxyde8.mongodb.net/StockForge?retryWrites=true&w=majority"

client = MongoClient(MONGO_URI)
db = client["StockForge"]

collections = [
    "features",
    "predictions",
    "model_metrics",
    "shap_importance",
    "training_history",
    "portfolio_signals",
    "price_history",
]

for c in collections:
    db[c].delete_many({})
    print(f"Cleared {c}")

print("✅ All collections cleared")