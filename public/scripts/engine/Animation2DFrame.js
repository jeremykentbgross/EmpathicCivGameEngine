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
		this._sourceRect = new ECGame.EngineLib.AABB2();
		this._origin = new ECGame.EngineLib.Point2();
		this._AABB = new ECGame.EngineLib.AABB2(
			-this._origin.myX,
			-this._origin.myY,
			this._sourceRect.myWidth,
			this._sourceRect.myHeight
		);
		//TODO frame events (sounds, etc)
	},
	Parents : [],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		//TODO update()//fires frame events OR getEvents()
		
		//TODO rename origin anchor? have anchor and origin?	//rename anchor because it is the same as a js global
		init : function init(inSrcRect, inOrigin /*TODO flags, other?*/)
		{
			this._sourceRect.copyFrom(inSrcRect);
			this._origin.copyFrom(inOrigin);
			this._AABB = new ECGame.EngineLib.AABB2(
				-this._origin.myX,
				-this._origin.myY,
				this._sourceRect.myWidth,
				this._sourceRect.myHeight
			);
			
			return this;
		},
		
		getAABB : function getAABB()
		{
			return this._AABB;
		},
		
		render : function render(inCanvas2DContext, inCameraRect, inImage, inPosition)
		{
			var dest = inPosition.subtract(this._origin).subtract(inCameraRect.getLeftTop());
			inCanvas2DContext.drawImage(
				inImage,
				this._sourceRect.myX,
				this._sourceRect.myY,
				this._sourceRect.myWidth,
				this._sourceRect.myHeight,
				dest.myX,
				dest.myY,
				this._sourceRect.myWidth,
				this._sourceRect.myHeight
			);
		},
		
		debugDraw : function debugDraw(inCanvas2DContext, inCameraRect, inPosition)
		{
			var dest, size, halfSize;
			
			dest = inPosition.subtract(this._origin).subtract(inCameraRect.getLeftTop());
			size = ECGame.Settings.Debug.Sprite_Origin_Size;
			halfSize = ECGame.Settings.Debug.Sprite_Origin_Size / 2;
			
			//draw AABB
			inCanvas2DContext.strokeStyle = ECGame.Settings.Debug.Sprite_AABB_DrawColor;
			inCanvas2DContext.strokeRect(
				dest.myX,
				dest.myY,
				this._sourceRect.myWidth,
				this._sourceRect.myHeight
			);
			
			//draw Origin
			inCanvas2DContext.fillStyle = ECGame.Settings.Debug.Sprite_Origin_DrawColor;
			dest = dest.add(this._origin);
			inCanvas2DContext.fillRect(
				dest.myX - halfSize,
				dest.myY - halfSize,
				size,
				size
			);
		}
	}
});