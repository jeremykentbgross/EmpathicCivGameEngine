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

ECGame.EngineLib.UnitTestFramework = function UnitTestFramework()
{
	this._myTests = [];
};
ECGame.EngineLib.UnitTestFramework.prototype.constructor = ECGame.EngineLib.UnitTestFramework;
ECGame.EngineLib.UnitTestFramework.create = function create()
{
	return new ECGame.EngineLib.UnitTestFramework();
};



ECGame.EngineLib.UnitTestFramework.prototype.runTests = function runTests()
{
	var aTest,
		i;
	
	console.log('\n************************');
	console.log("***Running Unit Tests***");
	
	for(i = 0; i < this._myTests.length; ++i)
	{
		aTest = this._myTests[i];
		console.log("\nRunning Test: " + aTest.testName);
		try
		{
			if(!aTest())
			{
				console.error("Failed Test: " + aTest.testName);
			}
			else
			{
				console.log("Passed Test: " + aTest.testName);
			}
		}
		catch(error)
		{
			console.log(error.stack);
			console.log("Failed Test: " + aTest.testName + " with exception " + error + '\n');
		}
	}
	
	console.log("\n***Running Unit Tests***");
	console.log('************************\n\n');
};



ECGame.EngineLib.UnitTestFramework.prototype.registerTest = function registerTest(inTestName, inTest)
{
	inTest.testName = inTestName;
	this._myTests[this._myTests.length] = inTest;
	console.log("Registered Test: " + inTest.testName);
};



