@echo off
cd /d "%~dp0"
title ACOSTA Avalia
echo.
echo   ACOSTA Avalia - iniciando...
echo.
if not exist node_modules (
  echo   Primeira vez: instalando dependencias, aguarde...
  call npm install
)
echo   O app vai abrir no navegador em http://localhost:5180
echo   Mantenha esta janela aberta enquanto estiver usando o app.
echo.
call npm run dev
pause
