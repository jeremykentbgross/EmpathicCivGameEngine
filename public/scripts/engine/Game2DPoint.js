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

GameEngineLib.createGame2DPoint = function(inX, inY)
{
	var outPoint = new Object;
	
	outPoint.myX = inX || 0;
	outPoint.myY = inY || 0;
	
	outPoint.add = function(inOther)
	{
		return GameEngineLib.createGame2DPoint(this.myX + inOther.myX, this.myY + inOther.myY);
	}
	
	outPoint.subtract = function(inOther)
	{
		return GameEngineLib.createGame2DPoint(this.myX - inOther.myX, this.myY - inOther.myY);
	}
	
	outPoint.multiply = function(inScalar)
	{
		return GameEngineLib.createGame2DPoint(this.myX * inScalar, this.myY * inScalar);
	}
	
	outPoint.componentMax = function(inOther)
	{
		return GameEngineLib.createGame2DPoint(
			Math.max(this.myX, inOther.myX),
			Math.max(this.myY, inOther.myY)
		);
	}
	outPoint.componentMin = function(inOther)
	{
		return GameEngineLib.createGame2DPoint(
			Math.min(this.myX, inOther.myX),
			Math.min(this.myY, inOther.myY)
		);
	}
	
	outPoint.lenSq = function()
	{
		return this.myX * this.myX + this.myY * this.myY;
	}
	
	outPoint.len = function()
	{
		return Math.sqrt(this.myX * this.myX + this.myY * this.myY);
	}
	
	outPoint.unit = function()
	{
		var len = Math.sqrt(this.myX * this.myX + this.myY * this.myY);
		return GameEngineLib.createGame2DPoint(this.myX / len, this.myY / len);
	}
	
	outPoint.dot = function(inOther)
	{
		return this.myX * inOther.myX + this.myY * inOther.myY;
	}
	
	outPoint.floor = function()
	{
		return GameEngineLib.createGame2DPoint(Math.floor(this.myX), Math.floor(this.myY));
	}
	
	return outPoint;
}

