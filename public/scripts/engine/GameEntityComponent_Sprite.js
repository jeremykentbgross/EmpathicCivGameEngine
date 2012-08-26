GameEngineLib.createEntityComponent_Sprite = function(instance, private)
{
	instance = instance || {};
	private = private || {};
	
	private.position = GameEngineLib.createGame2DPoint();
	private.myFrames = [{}];
	private.myCurrentFrame = 0;
	//todo myFrames[currentAnimation, currentFrame]
	
	//TODO frame knows filename, offset, collision rects, (sound?) events, etc
	//TODO ^^^ same kind of thing for map tiles?
	
	if(!GameSystemVars.Network.isServer)
		GameInstance.AssetManager.loadImage(/*"images/testsprite.png"*/"images/wall_level01_01.png", private.myFrames[0]);
	else private.myFrames[0] = {};
	private.myFrames[0].offset = GameEngineLib.createGame2DPoint(-64, -64);//(-32, -64-16);//hack
	
	instance.init = function()
	{
		//var i = 0;
		//for(i = 0; i < private.myFiles.length; ++i)
		//{
		//	private.myTiles[i] = {};
			//GameInstance.assetManager.loadImage("images/testsprite.png", private.myFrames[i]);
		//}
		
		//private.sceneGraphRenderable.myPosition********
	}
	
	private.sceneGraphRenderable =
	{
		myLayer : 1,//TODO this should always be odd
		myAnchorPosition : GameEngineLib.createGame2DPoint(),//TODO rename as sort position
		myGame2DAABB : GameEngineLib.createGame2DAABB(0, 0, /*64*/96,/*HACK*/ 96/*HACK*/),
		render : function(inCanvas2DContext, inCameraPoint)
		{
			var renderPoint = private.myFrames[private.myCurrentFrame].offset.
				add(private.position/*this.myPosition*/).
				subtract(inCameraPoint);
			//TODO debug print that this is not clipped (global debug vars)
			inCanvas2DContext.drawImage(
				private.myFrames[private.myCurrentFrame].image,
				renderPoint.myX,
				renderPoint.myY
			);
		}
	};
	
	//todo update!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	
	instance.render = function(inCanvasContext, inCameraPoint)
	{
		/*var renderPoint = private.myFrames[private.myCurrentFrame].offset.
			add(private.position).
			subtract(inCameraPoint);
		//TODO debug print that this is not clipped (global debug vars)
		inCanvasContext.drawImage(
			private.myFrames[private.myCurrentFrame].image,
			renderPoint.myX,
			renderPoint.myY
		);*/
	}
		
	
	instance.onAddedToEntity = function(inEntity)
	{
		private.myOwner = inEntity;
		
		//register for events
		private.myOwner.registerListener("UpdatePosition", this);
		private.myOwner.registerListener("AddedToWorld", this);
		private.myOwner.registerListener("RemovedFromWorld", this);
		
		//TODO owner.event(getposition, myPos);
		//todo add to scene graph
	}
	
	instance.onRemovedFromEntity = function()
	{
		//unregister for events
		private.myOwner.unregisterListener("UpdatePosition", this);
		private.myOwner.unregisterListener("AddedToWorld", this);
		private.myOwner.unregisterListener("RemovedFromWorld", this);
		
		//todo remove from scenegraph
		
		private.myOwner = null;
	}
	
	instance.destroy = function(){}//TODO
	instance.serialize = function(){}//TODO

	
	instance.onUpdatePosition = function(inEvent)
	{
		private.world.getSceneGraph().removeItem(private.sceneGraphRenderable);
		
		//private.position = private.sceneGraphRenderable.myPosition = inEvent.position;
		//private.sceneGraphRenderable.myGame2DAABB.setLeftTop(private.position.add(private.myFrames[private.myCurrentFrame].offset));
		
		private.position = inEvent.position;
		private.sceneGraphRenderable.myAnchorPosition = inEvent.boundingRect.getLeftTop();//inEvent.position;
		private.sceneGraphRenderable.myGame2DAABB.setLeftTop(inEvent.position.add(private.myFrames[private.myCurrentFrame].offset));
		
		//*******************************************************
		//TODO change renderable position everywhere it should change
		
		private.world.getSceneGraph().insertItem(private.sceneGraphRenderable);
	}
	
	instance.onAddedToWorld = function(inEvent)
	{
		private.world = inEvent.world;
		private.world.getSceneGraph().insertItem(private.sceneGraphRenderable);
	}
	instance.onRemovedFromWorld = function(inEvent)
	{
		private.world.getSceneGraph().removeItem(private.sceneGraphRenderable);
		private.world = null;
	}
	
	instance.destroy = function(){}//TODO
	instance.serialize = function(){}//TODO

	
	return instance;
}