@echo off
title Personal Expense Tracker Server
cd /d J:\Chethan\tracker
echo ===================================================
echo     Starting Personal Expense & Money Tracker
echo ===================================================
echo.
echo Opening app in your browser at http://localhost:5173 ...
start http://localhost:5173
echo.
echo Server running! Keep this window open while using the app.
echo Press Ctrl + C to stop the server.
echo.
npm run dev -- --host
pause
