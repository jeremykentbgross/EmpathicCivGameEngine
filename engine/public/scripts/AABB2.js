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

ECGame.EngineLib.AABB2 = function AABB2(inX, inY, inWidth, inHeight)
{
	this.myX = inX || 0;
	this.myY = inY || 0;
	this.myWidth = inWidth || 0;
	this.myHeight = inHeight || 0;
};
ECGame.EngineLib.AABB2.prototype.constructor = ECGame.EngineLib.AABB2;



ECGame.EngineLib.AABB2.create = function create(inX, inY, inWidth, inHeight)
{
	return new ECGame.EngineLib.AABB2(inX, inY, inWidth, inHeight);
};



ECGame.EngineLib.AABB2.prototype.clone = function clone()
{
	return new ECGame.EngineLib.AABB2(this.myX, this.myY, this.myWidth, this.myHeight);
};



ECGame.EngineLib.AABB2.prototype.containsRect = function containsRect(inOtherRect)
{
	if(inOtherRect.myX < this.myX)//TODO maybe <= for all these??
	{
		return false;
	}
	if(inOtherRect.myY < this.myY)
	{
		return false;
	}
	if(this.myX + this.myWidth < inOtherRect.myX + inOtherRect.myWidth)
	{
		return false;
	}
	if(this.myY + this.myHeight < inOtherRect.myY + inOtherRect.myHeight)
	{
		return false;
	}
	
	return true;
};



ECGame.EngineLib.AABB2.prototype.containsPoint = function containsPoint(inPoint)
{
	if(inPoint.myX < this.myX)//left
	{
		return false;
	}
	if(inPoint.myX > this.myX + this.myWidth)//right
	{
		return false;
	}

	if(inPoint.myY > this.myY + this.myHeight)//bellow
	{
		return false;
	}
	if(inPoint.myY < this.myY)//above
	{
		return false;
	}

//	if(inPoint.myZ < Front())
//		return false;
//	if(inPoint.myZ > Back())
//		return false;

	return true;
};



ECGame.EngineLib.AABB2.prototype.intersectsRect = function intersectsRect(inOtherRect)
{
	if(inOtherRect.myX + inOtherRect.myWidth <= this.myX)
	{
		return false;
	}
	if(inOtherRect.myY + inOtherRect.myHeight <= this.myY)
	{
		return false;
	}
	if(this.myX + this.myWidth <= inOtherRect.myX)
	{
		return false;
	}
	if(this.myY + this.myHeight <= inOtherRect.myY)
	{
		return false;
	}
	
	return true;
};



ECGame.EngineLib.AABB2.prototype.getIntersection = function getIntersection(inOtherRect)
{
	var x, y, outIntersection;
	
	x = Math.max(this.myX, inOtherRect.myX);
	y = Math.max(this.myY, inOtherRect.myY);
	
	outIntersection = ECGame.EngineLib.AABB2.create(
		x,
		y,
		Math.max(
			Math.min(this.myX + this.myWidth, inOtherRect.myX + inOtherRect.myWidth) - x,
			0
		),
		Math.max(
			Math.min(this.myY + this.myHeight, inOtherRect.myY + inOtherRect.myHeight) - y,
			0
		)
	);
	
	return outIntersection;
};



ECGame.EngineLib.AABB2.prototype.getUnion = function getUnion(inOtherRect)
{
	var returnRect = new ECGame.EngineLib.AABB2();
	returnRect.setLeftTop(
		new ECGame.EngineLib.Point2(
			Math.min(this.myX, inOtherRect.myX),
			Math.min(this.myY, inOtherRect.myY)
		)
	);
	returnRect.setRightBottom(
		new ECGame.EngineLib.Point2(
			Math.max(this.myX + this.myWidth, inOtherRect.myX + inOtherRect.myWidth),
			Math.max(this.myY + this.myHeight, inOtherRect.myY + inOtherRect.myHeight)
		)
	);
	return returnRect;
};



ECGame.EngineLib.AABB2.prototype.getArea = function getArea()
{
	return this.myWidth * this.myHeight;
};



ECGame.EngineLib.AABB2.prototype.getCenter = function getCenter()
{
	return ECGame.EngineLib.Point2.create(
		this.myX + this.myWidth / 2,
		this.myY + this.myHeight / 2
	);
};



ECGame.EngineLib.AABB2.prototype.getLeftTop = function getLeftTop()
{
	return ECGame.EngineLib.Point2.create(this.myX, this.myY);
};



ECGame.EngineLib.AABB2.prototype.setLeftTop = function setLeftTop(inPoint)
{
	this.myX = inPoint.myX;
	this.myY = inPoint.myY;
};



ECGame.EngineLib.AABB2.prototype.getRight = function getRight()
{
	return this.myX + this.myWidth;
};



ECGame.EngineLib.AABB2.prototype.getLeft = function getLeft()
{
	return this.myX;
};



ECGame.EngineLib.AABB2.prototype.getTop = function getTop()
{
	return this.myY;
};



ECGame.EngineLib.AABB2.prototype.getBottom = function getBottom()
{
	return this.myY + this.myHeight;
};



ECGame.EngineLib.AABB2.prototype.getRightBottom = function getRightBottom()
{
	return ECGame.EngineLib.Point2.create(this.myX + this.myWidth, this.myY + this.myHeight);
};



ECGame.EngineLib.AABB2.prototype.setRightBottom = function setRightBottom(inPoint)
{
	this.myWidth = Math.max(inPoint.myX - this.myX, 0);
	this.myHeight = Math.max(inPoint.myY - this.myY, 0);
};



ECGame.EngineLib.AABB2.prototype.getLeftBottom = function getLeftBottom()
{
	return ECGame.EngineLib.Point2.create(this.myX, this.myY + this.myHeight);
};



ECGame.EngineLib.AABB2.prototype.getWidthHeight = function getWidthHeight()
{
	return ECGame.EngineLib.Point2.create(this.myWidth, this.myHeight);
};
ECGame.EngineLib.AABB2.prototype.setWidthHeight = function setWidthHeight(inWidthHeight)
{
	this.myWidth = inWidthHeight.myX;
	this.myHeight = inWidthHeight.myY;
};



ECGame.EngineLib.AABB2.prototype.copyFrom = function copyFrom(inOther)
{
	this.myX = inOther.myX;
	this.myY = inOther.myY;
	this.myWidth = inOther.myWidth;
	this.myHeight = inOther.myHeight;
};

