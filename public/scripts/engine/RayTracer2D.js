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

ECGame.EngineLib.RayTracer2D = ECGame.EngineLib.Class.create({
	Constructor : function RayTracer2D()
	{
		this._myRay = null;	//TODO make many of these?
		this._myTree = null;
		this._myVisitedNodes = [];	//for debug rendering
		this._myNodeCollisionPoints = [];	//for debug rendering
		this._myItemCollisionPoints = [];	//for debug rendering
	},
	Parents : [],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		fireRay : function fireRay(inRootNode, inStartingPoint, inEndingPoint)
		{
			var i,
				aItemsList,
				anItem,
				aPoint,
				aHitItemsMap,
				aCurrentNode,
				aCollisionList,
				aT;
				
			this._myRay = ECGame.EngineLib.Ray2D.create(inRootNode, inStartingPoint, inEndingPoint);
			this._myTree = inRootNode;
			
			aHitItemsMap = {};
			aCollisionList = [];
			
			do
			{
				aCurrentNode = this._myRay.getCurrentNode();
				this._myVisitedNodes.push(aCurrentNode);
				this._myNodeCollisionPoints.push(this._myRay.getCurrentPoint());
				
				//look at this nodes items, and that of all its parents:
				while(aCurrentNode)
				{
					aItemsList = aCurrentNode._myItems;
					for(i = 0; i < aItemsList.length; ++i)
					{
						anItem = aItemsList[i];
						if(aHitItemsMap[anItem.getID()])
						{
							continue;
						}
						aT = this._myRay.intersectAABB(anItem.getAABB());
						if(aT === -1)
						{
							continue;
						}
						
						aHitItemsMap[anItem.getID()] = true;
						
						aPoint = this._myRay.getPoint(aT);
						this._myItemCollisionPoints.push(aPoint);
						
						aCollisionList.push({
							myItem : anItem,
							myPoint : aPoint,
							myT : aT
						});
					}
					aCurrentNode = aCurrentNode.getParent();
					//TODO if aCurrentNode (parent) already visited, break (need a speedy way to do it without adding data to nodes)
				}
			} while(this._myRay.update());
			
			aCollisionList.sort(
				function sortCollisions(inLHS, inRHS)
				{
					return inLHS.myT - inRHS.myT;
				}
			);
			
			return aCollisionList;
		},
		
		debugDraw : function debugDraw(inCanvas2DContext, inCameraRect)
		{
			var i,
				aCurrent,
				aDrawSize,
				aHalfDrawSize,
				aItemCollisionPointSize,
				aHalfItemCollisionPointSize,
				aEndPointDrawSize,
				aHalfEndPointDrawSize,
				aCurrentPointDrawSize,
				aHalfCurrentPointDrawSize;
			
			////////////////////////////////////////////
			//HACK TODO get all these from settings file
			aDrawSize = 10;
			aHalfDrawSize = aDrawSize / 2;
			aItemCollisionPointSize = 8;
			aHalfItemCollisionPointSize = aItemCollisionPointSize / 2;
			aEndPointDrawSize = 12;
			aHalfEndPointDrawSize = aEndPointDrawSize / 2;
			aCurrentPointDrawSize = 6;
			aHalfCurrentPointDrawSize = aCurrentPointDrawSize / 2;
			//HACK TODO get all these from settings file
			////////////////////////////////////////////
			
			ECGame.instance.graphics.drawDebugText("Debug Drawing Rays", 'rgba(255, 128, 128, 1.0)'/*HACK color goes in settings*/);
			ECGame.instance.graphics.drawDebugText("Node Intersection Count:" + this._myNodeCollisionPoints.length, 'rgba(255, 128, 128, 1.0)'/*HACK color goes in settings*/);
			ECGame.instance.graphics.drawDebugText("Item Intersection Count:" + this._myItemCollisionPoints.length, 'rgba(255, 128, 128, 1.0)'/*HACK color goes in settings*/);
			
			this._myTree.debugDraw(
				inCanvas2DContext
				,inCameraRect
				,'rgba(255, 0, 0, 1.0)'//HACK TODO put colors in the settings file
				,'rgba(0, 0, 0, 0.0)'//HACK TODO put colors in the settings file
				,'rgba(255, 0, 255, 1.0)'//HACK TODO put colors in the settings file
			);
			
			inCanvas2DContext.fillStyle = 'rgba(255, 255, 255, 1.0)';//HACK TODO put colors in the settings file
			aCurrent = this._myRay.getStartPoint();
			inCanvas2DContext.fillRect(
				aCurrent.myX - aHalfEndPointDrawSize - inCameraRect.myX,
				aCurrent.myY - aHalfEndPointDrawSize - inCameraRect.myY,
				aEndPointDrawSize,
				aEndPointDrawSize
			);
			aCurrent = this._myRay.getEndPoint();
			inCanvas2DContext.fillRect(
				aCurrent.myX - aHalfEndPointDrawSize - inCameraRect.myX,
				aCurrent.myY - aHalfEndPointDrawSize - inCameraRect.myY,
				aEndPointDrawSize,
				aEndPointDrawSize
			);
			inCanvas2DContext.strokeStyle = 'rgba(255, 255, 255, 1.0)';//HACK TODO put colors in the settings file;
			inCanvas2DContext.beginPath();
			aCurrent = this._myRay.getStartPoint();
			inCanvas2DContext.moveTo(aCurrent.myX - inCameraRect.myX, aCurrent.myY - inCameraRect.myY);
			aCurrent = this._myRay.getEndPoint();
			inCanvas2DContext.lineTo(aCurrent.myX - inCameraRect.myX, aCurrent.myY - inCameraRect.myY);
			inCanvas2DContext.stroke();
			
			inCanvas2DContext.strokeStyle = 'rgba(0, 0, 255, 1.0)';//HACK TODO put colors in the settings file;
			inCanvas2DContext.beginPath();
			aCurrent = this._myRay.getStartPoint();
			inCanvas2DContext.moveTo(aCurrent.myX - inCameraRect.myX, aCurrent.myY - inCameraRect.myY);
			aCurrent = this._myRay.getCurrentPoint();
			inCanvas2DContext.lineTo(aCurrent.myX - inCameraRect.myX, aCurrent.myY - inCameraRect.myY);
			inCanvas2DContext.stroke();
			
			inCanvas2DContext.strokeStyle = 'rgba(0, 255, 0, 1.0)';//HACK TODO put colors in the settings file
			for(i = 0; i < this._myVisitedNodes.length; ++i)
			{
				aCurrent = this._myVisitedNodes[i].getAABB();
				inCanvas2DContext.strokeRect(
					aCurrent.myX - inCameraRect.myX,
					aCurrent.myY - inCameraRect.myY,
					aCurrent.myWidth,
					aCurrent.myHeight
				);
			}
			
			inCanvas2DContext.fillStyle = 'rgba(255, 255, 0, 1.0)';//HACK TODO put colors in the settings file
			for(i = 0; i < this._myNodeCollisionPoints.length; ++i)
			{
				aCurrent = this._myNodeCollisionPoints[i];
				inCanvas2DContext.fillRect(
					aCurrent.myX - aHalfDrawSize - inCameraRect.myX,
					aCurrent.myY - aHalfDrawSize - inCameraRect.myY,
					aDrawSize,
					aDrawSize
				);
			}
			
			inCanvas2DContext.fillStyle = 'rgba(255, 0, 0, 1.0)';//HACK TODO put colors in the settings file
			for(i = 0; i < this._myItemCollisionPoints.length; ++i)
			{
				aCurrent = this._myItemCollisionPoints[i];
				inCanvas2DContext.fillRect(
					aCurrent.myX - aHalfItemCollisionPointSize - inCameraRect.myX,
					aCurrent.myY - aHalfItemCollisionPointSize - inCameraRect.myY,
					aItemCollisionPointSize,
					aItemCollisionPointSize
				);
			}
			
			inCanvas2DContext.fillStyle = 'rgba(0, 0, 255, 1.0)';//HACK TODO put colors in the settings file
			aCurrent = this._myRay.getCurrentPoint();
			inCanvas2DContext.fillRect(
				aCurrent.myX - aHalfCurrentPointDrawSize - inCameraRect.myX,
				aCurrent.myY - aHalfCurrentPointDrawSize - inCameraRect.myY,
				aCurrentPointDrawSize,
				aCurrentPointDrawSize
			);
		}
	}
});