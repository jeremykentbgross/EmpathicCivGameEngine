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
	"GameObjectClassSystem",
	function()
	{
		var passedTest = true;
		var local = {};
		local.actionIndex = 0;
	
		
		local.classFactory = GameEngineLib.createGameObjectClassFactory();
		
		local.classFactory.create(
			"GameObject",
			null,
			GameEngineLib.createGameObject
		);
		
		local.classFactory.create(
			"BaseClass",
			null,
			function(instance, private)
			{
				instance.destroy = function()
				{
					local.BaseClassDestroyed = local.actionIndex++;
				}
				instance.serialize = function()
				{
					local.BaseClassSerialized = local.actionIndex++;
				}
				instance.bs = function(){}
				instance.bs.chaindown = true;
				
				instance.bs2 = function(){}
				instance.bs2.chainup = true;
			}
		);
		
		local.classFactory.create(
			"ChildClass",
			"BaseClass",
			function(instance, private)
			{
				instance.destroy = function()
				{
					local.ChildClassDestroyed = local.actionIndex++;
				}
				instance.serialize = function()
				{
					local.ChildClassSerialized = local.actionIndex++;
				}
				instance.bs = function(){}
				instance.bs2 = function(){}
			}
		);
		
		local.childInstance = local.classFactory.findByName("ChildClass").create("child1");
		local.childInstance.deref().serialize();
		local.childInstance.deref().destroy();
		
		if(local.BaseClassSerialized !== 0 || local.ChildClassSerialized !== 1)
		{
			GameEngineLib.logger.error("Failed to serialize the chain in order!");
			passedTest = false;
		}
		
		if(local.ChildClassDestroyed !== 2 || local.BaseClassDestroyed !== 3)
		{
			GameEngineLib.logger.error("Failed to destroy the chain in order!");
			passedTest = false;
		}
				
		
		return passedTest;
	}
);