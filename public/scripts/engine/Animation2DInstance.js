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
		this._animation = null;
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
			//Note: accum / 1000 => seconds; seconds * frameRate => frames
			this._currentFrame = Math.floor((this._timeAccumulator / 1000) * this._animation.getFrameRate());
			this._currentFrame = this._currentFrame % this._animation.getFrameCount();
			//TODO handle pinglong, loop or not, etc with callback(s)
		},
		
		getAABB : function getAABB()
		{
			//TODO make set function for anchorPosition so this can be updated ONLY when it is needed!
			//OPT: This is SUPER inoptimal
			return new GameEngineLib.Game2DAABB(
				this._AABB.myX + this.anchorPosition.myX,
				this._AABB.myY + this.anchorPosition.myY,
				this._AABB.myWidth,
				this._AABB.myHeight
			);
		},
		
		setAnimation : function setAnimation(inAnimation)
		{
			this._animation = inAnimation;
			this._AABB = inAnimation.getAABB();
		},
		
		//TODO getFrameEvents(frameNum)
		
		render : function render(inCanvas2DContext, inCameraRect)
		{
			this._animation.render(inCanvas2DContext, inCameraRect, this._currentFrame, this.anchorPosition);
			if(GameSystemVars.Debug.Sprite_Draw)
			{
				this.debugDraw(inCanvas2DContext, inCameraRect);
			}
		},
		debugDraw : function debugDraw(inCanvas2DContext, inCameraRect)
		{
			this._animation.debugDraw(inCanvas2DContext, inCameraRect, this._currentFrame, this.anchorPosition);
		}
	}
});

