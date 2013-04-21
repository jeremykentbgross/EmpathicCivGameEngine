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
		this._myVisitedNodes = [];
		this._myNodeCollisionPoints = [];
		this._myItemCollisionPoints = [];
	},
	Parents : [],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		fireRay : function fireRay(inRootNode, inStartingPoint, inEndingPoint)
		{
			this._myRay = ECGame.EngineLib.Ray2D.create(inRootNode, inStartingPoint, inEndingPoint);
			this._myTree = inRootNode;
			
			this._myVisitedNodes.push(this._myRay.getCurrentNode());//TODO first node needs to consider content as well!!!
			while(this._myRay.update())
			{
				this._myVisitedNodes.push(this._myRay.getCurrentNode());
				this._myNodeCollisionPoints.push(this._myRay.getCurrentPoint());
				
				//HACK (plus points can be hit many times)
				var i;
				var items = this._myRay.getCurrentNode()._myItems;
				var aPoint;
				for(i = 0; i < items.length; ++i)
				{
					aPoint = this._myRay.intersectAABB(items[i].getAABB());//TODO return t? and then do t lookup?
					if(aPoint)
					{
						this._myItemCollisionPoints.push(aPoint);
					}
				}
			}
			
			/*
			TODO:
			
			nodeMap[id] = true;	//{content:[{item, first_intersection_t, point}]}
			itemMap[id] = {item, first_intersection_t, point}

			//NOTE!! Must map content as well since it gets inserted to multiple nodes!!
			for all ordered nodes
				queue = []
				map node //should not be needed
				for all content
					if !mapped
						find contents intersection points
						map it
					if point in node	//what if right on the boarder of the node?? processed instead? what if intersection in next node?
						queue contents
				for all ancestors
					if ancestor not mapped
						for all content
							if !mapped
								find content intersection points
								map ancestors contents
							if point in node
								queue ancestor contents
						map ancestors
					else
						for all content
							if point in node
								queue ancestors contents
				sort queue by intersection point T
				for all queued content
					//if(point contained in node)//should not be queued if it is not contained
						process()
						if(process complete)
							return;
			*/
		},
		
		debugDraw : function debugDraw(inCanvas2DContext, inCameraRect)
		{
			var i,
				aCurrent;
				
			var aDrawSize = 10;//HACK TODO get from settings file
			var aHalfDrawSize = aDrawSize / 2;//HACK TODO get from settings file
			
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
				aCurrent.myX - aHalfDrawSize - inCameraRect.myX,
				aCurrent.myY - aHalfDrawSize - inCameraRect.myY,
				aDrawSize,
				aDrawSize
			);
			aCurrent = this._myRay.getEndPoint();
			inCanvas2DContext.fillRect(
				aCurrent.myX - aDrawSize - inCameraRect.myX,
				aCurrent.myY - aDrawSize - inCameraRect.myY,
				2 * aDrawSize,
				2 * aDrawSize
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
					aCurrent.myX - aHalfDrawSize - inCameraRect.myX,
					aCurrent.myY - aHalfDrawSize - inCameraRect.myY,
					aDrawSize,
					aDrawSize
				);
			}
			
			inCanvas2DContext.fillStyle = 'rgba(0, 0, 255, 1.0)';//HACK TODO put colors in the settings file
			aCurrent = this._myRay.getCurrentPoint();
			inCanvas2DContext.fillRect(
				aCurrent.myX - aHalfDrawSize - inCameraRect.myX,
				aCurrent.myY - aHalfDrawSize - inCameraRect.myY,
				aDrawSize,
				aDrawSize
			);
		}
	}
});