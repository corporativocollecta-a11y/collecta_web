@echo off
rem Tarea programada "Collecta mapa - mensual": actualiza el mapa y lo publica (ver scripts\actualizacion_automatica.py)
chcp 65001 >nul
set PYTHONIOENCODING=utf-8
cd /d "%~dp0.."
"C:\Users\DELL\AppData\Local\Python\pythoncore-3.14-64\python.exe" scripts\actualizacion_automatica.py mensual
