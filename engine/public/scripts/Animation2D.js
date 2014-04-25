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

ECGame.EngineLib.Animation2D = ECGame.EngineLib.Class.create({
	Constructor : function Animation2D()
	{
		this._myImage = null;
		this._myAnimationFrames = [];
		this._myFrameRate = 30;
		this._myAABB2D = ECGame.EngineLib.AABB2D.create(
			Number.MAX_VALUE,
			Number.MAX_VALUE,
			-Number.MAX_VALUE,
			-Number.MAX_VALUE
		);
	},
	Parents : [],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		init : function init(inImageName, inFrameRate, inFrames)
		{
			var i;
			
			if(!ECGame.Settings.Network.isServer)
			{
				ECGame.instance.getAssetManager().loadImage(inImageName, this);
			}
			
			this._myFrameRate = inFrameRate;
			this._myAnimationFrames = inFrames;
			
			for(i = 0; i < inFrames.length; ++i)
			{
				this._myAABB2D = this._myAABB2D.getUnion(inFrames[i].getAABB2D());
			}
		},
		
		setImage : function setImage(inImage)
		{
			this._myImage = inImage;
		},
		
		render : function render(inGraphics, inFrame, inPosition)
		{
			this._myAnimationFrames[inFrame].render(inGraphics, this._myImage, inPosition);
		},
		
		getFrameRate : function getFrameRate()
		{
			return this._myFrameRate;
		},
		getFrameCount : function getFrameCount()
		{
			return this._myAnimationFrames.length;
		},
		getFrameEvents : function getFrameEvents(inCurrentFrame)
		{
			return this._myAnimationFrames[inCurrentFrame].getFrameEvents();
		},
		
		getAABB2D : function getAABB2D()
		{
			return this._myAABB2D;
		},
		
		debugDraw : function debugDraw(inGraphics, inFrame, inPosition)
		{
			var aDestination = this._myAABB2D.getLeftTop().add(inPosition);
			
			//draw AABB
			inGraphics.setFillStyle(ECGame.Settings.Debug.Sprite_AABB_DrawColor);
			inGraphics.strokeRectXYWH(
				aDestination.myX,
				aDestination.myY,
				this._myAABB2D.myWidth,
				this._myAABB2D.myHeight
			);
			
			this._myAnimationFrames[inFrame].debugDraw(inGraphics, inPosition);
		}
	}
});
