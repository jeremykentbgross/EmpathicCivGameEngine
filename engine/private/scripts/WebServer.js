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
var path = require("path");
var http = require("http");
var express = require("express");

//TODO switch dojo for jquery (it is smaller), although I might need include.js then.
//TODO!!!!! http://dshaw.github.io/2012-05-jsday/#/
//http://stackoverflow.com/questions/8386455/deploying-a-production-node-js-server
//http://stackoverflow.com/questions/15839253/express-3-0-https/15839596#15839596
//https://github.com/nodejitsu/node-http-proxy

/*
http://blog.argteam.com/coding/hardening-nodejs-production-process-supervisor/
 
http://blog.argteam.com/coding/hardening-node-js-for-production-part-2-using-nginx-to-avoid-node-js-load/
 
https://www.google.com/search?q=nodejs+hardening&oq=nodejs+hardening&aqs=chrome..69i57j0l3.3989j0&sourceid=chrome&ie=UTF-8
 
Search:
hardening:
ubuntu server
nodejs
expressjs
wsjs
etc..
 
http://www.thefanclub.co.za/how-to/how-secure-ubuntu-1204-lts-server-part-1-basics
 
http://www.thefanclub.co.za/how-to/how-secure-ubuntu-1204-lts-server-part-2-gui-installer-script
 
http://nginx.org/en/docs/http/websocket.html
*/

ECGame.WebServerTools.WebServer = function WebServer()//TODO WebServer
{
	//Path/Setup
	this.webHostAddress = "localhost";//TODO this is NOT OK!
	this.webHostPort = 80;
	this.webHostRoot = path.join(path.dirname(__filename), '../../../_public_');
	this.webHostDocsRoot = path.join(path.dirname(__filename), '../../..');
	
	//http file server
	this.expressApp = express();
	//wrapper for express which is needed for socket.io to serve correctly below
	this.httpServer = http.createServer(this.expressApp);
};



ECGame.WebServerTools.WebServer.prototype.run = function run()
{
	var aThis
		,docJS
		;
	
	aThis = this;
	
	if(ECGame.Settings.Server.generateDocumentation) /**! @todo: NOT in final release mode! */
	{
		var docJS = ECGame.WebServerTools.DocJS.create();
		docJS.loadDirectory('../engine');
		docJS.loadDirectory('../engine_test_game');/**! @todo: put real game name here! */
		docJS.run();
		this.expressApp.get(
			'/docs/*.(js|css|html)'//TODO review file types (no waves!)
			,function webGetDocs(req, res)
			{
				res.sendfile(
					path.join(aThis.webHostDocsRoot, req.url)
				);
			}
		);
	}
	
	if(ECGame.Settings.Server.compressClientCode)
	{
		this.codeCompressor = new ECGame.WebServerTools.CodeCompressor(
			'../engine/public/',
			'../engine_test_game/public/'/**! @todo: put real game name here! */
		);
		this.codeCompressor.makeCompactGameLoader();
		
		this.expressApp.get(
			'/engine/scripts/EngineLoader.js'
			,function webGetCompressedCode(req, res)
			{
				var code = aThis.codeCompressor.getCompactCode();
				
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
		this.expressApp.get(
			'/3rdParty/*.(js|css|html|png|jpg|mp3|wav)'//TODO review file types (no waves!)
			,function webGet3rdParty(req, res)
			{
				res.sendfile(
					path.join(aThis.webHostRoot, req.url)
				);
			}
		);
		this.expressApp.get(
			'/*.(css|html|png|jpg|mp3|wav)'//TODO review file types (no waves!)
			,function webGetCompressed(req, res)
			{
				res.sendfile(
					path.join(aThis.webHostRoot, req.url)
				);
			}
		);
	}
	else
	{
		this.expressApp.get(
			'/*.(js|css|html|png|jpg|mp3|wav)'//TODO review file types (no waves!)
			,function webGetAny(req, res)
			{
				res.sendfile(
					path.join(aThis.webHostRoot, req.url)
				);
			}
		);
	}

	this.expressApp.get(
		'/'
		,function webGetHome(req, res)
		{
			res.sendfile(
				path.join(aThis.webHostRoot, 'welcome.html')
			);
		}
	);

	this.httpServer.listen(
		this.webHostPort
		//,this.webHostAddress	//Note: if this is here it cannot be accessed elsewhere
	);
	console.log(
		"\n\n------------------\n"
		+ "WebServer Running:\n\n"
		+ "Hosting at:\n\t" + this.webHostAddress + ":" + this.webHostPort + "\n\n"
		+ "Serving files from:\n\t'" + this.webHostRoot + "'\n"
		+ "------------------\n\n"
	);

	/*
	this.expressApp.configure(
		function()
		{
			aThis.expressApp.use(express.static(aThis.webHostRoot));
			//TODO more configure(s)??
		}
	);*/
	//TODO more configure(s) **types**??
};