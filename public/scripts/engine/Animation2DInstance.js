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

GameEngineLib.Animation2DInstance = GameEngineLib.Class({
	Constructor : function Animation2DInstance()
	{
		this.GameRenderable2D();
		this.animation = null;
		this._currentFrame = 0;
		this._timeAccumulator = 0;
		//TODO flags (pong, repeat, callback, etc)
		//TODO finished callback
		
	},
	Parents : [GameEngineLib.GameRenderable2D],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{		
		isUpdating : function isUpdating(){	return true;	},//TODO should get rid of these!!
		update : function update(inDT)
		{
			this._timeAccumulator += inDT;
			//accum / 1000 (== seconds) * frameRate (==frames)
			this._currentFrame = Math.floor((this._timeAccumulator / 1000) * this.animation.getFrameRate());
			this._currentFrame = this._currentFrame % this.animation.getFrameCount();
		},
		
		//TODO getFrameEvents(frameNum)
		
		render : function render(inCanvas2DContext, inCameraRect)
		{
			this.animation.render(inCanvas2DContext, inCameraRect, this._currentFrame, this.anchorPosition);
		},
		debugDraw : function debugDraw(inCanvas2DContext, inCameraRect)
		{
			this.animation.debugDraw(inCanvas2DContext, inCameraRect, this._currentFrame, this.anchorPosition);
		}
	}
});

