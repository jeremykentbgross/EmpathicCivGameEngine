
GameEngineLib.createGameNetwork = function(instance, private)
{
	instance = instance || {};
	private = private || {};
	//TODO debug data
	
	//GameEngineLib.createEventSystem(instance);
	
	instance.init = function()
	{
		//todo see: http://webdevrefinery.com/forums/topic/7871-node-how-to-use-socketio-to-push-realtime-events/
		//todo configure (to use flash etc)
		//		private.listenSocket = GameEngineServer.listenSocket;//GameEngineServer.socketio.listen(/*1337*/GameEngineServer.expressApp);
		private.listenSocket = GameEngineServer.socketio.listen(GameSystemVars.Network.GamePort);
		
		private.listenSocket.sockets.on(
			"connection",
			function(socket)
			{
				//socket.emit("msg", "hello from server");
				
				//on message send message to everyone else:
				socket.on(
					"msg",
					function (data)
					{
						socket.broadcast.emit("msg", data);
						
						if(GameSystemVars.DEBUG && GameSystemVars.Debug.NetworkMessages_Print)
						{
							GameEngineLib.logger.info("NetRecv: " + data);
						}
						//console.log(data);
					}
				);
				
				//on disconnect tell everyone that they are gone
				socket.on(
					"disconnect",
					function()
					{
						//private.listenSocket.sockets.emit("msg", "User Disconnected");
					}
				);
				
				//tell everone they have connected:
				//socket.broadcast.emit("msg", "User Connected");
			}
		);
		
		console.log("TCP Server running.");
	}
	
	instance.isUpdating = function()
	{
		return false;//TEMP HACK
	}
	
	return instance;
}