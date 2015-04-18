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

//requires:
var util
	,childProcess
	//console originals
	,anInfo
	,aWarn
	,anError
	//spawn original
	,aChildProcessSpawn
	;

util = require('util');
childProcess = require("child_process");

anInfo = console.info;
aWarn = console.warn;
anError = console.error;

aChildProcessSpawn = childProcess.spawn;

console.info = function info()
{
	var anErrorObject
		,anArgsList
		;

	anErrorObject = new Error();
	anErrorObject.name = "";
	anErrorObject.message = "";
	Error.captureStackTrace(anErrorObject, /*arguments.callee*/info);

	anArgsList = Array.prototype.slice.call(arguments);
	anArgsList.unshift("INFO:[" + (new Date()).toISOString() + "]:");
	anArgsList.push(
		anErrorObject.stack.substring(
			0,
			anErrorObject.stack.indexOf('\n', anErrorObject.stack.indexOf('\n') + 1)
		).replace(/\(.*\//g, '(') + '\n'
	);
	anInfo.apply(this, anArgsList);
};

console.warn = function warn()
{
	var anErrorObject = new Error();
	anErrorObject.name = "WARNING:[" + (new Date()).toISOString() + "]";
	anErrorObject.message = util.format.apply(this, arguments);
	Error.captureStackTrace(anErrorObject, /*arguments.callee*/warn);
	aWarn.apply(this, [anErrorObject.stack]);
};

console.error = function error()
{
	var anErrorObject = new Error();
	anErrorObject.name = "ERROR:[" + (new Date()).toISOString() + "]";
	anErrorObject.message = util.format.apply(this, arguments);
	Error.captureStackTrace(anErrorObject, /*arguments.callee*/error);
	anError.apply(this, [anErrorObject.stack]);
};

console.trace = function trace()
{
	var anErrorObject = new Error();
	anErrorObject.name = "TRACE:[" + (new Date()).toISOString() + "]";
	anErrorObject.message = util.format.apply(this, arguments);
	Error.captureStackTrace(anErrorObject, /*arguments.callee*/trace);
	anError.apply(this, [anErrorObject.stack]);
};



childProcess.spawn = function spawn()
{
	if(ECGame.Settings.Debug.TraceSubProcesses)
	{
		console.trace('spawn called\n', arguments);
	}
	return aChildProcessSpawn.apply(this, arguments);
};


//TODO is this the right place for this?
/*process.on(
	'uncaughtException'
	,function (inError)
	{
		console.error('uncaughtException:', inError.message);
		console.error(inError.stack);
		//process.exit(1);
	}
);*/
