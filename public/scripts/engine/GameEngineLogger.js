GameEngineLib.logger = {};
GameEngineLib.logger.createMsgType = function(inType, inFullPathDefault)
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
				console.log(inType + ": \"" + inMsg + "\"" + " (Path Not supported.)");
				return;
			}
			//index = stackPath.indexOf("at Object.error") + 1;
			index = stackPath.indexOf("\n", index) + 1;
			index = stackPath.indexOf("\n", index);
			if(inFullPath)
			{
				stackPath = stackPath.slice(index);
			}
			else
			{
				index = stackPath.indexOf("at", index);
				index2 = stackPath.indexOf("\n", index + 1);
				stackPath = " " + stackPath.slice(index, index2);
			}
			console.log(inType + ": \"" + inMsg + "\"" + stackPath);
		}
	}
}
GameEngineLib.logger.info = GameEngineLib.logger.createMsgType("INFO");
GameEngineLib.logger.warn = GameEngineLib.logger.createMsgType("WARNING", true);
GameEngineLib.logger.error = GameEngineLib.logger.createMsgType("ERROR", true);


GameEngineLib.addDebugInfo = function(className, instance, private)
{
	var propertyName;
	
	propertyName = "super_" + className;
	instance[propertyName] = instance[propertyName] || {}
	instance[propertyName].debug_private = private;
}