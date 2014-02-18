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

ECGame.EngineLib.TileRenderable2D = ECGame.EngineLib.Class.create({
	Constructor : function TileRenderable2D()
	{
		this.Renderable2D();
		
		this._myTileDescription = null;
	},
	Parents : [ECGame.EngineLib.Renderable2D],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		init : function init(inAABB2D, inDepth, inAnchorPosition, inTileDescription)
		{
			//set in parent class init (not called from here)
			this._myAABB = inAABB2D;
			this._myDepth = inDepth;
			this._myAnchorPosition = inAnchorPosition;
			
			//class specific
			this._myTileDescription = inTileDescription;
		},
		
		render : function render(inGraphics)
		{
			if(ECGame.Settings.isDebugDraw_Map())
			{
				return;
			}
			
			/*
			//TODO Allow scaling?
			context . drawImage(image, dx, dy)
			context . drawImage(image, dx, dy, dw, dh)
			context . drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)
			=>tile.scaledRect
			*/
			
			inGraphics.drawImage(
				this._myTileDescription.getImage(),
				this._myAnchorPosition.subtract(this._myTileDescription.getAnchor())//TODO src rect??
			);
		}
	}
});