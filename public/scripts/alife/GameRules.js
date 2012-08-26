

//TODO Vector
GameEngineLib.createVector = function(inVectorDimensions)
{
	var instance = {};
}



GameEngineLib.createKMean = function(instance, private)
{
	instance = instance || {};
	private = private || {};
	
	//todo add debug info
	
	
	
	
	private.createCluster = function(inVectorDimensions)
	{
		var clusterInstance = {};
		
		clusterInstance.resetCenter = function()
		{
			this.center = [];
			for(var i = 0; i < inVectorDimensions; ++i)
			{
				this.center[i] = Math.random();
			}
		}
		clusterInstance.resetCenter();
		
		clusterInstance.resetPoints = function()
		{
			this.points = GameEngineLib.createGameCircularDoublyLinkedListNode();
			this.numPoints = 0;
		}
		clusterInstance.resetPoints();
		
		//HACK
		clusterInstance.color = "rgba(" + 
				Math.floor(Math.random() * 191 + 64) + "," +
				Math.floor(Math.random() * 191 + 64) + "," +
				Math.floor(Math.random() * 191 + 64) + "," +
				"1)";
		//HACK
		clusterInstance.render = function(inCanvas2DContext, inTargetRect)
		{
			var centerSize = 10;
			var pointSize = 4;
			
			inCanvas2DContext.fillStyle = this.color;
			
			//draw center
			var clusterCenter = this.center;
			var x = inTargetRect.myWidth * clusterCenter[0] - centerSize / 2;
			var y = inTargetRect.myHeight * clusterCenter[1] - centerSize / 2 || inTargetRect.myHeight / 2;
			inCanvas2DContext.fillRect(x, y, centerSize, centerSize);
			
			//draw points
			var head = this.points;
			for(var current = head.myNext; current !== head; current = current.myNext)
			{
				var point = current.item;
				
				var x = inTargetRect.myWidth * point[0] - pointSize / 2;
				var y = inTargetRect.myHeight * point[1] - pointSize / 2 || inTargetRect.myHeight / 2;
				inCanvas2DContext.fillRect(x, y, pointSize, pointSize);
			}
		}
		
		return clusterInstance;
	}
	
	
	
	
	
	
	instance.init = function(inNumOfClusters, inVectorDimensions)
	{
		private.numClusters = inNumOfClusters;
		private.vectorDimensions = inVectorDimensions;
		private.clusters = [];
		
		for(var i = 0; i < inNumOfClusters; ++i)
		{
			private.clusters[i] = private.createCluster(inVectorDimensions);
		}
	}
	
	instance.resetCenters = function()
	{
		for(var i = 0; i < private.numClusters; ++i)
		{
			private.clusters[i].resetCenter();
		}
	}
	
	//TODO findBestFuzzyClusters	//weighted
	instance.findBestCluster = function(inDataPoint)
	{
		var bestDistanceSqared = Number.MAX_VALUE;
		var bestIndex = 0;
		
		//for each cluster:
		for(var i = 0; i < private.numClusters; ++i)
		{
			var distanceSquared = 0;
			var clusterCenter = private.clusters[i].center;
			
			//get the distance between the data point and the cluster
			for(var j = 0; j < private.vectorDimensions; ++j)
			{
				var delta = inDataPoint[j] - clusterCenter[j];
				distanceSquared += delta * delta;
			}
			//select this center if we are closer than to any other
			if(distanceSquared < bestDistanceSqared)
			{
				bestIndex = i;
				bestDistanceSqared = distanceSquared;
			}
		}
		
		return bestIndex;
	}
	
	instance.clustersData = function(inDataPoints)
	{
		var bestDistanceSqared = Number.MAX_VALUE;
		var bestIndex = -1;
		
		//clear points
		for(var i = 0; i < private.numClusters; ++i)
			private.clusters[i].resetPoints();
		
		//find best fit for data points
		for(var i = 0; i < inDataPoints.length; ++i)
		{
			var bestClusterIndex = this.findBestCluster(inDataPoints[i]);
			var bestCluster = private.clusters[bestClusterIndex];
			bestCluster.points.insert(
				GameEngineLib.createGameCircularDoublyLinkedListNode(inDataPoints[i])
			);
			++bestCluster.numPoints;
		}
		
		//update centers
		for(var i = 0; i < private.numClusters; ++i)
		{
			var cluster = private.clusters[i];
			
			/*for(var j = 0; j < private.vectorDimensions; ++j)
			{
				cluster.center[j] *= (cluster.numPoints + 1);
			}*/
						
			var head = cluster.points;
			for(var current = head.myNext; current !== head; current = current.myNext)
			{
				var point = current.item;
				
				for(var j = 0; j < private.vectorDimensions; ++j)
				{
					cluster.center[j] += point[j];
				}
			}
			
			for(var j = 0; j < private.vectorDimensions; ++j)
			{
				cluster.center[j] /= (cluster.numPoints + 1)//* 2;
			}
		}
	}
	
	//HACK for 2D!
	instance.render = function(inCanvas2DContext, inTargetRect)
	{
		for(var i = 0; i < private.numClusters; ++i)
		{
			/*var colorIndex = (i + 1);
			private.clusters[i].color = "rgba(" + 
				Math.floor(colorIndex * 255 / private.numClusters) + "," +
				Math.floor(colorIndex * 255 / private.numClusters) + "," +
				Math.floor(colorIndex * 255 / private.numClusters) + "," +
				"1)";*/
			private.clusters[i].render(inCanvas2DContext, inTargetRect);
		}
	}
	
	
	return instance;
}

















