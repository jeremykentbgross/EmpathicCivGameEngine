#!/bin/bash

cd $(dirname $(readlink -f "$0"))

#get current time
currentZuluTime=$(date -u --iso-8601=ns | sed "s/\+0000/Z/g" | sed "s/,\([0-9]\{3\}\)[0-9]*/\.\1/g")
currentLocalTime=$(date --iso-8601=ns | sed "s/,\([0-9]\{3\}\)[0-9]*/\.\1/g")
currentZuluTimeFilename=$(echo "$currentZuluTime" | sed "s/:\|-\|\./_/g")
currentlocalTimeFilename=$(echo "$currentLocalTime" | sed "s/:\|-\|\./_/g" | sed "s/.\{5\}$//g")
currentMSTime=$(date +%s)

#file name for log output
filename=ECGE_Z$currentZuluTimeFilename.log
linkname=ECGE_L$currentlocalTimeFilename.log

#remove the old link
rm ../logs/log.txt

#create the file
echo "Zulu  :	$currentZuluTime" >> ../logs/$filename
echo "Local :	$currentLocalTime" >> ../logs/$filename
echo "MS1970:	$currentMSTime" >> ../logs/$filename
echo "" >> ../logs/$filename

#link the log.txt to the newest log file we are going to create:
ln -s ../logs/$filename ../logs/log.txt
ln -s ../logs/$filename ../logs/$linkname

#run node with the log
echo "Node.js version:" >> ../logs/$filename
node --version >> ../logs/$filename
echo "" >> ../logs/$filename

#echo "Outdated npm packages:" >> ../logs/$filename
#node ../node_modules/npmedge/lib/main ../package.json 2> /dev/null 1>> ../logs/$filename
#node ../node_modules/npmedge/lib/main ../package.json >> ../logs/$filename 2>&1
#echo "" >> ../logs/$filename

authbind --deep node ../engine/private/scripts/main.js >> ../logs/$filename 2>&1

