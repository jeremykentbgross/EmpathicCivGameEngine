GameEngineLib.createGame2DCamera = function(instance, private)
{
	instance = instance || {};
	private = private || {};
	
	//TODO debug add private
	
	if(!GameSystemVars.Network.isServer)
	{
		private.myRect = GameEngineLib.createGame2DAABB(
			0,
			0,
			GameInstance.Graphics.getWidth(),
			GameInstance.Graphics.getHeight()
		);
	}
	else
	{
		private.myRect = GameEngineLib.createGame2DAABB(
			0,
			0,
			GameSystemVars.Graphics.initWidth,
			GameSystemVars.Graphics.initHeight
		);
	}
	
	instance.init = function(inWidth, inHeight)
	{
		if(inWidth &&inHeight)
			private.myRect = GameEngineLib.createGame2DAABB(0, 0, inWidth, inHeight);
	}
	
	instance.centerOn = function(inTargetCenter, inMap)
	{		
		var camPoint = inTargetCenter.subtract(private.myRect.getWidthHeight().multiply(0.5));
		
		//if the map does not wrap, clamp camera to within the world favoring the uper left corner
		if(inMap && inMap.isWrappable && !inMap.isWrappable())
		{
			camPoint = camPoint.componentMin(inMap.getMapLowerRight().subtract(private.myRect.getWidthHeight()));
			camPoint = camPoint.componentMax(GameEngineLib.createGame2DPoint(0,0));
		}
		
		private.myRect.setLeftTop(camPoint);
	}
	
	//TODO have actual target entity?  I think so
	instance.getTargetPosition = function()
	{
		return private.myRect.getCenter();
	}
	
	//TODO listen to graphics object for resizes?
	
	//todo make this gameobject? with set target/map? then needs update.. eh?
	
	instance.getRect = function()
	{
		return private.myRect;
	}
	
	return instance;
}