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

var util
	,anInfo
	,aWarn
	,anError
	;

util = require('util');
anInfo = console.info;
aWarn = console.warn;
anError = console.error;

console.info = function info()
{
	var args = Array.prototype.slice.call(arguments);
	args.unshift("INFO:");
	anInfo.apply(this, args);
};

console.warn = function warn()
{
	var anErrorObject = new Error();
	anErrorObject.name = "WARNING";
	anErrorObject.message = util.format.apply(this, arguments);
	Error.captureStackTrace(anErrorObject, /*arguments.callee*/warn);
	aWarn.apply(this, [anErrorObject.stack]);
};

console.error = function error()
{
	var anErrorObject = new Error();
	anErrorObject.name = "ERROR";
	anErrorObject.message = util.format.apply(this, arguments);
	Error.captureStackTrace(anErrorObject, /*arguments.callee*/error);
	anError.apply(this, [anErrorObject.stack]);
};

console.trace = function trace()
{
	var anErrorObject = new Error();
	anErrorObject.name = "TRACE";
	anErrorObject.message = util.format.apply(this, arguments);
	Error.captureStackTrace(anErrorObject, /*arguments.callee*/trace);
	anError.apply(this, [anErrorObject.stack]);
};