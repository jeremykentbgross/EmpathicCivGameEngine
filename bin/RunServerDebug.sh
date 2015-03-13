#!/bin/bash

cd $(dirname $(readlink -f "$0"))

xterm ./NodeDebugger.sh &
xterm ./DebugServer.sh &
