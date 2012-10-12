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

GameEngineLib.GameArithmeticCompressionModels = GameEngineLib.GameArithmeticCompressionModels || {};

GameEngineLib.GameArithmeticCompressionModels.createEvenProbabilityIntegerRangeModel = function()
{
	var lowOffset = 1 / 8192;//~0.0001;
	var highOffset = 1 - lowOffset;//~0.9999;
	return {
		min : 0,
		max : 0,
		setMinMax : function(inMin, inMax)
		{
			if(inMax - inMin + 1 > 65536)//TODO ifdebug
			{
				GameEngineLib.logger.error("Range is too large!");//TODO throw error from log, and move the log!
				return;
			}
			this.min = inMin;
			this.max = inMax;
			return this;
		},
		getProbabilityRange :
			function(inValue)
			{
				/*var range = (this.max - this.min + 1);
				var valueRanged = ((inValue + 0.5 - this.min) / range);
				var valueHigh = ((inValue + 1 - this.min) / range);
				return {
					low : valueRanged,
					high : valueHigh
				};*/
				
				var range = (this.max - this.min + 1);
				var valueLow = ((inValue + lowOffset - this.min) / range);
				var valueHigh = ((inValue + highOffset - this.min) / range);
				return {
					low : valueLow,
					high : valueHigh
				};
			},
		getValueFromProbability :
			function(inProbability)
			{
				/*var range = (this.max - this.min + 1);
				var value = Math.floor(inProbability * range + this.min);
				var valueRanged = ((value + 0.5 - this.min) / range);
				var valueHigh = ((value + 1 - this.min) / range);
				return {
					value : value,
					low : valueRanged,
					high : valueHigh
				};*/
				
				var range = (this.max - this.min + 1);
				var value = Math.floor(inProbability * range + this.min);
				var valueLow = ((value + lowOffset - this.min) / range);
				var valueHigh = ((value + highOffset - this.min) / range);
				return {
					value : value,
					low : valueLow,
					high : valueHigh
				};
			}
	};
}

//TODO probabilistic (spell?) model


