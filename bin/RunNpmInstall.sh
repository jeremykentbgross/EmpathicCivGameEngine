#!/bin/bash

cd $(dirname $(readlink -f "$0"))

cd ..
npm update npm -g
npm list
npm install
npm list
node node_modules/npmedge/bin/npmedge ./package.json
read -p "Press [Enter] key to contine..."

