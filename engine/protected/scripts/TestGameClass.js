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
	"GameClass",
	function()
	{
		var aClassNamespace
			,aTestClass1
			,aTestClass2
			,aFoundClass
			,aTestObjectClass1
			,aFoundInstance
			,anInstanceName
			,aChainTestObject
			;
		
		aClassNamespace = {};

		aClassNamespace.TestClass1 = ECGame.EngineLib.Class.create({
			Constructor : function TestClass1(){return;},
			Parents : null,
			flags : {},
			Definition :
			{
				testFunction1 : function testFunction1()
				{
					this.Func1Called = true;
				}
			}
		});
		
		aClassNamespace.TestClass2 = ECGame.EngineLib.Class.create({
			Constructor : function TestClass2()
			{
				this.TestClass1();
			},
			Parents : [aClassNamespace.TestClass1],
			flags : {},
			Definition :
			{
				testFunction2 : function testFunction2()
				{
					this.Func2Called = true;
				},
				StaticThing : 'HaHa!'
			}
		});
		
		
		
		aTestClass1 = new aClassNamespace.TestClass1();
		aTestClass1.testFunction1();
		console.assert(aTestClass1.Func1Called, "Function failed from new'ed class instance!");
		
		
		
		aTestClass2 = aClassNamespace.TestClass2.create();
		console.assert(aClassNamespace.TestClass2.StaticThing === 'HaHa!', "Inherited functions failed from created class instance!");
		
		aTestClass2.testFunction1();
		aTestClass2.testFunction2();
		console.assert(aTestClass2.Func1Called && aTestClass2.Func2Called, "Inherited functions failed from created class instance!");

		aClassNamespace.TestObjectClass1 = ECGame.EngineLib.Class.create({
			Constructor : function TestObjectClass1()
			{
				this.GameObject();
				this.counter = 0;
			},
			Parents : [ECGame.EngineLib.GameObject],
			flags : { bastardClass: true },
			ChainUp : ['chainUp'],
			ChainDown : ['chainDown'],
			Definition :
			{
				//set<classname>NetDirty
				clearNetDirty : function clearNetDirty(){return;},
				postSerialize : function postSerialize(){return;},
				cleanup : function cleanup(){return;},
				serialize : function serialize(){return;},
				copyFrom : function copyFrom(/*inOther*/){return;},
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
		aClassNamespace.TestObjectClass1.registerClass();
		
		aFoundClass = ECGame.EngineLib.Class.findInstanceByName('TestObjectClass1');
		aTestObjectClass1 = aFoundClass.create();
		console.assert(aTestObjectClass1.isA(aClassNamespace.TestObjectClass1), "isA() Failed on found created class!");
		
		aFoundInstance = aFoundClass.findInstanceByName(aTestObjectClass1.getName());
		console.assert(aTestObjectClass1 === aFoundInstance, "Failed to find class instance!");
		
		anInstanceName = aTestObjectClass1.getName();
		aTestObjectClass1.destroy();
		aFoundInstance = aFoundClass.findInstanceByName(anInstanceName);
		console.assert(!aFoundInstance, "Found destroyed object in registry!");
		
		
		aClassNamespace.TestObjectClass2 = ECGame.EngineLib.Class.create({
			Constructor : function TestObjectClass2()
			{
				this.TestObjectClass1();
			},
			Parents : [aClassNamespace.TestObjectClass1],
			flags : {},
			Definition :
			{
				//set<classname>NetDirty
				clearNetDirty : function clearNetDirty(){return;},
				postSerialize : function postSerialize(){return;},
				cleanup : function cleanup(){return;},
				serialize : function serialize(){return;},
				copyFrom : function copyFrom(/*inOther*/){return;},
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
		
		aChainTestObject = aClassNamespace.TestObjectClass2.create();
		aChainTestObject.chainUp();
		aChainTestObject.chainDown();
		
		console.assert(
			aChainTestObject.up2 === 1 &&
			aChainTestObject.up1 === 2 &&
			aChainTestObject.down1 === 3 &&
			aChainTestObject.down2 === 4,
			"Chain up and down calls are not working!"
		);

		aChainTestObject.destroy();
		
		return true;
	}
);
