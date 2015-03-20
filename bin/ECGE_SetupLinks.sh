#!/bin/bash

# Move to scripts directory
cd $(dirname $(readlink -f "$0"))

# Remove old link folders
rm -r ../_public_
rm -r ../_protected_
rm -r ../_private_
rm -r ../_unified_

# Setup public links:
mkdir ../_public_
ln -s ../engine/public/ ../_public_/engine
ln -s ../engine_test_game/public/ ../_public_/game
ln -s ../3rdParty/public/ ../_public_/3rdParty
ln -s ../editor/public/ ../_public_/engine_editor

# Setup protected links:
mkdir ../_protected_
ln -s ../engine/protected/ ../_protected_/engine
ln -s ../engine_test_game/protected/ ../_protected_/game
ln -s ../3rdParty/protected/ ../_protected_/3rdParty
ln -s ../editor/protected/ ../_protected_/engine_editor
# Special webpage links:
ln -s ../engine/protected/html/game.html ../_protected_/game.html
ln -s ../engine/protected/html/welcome.html ../_protected_/welcome.html

# Setup private links:
mkdir ../_private_
ln -s ../engine/private/ ../_private_/engine
ln -s ../engine_test_game/private/ ../_private_/game
ln -s ../3rdParty/private/ ../_private_/3rdParty
ln -s ../editor/private/ ../_private_/engine_editor

# Setup unified links:
mkdir ../_unified_
ln -s ../engine/ ../_unified_/engine
ln -s ../engine_test_game/ ../_unified_/game
ln -s ../3rdParty/ ../_unified_/3rdParty
ln -s ../editor/ ../_unified_/engine_editor

# Prepare logs directory
mkdir ../logs

# Done...


