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
	"DocJS",
	function()
	{
		var source,
			theTestCode;
			
		theTestCode = function theTestCode()
		{
			/**!
				@namespace: TestNamespace
				/description: Testing basic namespaces
			*/
			var TestNamespace = {};
			
			//! @todo: a single line file scope todo comment
			
			/**!
				@namespace: TestChildNamespace
				/parentNamespace: TestNamespace
				/description: Testing child namespaces
			*/
			TestNamespace.TestChildNamespace = {};
			
			/**!
				@member: aMember
				/description: testing namespace member
				/parentNamespace: TestNamespace.TestChildNamespace
			*/
			TestNamespace.TestChildNamespace.aMember = 0;
			
			/**! @method: someMethod
				/description: Testing namespaced scoped methods
				/parentNamespace: TestNamespace.TestChildNamespace
			*/
			TestNamespace.TestChildNamespace.someMethod = function someMethod(){return;};
			
			/**!
				@class: TestClass
				/parentNamespace: TestNamespace.TestChildNamespace
				/description: Testing namespaced scoped class
			*/
			TestNamespace.TestChildNamespace.TestClass = ECGame.EngineLib.Class.create({
				Constructor : function TestClass(){return;},
				Parents : [],
				flags : {},
				ChainUp : [],
				ChainDown : [],
				Definition :
				{
					
				}
			});
			
			/**!
				@beginclass: TestChildClass
				/parentNamespace: TestNamespace.TestChildNamespace
				/description: Testing child class in namespace scope
				on multiple lines!!
				/parents: TestNamespace.TestChildNamespace.TestClass
				/listensTo: SomeEvent
			*/
			TestNamespace.TestChildNamespace.TestChildClass = ECGame.EngineLib.Class.create({
				Constructor : function TestChildClass()
				{
					/**!
						@member: testMemberVariable
						/description: Testing class member
						/types: [number]
						/default: 7
					*/
					this.testMemberVariable = 7;
				},
				Parents : [TestNamespace.TestChildNamespace.TestClass],
				flags : {},
				ChainUp : [],
				ChainDown : [],
				Definition :
				{
					/**!
						@beginmethod: testMemberMethod
						/description: Testing class method
						/param1: inParam1 [string] do da do da
						/param2: outParam2 [number] batman smells
						/returns: [string, number] Robin laid an egg
						/fires: SomeEvent
					*/
					testMemberMethod : function testMemberMethod(inParam1, outParam2)
					{
						/**! @todo: We need to do something else here:
							/priority: 10
							/example: something something
						*/
						return '';
					}/**! @endmethod: testMemberMethod */
				}
			});/**! @endclass: TestChildClass */
		};
		
		source = '\t\t' + theTestCode.toString();
		
		var docJS = ECGame.WebServerTools.DocJS.create();
		docJS.appendSource(source, "TEMPHACK.js");
//		docJS.loadDirectory('../engine');
//		docJS.loadDirectory('../engine_test_game');/**! @todo: put real game name here! */
		docJS.run();
		
//		return false;
		
		return true;
	}
);
