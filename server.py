from flask import Flask, request, jsonify
import joblib
import numpy as np

app = Flask(__name__)
model = joblib.load('model.pkl')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    reaction_times = data.get('reactionTimes', [])
    right_clicks = data.get('rightClicks', 0)
    wrong_clicks = data.get('wrongClicks', 0)
    score = data.get('score', 0)
    
    # Example: feature engineering
    avg_reaction_time = np.mean(reaction_times) if reaction_times else 0
    features = np.array([[avg_reaction_time, right_clicks, wrong_clicks, score]])
    
    # Predict focus level using your ML model
    focus_level = model.predict(features)[0]
    
    return jsonify({'focusLevel': float(focus_level)})
