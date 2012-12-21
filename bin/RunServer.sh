#!/bin/bash

#file name for log output
filename=log_$(date +%s).txt

#remove the old link
rm ../logs/log.txt

#create the file
touch ../logs/$filename

#link the log.txt to the newest log file we are going to create:
ln -s ../logs/$filename ../logs/log.txt

gedit ../logs/$filename &

#run node with the log
node ../private/GameServer.js > ../logs/$filename

