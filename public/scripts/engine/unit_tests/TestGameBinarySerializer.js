GameUnitTests.registerTest(
	"GameBinarySerializer",
	function()
	{
		var passedTest = true;
		
		var format = [
			{
				name : "aBool1",
				scope : "public",
				type : "bool",
				net : false
			},
			{
				name : "aBool2",
				scope : "public",
				type : "bool",
				net : false
			},
			{
				name : "X",
				scope : "private",
				type : "int",
				min : 0,
				max : 65535,
				net : true
			},
			{
				name : "Y",
				scope : "private",
				type : "float",
				min : 0,
				max : 65535,
				precision : 3,
				net : false
			},
			{
				name : "aString",
				scope : "public",
				type : "string",
				net : false
			}
		];
		
		var outObj = {
			public :
			{
				aBool1 : true,
				aBool2 : false,
				aString : "Jeremy's Games are so freaking awesome, and his tech is top notch!"
			},
			private :
			{
				X : 375,
				Y : 41512.123
			}
		};
		
		var testResults = function()
		{
			for(var i = 0; i < format.length; ++i)
			{
				var entry = format[i];
				if(net && !entry.net)
				{
					if(outObj[entry.scope][entry.name] === inObj[entry.scope][entry.name])
					{
						GameEngineLib.logger.error(
							entry.scope + "." + entry.name + " miss match: " +
							outObj[entry.scope][entry.name] + " === " + inObj[entry.scope][entry.name]);
						passedTest = false;
					}
				}
				else
				{
					if(outObj[entry.scope][entry.name] !== inObj[entry.scope][entry.name])
					{
						GameEngineLib.logger.error(
							entry.scope + "." + entry.name + " miss match: " +
							outObj[entry.scope][entry.name] + " !== " + inObj[entry.scope][entry.name]);
						passedTest = false;
					}
				}
			}
		}
		
		
		//Not net
		var net = false;
		{
			//write data
			var serializer = GameEngineLib.GameSerializers.createGameBinarySerializer();
			serializer.initWrite({});
			serializer.serializeObject(outObj, format);
			
			//get the written data to transfer to reader
			var data = serializer.getString();
			
			//read data
			var inObj = {
				public : {},
				private : {}
			};
			serializer = GameEngineLib.GameSerializers.createGameBinarySerializer();
			serializer.initRead({}, data);
			serializer.serializeObject(inObj, format);
		}
		//compare values in in/out Obj
		testResults();
		
		
		//net
		var net = true;
		{
			//write data
			var serializer = GameEngineLib.GameSerializers.createGameBinarySerializer();
			serializer.initWrite({NET : true});
			serializer.serializeObject(outObj, format);
			
			//get the written data to transfer to reader
			var data = serializer.getString();
			
			//read data
			var inObj = {
				public : {},
				private : {}
			};
			serializer = GameEngineLib.GameSerializers.createGameBinarySerializer();
			serializer.initRead({NET : true}, data);
			serializer.serializeObject(inObj, format);
		}
		//compare values in in/out Obj
		testResults();
		
		
		return passedTest;
	}
);