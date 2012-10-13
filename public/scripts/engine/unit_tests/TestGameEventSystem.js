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
				getName : function(){return "TestEvent";},
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
				getName : function(){return "TestEvent";},
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