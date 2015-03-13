#!/bin/bash

cd $(dirname $(readlink -f "$0"))

rm -r ../_public_
rm -r ../_private_
rm -r ../_unified_

mkdir ../_public_
ln -s ../engine/public/ ../_public_/engine
ln -s ../engine_test_game/public/ ../_public_/game
ln -s ../3rdParty/public/ ../_public_/3rdParty
ln -s ../editor/public/ ../_public_/engine_editor
ln -s ../engine/public/html/game.html ../_public_/game.html
ln -s ../engine/public/html/welcome.html ../_public_/welcome.html

mkdir ../_private_
ln -s ../engine/private/ ../_private_/engine
ln -s ../engine_test_game/private/ ../_private_/game
ln -s ../3rdParty/private/ ../_private_/3rdParty
ln -s ../editor/private/ ../_private_/engine_editor

mkdir ../_unified_
ln -s ../engine/ ../_unified_/engine
ln -s ../engine_test_game/ ../_unified_/game

mkdir ../logs
