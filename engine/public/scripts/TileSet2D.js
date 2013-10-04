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


//TODO should be depricted => functions moved to Tile2DInstance/Description or map class
ECGame.EngineLib.TileSet2D = ECGame.EngineLib.Class.create(//TODO TileDesc/Animation/multi-layers??
{
	Constructor : function TileSet2D()
	{
		this.GameObject();
		
		this._myTiles =	[];
		/*
		//TODO target impl:
		animFrame =
		{
			filename
			image
			anchor	//unscaled
			scaledRect //optional
			layer
			//triggers/events/physics object changes
		}
		animation =
		{
			animFrames
			speed
			bounding box	//THIS IS related 2 the ONE IN THE SCENE MANAGER TREE??
		}
		tileDesc =
		{
			animation(s)
			physics + other properties (sound effects, etc)
		}
		tiles = tileDesc[];
		*/
	},
	
	Parents : [ECGame.EngineLib.GameObject],
	
	flags : {},
	
	ChainUp : [],
	ChainDown : [],
	
	Definition :
	{
		//TODO TileDescription struct/class
		init : function init(inTiles)
		{
			var i, tile;
			this._myTiles = inTiles || this._myTiles;
			
			for(i = 0; i < this._myTiles.length; ++i)
			{
				tile = this._myTiles[i];
				if(!ECGame.Settings.Network.isServer)//TODO should the function return strait away?
				{
					ECGame.instance.getAssetManager().loadImage(tile.fileName, tile);
				}
				this._maxLayers = tile._myLayer;//TODO is this needed? maybe for map floors vs tileset layer (not used atm I think)
			}
		},
		
		getNumberOfTiles : function getNumberOfTiles()
		{
			return this._myTiles.length;
		},

		renderTile : function renderTile(inGraphics, inID, inTargetPoint)
		{
			/*
			//TODO Allow scaling?
			context . drawImage(image, dx, dy)
			context . drawImage(image, dx, dy, dw, dh)
			context . drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)
			=>tile.scaledRect
			*/
			var tile = this._myTiles[inID];
			inGraphics.drawImage(
				tile.image,
				inTargetPoint.subtract(tile.anchor)//TODO consider possible =>tile.scaledRect
			);
		},

		//TODO depricate, should be debugdraw for the tile
		renderTileInRect : function renderTileInRect(inGraphics, inID, inTargetRect)
		{
			//TODO should be src/dest rect draw
			inGraphics.drawImageInRect(this._myTiles[inID].image, inTargetRect);
		},

		getTileRenderRect : function getTileRenderRect(inID, inPosition)
		{
			var tile = this._myTiles[inID];
			inPosition = inPosition || ECGame.EngineLib.Point2.create();
			
			return ECGame.EngineLib.AABB2D.create(
				inPosition.myX - tile.anchor.myX,
				inPosition.myY - tile.anchor.myY,
				tile.size.myX,//image.width,//todo consider possible =>tile.scaledRect
				tile.size.myY//image.height
			);
		},

		getTileLayer : function getTileLayer(inID)
		{
			return this._myTiles[inID]._myLayer;
		},
		
		getTileMiniMapColor : function getTileMiniMapColor(inID)
		{
			return this._myTiles[inID].miniMapColor;
		},
		
		getPhysicsRect : function getPhysicsRect(inID, inPosition)
		{
			var physicsRect = this._myTiles[inID].physics;
			
			if(!physicsRect)
			{
				return null;
			}
			
			return ECGame.EngineLib.AABB2D.create(
				inPosition.myX + physicsRect.myX,
				inPosition.myY + physicsRect.myY,
				physicsRect.myWidth,//todo consider possible =>tile.scaledRect
				physicsRect.myHeight
			);
		},
		//set<classname>NetDirty
		clearNetDirty : function clearNetDirty(){return;},
		cleanup : function cleanup(){return;},//TODO
		serialize : function serialize(){return;},//TODO
		copyFrom : function copyFrom(/*inOther*/){return;}//TODO
	}
});