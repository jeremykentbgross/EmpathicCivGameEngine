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
	"GameBitPacker",
	function()
	{
		var packer;
		var values = [];
		var bits = [];
		var value;
		var string;
		var passedTest = true;
		var numValues = 10000;
		
		for(var i = 0; i < numValues; ++i)
		{
			bits[i] = Math.floor(Math.random() * 32);
			values[i] = Math.floor(Math.random() * Math.pow(2, bits[i]));
		}
		bits[10] = 32;
		values[10] = 0;
		bits[11] = 32;
		values[11] = 0;
		
		packer = GameEngineLib.createGameBitPacker();
		for(var i = 0; i < numValues; ++i)
		{
			packer.pack(values[i], bits[i]);
		}
		string = packer.getString();
		//console.log(string);
		
		packer = GameEngineLib.createGameBitPacker();
		packer.setString(string);
		for(var i = 0; i < numValues; ++i)
		{
			value = packer.unpack(bits[i]);
			if(value !== values[i])
			{
				GameEngineLib.logger.error("Loop " + i + " " + value + "!==" + values[i] + " with " + bits[i]);
				passedTest = false;
			}
		}
		
		return passedTest;
	}
);