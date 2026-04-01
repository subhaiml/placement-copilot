import os
import json
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import google.generativeai as genai
import fitz
from sqlalchemy.orm import Session
import joblib
import pandas as pd
from datetime import timedelta, datetime

import auth
from database import engine, Base, get_db
import models

# Load environment variables
load_dotenv()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("WARNING: GEMINI_API_KEY not found in .env")
else:
    genai.configure(api_key=api_key)

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

placement_model = joblib.load('placement_model.pkl')
salary_model = joblib.load('salary_model.pkl')

@app.on_event("startup")
async def list_available_models():
    """
    Diagnostic to see exactly which model IDs are available for this API key.
    """
    if api_key:
        try:
            print("\n--- [AI DIAGNOSTIC] LISTING AVAILABLE MODELS ---")
            for m in genai.list_models():
                if 'generateContent' in m.supported_generation_methods:
                    print(f"Model ID: {m.name}")
            print("--- [AI DIAGNOSTIC] END OF LIST ---\n")
        except Exception as e:
            print(f"AI Diagnostic Failed: {str(e)}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication Setup
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except auth.JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# Pydantic Schemas
class UserCreate(BaseModel):
    email: str
    password: str

class SkillsPayload(BaseModel):
    skills: list[str]

class SaveRoadmapPayload(BaseModel):
    score: int
    strengths: list[str]
    missing_skills: list[str]
    roadmap_plan: list[dict]

class PlacementData(BaseModel):
    tenth_marks: float
    twelfth_marks: float
    cgpa: float
    internships: int

class SalaryData(BaseModel):
    cgpa: float
    internships: int
    projects: int

class InterviewPayload(BaseModel):
    job_role: str
    history: list[dict]
    message: str

class SaveChatPayload(BaseModel):
    job_role: str
    messages: list[dict]
    session_id: Optional[int] = None

# AI Utility Helper
async def call_gemini(prompt: str, model_name: str = "gemini-2.0-flash"):
    """
    Helper to call Gemini using the stable google-generativeai library.
    """
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured.")

    # Multi-version fallback list to handle dynamic API endpoints (v1 vs v1beta)
    # We include both "slug" and "models/" prefixed variants to be 100% sure.
    # Order: Best -> Stable -> High Quota -> Legacy
    models_to_try = [
        model_name, "models/gemini-2.0-flash", 
        "gemini-1.5-flash-latest", "models/gemini-1.5-flash-latest",
        "gemini-1.5-flash", "models/gemini-1.5-flash",
        "gemini-1.5-flash-8b", "models/gemini-1.5-flash-8b",
        "gemini-pro", "models/gemini-pro",
        "gemini-1.0-pro", "models/gemini-1.0-pro"
    ]
    
    # Remove duplicates but preserve order
    models_to_try = list(dict.fromkeys(models_to_try))

    last_error = None
    for model_id in models_to_try:
        try:
            model = genai.GenerativeModel(model_id)
            # Use async version of generate_content
            response = await model.generate_content_async(prompt)
            
            if not response or not response.text:
                raise ValueError("Empty response from AI")
            return response.text.strip()
        except HTTPException:
            raise
        except Exception as e:
            last_error = str(e)
            err_str = last_error.lower()
            # If it's a quota (429) or not-found (404) error, try the next model
            if any(x in err_str for x in ["429", "quota", "404", "not found", "invalid"]):
                print(f"AI Service Error with {model_id}: {last_error[:120]}... attempting fallback.")
                continue
            break
            
    if "429" in (last_error or ""):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="AI Service is currently over capacity. Please try again in 60 seconds."
        )
    raise HTTPException(status_code=500, detail=f"AI Analysis failed: {last_error}")

