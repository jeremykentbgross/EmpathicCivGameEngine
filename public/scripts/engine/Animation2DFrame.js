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

GameEngineLib.Animation2DFrame = GameEngineLib.Class({
	Constructor : function Animation2DFrame()
	{
		this._sourceRect = new GameEngineLib.Game2DAABB();
		this._origin = new GameEngineLib.Game2DPoint();
		this._AABB = new GameEngineLib.Game2DAABB(
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
		
		init : function init(inSrcRect, inOrigin /*TODO flags, other?*/)
		{
			this._sourceRect.copyFrom(inSrcRect);
			this._origin.copyFrom(inOrigin);
			this._AABB = new GameEngineLib.Game2DAABB(
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
			var dest = inPosition.sub(this._origin).sub(inCameraRect.getLeftTop());
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
			
			dest = inPosition.sub(this._origin).sub(inCameraRect.getLeftTop());
			size = GameSystemVars.Debug.Sprite_Origin_Size;
			halfSize = GameSystemVars.Debug.Sprite_Origin_Size / 2;
			
			//draw AABB
			inCanvas2DContext.fillStyle = GameSystemVars.Debug.Sprite_AABB_DrawColor;
			inCanvas2DContext.strokeRect(
				dest.myX,
				dest.myY,
				this._sourceRect.myWidth,
				this._sourceRect.myHeight
			);
			
			//draw Origin
			inCanvas2DContext.fillStyle = GameSystemVars.Debug.Sprite_Origin_DrawColor;
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