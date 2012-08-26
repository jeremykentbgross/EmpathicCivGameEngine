//TODO rename CharacterInput
GameEngineLib.createEntityComponent_Input = function(instance, private)
{
	instance = instance || {};
	private = private || {};
	
	//private.keysEventMapper = [];//TODO make keys changable??
	
	if(!GameSystemVars.Network.isServer)
		GameInstance.Input.registerListener("Input", private);//todo add to init and turn on and off?
	
	//TODO put this elsewhere??
	private.speed = 128;
	
	private.up		= GameEngineLib.createGame2DPoint( 0,-1);
	private.down	= GameEngineLib.createGame2DPoint( 0, 1);
	private.left	= GameEngineLib.createGame2DPoint(-1, 0);
	private.right	= GameEngineLib.createGame2DPoint( 1, 0);
	
	if(!GameSystemVars.Network.isServer)
	private.onInput = function(inInputEvent)
	{
		private.direction = GameEngineLib.createGame2DPoint(0, 0);
		
		if(inInputEvent.keys["W"])
		{
			private.direction = private.direction.add(private.up);
		}
		if(inInputEvent.keys["S"])
		{
			private.direction = private.direction.add(private.down);
		}
		if(inInputEvent.keys["A"])
		{
			private.direction = private.direction.add(private.left);
		}
		if(inInputEvent.keys["D"])
		{
			private.direction = private.direction.add(private.right);
		}
		
		//unitize it, then multiply by speed
		private.direction = private.direction.unit().multiply(private.speed);
		
		/*if(inInputEvent.buttons[0])
		{
			mouseWorldPosition = inInputEvent.mouseLoc.add(camPoint);
			map.clearTile(
				map.toTileCoordinate(mouseWorldPosition.myX),
				map.toTileCoordinate(mouseWorldPosition.myY)
			);
		}*/
		
		private.myOwner.onEvent(
			{
				getName : function(){return "RequestVelocity";},
				direction : private.direction
			}
		);
	}
			
	
	instance.onAddedToEntity = function(inEntity)
	{
		private.myOwner = inEntity;

		//todo register for events
	}
	
	instance.onRemovedFromEntity = function()
	{		
		//todo unregister for events
		private.myOwner = null;
	}
	
	instance.destroy = function(){}//TODO
	instance.serialize = function(){}//TODO

	
	return instance;
}