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


//TODO make this class pluggable with other 2d scene graphs?  Or just the sorting part?
ECGame.EngineLib.Game2DSceneGraph = function Game2DSceneGraph(){};//TODO put init in here?
ECGame.EngineLib.Game2DSceneGraph.prototype.constructor = ECGame.EngineLib.Game2DSceneGraph;



ECGame.EngineLib.Game2DSceneGraph.prototype.init = function init(inMapSize, inMinNodeSize)
{
	this._mySceneTree = ECGame.EngineLib.GameQuadTree.create();
	this._mySceneTree.init(
		ECGame.EngineLib.createGame2DAABB(0, 0, inMapSize, inMapSize),
		inMinNodeSize
	);
	this._myMapSize = inMapSize;
	
	/*
	Gonna rotate tiles 135 degrees every frame (from upside down L shape to V shape)
		Then we will use the resulting posiions to depth sort them.
	*/
	var sin = Math.sin(3*Math.PI/4);
	this._cos = Math.cos(3*Math.PI/4);
	/*
	Change of basis (rotation) transposed because Y axis is down.
		|cos -sin| Transose	=>	| cos sin|
		|sin  cos|			=>	|-sin cos|
	*/
	this._rotMatrixRow1 = ECGame.EngineLib.createGame2DPoint(this._cos, sin);
	this._rotMatrixRow2 = ECGame.EngineLib.createGame2DPoint(-sin, this._cos);
};



//TODO more like physics handles? maybe?***************************
ECGame.EngineLib.Game2DSceneGraph.prototype.insertItem = function insertItem(inRenderableItem)
{
	inRenderableItem.sceneGraphOwningNodes = [];
	this._mySceneTree.insertToAllBestFitting(inRenderableItem, inRenderableItem.sceneGraphOwningNodes);

	inRenderableItem.lastFrameDrawn = inRenderableItem.lastFrameDrawn || 0;
};



ECGame.EngineLib.Game2DSceneGraph.prototype.removeItem = function removeItem(inRenderableItem)
{
	var nodeIndex;
	var nodeArray = inRenderableItem.sceneGraphOwningNodes;
	for(nodeIndex in nodeArray)
	{
		nodeArray[nodeIndex].deleteItem(inRenderableItem);//todo optimize this to deleteItemFromNode
	}
	inRenderableItem.sceneGraphOwningNodes = [];
};


ECGame.EngineLib.Game2DSceneGraph.prototype.render = function render(inCanvas2DContext, inCameraRect)
{
	var renderables = [];
	var _this_ = this;
	var i;
			
	this._mySceneTree.walk(
		function(item)
		{
			var frameCount = ECGame.instance.gameTimer.getFrameCount();
			
			if(frameCount > item.lastFrameDrawn)
			{
				//calculate depth sorting position for this frame
				item.screenPos = item.anchorPosition.subtract(inCameraRect.getLeftTop());
				item.drawOrderHelper = ECGame.EngineLib.createGame2DPoint(
					item.screenPos.dot(_this_._rotMatrixRow1),
					item.screenPos.dot(_this_._rotMatrixRow2)
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
			var vec = inLeft.drawOrderHelper.subtract(inRight.drawOrderHelper);
			
			return (vec.myY * _this_._myMapSize * _this_._cos + vec.myX) +
				(_this_._myMapSize * _this_._myMapSize) * (inLeft.layer - inRight.layer);
		}
	);
	
	for(i in renderables)
	{
		renderables[i].render(inCanvas2DContext, inCameraRect);
	}
	
	
	if(ECGame.Settings.DEBUG && ECGame.Settings.Debug.SceneGraph_Draw)
	{
		var fontSize = ECGame.Settings.Debug.Text_Size;
		
		ECGame.instance.graphics.drawDebugText("Debug Drawing SceneGraph");
		
		inCanvas2DContext.font = fontSize + 'px Arial';
		for(i in renderables)
		{
			var currentRenderable = renderables[i];
			var screenPos = currentRenderable.screenPos;
			
			var stringDrawOrder = String(i);
			var stringDistance = String('');
			/*
			TODO?? include this or not with a flag??
			stringDistance =
				currentRenderable.drawOrderHelper.myX.toFixed(2) + ', ' +
				currentRenderable.drawOrderHelper.myY.toFixed(2);
			*/
			var width = Math.max(
				inCanvas2DContext.measureText(stringDrawOrder).width,
				inCanvas2DContext.measureText(stringDistance).width
			);
			
			inCanvas2DContext.fillStyle = ECGame.Settings.Debug.SpacialPartitioningTree_Item_DrawColor;
			inCanvas2DContext.fillRect(
				screenPos.myX,
				screenPos.myY,
				width,
				fontSize * (stringDistance !== '' ? 2 : 1)
			);
			
			inCanvas2DContext.fillStyle = ECGame.Settings.Debug.TextDefault_DrawColor;
			inCanvas2DContext.fillText(
				stringDrawOrder,
				screenPos.myX,
				screenPos.myY + fontSize
			);
			if(stringDistance !== '')
			{
				inCanvas2DContext.fillText(
					stringDistance,
					screenPos.myX,
					screenPos.myY + fontSize * 2
				);
			}
		}
		ECGame.instance.graphics.drawDebugText("SceneGraph Draw calls:" + renderables.length);
	}
	
	//TODO get rid of needing this! Need auto cleaning on delete
	//this._mySceneTree.cleanTree();//commented for speed in full map, still kind of needed
};

ECGame.EngineLib.Game2DSceneGraph.prototype.debugDraw = function debugDraw(inCanvas2DContext, inCameraRect)
{
	this._mySceneTree.debugDraw(inCanvas2DContext, inCameraRect);//TODO scenegraph colors here
};