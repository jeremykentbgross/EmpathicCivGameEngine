//todo bitpacker version, name these, etc..



/*
GameEngineLib.CloneSerializer = function()
{
	var instance = {};
	var private = {};
		
	private.isReading = true;
	
	instance.isRead = function()
	{
		return private.isReading;
	}
	instance.isWrite = function()
	{
		return !private.isReading;
	}
	
	instance.Write = function(name, value)
	{
		//todo check that this is a number or string
		private[name] = value;
	}
	
	instance.Read = function(name)
	{
		return private[name];
	}
	
	return instance;
}*/

GameEngineLib.Serializer = function()
{
	var instance = {};
	var private = {};
	
	if(GameEngineLib.DEBUG)
	{
		GameEngineLib.addDebugInfo("Serializer", instance, private);
	}
		
	private.data = [];
	private.isReading = false;
	private.readPtr = 0;
	
	instance.setData = function(data)
	{
		private.data = data;
	}
	instance.getData = function()
	{
		return private.data;
	}
	
	instance.beginReading = function()
	{
		private.isReading = true;
		private.readPtr = 0;
	}
	instance.beginWriting = function()
	{
		private.isReading = false;
		private.readPtr = 0;
		private.data = [];
	}
		
	
	instance.isReading = function()
	{
		return private.isReading;
	}
	instance.isWriting = function()
	{
		return !private.isReading;
	}
	
	instance.read = function(name)
	{
		if(!private.isReading)
			return null;//todo throw?
			
		return private.data[private.readPtr++];
	}
	instance.write = function(name, value)
	{
		if(private.isReading)
			return;//todo throw?
		
		//todo check type?
		switch(typeof value)
		{
			case 'undefined':
				GameEngineLib.logger.error("Can't serialize undefined value:" + value);
		//if string or num
		//	write
		//if ref
		//	write deref
		}
		
		//todo check that this is a number or string
		private.data[private.data.length] = value;
	}
		
	return instance;
}




