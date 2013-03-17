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


//TODO:
/*
Need to have 2 Optionals on flag or something:
1) 6 bits + 32 in string (CURRENT OPTION)
2) 16 bits in Typed Array with Binary net serialization (BEST OPTION) (No binary net sockets yet)
*/

ECGame.EngineLib.BitPacker = function BitPacker()
{
	this._data = [0];
	this._bits = 0;
	this._power = 1;
	this._index = 0;
	this._statics = ECGame.EngineLib.BitPacker;
};
ECGame.EngineLib.BitPacker.prototype.constructor = ECGame.EngineLib.BitPacker;



//STATICS:
ECGame.EngineLib.BitPacker.initStatics = function initStatics()
{
	var i;
	
	//constants
	this._BITCAP = 32;
	this._MAXBITS = 6;//16;	//max bits per storage element
	this._MAXPOW = Math.pow(2, this._MAXBITS);
	this._POWERS = [];
	
	//make lookup to avoid calling Math.pow alot
	for(i = 1; i <= this._BITCAP; ++i)
	{
		this._POWERS[i] = Math.pow(2, i);
	}
};
ECGame.EngineLib.BitPacker.initStatics();



ECGame.EngineLib.BitPacker.create = function create()
{
	return new ECGame.EngineLib.BitPacker();
};



ECGame.EngineLib.BitPacker.prototype.pack = function pack(inValue, inBits)
{
	var aPower,
		aLength;

	aLength = this._data.length;
	
	if(ECGame.Settings.DEBUG)
	{
		//TODO print warnings if out of bounds
		inBits = Math.floor(inBits);
		inBits = Math.max(inBits, 1);
		inBits = Math.min(inBits, this._statics._BITCAP);
	}
	
	//aPower = Math.pow(2, inBits);
	aPower = this._statics._POWERS[inBits];
	
	if(ECGame.Settings.DEBUG)
	{
		//TODO print warnings if out of bounds
		inValue = Math.floor(inValue);
		inValue = Math.min(inValue, aPower - 1);
		inValue = Math.max(inValue, 0);
	}
			
	this._data[aLength - 1] += inValue * this._power;
	this._power *= aPower;
	this._bits += inBits;
	
	while(this._bits >= this._statics._MAXBITS)
	{
		this._bits -= this._statics._MAXBITS;
		this._power = Math.pow(2, this._bits);
		
		this._data[aLength] = Math.floor(this._data[aLength - 1] / this._statics._MAXPOW);
		this._data[aLength - 1] -= this._data[aLength] * this._statics._MAXPOW;
					
		aLength = this._data.length;
	}
	
	this._index = aLength;
};



ECGame.EngineLib.BitPacker.prototype.setString = function setString(inString)
{
	var aLength,
		i;
	
	aLength = inString.length;
	
	this._data = [];
	
	for(i = 0; i < aLength; ++i)
	{
		this._data[i] = inString.charCodeAt(i) - 32;/////HACK with 6 bits
	}
	
	this._bits = 0;
	this._power = 1;
	this._index = 0;
};



ECGame.EngineLib.BitPacker.prototype.getString = function getString()
{
	var aLength,
		outString,
		i;
	
	aLength = this._data.length;
	outString = '';
	
	for(i = 0; i < aLength; ++i)
	{
		outString = outString + String.fromCharCode(this._data[i] + 32);/////HACK with 6 bits
	}
	
	return outString;
};



ECGame.EngineLib.BitPacker.prototype.unpack = function unpack(inBits)
{
	var outValue,
		aExtraBits,
		aPower;
	
	outValue = 0;
	aExtraBits = 0;
	
	if(ECGame.Settings.DEBUG)
	{
		//TODO print warnings if out of bounds
		inBits = Math.floor(inBits);
		inBits = Math.max(inBits, 1);
		inBits = Math.min(inBits, this._statics._BITCAP);
	}
	
	//aPower = Math.pow(2, inBits);
	aPower = this._statics._POWERS[inBits];
	
	outValue = this._data[this._index] / this._power || 0;
	this._power *= aPower;
	this._bits += inBits;
	
	outValue = Math.floor(outValue);
	outValue %= aPower;		
	
	while(this._bits >= this._statics._MAXBITS)
	{
		++this._index;
		this._bits -= this._statics._MAXBITS;
		this._power = Math.pow(2, this._bits);
		
		aExtraBits = this._data[this._index] || 0;
		aExtraBits %= this._power;
		aExtraBits *= aPower / this._power;
		
		outValue += aExtraBits;
	}
	
	return outValue;
};



//TODO note does not currently print leading 0's
//TODO note should probably print in reverse order? (doesn't it??)
ECGame.EngineLib.BitPacker.prototype.debugPrint = function debugPrint()
{
	var output,
		i;
	
	output = '';
	
	for(i = this._data.length - 1; i >= 0 ; --i)
	{
		output += this._data[i].toString(2) + ' ';
	}
	console.log("Bit packer: " + output);
};


