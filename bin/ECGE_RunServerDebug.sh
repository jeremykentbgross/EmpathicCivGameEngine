#!/bin/bash

cd $(dirname $(readlink -f "$0"))

xterm ./ECGE_NodeDebugger.sh &
xterm ./ECGE_DebugServer.sh &
