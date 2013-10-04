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

ECGame.EngineLib.Animation2DFrame = ECGame.EngineLib.Class.create({
	Constructor : function Animation2DFrame()
	{
		this._sourceRect = ECGame.EngineLib.AABB2D.create();
		this._origin = new ECGame.EngineLib.Point2();
		this._myAABB = ECGame.EngineLib.AABB2D.create(
			-this._origin.myX,
			-this._origin.myY,
			this._sourceRect.myWidth,
			this._sourceRect.myHeight
		);
		this._myFrameEvents = null;
	},
	Parents : [],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		//TODO update()//fires frame events OR getEvents()
		
		//TODO rename origin anchor? have anchor and origin?	//rename anchor because it is the same as a js global
		init : function init(inSrcRect, inOrigin, inFrameEvents /*TODO flags, other?*/)
		{
			this._sourceRect.copyFrom(inSrcRect);
			this._origin.copyFrom(inOrigin);
			this._myAABB = ECGame.EngineLib.AABB2D.create(
				-this._origin.myX,
				-this._origin.myY,
				this._sourceRect.myWidth,
				this._sourceRect.myHeight
			);
			this._myFrameEvents = inFrameEvents || [];
			
			return this;
		},
		
		getFrameEvents : function getFrameEvents()
		{
			var outEvents, i;
			
			outEvents = [];
			for(i = 0; i < this._myFrameEvents.length; ++i)
			{
				outEvents[i] = this._myFrameEvents[i].clone();
			}
			
			return outEvents;
		},
		
		getAABB : function getAABB()
		{
			return this._myAABB;
		},
		
		render : function render(inGraphics, inImage, inPosition)
		{
			inGraphics.drawImageSection(
				inImage,
				this._sourceRect,
				inPosition.subtract(this._origin)
			);
		},
		
		debugDraw : function debugDraw(inGraphics, inPosition)
		{
			var aDestination
				,aSize
				,aHalfSize
				;
			
			aDestination = inPosition.subtract(this._origin);
			aSize = ECGame.Settings.Debug.Sprite_Origin_Size;
			aHalfSize = aSize / 2;
			
			//draw AABB
			inGraphics.setStrokeStyle(ECGame.Settings.Debug.Sprite_AABB_DrawColor);
			inGraphics.strokeRectXYWH(
				aDestination.myX,
				aDestination.myY,
				this._sourceRect.myWidth,
				this._sourceRect.myHeight
			);
			
			//draw Origin
			inGraphics.setFillStyle(ECGame.Settings.Debug.Sprite_Origin_DrawColor);
			aDestination = aDestination.add(this._origin);
			inGraphics.fillRectXYWH(
				aDestination.myX - aHalfSize,
				aDestination.myY - aHalfSize,
				aSize,
				aSize
			);
		}
	}
});