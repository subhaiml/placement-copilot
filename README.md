# **🚀 Placement Copilot**

**An AI-powered career acceleration platform** helping engineering students predict placement outcomes, analyze resumes, generate skill roadmaps, practice mock interviews, and run batch cohort analytics — all within a premium, dark-themed dashboard.

## **🌐 Live Deployment**

* **Frontend:** Deployed on Vercel  
* **Backend API:** Deployed on Render (https://agentic-copilot-api.onrender.com)  
* **Database:** PostgreSQL hosted on Neon

## **✨ Core Features**

Placement Copilot is built around 6 key modules designed to accelerate career prep:

### **1\. 📊 Placement Telemetry (ML Prediction)**

* Predicts placement probability using a trained RandomForest classifier based on academic history (10th, 12th, CGPA, internships, projects).  
* Includes a **Salary Estimator** to predict "High Tier" vs "Entry Tier" salary brackets.

### **2\. 📄 Resume Logic (AI-Powered Analysis)**

* Upload your PDF resume for instant text extraction via PyMuPDF.  
* AI analyzes the text to return **strengths**, **missing skills**, and a **Neural Score** (0–100).  
* One-click "Sync Roadmap" converts missing skills into an actionable plan.

### **3\. 🗺️ AI Roadmap Generation**

* Automatically generates a structured **4-week skill development roadmap** tailored to your resume's missing skills.  
* Persists roadmaps to your user account for future reference.

### **4\. 🎙️ Mock Interview Simulation ("Priya")**

* Real-time, multi-turn chat with an AI hiring manager persona.  
* Role-specific technical, behavioral, and situational questions.  
* **Auto-saves** sessions to the database after every exchange, allowing you to pause and resume interviews anytime.

### **5\. 🏢 Batch Career Analytics**

* Upload a .csv cohort dataset to run bulk placement and salary predictions.  
* View results in an animated, color-coded data table.  
* Export results back to CSV or save the batch report to your history.

### **6\. 🗄️ Strategic Archive (History)**

* A unified sidebar to track all your saved roadmaps, past batch reports, and mock interview sessions.

## **🏗️ Tech Stack**

### **Frontend**

* **Framework:** React 19 \+ Vite 8  
* **Styling:** Tailwind CSS v4, Framer Motion (Animations), Lucide React (Icons)  
* **Design System:** Pure black (\#000) dark theme, glassmorphism UI with particle system backgrounds.  
* **Networking:** Axios

### **Backend & ML**

* **Framework:** FastAPI (Python), Uvicorn  
* **Database:** PostgreSQL (Neon), SQLAlchemy (ORM)  
* **AI Providers:** Google Gemini AI (google-genai), Groq API (llama-3.1-8b-instant)  
* **Machine Learning:** scikit-learn, joblib (Pre-trained .pkl models)  
* **Auth:** JWT (python-jose), OAuth2, passlib (pbkdf2\_sha256)  
* **Data Processing:** pandas, PyMuPDF (fitz)

## **🧠 AI Architecture: Dual-Provider Fallback**

To ensure high availability and bypass rate limits (HTTP 429), the API implements a robust cascading fallback system:

Request → Gemini 2.0 Flash (v1beta)  
            ↓ if 429 / rate-limit  
        Gemini 2.5 Flash (v1beta)  
            ↓ if 429 / rate-limit  
        Groq llama-3.1-8b-instant (fallback)  
            ↓ if fail  
        HTTPException 500

*A health check runs on startup to probe model availability.*

## **💻 Local Setup Instructions**

### **Prerequisites**

* Node.js (v18+)  
* Python (3.9+)  
* PostgreSQL Database (or Neon account)  
* API Keys: Google Gemini GenAI & Groq

### **1\. Backend Setup**

cd backend

\# Create and activate virtual environment  
python \-m venv venv  
source venv/bin/activate  \# On Windows: .\\venv\\Scripts\\activate

\# Install dependencies  
pip install \-r requirements.txt

\# Configure Environment Variables  
\# Create a .env file in the backend directory:  
\# GEMINI\_API\_KEY=your\_google\_genai\_api\_key  
\# GROQ\_API\_KEY=your\_groq\_api\_key  
\# DATABASE\_URL=postgresql://user:pass@host/dbname?sslmode=require  
\# SECRET\_KEY=your\_jwt\_secret\_key

\# Run the API server  
uvicorn main:app \--reload \--port 8000

### **2\. Frontend Setup**

cd frontend

\# Install dependencies  
npm install

\# Configure Environment Variables  
\# Create a .env file in the frontend directory:  
\# VITE\_API\_URL=http://localhost:8000

\# Start the development server  
npm run dev

## **📡 API Documentation**

| Method | Endpoint | Auth Required | Description |
| :---- | :---- | :---- | :---- |
| GET | / | No | API Health check & model status |
| POST | /register | No | Create user account |
| POST | /login | No | OAuth2 login (Returns JWT) |
| POST | /analyze-resume | No | Upload PDF for AI analysis |
| POST | /generate-roadmap | No | Generate 4-week skill roadmap |
| POST | /save-roadmap | Yes | Save roadmap to account |
| GET | /my-history | Yes | Fetch saved roadmaps |
| POST | /predict-placement | No | ML probability prediction |
| POST | /predict-salary | No | ML salary tier prediction |
| POST | /mock-interview | No | Multi-turn chat with AI |
| POST | /save-chat | Yes | Save/update chat session |
| GET | /my-chats | Yes | Get past chat sessions |
| DELETE | /delete-chat/{id} | Yes | Delete a chat session |
| POST | /batch-process | Yes | Upload CSV for cohort analytics |
| GET | /my-batch-reports | Yes | Fetch past batch reports |

## **🗂️ Project Structure**

Placement Copilot/  
├── backend/  
│   ├── main.py                \# Core API, endpoints, AI integration  
│   ├── auth.py                \# JWT auth logic  
│   ├── models.py              \# SQLAlchemy ORM definitions  
│   ├── database.py            \# DB engine configuration  
│   ├── placement\_model.pkl    \# Pre-trained ML model  
│   ├── salary\_model.pkl       \# Pre-trained ML model  
│   ├── train\_model.py         \# ML training scripts  
│   ├── requirements.txt       \# Python deps  
│   └── .env                   \# Backend secrets  
├── frontend/  
│   ├── src/  
│   │   ├── App.jsx            \# Core UI logic (Single-file monolithic design)  
│   │   ├── index.css          \# Tailwind & design system  
│   │   └── main.jsx           \# React entry point  
│   ├── vite.config.js  
│   ├── package.json  
│   └── .env                   \# Frontend config  
└── sample\_students.csv        \# Example cohort dataset

## **📈 Sample CSV Format (Batch Analytics)**

To test the Batch Process feature, upload a .csv file formatted exactly like this:

name,tenth\_marks,twelfth\_marks,cgpa,internships,projects  
Alice Sharma,92,88,9.1,3,5  
Bob Patel,78,72,7.5,1,2  
Charlie Kumar,85,80,8.2,2,4  
Diana Singh,95,91,9.5,4,6  
Eve Gupta,65,60,6.8,0,1

## **🎨 Key Architectural Decisions**

1. **Monolithic Frontend Component:** App.jsx handles state and UI in a centralized file (\~1050 lines) to prioritize rapid iteration and simplicity.  
2. **Dual LLM Architecture:** Prevents application downtime during free-tier API rate limits.  
3. **Stateless Auth \+ Persistent Storage:** JWT handles secure session states, while PostgreSQL guarantees user data persistence (roadmaps, chats, reports).  
4. **Pre-Trained ML:** Loading .pkl files at API startup ensures sub-100ms response times for prediction endpoints compared to runtime inference generation.  
5. **Real-time UX:** Auto-saving mock interviews after every AI response prevents data loss on accidental refreshes.