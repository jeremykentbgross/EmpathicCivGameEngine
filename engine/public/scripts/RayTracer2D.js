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
						aT = this._myRay.intersectAABB(anItem.getAABB2D());
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
		
		debugDraw : function debugDraw(inGraphics)
		{
			var i,
				aCurrent,
				aNodeCollisionSize,
				aHalfNodeCollisionSize,
				aItemCollisionPointSize,
				aHalfItemCollisionPointSize,
				aEndPointDrawSize,
				aHalfEndPointDrawSize,
				aCurrentPointDrawSize,
				aHalfCurrentPointDrawSize;
			
			////////////////////////////////////////////
			//HACK TODO get all these from settings file
			aNodeCollisionSize = ECGame.Settings.Debug.Ray_NodeCollision_Size;//10;
			aHalfNodeCollisionSize = aNodeCollisionSize / 2;
			aItemCollisionPointSize = ECGame.Settings.Debug.Ray_ItemCollision_Size;//8;
			aHalfItemCollisionPointSize = aItemCollisionPointSize / 2;
			aEndPointDrawSize = ECGame.Settings.Debug.Ray_EndPoint_Size;//12;
			aHalfEndPointDrawSize = aEndPointDrawSize / 2;
			aCurrentPointDrawSize = ECGame.Settings.Debug.Ray_CurrentPoint_Size;//6;
			aHalfCurrentPointDrawSize = aCurrentPointDrawSize / 2;
			//HACK TODO get all these from settings file
			////////////////////////////////////////////
			
			inGraphics.drawDebugText("Debug Drawing Rays", 'rgba(255, 128, 128, 1.0)'/*HACK color goes in settings*/);
			inGraphics.drawDebugText("Node Intersection Count:" + this._myNodeCollisionPoints.length, 'rgba(255, 128, 128, 1.0)'/*HACK color goes in settings*/);
			inGraphics.drawDebugText("Item Intersection Count:" + this._myItemCollisionPoints.length, 'rgba(255, 128, 128, 1.0)'/*HACK color goes in settings*/);
			
			this._myTree.debugDraw(
				inGraphics
				,'rgba(255, 0, 0, 1.0)'//HACK TODO put colors in the settings file
				,'rgba(0, 0, 0, 0.0)'//HACK TODO put colors in the settings file
				,'rgba(255, 0, 255, 1.0)'//HACK TODO put colors in the settings file
			);
			
			inGraphics.setFillStyle('rgba(255, 255, 255, 1.0)');//HACK TODO put colors in the settings file
			aCurrent = this._myRay.getStartPoint();
			inGraphics.fillRectXYWH(
				aCurrent.myX - aHalfEndPointDrawSize,
				aCurrent.myY - aHalfEndPointDrawSize,
				aEndPointDrawSize,
				aEndPointDrawSize
			);
			aCurrent = this._myRay.getEndPoint();
			inGraphics.fillRectXYWH(
				aCurrent.myX - aHalfEndPointDrawSize,
				aCurrent.myY - aHalfEndPointDrawSize,
				aEndPointDrawSize,
				aEndPointDrawSize
			);
			inGraphics.setStrokeStyle('rgba(255, 255, 255, 1.0)');//HACK TODO put colors in the settings file;
			inGraphics.beginPath();
			inGraphics.moveTo(this._myRay.getStartPoint());
			inGraphics.lineTo(this._myRay.getEndPoint());
			inGraphics.stroke();
			
			inGraphics.setStrokeStyle('rgba(0, 0, 255, 1.0)');//HACK TODO put colors in the settings file;
			inGraphics.beginPath();
			inGraphics.moveTo(this._myRay.getStartPoint());
			inGraphics.lineTo(this._myRay.getCurrentPoint());
			inGraphics.stroke();
			
			inGraphics.setStrokeStyle('rgba(0, 255, 0, 1.0)');//HACK TODO put colors in the settings file
			for(i = 0; i < this._myVisitedNodes.length; ++i)
			{
				inGraphics.strokeRect(this._myVisitedNodes[i].getAABB2D());
			}
			
			inGraphics.setFillStyle('rgba(255, 255, 0, 1.0)');//HACK TODO put colors in the settings file
			for(i = 0; i < this._myNodeCollisionPoints.length; ++i)
			{
				aCurrent = this._myNodeCollisionPoints[i];
				inGraphics.fillRectXYWH(
					aCurrent.myX - aHalfNodeCollisionSize,
					aCurrent.myY - aHalfNodeCollisionSize,
					aNodeCollisionSize,
					aNodeCollisionSize
				);
			}
			
			inGraphics.setFillStyle('rgba(255, 0, 0, 1.0)');//HACK TODO put colors in the settings file
			for(i = 0; i < this._myItemCollisionPoints.length; ++i)
			{
				aCurrent = this._myItemCollisionPoints[i];
				inGraphics.fillRectXYWH(
					aCurrent.myX - aHalfItemCollisionPointSize,
					aCurrent.myY - aHalfItemCollisionPointSize,
					aItemCollisionPointSize,
					aItemCollisionPointSize
				);
			}
			
			inGraphics.setFillStyle('rgba(0, 0, 255, 1.0)');//HACK TODO put colors in the settings file
			aCurrent = this._myRay.getCurrentPoint();
			inGraphics.fillRectXYWH(
				aCurrent.myX - aHalfCurrentPointDrawSize,
				aCurrent.myY - aHalfCurrentPointDrawSize,
				aCurrentPointDrawSize,
				aCurrentPointDrawSize
			);
		}
	}
});