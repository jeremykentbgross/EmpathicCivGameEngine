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

var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

var passport = require('passport');
var MongoSessionStore = require('connect-mongo')(session);

var pem = require('pem');

var http = require('http');
var https = require('https');

var path = require("path");



ECGame.WebServerTools.WebServer = function WebServer()
{
	//TODO this is NOT OK (and not used atm)! Detect network card and use those settings.
	//	which interface: http://stackoverflow.com/questions/3653065/get-local-ip-address-in-node-js
	this.myWebHostAddress = "localhost";

	//should be the project root,
	//	which will NOT be served directly, but rather contains _public_/ and _protected_/
	this.myWebHostRoot = path.join(path.dirname(__filename), '../../..');

	//create the static serve callback
	this.myStaticServeRoot = express.static(this.myWebHostRoot);

	//create request logging function:
	this.myConditionallyLogRequest = this.getConditionalLogRequestFunction();

	//express
	this.myExpressApp = null;
	this.myRedirectExpressApp = null;

	//mongoose
	this.myMongooseConnection = null;

	//auth functionality (could be mongoose, or theoretically something else)
	this.myAuth = null;

	//will sessions be stored?
	this.mySessionStore = undefined;

	//session login stuff, needed by websockets for manual authentication
	this.mySession = null;
	this.myPassportInit = null;
	this.myPassportSession = null;

	//4 compressing code before serving it:
	this.myCodeCompressor = null;

	//actual servers:
	this.myHttpServer = null;
	this.myHttpsServer = null;
};



ECGame.WebServerTools.WebServer.prototype.run = function run(inServerRunningCallback)
{
	//initialize express:
	this.myExpressApp = express();
	this.myExpressApp.use(cookieParser());
	this.myExpressApp.use(bodyParser.urlencoded({ extended: false }));
	this.myExpressApp.use(bodyParser.json());
	//TODO?: this.myExpressApp.use(this.myConditionallyLogRequest);
	//TODO?: this.myExpressApp.configure(...);

	//setup mongoose if needed:
	if(ECGame.Settings.Server.useMongoose)
	{
		this.myMongooseConnection = new ECGame.WebServerTools.Mongoose.Connection();
		this.myMongooseConnection.init(ECGame.Settings.Server.Mongoose);
		this.myAuth = new ECGame.WebServerTools.Mongoose.UserAuth();
		this.mySessionStore = new MongoSessionStore(
			{
				mongooseConnection : this.myMongooseConnection.myConnection
			}
		);
	}

	//setup main server functionality and run:
	this._setupContentEntryPoints();
	this._serveCoreContent();
	this._startServer(inServerRunningCallback);
};



