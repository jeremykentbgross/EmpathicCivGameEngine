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

ECGame.WebServerTools.WebServer = function WebServer()
{
	//TODO this is NOT OK! Detect network card and use settings.
	this.webHostAddress = "localhost";
	this.webHostPort = 80;

	//should be the project root,
	//	which will NOT be served directly, but rather contains _public_/ and _protected_/
	this.webHostRoot = path.join(path.dirname(__filename), '../../..');

	//create the static serve callback
	this.staticServeRoot = express.static(this.webHostRoot);
	
	//http file server
	this.expressApp = express();

	//wrapper for express which is needed for socket.io to serve correctly below
	this.httpServer = http.createServer(this.expressApp);

	this.conditionallyLogRequest = this.getConditionalLogRequestFunction();
};



ECGame.WebServerTools.WebServer.prototype.run = function run()
{
	var aThis
		,docJS
		;
	
	aThis = this;

	//if just arriving redirect to the welcome screen
	this.expressApp.get(
		'/'
		,this.conditionallyLogRequest
		,function webGetHome(inRequest, outResponse)
		{
			inRequest = inRequest.originalUrl;	//Shut the fuck up jslint!!
			outResponse.redirect('_protected_/welcome.html');
		}
	);
	
	//generate and serve documentation
	if(ECGame.Settings.Server.generateDocumentation) /**! @todo: NOT in final release mode! */
	{
		docJS = ECGame.WebServerTools.DocJS.create();
		docJS.loadDirectory('../_unified_');	//TODO specifics under this, NOT 3rdParty
		docJS.run();

		this.expressApp.get(
			'/_protected_/docs/*'
			,this.conditionallyLogRequest
			,this.staticServeRoot
		);
	}
	else
	{
		//don't generate or serve documentation:
		this.expressApp.get(
			'/_protected_/docs/*'
			,this.conditionallyLogRequest
			,this.handle404
		);
	}

	//either compress the client code or serve it all raw
	if(ECGame.Settings.Server.compressClientCode)
	{
		this.codeCompressor = new ECGame.WebServerTools.CodeCompressor(
			'../_protected_/engine/',	/**! @todo: should now only need one path not two!?!? */
			'../_protected_/game/'/**! @todo: put real game name here! */
		);
		this.codeCompressor.makeCompactGameLoader();

		//serve the loader
		this.expressApp.get(
			'/_protected_/engine/scripts/EngineLoader.js'
			,this.conditionallyLogRequest
			,function webGetCompressedCode(inRequest, outResponse)
			{
				var code = aThis.codeCompressor.getCompactCode();

				inRequest = inRequest.originalUrl;	//Shut the fuck up jslint!!
				
				outResponse.writeHead(
					200,
					{
						'Content-Length': code.length,
						'Content-Type': 'text/javascript'
					}
				);
				outResponse.write(code);
				outResponse.end();
			}
		);
		//serve anything under 3rdParty
		this.expressApp.get(
			'/_protected_/3rdParty/*'
			,this.conditionallyLogRequest
			,this.staticServeRoot
		);
		//serve limited files (no js, or unwanted filetypes like waves)
		this.expressApp.get(
			'/_protected_/*.(css|html|png|jpg|mp3|wav)'//TODO review file types (no waves!)
			,this.conditionallyLogRequest
			,this.staticServeRoot
		);
	}
	else
	{
		//not compressed, so just serve everything:
		this.expressApp.get(
			'/_protected_/*'
			,this.conditionallyLogRequest
			,this.staticServeRoot
		);
	}

	// assume 404 since no middleware responded
	this.expressApp.use(
		this.conditionallyLogRequest
		,this.handle404
	);

	//listen:
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

	//TODO?: this.expressApp.configure(...);
};



ECGame.WebServerTools.WebServer.prototype.handle404 = function handle404(inRequest, outResponse/*, inNext*/)
{
	console.log('404 no handler found!:', inRequest.originalUrl);
	outResponse.status(404).send('404 no handler found for: ' + inRequest.originalUrl);
};



ECGame.WebServerTools.WebServer.prototype.getConditionalLogRequestFunction =
	function getConditionalLogRequestFunction()
{
	var aThis = this;

	return function conditionalLogRequest(inRequest, inResponse, inNext)
	{
		if(ECGame.Settings.Server.logRequests)
		{
			if(ECGame.Settings.Server.logRequestsVerbose)
			{
				aThis.logRequestDetailed(inRequest, inResponse, inNext);
			}
			else
			{
				aThis.logRequest(inRequest, inResponse, inNext);
			}
		}
		else
		{
			inNext();
		}
	};
};


ECGame.WebServerTools.WebServer.prototype.logRequest = function logRequest(inRequest, inResponse, inNext)
{
	console.log(
		"\nRequest:"
		,"\n\t" + inRequest.method + ' ' + inRequest.protocol + '://' + inRequest.hostname + inRequest.originalUrl
		,"\n\tVia:\t", inRequest.ip + ' ' + JSON.stringify(inRequest.ips)
		,"\n\tFrom:\t", inResponse.connection.remoteAddress + ':' + inResponse.connection.remotePort
		,"\n\tBody:\t", inRequest.body
	);
	inNext();
};

ECGame.WebServerTools.WebServer.prototype.logRequestDetailed = function logRequestDetailed(inRequest, inResponse, inNext)
{
	console.log(
		"\nRequest:"
		
		,"\n\tMethod:\t", inRequest.method
		,"\n\tProtocol:\t", inRequest.protocol
		,"\n\tOriginal Url:\t", inRequest.originalUrl
		,"\n\tBase Url:\t", inRequest.baseUrl
		,"\n\tSubdomains:\t", inRequest.subdomains
		,"\n\tPath:\t", inRequest.path
		
		,"\n\tParams:\t", inRequest.params
		,"\n\tQuery:\t", inRequest.query
		,"\n\tBody:\t", inRequest.body
		
		,"\n\tHostname:\t", inRequest.hostname
		,"\n\tIP:\t", inRequest.ip
		,"\n\tIP's:\t", inRequest.ips
		
		,"\n\tSignedCookies:\t", inRequest.signedCookies
		,"\n\tCookies:\t", inRequest.cookies
		
		,"\n\tSecure:\t", inRequest.secure

		,"\n\tXhr:\t", inRequest.xhr
		,"\n\tStale:\t", inRequest.stale
		,"\n\tFresh:\t", inRequest.fresh
		
		,"\n\tRemote Address:\t", inResponse.connection.remoteAddress
		,"\n\tRemotePort:\t", inResponse.connection.remotePort
		
		//,"\n:\t", inRequest.
		
		,"\n\tRoute:\t", inRequest.route
		,"\n\tHeaders:\t", inRequest.headers
		,'\n'
	);
	inNext();
};

/*
ECGame.WebServerTools.WebServer.prototype.getServerStartedCallback = function getServerStartedCallback(inServer, inProtocal)
{
	return function ServerStarted()
	{
		var aHost = inServer.address().address;
		var aPort = inServer.address().port;

		console.log('Listening at %s://%s:%s\n', inProtocal, aHost, aPort);
	};
};*/



