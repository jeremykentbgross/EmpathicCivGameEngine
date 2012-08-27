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
	var private = {};
	
	if(GameSystemVars.DEBUG)
	{
		GameEngineLib.addDebugInfo("GameArithmeticCompression", instance, private);
	}
	
	private.bitPacker = GameEngineLib.createGameBitPacker();
	
	private.BITS = 32;//16;
	private.ONE = Math.pow(2, private.BITS);						//(2^16bits) - 1 == 65535 == 0xffff:
	private.QUARTER = (private.ONE) / 4;							//16384 == 0x4000://SMSB (Second most Significant bit)
	private.HALF = 2 * private.QUARTER;								//32768 == 0x8000	//MSB (Most Significant bit)
	private.THREEQUARTERS = private.HALF + private.QUARTER;	//49152 == 0xC000	//SMSB + MSB
	
	private.high = private.ONE - 1;
	private.low = 0;
	private.underflow_bits = 0;
	private.encoded = 0;
	
	
	instance.getString = function()
	{
		++private.underflow_bits;
		if(private.low < private.QUARTER)
		{
			private.bitPacker.pack(0, 1);	//write lowMSB (low & 0x8000)
			while(private.underflow_bits > 0)
			{
				private.bitPacker.pack(1, 1);	//write ~lowMSB (~low & 0x8000)
				--private.underflow_bits;
			}
		}
		else
		{
			private.bitPacker.pack(1, 1);	//write lowMSB (low & 0x8000)
			while(private.underflow_bits > 0)
			{
				private.bitPacker.pack(0, 1);	//write ~lowMSB (~low & 0x8000)
				--private.underflow_bits;
			}
		}
		
		return private.bitPacker.getString();
	}
	
	
	instance.setString = function(inString)
	{
		private.bitPacker.setString(inString);
		
		private.high = private.ONE - 1;
		private.low = 0;
		private.underflow_bits = 0;
		private.encoded = 0;
		
		for(var i = 0; i < private.BITS; ++i)
		{
			private.encoded = private.encoded * 2 + private.bitPacker.unpack(1);
		}
	}
	
	
	instance.encode = function(value, inModel)
	{
		var encodeRange = (private.high - private.low) + 1;
		
		var valueRange = inModel.getProbabilityRange(value);
		
		private.high = Math.floor(private.low + encodeRange * valueRange.high - 1);
		private.low = Math.floor(private.low + encodeRange * valueRange.low);
		
		for(var loops = 0; loops < private.BITS; ++loops)
		{
			/*
			The first two cases are a combination of one:
			if((high & 0x8000) == (low & 0x8000))
			*/
			if(private.high < private.HALF)//(high & 0x8000) == (low & 0x8000)//MSB == 0
			{
				private.bitPacker.pack(0, 1);	//write lowMSB (low & 0x8000)
				while(private.underflow_bits > 0)
				{
					private.bitPacker.pack(1, 1);	//write ~lowMSB (~low & 0x8000)
					--private.underflow_bits;
				}
			}
			else if(private.low >= private.HALF)//(high & 0x8000) == (low & 0x8000)//MSB == 1
			{
				private.bitPacker.pack(1, 1);	//write lowMSB (low & 0x8000)
				while(private.underflow_bits > 0)
				{
					private.bitPacker.pack(0, 1);	//write ~lowMSB (~low & 0x8000)
					--private.underflow_bits;
				}
				
				//remove MSB
				private.low -= private.HALF;
				private.high -= private.HALF;
			}
			/*
			Third case is really this:
			else if((low & 0x4000) && !(high & 0x4000))//SMSB low and not SMSB high
			*/
			else if(private.low >= private.QUARTER && private.high <= private.THREEQUARTERS)
			{
				++private.underflow_bits;
				private.low -= private.QUARTER;	//low &= 0x3fff; remove SMSB
				private.high -= private.QUARTER;	//high |= 0x4000;	(borrows from MSB)
			}
			else
			{
				return;
			}
			
			//low <<= 1;
			private.low = (2 * private.low) % private.ONE;
			//high <<= 1;
			//high |= 1;
			private.high = (2 * private.high + 1) % private.ONE;
		}
		
		GameEngineLib.logger.error("Encode failed!");
	}
	
	
	instance.decode = function(inModel)
	{
		var encodeRange = (private.high - private.low) + 1;
		var probability = (private.encoded - private.low) / encodeRange;
		
		if((probability > 1 || probability < 0))
		{
			GameEngineLib.logger.error("Decompression out of range value detected!");
			//TODO throw an error to be caught above and disconnect them
		}
		
		var valueRange = inModel.getValueFromProbability(probability);
		
		private.high = Math.floor(private.low + encodeRange * valueRange.high - 1);
		private.low = Math.floor(private.low + encodeRange * valueRange.low);
		
		for(var loops = 0; loops < private.BITS; ++loops)
		{
			/*
			if((high & 0x8000) == (low & 0x8000))
			*/
			if(private.high < private.HALF)//(high & 0x8000) == (low & 0x8000)//MSB == 0
			{
			}
			else if(private.low >= private.HALF)//(high & 0x8000) == (low & 0x8000)//MSB == 1
			{
				//remove MSB
				private.encoded -= private.HALF;
				private.low -= private.HALF;
				private.high -= private.HALF;
			}
			/*
			Third case is really this:
			else if((low & 0x4000) && !(high & 0x4000))//SMSB low and not SMSB high
			*/
			else if(private.low >= private.QUARTER && private.high <= private.THREEQUARTERS)
			{
				private.encoded -= private.QUARTER;
				private.low -= private.QUARTER;	//low &= 0x3fff; remove SMSB
				private.high -= private.QUARTER;	//high |= 0x4000;	(borrows from MSB)
			}
			else
			{
				return valueRange.value;
			}
			
			//low <<= 1;
			private.low = (2 * private.low) % private.ONE;
			//high <<= 1;
			//high |= 1;
			private.high = (2 * private.high + 1) % private.ONE;
			//(encoded << 1) | inBit
			private.encoded = (2 * private.encoded + private.bitPacker.unpack(1)) % private.ONE;
		}
		
		GameEngineLib.logger.error("Did not resolve decoding a symbol before we exceeded the bits it could have fit in!");
		//return valueRange.value;
		return inModel.min;//should prevent out of range values
	}
	
	return instance;
}
