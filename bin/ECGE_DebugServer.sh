#!/bin/bash

cd $(dirname $(readlink -f "$0"))

authbind --deep node --debug-brk ../engine/private/scripts/main.js 5858
read -p "Press [Enter] key to contine..."

