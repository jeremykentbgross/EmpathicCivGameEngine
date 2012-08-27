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

//TODO depricated!
GameEngineLib.createGame2DCamera = function(instance, private)
{
	var temp = new GameEngineLib.Game2DCamera();
	instance = instance || {};
	
	for(property in temp)
	{
		instance[property] = temp[property]
	}
	for(property in temp.prototype)
	{
		instance[property] = temp.prototype[property];
	}
	
	return instance;
}







GameEngineLib.Game2DCamera = function Game2DCamera()
{
	if(!GameSystemVars.Network.isServer)
	{
		this._myRect = GameEngineLib.createGame2DAABB(
			0,
			0,
			GameInstance.Graphics.getWidth(),
			GameInstance.Graphics.getHeight()
		);
	}
	else
	{
		this._myRect = GameEngineLib.createGame2DAABB(
			0,
			0,
			GameSystemVars.Graphics.initWidth,
			GameSystemVars.Graphics.initHeight
		);
	}
}
GameEngineLib.Game2DCamera.prototype.constructor = GameEngineLib.Game2DCamera;




GameEngineLib.Game2DCamera.prototype.init = function init(inWidth, inHeight)
{
	if(inWidth &&inHeight)
		this._myRect = GameEngineLib.createGame2DAABB(0, 0, inWidth, inHeight);
}



GameEngineLib.Game2DCamera.prototype.centerOn = function centerOn(inTargetCenter, inMap)
{		
	var camPoint = inTargetCenter.subtract(this._myRect.getWidthHeight().multiply(0.5));
	
	//if the map does not wrap, clamp camera to within the world favoring the uper left corner
	if(inMap && inMap.isWrappable && !inMap.isWrappable())
	{
		camPoint = camPoint.componentMin(inMap.getMapLowerRight().subtract(this._myRect.getWidthHeight()));
		camPoint = camPoint.componentMax(GameEngineLib.createGame2DPoint(0,0));
	}
	
	this._myRect.setLeftTop(camPoint);
}



//TODO have actual target entity?  I think so
GameEngineLib.Game2DCamera.prototype.getTargetPosition = function getTargetPosition()
{
	return this._myRect.getCenter();
}

//TODO listen to graphics object for resizes?

//todo make this gameobject? with set target/map? then needs update.. eh?

GameEngineLib.Game2DCamera.prototype.getRect = function getRect()
{
	return this._myRect;
}
