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

ECGame.EngineLib.TileInstance2D = ECGame.EngineLib.Class.create({
	Constructor : function TileInstance2D()
	{
		this.QuadTreeItem(null/*aabb*/);
		
		this._myTileDescription = null;
		this._myPhysicsObject = null;
		this._myTileRenderable2D = null;
	},
	Parents : [ECGame.EngineLib.QuadTreeItem],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		//TODO change this so that init takes TileDescription and creates everything inside instead
		//	of in TileDescription2D.createTileInstance2D; then make some kind of cleanup in this class too
		init : function init(inTileRect, inTileDescription, inTileRenderable, inPhysicsObject)
		{
			this._myAABB = inTileRect;
			
			this._myTileDescription = inTileDescription;
			this._myTileRenderable2D = inTileRenderable;
			this._myPhysicsObject = inPhysicsObject;
			
			if(inPhysicsObject)
			{
				inPhysicsObject.setOwner(this);
			}
		}
		
		,getRenderable : function getRenderable()
		{
			return this._myTileRenderable2D;
		}
		
		,debugDraw : function debugDraw(inGraphics)
		{
			inGraphics.drawImageInRect(this._myTileDescription.getImage(), this._myAABB);
		}
		
		/*,release : function release()
		{
			//TODO remove this from the tree (parent class)
			//TODO move (from tilemap) release physics and renderable
		}*/
	}
});