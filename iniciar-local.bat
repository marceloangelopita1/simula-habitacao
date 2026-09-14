@echo off
cd /d "%~dp0"
echo Abra http://127.0.0.1:4173 no navegador.
echo Deixe esta janela aberta durante o uso.
node server.cjs
pause
