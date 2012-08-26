GameEngineLib.createGame2DAABB = function(inX, inY, inWidth, inHeight)
{
	var outRect = {};
	
	outRect.myX = inX || 0;
	outRect.myY = inY || 0;
	outRect.myWidth = inWidth || 0;
	outRect.myHeight = inHeight || 0;
	
	//TODO rename this Game2DAABB and make it (and point) have stuff in prototype
	
	outRect.containsRect = function(inOtherRect)
	{
		if(inOtherRect.myX < this.myX)//TODO maybe <= for all these??
			return false;
		if(inOtherRect.myY < this.myY)
			return false;
		if(this.myX + this.myWidth < inOtherRect.myX + inOtherRect.myWidth)
			return false;
		if(this.myY + this.myHeight < inOtherRect.myY + inOtherRect.myHeight)
			return false;
		
		return true;
	}
	
	outRect.intersectsRect = function(inOtherRect)
	{
		if(inOtherRect.myX + inOtherRect.myWidth <= this.myX)
			return false;
		if(inOtherRect.myY + inOtherRect.myHeight <= this.myY)
			return false;
		if(this.myX + this.myWidth <= inOtherRect.myX)
			return false;
		if(this.myY + this.myHeight <= inOtherRect.myY)
			return false;
		
		return true;
	}
	
	outRect.getIntersection = function(inOtherRect)
	{
		var x = Math.max(this.myX, inOtherRect.myX);
		var y = Math.max(this.myY, inOtherRect.myY);
		
		var outIntersection = GameEngineLib.createGame2DAABB(
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
	}
	
	outRect.getArea = function()
	{
		return this.myWidth * this.myHeight;
	}
	
	outRect.getCenter = function()
	{
		return GameEngineLib.createGame2DPoint(
			this.myX + this.myWidth / 2,
			this.myY + this.myHeight / 2
		);
	}
	
	outRect.getLeftTop = function()
	{
		return GameEngineLib.createGame2DPoint(this.myX, this.myY);
	}
	outRect.setLeftTop = function(inPoint)
	{
		this.myX = inPoint.myX;
		this.myY = inPoint.myY;
	}
	
	outRect.getRight = function()
	{
		return this.myX + this.myWidth;
	}
	outRect.getBottom = function()
	{
		return this.myY + this.myHeight;
	}
	
	outRect.getRightBottom = function()
	{
		return GameEngineLib.createGame2DPoint(this.myX + this.myWidth, this.myY + this.myHeight);
	}
	
	outRect.getLeftBottom = function()
	{
		return GameEngineLib.createGame2DPoint(this.myX, this.myY + this.myHeight);
	}
	
	outRect.getWidthHeight = function()
	{
		return GameEngineLib.createGame2DPoint(this.myWidth, this.myHeight);
	}
	
	outRect.copyFrom = function(inOther)
	{
		this.myX = inOther.myX;
		this.myY = inOther.myY;
		this.myWidth = inOther.myWidth;
		this.myHeight = inOther.myHeight;
	}
	
	//todo intersection, etc..
	
	return outRect;
}