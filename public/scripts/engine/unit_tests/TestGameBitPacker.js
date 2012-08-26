GameUnitTests.registerTest(
	"GameBitPacker",
	function()
	{
		var packer;
		var values = [];
		var bits = [];
		var value;
		var string;
		var passedTest = true;
		var numValues = 10000;
		
		for(var i = 0; i < numValues; ++i)
		{
			bits[i] = Math.floor(Math.random() * 32);
			values[i] = Math.floor(Math.random() * Math.pow(2, bits[i]));
		}
		bits[10] = 32;
		values[10] = 0;
		bits[11] = 32;
		values[11] = 0;
		
		packer = GameEngineLib.createGameBitPacker();
		for(var i = 0; i < numValues; ++i)
		{
			packer.pack(values[i], bits[i]);
		}
		string = packer.getString();
		//console.log(string);
		
		packer = GameEngineLib.createGameBitPacker();
		packer.setString(string);
		for(var i = 0; i < numValues; ++i)
		{
			value = packer.unpack(bits[i]);
			if(value !== values[i])
			{
				GameEngineLib.logger.error("Loop " + i + " " + value + "!==" + values[i] + " with " + bits[i]);
				passedTest = false;
			}
		}
		
		return passedTest;
	}
);