//todo make this a GameObject also!!
//todo rename game rules
GameLib.createGameRules = function(instance, private)
{
	instance = instance || {};
	private = private || {};
	
	//todo add debug info
		
	instance.init = function()
	{
		if(!GameSystemVars.Network.isServer)
			GameInstance.Input.registerListener("Input", private);
			
		GameInstance.UpdateOrder.push(this);
		
		private.clustersCount = 16;
		private.vectorDimensions = 2;
		private.dataPointCount = 1000;
		private.data = [];
		for(var i = 0; i < private.dataPointCount; ++i)
		{
			private.data[i] = [];
			for(var j = 0; j < private.vectorDimensions; ++j)
				private.data[i][j] = Math.random();
		}
			
		private.kmean = GameEngineLib.createKMean();
		private.kmean.init(
			private.clustersCount,
			private.vectorDimensions
		);
		
		
		return true;
	}
	
	instance.isUpdating = function(){return true;}
	instance.update = function()
	{
		private.data = private.data.slice(1, private.data.length);
		var newPoint = []
		for(var j = 0; j < private.vectorDimensions; ++j)
			newPoint[j] = Math.random();
			
		private.data.push(newPoint);
		
		private.kmean.clustersData(private.data);
	}
	
	
	instance.render = function(inCanvas2DContext)
	{
		private.kmean.render(
			inCanvas2DContext
			,GameEngineLib.createGame2DAABB(
				0,
				0,
				GameInstance.Graphics.getWidth(),
				GameInstance.Graphics.getHeight()
			)
		);
	};
	
	
	
	//TODO maybe this should be in an editor or something
	private.onInput = function(inInputEvent)
	{
		if(inInputEvent.keysPressed["q"])
		{
			private.kmean.clustersData(private.data);
		}
		if(inInputEvent.keysPressed["e"])
		{
			private.data = private.data.slice(1, private.data.length);
			var newPoint = []
			for(var j = 0; j < private.vectorDimensions; ++j)
				newPoint[j] = Math.random();
				
			private.data.push(newPoint);
		}
		if(inInputEvent.keysPressed["r"])
		{
			private.kmean.resetCenters();
		}
		
		if(inInputEvent.buttons[0])
		{
			
		}
	}
		
	
	return instance;
}