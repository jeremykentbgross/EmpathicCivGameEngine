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
	"BitPacker",
	function()
	{
		var aPackerText
			,aPackerBinary
			,aValues = []
			,aBits = []
			,aValue
			,aString
			,anArray
			,aPassedTest = true
			,aNumValuesToProcess = 10000
			,i
			;
		
		for(i = 0; i < aNumValuesToProcess; ++i)
		{
			aBits[i] = Math.floor(Math.random() * 32);
			aValues[i] = Math.floor(Math.random() * Math.pow(2, aBits[i]));
		}
		aBits[10] = 32;
		aValues[10] = 0;
		aBits[11] = 32;
		aValues[11] = 0;
		
		aPackerText = ECGame.EngineLib.BitPacker.create(true);
		aPackerBinary = ECGame.EngineLib.BitPacker.create(false);
		for(i = 0; i < aNumValuesToProcess; ++i)
		{
			aPackerText.pack(aValues[i], aBits[i]);
			aPackerBinary.pack(aValues[i], aBits[i]);
		}
		aString = aPackerText.getString();
		anArray = aPackerBinary.getTypedArray();
		//console.log(aString);
		//console.log(anArray);
		
		aPackerText = ECGame.EngineLib.BitPacker.create(true);
		aPackerBinary = ECGame.EngineLib.BitPacker.create(false);
		aPackerText.setString(aString);
		aPackerBinary.setTypedArray(anArray);
		for(i = 0; i < aNumValuesToProcess; ++i)
		{
			aValue = aPackerText.unpack(aBits[i]);
			if(aValue !== aValues[i])
			{
				ECGame.log.error("Text Parsing: Loop " + i + ' ' + aValue + '!==' + aValues[i] + " in " + aBits[i] + " bits");
				aPassedTest = false;
			}
			
			aValue = aPackerBinary.unpack(aBits[i]);
			if(aValue !== aValues[i])
			{
				ECGame.log.error("Binary Parsing: Loop " + i + ' ' + aValue + '!==' + aValues[i] + " in " + aBits[i] + " bits");
				aPassedTest = false;
			}
		}
		
		return aPassedTest;
	}
);