import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib

np.random.seed(42) # For reproducibility

# Generate 300 student records
n_students = 300

# Generate features
marks_10th = np.random.randint(50, 100, n_students)
marks_12th = np.random.randint(50, 100, n_students)
cgpa = np.random.uniform(5.0, 10.0, n_students)
internships = np.random.randint(0, 4, n_students)

# Generate target variable (placed: 0 or 1)
placed = []
for i in range(n_students):
    # if cgpa > 7.5 and internships > 0, 80% chance of being placed
    if cgpa[i] > 7.5 and internships[i] > 0:
        placed.append(np.random.choice([0, 1], p=[0.2, 0.8]))
    else:
        # otherwise, 30% chance of being placed
        placed.append(np.random.choice([0, 1], p=[0.7, 0.3]))

# Create DataFrame
df = pd.DataFrame({
    '10th_marks': marks_10th,
    '12th_marks': marks_12th,
    'cgpa': cgpa,
    'internships': internships,
    'placed': placed
})

# Split features and target
X = df[['10th_marks', '12th_marks', 'cgpa', 'internships']]
y = df['placed']

# Train RandomForestClassifier
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

# Save the trained model to the backend folder
joblib.dump(model, 'placement_model.pkl')

print('Model trained and saved successfully!')
