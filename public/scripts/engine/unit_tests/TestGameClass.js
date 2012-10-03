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
	"GameClass",
	function()
	{
		var ClassNamespace = {}
		
		ClassNamespace.TestClass1 = GameEngineLib.Class({
			Constructor : function TestClass1(){},
			Parents : null,
			flags : {},
			Definition :
			{
				Func1 : function Func1()
				{
					this.Func1Called = true;
				}
			}
		});
		
		ClassNamespace.TestClass2 = GameEngineLib.Class({
			Constructor : function TestClass2()
			{
				this.TestClass1();
			},
			Parents : [ClassNamespace.TestClass1],
			flags : {},
			Definition :
			{
				Func2 : function Func2()
				{
					this.Func2Called = true;
				},
				StaticThing : "HaHa!"
			}
		});
		
		
		
		var testClass1 = new ClassNamespace.TestClass1();
		testClass1.Func1();
		GameAssert(testClass1.Func1Called, "Function failed from new'ed class instance!");
		
		
		
		var testClass2 = ClassNamespace.TestClass2.create();
		GameAssert(ClassNamespace.TestClass2.StaticThing === "HaHa!", "Inherited functions failed from created class instance!");
		
		testClass2.Func1();
		testClass2.Func2();
		GameAssert(testClass2.Func1Called && testClass2.Func2Called, "Inherited functions failed from created class instance!");

		ClassNamespace.TestObjectClass1 = GameEngineLib.Class({
			Constructor : function TestObjectClass1()
			{
				this.GameObject();
				this.counter = 0;
			},
			Parents : [GameEngineLib.GameObject],
			flags : {},
			ChainUp : ["chainUp"],
			ChainDown : ["chainDown"],
			Definition :
			{
				destroy : function destroy(){},
				serialize : function serialize(){},
				chainUp : function chainUp()
				{
					this.up1 = ++this.counter;
				},
				chainDown : function chainDown()
				{
					this.down1 = ++this.counter;
				}
			}
		});
		ClassNamespace.TestObjectClass1.registerClass();
		
		var foundClass = GameEngineLib.Class.getInstanceRegistry().findByName("TestObjectClass1");
		var testObjectClass1 = foundClass.create();
		GameAssert(testObjectClass1.isA(ClassNamespace.TestObjectClass1), "isA() Failed on found created class!");
		
		var found = foundClass.getInstanceRegistry().findByName(testObjectClass1.getName());
		GameAssert(testObjectClass1 === found, "Failed to find class instance!");
		
		var instanceName = testObjectClass1.getName();
		testObjectClass1.destroy();
		found = foundClass.getInstanceRegistry().findByName(instanceName);
		GameAssert(!found, "Found destroyed object in registry!");
		
		
		ClassNamespace.TestObjectClass2 = GameEngineLib.Class({
			Constructor : function TestObjectClass2()
			{
				this.TestObjectClass1();
			},
			Parents : [ClassNamespace.TestObjectClass1],
			flags : {},
			Definition :
			{
				destroy : function destroy(){},
				serialize : function serialize(){},
				chainUp : function chainUp()
				{
					this.up2 = ++this.counter;
				},
				chainDown : function chainDown()
				{
					this.down2 = ++this.counter;
				}
			}
		});
		
		var chainTestObject = ClassNamespace.TestObjectClass2.create();
		chainTestObject.chainUp();
		chainTestObject.chainDown();
		
		GameAssert(
			chainTestObject.up2 === 1 &&
			chainTestObject.up1 === 2 &&
			chainTestObject.down1 === 3 &&
			chainTestObject.down2 === 4,
			"Chain up and down calls are not working!"
		);
		
		return true;
	}
);
