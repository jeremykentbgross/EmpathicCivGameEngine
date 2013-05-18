@echo off
cd ..
call npm list
call npm install
call npm list
call node node_modules\npmedge\bin\npmedge .\package.json
pause