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

//TODO Vector
ECGame.EngineLib.createVector = function(inVectorDimensions)
{
	var instance = {};
}



ECGame.EngineLib.createKMean = function(instance, PRIVATE)
{
	instance = instance || {};
	PRIVATE = PRIVATE || {};
	
	//todo add debug info
	
	
	
	
	PRIVATE.createCluster = function(inVectorDimensions)
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
			this.points = ECGame.EngineLib.createGameCircularDoublyLinkedListNode();
			this.numPoints = 0;
		}
		clusterInstance.resetPoints();
		
		//HACK
		clusterInstance.color = 'rgba(' + 
				Math.floor(Math.random() * 191 + 64) + ',' +
				Math.floor(Math.random() * 191 + 64) + ',' +
				Math.floor(Math.random() * 191 + 64) + ',' +
				'1)';
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
		PRIVATE.numClusters = inNumOfClusters;
		PRIVATE.vectorDimensions = inVectorDimensions;
		PRIVATE.clusters = [];
		
		for(var i = 0; i < inNumOfClusters; ++i)
		{
			PRIVATE.clusters[i] = PRIVATE.createCluster(inVectorDimensions);
		}
	}
	
	instance.resetCenters = function()
	{
		for(var i = 0; i < PRIVATE.numClusters; ++i)
		{
			PRIVATE.clusters[i].resetCenter();
		}
	}
	
	//TODO findBestFuzzyClusters	//weighted
	instance.findBestCluster = function(inDataPoint)
	{
		var bestDistanceSqared = Number.MAX_VALUE;
		var bestIndex = 0;
		
		//for each cluster:
		for(var i = 0; i < PRIVATE.numClusters; ++i)
		{
			var distanceSquared = 0;
			var clusterCenter = PRIVATE.clusters[i].center;
			
			//get the distance between the data point and the cluster
			for(var j = 0; j < PRIVATE.vectorDimensions; ++j)
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
		for(var i = 0; i < PRIVATE.numClusters; ++i)
		{
			PRIVATE.clusters[i].resetPoints();
		}
		
		//find best fit for data points
		for(var i = 0; i < inDataPoints.length; ++i)
		{
			var bestClusterIndex = this.findBestCluster(inDataPoints[i]);
			var bestCluster = PRIVATE.clusters[bestClusterIndex];
			bestCluster.points.insert(
				ECGame.EngineLib.createGameCircularDoublyLinkedListNode(inDataPoints[i])
			);
			++bestCluster.numPoints;
		}
		
		//update centers
		for(var i = 0; i < PRIVATE.numClusters; ++i)
		{
			var cluster = PRIVATE.clusters[i];
			
			/*for(var j = 0; j < PRIVATE.vectorDimensions; ++j)
			{
				cluster.center[j] *= (cluster.numPoints + 1);
			}*/
						
			var head = cluster.points;
			for(var current = head.myNext; current !== head; current = current.myNext)
			{
				var point = current.item;
				
				for(var j = 0; j < PRIVATE.vectorDimensions; ++j)
				{
					cluster.center[j] += point[j];
				}
			}
			
			for(var j = 0; j < PRIVATE.vectorDimensions; ++j)
			{
				cluster.center[j] /= (cluster.numPoints + 1)//* 2;
			}
		}
	}
	
	//HACK for 2D!
	instance.render = function(inCanvas2DContext, inTargetRect)
	{
		for(var i = 0; i < PRIVATE.numClusters; ++i)
		{
			/*var colorIndex = (i + 1);
			PRIVATE.clusters[i].color = 'rgba(' + 
				Math.floor(colorIndex * 255 / PRIVATE.numClusters) + ',' +
				Math.floor(colorIndex * 255 / PRIVATE.numClusters) + ',' +
				Math.floor(colorIndex * 255 / PRIVATE.numClusters) + ',' +
				'1)';*/
			PRIVATE.clusters[i].render(inCanvas2DContext, inTargetRect);
		}
	}
	
	
	return instance;
}

















//todo make this a GameObject also!!
//todo rename game rules
ECGame.Lib.createGameRules = function(instance, PRIVATE)
{
	instance = instance || {};
	PRIVATE = PRIVATE || {};
	
	//todo add debug info
		
	instance.init = function()
	{
		if(!ECGame.Settings.Network.isServer)
		{
			ECGame.instance.input.registerListener('Input', PRIVATE);
		}
			
		ECGame.instance.updateOrder.push(this);
		
		PRIVATE.clustersCount = 16;
		PRIVATE.vectorDimensions = 2;
		PRIVATE.dataPointCount = 1000;
		PRIVATE.data = [];
		for(var i = 0; i < PRIVATE.dataPointCount; ++i)
		{
			PRIVATE.data[i] = [];
			for(var j = 0; j < PRIVATE.vectorDimensions; ++j)
			{
				PRIVATE.data[i][j] = Math.random();
			}
		}
			
		PRIVATE.kmean = ECGame.EngineLib.createKMean();
		PRIVATE.kmean.init(
			PRIVATE.clustersCount,
			PRIVATE.vectorDimensions
		);
		
		
		return true;
	}
	
	instance.isUpdating = function(){return true;}
	instance.update = function()
	{
		PRIVATE.data = PRIVATE.data.slice(1, PRIVATE.data.length);
		var newPoint = []
		for(var j = 0; j < PRIVATE.vectorDimensions; ++j)
		{
			newPoint[j] = Math.random();
		}
			
		PRIVATE.data.push(newPoint);
		
		PRIVATE.kmean.clustersData(PRIVATE.data);
	}
	
	
	instance.render = function(inCanvas2DContext)
	{
		PRIVATE.kmean.render(
			inCanvas2DContext
			,ECGame.EngineLib.Game2DAABB.create(
				0,
				0,
				ECGame.instance.graphics.getWidth(),
				ECGame.instance.graphics.getHeight()
			)
		);
	};
	
	
	
	//TODO maybe this should be in an editor or something
	PRIVATE.onInput = function(inInputEvent)
	{
		if(inInputEvent.keysPressed['q'])
		{
			PRIVATE.kmean.clustersData(PRIVATE.data);
		}
		if(inInputEvent.keysPressed['e'])
		{
			PRIVATE.data = PRIVATE.data.slice(1, PRIVATE.data.length);
			var newPoint = []
			for(var j = 0; j < PRIVATE.vectorDimensions; ++j)
			{
				newPoint[j] = Math.random();
			}
				
			PRIVATE.data.push(newPoint);
		}
		if(inInputEvent.keysPressed['r'])
		{
			PRIVATE.kmean.resetCenters();
		}
		
		if(inInputEvent.buttons[0])
		{
			
		}
	}
		
	
	return instance;
}