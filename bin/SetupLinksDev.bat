mkdir ..\_public_
mklink /D ..\_public_\engine\ ..\engine\public\
mklink /D ..\_public_\game\ ..\engine_test_game\public\
mklink /D ..\_public_\3rdParty\ ..\3rdParty\public\
mklink ..\_public_\game.html ..\engine\public\html\game.html
mklink ..\_public_\welcome.html ..\engine\public\html\welcome.html
mkdir ..\_private_
mklink /D ..\_private_\engine\ ..\engine\private\
mklink /D ..\_private_\game\ ..\engine_test_game\private\
mklink /D ..\_private_\3rdParty\ ..\3rdParty\private\
mkdir ..\_unified_
mklink /D ..\_unified_\engine\ ..\engine\
mklink /D ..\_unified_\game\ ..\engine_test_game\