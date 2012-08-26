GameEngineLib.createGameQuadTree = function(instance, private)
{
	instance = instance || {};
	private = private || {};
	if(GameSystemVars.DEBUG)
	{
		GameEngineLib.addDebugInfo("GameQuadTree", instance, private);
	}
	
	//TODO rename gameRect treeItemBoundRect or something like that
		
	
	instance.init = function(inGame2DAABB, inMinSize)
	{
		private.myGame2DAABB = inGame2DAABB || GameEngineLib.createGame2DAABB(0,0,1,1);//todo make sure it is pow2, but for now we trust input
		private.myChildren = null;
		private.myMinSize = inMinSize || 1;
		private.myItems = [];
	}
	
	
	private.createChildren = function()
	{
		var halfWidth;
		var halfHeight;
		if(private.myChildren === null)
		{
			halfWidth = Math.floor(private.myGame2DAABB.myWidth / 2);//Should be the same, and power of 2
			halfHeight = Math.floor(private.myGame2DAABB.myHeight / 2);//Should be the same, and power of 2
			
			//if children will not be smaller than the min, create them
			if(!(halfWidth < private.myMinSize || halfHeight < private.myMinSize))
			{
				private.myChildren = 
				[
					GameEngineLib.createGameQuadTree(),
					GameEngineLib.createGameQuadTree(),
					GameEngineLib.createGameQuadTree(),
					GameEngineLib.createGameQuadTree()
				];
				private.myChildren[0].init(
					GameEngineLib.createGame2DAABB(
						private.myGame2DAABB.myX, private.myGame2DAABB.myY, halfWidth, halfHeight
					),
					private.myMinSize
				);
				private.myChildren[1].init(
					GameEngineLib.createGame2DAABB(
						private.myGame2DAABB.myX + halfWidth, private.myGame2DAABB.myY, halfWidth, halfHeight
					),
					private.myMinSize
				);
				private.myChildren[2].init(
					GameEngineLib.createGame2DAABB(
						private.myGame2DAABB.myX, private.myGame2DAABB.myY + halfHeight, halfWidth, halfHeight
					),
					private.myMinSize
				);
				private.myChildren[3].init(
					GameEngineLib.createGame2DAABB(
						private.myGame2DAABB.myX + halfWidth, private.myGame2DAABB.myY + halfHeight, halfWidth, halfHeight
					),
					private.myMinSize
				);
			}
		}
	}
	
	
	
	//Note: you can delete the inserted item strait from the list of outContainingNodes
	//	this will skip traversing the tree for speed, but leaves behind empty nodes.
	//	if used, cleantree every so often
	instance.insertToSmallestContaining = function(inItem, outContainingNodes)
	{
		var i;
		var loops;
		
		if(private.myGame2DAABB.containsRect(inItem.myGame2DAABB))
		{
			if(private.myChildren === null)
			{
				private.createChildren();
			}
			if(private.myChildren !== null)
			{
				loops = private.myChildren.length;
				for(i = 0; i < loops; ++i)
				{
					if(private.myChildren[i].insertToSmallestContaining(inItem, outContainingNodes))
						return true;
				}
			}
			
			//it doesn't fit in the children so it goes here
			/*private.myItems[private.myItems.length] = inItem;
			if(outContainingNodes)
			{
				outContainingNodes[outContainingNodes.length] = this;
			}*/
			private.myItems.push(inItem);
			if(outContainingNodes)
			{
				outContainingNodes.push(this);
			}
			
			return true;
		}
		
		return false;
	}
	
	
	
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
		
		minTargetNodesSize = Math.max(inItem.myGame2DAABB.myWidth, inItem.myGame2DAABB.myHeight);
		thisNodeSize = Math.max(private.myGame2DAABB.myWidth, private.myGame2DAABB.myHeight);
		if(thisNodeSize < minTargetNodesSize)
			return false;
		
		if(private.myGame2DAABB.intersectsRect(inItem.myGame2DAABB))
		{
			if(private.myChildren === null && !(thisNodeSize / 2 < minTargetNodesSize))
			{
				private.createChildren();
			}
			if(private.myChildren !== null)
			{
				loops = private.myChildren.length;
				for(i = 0; i < loops; ++i)
				{
					if(private.myChildren[i].insertToAllBestFitting(inItem, outContainingNodes))
						inserted = true;
				}
			}
			if(inserted)
				return true;
			
			
			/*if(private.myItems.indexOf(inItem) !== -1)////////////////TODO DEBUG IS THIS NEEDED?
			{
				GameEngineLib.logger.error("Multiple insertions!");
			}*/
			
			//it doesn't fit in the children so it goes here
			private.myItems.push(inItem);
			if(outContainingNodes)
			{
				outContainingNodes.push(this);
			}
			return true;
		}
		
		return false;
	}
	
	
	//TODO outArray[] containing the item
	instance.deleteItem = function(inItem)
	{
		var loops;
		var i;
		var keepChild = false;
		var targetNodesSize;//todo make this faster by not doing it every level??
		var thisNodeSize;
				
		if(private.myGame2DAABB.intersectsRect(inItem.myGame2DAABB))
		{
			//if there are children and the children are not to small to contain the item:
			minTargetNodesSize = Math.max(inItem.myGame2DAABB.myWidth, inItem.myGame2DAABB.myHeight);
			thisNodeSize = Math.max(private.myGame2DAABB.myWidth, private.myGame2DAABB.myHeight);
			if(private.myChildren !== null && !(thisNodeSize / 2 < minTargetNodesSize))
			{
				loops = private.myChildren.length;
				for(i = 0; i < loops; ++i)
				{
					if(private.myChildren[i].deleteItem(inItem))//TODO this may not be right, maybe should return deleted? not if to keep child??
						keepChild = true;
				}
				if(!keepChild)
					private.myChildren = null;
			}
			
			loops = private.myItems.length;//////TODO should loop these first, if found return, else check children
			for(i = 0; i < loops; ++i)
			{
				item = private.myItems[i];
				if(item === inItem)
				{
					//delete it
					private.myItems.splice(i,1);
					loops = private.myItems.length;
					--i;
					break;
				}
			}
		}
		
		return (private.myItems.length !==0) || (private.myChildren !== null);
	}
	
	
	//TODO outArray[] containing deleted items, see deleteContained below
	instance.deleteIntersecting = function(inGame2DAABB)
	{
		var loops;
		var i;
		var keepChild = false;
		
		if(inGame2DAABB.containsRect(private.myGame2DAABB))
		{
			private.myChildren = null;
			private.myItems = [];
			return false;
		}
		else if(private.myGame2DAABB.intersectsRect(inGame2DAABB))
		{
			if(private.myChildren !== null)
			{
				loops = private.myChildren.length;
				for(i = 0; i < loops; ++i)
				{
					if(private.myChildren[i].deleteIntersecting(inGame2DAABB))
						keepChild = true;
				}
				if(!keepChild)
					private.myChildren = null;
			}
		
			loops = private.myItems.length;
			for(i = 0; i < loops; ++i)
			{
				if(inGame2DAABB.intersectsRect(private.myItems[i].myGame2DAABB))
				{
					//delete it
					private.myItems.splice(i,1);
					loops = private.myItems.length;
					--i;
				}
			}
		}
		
		return (private.myItems.length !==0) || (private.myChildren !== null);
	}
	
	
	instance.deleteContained = function(inGame2DAABB, outDeletedItems)
	{
		var loops;
		var i;
		var keepChild = false;
		outDeletedItems = outDeletedItems || [];
		
		if(inGame2DAABB.containsRect(private.myGame2DAABB))
		{
			//delete everything
			for(var i in private.myItems)
				outDeletedItems.push(private.myItems[i]);
			
			//traverse children for deleted items
			for(var i in private.myChildren)
				private.myChildren[i].deleteContained(inGame2DAABB, outDeletedItems);
			
			private.myChildren = null;
			private.myItems = [];
			return false;
		}
		else if(private.myGame2DAABB.intersectsRect(inGame2DAABB))
		{
			if(private.myChildren !== null)
			{
				loops = private.myChildren.length;
				for(i = 0; i < loops; ++i)
				{
					//if(private.myChildren[i].deleteContained(inGame2DAABB, outDeletedItems))
					//	keepChild = true;
					keepChild = private.myChildren[i].deleteContained(inGame2DAABB, outDeletedItems) || keepChild;
				}
				if(!keepChild)
					private.myChildren = null;
			}
		
			loops = private.myItems.length;
			for(i = 0; i < loops; ++i)
			{
				if(inGame2DAABB.containsRect(private.myItems[i].myGame2DAABB))
				{
					//delete it
					outDeletedItems.push(private.myItems[i]);
					private.myItems.splice(i,1);
					loops = private.myItems.length;
					--i;
				}
			}
		}
		
		return (private.myItems.length !==0) || (private.myChildren !== null);
	}
	

	
	instance.walk = function(inFunction, inGame2DAABB)
	{
		var item;
		var i;
		var loops;
		
		//if nothing is specified walk the whole tree
		inGame2DAABB = inGame2DAABB || private.myGame2DAABB;
		
		if(private.myGame2DAABB.intersectsRect(inGame2DAABB))
		{
			loops = private.myItems.length;
			for(i = 0; i < loops; ++i)
			{
				item = private.myItems[i];
				if(item.myGame2DAABB.intersectsRect(inGame2DAABB))
					inFunction(item);
			}
			if(private.myChildren !== null)
			{
				loops = private.myChildren.length;
				for(i = 0; i < loops; ++i)
				{
					/*if*/(private.myChildren[i].walk(inFunction, inGame2DAABB))
						//return true;
				}
			}
		}
	}
	
	
	
	instance.debugDraw = function(inCanvas2DContext, inCameraRect, inNodeColor, inFullNodeColor, inItemColor)
	{
		var i;
		var debugItems = private.myItems;
		
		inNodeColor = inNodeColor || GameSystemVars.Debug.SpacialPartitioningTree_Node_DrawColor;
		inFullNodeColor = inFullNodeColor || GameSystemVars.Debug.SpacialPartitioningTree_OccupiedNode_DrawColor;
		inItemColor = inItemColor || GameSystemVars.Debug.SpacialPartitioningTree_Item_DrawColor;
		//inCameraRect = inCameraRect || private.myGame2DAABB;
		
		if(!private.myGame2DAABB.intersectsRect(inCameraRect))
			return;
		
		if(private.myItems.length !== 0)
		{
			inCanvas2DContext.strokeStyle = inItemColor;
			for(var i in private.myItems)
			{
				inCanvas2DContext.strokeRect(
					private.myItems[i].myGame2DAABB.myX - inCameraRect.myX,
					private.myItems[i].myGame2DAABB.myY - inCameraRect.myY,
					private.myItems[i].myGame2DAABB.myWidth,
					private.myItems[i].myGame2DAABB.myHeight
				);
			}
			
			inCanvas2DContext.strokeStyle = inFullNodeColor;
			inCanvas2DContext.strokeRect(
				private.myGame2DAABB.myX - inCameraRect.myX + 1,
				private.myGame2DAABB.myY - inCameraRect.myY + 1,
				private.myGame2DAABB.myWidth - 2,
				private.myGame2DAABB.myHeight - 2
			);
		}
	
		inCanvas2DContext.strokeStyle = inNodeColor;
		inCanvas2DContext.strokeRect(
			private.myGame2DAABB.myX - inCameraRect.myX,
			private.myGame2DAABB.myY - inCameraRect.myY,
			private.myGame2DAABB.myWidth,
			private.myGame2DAABB.myHeight
		);
				
		if(private.myChildren !== null)
		{
			for(i = 0; i < private.myChildren.length; ++i)
			{
				private.myChildren[i].debugDraw(inCanvas2DContext, inCameraRect, inNodeColor, inFullNodeColor, inItemColor);
			}
		}
	}
	
	
	
	instance.cleanTree = function()
	{
		var keepChild = false;
		var i;

		if(private.myChildren !== null)
		{
			loops = private.myChildren.length;
			for(i = 0; i < loops; ++i)
			{
				if(private.myChildren[i].cleanTree())
					keepChild = true;
			}
			if(!keepChild)
				private.myChildren = null;
		}
		
		return (private.myItems.length !==0) || (private.myChildren !== null);
	}
	
	
	
	return instance;
}