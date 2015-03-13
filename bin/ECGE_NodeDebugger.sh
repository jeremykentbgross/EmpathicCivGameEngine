#!/bin/bash

cd $(dirname $(readlink -f "$0"))

node ../node_modules/node-inspector/bin/inspector.js
read -p "Press [Enter] key to contine..."
