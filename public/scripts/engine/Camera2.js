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

//TODO derive 2d camera from rect??

ECGame.EngineLib.Game2DCamera = function Game2DCamera()
{
	if(!ECGame.Settings.Network.isServer)
	{
		this._myRect = ECGame.EngineLib.AABB2.create(
			0,
			0,
			ECGame.instance.graphics.getWidth(),
			ECGame.instance.graphics.getHeight()
		);
	}
	else
	{
		this._myRect = ECGame.EngineLib.AABB2.create(
			0,
			0,
			ECGame.Settings.Graphics.initWidth,
			ECGame.Settings.Graphics.initHeight
		);
	}
};
ECGame.EngineLib.Game2DCamera.prototype.constructor = ECGame.EngineLib.Game2DCamera;



ECGame.EngineLib.Game2DCamera.create = function create()
{
	return new ECGame.EngineLib.Game2DCamera();
};



ECGame.EngineLib.Game2DCamera.prototype.init = function init(inWidth, inHeight)
{
	if(inWidth &&inHeight)
	{
		this._myRect = ECGame.EngineLib.AABB2.create(0, 0, inWidth, inHeight);
	}
};



ECGame.EngineLib.Game2DCamera.prototype.centerOn = function centerOn(inTargetCenter, inMap)
{		
	var camPoint = inTargetCenter.subtract(this._myRect.getWidthHeight().scale(0.5));
	
	//if the map does not wrap, clamp camera to within the world favoring the uper left corner
	if(inMap && inMap.isWrappable && !inMap.isWrappable())
	{
		camPoint = camPoint.componentMin(inMap.getMapLowerRight().subtract(this._myRect.getWidthHeight()));
		camPoint = camPoint.componentMax(ECGame.EngineLib.Point2.create(0,0));
	}
	
	this._myRect.setLeftTop(camPoint);
};



//TODO have actual target entity?  I think so
ECGame.EngineLib.Game2DCamera.prototype.getTargetPosition = function getTargetPosition()
{
	return this._myRect.getCenter();
};

//TODO listen to graphics object for resizes?

//TODO make this gameobject? with set target/map? then needs update.. eh?

ECGame.EngineLib.Game2DCamera.prototype.getRect = function getRect()
{
	return this._myRect;
};
