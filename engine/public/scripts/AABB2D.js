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

ECGame.EngineLib.AABB2D = ECGame.EngineLib.Class.create({
	Constructor : function AABB2D(inX, inY, inWidth, inHeight)
	{
		this.myX = inX || 0;
		this.myY = inY || 0;
		this.myWidth = inWidth || 0;
		this.myHeight = inHeight || 0;
	},
	Parents : [],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		init : function init(inX, inY, inWidth, inHeight)
		{
			this.constructor(inX, inY, inWidth, inHeight);
		},
		
		clone : function clone()
		{
			return new ECGame.EngineLib.AABB2D(this.myX, this.myY, this.myWidth, this.myHeight);
		},
		
		copyFrom : function copyFrom(inOther)
		{
			this.myX = inOther.myX;
			this.myY = inOther.myY;
			this.myWidth = inOther.myWidth;
			this.myHeight = inOther.myHeight;
		},
		
		containsPoint : function containsPoint(inPoint)
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
		},
		
		containsAABB2D : function containsAABB2D(inOtherAABB2D)
		{
			if(inOtherAABB2D.myX < this.myX)
			{
				return false;
			}
			if(inOtherAABB2D.myY < this.myY)
			{
				return false;
			}
			if(this.myX + this.myWidth < inOtherAABB2D.myX + inOtherAABB2D.myWidth)
			{
				return false;
			}
			if(this.myY + this.myHeight < inOtherAABB2D.myY + inOtherAABB2D.myHeight)
			{
				return false;
			}
			
			return true;
		},
		
		intersectsAABB2D : function intersectsAABB2D(inOtherAABB2D)
		{
			if(inOtherAABB2D.myX + inOtherAABB2D.myWidth <= this.myX)
			{
				return false;
			}
			if(inOtherAABB2D.myY + inOtherAABB2D.myHeight <= this.myY)
			{
				return false;
			}
			if(this.myX + this.myWidth <= inOtherAABB2D.myX)
			{
				return false;
			}
			if(this.myY + this.myHeight <= inOtherAABB2D.myY)
			{
				return false;
			}
			
			return true;
		},
		
		getIntersection : function getIntersection(inOtherAABB2D)
		{
			var anX
				,aY
				,anIntersection
				;
			
			anX = Math.max(this.myX, inOtherAABB2D.myX);
			aY = Math.max(this.myY, inOtherAABB2D.myY);
			
			anIntersection = ECGame.EngineLib.AABB2D.create(
				anX,
				aY,
				Math.max(
					Math.min(this.myX + this.myWidth, inOtherAABB2D.myX + inOtherAABB2D.myWidth) - anX,
					0
				),
				Math.max(
					Math.min(this.myY + this.myHeight, inOtherAABB2D.myY + inOtherAABB2D.myHeight) - aY,
					0
				)
			);
			
			return anIntersection;
		},
		
		getUnion : function getUnion(inOtherAABB2D)
		{
			var aReturnAABB2D;
			
			aReturnAABB2D = new ECGame.EngineLib.AABB2D();
			aReturnAABB2D.setLeftTop(
				new ECGame.EngineLib.Point2D(
					Math.min(this.myX, inOtherAABB2D.myX),
					Math.min(this.myY, inOtherAABB2D.myY)
				)
			);
			aReturnAABB2D.setRightBottom(
				new ECGame.EngineLib.Point2D(
					Math.max(this.myX + this.myWidth, inOtherAABB2D.myX + inOtherAABB2D.myWidth),
					Math.max(this.myY + this.myHeight, inOtherAABB2D.myY + inOtherAABB2D.myHeight)
				)
			);
			return aReturnAABB2D;
		},
		
		getArea : function getArea()
		{
			return this.myWidth * this.myHeight;
		},
		
		getCenter : function getCenter()
		{
			return ECGame.EngineLib.Point2D.create(
				this.myX + this.myWidth / 2,
				this.myY + this.myHeight / 2
			);
		},
		
		getLeftTop : function getLeftTop()
		{
			return ECGame.EngineLib.Point2D.create(this.myX, this.myY);
		},
		setLeftTop : function setLeftTop(inPoint)
		{
			this.myX = inPoint.myX;
			this.myY = inPoint.myY;
		},
		
		getRightBottom : function getRightBottom()
		{
			return ECGame.EngineLib.Point2D.create(this.myX + this.myWidth, this.myY + this.myHeight);
		},
		setRightBottom : function setRightBottom(inPoint)
		{
			this.myWidth = Math.max(inPoint.myX - this.myX, 0);
			this.myHeight = Math.max(inPoint.myY - this.myY, 0);
		},
		
		getWidthHeight : function getWidthHeight()
		{
			return ECGame.EngineLib.Point2D.create(this.myWidth, this.myHeight);
		},
		setWidthHeight : function setWidthHeight(inWidthHeight)
		{
			this.myWidth = inWidthHeight.myX;
			this.myHeight = inWidthHeight.myY;
		},
		
		getRight : function getRight()
		{
			return this.myX + this.myWidth;
		},
		getLeft : function getLeft()
		{
			return this.myX;
		},
		getTop : function getTop()
		{
			return this.myY;
		},
		getBottom : function getBottom()
		{
			return this.myY + this.myHeight;
		}
	}
});

