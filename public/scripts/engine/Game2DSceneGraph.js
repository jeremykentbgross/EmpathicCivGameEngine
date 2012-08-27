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

GameEngineLib.createGame2DSceneGraph = function(instance, private)
{
	instance = instance || {};
	private = private || {};
	
	//todo debug info
	
	instance.init = function(inMapSize, inMinNodeSize)
	{
		private.mySceneTree = GameEngineLib.createGameQuadTree();
		private.mySceneTree.init(
			GameEngineLib.createGame2DAABB(0, 0, inMapSize, inMapSize),
			inMinNodeSize
		);
		private.myMapSize = inMapSize;
		
		/*
		Gonna rotate tiles 135 degrees every frame (from upside down L shape to V shape)
			Then we will use the resulting posiions to depth sort them.
		*/
		var sin = Math.sin(3*Math.PI/4);
		private.cos = Math.cos(3*Math.PI/4);
		/*
		Change of basis (rotation) transposed because Y axis is down.
			|cos -sin| Transose	=>	| cos sin|
			|sin  cos|				=>	|-sin cos|
		*/
		private.rotMatrixRow1 = GameEngineLib.createGame2DPoint(private.cos, sin);
		private.rotMatrixRow2 = GameEngineLib.createGame2DPoint(-sin, private.cos);
	}
	
	//TODO more like physics handles? maybe?***************************
	instance.insertItem = function(inRenderableItem)
	{
		inRenderableItem.sceneGraphOwningNodes = [];
		private.mySceneTree.insertToAllBestFitting(inRenderableItem, inRenderableItem.sceneGraphOwningNodes);

		inRenderableItem.lastFrameDrawn = inRenderableItem.lastFrameDrawn || 0;
	}
	instance.removeItem = function(inRenderableItem)
	{
		var nodeArray = inRenderableItem.sceneGraphOwningNodes;
		for(var nodeIndex in nodeArray)
			nodeArray[nodeIndex].deleteItem(inRenderableItem);//todo optimize this to deleteItemFromNode
		inRenderableItem.sceneGraphOwningNodes = [];
	}
	
	
	instance.render = function(inCanvas2DContext, inCameraRect)
	{
		var renderables = [];
				
		private.mySceneTree.walk(
			function(item)
			{
				var frameCount = GameInstance.GameTimer.getFrameCount();
				
				if(frameCount > item.lastFrameDrawn)
				{
					//calculate depth sorting position for this frame
					item.screenPos = item.myAnchorPosition.subtract(inCameraRect.getLeftTop());
					item.depthSortingPosition = GameEngineLib.createGame2DPoint(
						item.screenPos.dot(private.rotMatrixRow1),
						item.screenPos.dot(private.rotMatrixRow2)
					);
				
					item.lastFrameDrawn = frameCount;
					renderables.push(item);
				}
			},
			inCameraRect
		);
		
		renderables.sort(
			function(inLeft, inRight)
			{				
				var vec = inLeft.depthSortingPosition.subtract(inRight.depthSortingPosition);
				
				return (vec.myY * private.myMapSize * private.cos + vec.myX) +
					(private.myMapSize * private.myMapSize) * (inLeft.myLayer - inRight.myLayer);
			}
		);
		
		for(var i in renderables)
		{
			renderables[i].render(inCanvas2DContext, inCameraRect);
		}
		
		
		if(GameSystemVars.DEBUG && GameSystemVars.Debug.SceneGraph_Draw)
		{
			var fontSize = GameSystemVars.Debug.Text_Size;
			
			GameInstance.Graphics.drawDebugText("Debug Drawing SceneGraph");
			
			inCanvas2DContext.font = fontSize + "px Arial";
			for(var i in renderables)
			{
				var currentRenderable = renderables[i];
				var screenPos = currentRenderable.screenPos;
				
				var stringDrawOrder = "" + i;
				var stringDistance = ""
						//currentRenderable.depthSortingPosition.myX.toFixed(2) + ", " +
						//currentRenderable.depthSortingPosition.myY.toFixed(2);
				
				var width = Math.max(
					inCanvas2DContext.measureText(stringDrawOrder).width,
					inCanvas2DContext.measureText(stringDistance).width
				);
				
				inCanvas2DContext.fillStyle = GameSystemVars.Debug.SpacialPartitioningTree_Item_DrawColor;
				inCanvas2DContext.fillRect(
					screenPos.myX,
					screenPos.myY,
					width,
					fontSize * (stringDistance !== "" ? 2 : 1)
				);
				
				inCanvas2DContext.fillStyle = GameSystemVars.Debug.TextDefault_DrawColor;
				inCanvas2DContext.fillText(
					stringDrawOrder,
					screenPos.myX,
					screenPos.myY + fontSize
				);
				if(stringDistance !== "")
				{
					inCanvas2DContext.fillText(
						stringDistance,
						screenPos.myX,
						screenPos.myY + fontSize * 2
					);
				}
			}
			GameInstance.Graphics.drawDebugText("SceneGraph Draw calls:" + renderables.length);
		}
		
		//TODO get rid of needing this!
		//private.mySceneTree.cleanTree();
	}
	
	instance.debugDraw = function(inCanvas2DContext, inCameraRect)
	{
		private.mySceneTree.debugDraw(inCanvas2DContext, inCameraRect);//TODO scenegraph colors here
	}
	
	return instance;
}