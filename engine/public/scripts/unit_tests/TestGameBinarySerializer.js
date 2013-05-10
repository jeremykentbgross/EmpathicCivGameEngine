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
	'GameBinarySerializer',
	function()
	{
		var passedTest = true;
		var i;
		var net;
		var inObj;
		
		var format = [
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
		
		var outObj = {
			aBool1 : true,
			aBool2 : false,
			aString : "Jeremy's Games are so freaking awesome, and his tech is top notch!",
			X : 375,
			Y : 41512.123
		};
		
		var testResults = function()
		{
			for(i = 0; i < format.length; ++i)
			{
				var entry = format[i];
				if(net && !entry.net)
				{
					if(outObj[entry.name] === inObj[entry.name])
					{
						ECGame.log.error(
							entry.scope + '.' + entry.name + " miss match: " +
							outObj[entry.name] + ' === ' + inObj[entry.name]);
						passedTest = false;
					}
				}
				else
				{
					if(outObj[entry.name] !== inObj[entry.name])
					{
						ECGame.log.error(
							entry.scope + '.' + entry.name + " miss match: " +
							outObj[entry.name] + ' !== ' + inObj[entry.name]);
						passedTest = false;
					}
				}
			}
		};
		
		
		
		///////////////////////////////////////////////
		//Not net
		net = false;
		
		//write data
		var serializer = ECGame.EngineLib.GameBinarySerializer.create();
		serializer.initWrite({});
		serializer.serializeObject(outObj, format);
		
		//get the written data to transfer to reader
		var data = serializer.getString();
		
		//read data
		inObj = {};
		serializer = ECGame.EngineLib.GameBinarySerializer.create();
		serializer.initRead({}, data);
		serializer.serializeObject(inObj, format);
		
		//compare values in in/out Obj
		testResults();
		///////////////////////////////////////////////
		
		
		///////////////////////////////////////////////
		//net
		net = true;
	
		//write data
		serializer = ECGame.EngineLib.GameBinarySerializer.create();
		serializer.initWrite({NET : true});
		serializer.serializeObject(outObj, format);
		
		//get the written data to transfer to reader
		data = serializer.getString();
		
		//read data
		inObj = {};
		serializer = ECGame.EngineLib.GameBinarySerializer.create();
		serializer.initRead({NET : true}, data);
		serializer.serializeObject(inObj, format);
		
		//compare values in in/out Obj
		testResults();
		///////////////////////////////////////////////
		
		return passedTest;
	}
);