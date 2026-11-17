@echo off
title Mundo River
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\abrir-mundo-river.ps1"
if errorlevel 1 pause
exit
