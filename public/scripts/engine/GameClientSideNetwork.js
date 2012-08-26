GameEngineLib.createGameNetwork = function(instance, private)
{
	instance = instance || {};
	private = private || {};
	//TODO debug data
	
	GameEngineLib.createEventSystem(instance);
			
	instance.init = function()
	{
		private.serializer = GameEngineLib.GameSerializers.createGameBinarySerializer();
		
		private.maxItemsPerMessage = 255;
		
		//Note may need tp be sliced to last '/' in the future
		var address = document.URL.slice(0, -1) +  ":" + GameSystemVars.Network.GamePort;
		private.socket = io.connect(address);
		private.socket.on('connect', private.onConnectedToServer);
		private.socket.on('msg', private.onMsg);
		//TODO other message channels, ie chat etc?
		private.socket.on('disconnect', private.onDisconnectedFromServer);
		
		private.objectHeaderFormat =
		[
			{
				name : "classID",
				scope : "public",
				type : "int",
				net : true,
				min : 0,
				max : GameInstance.GameObjectClasses.getMaxID()
			},
			{
				name : "instanceID",
				scope : "public",
				type : "int",
				net : true,
				min : 0,
				max : 4096	//note: this assumes a max of 4096 objects of any given type.  may want max items per type in the future
			}
		];
		
		private.messageHeaderFormat =
		[
			{
				name : "numObjects",
				scope : "public",
				type : "int",
				net : true,
				min : 1,
				max : private.maxItemsPerMessage
			}
		];
	}
	
	instance.sendData = function(inData, inSentListener)
	{
		if(private.socket.socket.connected === true)
		{
			private.socket.emit('msg', inData);
			if(inSentListener && inSentListener.onSent)
				inSentListener.onSent(inData);
		}
		else
		{
			//TODO queue this for resend when we are connected again
			
			if(GameSystemVars.DEBUG && GameSystemVars.Debug.NetworkMessages_Print)
			{
				GameEngineLib.logger.info("Can't send message when disconnected.");
			}
		}
	}
	
	private.onConnectedToServer = function()
	{
		if(GameSystemVars.DEBUG /*&& GameSystemVars.Debug.NetworkMessages_Print*/)
		{
			GameEngineLib.logger.info("Connected to Server!");
		}
		
		//TODO change this to be some kind of hand shake or login or **user verification**?
		
		instance.onEvent(
			{
				getName :
				function()
				{
					return "ConnectedToServer";
				}
			}
		);
	}
	
	private.onDisconnectedFromServer = function()
	{
		if(GameSystemVars.DEBUG /*&& GameSystemVars.Debug.NetworkMessages_Print*/)
		{
			GameEngineLib.logger.info("Lost Server!");
		}
		
		instance.onEvent(
			{
				getName : function()
				{
					return "DisconnectedFromServer";
				}
			}
		);
	}
	
	private.onMsg = function(inData)
	{
		if(GameSystemVars.DEBUG && GameSystemVars.Debug.NetworkMessages_Print)
		{
			GameEngineLib.logger.info("NetRecv: " + inData);
		}
		
		instance.onEvent(
			{
				getName : function()
				{
					return "Msg"	//TODO rename this
				},
				msg : inData
			}
		);
	}
	
	
	//TODO probably on BOTH sides
	instance.isUpdating = function()
	{
		return true;//isMultiplayer??
	}
	
	instance.update = function(inDt)
	{
		var messageHeader = { public : {} };	//TODO could make these class members as they used here and on recieve all the time.
		var objectHeader = { public : {} };
		var dirtyObjects = [];
		
		//TODO probably better to have a net dirty list instead of iterating over everything!
		//TODO have class printing elsewhere for debugging, selecting, and maybe (probably) even editing
		GameInstance.GameObjectClasses.forAll(
			function(inClass)
			{
				GameInstance.Graphics.drawDebugText(
					inClass.getName()
					//,color
				);
				if(inClass.flags.net)
					GameInstance.Graphics.drawDebugText(
						"***"
						//,color
					);
				
				inClass.forAll(
					function(inObject)
					{
						GameInstance.Graphics.drawDebugText("    -" + inObject.getName()/*, color*/);
						if(inClass.flags.net && inObject.netDirty())
						{
							dirtyObjects.push(inObject);
						}
					}
				);
			}
		);
		
		while(dirtyObjects.length !== 0)
		{
			private.serializer.initWrite({NET : true});
			
			messageHeader.public.numObjects = Math.min(private.maxItemsPerMessage, dirtyObjects.length);
			private.serializer.serializeObject(messageHeader, private.messageHeaderFormat);
			
			for(var i = 0; i < messageHeader.public.numObjects; ++i)
			{
				var object = dirtyObjects[i];
				objectHeader.public.classID = object.getClass().getID();
				objectHeader.public.instanceID = object.getID();
				private.serializer.serializeObject(objectHeader, private.objectHeaderFormat);
				object.serialize(private.serializer);
			}
			
			this.sendData(private.serializer.getString());
			
			dirtyObjects = dirtyObjects.slice(messageHeader.public.numObjects);
		}
	}
	
	instance.onMsg = function(inEvent)
	{
		/*
		TODO
		unpack
			throw	//from logerror!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		*/
		
		private.serializer.initRead({NET : true}, inEvent.msg);
		
		var messageHeader = { public : {} };
		var objectHeader = { public : {} };
		
		try
		{
			private.serializer.serializeObject(messageHeader, private.messageHeaderFormat);
			for(var i = 0; i < messageHeader.public.numObjects; ++i)
			{
				private.serializer.serializeObject(objectHeader, private.objectHeaderFormat);
				var objectClass = GameInstance.GameObjectClasses.findByID(objectHeader.public.classID);
				var object = objectClass.findByID(objectHeader.public.instanceID);
				//TODO if not found, and not server, create it
				//TODO if !server && !owner && !recentOwnerQueue throw error
				//TODO if !server && !owner && lenient serializer.dummyRead
				//else
				object.serialize(private.serializer);
				
				//TODO if server, dirty object (so it will send down to other clients)? or just resend if packet contains no detected problems
			}
		}
		catch(error)
		{
			//TODO disconnect? increment damaged packets for this user?
		}
	}
	
	instance.registerListener("Msg", instance);
	
	
	
	return instance;
}