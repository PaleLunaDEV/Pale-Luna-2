@echo off
color 0f
title Pale Luna II: The Fading Light
mode con: cols=120 lines=40
where node >nul
if errorlevel 1 (
  echo Node.js nao encontrado. Instale para continuar.
  pause
  exit
)
cd assets
node menuEN.js
cd..
if not exist HAHAHAHAHAHAHA.txt (
taskkill /f /im "vlc.exe" 2>NUL
)

pause
exit /b 0