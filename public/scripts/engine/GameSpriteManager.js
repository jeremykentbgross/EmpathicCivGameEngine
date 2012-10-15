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

GameEngineLib.createGameSpriteManager = function(instance, PRIVATE)
{
	instance = instance || {};
	PRIVATE = PRIVATE || {};
	
	//TODO setup debug stuff
	
	//TODO set map directly
	instance.init = function(inMapSizeInTiles, inTileSize)
	{
		PRIVATE.myMapSizeInTiles = inMapSizeInTiles;	//todo round up to power of 2
		PRIVATE.myTileSize = inTileSize;
		PRIVATE.myMapSize = PRIVATE.myMapSizeInTiles * PRIVATE.myTileSize;
		
		PRIVATE.mySceneQuadTree = GameEngineLib.GameQuadTree.create();
		PRIVATE.mySceneQuadTree.init(
			GameEngineLib.createGame2DAABB(0, 0, PRIVATE.myMapSize, PRIVATE.myMapSize),
			PRIVATE.myTileSize
		);
		
		//PRIVATE.myNextID = 0;
		//PRIVATE.mySprites = {};
		
		//hack
		//todo have tileset as a param too..?
		/*PRIVATE.myTileSet = GameEngineLib.createGameCanvasTileSet();
		PRIVATE.myTileSet.init(
			inTileSize
			//,filenames
		);*/
	}
	
	instance.createSprite = function()
	{
		var outSpriteHandle;
		var sprite;
		
		sprite =
		{
			myGame2DAABB : GameEngineLib.createGame2DAABB(),//bounding rect
			myPositionLocator : GameEngineLib.createGame2DPoint(),
			//animation and other bullshit?
			//myID : "SpriteID" + (++PRIVATE.myNextID).toString(),
		};
		//TODO linked list instead? why does this and physics have this? (not active?)
		//PRIVATE.mySprites[sprite.myID] = sprite;
		
		outSpriteHandle = {};
		
		outSpriteHandle.setRect
		
		return outSpriteHandle;
	}
	
	/*
	sprite
	{
		myGame2DAABB //bounding box of tile
		//art asset
		myOriginPoint
	}
	*/
	
	//TODO insert sprite
	instance.setTile = function(inX, inY, inTileValue)
	{
		if(inX < 0 || PRIVATE.myMapSizeInTiles <= inX
			|| inY < 0 || PRIVATE.myMapSizeInTiles <= inY)
			return;
			
		var tile = {};
		tile.myGame2DAABB = GameEngineLib.createGame2DAABB(
			inX * PRIVATE.myTileSize,
			inY * PRIVATE.myTileSize,
			PRIVATE.myTileSize,
			PRIVATE.myTileSize
		);
		tile.myTileValue = inTileValue;
		
		//insert exclusive!
		PRIVATE.mySceneQuadTree.deleteContained(tile.myGame2DAABB);
		PRIVATE.mySceneQuadTree.insertToSmallestContaining(tile);
	}
	
	//TODO remove sprite
	instance.clearTile = function(inX, inY)
	{
		if(inX < 0 || PRIVATE.myMapSizeInTiles <= inX
			|| inY < 0 || PRIVATE.myMapSizeInTiles <= inY)
			return;
			
		var tile = {};
		tile.myGame2DAABB = GameEngineLib.createGame2DAABB(
			inX * PRIVATE.myTileSize,
			inY * PRIVATE.myTileSize,
			PRIVATE.myTileSize,
			PRIVATE.myTileSize
		);
		
		PRIVATE.mySceneQuadTree.deleteContained(tile.myGame2DAABB);//todo should this be delete item?
	}
	
	//TODO sort them by base
	instance.render = function(inCanvas2DContext, inCameraRect)
	{
		PRIVATE.mySceneQuadTree.walk(
			function(item)
			{
				var itemRect = item.myGame2DAABB;
				PRIVATE.myTileSet.renderTile(
					inCanvas2DContext,
					item.myTileValue,
					GameEngineLib.createGame2DPoint
					(
						itemRect.myX - inCameraRect.myX,
						itemRect.myY - inCameraRect.myY
					)
				)
			},
			inCameraRect
		);
	}
	
	instance.toTileCoordinate = function(inWorldCoordinate)
	{
		return Math.floor(inWorldCoordinate / PRIVATE.myTileSize);
	}
	
	//debug draw tree
	instance.debugDraw = function(inCanvas2DContext, inCameraRect, inColor)
	{
		PRIVATE.mySceneQuadTree.debugDraw(inCanvas2DContext, inCameraRect, inColor);
	}
	
	/*
	//TODO handle warping correctly if the map does it
	instance.isWrappable = function()
	{
		return false;//HACK make this a value that can be set/cleared
	}
	*/
	
	return instance;
}