GameUnitTests.registerTest(
	"GameArithmeticCompression",
	function()
	{
		var passedTest = true;
		var numValues = 10000;
		
		var bits = 16;
		var maxSize = Math.pow(2, bits);
		
		var models = [];
		var values = [];
		
		var failedLoops = [];


		////////////////////////////////////////////////////////////////////////////
		//setup/////////////////////////////////////////////////////////////////////
		for(var i = 0; i < numValues; ++i)
		{
			var low = Math.floor(Math.random() * maxSize);
			var high = low + Math.floor(Math.random() * maxSize);// + 1;
			values[i] = low + Math.floor(Math.random() * (high - low + 1));
			models[i] = GameEngineLib.GameArithmeticCompressionModels.createEvenProbabilityIntegerRangeModel();
			models[i].setMinMax(low, high);
		}
		
		//special cases:
		var startIndex = 0;
		//We have zero in a max range causing one less
		{
			{
				var low = 0;
				var high = maxSize - 1;
				values[startIndex] = maxSize / 2;
				models[startIndex].setMinMax(low, high);
				++startIndex;
			}
			{
				var low = 0;
				var high = maxSize - 1;
				values[startIndex] = 0;
				models[startIndex].setMinMax(low, high);
				++startIndex;
			}
		}
		//We have max in a max range causing one more
		{
			{
				var low = 0;
				var high = maxSize - 1;
				values[startIndex] = maxSize / 2;
				models[startIndex].setMinMax(low, high);
				++startIndex;
			}
			{
				var low = 0;
				var high = maxSize - 1;
				values[startIndex] = high;
				models[startIndex].setMinMax(low, high);
				++startIndex;
			}
		}
		//setup/////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////
		
		
		
		////////////////////////////////////////////////////////////////////////////
		//run///////////////////////////////////////////////////////////////////////
		var encoder = GameEngineLib.createGameArithmeticCompression();
		
		for(var i = 0; i < numValues; ++i)
		{
			encoder.encode(values[i], models[i]);
		}
		
		var string = encoder.getString();
		var encodedBytes = (bits * numValues / 8);
		var encodedSizeBytes = (string.length * 2);
		console.log("Encoded " + encodedBytes
			+ " bytes in only " + encodedSizeBytes
			+ " a savings of %" + (100 * (1 - encodedSizeBytes / encodedBytes))
		);
		//console.log(string);
		
		encoder = GameEngineLib.createGameArithmeticCompression();
		encoder.setString(string);
		
		for(var i = 0; i < numValues; ++i)
		{
			var value = encoder.decode(models[i]);
			if(value !== values[i])
			{
				GameEngineLib.logger.error("Loop " + i + " " + value + "!==" + values[i] + " with (" + models[i].min + ", " + models[i].max + ")");
				passedTest = false;
				
				failedLoops.push(i);
			}
		}
		//run///////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////
		
		
		
		////////////////////////////////////////////////////////////////////////////
		//For debugging/////////////////////////////////////////////////////////////
		//run again if it failed with the option to break on the bad ones.
		if(!passedTest)
		{
			for(var i = 0; i < numValues; ++i)
			{
				console.log(i);
				console.log("low:\t" + models[i].min);
				console.log("value:\t" + values[i]);
				console.log("high:\t" + models[i].max);
				console.log("range:\t" + (models[i].max-models[i].min));
				console.log("scaled:\t" + ((values[i]-models[i].min)/(models[i].max-models[i].min)));
			}
			
			var encoder = GameEngineLib.createGameArithmeticCompression();
			
			for(var i = 0; i < numValues; ++i)
			{
				if(failedLoops[0] === i)
				{
					var BS = 1;
				}
				encoder.encode(values[i], models[i]);
			}
			
			var string = encoder.getString();
			encoder = GameEngineLib.createGameArithmeticCompression();
			encoder.setString(string);
			
			for(var i = 0; i < numValues; ++i)
			{
				if(failedLoops[0] === i)
				{
					failedLoops = failedLoops.slice(1, failedLoops.length);
				}
				var value = encoder.decode(models[i]);
			}
		}
		//For debugging/////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////
		
		
		return passedTest;
	}
);