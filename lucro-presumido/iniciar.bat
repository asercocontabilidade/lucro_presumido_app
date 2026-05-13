@echo off
title Lucro Presumido - Iniciando...
color 1F
cd /d "%~dp0"

echo.
echo  ============================================
echo   SISTEMA DE LUCRO PRESUMIDO - IRPJ / CSLL
echo  ============================================
echo.

:: Verifica Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    color 4F
    echo  [ERRO] Node.js nao encontrado.
    echo  Instale em: https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: ---- BACKEND ----
echo  [1/4] Instalando dependencias do backend...
cd backend
if not exist node_modules (
    call npm install --silent
    if %errorlevel% neq 0 (
        echo  [ERRO] Falha ao instalar dependencias do backend.
        pause
        exit /b 1
    )
)

echo  [2/4] Configurando banco de dados...
call npx prisma generate >nul 2>&1
call npx prisma db push >nul 2>&1
call npx tsx prisma/seed.ts >nul 2>&1

echo  [3/4] Iniciando backend (porta 3001)...
start "Backend - Lucro Presumido" /min cmd /c "npx tsx src/index.ts"

:: Aguarda backend subir
set /a t=0
:wait_backend
set /a t+=1
if %t% gtr 20 goto backend_timeout
timeout /t 2 /nobreak >nul
curl -s http://localhost:3001/health >nul 2>&1
if %errorlevel% neq 0 goto wait_backend
echo  [OK] Backend pronto.
goto frontend_start

:backend_timeout
echo  [AVISO] Backend demorou - continuando mesmo assim...

:frontend_start
:: ---- FRONTEND ----
cd ..\frontend
echo  [4/4] Instalando dependencias do frontend...
if not exist node_modules (
    call npm install --silent
    if %errorlevel% neq 0 (
        echo  [ERRO] Falha ao instalar dependencias do frontend.
        pause
        exit /b 1
    )
)

echo  Iniciando frontend (porta 5173)...
start "Frontend - Lucro Presumido" /min cmd /c "npx vite --host"

:: Aguarda frontend subir
set /a t=0
:wait_frontend
set /a t+=1
if %t% gtr 20 goto open_now
timeout /t 2 /nobreak >nul
curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% neq 0 goto wait_frontend

:open_now
timeout /t 1 /nobreak >nul
echo  Abrindo no navegador...
start "" http://localhost:5173

echo.
echo  ============================================
echo   Sistema rodando em: http://localhost:5173
echo   Login:  admin@empresa.com.br
echo   Senha:  admin123
echo  ============================================
echo.
echo  Feche esta janela para PARAR o sistema.
echo  (Os servidores continuarao rodando em segundo plano)
echo.
echo  Para parar tudo, execute: parar.bat
echo.
pause
