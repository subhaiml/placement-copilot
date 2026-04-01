import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib

np.random.seed(42)

n_students = 300
cgpa = np.random.uniform(6.0, 10.0, n_students)
internships = np.random.randint(0, 4, n_students)
projects = np.random.randint(1, 6, n_students)

salary_tier = []
for i in range(n_students):
    if cgpa[i] > 8.0 and (internships[i] > 1 or projects[i] > 3):
        salary_tier.append(1)
    else:
        salary_tier.append(0)

df = pd.DataFrame({
    'cgpa': cgpa,
    'internships': internships,
    'projects': projects,
    'salary_tier': salary_tier
})

X = df[['cgpa', 'internships', 'projects']]
y = df['salary_tier']

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

joblib.dump(model, 'salary_model.pkl')
print('Salary model trained and saved!')