//see:
// http://number-none.com/product/
//	http://marknelson.us/1991/02/01/arithmetic-coding-statistical-modeling-data-compression/
//	http://www.colloquial.com/ArithmeticCoding/
GameEngineLib.createGameArithmeticCompression = function()
{
	var instance = {};
	var PRIVATE = {};
	
	if(GameSystemVars.DEBUG)
	{
		GameEngineLib.addDebugInfo("GameArithmeticCompression", instance, PRIVATE);
	}
	
	PRIVATE.bitPacker = GameEngineLib.createGameBitPacker();
	
	PRIVATE.BITS = 32;//16;
	PRIVATE.ONE = Math.pow(2, PRIVATE.BITS);						//(2^16bits) - 1 == 65535 == 0xffff:
	PRIVATE.QUARTER = (PRIVATE.ONE) / 4;							//16384 == 0x4000://SMSB (Second most Significant bit)
	PRIVATE.HALF = 2 * PRIVATE.QUARTER;								//32768 == 0x8000	//MSB (Most Significant bit)
	PRIVATE.THREEQUARTERS = PRIVATE.HALF + PRIVATE.QUARTER;	//49152 == 0xC000	//SMSB + MSB
	
	PRIVATE.high = PRIVATE.ONE - 1;
	PRIVATE.low = 0;
	PRIVATE.underflow_bits = 0;
	PRIVATE.encoded = 0;
	
	
	instance.getString = function()
	{
		++PRIVATE.underflow_bits;
		if(PRIVATE.low < PRIVATE.QUARTER)
		{
			PRIVATE.bitPacker.pack(0, 1);	//write lowMSB (low & 0x8000)
			while(PRIVATE.underflow_bits > 0)
			{
				PRIVATE.bitPacker.pack(1, 1);	//write ~lowMSB (~low & 0x8000)
				--PRIVATE.underflow_bits;
			}
		}
		else
		{
			PRIVATE.bitPacker.pack(1, 1);	//write lowMSB (low & 0x8000)
			while(PRIVATE.underflow_bits > 0)
			{
				PRIVATE.bitPacker.pack(0, 1);	//write ~lowMSB (~low & 0x8000)
				--PRIVATE.underflow_bits;
			}
		}
		
		return PRIVATE.bitPacker.getString();
	}
	
	
	instance.setString = function(inString)
	{
		PRIVATE.bitPacker.setString(inString);
		
		PRIVATE.high = PRIVATE.ONE - 1;
		PRIVATE.low = 0;
		PRIVATE.underflow_bits = 0;
		PRIVATE.encoded = 0;
		
		for(var i = 0; i < PRIVATE.BITS; ++i)
		{
			PRIVATE.encoded = PRIVATE.encoded * 2 + PRIVATE.bitPacker.unpack(1);
		}
	}
	
	
	instance.encode = function(value, inModel)
	{
		var encodeRange = (PRIVATE.high - PRIVATE.low) + 1;
		
		var valueRange = inModel.getProbabilityRange(value);
		
		PRIVATE.high = Math.floor(PRIVATE.low + encodeRange * valueRange.high - 1);
		PRIVATE.low = Math.floor(PRIVATE.low + encodeRange * valueRange.low);
		
		for(var loops = 0; loops < PRIVATE.BITS; ++loops)
		{
			/*
			The first two cases are a combination of one:
			if((high & 0x8000) == (low & 0x8000))
			*/
			if(PRIVATE.high < PRIVATE.HALF)//(high & 0x8000) == (low & 0x8000)//MSB == 0
			{
				PRIVATE.bitPacker.pack(0, 1);	//write lowMSB (low & 0x8000)
				while(PRIVATE.underflow_bits > 0)
				{
					PRIVATE.bitPacker.pack(1, 1);	//write ~lowMSB (~low & 0x8000)
					--PRIVATE.underflow_bits;
				}
			}
			else if(PRIVATE.low >= PRIVATE.HALF)//(high & 0x8000) == (low & 0x8000)//MSB == 1
			{
				PRIVATE.bitPacker.pack(1, 1);	//write lowMSB (low & 0x8000)
				while(PRIVATE.underflow_bits > 0)
				{
					PRIVATE.bitPacker.pack(0, 1);	//write ~lowMSB (~low & 0x8000)
					--PRIVATE.underflow_bits;
				}
				
				//remove MSB
				PRIVATE.low -= PRIVATE.HALF;
				PRIVATE.high -= PRIVATE.HALF;
			}
			/*
			Third case is really this:
			else if((low & 0x4000) && !(high & 0x4000))//SMSB low and not SMSB high
			*/
			else if(PRIVATE.low >= PRIVATE.QUARTER && PRIVATE.high <= PRIVATE.THREEQUARTERS)
			{
				++PRIVATE.underflow_bits;
				PRIVATE.low -= PRIVATE.QUARTER;	//low &= 0x3fff; remove SMSB
				PRIVATE.high -= PRIVATE.QUARTER;	//high |= 0x4000;	(borrows from MSB)
			}
			else
			{
				return;
			}
			
			//low <<= 1;
			PRIVATE.low = (2 * PRIVATE.low) % PRIVATE.ONE;
			//high <<= 1;
			//high |= 1;
			PRIVATE.high = (2 * PRIVATE.high + 1) % PRIVATE.ONE;
		}
		
		GameEngineLib.logger.error("Encode failed!");
	}
	
	
	instance.decode = function(inModel)
	{
		var encodeRange = (PRIVATE.high - PRIVATE.low) + 1;
		var probability = (PRIVATE.encoded - PRIVATE.low) / encodeRange;
		
		if((probability > 1 || probability < 0))
		{
			GameEngineLib.logger.error("Decompression out of range value detected!");
			//TODO throw an error to be caught above and disconnect them
		}
		
		var valueRange = inModel.getValueFromProbability(probability);
		
		PRIVATE.high = Math.floor(PRIVATE.low + encodeRange * valueRange.high - 1);
		PRIVATE.low = Math.floor(PRIVATE.low + encodeRange * valueRange.low);
		
		for(var loops = 0; loops < PRIVATE.BITS; ++loops)
		{
			/*
			if((high & 0x8000) == (low & 0x8000))
			*/
			if(PRIVATE.high < PRIVATE.HALF)//(high & 0x8000) == (low & 0x8000)//MSB == 0
			{
			}
			else if(PRIVATE.low >= PRIVATE.HALF)//(high & 0x8000) == (low & 0x8000)//MSB == 1
			{
				//remove MSB
				PRIVATE.encoded -= PRIVATE.HALF;
				PRIVATE.low -= PRIVATE.HALF;
				PRIVATE.high -= PRIVATE.HALF;
			}
			/*
			Third case is really this:
			else if((low & 0x4000) && !(high & 0x4000))//SMSB low and not SMSB high
			*/
			else if(PRIVATE.low >= PRIVATE.QUARTER && PRIVATE.high <= PRIVATE.THREEQUARTERS)
			{
				PRIVATE.encoded -= PRIVATE.QUARTER;
				PRIVATE.low -= PRIVATE.QUARTER;	//low &= 0x3fff; remove SMSB
				PRIVATE.high -= PRIVATE.QUARTER;	//high |= 0x4000;	(borrows from MSB)
			}
			else
			{
				return valueRange.value;
			}
			
			//low <<= 1;
			PRIVATE.low = (2 * PRIVATE.low) % PRIVATE.ONE;
			//high <<= 1;
			//high |= 1;
			PRIVATE.high = (2 * PRIVATE.high + 1) % PRIVATE.ONE;
			//(encoded << 1) | inBit
			PRIVATE.encoded = (2 * PRIVATE.encoded + PRIVATE.bitPacker.unpack(1)) % PRIVATE.ONE;
		}
		
		GameEngineLib.logger.error("Did not resolve decoding a symbol before we exceeded the bits it could have fit in!");
		//return valueRange.value;
		return inModel.min;//should prevent out of range values
	}
	
	return instance;
}
