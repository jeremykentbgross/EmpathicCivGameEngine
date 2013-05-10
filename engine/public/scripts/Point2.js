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



ECGame.EngineLib.Point2 = function Point2(inX, inY)
{
	this.myX = inX || 0;
	this.myY = inY || 0;
};
ECGame.EngineLib.Point2.prototype.constructor = ECGame.EngineLib.Point2;



ECGame.EngineLib.Point2.create = function create(inX, inY)
{
	return new ECGame.EngineLib.Point2(inX, inY);
};



ECGame.EngineLib.Point2.prototype.equal = function equal(inOther)
{
	return this.myX === inOther.myX && this.myY === inOther.myY;
};



ECGame.EngineLib.Point2.prototype.clone = function clone()
{
	return new ECGame.EngineLib.Point2(this.myX, this.myY);
};



ECGame.EngineLib.Point2.prototype.copyFrom = function copyFrom(inOther)
{
	this.myX = inOther.myX;
	this.myY = inOther.myY;
};



ECGame.EngineLib.Point2.prototype.add = function add(inOther)
{
	return new ECGame.EngineLib.Point2(this.myX + inOther.myX, this.myY + inOther.myY);
};



ECGame.EngineLib.Point2.prototype.subtract = function subtract(inOther)
{
	return new ECGame.EngineLib.Point2(this.myX - inOther.myX, this.myY - inOther.myY);
};



ECGame.EngineLib.Point2.prototype.multiply = function multiply(inOther)
{
	return new ECGame.EngineLib.Point2(this.myX * inOther.myX, this.myY * inOther.myY);
};



ECGame.EngineLib.Point2.prototype.divide = function divide(inOther)
{
	return new ECGame.EngineLib.Point2(this.myX / inOther.myX, this.myY / inOther.myY);
};



ECGame.EngineLib.Point2.prototype.scale = function scale(inScalar)
{
	return new ECGame.EngineLib.Point2(this.myX * inScalar, this.myY * inScalar);
};



ECGame.EngineLib.Point2.prototype.componentMax = function componentMax(inOther)
{
	return new ECGame.EngineLib.Point2(
		Math.max(this.myX, inOther.myX),
		Math.max(this.myY, inOther.myY)
	);
};



ECGame.EngineLib.Point2.prototype.componentMin = function componentMin(inOther)
{
	return new ECGame.EngineLib.Point2(
		Math.min(this.myX, inOther.myX),
		Math.min(this.myY, inOther.myY)
	);
};



ECGame.EngineLib.Point2.prototype.lenSq = function lenSq()
{
	return this.myX * this.myX + this.myY * this.myY;
};



ECGame.EngineLib.Point2.prototype.length = function length()
{
	return Math.sqrt(this.myX * this.myX + this.myY * this.myY);
};



ECGame.EngineLib.Point2.prototype.unit = function unit()
{
	var len = Math.sqrt(this.myX * this.myX + this.myY * this.myY);
	return new ECGame.EngineLib.Point2(this.myX / len, this.myY / len);
};



ECGame.EngineLib.Point2.prototype.normalize = function normalize()
{
	var len = Math.sqrt(this.myX * this.myX + this.myY * this.myY);
	this.myX = this.myX / len;
	this.myY = this.myY / len;
	return this;
};



ECGame.EngineLib.Point2.prototype.dot = function dot(inOther)
{
	return this.myX * inOther.myX + this.myY * inOther.myY;
};



ECGame.EngineLib.Point2.prototype.floor = function floor()
{
	return new ECGame.EngineLib.Point2(Math.floor(this.myX), Math.floor(this.myY));
};