ECGame.WebServerTools.WebServer.prototype._setupContentEntryPoints = function _setupContentEntryPoints()
{
	var aThis = this;

	if(ECGame.Settings.Server.requireSessionLogins)
	{
		this.mySession = session(
			{
				secret: ECGame.Settings.Server.Session.secret
				,cookie:
				{
					maxAge : ECGame.Settings.Server.Session.timeout
					//,secure: true	//????
					//domain: '.domain.com', //<=note '.' TODO	http://stackoverflow.com/questions/23178104/node-js-passport-session-cookie-domain
				}
				,resave: false
				,saveUninitialized: false
				,store: aThis.mySessionStore
			}
		);
		this.myPassportInit = passport.initialize();
		this.myPassportSession = passport.session();

		this.myExpressApp.use(this.mySession);
		this.myExpressApp.use(this.myPassportInit);
		this.myExpressApp.use(this.myPassportSession);

		this.myAuth.init(passport, /*new users hack*/[]);

		passport.serializeUser(
			function(inUser, inDone)
			{
				inDone(null, inUser.userName);
			}
		);

		//entry point:
		this.myExpressApp.get(
			'/'
			,this.myConditionallyLogRequest
			,function(inRequest, outResponse/*, inNext*/)
			{
				if(!inRequest.isAuthenticated())
				{
					outResponse.redirect(ECGame.Settings.Server.Session.needLoginPath);
					return;
				}
				outResponse.redirect(ECGame.Settings.Server.Session.loginSuccessPath);
			}
		);

		this.myExpressApp.post(
			'/_public_/login'
			,this.myConditionallyLogRequest
			,passport.authenticate(
				'local'
				,{failureRedirect:ECGame.Settings.Server.Session.needLoginPath}	//TODO login failed page?
			)
			,this.myConditionallyLogRequest
			,function(inRequest, outResponse)
			{
				inRequest = inRequest.originalUrl;	//Shut the fuck up jslint!!
				outResponse.redirect(ECGame.Settings.Server.Session.loginSuccessPath);
			}
		);
		
		this.myExpressApp.post(
			'/_public_/register'
			,this.myConditionallyLogRequest
			,function(inRequest, outResponse/*, inNext*/)
			{
				//console.info('register:', inRequest.body);	//<=careful, this could print passwords to log
				if(inRequest.body.password !== inRequest.body.passwordVerify)
				{
					outResponse.status(400).send(
						'400 Passwords do not match '//TODO page for this
						+ '<a href="' + ECGame.Settings.Server.Session.needLoginPath + '">' + 'Try Again</a>'
					);
					return;
				}

				ECGame.WebServerTools.Mongoose.UserModel.createUser(
					inRequest.body.username
					,inRequest.body.password
					,function(inError, inResults)
					{
						if(inError)
						{
							console.warn(inError);
							outResponse.status(400).send("An error occurred");//TODO specfic failure if user exists!
							return;
						}
						if(inResults)
						{
							console.info(inResults);
							outResponse.status(200).send(
								'200 Success, but notice that your account must be manually approved during develompent. '//TODO page for this
								+ '<a href="' + ECGame.Settings.Server.Session.needLoginPath + '">' + 'Login</a>'
							);
						}
					}
				);
			}
		);

		this.myExpressApp.get(
			'/_public_/*'
			,this.myConditionallyLogRequest
			,this.myStaticServeRoot
		);

		//guard _protected_ with authentication:
		this.myExpressApp.use(
			'/_protected_*'
			,this.myConditionallyLogRequest
			,function canAccessProtected(inRequest, outResponse, inNext)
			{
				if(inRequest.isAuthenticated())
				{
					if(!inRequest.user.userEnabled)
					{//TODO have page for this
						return outResponse.status(401).send('401: Your user account has not yet been approved for access to closed testing!');
					}
					//keep alive!!
					inRequest.session.lastAccess = new Date().getTime();//TODO use built in option for this?
					return inNext();
				}

				return outResponse.status(401).redirect(ECGame.Settings.Server.Session.needLoginPath);
			}
		);

		this.myExpressApp.use(	//TODO post instead of use??
			'/_protected_/logout'
			,this.myConditionallyLogRequest
			,function(inRequest, outResponse/*, inNext*/)
			{
				if(!inRequest.isAuthenticated())
				{
					outResponse.redirect(ECGame.Settings.Server.Session.needLoginPath);
					return;
				}

				var aUserName = inRequest.user.userName;
				inRequest.session.destroy(
					function()
					{
						console.info('Session ended for', aUserName);
						outResponse.redirect(ECGame.Settings.Server.Session.needLoginPath);
					}
				);
				//might work also:??
				//	inRequest.logout();
				//	outResponse.redirect('/');
			}
		);
	}
	else
	{
		//if just arriving redirect to the welcome screen
		this.myExpressApp.get(
			'/'
			,this.myConditionallyLogRequest
			,function webGetHome(inRequest, outResponse)
			{
				inRequest = inRequest.originalUrl;	//Shut the fuck up jslint!!
				outResponse.redirect(ECGame.Settings.Server.Session.loginSuccessPath);
			}
		);
	}
};



