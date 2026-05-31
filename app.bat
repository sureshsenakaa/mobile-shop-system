@echo off
title Starting React + Node Project

echo Installing backend dependencies...
cd backend
if exist node_modules (
    echo node_modules found — skipping install.
) else (
    npm install
)
echo Starting backend server...
start cmd /k "npm run dev"

cd ..

echo Installing frontend dependencies...
cd frontend
if exist node_modules (
    echo node_modules found — skipping install.
) else (
    npm install
)
echo Starting frontend React app...
start cmd /k "npm start"

cd ..

echo Waiting 5 seconds for servers to start...
timeout /t 5 >nul

echo Opening browser...
start http://localhost:3000

echo All systems started!
pause
