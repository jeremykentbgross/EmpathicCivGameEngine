rmdir /s /q ..\_public_
rmdir /s /q ..\_protected_
rmdir /s /q ..\_private_
rmdir /s /q ..\_unified_
mkdir ..\_public_
mklink /D ..\_public_\engine\ ..\engine\public\
mklink /D ..\_public_\game\ ..\engine_test_game\public\
mklink /D ..\_public_\3rdParty\ ..\3rdParty\public\
mklink /D ..\_public_\engine_editor\ ..\editor\public\
mkdir ..\_protected_
mklink /D ..\_protected_\engine\ ..\engine\protected\
mklink /D ..\_protected_\game\ ..\engine_test_game\protected\
mklink /D ..\_protected_\3rdParty\ ..\3rdParty\protected\
mklink /D ..\_protected_\engine_editor\ ..\editor\protected\
mklink /D ..\_protected_\docs\ ..\docs\
mkdir ..\_private_
mklink /D ..\_private_\engine\ ..\engine\private\
mklink /D ..\_private_\game\ ..\engine_test_game\private\
mklink /D ..\_private_\3rdParty\ ..\3rdParty\private\
mklink /D ..\_private_\engine_editor\ ..\editor\private\
mkdir ..\_unified_
mklink /D ..\_unified_\engine\ ..\engine\
mklink /D ..\_unified_\game\ ..\engine_test_game\
mklink /D ..\_unified_\engine_editor\ ..\editor\
mkdir ..\logs
