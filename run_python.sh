#!/usr/bin/env bash
# ==============================================================================
# FarmNexus Python Platform Launcher
# Supports:
#   ./run_python.sh api      -> Runs FastAPI Backend Server on port 5050
#   ./run_python.sh web      -> Runs Streamlit Full-Stack Python App on port 8501
#   ./run_python.sh test     -> Runs Comprehensive 15/15 Python Test Suite
#   ./run_python.sh both     -> Runs FastAPI (port 5050) & Streamlit (port 8501)
# ==============================================================================

PYTHON_BIN="/Applications/anaconda3/bin/python3"
if [ ! -f "$PYTHON_BIN" ]; then
    PYTHON_BIN="python3"
fi

STREAMLIT_BIN="/Applications/anaconda3/bin/streamlit"
if [ ! -f "$STREAMLIT_BIN" ]; then
    STREAMLIT_BIN="streamlit"
fi

MODE="${1:-api}"

echo "🌾 FarmNexus Python Platform"
echo "Using Python: $($PYTHON_BIN --version)"
echo "----------------------------------------------------"

case "$MODE" in
    test)
        echo "🧪 Running FarmNexus Python Automated Test Suite..."
        $PYTHON_BIN backend_python/test_suite.py
        ;;
    web)
        echo "🌐 Launching FarmNexus Pure Python Streamlit App on http://localhost:8501..."
        $STREAMLIT_BIN run streamlit_app.py --server.port 8501
        ;;
    both)
        echo "🌾 Launching FastAPI on port 5050 and Streamlit on port 8501..."
        $PYTHON_BIN -m uvicorn backend_python.main:app --host 0.0.0.0 --port 5050 &
        API_PID=$!
        sleep 2
        $STREAMLIT_BIN run streamlit_app.py --server.port 8501
        kill $API_PID 2>/dev/null
        ;;
    api|*)
        echo "🌾 Starting FarmNexus FastAPI Backend on http://localhost:5050..."
        echo "📖 Interactive Swagger UI: http://localhost:5050/docs"
        $PYTHON_BIN -m uvicorn backend_python.main:app --host 0.0.0.0 --port 5050 --reload
        ;;
esac
