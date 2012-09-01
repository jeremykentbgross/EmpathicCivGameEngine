GameEngineLib.createMultPacker = function()
{
	var outPacker = {};
	var private =
	{
		data : [0],
		range : 1,
		index : 0
	};
	
	var bitCap = 32;
	var maxBits = 16;
	var maxPower = Math.pow(2, maxBits);
	var capValue = Math.pow(2, bitCap);
	
	if(GameSystemVars.DEBUG)
		GameEngineLib.addDebugInfo("multPacker", outPacker, private);
	
	outPacker.pack = function(value, range)
	{
		var length = private.data.length;
		
		if(GameSystemVars.DEBUG)
		{
			range = Math.floor(range);
			range = Math.max(range, 1);
			range = Math.min(range, capValue);
			
			value = Math.floor(value);
			value = Math.min(value, range - 1);
			value = Math.max(value, 0);
		}
				
		private.data[length - 1] += value * private.range;
		private.range *= range;
		
		while(private.data[length - 1] >= maxPower)
		{
			//private.bits -= maxBits;
			//private.power = Math.pow(2, private.bits);
			private.range = Math.floor(private.range / maxPower);
			
			private.data[length] = Math.floor(private.data[length - 1] / maxPower);
			//private.data[length - 1] -= private.data[length] * maxPower;
			private.data[length - 1] %= maxPower;
						
			length = private.data.length;
		}
		
		private.index = length;
	}
	
	outPacker.setString = function(inString)
	{
		var length = inString.length;
		
		private.data = [];
		
		for(var i = 0; i < length; ++i)
		{
			private.data[i] = inString.charCodeAt(i);
		}
		
		private.range = 1;
		private.index = 0;
	}
	
	outPacker.getString = function()
	{
		var length;
		var outString;
		
		length = private.data.length;
		outString = "";
		
		for(var i = 0; i < length; ++i)
		{
			outString = outString + String.fromCharCode(private.data[i]);
		}
		
		return outString;
	}
	
	outPacker.unpack = function(range)
	{
		var outValue = 0;
		var extraBits = 0;
		
		if(GameSystemVars.DEBUG)
		{
			range = Math.floor(range);
			range = Math.max(range, 1);
			range = Math.min(range, capValue);
		}
				
		outValue = private.data[private.index] / private.range;
		private.range *= range;
		
		outValue = Math.floor(outValue);
		outValue %= range;		
		
		while(private.data[length - 1] >= maxPower)
		{
			++private.index;
			//private.bits -= maxBits;
			//private.power = Math.pow(2, private.bits);
			private.range = Math.floor(private.range / maxPower);
			
			extraBits = private.data[private.index];
			extraBits %= private.range;
			extraBits *= range / private.range;
			
			outValue += extraBits;
		}				
		
		return outValue;
	}
	
	return outPacker;
};

if(GameSystemVars.RUN_UNIT_TESTS)
{
	include("scripts/TestMultPacker.js");
}