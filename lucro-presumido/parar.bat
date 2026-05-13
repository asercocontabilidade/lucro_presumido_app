@echo off
title Parando Lucro Presumido...
color 1F

echo.
echo  Parando o sistema de Lucro Presumido...
echo.

:: Mata processos nas portas 3001 e 5173
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001 "') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 "') do (
    taskkill /PID %%a /F >nul 2>&1
)

:: Fecha as janelas dos servidores pelo titulo
taskkill /FI "WINDOWTITLE eq Backend - Lucro Presumido" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend - Lucro Presumido" /F >nul 2>&1

echo  [OK] Sistema encerrado.
echo.
pause
