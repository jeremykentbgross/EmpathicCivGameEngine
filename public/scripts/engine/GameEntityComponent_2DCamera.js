GameEngineLib.createEntityComponent_2DCamera = function(instance, private)
{
	instance = instance || {};
	private = private || {};
	
	GameEngineLib.createGame2DCamera(instance, private);
	
	instance.onAddedToEntity = function(inEntity)
	{
		private.myOwner = inEntity;
		
		//register for events
		private.myOwner.registerListener("UpdatePosition", this);
		private.myOwner.registerListener("AddedToWorld", this);
		private.myOwner.registerListener("RemovedFromWorld", this);
		
		//TODO owner.event(getposition, myPos);??
	}
	
	instance.onRemovedFromEntity = function()
	{
		//unregister for events
		private.myOwner.unregisterListener("UpdatePosition", this);
		private.myOwner.unregisterListener("AddedToWorld", this);
		private.myOwner.unregisterListener("RemovedFromWorld", this);
		
		private.myOwner = null;
	}
	
	instance.destroy = function(){}//TODO
	instance.serialize = function(){}//TODO
	
	
	instance.onAddedToWorld = function(inEvent)
	{
		private.myMap = inEvent.world.getMap();
		//todo register as a camera entity with the world
	}
	instance.onRemovedFromWorld = function(inEvent)
	{
		//todo unregister as a camera entity with the world
		private.myMap = null;
	}
	
	instance.getTargetPosition = function()
	{
		return private.position;
	}
	
	instance.onUpdatePosition = function(inEvent)
	{
		//TODO look into bug why camera lags behind entity (maybe due to event listener order?)
		private.position = inEvent.position;
		this.centerOn(private.position, private.myMap.deref());
	}
	
	return instance;
}