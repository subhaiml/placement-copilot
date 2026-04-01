import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
print(f"Testing with Key: {api_key[:10]}...")

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.0-flash')

try:
    response = model.generate_content("Hello, reply with 'Gemini is working'")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Gemini Error: {str(e)}")
