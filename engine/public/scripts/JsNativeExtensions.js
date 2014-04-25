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

//This file contains Extensions for: String, Array, Math, etc

//TODO make sure these custom words are not on compression ignore list

//////////////////////////////////////////////////////////////////////////
//String functions////////////////////////////////////////////////////////
if(!String.prototype.isNumber)
{
	Object.defineProperty(
		String.prototype
		,'isNumber'
		,{
			value : function isNumber()
			{
				/*var aParsedValue;
				
				aParsedValue = parseFloat(this);
				
				return !isNaN(aParsedValue) && isFinite(aParsedValue);*/
				//console.trace();
				return !isNaN(parseFloat(this)) && isFinite(this);
			}
			,writable : false
			,configurable : false
			,enumerable : false
		}
	);
}
//String functions////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////



//////////////////////////////////////////////////////////////////////////
//Math functions//////////////////////////////////////////////////////////
if(!Math.POWER2_INT_TABLE)
{
	Object.defineProperty(
		Math
		,'POWER2_INT_TABLE'
		,{
			value : (function initPowerLookupTable()
			{
				var i, aTable;
				
				aTable = [];
				
				//make lookup to avoid calling Math.pow alot
				for(i = 0; i <= 53; ++i)	//note 53 is the highest int power JS can hold
				{
					aTable[i] = Math.pow(2, i);
				}
				
				return aTable;
			}())
			,writable : false
			,configurable : false
			,enumerable : false
		}
	);
}
//Math functions//////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////



//////////////////////////////////////////////////////////////////////////
//Array functions/////////////////////////////////////////////////////////
if(!Array.prototype.chooseRandom)
{
	Object.defineProperty(
		Array.prototype
		,'chooseRandom'
		,{
			value : function chooseRandom()
			{
				if(!this.length)
				{
					return undefined;
				}
				
				return this[Math.floor(Math.random() * this.length)];
			}
			,writable : false
			,configurable : false
			,enumerable : false
		}
	);
}

if(!Array.prototype.findWhere)
{
	Object.defineProperty(
		Array.prototype
		,'findWhere'
		,{
			value : function findWhere(inFunction)
			{
				var aReturnList
					,aCurrent
					;
					
				aReturnList = [];
				
				for(aCurrent in this)
				{
					if(inFunction(this[aCurrent]))
					{
						aReturnList.push(this[aCurrent]);
					}
				}
				//console.log('passed findWhere', aReturnList.length);
				return aReturnList;
			}
			,writable : false
			,configurable : false
			,enumerable : false
		}
	);
}

if(!Array.prototype.swapBackPop)
{
	Object.defineProperty(
		Array.prototype
		,'swapBackPop'
		,{
			value : function swapBackPop(inIndex)
			{
				var aReturnValue;
				
				aReturnValue = this[inIndex];
				this[inIndex] = this[this.length - 1];
				this.pop();
				
				return aReturnValue;
			}
			,writable : false
			,configurable : false
			,enumerable : false
		}
	);
}
//Array functions/////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////



