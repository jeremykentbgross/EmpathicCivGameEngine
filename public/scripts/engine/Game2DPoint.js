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

