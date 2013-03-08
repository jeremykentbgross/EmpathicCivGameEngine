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

ECGame.log = new (function ECGameLog(){})();//TODO make a real object or something

//TODO rename this?
ECGame.log.assert = function ECGameAssert(expression, message)
{
	if(!expression)
	{
		throw new Error("Assert failed: " + '\'' + message + '\'');
	}
};

/*
TODO:
filter and print system name:
Game.Log.Flags =//SystemNames
{
	
};
Game.Log.info(FLAG, msg);
Game.Log.warn(FLAG, msg);
Game.Log.error(FLAG, msg);
*/


//TODO create object here that is new'ed in or something?
ECGame.EngineLib.logger = {};
ECGame.EngineLib.logger.createMsgType = function(inType, inFullPathDefault)
{
	return function(inMsg, inFullPath)
	{
		var stackPath;
		var index = 0;
		var index2;
		
		inFullPath = inFullPath || inFullPathDefault;
		
		try
		{
			throw new Error(inMsg);
		}
		catch(error)
		{
			stackPath = error.stack;
			if(!stackPath)
			{
				console.log(inType + ': \'' + inMsg + '\'' + " (Path Not supported.)");
				return;
			}
			//index = stackPath.indexOf("at Object.error") + 1;
			index = stackPath.indexOf('\n', index) + 1;
			index = stackPath.indexOf('\n', index);
			if(inFullPath)
			{
				stackPath = stackPath.slice(index);
			}
			else
			{
				index = stackPath.indexOf('at', index);
				index2 = stackPath.indexOf('\n', index + 1);
				stackPath = ' ' + stackPath.slice(index, index2);
			}
			console.log(
		//		(ECGame.Settings.Network.isServer?'\n':'') +
				inType + ': \'' + inMsg + '\'' + stackPath
		//		+ (ECGame.Settings.Network.isServer?'\n':'')
			);
		}
	};
};
//TODO rename this GameLogger
ECGame.log.info = ECGame.EngineLib.logger.createMsgType("INFO");
ECGame.log.warn = ECGame.EngineLib.logger.createMsgType("WARNING", true);
ECGame.log.error = ECGame.EngineLib.logger.createMsgType("ERROR", true);


//TODO depricated!
ECGame.EngineLib.addDebugInfo = function(className, instance, PRIVATE)
{
	var propertyName;
	
	propertyName = 'super_' + className;
	instance[propertyName] = instance[propertyName] || {};
	instance[propertyName].debug_private = PRIVATE;
};