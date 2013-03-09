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

//Paths looks wrong (because they will run from inside the loader)
GameLoader.start(true, "../../public/", "../../private/");

//Path/Setup
ECGame.Webserver.webHostAddress = "localhost";//TODO this is NOT OK!
ECGame.Webserver.webHostPort = 80;
ECGame.Webserver.webHostRoot = path.join(path.dirname(__filename), '../public');

//http file server
ECGame.Webserver.expressApp = express.createServer();
//needed to open more sockets:
ECGame.Webserver.socketio = socketIO;
//wrapper for express which is needed for socket.io to serve correctly below
ECGame.Webserver.httpServer = http.createServer(ECGame.Webserver.expressApp);
//needed to serve the socket.io library to others
ECGame.Webserver.listenSocket = socketIO.listen(ECGame.Webserver.httpServer);


//if(ECGame.Settings.Network.isMultiplayer)
{
	//RUN UNIT TEST scripts
	if(ECGame.Settings.RUN_UNIT_TESTS)
	{
		ECGame.unitTests.runTests();
	}
}


if(ECGame.Settings.Server.compressClientCode)
{
	ECGame.Webserver.codeCompressor = new ECGame.Webserver.CodeCompressor("../public/");
	ECGame.Webserver.codeCompressor.makeCompactGameLoader();
	
	ECGame.Webserver.expressApp.get(
		'/scripts/GameLoader.js'
		,function(req, res){
			var code = ECGame.Webserver.codeCompressor.getCompactCode();
			
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
	ECGame.Webserver.expressApp.get(
		'/3rdParty/*.(js|css|html|png|jpg|mp3)'//TODO review file types
		,function(req, res){
			res.sendfile( path.join(ECGame.Webserver.webHostRoot, req.url) );
		}
	);
	ECGame.Webserver.expressApp.get(
		'/*.(css|html|png|jpg|mp3)'//TODO review file types
		,function(req, res){
			res.sendfile( path.join(ECGame.Webserver.webHostRoot, req.url) );
		}
	);
}
else
{
	ECGame.Webserver.expressApp.get(
		'/*.(js|css|html|png|jpg|mp3)'//TODO review file types
		,function(req, res){
			res.sendfile( path.join(ECGame.Webserver.webHostRoot, req.url) );
		}
	);
}



ECGame.Webserver.expressApp.get(
	'/'
	,function(req, res)
	{
		res.sendfile( path.join(ECGame.Webserver.webHostRoot, 'intro.html') );//TODO rename the index.html
	}
);



ECGame.Webserver.httpServer.listen(
	ECGame.Webserver.webHostPort
	//,ECGame.Webserver.webHostAddress	//Note: if this is here it cannot be accessed elsewhere
);
console.log(
	"\n\n------------------\n"
	+ "WebServer Running:\n\n"
	+ "Hosting at:\n\t" + ECGame.Webserver.webHostAddress + ":" + ECGame.Webserver.webHostPort + "\n\n"
	+ "Serving files from:\n\t'" + ECGame.Webserver.webHostRoot + "'\n"
	+ "------------------\n\n"
);

/*
ECGame.Webserver.expressApp.configure(
	function()
	{
		ECGame.Webserver.expressApp.use(express.static(ECGame.Webserver.webHostRoot));
		//TODO more configure(s)??
	}
);*/
//TODO more configure(s) **types**??

//TODO this should be only in GameRunner, here copied here due to debug issue with node inspector
if(ECGame.Settings.Network.isMultiplayer)
{
	//RUN UNIT TEST scripts
//	if(ECGame.Settings.RUN_UNIT_TESTS)
//		ECGame.unitTests.runTests();
	//RUN GAME scripts
	ECGame.instance = ECGame.EngineLib.GameInstance.create();
	ECGame.instance.run();
}
//Web Server////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////