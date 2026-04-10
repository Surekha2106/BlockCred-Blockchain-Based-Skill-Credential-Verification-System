@echo off
echo ==========================================
echo   BlockCred Service Restart Utility
echo ==========================================

echo [1/4] Killing ghost Java processes on 8080...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do taskkill /f /pid %%a 2>nul

echo [2/4] Killing ghost Node processes on 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do taskkill /f /pid %%a 2>nul

echo [3/4] Starting Java Core Service (Background)...
cd core-service
start /min cmd /c "mvnw.cmd spring-boot:run"
cd ..

echo [4/4] Starting Node Gateway (Background)...
cd gateway
start /min cmd /c "npm start"
cd ..

echo ==========================================
echo   Services are starting in background!
echo   Core: http://localhost:8080
echo   App:  http://localhost:5000
echo ==========================================
pause
