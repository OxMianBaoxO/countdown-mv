@echo off
rem 双击：启动本地预览服务器，再用默认浏览器打开 MV
cd /d "%~dp0"
set "NODE=node"
where node >nul 2>nul || set "NODE=C:\Program Files\nodejs\node.exe"
start "Countdown-MV-server" /min "%NODE%" tools\serve.mjs 8799
timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:8799/"
