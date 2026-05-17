import pandas as pd
from sklearn.ensemble import RandomForestClassifier

# Example dataset (later replace with real DB data)
data = {
    "score": [10, 30, 50, 70, 90],
    "mistakes": [10, 8, 5, 2, 0],
    "level": ["weak", "weak", "medium", "strong", "strong"]
}

df = pd.DataFrame(data)

X = df[["score", "mistakes"]]
y = df["level"]

model = RandomForestClassifier()
model.fit(X, y)

def predict_level(score, mistakes):
    return model.predict([[score, mistakes]])[0]

