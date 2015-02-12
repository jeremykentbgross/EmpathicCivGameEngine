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
		this._myAnimationSpeed = 1;

		//TODO flags (pong, repeat, callback, etc)

		//TODO finished callback
	},
	Parents : [ECGame.EngineLib.Renderable2D],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{		
		update : function update(inUpdateData)
		{
			var anUpdateStartFrame;
			
			if(!this._myAnimation)
			{
				return;
			}
			
			anUpdateStartFrame = this._myCurrentFrame;
			
			this._myAccumulatedTime += inUpdateData.myAverageDeltaTime * this._myAnimationSpeed;
			while(this._myAccumulatedTime < 0)
			{
				this._myAccumulatedTime += this._myAnimation.getLength();
			}
			
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
			if(!this._myAnimation)
			{
				return;
			}
			
			this._myAnimation.render(inGraphics, this._myCurrentFrame, this._myAnchorPosition);
			if(ECGame.Settings.isDebugDraw_Sprite())
			{
				this.debugDraw(inGraphics);
			}
		},
		
		setAnimationSpeed : function setAnimationSpeed(inSpeed)
		{
			this._myAnimationSpeed = inSpeed;
		},
		
		//TODO may need to remove from scene graph and then re-add for these to work properly!!!
		setAnimation : function setAnimation(inAnimation)
		{
			if(this.isInTree())
			{
				console.warn("Already in scene graph, changing animation might change AABB.");
			}
			
			this._myAnimation = inAnimation;
			if(this._myAnimation)
			{
				this._myAABB.copyFrom(inAnimation.getAABB2D());
			}
			else
			{
				this._myAABB.init(0, 0, 10, 10);// = ECGame.EngineLib.AABB2D.create(0,0,10,10);//some small aabb
			}
		},
		
		debugDraw : function debugDraw(inGraphics)
		{
			this._myAnimation.debugDraw(inGraphics, this._myCurrentFrame, this._myAnchorPosition);
		}
	}
});

