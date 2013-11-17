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
	"ArithmeticCompression",
	function()
	{
		var aPassedTest
			,aNumValues
			,aBits
			,aMaxSize
			,aModels
			,aValues
			,aFailedLoopsList
			,aLow
			,aHigh
			,aValue
			,aStartIndex
			,aTextEncoder
			,aBinaryEncoder
			,aString
			,anArray
			,aNumEncodedBytes
			,anEncodedSizeBytes
			,i
			,aBreakPointLocation//To help debug
			;
			
		aPassedTest = true;
		aNumValues = 10000;
		aBits = 16;
		aMaxSize = Math.pow(2, aBits);
		aModels = [];
		aValues = [];
		aFailedLoopsList = [];
		
		////////////////////////////////////////////////////////////////////////////
		//setup/////////////////////////////////////////////////////////////////////
		for(i = 0; i < aNumValues; ++i)
		{
			aLow = Math.floor(Math.random() * aMaxSize);
			aHigh = aLow + Math.floor(Math.random() * aMaxSize);// + 1;
			aValues[i] = aLow + Math.floor(Math.random() * (aHigh - aLow + 1));
			aModels[i] = ECGame.EngineLib.ArithmeticCompressionModels.EvenProbabilityIntegerRangeModel.create();
			aModels[i].setMinMax(aLow, aHigh);
		}
		
		//special cases:
		aStartIndex = 0;
		
		//We have zero in a max range causing one less
		aLow = 0;
		aHigh = aMaxSize - 1;
		aValues[aStartIndex] = aMaxSize / 2;
		aModels[aStartIndex].setMinMax(aLow, aHigh);
		++aStartIndex;
		//
		aLow = 0;
		aHigh = aMaxSize - 1;
		aValues[aStartIndex] = 0;
		aModels[aStartIndex].setMinMax(aLow, aHigh);
		++aStartIndex;
		
		//We have max in a max range causing one more
		aLow = 0;
		aHigh = aMaxSize - 1;
		aValues[aStartIndex] = aMaxSize / 2;
		aModels[aStartIndex].setMinMax(aLow, aHigh);
		++aStartIndex;
		//
		aLow = 0;
		aHigh = aMaxSize - 1;
		aValues[aStartIndex] = aHigh;
		aModels[aStartIndex].setMinMax(aLow, aHigh);
		++aStartIndex;
		//setup/////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////
		
		
		
		////////////////////////////////////////////////////////////////////////////
		//run///////////////////////////////////////////////////////////////////////
		aTextEncoder = ECGame.EngineLib.ArithmeticCompresser.create(true);
		aBinaryEncoder = ECGame.EngineLib.ArithmeticCompresser.create(false);
		for(i = 0; i < aNumValues; ++i)
		{
			aTextEncoder.encode(aValues[i], aModels[i]);
			aBinaryEncoder.encode(aValues[i], aModels[i]);
		}
		
		aString = aTextEncoder.getString();
		anArray = aBinaryEncoder.getTypedArray();
		aNumEncodedBytes = (aBits * aNumValues / 8);
		anEncodedSizeBytes = aString.length;
		console.log("Text encoded " + aNumEncodedBytes
			+ " bytes in only " + anEncodedSizeBytes
			+ " a savings of %" + (100 * (1 - anEncodedSizeBytes / aNumEncodedBytes))
		);
		anEncodedSizeBytes = anArray.length;
		console.log("Binary encoded " + aNumEncodedBytes
			+ " bytes in only " + anEncodedSizeBytes
			+ " a savings of %" + (100 * (1 - anEncodedSizeBytes / aNumEncodedBytes))
		);
		//console.log(aString);
		//console.log(anArray);
		
		aTextEncoder.init(true);// = ECGame.EngineLib.ArithmeticCompresser.create(true);
		aTextEncoder.setString(aString);
		aBinaryEncoder.init(false);// = ECGame.EngineLib.ArithmeticCompresser.create(false);
		aBinaryEncoder.setTypedArray(anArray);
		
		for(i = 0; i < aNumValues; ++i)
		{
			aValue = aTextEncoder.decode(aModels[i]);
			if(aValue !== aValues[i])
			{
				ECGame.log.error("Text Parsing: Loop " + i + ' ' + aValue + '!==' + aValues[i] + " with (" + aModels[i].myMin + ', ' + aModels[i].myMax + ')');
				aPassedTest = false;
				
				aFailedLoopsList.push(i);
			}
			
			aValue = aBinaryEncoder.decode(aModels[i]);
			if(aValue !== aValues[i])
			{
				ECGame.log.error("Binary Parsing: Loop " + i + ' ' + aValue + '!==' + aValues[i] + " with (" + aModels[i].myMin + ', ' + aModels[i].myMax + ')');
				aPassedTest = false;
				
				aFailedLoopsList.push(i);
			}
		}
		//run///////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////
		
		
		
		////////////////////////////////////////////////////////////////////////////
		//For debugging/////////////////////////////////////////////////////////////
		//run again if it failed with the option to break on the bad ones.
		if(!aPassedTest)
		{
			for(i = 0; i < aNumValues; ++i)
			{
				console.log(i);
				console.log("low:\t" + aModels[i].myMin);
				console.log("value:\t" + aValues[i]);
				console.log("high:\t" + aModels[i].myMax);
				console.log("range:\t" + (aModels[i].myMax-aModels[i].myMin));
				console.log("scaled:\t" + ((aValues[i]-aModels[i].myMin)/(aModels[i].myMax-aModels[i].myMin)));
			}
			
			aTextEncoder.init(true);// = ECGame.EngineLib.ArithmeticCompresser.create(true);
			aBinaryEncoder.init(false);// = ECGame.EngineLib.ArithmeticCompresser.create(false);
			
			for(i = 0; i < aNumValues; ++i)
			{
				if(aFailedLoopsList[0] === i)
				{
					aBreakPointLocation = 1;
				}
				aTextEncoder.encode(aValues[i], aModels[i]);
				aBinaryEncoder.encode(aValues[i], aModels[i]);
			}
			
			aString = aTextEncoder.getString();
			anArray = aBinaryEncoder.getTypedArray();
			
			aTextEncoder.init(true);// = ECGame.EngineLib.ArithmeticCompresser.create(true);
			aTextEncoder.setString(aString);
			aBinaryEncoder.init(false);// = ECGame.EngineLib.ArithmeticCompresser.create(false);
			aBinaryEncoder.setTypedArray(anArray);
			
			for(i = 0; i < aNumValues; ++i)
			{
				if(aFailedLoopsList[0] === i)
				{
					aFailedLoopsList = aFailedLoopsList.slice(1, aFailedLoopsList.length);
				}
				aValue = aTextEncoder.decode(aModels[i]);
				aValue = aBinaryEncoder.decode(aModels[i]);
			}
		}
		//For debugging/////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////
		
		
		return aPassedTest;
	}
);