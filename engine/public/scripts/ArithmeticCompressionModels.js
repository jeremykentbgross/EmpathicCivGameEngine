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

ECGame.EngineLib.ArithmeticCompressionModels = function ArithmeticCompressionModels(){return;};



ECGame.EngineLib.ArithmeticCompressionModels.EvenProbabilityIntegerRangeModel = function EvenProbabilityIntegerRangeModel()
{
	this._LOW_OFFSET = 1 / 8192;//~0.0001;
	this._HIGH_OFFSET = 1 - this._LOW_OFFSET;//~0.9999;
	
	this.myMin = 0;
	this.myMax = 0;
};
ECGame.EngineLib.ArithmeticCompressionModels.EvenProbabilityIntegerRangeModel.prototype.constructor = ECGame.EngineLib.ArithmeticCompressionModels.EvenProbabilityIntegerRangeModel;



ECGame.EngineLib.ArithmeticCompressionModels.EvenProbabilityIntegerRangeModel.create = function create()
{
	return new ECGame.EngineLib.ArithmeticCompressionModels.EvenProbabilityIntegerRangeModel();
};


ECGame.EngineLib.ArithmeticCompressionModels.EvenProbabilityIntegerRangeModel.prototype.getString = function getString()
{
	return ':[' + this.myMin + ',' + this.myMax + ')';
};


ECGame.EngineLib.ArithmeticCompressionModels.EvenProbabilityIntegerRangeModel.prototype.setMinMax = function setMinMax(inMin, inMax)
{
	if(inMax - inMin + 1 > 65536)//TODO ifdebug
	{
		//ECGame.log.error("Range is too large!");//TODO throw error from log, and move the log!
		ECGame.log.assert(false, "Range is too large!");
		return;
	}
	this.myMin = inMin;
	this.myMax = inMax;
	return this;
};



ECGame.EngineLib.ArithmeticCompressionModels.EvenProbabilityIntegerRangeModel.prototype.getProbabilityRange = function getProbabilityRange(inValue)
{
	var range,
		valueLow,
		valueHigh;
		
	//range = (this.myMax - this.myMin + 1);
	//valueRanged = ((inValue + 0.5 - this.myMin) / range);
	//valueHigh = ((inValue + 1 - this.myMin) / range);
	//return {
	//	low : valueRanged,
	//	high : valueHigh
	//};
	
	ECGame.log.assert(
		inValue <= this.myMax
		&& inValue >= this.myMin,
		"Failed to encode message value: " + inValue + ':[' + this.myMin + ',' + this.myMax + ']'
	);
	
	range = (this.myMax - this.myMin + 1);
	valueLow = ((inValue + this._LOW_OFFSET - this.myMin) / range);
	valueHigh = ((inValue + this._HIGH_OFFSET - this.myMin) / range);
	return {
		low : valueLow,
		high : valueHigh
	};
};



ECGame.EngineLib.ArithmeticCompressionModels.EvenProbabilityIntegerRangeModel.prototype.getValueFromProbability = function getValueFromProbability(inProbability)
{
	var range,
		value,	//TODO don't use value as a name!!
		valueLow,
		valueHigh;
		
	//range = (this.myMax - this.myMin + 1);
	//value = Math.floor(inProbability * range + this.myMin);
	//var valueRanged = ((value + 0.5 - this.myMin) / range);
	//valueHigh = ((value + 1 - this.myMin) / range);
	//return {
	//	value : value,
	//	low : valueRanged,
	//	high : valueHigh
	//};
	
	range = (this.myMax - this.myMin + 1);
	value = Math.floor(inProbability * range + this.myMin);
	valueLow = ((value + this._LOW_OFFSET - this.myMin) / range);
	valueHigh = ((value + this._HIGH_OFFSET - this.myMin) / range);
	return {
		value : value,
		low : valueLow,
		high : valueHigh
	};
};



//TODO probabilistic (spell?) model