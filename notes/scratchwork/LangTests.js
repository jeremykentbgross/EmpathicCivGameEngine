UnitTests.registerTest(
	"LangTests",
	function()
	{
		var ParentObject = function()
		{
			var outObject = {}
			var private = {};
			
			private.incr = 0;
			
			outObject.update = function()
			{
				return ++private.incr;
			}
			return outObject;
		};
		
		
		var ChildObject = function()
		{
			//this.prototype = new ParentObject;
			this.QWERTY = 11;
		};
		ChildObject.prototype = ParentObject();
		
		var instance1 = new ChildObject;
		var instance2 = new ChildObject;
		
		instance1.update();
		instance1.update();
		instance1.update();
		GameEngineLib.logger.info("First Instance Value " + instance1.update());
		GameEngineLib.logger.info("Second Instance Value " + instance2.update());
	}
);