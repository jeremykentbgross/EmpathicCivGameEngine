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
		
		this._myAnimation = null;
		this._myCurrentFrame = 0;
		this._myAccumulatedTime = 0;

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
			var anUpdateStartFrame;
			
			anUpdateStartFrame = this._myCurrentFrame;
			
			this._myAccumulatedTime += inDT;
			
			//Note: accum / 1000 => seconds; seconds * frameRate => frames
			this._myCurrentFrame = Math.floor((this._myAccumulatedTime / 1000) * this._myAnimation.getFrameRate());
			this._myCurrentFrame = this._myCurrentFrame % this._myAnimation.getFrameCount();
			
			//TODO handle pinglong, loop or not, etc with callback(s)
			
			if(anUpdateStartFrame !== this._myCurrentFrame)
			{
				return this._myAnimation.getFrameEvents(this._myCurrentFrame);
			}
			
			return null;
		},
		
		render : function render(inGraphics)
		{
			this._myAnimation.render(inGraphics, this._myCurrentFrame, this._myAnchorPosition);
			if(ECGame.Settings.isDebugDraw_Sprite())
			{
				this.debugDraw(inGraphics);
			}
		},
		
		getAABB2D : function getAABB2D()
		{
			//TODO make set function for _myAnchorPosition so this can be updated ONLY when it is needed! This is SUPER unoptimal!
			return ECGame.EngineLib.AABB2D.create(
				this._myAABB.myX + this._myAnchorPosition.myX,
				this._myAABB.myY + this._myAnchorPosition.myY,
				this._myAABB.myWidth,
				this._myAABB.myHeight
			);
		},
		
		setAnimation : function setAnimation(inAnimation)
		{
			this._myAnimation = inAnimation;
			this._myAABB = inAnimation.getAABB2D();
		},
		
		debugDraw : function debugDraw(inGraphics)
		{
			this._myAnimation.debugDraw(inGraphics, this._myCurrentFrame, this._myAnchorPosition);
		}
	}
});

