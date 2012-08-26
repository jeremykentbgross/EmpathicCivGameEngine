
//TODO deprecated
GameEngineLib.createGame2DAABB = function(inX, inY, inWidth, inHeight)
{
	return new GameEngineLib.Game2DAABB(inX, inY, inWidth, inHeight);
}






GameEngineLib.Game2DAABB = function Game2DAABB(inX, inY, inWidth, inHeight)
{
	this.myX = inX || 0;
	this.myY = inY || 0;
	this.myWidth = inWidth || 0;
	this.myHeight = inHeight || 0;
}
GameEngineLib.Game2DAABB.prototype.constructor = GameEngineLib.Game2DAABB;



GameEngineLib.Game2DAABB.prototype.containsRect = function containsRect(inOtherRect)
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



GameEngineLib.Game2DAABB.prototype.intersectsRect = function intersectsRect(inOtherRect)
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



GameEngineLib.Game2DAABB.prototype.getIntersection = function getIntersection(inOtherRect)
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



GameEngineLib.Game2DAABB.prototype.getArea = function getArea()
{
	return this.myWidth * this.myHeight;
}



GameEngineLib.Game2DAABB.prototype.getCenter = function getCenter()
{
	return GameEngineLib.createGame2DPoint(
		this.myX + this.myWidth / 2,
		this.myY + this.myHeight / 2
	);
}



GameEngineLib.Game2DAABB.prototype.getLeftTop = function getLeftTop()
{
	return GameEngineLib.createGame2DPoint(this.myX, this.myY);
}



GameEngineLib.Game2DAABB.prototype.setLeftTop = function setLeftTop(inPoint)
{
	this.myX = inPoint.myX;
	this.myY = inPoint.myY;
}



GameEngineLib.Game2DAABB.prototype.getRight = function getRight()
{
	return this.myX + this.myWidth;
}



GameEngineLib.Game2DAABB.prototype.getBottom = function getBottom()
{
	return this.myY + this.myHeight;
}



GameEngineLib.Game2DAABB.prototype.getRightBottom = function getRightBottom()
{
	return GameEngineLib.createGame2DPoint(this.myX + this.myWidth, this.myY + this.myHeight);
}



GameEngineLib.Game2DAABB.prototype.getLeftBottom = function getLeftBottom()
{
	return GameEngineLib.createGame2DPoint(this.myX, this.myY + this.myHeight);
}



GameEngineLib.Game2DAABB.prototype.getWidthHeight = function getWidthHeight()
{
	return GameEngineLib.createGame2DPoint(this.myWidth, this.myHeight);
}



GameEngineLib.Game2DAABB.prototype.copyFrom = function copyFrom(inOther)
{
	this.myX = inOther.myX;
	this.myY = inOther.myY;
	this.myWidth = inOther.myWidth;
	this.myHeight = inOther.myHeight;
}

