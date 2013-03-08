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

ECGame.EngineLib.GameQuadTreeItem = function GameQuadTreeItem(inAABB)
{
	this._AABB = inAABB;
};
ECGame.EngineLib.GameQuadTreeItem.prototype.constructor = ECGame.EngineLib.GameQuadTreeItem;

ECGame.EngineLib.GameQuadTreeItem.prototype.getAABB = function getAABB()
{
	return this._AABB;
};




ECGame.EngineLib.GameQuadTree = function GameQuadTree(){};
ECGame.EngineLib.GameQuadTree.prototype.constructor = ECGame.EngineLib.GameQuadTree;
ECGame.EngineLib.GameQuadTree.create = function create()
{
	return new ECGame.EngineLib.GameQuadTree();
};


//TODO get rid of init and create and just new this mother fucker
//TODO rename gameRect treeItemBoundRect or something like that
ECGame.EngineLib.GameQuadTree.prototype.init = function init(inGame2DAABB, inMinSize)
{
	this._AABB = inGame2DAABB || ECGame.EngineLib.createGame2DAABB(0,0,1,1);//todo make sure it is pow2, but for now we trust input
	this._myChildren = null;
	this._myMinSize = inMinSize || 1;
	this._myItems = [];
};



ECGame.EngineLib.GameQuadTree.prototype._createChildren = function _createChildren()
{
	var halfWidth,
		halfHeight;
	
	if(this._myChildren === null)
	{
		halfWidth = Math.floor(this._AABB.myWidth / 2);//Should be the same, and power of 2
		halfHeight = Math.floor(this._AABB.myHeight / 2);//Should be the same, and power of 2
		
		//if children will not be smaller than the min, create them
		if(!(halfWidth < this._myMinSize || halfHeight < this._myMinSize))
		{
			this._myChildren = 
			[
				ECGame.EngineLib.GameQuadTree.create(),
				ECGame.EngineLib.GameQuadTree.create(),
				ECGame.EngineLib.GameQuadTree.create(),
				ECGame.EngineLib.GameQuadTree.create()
			];
			this._myChildren[0].init(
				ECGame.EngineLib.createGame2DAABB(
					this._AABB.myX, this._AABB.myY, halfWidth, halfHeight
				),
				this._myMinSize
			);
			this._myChildren[1].init(
				ECGame.EngineLib.createGame2DAABB(
					this._AABB.myX + halfWidth, this._AABB.myY, halfWidth, halfHeight
				),
				this._myMinSize
			);
			this._myChildren[2].init(
				ECGame.EngineLib.createGame2DAABB(
					this._AABB.myX, this._AABB.myY + halfHeight, halfWidth, halfHeight
				),
				this._myMinSize
			);
			this._myChildren[3].init(
				ECGame.EngineLib.createGame2DAABB(
					this._AABB.myX + halfWidth, this._AABB.myY + halfHeight, halfWidth, halfHeight
				),
				this._myMinSize
			);
		}
	}
};



