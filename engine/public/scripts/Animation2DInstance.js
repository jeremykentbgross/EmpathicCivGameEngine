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

ECGame.EngineLib.Animation2DInstance = ECGame.EngineLib.Class.create({
	Constructor : function Animation2DInstance()
	{
		this.Renderable2D();
		this._animation = null;
		this._currentFrame = 0;
		this._timeAccumulator = 0;
		//TODO flags (pong, repeat, callback, etc)
		//TODO finished callback
		
	},
	Parents : [ECGame.EngineLib.Renderable2D],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{		
		update : function update(inDT)
		{
			var aCurrentFrame;
			
			aCurrentFrame = this._currentFrame;
			
			this._timeAccumulator += inDT;
			//Note: accum / 1000 => seconds; seconds * frameRate => frames
			this._currentFrame = Math.floor((this._timeAccumulator / 1000) * this._animation.getFrameRate());
			this._currentFrame = this._currentFrame % this._animation.getFrameCount();
			//TODO handle pinglong, loop or not, etc with callback(s)
			
			if(aCurrentFrame !== this._currentFrame)
			{
				return this._animation.getFrameEvents(this._currentFrame);
			}
			
			return null;
		},
		
		getAABB2D : function getAABB2D()
		{
			//TODO make set function for _myAnchorPosition so this can be updated ONLY when it is needed!
			//OPT: This is SUPER inoptimal
			return ECGame.EngineLib.AABB2D.create(
				this._myAABB.myX + this._myAnchorPosition.myX,
				this._myAABB.myY + this._myAnchorPosition.myY,
				this._myAABB.myWidth,
				this._myAABB.myHeight
			);
		},
		
		setAnimation : function setAnimation(inAnimation)
		{
			this._animation = inAnimation;
			this._myAABB = inAnimation.getAABB2D();
		},
		
		//TODO getFrameEvents(frameNum)
		
		render : function render(inGraphics)
		{
			this._animation.render(inGraphics, this._currentFrame, this._myAnchorPosition);
			if(ECGame.Settings.isDebugDraw_Sprite())
			{
				this.debugDraw(inGraphics);
			}
		},
		debugDraw : function debugDraw(inGraphics)
		{
			this._animation.debugDraw(inGraphics, this._currentFrame, this._myAnchorPosition);
		}
	}
});

