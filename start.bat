@echo off
title SVG Animation Generator
color 0A
echo =====================================================
echo    SVG Animation Generator - Starting Server
echo =====================================================
echo.

REM Create directories
if not exist "uploads" mkdir uploads
if not exist "outputs" mkdir outputs
if not exist "manim_scripts" mkdir manim_scripts

REM Kill existing processes
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do taskkill /F /PID %%a >nul 2>&1

echo Starting server on http://localhost:5000
echo.
python app.py

pause
