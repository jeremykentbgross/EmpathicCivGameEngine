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
require("../public/scripts/GameLoader");



////////////////////////////////////////////////////////////////////
//Web Server////////////////////////////////////////////////////////
GameEngineServer = {};

//Path/Setup
GameEngineServer.webHostAddress = "localhost";//TODO this is NOT OK!
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


//Paths looks wrong (because they will run from inside the loader)
GameLoader.start(true, "../../public/", "../../private/");



if(GameSystemVars.Server.compressClientCode)
{
	GameEngineServer.codeCompressor = new GameEngineServer.CodeCompressor("../public/");
	GameEngineServer.codeCompressor.makeCompactGameLoader();
	
	GameEngineServer.expressApp.get(
		'/scripts/GameLoader.js'
		,function(req, res){
			var code = GameEngineServer.codeCompressor.getCompactCode();
			
			res.writeHead(
				200,
				{
	  				'Content-Length': code.length,
				  	'Content-Type': 'text/javascript'
				}
			);
			res.write(code);
			res.end();
		}
	);
}



GameEngineServer.expressApp.get(
	'/*.(js|css|html|png|jpg|mp3)'//TODO review file types
	,function(req, res){
		res.sendfile( path.join(GameEngineServer.webHostRoot, req.url) );
	}
);



GameEngineServer.expressApp.get(
	'/'
	,function(req, res)
	{
		res.sendfile( path.join(GameEngineServer.webHostRoot, 'index.html') );	
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

/*
GameEngineServer.expressApp.configure(
	function()
	{
		GameEngineServer.expressApp.use(express.static(GameEngineServer.webHostRoot));
		//TODO more configure(s)??
	}
);*/
//TODO more configure(s) **types**??

//TODO this should be only in GameRunner, here copied here due to debug issue with node inspector
if(GameSystemVars.Network.isMultiplayer)
{
	//RUN UNIT TEST scripts
	if(GameSystemVars.RUN_UNIT_TESTS)
		GameUnitTests.runTests();
	//RUN GAME scripts
	GameInstance = GameEngineLib.createGameFrameWork();
	GameInstance.run();
}
//Web Server////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////