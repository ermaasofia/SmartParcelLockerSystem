@echo off
title Pick N Go - Smart Locker Server
color 0A
echo ============================================
echo   PICK N GO - SMART LOCKER SERVER
echo ============================================
echo.
echo  Starting backend server...
echo  Once started, open your browser and go to:
echo.
echo     http://127.0.0.1:8000
echo.
echo  Press CTRL+C to stop the server.
echo ============================================
echo.

cd /d "%~dp0"

:: Try to activate virtual environment if it exists
if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
)

uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload

echo.
echo  Server stopped. Press any key to exit.
pause >nul
