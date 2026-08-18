#!/bin/bash
echo "🚀 Starting StartupHub AI Service..."
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload