"use strict";
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
var LocalStrategy = require('passport-local').Strategy;



ECGame.WebServerTools.Mongoose.UserAuth = function MongooseUserAuth()
{
	this.myUserModel = null;
};



//Note: inUsers is a hack to create users on startup for debugging. TODO remove that!
ECGame.WebServerTools.Mongoose.UserAuth.prototype.init = function init(inPassport, inUsers)
{
	var aUser
		,aThis
		,aUserCreationCallback
		,i
		;

	console.log("Using Mongo Memory Storage");

	aThis = this;

	inUsers = inUsers || [];

	ECGame.WebServerTools.Mongoose.createUserModel();
	this.myUserModel = ECGame.WebServerTools.Mongoose.UserModel;

	aUserCreationCallback = function(inError, inResults)
	{
		if(inError)
		{
			console.error(inError);
			return;
		}
		if(inResults)
		{
			console.info(inResults);
		}
	};

	for(i = 0; i < inUsers.length; ++i)
	{
		aUser = inUsers[i];
		this.myUserModel.createUser(
			aUser.userName
			,aUser.password
			,aUserCreationCallback
		);
	}

	inPassport.use(
		new LocalStrategy(
			function(inUsername, inPassword, inDone)
			{
				aThis.strategyCallback(inUsername, inPassword, inDone);
			}
		)
	);

	inPassport.deserializeUser(
		function(inUsername, inDone)
		{
			aThis.myUserModel.findByName(
				inUsername
				,function(inError, inUser)
				{
					if(inError)
					{
						console.error(inError);
						return inDone(inError);
					}
					if(inUser)
					{
						return inDone(null, inUser);
					}
					inDone("No user!");
				}
			);
		}
	);
};



ECGame.WebServerTools.Mongoose.UserAuth.prototype.strategyCallback =
	function strategyCallback(inUsername, inPassword, inDone)
{
	console.info('Trying to login user:', inUsername);
	
	this.myUserModel.findByName(
		inUsername
		,function(inError, inUser)
		{
			if(inError)
			{
				console.error(inError);
				return inDone(null, false, { message: inError });
			}
			if(!inUser)
			{
				console.info('No User:', inUsername);
				return inDone(null, false, { message: 'Incorrect username or password.' });
			}
			inUser.authenticate(
				inPassword
				,function(inError, inAuthenticated)
				{
					if(inError)
					{
						console.error(inError);
						return inDone(null, false, { message: inError });
					}
					//console.info("Authenticate results:", inAuthenticated);
					if(inAuthenticated)
					{
						console.info('User Found:', inUsername);
						return inDone(null, inUser);
					}

					console.info('Bad Password for:', inUsername);
					return inDone(null, false, { message: 'Incorrect username or password.' });
				}
			);
		}
	);
};



