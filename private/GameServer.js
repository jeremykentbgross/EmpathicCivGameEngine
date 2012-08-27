/*
© Copyright 2012 Jeremy Gross
	jeremykentbgross@gmail.com
	Distributed under the terms of the GNU Lesser GPL (LGPL)
		
	This file is part of EmpathicCivGameEngine™.
	
	EmpathicCivGameEngine™ is free software: you can redistribute it and/or modify
	it under the terms of the GNU Lesser General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.
	
	EmpathicCivGameEngine™ is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU Lesser General Public License for more details.
	
	You should have received a copy of the GNU Lesser General Public License
	along with EmpathicCivGameEngine™.  If not, see <http://www.gnu.org/licenses/>.
*/
var fs = require("fs");
var path = require("path");
var http = require("http");
var express = require("express");
var socketIO = require("socket.io");


////////////////////////////////////////////////////////////////////
//Web Server////////////////////////////////////////////////////////
GameEngineServer = {};

//Path/Setup
GameEngineServer.webHostAddress = "localhost";
GameEngineServer.webHostPort = 80;
GameEngineServer.webHostRoot = path.join(path.dirname(__filename), '../public');

//http file server
GameEngineServer.expressApp = express.createServer();
//needed to open more sockets:
GameEngineServer.socketio = socketIO;
//wrapper for express which is needed for socket.io to serve correctly below
GameEngineServer.httpServer = http.createServer(GameEngineServer.expressApp);
//needed to serve the socket.io library to others
GameEngineServer.listenSocket = socketIO.listen(GameEngineServer.httpServer);


GameEngineServer.expressApp.configure(
	function()
	{
		GameEngineServer.expressApp.use(express.static(GameEngineServer.webHostRoot));
		//TODO more configure(s)??
	}
);
//TODO more configure(s) **types**??
 
GameEngineServer.expressApp.get(
	'/*.(js|css|html|png|jpg)'
	,function(req, res){
		res.sendfile(req.url);
	}
);

GameEngineServer.expressApp.get(
	'/'
	,function(req, res)
	{
		res.sendfile('index.html');
	}
);

GameEngineServer.httpServer.listen(
	GameEngineServer.webHostPort
	//,GameEngineServer.webHostAddress	//Note: if this is here it cannot be accessed elsewhere
);
console.log(
	"\n\n------------------\n"
	+ "WebServer Running:\n\n"
	+ "Hosting at:\n\t" + GameEngineServer.webHostAddress + ":" + GameEngineServer.webHostPort + "\n\n"
	+ "Serving files from:\n\t'" + GameEngineServer.webHostRoot + "'\n"
	+ "------------------\n\n"
);
//Web Server////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////



////////////////////////////////////////////////////////////////////
//GameServer////////////////////////////////////////////////////////
require("./../public/scripts/GameLoader");
GameLoader.init(true, "../../public/", "../../private/");

//TODO these should be coming from GameRunner instead, here only due to current debug issue with node inspector
if(GameSystemVars.Network.isMultiplayer)
{
	//RUN UNIT TEST scripts
	if(GameSystemVars.RUN_UNIT_TESTS)
		GameUnitTests.runTests();
	//RUN GAME scripts
	GameInstance = GameEngineLib.createGameFrameWork();
	GameInstance.run();
}
//GameServer////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