//Note: you can delete the inserted item strait from the list of outContainingNodes
//	this will skip traversing the tree for speed, but leaves behind empty nodes.
//	if used, cleantree every so often
ECGame.EngineLib.GameQuadTree.prototype.insertToSmallestContaining = function insertToSmallestContaining(inItem, outContainingNodes)
{
	var i, loops;
	
	if(this._AABB.containsRect(inItem.getAABB()))
	{
		if(this._myChildren === null)
		{
			this._createChildren();
		}
		if(this._myChildren !== null)
		{
			loops = this._myChildren.length;
			for(i = 0; i < loops; ++i)
			{
				if(this._myChildren[i].insertToSmallestContaining(inItem, outContainingNodes))
				{
					return true;
				}
			}
		}
		
		//it doesn't fit in the children so it goes here
		/*this._myItems[this._myItems.length] = inItem;
		if(outContainingNodes)
		{
			outContainingNodes[outContainingNodes.length] = this;
		}*/
		this._myItems.push(inItem);
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
ECGame.EngineLib.GameQuadTree.prototype.insertToAllBestFitting = function insertToAllBestFitting(inItem, outContainingNodes)
{
	var i,
		loops,
		inserted = false,
		thisNodeSize,//todo make this faster by not doing it every level??
		minTargetNodesSize;
	
	minTargetNodesSize = Math.max(inItem.getAABB().myWidth, inItem.getAABB().myHeight);
	thisNodeSize = Math.max(this._AABB.myWidth, this._AABB.myHeight);
	if(thisNodeSize < minTargetNodesSize)
	{
		return false;
	}
	
	if(this._AABB.intersectsRect(inItem.getAABB()))
	{
		if(this._myChildren === null && !(thisNodeSize / 2 < minTargetNodesSize))
		{
			this._createChildren();
		}
		if(this._myChildren !== null)
		{
			loops = this._myChildren.length;
			for(i = 0; i < loops; ++i)
			{
				if(this._myChildren[i].insertToAllBestFitting(inItem, outContainingNodes))
				{
					inserted = true;
				}
			}
		}
		if(inserted)
		{
			return true;
		}
		
		
		/*if(this._myItems.indexOf(inItem) !== -1)////////////////TODO DEBUG IS THIS NEEDED?
		{
			ECGame.log.error("Multiple insertions!");
		}*/
		
		//it doesn't fit in the children so it goes here
		this._myItems.push(inItem);
		if(outContainingNodes)
		{
			outContainingNodes.push(this);
		}
		return true;
	}
	
	return false;
};



//TODO outArray[] containing the item
ECGame.EngineLib.GameQuadTree.prototype.deleteItem = function deleteItem(inItem)
{
	var loops,
		i,
		keepChild = false,
		thisNodeSize,
		minTargetNodesSize,
		item;
	
	if(this._AABB.intersectsRect(inItem.getAABB()))
	{
		//if there are children and the children are not to small to contain the item:
		minTargetNodesSize = Math.max(inItem.getAABB().myWidth, inItem.getAABB().myHeight);
		thisNodeSize = Math.max(this._AABB.myWidth, this._AABB.myHeight);
		if(this._myChildren !== null && !(thisNodeSize / 2 < minTargetNodesSize))
		{
			loops = this._myChildren.length;
			for(i = 0; i < loops; ++i)
			{
				if(this._myChildren[i].deleteItem(inItem))//TODO this may not be right, maybe should return deleted? not if to keep child??
				{
					keepChild = true;
				}
			}
			if(!keepChild)
			{
				this._myChildren = null;
			}
		}
		
		loops = this._myItems.length;//////TODO should loop these first, if found return, else check children
		for(i = 0; i < loops; ++i)
		{
			item = this._myItems[i];
			if(item === inItem)
			{
				//delete it
				this._myItems.splice(i,1);
				loops = this._myItems.length;
				--i;
				break;
			}
		}
	}
	
	return (this._myItems.length !==0) || (this._myChildren !== null);
};



//TODO outArray[] containing deleted items, see deleteContained below
ECGame.EngineLib.GameQuadTree.prototype.deleteIntersecting = function deleteIntersecting(inGame2DAABB)
{
	var loops,
		i,
		keepChild = false;
	
	if(inGame2DAABB.containsRect(this._AABB))
	{
		this._myChildren = null;
		this._myItems = [];
		return false;
	}
	else if(this._AABB.intersectsRect(inGame2DAABB))
	{
		if(this._myChildren !== null)
		{
			loops = this._myChildren.length;
			for(i = 0; i < loops; ++i)
			{
				if(this._myChildren[i].deleteIntersecting(inGame2DAABB))
				{
					keepChild = true;
				}
			}
			if(!keepChild)
			{
				this._myChildren = null;
			}
		}
	
		loops = this._myItems.length;
		for(i = 0; i < loops; ++i)
		{
			if(inGame2DAABB.intersectsRect(this._myItems[i].getAABB()))
			{
				//delete it
				this._myItems.splice(i,1);
				loops = this._myItems.length;
				--i;
			}
		}
	}
	
	return (this._myItems.length !==0) || (this._myChildren !== null);
};



ECGame.EngineLib.GameQuadTree.prototype.deleteContained = function deleteContained(inGame2DAABB, outDeletedItems)
{
	var loops,
		i,
		keepChild = false;
	
	outDeletedItems = outDeletedItems || [];
	
	if(inGame2DAABB.containsRect(this._AABB))
	{
		//delete everything
		for(i in this._myItems)
		{
			outDeletedItems.push(this._myItems[i]);
		}
		
		//traverse children for deleted items
		for(i in this._myChildren)
		{
			this._myChildren[i].deleteContained(inGame2DAABB, outDeletedItems);
		}
		
		this._myChildren = null;
		this._myItems = [];
		return false;
	}
	else if(this._AABB.intersectsRect(inGame2DAABB))
	{
		if(this._myChildren !== null)
		{
			loops = this._myChildren.length;
			for(i = 0; i < loops; ++i)
			{
				//if(this._myChildren[i].deleteContained(inGame2DAABB, outDeletedItems))
				//	keepChild = true;
				keepChild = this._myChildren[i].deleteContained(inGame2DAABB, outDeletedItems) || keepChild;
			}
			if(!keepChild)
			{
				this._myChildren = null;
			}
		}
	
		loops = this._myItems.length;
		for(i = 0; i < loops; ++i)
		{
			if(inGame2DAABB.containsRect(this._myItems[i].getAABB()))
			{
				//delete it
				outDeletedItems.push(this._myItems[i]);
				this._myItems.splice(i,1);
				loops = this._myItems.length;
				--i;
			}
		}
	}
	
	return (this._myItems.length !==0) || (this._myChildren !== null);
};



ECGame.EngineLib.GameQuadTree.prototype.walk = function walk(inFunction, inGame2DAABB)
{
	var item,
		i,
		loops;
	
	//if nothing is specified walk the whole tree
	inGame2DAABB = inGame2DAABB || this._AABB;
	
	if(this._AABB.intersectsRect(inGame2DAABB))
	{
		loops = this._myItems.length;
		for(i = 0; i < loops; ++i)
		{
			item = this._myItems[i];
			if(item.getAABB().intersectsRect(inGame2DAABB))
			{
				inFunction(item);
			}
		}
		if(this._myChildren !== null)
		{
			loops = this._myChildren.length;
			for(i = 0; i < loops; ++i)
			{
				/*if(*/this._myChildren[i].walk(inFunction, inGame2DAABB);
					//return true;
			}
		}
	}
};



ECGame.EngineLib.GameQuadTree.prototype.debugDraw = function debugDraw(inCanvas2DContext, inCameraRect, inNodeColor, inFullNodeColor, inItemColor)
{
	var i,
		debugItems = this._myItems;
	
	inNodeColor = inNodeColor || ECGame.Settings.Debug.SpacialPartitioningTree_Node_DrawColor;
	inFullNodeColor = inFullNodeColor || ECGame.Settings.Debug.SpacialPartitioningTree_OccupiedNode_DrawColor;
	inItemColor = inItemColor || ECGame.Settings.Debug.SpacialPartitioningTree_Item_DrawColor;
	//inCameraRect = inCameraRect || this._AABB;
	
	if(!this._AABB.intersectsRect(inCameraRect))
	{
		return;
	}
	
	if(this._myItems.length !== 0)
	{
		inCanvas2DContext.strokeStyle = inItemColor;
		for(i in this._myItems)
		{
			inCanvas2DContext.strokeRect(
				this._myItems[i].getAABB().myX - inCameraRect.myX,
				this._myItems[i].getAABB().myY - inCameraRect.myY,
				this._myItems[i].getAABB().myWidth,
				this._myItems[i].getAABB().myHeight
			);
		}
		
		inCanvas2DContext.strokeStyle = inFullNodeColor;
		inCanvas2DContext.strokeRect(
			this._AABB.myX - inCameraRect.myX + 1,
			this._AABB.myY - inCameraRect.myY + 1,
			this._AABB.myWidth - 2,
			this._AABB.myHeight - 2
		);
	}

	inCanvas2DContext.strokeStyle = inNodeColor;
	inCanvas2DContext.strokeRect(
		this._AABB.myX - inCameraRect.myX,
		this._AABB.myY - inCameraRect.myY,
		this._AABB.myWidth,
		this._AABB.myHeight
	);
			
	if(this._myChildren !== null)
	{
		for(i = 0; i < this._myChildren.length; ++i)
		{
			this._myChildren[i].debugDraw(inCanvas2DContext, inCameraRect, inNodeColor, inFullNodeColor, inItemColor);
		}
	}
};



ECGame.EngineLib.GameQuadTree.prototype.cleanTree = function cleanTree()
{
	var keepChild = false,
		i,
		loops;

	if(this._myChildren !== null)
	{
		loops = this._myChildren.length;
		for(i = 0; i < loops; ++i)
		{
			if(this._myChildren[i].cleanTree())
			{
				keepChild = true;
			}
		}
		if(!keepChild)
		{
			this._myChildren = null;
		}
	}
	
	return (this._myItems.length !==0) || (this._myChildren !== null);
};