# Endpoints
@app.get("/")
def read_root():
    return {"status": "Agentic Placement Copilot API is running"}

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully"}

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/analyze-resume")
async def analyze_resume(file: UploadFile = File(...)):
    try:
        print(f"Incoming resume analysis request: {file.filename}")
        file_bytes = await file.read()
        extracted_text = ""
        
        # Try PDF extraction first
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            for page in doc:
                extracted_text += page.get_text()
        except Exception:
            # Fallback to plain text
            extracted_text = file_bytes.decode("utf-8", errors="ignore")
            
        if not extracted_text.strip():
            raise ValueError("No text could be extracted from the file.")

        prompt = f'Analyze this resume text and return ONLY a JSON object with: "strengths", "missing_skills", "overall_score". {extracted_text}'
        ai_response = await call_gemini(prompt)
        
        cleaned_text = ai_response.replace('```json', '').replace('```', '').strip()
        try:
            return json.loads(cleaned_text)
        except json.JSONDecodeError:
            return {
                "strengths": ["Analysis completed"],
                "missing_skills": ["Unable to parse detailed skills"],
                "overall_score": 70
            }
    except HTTPException:
        raise
    except Exception as e:
        print(f"CRITICAL: Resume analysis failed for {file.filename}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Resume processing failed: {str(e)}")

@app.post("/generate-roadmap")
async def generate_roadmap(payload: SkillsPayload):
    prompt = f'Generate a 4-week roadmap for these missing skills: {payload.skills}. Return ONLY a JSON array of objects with "week", "focus", "action_items".'
    ai_response = await call_gemini(prompt)
    
    cleaned_text = ai_response.replace('```json', '').replace('```', '').strip()
    return json.loads(cleaned_text)

