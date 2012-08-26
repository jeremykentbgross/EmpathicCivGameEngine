GameUnitTests.registerTest(
	"MultPacker",
	function()
	{
		var myPacker;
		var inValues = [];
		var inRanges = [];
		var value;
		var string;
		var passedTest = true;
		
		var loops = 5;//10000
		var maxRange = 32;//Math.pow(2, 32);
		
		for(var i = 0; i < loops; ++i)
		{
			inRanges[i] = Math.floor(Math.random() * maxRange);
			inValues[i] = Math.floor(Math.random() * inRanges[i]);
		}
		inRanges[10] = maxRange;
		inValues[10] = 0;
		inRanges[11] = maxRange;
		inValues[11] = 0;
		
		myPacker = GameEngineLib.createMultPacker();
		for(var i = 0; i < loops; ++i)
		{
			myPacker.pack(inValues[i], inRanges[i]);
		}
		string = myPacker.getString();
		//console.log(string);
		
		myPacker = GameEngineLib.createMultPacker();
		myPacker.setString(string);
		for(var i = 0; i < loops; ++i)
		{
			value = myPacker.unpack(inRanges[i]);
			if(value !== inValues[i])
			{
				GameEngineLib.logger.error("Loop " + i + " " + value + "!==" + inValues[i] + " with " + inRanges[i]);
				passedTest = false;
			}
		}
		
		
		
		
		myPacker = GameEngineLib.createMultPacker();
		for(var i = 0; i < loops; ++i)
		{
			myPacker.pack(inValues[i], inRanges[i]);
		}
		string = myPacker.getString();
		//console.log(string);
		
		myPacker = GameEngineLib.createMultPacker();
		myPacker.setString(string);
		for(var i = 0; i < loops; ++i)
		{
			value = myPacker.unpack(inRanges[i]);
			if(value !== inValues[i])
			{
				GameEngineLib.logger.error("Loop " + i + " " + value + "!==" + inValues[i] + " with " + inRanges[i]);
				passedTest = false;
			}
		}
		
		
		
		
		
		
		
		return passedTest;
	}
);