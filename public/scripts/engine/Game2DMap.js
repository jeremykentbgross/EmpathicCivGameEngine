GameEngineLib.createGame2DMap = function(instance, private)
{
	instance = instance || {};
	private = private || {};
	
	//todo debug info
	
	instance.init = function(inMapSizeInTiles, inTileSize, inTileSet)
	{
		private.myMapSizeInTiles = inMapSizeInTiles;	//todo round up to power of 2
		private.myTileSize = inTileSize;
		private.myMapSize = private.myMapSizeInTiles * private.myTileSize;
		
		private.myTileMapTree = GameEngineLib.createGameQuadTree();
		private.myTileMapTree.init(
			GameEngineLib.createGame2DAABB(0, 0, private.myMapSize, private.myMapSize),
			private.myTileSize
		);
		
		private.myTileSet = inTileSet;
	}
	
	instance.setTileSet = function(inTileSet)
	{
		//TODO clean current tilesets physics and scenegraph info
		
		private.myTileSet = inTileSet;
		
		//TODO walk new tiles tiles and reinsert to physics and scenegraph
	}
	
	instance.addedToWorld = function(inWorld)
	{
		private.myWorld = inWorld;
		//TODO add physics stuff and renderables
	}
	//TODO removed from world? and add remove physics stuff from world?
	
	instance.getMapLowerRight = function()
	{
		return GameEngineLib.createGame2DPoint(private.myMapSize, private.myMapSize);
	}
	
	instance.setTile = function(inX, inY, inTileValue)
	{
		if(inX < 0 || private.myMapSizeInTiles <= inX
			|| inY < 0 || private.myMapSizeInTiles <= inY
			//todo inTileValue is in range too
			)
			return;
		
		var position = GameEngineLib.createGame2DPoint(
			inX * private.myTileSize,
			inY * private.myTileSize
		);
		
		var tile = {};
		
		//setup for the tilemap tree
		//TODO rename tree rects as such
		tile.myGame2DAABB = GameEngineLib.createGame2DAABB(
			position.myX,
			position.myY,
			private.myTileSize,
			private.myTileSize
		);
		tile.myTileValue = inTileValue;
		
		//if the tile is the same as what is there, don't delete it and return
		var duplicate = false;
		private.myTileMapTree.walk(
			function(item)
			{
				if(item.myTileValue === inTileValue)
					duplicate = true;
			},
			tile.myGame2DAABB
		);
		if(duplicate)
		{
			return;
		}
		
		//insert exclusively! So delete the old one first
		private.eraseTile(tile);
		
		//setup for scenegraph
		tile.sceneGraphRenderable =
		{
			myLayer : 0 +  private.myTileSet.getTileLayer(inTileValue),
			myAnchorPosition : position,//TODO rename anchorPosition?
			myGame2DAABB : private.myTileSet.getTileRect(inTileValue, position),
			render : function(inCanvas2DContext, inCameraRect)
			{
				if(GameSystemVars.DEBUG && GameSystemVars.Debug.Map_Draw)
					return;
				private.myTileSet.renderTile(
					inCanvas2DContext,
					tile.myTileValue,
					GameEngineLib.createGame2DPoint(
						this.myAnchorPosition.myX - inCameraRect.myX,
						this.myAnchorPosition.myY - inCameraRect.myY
					)
				);
			}
		};
		
		//setup physics objects
		var physicsRect = private.myTileSet.getPhysicsRect(inTileValue, position);
		if(physicsRect)
		{
			//note if need be, could use a tree to merge physics objects to nearest squares for optimization
			tile.physicsObj = private.myWorld.getPhysics().createNewPhysicsObject();
			tile.physicsObj.setGame2DAABB(physicsRect);
		}		
		
		//insert to tilemap
		private.myTileMapTree.insertToSmallestContaining(tile);
		
		//insert to scenegraph
		private.myWorld.getSceneGraph().insertItem(tile.sceneGraphRenderable);
	}
	
	private.eraseTile = function(tile)
	{
		var deletedTiles = [];
		
		//delete from the tilemap tree
		private.myTileMapTree.deleteContained(tile.myGame2DAABB, deletedTiles);
		if(GameSystemVars.DEBUG)
		{
			if(deletedTiles.length > 1)
				GameEngineLib.logger.error("Deleted too many tiles " + deletedTiles.length);
		}
		
		for(var i in deletedTiles)
		{
			//remove from scenegraph
			private.myWorld.getSceneGraph().removeItem(deletedTiles[i].sceneGraphRenderable);
			
			//remove from physics
			if(deletedTiles[i].physicsObj)
			{
				deletedTiles[i].physicsObj.release();
				//console.log("Deleting physics object");
			}
		}
	}
	
	instance.clearTile = function(inX, inY)
	{
		if(inX < 0 || private.myMapSizeInTiles <= inX
			|| inY < 0 || private.myMapSizeInTiles <= inY)
			return;
			
		var tile = {};
		tile.myGame2DAABB = GameEngineLib.createGame2DAABB(
			inX * private.myTileSize,
			inY * private.myTileSize,
			private.myTileSize,
			private.myTileSize
		);
		
		private.eraseTile(tile);
	}
	
	instance.toTileCoordinate = function(inWorldCoordinate)
	{
		return Math.floor(inWorldCoordinate / private.myTileSize);
	}
	
	instance.debugDraw = function(inCanvas2DContext, inCameraRect)
	{
		GameInstance.Graphics.drawDebugText("Debug Drawing Tile Map");
		
		private.myTileMapTree.walk(
			function(item)
			{
				var itemRect = item.myGame2DAABB;
				private.myTileSet.renderTileInRect(
					inCanvas2DContext,
					item.myTileValue,
					GameEngineLib.createGame2DAABB
					(
						itemRect.myX - inCameraRect.myX,
						itemRect.myY - inCameraRect.myY,
						private.myTileSize,
						private.myTileSize
					)
				)
			},
			inCameraRect
		);
		
		private.myTileMapTree.debugDraw(inCanvas2DContext, inCameraRect);//TODO map colors?
	}
	
	instance.destroy = function(){}//TODO
	instance.serialize = function(){}//TODO

	
	instance.isWrappable = function()
	{
		return false;//TODO this is a HACK; make this a value that can be set on init
		//set up scenegraph and physics for wrapping
	}
	
	return instance;
}