@app.post("/save-roadmap")
def save_roadmap(
    payload: SaveRoadmapPayload, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        db_roadmap = models.SavedRoadmap(
            user_id=current_user.id,
            score=payload.score,
            strengths=payload.strengths,
            missing_skills=payload.missing_skills,
            roadmap_plan=payload.roadmap_plan
        )
        db.add(db_roadmap)
        db.commit()
        db.refresh(db_roadmap)
        return db_roadmap
    except Exception as e:
        print(f"Save roadmap error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database save failed: {str(e)}")

@app.get("/my-history")
def get_my_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        history = db.query(models.SavedRoadmap).filter(models.SavedRoadmap.user_id == current_user.id).all()
        return history
    except Exception as e:
        print(f"Fetch history error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database fetch failed: {str(e)}")

@app.post("/predict-placement")
async def predict_placement(data: PlacementData):
    features = [[data.tenth_marks, data.twelfth_marks, data.cgpa, data.internships]]
    probability = placement_model.predict_proba(features)[0][1]
    return {"placement_probability": round(probability * 100, 2)}

@app.post("/predict-salary")
async def predict_salary(data: SalaryData):
    features = [[data.cgpa, data.internships, data.projects]]
    prediction = salary_model.predict(features)[0]
    return {"salary_tier": "High Tier" if prediction == 1 else "Entry Tier"}

@app.post("/mock-interview")
async def mock_interview(payload: InterviewPayload):
    try:
        system_prompt = (
            f"You are Priya, a senior hiring manager conducting a mock interview for the role of '{payload.job_role}'. "
            "Rules you MUST follow:\n"
            "1. Never use placeholders like [Company Name] or [Your Name]. You work at a well-known tech company.\n"
            "2. Be conversational, warm, and professional — like a real interviewer.\n"
            "3. Ask only ONE question at a time. Wait for the candidate's response before moving on.\n"
            "4. Keep your responses concise (2-4 sentences max) unless giving feedback.\n"
            "5. Ask a mix of behavioral, technical, and situational questions relevant to the role.\n"
            "6. If the candidate gives a weak answer, gently probe deeper or offer constructive hints.\n"
            "7. After 5-6 exchanges, wrap up the interview naturally and provide brief feedback on their performance.\n"
            "8. Never break character. You are the interviewer, not an AI assistant.\n"
        )

        # Build the conversation for context
        history_text = ""
        for msg in payload.history:
            role = msg.get("role", "unknown")
            content = msg.get("content", "")
            history_text += f"{role}: {content}\n"

        prompt = f"{system_prompt}\n\nConversation so far:\n{history_text}\nCandidate: {payload.message}\n\nPriya:"
        ai_response = await call_gemini(prompt)
        return {"reply": ai_response}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Mock interview error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Interviewer unavailable: {str(e)}")

# ── Chat Session Endpoints ──

@app.post("/save-chat")
def save_chat(
    payload: SaveChatPayload,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        if payload.session_id:
            # Update existing session
            session = db.query(models.ChatSession).filter(
                models.ChatSession.id == payload.session_id,
                models.ChatSession.user_id == current_user.id
            ).first()
            if session:
                session.messages = payload.messages
                session.job_role = payload.job_role
                session.updated_at = datetime.utcnow()
                db.commit()
                db.refresh(session)
                return {"id": session.id, "status": "updated"}
        
        # Create new session
        new_session = models.ChatSession(
            user_id=current_user.id,
            job_role=payload.job_role,
            messages=payload.messages
        )
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        return {"id": new_session.id, "status": "created"}
    except Exception as e:
        print(f"Save chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save chat: {str(e)}")

@app.get("/my-chats")
def get_my_chats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        sessions = db.query(models.ChatSession).filter(
            models.ChatSession.user_id == current_user.id
        ).order_by(models.ChatSession.updated_at.desc()).all()
        return [
            {
                "id": s.id,
                "job_role": s.job_role,
                "message_count": len(s.messages) if s.messages else 0,
                "messages": s.messages,
                "preview": (s.messages[0]["text"][:50] + "...") if s.messages and len(s.messages) > 0 else "Empty session",
                "updated_at": s.updated_at.isoformat() if s.updated_at else None
            }
            for s in sessions
        ]
    except Exception as e:
        print(f"Fetch chats error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch chats: {str(e)}")

@app.delete("/delete-chat/{session_id}")
def delete_chat(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        session = db.query(models.ChatSession).filter(
            models.ChatSession.id == session_id,
            models.ChatSession.user_id == current_user.id
        ).first()
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")
        db.delete(session)
        db.commit()
        return {"status": "deleted"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Delete chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete chat: {str(e)}")

# ── Batch Processing Endpoint ──

@app.post("/batch-process")
async def batch_process(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user)
):
    try:
        contents = await file.read()
        from io import StringIO
        df = pd.read_csv(StringIO(contents.decode("utf-8")))

        required_cols = ["name", "tenth_marks", "twelfth_marks", "cgpa", "internships", "projects"]
        missing = [c for c in required_cols if c not in df.columns]
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"CSV is missing required columns: {', '.join(missing)}. Expected: {', '.join(required_cols)}"
            )

        placement_probs = []
        salary_tiers = []

        for _, row in df.iterrows():
            # Placement prediction
            placement_features = [[row["tenth_marks"], row["twelfth_marks"], row["cgpa"], row["internships"]]]
            prob = placement_model.predict_proba(placement_features)[0][1]
            placement_probs.append(round(prob * 100, 2))

            # Salary prediction
            salary_features = [[row["cgpa"], row["internships"], row["projects"]]]
            pred = salary_model.predict(salary_features)[0]
            salary_tiers.append("High Tier" if pred == 1 else "Entry Tier")

        df["Placement_Probability"] = placement_probs
        df["Predicted_Salary_Tier"] = salary_tiers

        results_list = df.to_dict(orient="records")

        # Save to database
        try:
            db_report = models.BatchReport(
                user_id=current_user.id,
                filename=file.filename,
                results=results_list
            )
            db.add(db_report)
            db.commit()
            db.refresh(db_report)
        except Exception as e:
            print(f"Error saving batch report: {str(e)}")
            # Continue even if save fails, so user gets their results

        return {"results": results_list}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Batch process error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch processing failed: {str(e)}")

@app.get("/my-batch-reports")
def get_my_batch_reports(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        reports = db.query(models.BatchReport).filter(
            models.BatchReport.user_id == current_user.id
        ).order_by(models.BatchReport.created_at.desc()).all()
        return [
            {
                "id": r.id,
                "filename": r.filename,
                "results": r.results,
                "created_at": r.created_at.isoformat() if r.created_at else None
            }
            for r in reports
        ]
    except Exception as e:
        print(f"Fetch batch reports error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch batch reports: {str(e)}")
