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
ECGame.EngineLib.SceneGraph2D = function SceneGraph2D(){return;};//TODO put init in here?
ECGame.EngineLib.SceneGraph2D.prototype.constructor = ECGame.EngineLib.SceneGraph2D;



ECGame.EngineLib.SceneGraph2D.prototype.init = function init(inMapSize, inMinNodeSize)
{
	this._mySceneTree = ECGame.EngineLib.QuadTree.create();
	this._mySceneTree.init(
		ECGame.EngineLib.AABB2D.create(0, 0, inMapSize, inMapSize),
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
	this._rotMatrixRow1 = ECGame.EngineLib.Point2D.create(this._cos, sin);
	this._rotMatrixRow2 = ECGame.EngineLib.Point2D.create(-sin, this._cos);
};



//TODO more like physics handles? maybe?***************************
ECGame.EngineLib.SceneGraph2D.prototype.insertItem = function insertItem(inRenderableItem)
{
	this._mySceneTree.insertToAllBestFitting(inRenderableItem);
	inRenderableItem._myLastFrameDrawn = inRenderableItem._myLastFrameDrawn || 0;
};



ECGame.EngineLib.SceneGraph2D.prototype.removeItem = function removeItem(inRenderableItem)
{
	inRenderableItem.removeFromQuadTree();
};


ECGame.EngineLib.SceneGraph2D.prototype.render = function render(inGraphics)
{
	var aThis
		,aRenderablesArray
		,aCameraRect
		,aFrameCount
		,i
		;
	
	aThis = this;
	aRenderablesArray = [];
	
	aCameraRect = inGraphics.getCamera2D().getCaptureVolumeAABB2D();
	aFrameCount = ECGame.instance.getTimer().getFrameCount() * ECGame.instance.getNumberOfGraphicsDisplays() + inGraphics.getIndex();
	
	this._mySceneTree.walk(
		function walkCallback(inItem)//TODO find/fix all unnamed functions; ie: function(
		{
			if(aFrameCount > inItem._myLastFrameDrawn)
			{
				//calculate depth sorting position for this frame
				inItem._myScreenPos = inItem.getAnchorPosition().subtract(aCameraRect.getLeftTop());
				inItem._myDrawOrderHelper = ECGame.EngineLib.Point2D.create(
					inItem._myScreenPos.dot(aThis._rotMatrixRow1),
					inItem._myScreenPos.dot(aThis._rotMatrixRow2)
				);
			
				inItem._myLastFrameDrawn = aFrameCount;
				aRenderablesArray.push(inItem);
			}
		},
		aCameraRect
	);
	
	aRenderablesArray.sort(
		function sortRenderables(inLeft, inRight)
		{				
			var vec = inLeft._myDrawOrderHelper.subtract(inRight._myDrawOrderHelper);
			
			return (vec.myY * aThis._myMapSize * aThis._cos + vec.myX) +
				(aThis._myMapSize * aThis._myMapSize) * (inLeft._myDepth - inRight._myDepth);
		}
	);
	
	for(i in aRenderablesArray)
	{
		aRenderablesArray[i].render(inGraphics);
	}
	
	if(ECGame.Settings.isDebugDraw_SceneGraph())
	{
		this._debugDraw(inGraphics, aRenderablesArray);
	}
};

ECGame.EngineLib.SceneGraph2D.prototype._debugDraw = function _debugDraw(inGraphics, inRenderables)
{
	var aFontSize
		,aCurrentRenderable
		,aScreenPosition
		,aStringDrawOrder
		,aStringDistance
		,aWidth
		,i
		;
		
	aFontSize = ECGame.Settings.Debug.Text_Size;
	
	inGraphics.drawDebugText("Debug Drawing SceneGraph");
	
	inGraphics.setFont(aFontSize + 'px Arial');
	for(i in inRenderables)
	{
		aCurrentRenderable = inRenderables[i];
		aScreenPosition = aCurrentRenderable.getAnchorPosition();
		
		aStringDrawOrder = String(i);
		aStringDistance = '';
		/*
		TODO?? include this or not with a flag??
		aStringDistance =
			aCurrentRenderable._myDrawOrderHelper.myX.toFixed(2) + ', ' +
			aCurrentRenderable._myDrawOrderHelper.myY.toFixed(2);
		*/
		aWidth = Math.max(
			inGraphics.measureText(aStringDrawOrder).width,
			inGraphics.measureText(aStringDistance).width
		);
		
		inGraphics.setFillStyle(ECGame.Settings.Debug.QuadTree_Item_DrawColor);
		inGraphics.fillRectXYWH(
			aScreenPosition.myX,
			aScreenPosition.myY,
			aWidth,
			aFontSize * (aStringDistance !== '' ? 2 : 1)
		);
		
		inGraphics.setFillStyle(ECGame.Settings.Debug.TextDefault_DrawColor);
		inGraphics.fillTextXY(
			aStringDrawOrder,
			aScreenPosition.myX,
			aScreenPosition.myY + aFontSize
		);
		if(aStringDistance !== '')
		{
			inGraphics.fillTextXY(
				aStringDistance,
				aScreenPosition.myX,
				aScreenPosition.myY + aFontSize * 2
			);
		}
	}
	inGraphics.drawDebugText("SceneGraph Draw calls:" + inRenderables.length);
	
	this._mySceneTree.debugDraw(inGraphics);//TODO scenegraph colors here
};