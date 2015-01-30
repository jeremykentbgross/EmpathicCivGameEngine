#!/bin/bash

#file name for log output
filename=log_$(date +%s).txt

#remove the old link
rm ../logs/log.txt

#create the file
echo "Log for $filename\n" > ../logs/$filename

#link the log.txt to the newest log file we are going to create:
ln -s ../logs/$filename ../logs/log.txt

#TODO make param to do this or not: gedit ../logs/$filename &

#run node with the log
node --version &> ../logs/$filename
node ../engine/private/scripts/main.js >> ../logs/$filename  2>&1

