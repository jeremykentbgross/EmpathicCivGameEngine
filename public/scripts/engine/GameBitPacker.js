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

GameEngineLib.createGameBitPacker = function()
{
	var outPacker = {};
	var private =
	{
		data : [0],
		bits : 0,
		power : 1,
		index : 0
	};
	
	//constants
	private.BITCAP = 32;
	private.MAXBITS = 6;//16;	//max bits per storage element
	private.MAXPOW = Math.pow(2, private.MAXBITS);
	private.POWERS = [];
	//make lookup to avoid calling Math.pow alot
	for(var i = 1; i <= private.BITCAP; ++i)
		private.POWERS[i] = Math.pow(2, i);
	
	if(GameSystemVars.DEBUG)
		GameEngineLib.addDebugInfo("bitPacker", outPacker, private);
	
	outPacker.pack = function(value, bits)
	{
		var power;
		var length = private.data.length;
		
		if(GameSystemVars.DEBUG)
		{
			//TODO print warnings if out of bounds
			bits = Math.floor(bits);
			bits = Math.max(bits, 1);
			bits = Math.min(bits, private.BITCAP);
		}
		
		//power = Math.pow(2, bits);
		power = private.POWERS[bits];
		
		if(GameSystemVars.DEBUG)
		{
			//TODO print warnings if out of bounds
			value = Math.floor(value);
			value = Math.min(value, power - 1);
			value = Math.max(value, 0);
		}
				
		private.data[length - 1] += value * private.power;
		private.power *= power;
		private.bits += bits;
		
		while(private.bits >= private.MAXBITS)
		{
			private.bits -= private.MAXBITS;
			private.power = Math.pow(2, private.bits);
			
			private.data[length] = Math.floor(private.data[length - 1] / private.MAXPOW);
			private.data[length - 1] -= private.data[length] * private.MAXPOW;
						
			length = private.data.length;
		}
		
		private.index = length;
	}
	
	outPacker.setString = function(inString)
	{
		var length = inString.length;
		
		private.data = [];
		
		for(var i = 0; i < length; ++i)
		{
			private.data[i] = inString.charCodeAt(i) - 32;/////HACK with 6 bits
		}
		
		private.bits = 0;
		private.power = 1;
		private.index = 0;
	}
	
	outPacker.getString = function()
	{
		var length;
		var outString;
		
		length = private.data.length;
		outString = "";
		
		for(var i = 0; i < length; ++i)
		{
			outString = outString + String.fromCharCode(private.data[i] + 32);/////HACK with 6 bits
		}
		
		return outString;
	}
	
	outPacker.unpack = function(bits)
	{
		var outValue = 0;
		var extraBits = 0;
		
		var power;
		
		if(GameSystemVars.DEBUG)
		{
			bits = Math.floor(bits);
			bits = Math.max(bits, 1);
			bits = Math.min(bits, private.BITCAP);
		}
		
		//power = Math.pow(2, bits);
		power = private.POWERS[bits];
		
		outValue = private.data[private.index] / private.power || 0;
		private.power *= power;
		private.bits += bits;
		
		outValue = Math.floor(outValue);
		outValue %= power;		
		
		while(private.bits >= private.MAXBITS)
		{
			++private.index;
			private.bits -= private.MAXBITS;
			private.power = Math.pow(2, private.bits);
			
			extraBits = private.data[private.index] || 0;
			extraBits %= private.power;
			extraBits *= power / private.power;
			
			outValue += extraBits;
		}
		
		return outValue;
	}
	
	//note does not currently print leading 0's
	//note should probably print in reverse order?
	outPacker.debugPrint = function()
	{
		var output = "";
		for(var i = private.data.length - 1; i >= 0 ; --i)
			output += private.data[i].toString(2) + " ";
		console.log("Bit packer: " + output);
	}
	
	return outPacker;
};
