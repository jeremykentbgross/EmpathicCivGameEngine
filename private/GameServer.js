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
