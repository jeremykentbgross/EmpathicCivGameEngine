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

ECGame.EngineLib.createGameBitPacker = function()
{
	var outPacker = {};
	var PRIVATE =
	{
		data : [0],
		bits : 0,
		power : 1,
		index : 0
	};
	
	//constants
	PRIVATE.BITCAP = 32;
	PRIVATE.MAXBITS = 6;//16;	//max bits per storage element
	PRIVATE.MAXPOW = Math.pow(2, PRIVATE.MAXBITS);
	PRIVATE.POWERS = [];
	//make lookup to avoid calling Math.pow alot
	var i;
	for(i = 1; i <= PRIVATE.BITCAP; ++i)
	{
		PRIVATE.POWERS[i] = Math.pow(2, i);
	}
	
	if(ECGame.Settings.DEBUG)
	{
		ECGame.EngineLib.addDebugInfo('bitPacker', outPacker, PRIVATE);
	}
	
	outPacker.pack = function(value, bits)
	{
		var power;
		var length = PRIVATE.data.length;
		
		if(ECGame.Settings.DEBUG)
		{
			//TODO print warnings if out of bounds
			bits = Math.floor(bits);
			bits = Math.max(bits, 1);
			bits = Math.min(bits, PRIVATE.BITCAP);
		}
		
		//power = Math.pow(2, bits);
		power = PRIVATE.POWERS[bits];
		
		if(ECGame.Settings.DEBUG)
		{
			//TODO print warnings if out of bounds
			value = Math.floor(value);
			value = Math.min(value, power - 1);
			value = Math.max(value, 0);
		}
				
		PRIVATE.data[length - 1] += value * PRIVATE.power;
		PRIVATE.power *= power;
		PRIVATE.bits += bits;
		
		while(PRIVATE.bits >= PRIVATE.MAXBITS)
		{
			PRIVATE.bits -= PRIVATE.MAXBITS;
			PRIVATE.power = Math.pow(2, PRIVATE.bits);
			
			PRIVATE.data[length] = Math.floor(PRIVATE.data[length - 1] / PRIVATE.MAXPOW);
			PRIVATE.data[length - 1] -= PRIVATE.data[length] * PRIVATE.MAXPOW;
						
			length = PRIVATE.data.length;
		}
		
		PRIVATE.index = length;
	};
	
	outPacker.setString = function(inString)
	{
		var length = inString.length;
		var i;
		
		PRIVATE.data = [];
		
		for(i = 0; i < length; ++i)
		{
			PRIVATE.data[i] = inString.charCodeAt(i) - 32;/////HACK with 6 bits
		}
		
		PRIVATE.bits = 0;
		PRIVATE.power = 1;
		PRIVATE.index = 0;
	};
	
	outPacker.getString = function()
	{
		var length;
		var outString;
		var i;
		
		length = PRIVATE.data.length;
		outString = '';
		
		for(i = 0; i < length; ++i)
		{
			outString = outString + String.fromCharCode(PRIVATE.data[i] + 32);/////HACK with 6 bits
		}
		
		return outString;
	};
	
	outPacker.unpack = function(bits)
	{
		var outValue = 0;
		var extraBits = 0;
		
		var power;
		
		if(ECGame.Settings.DEBUG)
		{
			bits = Math.floor(bits);
			bits = Math.max(bits, 1);
			bits = Math.min(bits, PRIVATE.BITCAP);
		}
		
		//power = Math.pow(2, bits);
		power = PRIVATE.POWERS[bits];
		
		outValue = PRIVATE.data[PRIVATE.index] / PRIVATE.power || 0;
		PRIVATE.power *= power;
		PRIVATE.bits += bits;
		
		outValue = Math.floor(outValue);
		outValue %= power;		
		
		while(PRIVATE.bits >= PRIVATE.MAXBITS)
		{
			++PRIVATE.index;
			PRIVATE.bits -= PRIVATE.MAXBITS;
			PRIVATE.power = Math.pow(2, PRIVATE.bits);
			
			extraBits = PRIVATE.data[PRIVATE.index] || 0;
			extraBits %= PRIVATE.power;
			extraBits *= power / PRIVATE.power;
			
			outValue += extraBits;
		}
		
		return outValue;
	};
	
	//note does not currently print leading 0's
	//note should probably print in reverse order?
	outPacker.debugPrint = function()
	{
		var output = '';
		var i;
		
		for(i = PRIVATE.data.length - 1; i >= 0 ; --i)
		{
			output += PRIVATE.data[i].toString(2) + ' ';
		}
		console.log("Bit packer: " + output);
	};
	
	return outPacker;
};
