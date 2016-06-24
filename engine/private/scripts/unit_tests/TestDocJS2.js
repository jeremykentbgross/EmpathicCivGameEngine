/*
	© Copyright 2011-2016 Jeremy Gross
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

/*!!
	* document: file
	* description: Basic (mostly JSON) tests/examples for the documentation parser. /
		The parser itself is it's own advanced test cases.
*/

ECGame.unitTests.registerTest(
	"DocJS",
	function()
	{
		var aSourceCodeString
			,aTestCodeFunction
			,aDocJS
			;
			
		aTestCodeFunction = function aTestCodeFunction()
		{
			/*!{
				"document": "namespace",
				"name": "TestNamespace",
				"description": "Testing basic namespaces"
			}*/
			var TestNamespace = {};
			
			//!{ "document": "TODO", "description": "Testing a single line file scope todo comment", "priority": 10, "category":"Test", "namespace": "TestNamespace"}
			
			/*!{
				"document": "namespace",
				"name": "TestChildNamespace",
				"namespace": "TestNamespace",
				"description": "Testing child namespaces"
			}*/
			TestNamespace.TestChildNamespace = {};
			
			/*!{
				"document": "member",
				"name": "aMember",
				"description": "testing namespace member",
				"namespace": "TestNamespace.TestChildNamespace",
				"types": ["number"],
				"default": 0
			}*/
			TestNamespace.TestChildNamespace.aMember = 0;

			/*!{
				"document": "member",
				"name": "anotherMember",
				"description": "testing namespace member",
				"namespace": "TestNamespace.TestChildNamespace",
				"types": ["number"],
				"default": 0
			}*/
			TestNamespace.TestChildNamespace.anotherMember = 0;
			
			/*!{
				"document": "method",
				"name": "someMethod",
				"description": "Testing namespaced scoped methods",
				"namespace": "TestNamespace.TestChildNamespace",
				"parameters": [
					{"name": "inParam1", "types": ["TestNamespace.TestClass", "string"], "description": "The first parameter description"},
					{"name": "inParam2", "types": ["number"], "description": "The second parameter description"}],
				"returns": "string"
			}*/
			//!{ "document": "TODO", "description": "Testing a method todo", "priority": 10, "category":"Test", "method": "TestNamespace.TestChildNamespace.someMethod"}
			TestNamespace.TestChildNamespace.someMethod = function someMethod(){return;};
			
			/*!{
				"document": "class",
				"name": "TestClass",
				"namespace": "TestNamespace",
				"description": "Testing namespaced scoped class"
			}*/
			TestNamespace.TestClass = ECGame.EngineLib.Class.create({
				Constructor : function TestClass()
				{
					/*!{
						"document": "member",
						"name": "_myBaseClassTestMember",
						"description": "testing baseclass member",
						"class": "TestNamespace.TestClass",
						"types": ["number"],
						"default": 0
					}*/ //.TestChildNamespace
					this._myBaseClassTestMember = 0;

					/*!!
						@ member: testMemberOverride
						* description: testing a member variable override
						* class: TestNamespace.TestClass
						* types: ["string"]
						* default: Some things in life are bad. They can really make you mad. Other things just make you swear and curse.
					*/
					this.testMemberOverride = "Some things in life are bad. They can really make you mad. Other things just make you swear and curse.";
				},
				Parents : [],
				flags : {},
				ChainUp : [],
				ChainDown : [],
				Definition :
				{
					/*!{
						"document": "method",
						"class": "TestNamespace.TestClass",
						"name": "_testBaseMethod",
						"description": "Testing class method",
						"parameters": [
							{"name": "inParam1", "types": ["string"], "description": "blah"},
							{"name": "inParam2", "types": ["number"], "description": "blah"}],
						"returns": "string"
					}*/	//.TestChildNamespace
					_testBaseMethod : function _testBaseMethod()
					{
						return "This is a test!";
					}

					/*!!
						@ beginMethod: testOverrideMethod
						* class: TestNamespace.TestClass
						* description: testing documentation on method overrides
						* parameters:[]
						* returns: null
					*/
					,testOverrideMethod : function testOverrideMethod()
					{
						return null;
					}
					//!!endMethod:	testOverrideMethod
				}
			});
			
			/*!{
				"document": "beginClass",
				"name": "TestChildClass",
				"namespace": "TestNamespace.TestChildNamespace",
				"description": "Testing child class in namespace scope",
				"parents": ["TestNamespace.TestClass"]
			}*/	//.TestChildNamespace
			TestNamespace.TestChildNamespace.TestChildClass = ECGame.EngineLib.Class.create({
				Constructor : function TestChildClass()
				{
					/*!{
						"document": "member",
						"name": "testMemberVariable",
						"description": "Testing class member",
						"types": ["number"],
						"default": 7
					}*/
					this.testMemberVariable = 7;
					/*!!
						@ member: testMemberOverride
						* description: testing a member variable override
						* types: ["string"]
						* default: If life seems jolly rotten, there's something you've forgotten
					*/
					this.testMemberOverride = "If life seems jolly rotten, there's something you've forgotten";
				},
				Parents : [TestNamespace.TestClass],
				flags : {},
				ChainUp : [],
				ChainDown : [],
				Definition :
				{
					//!!TODO Test 10: Testing a Fast Class level todo
					//!{ "document": "TODO", "description": "Testing a Class level todo", "priority": 10, "category":"Test"}
					/*!{
						"document": "beginMethod",
						"name": "testMemberMethod",
						"description": "Testing class method",
						"parameters": [
							{"name": "inParam1", "types": ["TestNamespace.TestClass", "string"], "description": "The first parameter description"},
							{"name": "inParam2", "types": ["number"], "description": "The second parameter description"}
						],
						"returns": "string"
					}*/
					testMemberMethod : function testMemberMethod(inParam1, outParam2)
					{
						//!{ "document": "TODO", "description": "Testing a Method level todo", "priority": 10, "category":"Test"}
						return inParam1 + outParam2;
					}
					/*!{ "document": "endMethod", "name": "testMemberMethod" }*/

					/*!!
						@ beginMethod: testOverrideMethod
						* description: testing documentation on method overrides
						* parameters:[]
						* returns: null
					*/
					,testOverrideMethod : function testOverrideMethod()
					{
						return null;
					}
					//!!endMethod: testOverrideMethod
				}
			});
			/*!{ "document": "endClass","name": "TestChildClass" }*/
		};
		
		aSourceCodeString = '\t\t' + aTestCodeFunction.toString();
		
		aDocJS = ECGame.WebServerTools.DocJS.create();
		aDocJS.appendSource(aSourceCodeString, "TEMPHACK.js");
		//!!TODO Test 8: load folder for this file and Doc parser instead of the append source above!
//		aDocJS.loadDirectory('../engine_test_game');
		aDocJS.run();
		
//		return false;
		
		return true;
	}
);
