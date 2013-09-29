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

ECGame.EngineLib.Tile2DRenderable = ECGame.EngineLib.Class.create({
	Constructor : function Tile2DRenderable()
	{
		this.Renderable2D();
		this._myTileValue = 0;
		this._myOwnerMap = null;	//TODO get rid of this and have the TileDescription instead
	},
	Parents : [ECGame.EngineLib.Renderable2D],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		init : function init(inAABB2D, inLayer, inAnchorPosition, inTileValue, inOwnerMap)
		{
			this._myAABB = inAABB2D;
			this._myLayer = inLayer;
			this._myAnchorPosition = inAnchorPosition;
			this._myTileValue = inTileValue;
			this._myOwnerMap = inOwnerMap;
		},
		
		render : function render(inGraphics)
		{
			if(ECGame.Settings.isDebugDraw_Map())
			{
				return;
			}
			this._myOwnerMap._myTileSet.renderTile(//THIS IS ALL WRONG!!
				inGraphics,
				this._myTileValue,
				this._myAnchorPosition
			);
		}
		
		//TODO debug draw
	}
});