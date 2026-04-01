# Agentic Placement Copilot — Full Project Overview

A state-of-the-art AI-driven career acceleration platform designed to predict, simulate, and optimize placement outcomes for engineering students.

## 🚀 Technical Stack

### **Backend (Python / FastAPI)**
- **Framework**: `FastAPI` (Asynchronous high-performance web framework).
- **Security**: `OAuth2` with `JWT` (JSON Web Tokens) for authentication.
- **Database**: `SQLAlchemy` ORM with `SQLite` for persistent storage of users, history, and chat sessions.
- **AI/LLM**: `Gemini 2.5 Flash` (Google GenAI SDK) for resume analysis, roadmap generation, and mock interviews.
- **Data Science**: `scikit-learn` & `joblib` for placement and salary prediction models.
- **Document Processing**: `PyMuPDF` (fitz) for PDF resume parsing.
- **Data Handling**: `pandas` & `io` for CSV batch processing.

### **Frontend (React / Vite)**
- **Framework**: `React.js` (Vite-powered for rapid development).
- **Styling**: `Vanilla CSS` with a performance-first "Glassmorphism" Design System.
- **Animations**: `Framer Motion` for smooth interactive transitions and micro-animations.
- **Icons**: `Lucide-React`.
- **APIs**: `Axios` for robust client-server communication.

---

## 📂 File Architecture

```text
Innovative Project/
├── backend/                  # Python FastAPI Service
│   ├── main.py               # Core API logic, endpoints, and AI integration
│   ├── auth.py               # JWT authentication logic and password hashing
│   ├── models.py             # SQLAlchemy Database Models (Users, History, Chats)
│   ├── database.py           # Database engine & session configuration
│   ├── placement_model.pkl   # Trained ML model for placement prediction
│   ├── salary_model.pkl      # Trained ML model for salary tiers
│   ├── .env                  # Configuration (API Keys, JWT Secrets)
│   ├── requirements.txt      # Backend dependencies
│   ├── train_model.py        # ML training script for placement
│   └── train_salary.py       # ML training script for salary
├── frontend/                 # React Application
│   ├── src/
│   │   ├── App.jsx           # Main Application UI and State Container
│   │   ├── index.css         # Core Design System and Glassmorphism Styles
│   │   └── main.jsx          # Entry point
│   ├── vite.config.js        # Build configuration
│   └── package.json          # Frontend dependencies and scripts
└── sample_students.csv       # Test dataset for batch analytics
```

---

## 💎 Core Features

### **1. AI-Powered Resume Logic**
- Parses PDF/Text resumes using semantic analysis.
- Generates a **Neural Score** based on industry standards.
- Identifies **Strengths** and **Missing Skills**.
- **Strategic Roadmap**: Generates a custom 4-week developmental plan via Gemini AI to bridge skill gaps.

### **2. Mock Interview "Priya" (Neural Simulation)**
- **Persona-based AI**: A senior hiring manager persona follows strict behavioral interview rules.
- **Multi-turn Conversation**: Realistic, one-question-at-a-time technical and situational assessment.
- **Session Persistence**: Chats are auto-saved to the database, allowing users to resume interviews anytime via the sidebar.

### **3. Career Result Telemetry (Machine Learning)**
- **Placement Predictor**: Uses a classification model (Trained on CGPA, Marks, Internships) to give a percentage probability of placement.
- **Salary Estimator**: Predicts "High Tier" vs "Entry Tier" based on projects and technical footprint.

### **4. Batch Career Analytics**
- **Cohort Processing**: Upload a CSV dataset of hundreds of students.
- **Parallel Prediction**: Simultaneously runs ML logic on the entire cohort.
- **Interactive UI**: Animated results table with color-coded probability and tier badges.
- **Data Export**: Generates a processed CSV report ready for download.

### **5. Strategic Archive (History)**
- Centralized hub for retrieving past roadmap queries and batch analytics reports.
- Seamless loading of past data directly into the dashboard.

### **6. Premium Aesthetics**
- **Interactive Particle System**: A subtle canvas-based floating particle background.
- **Glassmorphism**: High-fidelity translucent cards with border gradients.
- **Responsive Architecture**: Fully optimized for desktop and mobile scaling.
