@echo off
echo 🚀 Starting StartupHub AI Service...
echo 📦 Provider: %LLM_PROVIDER%
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload