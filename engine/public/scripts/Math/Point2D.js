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

ECGame.EngineLib.Point2D = function Point2D(inX, inY)
{
	this.myX = inX || 0;
	this.myY = inY || 0;
};
ECGame.EngineLib.Point2D.prototype.constructor = ECGame.EngineLib.Point2D;



ECGame.EngineLib.Point2D.create = function create(inX, inY)
{
	return new ECGame.EngineLib.Point2D(inX, inY);
};



ECGame.EngineLib.Point2D.prototype.equal = function equal(inOther)
{
	return this.myX === inOther.myX && this.myY === inOther.myY;
};



ECGame.EngineLib.Point2D.prototype.clone = function clone()
{
	return new ECGame.EngineLib.Point2D(this.myX, this.myY);
};



ECGame.EngineLib.Point2D.prototype.copyFrom = function copyFrom(inOther)
{
	this.myX = inOther.myX;
	this.myY = inOther.myY;
};



ECGame.EngineLib.Point2D.prototype.add = function add(inOther)
{
	return new ECGame.EngineLib.Point2D(this.myX + inOther.myX, this.myY + inOther.myY);
};



ECGame.EngineLib.Point2D.prototype.subtract = function subtract(inOther)
{
	return new ECGame.EngineLib.Point2D(this.myX - inOther.myX, this.myY - inOther.myY);
};



ECGame.EngineLib.Point2D.prototype.multiply = function multiply(inOther)
{
	return new ECGame.EngineLib.Point2D(this.myX * inOther.myX, this.myY * inOther.myY);
};



ECGame.EngineLib.Point2D.prototype.divide = function divide(inOther)
{
	return new ECGame.EngineLib.Point2D(this.myX / inOther.myX, this.myY / inOther.myY);
};



ECGame.EngineLib.Point2D.prototype.scale = function scale(inScalar)
{
	return new ECGame.EngineLib.Point2D(this.myX * inScalar, this.myY * inScalar);
};



ECGame.EngineLib.Point2D.prototype.componentMax = function componentMax(inOther)
{
	return new ECGame.EngineLib.Point2D(
		Math.max(this.myX, inOther.myX),
		Math.max(this.myY, inOther.myY)
	);
};



ECGame.EngineLib.Point2D.prototype.componentMin = function componentMin(inOther)
{
	return new ECGame.EngineLib.Point2D(
		Math.min(this.myX, inOther.myX),
		Math.min(this.myY, inOther.myY)
	);
};



ECGame.EngineLib.Point2D.prototype.lengthSquared = function lengthSquared()
{
	return this.myX * this.myX + this.myY * this.myY;
};



ECGame.EngineLib.Point2D.prototype.length = function length()
{
	return Math.sqrt(this.myX * this.myX + this.myY * this.myY);
};



ECGame.EngineLib.Point2D.prototype.unit = function unit()
{
	var aLength;
	
	aLength = Math.sqrt(this.myX * this.myX + this.myY * this.myY);
	return new ECGame.EngineLib.Point2D(this.myX / aLength, this.myY / aLength);
};



ECGame.EngineLib.Point2D.prototype.normalize = function normalize()
{
	var aLength;
	
	aLength = Math.sqrt(this.myX * this.myX + this.myY * this.myY);
	this.myX = this.myX / aLength;
	this.myY = this.myY / aLength;
	return this;
};



ECGame.EngineLib.Point2D.prototype.dot = function dot(inOther)
{
	return this.myX * inOther.myX + this.myY * inOther.myY;
};



ECGame.EngineLib.Point2D.prototype.floor = function floor()
{
	return new ECGame.EngineLib.Point2D(Math.floor(this.myX), Math.floor(this.myY));
};