ECGame.WebServerTools.WebServer.prototype._serveCoreContent = function _serveCoreContent()
{
	var docJS
		,aThis
		;

	aThis = this;

	//generate and serve documentation
	if(ECGame.Settings.Server.generateDocumentation) /**! @todo: NOT in final release mode! */
	{
		docJS = ECGame.WebServerTools.DocJS.create();
		docJS.loadDirectory('../_unified_');
		docJS.run();

		this.myExpressApp.get(
			'/_protected_/docs/*'
			,this.myConditionallyLogRequest
			,this.myStaticServeRoot
		);
	}
	else
	{
		//don't generate or serve documentation:
		this.myExpressApp.get(
			'/_protected_/docs/*'
			,this.myConditionallyLogRequest
			,this.handle404
		);
	}

	//either compress the client code or serve it all raw
	if(ECGame.Settings.Server.compressClientCode)
	{
		this.myCodeCompressor = new ECGame.WebServerTools.CodeCompressor(
			'../_protected_/engine/',	/**! @todo: should now only need one path not two!?!? */
			'../_protected_/game/'/**! @todo: put real game name here! */
		);
		this.myCodeCompressor.makeCompactGameLoader();

		//serve the loader
		this.myExpressApp.get(
			'/_protected_/engine/scripts/EngineLoader.js'
			,this.myConditionallyLogRequest
			,function webGetCompressedCode(inRequest, outResponse)
			{
				var code = aThis.myCodeCompressor.getCompactCode();

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
		this.myExpressApp.get(
			'/_protected_/3rdParty/*'
			,this.myConditionallyLogRequest
			,this.myStaticServeRoot
		);
		//serve limited files (no js, or unwanted filetypes like waves)
		this.myExpressApp.get(
			'/_protected_/*.(css|html|png|jpg|mp3|wav)'//TODO review file types (no waves!)
			,this.myConditionallyLogRequest
			,this.myStaticServeRoot
		);
	}
	else
	{
		//not compressed, so just serve everything:
		this.myExpressApp.get(
			'/_protected_/*'
			,this.myConditionallyLogRequest
			,this.myStaticServeRoot
		);
	}

	// assume 404 since no middleware responded
	this.myExpressApp.use(
		this.myConditionallyLogRequest
		,this.handle404
	);
};



ECGame.WebServerTools.WebServer.prototype._startServer = function _startServer(inServerRunningCallback)
{
	var aThis = this;

	if(!ECGame.Settings.Server.useHttps)
	{
		//setup normal http server
		this.myHttpServer = http.createServer(this.myExpressApp);
		this.myHttpServer.on('error', function(inError){console.error(inError);});
		this.myHttpServer.listen(
			80
			,this.getCustomServerStartedCallback(this.myHttpServer, 'http', inServerRunningCallback)
		);
	}
	else
	{
		//setup redirect server from http to https
		this.myRedirectExpressApp = express();
		this.myRedirectExpressApp.use(
			this.myConditionallyLogRequest,
			function(inRequest, inResponse/*, inNext*/)
			{
				inResponse.redirect('https://' + inRequest.hostname + inRequest.url);
			}
		);
		this.myHttpServer = http.createServer(this.myRedirectExpressApp);
		this.myHttpServer.on('error', function(inError){console.error(inError);});
		this.myHttpServer.listen(
			80
			,this.getCustomServerStartedCallback(this.myHttpServer, 'http')
		);


		/*TODO: Read files locally if possible? And or save them for future use?
			Note: Docs for creating better security feature set:
				https://github.com/andris9/pem
				http://nodejs.org/api/https.html#https_https_createserver_options_requestlistener */
		pem.createCertificate(
			{days:365, selfSigned:true}
			,function(inError, inKeys)	//Note: param inKeys = {certificate, csr, clientKey, serviceKey}
			{
				if(inError)
				{
					console.error(inError);
					process.exit(1);
					return;
				}

				aThis.myHttpsServer = https.createServer(
					{
						key: (inKeys.serviceKey	|| inKeys.clientKey)	//inKeys.serviceKey might be missing if self signed?
						,cert: inKeys.certificate
						//,ca: [fs.readFileSync('XXX.crt')]				//Note: csr is used to gen crt for this thru some authority
					}
					,aThis.myExpressApp
				);
				aThis.myHttpsServer.on('error', function(inError){console.error(inError);});
				aThis.myHttpsServer.listen(
					443
					,aThis.getCustomServerStartedCallback(aThis.myHttpsServer, 'https', inServerRunningCallback)
				);
			}
		);
	}
};



ECGame.WebServerTools.WebServer.prototype.handle404 = function handle404(inRequest, outResponse/*, inNext*/)
{
	console.info('404 no handler found!:', inRequest.originalUrl);
	outResponse.status(404).send('404 no handler found for: ' + inRequest.originalUrl);
};



ECGame.WebServerTools.WebServer.prototype.getConditionalLogRequestFunction =
	function getConditionalLogRequestFunction()
{
	var aThis = this;

	return function conditionalLogRequest(inRequest, outResponse, inNext)
	{
		if(ECGame.Settings.Server.logRequests)
		{
			if(ECGame.Settings.Server.logRequestsVerbose)
			{
				aThis.logRequestDetailed(inRequest, outResponse, inNext);
			}
			else
			{
				aThis.logRequest(inRequest, outResponse, inNext);
			}
		}
		else
		{
			inNext();
		}
	};
};


ECGame.WebServerTools.WebServer.prototype.logRequest = function logRequest(inRequest, outResponse, inNext)
{
	console.info(
		"\nRequest:"
		,"\n\t" + inRequest.method + ' ' + inRequest.protocol + '://' + inRequest.hostname + inRequest.originalUrl
		,"\n\tVia:\t", inRequest.ip + ' ' + JSON.stringify(inRequest.ips)
		,"\n\tFrom:\t", outResponse.connection.remoteAddress + ':' + outResponse.connection.remotePort
		,"\n\tBody:\t", inRequest.body
	);
	inNext();
};

ECGame.WebServerTools.WebServer.prototype.logRequestDetailed = function logRequestDetailed(inRequest, outResponse, inNext)
{
	console.info(
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
		
		,"\n\tRemote Address:\t", outResponse.connection.remoteAddress
		,"\n\tRemotePort:\t", outResponse.connection.remotePort
		
		//,"\n:\t", inRequest.
		
		,"\n\tRoute:\t", inRequest.route
		,"\n\tHeaders:\t", JSON.stringify(inRequest.headers, null, "\t")
		,'\n'
	);
	inNext();
};



ECGame.WebServerTools.WebServer.prototype.getCustomServerStartedCallback = function getCustomServerStartedCallback(inServer, inProtocal, inNextCallback)
{
	var aThis;
	aThis = this;

	return function ServerStarted()
	{
		var aHost, aPort;

		aHost = inServer.address().address;
		aPort = inServer.address().port;

		console.log(
			"\n\n------------------\n"
			+ "WebServer Running:\n\n"
			+ "Listening at:\n\t%s://%s:%s\n\n"
			+ "Serving files from:\n\t'" + aThis.myWebHostRoot + "'\n"
			+ "------------------\n\n"
			,inProtocal
			,aHost
			,aPort
		);

		if(inNextCallback)
		{
			inNextCallback();
		}
	};
};



