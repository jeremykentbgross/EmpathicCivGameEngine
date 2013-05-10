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

//see:
// http://number-none.com/product/
//	http://marknelson.us/1991/02/01/arithmetic-coding-statistical-modeling-data-compression/
//	http://www.colloquial.com/ArithmeticCoding/
ECGame.EngineLib.ArithmeticCompresser = function ArithmeticCompresser()
{
	this._bitPacker = ECGame.EngineLib.BitPacker.create();
	
	this._BITS = 32;//16;
	this._ONE = Math.pow(2, this._BITS);				//(2^16bits) - 1 == 65535 == 0xffff:
	this._QUARTER = (this._ONE) / 4;					//16384 == 0x4000://SMSB (Second most Significant bit)
	this._HALF = 2 * this._QUARTER;						//32768 == 0x8000	//MSB (Most Significant bit)
	this._THREEQUARTERS = this._HALF + this._QUARTER;	//49152 == 0xC000	//SMSB + MSB
	
	this._high = this._ONE - 1;
	this._low = 0;
	this._underflow_bits = 0;
	this._encoded = 0;
};
ECGame.EngineLib.ArithmeticCompresser.prototype.constructor = ECGame.EngineLib.ArithmeticCompresser;



ECGame.EngineLib.ArithmeticCompresser.create = function create()
{
	return new ECGame.EngineLib.ArithmeticCompresser();
};



ECGame.EngineLib.ArithmeticCompresser.prototype.getString = function getString()
{
	++this._underflow_bits;
	if(this._low < this._QUARTER)
	{
		this._bitPacker.pack(0, 1);	//write lowMSB (low & 0x8000)
		while(this._underflow_bits > 0)
		{
			this._bitPacker.pack(1, 1);	//write ~lowMSB (~low & 0x8000)
			--this._underflow_bits;
		}
	}
	else
	{
		this._bitPacker.pack(1, 1);	//write lowMSB (low & 0x8000)
		while(this._underflow_bits > 0)
		{
			this._bitPacker.pack(0, 1);	//write ~lowMSB (~low & 0x8000)
			--this._underflow_bits;
		}
	}
	
	return this._bitPacker.getString();
};



ECGame.EngineLib.ArithmeticCompresser.prototype.setString = function setString(inString)
{
	this._bitPacker.setString(inString);
	
	this._high = this._ONE - 1;
	this._low = 0;
	this._underflow_bits = 0;
	this._encoded = 0;
	
	var i;
	for(i = 0; i < this._BITS; ++i)
	{
		this._encoded = this._encoded * 2 + this._bitPacker.unpack(1);
	}
};



ECGame.EngineLib.ArithmeticCompresser.prototype.encode = function encode(value, inModel)
{
	var encodeRange,
		valueRange,
		loops;
	
	encodeRange = (this._high - this._low) + 1;
	
	valueRange = inModel.getProbabilityRange(value);
	
	this._high = Math.floor(this._low + encodeRange * valueRange.high - 1);
	this._low = Math.floor(this._low + encodeRange * valueRange.low);
	
	for(loops = 0; loops < this._BITS; ++loops)
	{
		
		//The first two cases are a combination of one:
		//if((high & 0x8000) == (low & 0x8000))
		if(this._high < this._HALF)//(high & 0x8000) == (low & 0x8000)//MSB == 0
		{
			this._bitPacker.pack(0, 1);	//write lowMSB (low & 0x8000)
			while(this._underflow_bits > 0)
			{
				this._bitPacker.pack(1, 1);	//write ~lowMSB (~low & 0x8000)
				--this._underflow_bits;
			}
		}
		else if(this._low >= this._HALF)//(high & 0x8000) == (low & 0x8000)//MSB == 1
		{
			this._bitPacker.pack(1, 1);	//write lowMSB (low & 0x8000)
			while(this._underflow_bits > 0)
			{
				this._bitPacker.pack(0, 1);	//write ~lowMSB (~low & 0x8000)
				--this._underflow_bits;
			}
			
			//remove MSB
			this._low -= this._HALF;
			this._high -= this._HALF;
		}
		//Third case is really this:
		//else if((low & 0x4000) && !(high & 0x4000))//SMSB low and not SMSB high
		else if(this._low >= this._QUARTER && this._high <= this._THREEQUARTERS)
		{
			++this._underflow_bits;
			this._low -= this._QUARTER;	//low &= 0x3fff; remove SMSB
			this._high -= this._QUARTER;	//high |= 0x4000;	(borrows from MSB)
		}
		else
		{
			return;
		}
		
		//low <<= 1;
		this._low = (2 * this._low) % this._ONE;
		//high <<= 1;
		//high |= 1;
		this._high = (2 * this._high + 1) % this._ONE;
	}
	
	//ECGame.log.error("Encode failed!");
	ECGame.log.assert(false, "Encode failed!");
};



ECGame.EngineLib.ArithmeticCompresser.prototype.decode = function decode(inModel)
{
	var encodeRange,
		probability,
		valueRange,
		loops;
		
	encodeRange = (this._high - this._low) + 1;
	probability = (this._encoded - this._low) / encodeRange;
	
	if((probability > 1 || probability < 0))
	{
		//ECGame.log.error("Decompression out of range value detected!");
		ECGame.log.assert(false, "Decompression out of range value detected!");
		//TODO throw an error to be caught above and disconnect them
	}
	
	valueRange = inModel.getValueFromProbability(probability);
	
	this._high = Math.floor(this._low + encodeRange * valueRange.high - 1);
	this._low = Math.floor(this._low + encodeRange * valueRange.low);
	
	for(loops = 0; loops < this._BITS; ++loops)
	{
		//if((high & 0x8000) == (low & 0x8000))
		if(this._high < this._HALF)//(high & 0x8000) == (low & 0x8000)//MSB == 0
		{
		}
		else if(this._low >= this._HALF)//(high & 0x8000) == (low & 0x8000)//MSB == 1
		{
			//remove MSB
			this._encoded -= this._HALF;
			this._low -= this._HALF;
			this._high -= this._HALF;
		}
		//Third case is really this:
		//else if((low & 0x4000) && !(high & 0x4000))//SMSB low and not SMSB high
		else if(this._low >= this._QUARTER && this._high <= this._THREEQUARTERS)
		{
			this._encoded -= this._QUARTER;
			this._low -= this._QUARTER;	//low &= 0x3fff; remove SMSB
			this._high -= this._QUARTER;	//high |= 0x4000;	(borrows from MSB)
		}
		else
		{
			return valueRange.value;
		}
		
		//low <<= 1;
		this._low = (2 * this._low) % this._ONE;
		//high <<= 1;
		//high |= 1;
		this._high = (2 * this._high + 1) % this._ONE;
		//(encoded << 1) | inBit
		this._encoded = (2 * this._encoded + this._bitPacker.unpack(1)) % this._ONE;
	}
	
	//ECGame.log.error("Did not resolve decoding a symbol before we exceeded the bits it could have fit in!");
	ECGame.log.assert(false, "Did not resolve decoding a symbol before we exceeded the bits it could have fit in!");
	//return valueRange.value;
	return inModel.myMin;//should prevent out of range values
};