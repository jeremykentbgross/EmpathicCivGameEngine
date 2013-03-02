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


//TODO deprecated
GameEngineLib.createGame2DPoint = function(inX, inY)
{
	return new GameEngineLib.Game2DPoint(inX, inY);
};




GameEngineLib.Game2DPoint = function Game2DPoint(inX, inY)
{
	this.myX = inX || 0;
	this.myY = inY || 0;
};
GameEngineLib.Game2DPoint.prototype.constructor = GameEngineLib.Game2DPoint;


GameEngineLib.Game2DPoint.prototype.clone = function clone()
{
	return new GameEngineLib.Game2DPoint(this.myX, this.myY);
};

GameEngineLib.Game2DPoint.prototype.copyFrom = function copyFrom(inOther)
{
	this.myX = inOther.myX;
	this.myY = inOther.myY;
};

GameEngineLib.Game2DPoint.prototype.add = function add(inOther)
{
	return new GameEngineLib.Game2DPoint(this.myX + inOther.myX, this.myY + inOther.myY);
};

GameEngineLib.Game2DPoint.prototype.sub = 
GameEngineLib.Game2DPoint.prototype.subtract = function subtract(inOther)
{
	return new GameEngineLib.Game2DPoint(this.myX - inOther.myX, this.myY - inOther.myY);
};

//TODO rename scale
GameEngineLib.Game2DPoint.prototype.multiply = function multiply(inScalar)
{
	return new GameEngineLib.Game2DPoint(this.myX * inScalar, this.myY * inScalar);
};

GameEngineLib.Game2DPoint.prototype.componentMax = function componentMax(inOther)
{
	return new GameEngineLib.Game2DPoint(
		Math.max(this.myX, inOther.myX),
		Math.max(this.myY, inOther.myY)
	);
};
GameEngineLib.Game2DPoint.prototype.componentMin = function componentMin(inOther)
{
	return new GameEngineLib.Game2DPoint(
		Math.min(this.myX, inOther.myX),
		Math.min(this.myY, inOther.myY)
	);
};

GameEngineLib.Game2DPoint.prototype.lenSq = function lenSq()
{
	return this.myX * this.myX + this.myY * this.myY;
};

GameEngineLib.Game2DPoint.prototype.length = function length()
{
	return Math.sqrt(this.myX * this.myX + this.myY * this.myY);
};

GameEngineLib.Game2DPoint.prototype.unit = function unit()
{
	var len = Math.sqrt(this.myX * this.myX + this.myY * this.myY);
	return new GameEngineLib.Game2DPoint(this.myX / len, this.myY / len);
};

GameEngineLib.Game2DPoint.prototype.dot = function dot(inOther)
{
	return this.myX * inOther.myX + this.myY * inOther.myY;
};

GameEngineLib.Game2DPoint.prototype.floor = function floor()
{
	return new GameEngineLib.Game2DPoint(Math.floor(this.myX), Math.floor(this.myY));
};