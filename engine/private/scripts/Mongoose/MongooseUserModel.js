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

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
var bcrypt = require('bcrypt');	//TODO http://stackoverflow.com/questions/14573488/error-compiling-bcrypt-node-js
var Schema = require('mongoose').Schema;

var encryptionComplexity = 12;
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////



/////////////////////////////////////////////////////////////////////
//Schema/////////////////////////////////////////////////////////////

ECGame.WebServerTools.Mongoose.UserModelSchema = new Schema(
	{
		userName: { type: String, required: true, unique: true }
		,passwordHash: { type: String, required: true, default: "" }
		,userEnabled: { type: Boolean, required: true, default: false }
	}
);



ECGame.WebServerTools.Mongoose.UserModelSchema.statics.createUser = function(inName, inPassword, inCallback)
{
	ECGame.WebServerTools.Mongoose.UserModel.findByName(
		inName
		,function(inError, inResults)
		{
			if(inError)
			{
				console.error(inError);
				inCallback(inError);
				return;
			}

			if(!inResults)
			{
				var aUser = new ECGame.WebServerTools.Mongoose.UserModel(
					{
						userName: inName
						//,passwordHash: null
					}
				);
				console.info("Creating user:", aUser.userName);
				aUser.setPassword(inPassword, inCallback);
			}
			else
			{
				inCallback("User Exists already:" + inName);
			}
		}
	);
};



ECGame.WebServerTools.Mongoose.UserModelSchema.methods.setPassword = function(inPassword, inCallback)
{
	var aThis;
	aThis = this;
	
	console.info("Setting password for:", this.userName);

	ECGame.WebServerTools.Mongoose.UserModel.createPassword(
		inPassword
		,function(inError, inPasswordHash)
		{
			if(inError)
			{
				inCallback(inError);
				return;
			}
			console.info("Saving Password:", inPasswordHash, aThis.userName);
			aThis.passwordHash = inPasswordHash;
			aThis.save(inCallback);
		}
	);
};



ECGame.WebServerTools.Mongoose.UserModelSchema.methods.authenticate = function(inPassword, inCallback)
{
	console.info("Authenticating:", JSON.stringify(this, null, '\t'));

	bcrypt.compare(String(inPassword), this.passwordHash, inCallback);
};



ECGame.WebServerTools.Mongoose.UserModelSchema.statics.findByName = function(inName, inCallback)
{
	this.findOne({ userName : inName }, inCallback);
};



//TODO should we have this at all?
ECGame.WebServerTools.Mongoose.UserModelSchema.statics.removeByName = function(inName, inCallback)
{
	this.remove({ userName : inName }, inCallback);
};



ECGame.WebServerTools.Mongoose.UserModelSchema.statics.createPassword = function createPassword(inPassword, inCallback)
{
	bcrypt.genSalt(
		encryptionComplexity
		,function(inError, inSalt)
		{
			if(inError)
			{
				console.trace(inError);
				inCallback(inError);
				return;
			}

			console.info("Salt:", inSalt);

			bcrypt.hash(
				String(inPassword)
				,inSalt
				,function(inError, inPasswordHash)
				{
					if(inError)
					{
						console.trace(inError);
						inCallback(inError);
						return;
					}

					inCallback(null, inPasswordHash);
				}
			);
		}
	);
};
//Schema/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////



/////////////////////////////////////////////////////////////////////
//Model//////////////////////////////////////////////////////////////
ECGame.WebServerTools.Mongoose.createUserModel = function createUserModel()
{
	ECGame.WebServerTools.Mongoose.UserModel =
		ECGame.webServer.myMongooseConnection.myConnection.model(
			'ECGEUser'	//TODO settings var for this name??
			,ECGame.WebServerTools.Mongoose.UserModelSchema
		);
};
//Model//////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////





