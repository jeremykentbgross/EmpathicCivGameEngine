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

GameEngineLib.createGameQuadTree = function(instance, PRIVATE)
{
	instance = instance || {};
	PRIVATE = PRIVATE || {};
	if(GameSystemVars.DEBUG)
	{
		GameEngineLib.addDebugInfo("GameQuadTree", instance, PRIVATE);
	}
	
	//TODO rename gameRect treeItemBoundRect or something like that
		
	
	instance.init = function(inGame2DAABB, inMinSize)
	{
		PRIVATE.myGame2DAABB = inGame2DAABB || GameEngineLib.createGame2DAABB(0,0,1,1);//todo make sure it is pow2, but for now we trust input
		PRIVATE.myChildren = null;
		PRIVATE.myMinSize = inMinSize || 1;
		PRIVATE.myItems = [];
	};
	
	
	PRIVATE.createChildren = function()
	{
		var halfWidth;
		var halfHeight;
		if(PRIVATE.myChildren === null)
		{
			halfWidth = Math.floor(PRIVATE.myGame2DAABB.myWidth / 2);//Should be the same, and power of 2
			halfHeight = Math.floor(PRIVATE.myGame2DAABB.myHeight / 2);//Should be the same, and power of 2
			
			//if children will not be smaller than the min, create them
			if(!(halfWidth < PRIVATE.myMinSize || halfHeight < PRIVATE.myMinSize))
			{
				PRIVATE.myChildren = 
				[
					GameEngineLib.createGameQuadTree(),
					GameEngineLib.createGameQuadTree(),
					GameEngineLib.createGameQuadTree(),
					GameEngineLib.createGameQuadTree()
				];
				PRIVATE.myChildren[0].init(
					GameEngineLib.createGame2DAABB(
						PRIVATE.myGame2DAABB.myX, PRIVATE.myGame2DAABB.myY, halfWidth, halfHeight
					),
					PRIVATE.myMinSize
				);
				PRIVATE.myChildren[1].init(
					GameEngineLib.createGame2DAABB(
						PRIVATE.myGame2DAABB.myX + halfWidth, PRIVATE.myGame2DAABB.myY, halfWidth, halfHeight
					),
					PRIVATE.myMinSize
				);
				PRIVATE.myChildren[2].init(
					GameEngineLib.createGame2DAABB(
						PRIVATE.myGame2DAABB.myX, PRIVATE.myGame2DAABB.myY + halfHeight, halfWidth, halfHeight
					),
					PRIVATE.myMinSize
				);
				PRIVATE.myChildren[3].init(
					GameEngineLib.createGame2DAABB(
						PRIVATE.myGame2DAABB.myX + halfWidth, PRIVATE.myGame2DAABB.myY + halfHeight, halfWidth, halfHeight
					),
					PRIVATE.myMinSize
				);
			}
		}
	};
	
	
	
	//Note: you can delete the inserted item strait from the list of outContainingNodes
	//	this will skip traversing the tree for speed, but leaves behind empty nodes.
	//	if used, cleantree every so often
	instance.insertToSmallestContaining = function(inItem, outContainingNodes)
	{
		var i;
		var loops;
		
		if(PRIVATE.myGame2DAABB.containsRect(inItem.myGame2DAABB))
		{
			if(PRIVATE.myChildren === null)
			{
				PRIVATE.createChildren();
			}
			if(PRIVATE.myChildren !== null)
			{
				loops = PRIVATE.myChildren.length;
				for(i = 0; i < loops; ++i)
				{
					if(PRIVATE.myChildren[i].insertToSmallestContaining(inItem, outContainingNodes))
					{
						return true;
					}
				}
			}
			
			//it doesn't fit in the children so it goes here
			/*PRIVATE.myItems[PRIVATE.myItems.length] = inItem;
			if(outContainingNodes)
			{
				outContainingNodes[outContainingNodes.length] = this;
			}*/
			PRIVATE.myItems.push(inItem);
			if(outContainingNodes)
			{
				outContainingNodes.push(this);
			}
			
			return true;
		}
		
		return false;
	};
	
	
	
	//Note: you can delete the inserted item strait from the list of outContainingNodes
	//	this will skip traversing the tree for speed, but leaves behind empty nodes.
	//	if used, cleantree every so often
	instance.insertToAllBestFitting = function(inItem, outContainingNodes)
	{
		var i;
		var loops;
		var inserted = false;
		var targetNodesSize;//todo make this faster by not doing it every level??
		var thisNodeSize;//todo make this faster by not doing it every level??
		
		var minTargetNodesSize = Math.max(inItem.myGame2DAABB.myWidth, inItem.myGame2DAABB.myHeight);
		thisNodeSize = Math.max(PRIVATE.myGame2DAABB.myWidth, PRIVATE.myGame2DAABB.myHeight);
		if(thisNodeSize < minTargetNodesSize)
		{
			return false;
		}
		
		if(PRIVATE.myGame2DAABB.intersectsRect(inItem.myGame2DAABB))
		{
			if(PRIVATE.myChildren === null && !(thisNodeSize / 2 < minTargetNodesSize))
			{
				PRIVATE.createChildren();
			}
			if(PRIVATE.myChildren !== null)
			{
				loops = PRIVATE.myChildren.length;
				for(i = 0; i < loops; ++i)
				{
					if(PRIVATE.myChildren[i].insertToAllBestFitting(inItem, outContainingNodes))
					{
						inserted = true;
					}
				}
			}
			if(inserted)
			{
				return true;
			}
			
			
			/*if(PRIVATE.myItems.indexOf(inItem) !== -1)////////////////TODO DEBUG IS THIS NEEDED?
			{
				GameEngineLib.logger.error("Multiple insertions!");
			}*/
			
			//it doesn't fit in the children so it goes here
			PRIVATE.myItems.push(inItem);
			if(outContainingNodes)
			{
				outContainingNodes.push(this);
			}
			return true;
		}
		
		return false;
	};
	
	
	//TODO outArray[] containing the item
	instance.deleteItem = function(inItem)
	{
		var loops;
		var i;
		var keepChild = false;
		var targetNodesSize;//todo make this faster by not doing it every level??
		var thisNodeSize;
				
		if(PRIVATE.myGame2DAABB.intersectsRect(inItem.myGame2DAABB))
		{
			//if there are children and the children are not to small to contain the item:
			var minTargetNodesSize = Math.max(inItem.myGame2DAABB.myWidth, inItem.myGame2DAABB.myHeight);
			thisNodeSize = Math.max(PRIVATE.myGame2DAABB.myWidth, PRIVATE.myGame2DAABB.myHeight);
			if(PRIVATE.myChildren !== null && !(thisNodeSize / 2 < minTargetNodesSize))
			{
				loops = PRIVATE.myChildren.length;
				for(i = 0; i < loops; ++i)
				{
					if(PRIVATE.myChildren[i].deleteItem(inItem))//TODO this may not be right, maybe should return deleted? not if to keep child??
					{
						keepChild = true;
					}
				}
				if(!keepChild)
				{
					PRIVATE.myChildren = null;
				}
			}
			
			loops = PRIVATE.myItems.length;//////TODO should loop these first, if found return, else check children
			for(i = 0; i < loops; ++i)
			{
				var item = PRIVATE.myItems[i];
				if(item === inItem)
				{
					//delete it
					PRIVATE.myItems.splice(i,1);
					loops = PRIVATE.myItems.length;
					--i;
					break;
				}
			}
		}
		
		return (PRIVATE.myItems.length !==0) || (PRIVATE.myChildren !== null);
	};
	
	
	//TODO outArray[] containing deleted items, see deleteContained below
	instance.deleteIntersecting = function(inGame2DAABB)
	{
		var loops;
		var i;
		var keepChild = false;
		
		if(inGame2DAABB.containsRect(PRIVATE.myGame2DAABB))
		{
			PRIVATE.myChildren = null;
			PRIVATE.myItems = [];
			return false;
		}
		else if(PRIVATE.myGame2DAABB.intersectsRect(inGame2DAABB))
		{
			if(PRIVATE.myChildren !== null)
			{
				loops = PRIVATE.myChildren.length;
				for(i = 0; i < loops; ++i)
				{
					if(PRIVATE.myChildren[i].deleteIntersecting(inGame2DAABB))
					{
						keepChild = true;
					}
				}
				if(!keepChild)
				{
					PRIVATE.myChildren = null;
				}
			}
		
			loops = PRIVATE.myItems.length;
			for(i = 0; i < loops; ++i)
			{
				if(inGame2DAABB.intersectsRect(PRIVATE.myItems[i].myGame2DAABB))
				{
					//delete it
					PRIVATE.myItems.splice(i,1);
					loops = PRIVATE.myItems.length;
					--i;
				}
			}
		}
		
		return (PRIVATE.myItems.length !==0) || (PRIVATE.myChildren !== null);
	};
	
	
	instance.deleteContained = function(inGame2DAABB, outDeletedItems)
	{
		var loops;
		var i;
		var keepChild = false;
		outDeletedItems = outDeletedItems || [];
		
		if(inGame2DAABB.containsRect(PRIVATE.myGame2DAABB))
		{
			//delete everything
			for(i in PRIVATE.myItems)
			{
				outDeletedItems.push(PRIVATE.myItems[i]);
			}
			
			//traverse children for deleted items
			for(i in PRIVATE.myChildren)
			{
				PRIVATE.myChildren[i].deleteContained(inGame2DAABB, outDeletedItems);
			}
			
			PRIVATE.myChildren = null;
			PRIVATE.myItems = [];
			return false;
		}
		else if(PRIVATE.myGame2DAABB.intersectsRect(inGame2DAABB))
		{
			if(PRIVATE.myChildren !== null)
			{
				loops = PRIVATE.myChildren.length;
				for(i = 0; i < loops; ++i)
				{
					//if(PRIVATE.myChildren[i].deleteContained(inGame2DAABB, outDeletedItems))
					//	keepChild = true;
					keepChild = PRIVATE.myChildren[i].deleteContained(inGame2DAABB, outDeletedItems) || keepChild;
				}
				if(!keepChild)
				{
					PRIVATE.myChildren = null;
				}
			}
		
			loops = PRIVATE.myItems.length;
			for(i = 0; i < loops; ++i)
			{
				if(inGame2DAABB.containsRect(PRIVATE.myItems[i].myGame2DAABB))
				{
					//delete it
					outDeletedItems.push(PRIVATE.myItems[i]);
					PRIVATE.myItems.splice(i,1);
					loops = PRIVATE.myItems.length;
					--i;
				}
			}
		}
		
		return (PRIVATE.myItems.length !==0) || (PRIVATE.myChildren !== null);
	};
	

	
	instance.walk = function(inFunction, inGame2DAABB)
	{
		var item;
		var i;
		var loops;
		
		//if nothing is specified walk the whole tree
		inGame2DAABB = inGame2DAABB || PRIVATE.myGame2DAABB;
		
		if(PRIVATE.myGame2DAABB.intersectsRect(inGame2DAABB))
		{
			loops = PRIVATE.myItems.length;
			for(i = 0; i < loops; ++i)
			{
				item = PRIVATE.myItems[i];
				if(item.myGame2DAABB.intersectsRect(inGame2DAABB))
				{
					inFunction(item);
				}
			}
			if(PRIVATE.myChildren !== null)
			{
				loops = PRIVATE.myChildren.length;
				for(i = 0; i < loops; ++i)
				{
					/*if(*/PRIVATE.myChildren[i].walk(inFunction, inGame2DAABB);
						//return true;
				}
			}
		}
	};
	
	
	
	instance.debugDraw = function(inCanvas2DContext, inCameraRect, inNodeColor, inFullNodeColor, inItemColor)
	{
		var i;
		var debugItems = PRIVATE.myItems;
		
		inNodeColor = inNodeColor || GameSystemVars.Debug.SpacialPartitioningTree_Node_DrawColor;
		inFullNodeColor = inFullNodeColor || GameSystemVars.Debug.SpacialPartitioningTree_OccupiedNode_DrawColor;
		inItemColor = inItemColor || GameSystemVars.Debug.SpacialPartitioningTree_Item_DrawColor;
		//inCameraRect = inCameraRect || PRIVATE.myGame2DAABB;
		
		if(!PRIVATE.myGame2DAABB.intersectsRect(inCameraRect))
		{
			return;
		}
		
		if(PRIVATE.myItems.length !== 0)
		{
			inCanvas2DContext.strokeStyle = inItemColor;
			for(i in PRIVATE.myItems)
			{
				inCanvas2DContext.strokeRect(
					PRIVATE.myItems[i].myGame2DAABB.myX - inCameraRect.myX,
					PRIVATE.myItems[i].myGame2DAABB.myY - inCameraRect.myY,
					PRIVATE.myItems[i].myGame2DAABB.myWidth,
					PRIVATE.myItems[i].myGame2DAABB.myHeight
				);
			}
			
			inCanvas2DContext.strokeStyle = inFullNodeColor;
			inCanvas2DContext.strokeRect(
				PRIVATE.myGame2DAABB.myX - inCameraRect.myX + 1,
				PRIVATE.myGame2DAABB.myY - inCameraRect.myY + 1,
				PRIVATE.myGame2DAABB.myWidth - 2,
				PRIVATE.myGame2DAABB.myHeight - 2
			);
		}
	
		inCanvas2DContext.strokeStyle = inNodeColor;
		inCanvas2DContext.strokeRect(
			PRIVATE.myGame2DAABB.myX - inCameraRect.myX,
			PRIVATE.myGame2DAABB.myY - inCameraRect.myY,
			PRIVATE.myGame2DAABB.myWidth,
			PRIVATE.myGame2DAABB.myHeight
		);
				
		if(PRIVATE.myChildren !== null)
		{
			for(i = 0; i < PRIVATE.myChildren.length; ++i)
			{
				PRIVATE.myChildren[i].debugDraw(inCanvas2DContext, inCameraRect, inNodeColor, inFullNodeColor, inItemColor);
			}
		}
	};
	
	
	
	instance.cleanTree = function()
	{
		var keepChild = false;
		var i;

		if(PRIVATE.myChildren !== null)
		{
			var loops = PRIVATE.myChildren.length;
			for(i = 0; i < loops; ++i)
			{
				if(PRIVATE.myChildren[i].cleanTree())
				{
					keepChild = true;
				}
			}
			if(!keepChild)
			{
				PRIVATE.myChildren = null;
			}
		}
		
		return (PRIVATE.myItems.length !==0) || (PRIVATE.myChildren !== null);
	};
	
	
	
	return instance;
};