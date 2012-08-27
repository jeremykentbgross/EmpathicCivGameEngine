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

GameEngineLib.createGame2DTileSet = function(instance, private)
{
	instance = instance || {};
	private = private || {};
	
	//TODO debug info
		
	private.myTiles =	[];
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
	
	
	instance.init = function(inTiles)
	{
		private.myTiles = inTiles || private.myTiles;
		
		for(var i = 0; i < private.myTiles.length; ++i)
		{
			var tile = private.myTiles[i];
			if(!GameSystemVars.Network.isServer)
				GameInstance.AssetManager.loadImage(tile.fileName, tile);
			private.maxLayers = tile.layer;//TODO is this needed? maybe for map floors vs tileset layer
		}
	}

	
	instance.renderTile = function(inCanvasContext, inID, inTargetPoint)
	{
		/*
		//TODO Allow scaling?
		context . drawImage(image, dx, dy)
		context . drawImage(image, dx, dy, dw, dh)
		context . drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)
		=>tile.scaledRect
		*/
		var tile = private.myTiles[inID];
		inCanvasContext.drawImage(
			tile.image,
			inTargetPoint.myX - tile.anchor.myX,//todo consider possible =>tile.scaledRect
			inTargetPoint.myY - tile.anchor.myY
		);
	}
	
	instance.renderTileInRect = function(inCanvasContext, inID, inTargetRect)
	{
		inCanvasContext.drawImage(
			private.myTiles[inID].image,
			inTargetRect.myX,
			inTargetRect.myY,
			inTargetRect.myWidth,
			inTargetRect.myHeight
		);
	}
	
	instance.getTileRect = function(inID, inPosition)
	{
		var tile = private.myTiles[inID];
		inPosition = inPosition || GameEngineLib.createGame2DPoint();
		
		return GameEngineLib.createGame2DAABB(
			inPosition.myX - tile.anchor.myX,
			inPosition.myY - tile.anchor.myY,
			tile.size.myX,//image.width,//todo consider possible =>tile.scaledRect
			tile.size.myY//image.height
		);
	}
	
	instance.getTileLayer = function(inID)
	{
		return private.myTiles[inID].layer;
	}
	
	instance.getPhysicsRect = function(inID, inPosition)
	{
		var physicsRect = private.myTiles[inID].physics;
		
		if(!physicsRect)
			return null;
		
		return GameEngineLib.createGame2DAABB(
			inPosition.myX + physicsRect.myX,
			inPosition.myY + physicsRect.myY,
			physicsRect.myWidth,//todo consider possible =>tile.scaledRect
			physicsRect.myHeight
		);
	}
	
	return instance;
}