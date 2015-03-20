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
	"BinarySerializer",
	function()
	{
		var aPassedTests
			,aNet
			,aReadObject
			,aWriteObject
			,anObjectFormat
			,aTestResultsFunction
			,aSerializer
			,aSerializeData
			,i
			;
		
		aPassedTests = true;
		
		anObjectFormat = [
			{
				name : 'aBool1',
				type : 'bool',
				net : false
			},
			{
				name : 'aBool2',
				type : 'bool',
				net : false
			},
			{
				name : 'X',
				type : 'int',
				min : 0,
				max : 65535,
				net : true
			},
			{
				name : 'Y',
				type : 'float',
				min : 0,
				max : 65535,
				precision : 3,
				net : false
			},
			{
				name : 'aString',
				type : 'string',
				net : false
			}
		];
		
		aWriteObject = {
			aBool1 : true,
			aBool2 : false,
			aString : "Jeremy's Games are so freaking awesome, and his tech is top notch!",
			X : 375,
			Y : 41512.123
		};
		
		aTestResultsFunction = function aTestResultsFunction()
		{
			var anEntry;
			for(i = 0; i < anObjectFormat.length; ++i)
			{
				anEntry = anObjectFormat[i];
				if(aNet && !anEntry.net)
				{
					if(aWriteObject[anEntry.name] === aReadObject[anEntry.name])
					{
						console.error(
							anEntry.scope + '.' + anEntry.name + " miss match: " +
							aWriteObject[anEntry.name] + ' === ' + aReadObject[anEntry.name]);
						aPassedTests = false;
					}
				}
				else
				{
					if(aWriteObject[anEntry.name] !== aReadObject[anEntry.name])
					{
						console.error(
							anEntry.scope + '.' + anEntry.name + " miss match: " +
							aWriteObject[anEntry.name] + ' !== ' + aReadObject[anEntry.name]);
						aPassedTests = false;
					}
				}
			}
		};
		
		///////////////////////////////////////////////
		///////////////////////////////////////////////
		//Text
		
		///////////////////////////////////////////////
		//Not net
		aNet = false;
		
		//write data
		aSerializer = ECGame.EngineLib.BinarySerializer.create();
		aSerializer.init({});
		aSerializer.serializeObject(aWriteObject, anObjectFormat);
		
		//get the written data to transfer to reader
		aSerializeData = aSerializer.getString();
		
		//read data
		aReadObject = {};
		aSerializer = ECGame.EngineLib.BinarySerializer.create();
		aSerializer.init({}, aSerializeData);
		aSerializer.serializeObject(aReadObject, anObjectFormat);
		
		//compare values in in/out Obj
		aTestResultsFunction();
		//Not net
		///////////////////////////////////////////////
		
		///////////////////////////////////////////////
		//net
		aNet = true;
	
		//write data
		aSerializer = ECGame.EngineLib.BinarySerializer.create();
		aSerializer.init({NET_MODE : true});
		aSerializer.serializeObject(aWriteObject, anObjectFormat);
		
		//get the written data to transfer to reader
		aSerializeData = aSerializer.getString();
		
		//read data
		aReadObject = {};
		aSerializer = ECGame.EngineLib.BinarySerializer.create();
		aSerializer.init({NET_MODE : true}, aSerializeData);
		aSerializer.serializeObject(aReadObject, anObjectFormat);
		
		//compare values in in/out Obj
		aTestResultsFunction();
		//net
		///////////////////////////////////////////////
		
		//Text
		///////////////////////////////////////////////
		///////////////////////////////////////////////
		
		
		///////////////////////////////////////////////
		///////////////////////////////////////////////
		//Binary
		
		///////////////////////////////////////////////
		//Not net
		aNet = false;
		
		//write data
		aSerializer = ECGame.EngineLib.BinarySerializer.create();
		aSerializer.init({BINARY_MODE : true});
		aSerializer.serializeObject(aWriteObject, anObjectFormat);
		
		//get the written data to transfer to reader
		aSerializeData = aSerializer.getTypedArray();
		
		//read data
		aReadObject = {};
		aSerializer = ECGame.EngineLib.BinarySerializer.create();
		aSerializer.init({BINARY_MODE : true}, aSerializeData);
		aSerializer.serializeObject(aReadObject, anObjectFormat);
		
		//compare values in in/out Obj
		aTestResultsFunction();
		//Not net
		///////////////////////////////////////////////
		
		
		///////////////////////////////////////////////
		//net
		aNet = true;
	
		//write data
		aSerializer = ECGame.EngineLib.BinarySerializer.create();
		aSerializer.init({BINARY_MODE : true, NET_MODE : true});
		aSerializer.serializeObject(aWriteObject, anObjectFormat);
		
		//get the written data to transfer to reader
		aSerializeData = aSerializer.getTypedArray();
		
		//read data
		aReadObject = {};
		aSerializer = ECGame.EngineLib.BinarySerializer.create();
		aSerializer.init({BINARY_MODE : true, NET_MODE : true}, aSerializeData);
		aSerializer.serializeObject(aReadObject, anObjectFormat);
		
		//compare values in in/out Obj
		aTestResultsFunction();
		//net
		///////////////////////////////////////////////
		
		//Binary
		///////////////////////////////////////////////
		///////////////////////////////////////////////
		
		
		return aPassedTests;
	}
);