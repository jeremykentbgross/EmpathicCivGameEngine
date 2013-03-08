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


//TODO should be merged with Map class
ECGame.EngineLib.Game2DTileSet = ECGame.EngineLib.Class.create(
{
	Constructor : function Game2DTileSet()
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
		init : function init(inTiles)
		{
			var i;
			this._myTiles = inTiles || this._myTiles;
			
			for(i = 0; i < this._myTiles.length; ++i)
			{
				var tile = this._myTiles[i];
				if(!ECGame.Settings.Network.isServer)//TODO should the function return strait away?
				{
					ECGame.instance.assetManager.loadImage(tile.fileName, tile);
				}
				this._maxLayers = tile.layer;//TODO is this needed? maybe for map floors vs tileset layer (not used atm I think)
			}
		},

		renderTile : function renderTile(inCanvasContext, inID, inTargetPoint)
		{
			/*
			//TODO Allow scaling?
			context . drawImage(image, dx, dy)
			context . drawImage(image, dx, dy, dw, dh)
			context . drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)
			=>tile.scaledRect
			*/
			var tile = this._myTiles[inID];
			inCanvasContext.drawImage(
				tile.image,
				inTargetPoint.myX - tile.anchor.myX,//todo consider possible =>tile.scaledRect
				inTargetPoint.myY - tile.anchor.myY
			);
		},

		renderTileInRect : function renderTileInRect(inCanvasContext, inID, inTargetRect)
		{
			inCanvasContext.drawImage(
				this._myTiles[inID].image,
				inTargetRect.myX,
				inTargetRect.myY,
				inTargetRect.myWidth,
				inTargetRect.myHeight
			);
		},

		getTileRect : function getTileRect(inID, inPosition)
		{
			var tile = this._myTiles[inID];
			inPosition = inPosition || ECGame.EngineLib.createGame2DPoint();
			
			return ECGame.EngineLib.createGame2DAABB(
				inPosition.myX - tile.anchor.myX,
				inPosition.myY - tile.anchor.myY,
				tile.size.myX,//image.width,//todo consider possible =>tile.scaledRect
				tile.size.myY//image.height
			);
		},

		getTileLayer : function getTileLayer(inID)
		{
			return this._myTiles[inID].layer;
		},
		
		getPhysicsRect : function getPhysicsRect(inID, inPosition)
		{
			var physicsRect = this._myTiles[inID].physics;
			
			if(!physicsRect)
			{
				return null;
			}
			
			return ECGame.EngineLib.createGame2DAABB(
				inPosition.myX + physicsRect.myX,
				inPosition.myY + physicsRect.myY,
				physicsRect.myWidth,//todo consider possible =>tile.scaledRect
				physicsRect.myHeight
			);
		},
		
		destroy : function destroy(){},//TODO
		serialize : function serialize(){},//TODO
		copyFrom : function copyFrom(inOther){}//TODO
	}
});