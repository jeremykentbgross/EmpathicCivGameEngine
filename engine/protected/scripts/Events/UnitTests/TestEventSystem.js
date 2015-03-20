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
ECGame.unitTests.registerTest(
	"EventSystem",
	function()
	{
		var aPassedTest
			,anEventSystem
			,aListener1
			,aListener2
			;
		
		aPassedTest = true;
		anEventSystem = ECGame.EngineLib.EventSystem.create();
		
		aListener1 =
		{
			onTestEvent :
				function onTestEvent(inEvent)
				{
					this.recieved = inEvent.data;
					inEvent.data = inEvent.data - 1;
				}
		};
		
		aListener2 =
		{
			onTestEvent :
				function onTestEvent(inEvent)
				{
					this.recieved = inEvent.data;
					inEvent.data = inEvent.data - 1;
				}
		};
		
		anEventSystem.registerListener('TestEvent', aListener1);
		anEventSystem.registerListener('TestEvent', aListener2);
		
		anEventSystem.onEvent(
			{
				getName : function(){return 'TestEvent';},
				getCallbackName : function(){return 'onTestEvent';},
				data : 2
			}
		);
		
		if(aListener1.recieved !== 2)
		{
			console.error("First event not recieved by first listener!");
			aPassedTest = false;
		}
		if(aListener2.recieved !== 1)
		{
			console.error("First event not recieved by second listener!");
			aPassedTest = false;
		}
		
		anEventSystem.deregisterListener('TestEvent', aListener2);
		anEventSystem.onEvent(
			{
				getName : function(){return 'TestEvent';},
				getCallbackName : function(){return 'onTestEvent';},
				data : 0
			}
		);
		
		if(aListener1.recieved !== 0)
		{
			console.error("Second event not recieved by first listener!");
			aPassedTest = false;
		}
		if(aListener2.recieved === -1)
		{
			console.error("Second event recieved by second listener!");
			aPassedTest = false;
		}
		
		return aPassedTest;
	}
);