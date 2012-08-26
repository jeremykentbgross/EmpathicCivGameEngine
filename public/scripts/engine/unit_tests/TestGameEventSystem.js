GameUnitTests.registerTest(
	"GameEventSystem",
	function()
	{
		var passedTest = true;
		
		var eventSystem;
		var listener1;
		var listener2;
		
		eventSystem = GameEngineLib.createEventSystem();
		
		listener1 =
		{
			onTestEvent :
				function(inEvent)
				{
					this.recieved = inEvent.data;
					inEvent.data = inEvent.data - 1;
				}
		};
		
		listener2 =
		{
			onTestEvent :
				function(inEvent)
				{
					this.recieved = inEvent.data;
					inEvent.data = inEvent.data - 1;
				}
		};
		
		eventSystem.registerListener("TestEvent", listener1);
		eventSystem.registerListener("TestEvent", listener2);
		
		eventSystem.onEvent(
			{
				getName : function(){return "TestEvent"},
				data : 2
			}
		);
		
		if(listener1.recieved !== 2)
		{
			GameEngineLib.logger.error("First event not recieved by first listener!");
			passedTest = false;
		}
		if(listener2.recieved !== 1)
		{
			GameEngineLib.logger.error("First event not recieved by second listener!");
			passedTest = false;
		}
		
		eventSystem.deregisterListener("TestEvent", listener2);
		eventSystem.onEvent(
			{
				getName : function(){return "TestEvent"},
				data : 0
			}
		);
		
		if(listener1.recieved !== 0)
		{
			GameEngineLib.logger.error("Second event not recieved by first listener!");
			passedTest = false;
		}
		if(listener2.recieved === -1)
		{
			GameEngineLib.logger.error("Second event recieved by second listener!");
			passedTest = false;
		}
		
		return passedTest;
	}
);