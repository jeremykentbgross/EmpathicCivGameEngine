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
var mongoose = require('mongoose');



ECGame.WebServerTools.Mongoose.Connection = function MongooseConnection()
{
	this.myURI = null;
	this.myConnection = null;
};

ECGame.WebServerTools.Mongoose.Connection.prototype.init = function init(inConfig)
{
	/*
	TODO more instances, password, etc..
		mongoose.connect('mongodb://username:password@host:port/database?options...');
		http://mongoosejs.com/docs/connections.html
	*/

	this.myURI = 'mongodb://'
		+ inConfig.host + ':'
		+ inConfig.port + '/'
		+ inConfig.dbName;
		
	this.myConnection = mongoose.createConnection(this.myURI);
};



