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



ECGame.EngineLib.Point2D.prototype.set = function set(inX, inY)
{
	this.myX = inX || 0;
	this.myY = inY || 0;
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



ECGame.EngineLib.Point2D.prototype.max = function max(inOther)
{
	return new ECGame.EngineLib.Point2D(
		Math.max(this.myX, inOther.myX),
		Math.max(this.myY, inOther.myY)
	);
};



ECGame.EngineLib.Point2D.prototype.min = function min(inOther)
{
	return new ECGame.EngineLib.Point2D(
		Math.min(this.myX, inOther.myX),
		Math.min(this.myY, inOther.myY)
	);
};



ECGame.EngineLib.Point2D.prototype.getLengthSquared = function getLengthSquared()
{
	return this.myX * this.myX + this.myY * this.myY;
};



ECGame.EngineLib.Point2D.prototype.getLength = function getLength()
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



ECGame.EngineLib.Point2D.prototype.findClosestVector = function findClosestVector(inVectorList)
{
	var aVectorProbibility
		,aBestProbibility
		,aThisUnitVector
		,anIndex
		,i
		;
	
	aThisUnitVector = this.unit();
	
	aVectorProbibility = 0;
	aBestProbibility = 0;
	anIndex = -1;
	
	for(i = 0; i < inVectorList.length; ++i)
	{
		aVectorProbibility = inVectorList[i].dot(aThisUnitVector);
		if(aVectorProbibility > aBestProbibility)
		{
			aBestProbibility = aVectorProbibility;
			anIndex = i;
		}
	}
	
	return anIndex;
};



ECGame.EngineLib.Point2D.prototype.getClosest8DirectionIndex = function getClosest8DirectionIndex()
{
	return this.findClosestVector(ECGame.EngineLib.Point2D.my8Directions);
};



ECGame.EngineLib.Point2D.prototype.getClosest8Direction = function getClosest8Direction()
{
	return ECGame.EngineLib.Point2D.get8DirectionFromIndex(this.getClosest8DirectionIndex());
};



ECGame.EngineLib.Point2D.get8DirectionFromIndex = function get8DirectionFromIndex(inIndex)
{
	if(inIndex === -1)
	{
		return new ECGame.EngineLib.Point2D();
	}
	return this.my8Directions[inIndex].clone();
};



ECGame.EngineLib.Point2D.setupStaticData = function setupStaticData()
{
	var anAngle
		,aDelta
		;
	
	anAngle = 0;
	aDelta = 2 * Math.PI / 8;
	
	this.my8Directions =
	[
		new ECGame.EngineLib.Point2D(Math.cos(anAngle), Math.sin(anAngle)),
		new ECGame.EngineLib.Point2D(Math.cos(anAngle+=aDelta), Math.sin(anAngle)),
		new ECGame.EngineLib.Point2D(Math.cos(anAngle+=aDelta), Math.sin(anAngle)),
		new ECGame.EngineLib.Point2D(Math.cos(anAngle+=aDelta), Math.sin(anAngle)),
		new ECGame.EngineLib.Point2D(Math.cos(anAngle+=aDelta), Math.sin(anAngle)),
		new ECGame.EngineLib.Point2D(Math.cos(anAngle+=aDelta), Math.sin(anAngle)),
		new ECGame.EngineLib.Point2D(Math.cos(anAngle+=aDelta), Math.sin(anAngle)),
		new ECGame.EngineLib.Point2D(Math.cos(anAngle+=aDelta), Math.sin(anAngle))
	];
};
ECGame.EngineLib.Point2D.setupStaticData();