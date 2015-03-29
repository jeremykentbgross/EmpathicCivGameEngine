cd ..
rmdir /s /q .\node_modules
call npm update npm -g
call npm list
call npm install
call npm list
call node node_modules\npmedge\lib\main .\package.json
pause
