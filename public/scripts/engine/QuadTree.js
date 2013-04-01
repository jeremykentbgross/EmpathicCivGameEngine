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
	this._myAABB = inAABB;
};
ECGame.EngineLib.GameQuadTreeItem.prototype.constructor = ECGame.EngineLib.GameQuadTreeItem;

ECGame.EngineLib.GameQuadTreeItem.prototype.getAABB = function getAABB()
{
	return this._myAABB;
};




ECGame.EngineLib.GameQuadTree = function GameQuadTree(){};
ECGame.EngineLib.GameQuadTree.prototype.constructor = ECGame.EngineLib.GameQuadTree;
ECGame.EngineLib.GameQuadTree.create = function create()
{
	return new ECGame.EngineLib.GameQuadTree();
};


//TODO get rid of init and create and just new this mother fucker
ECGame.EngineLib.GameQuadTree.prototype.init = function init(inGame2DAABB, inMinSize, inParent)
{
	this._myAABB = inGame2DAABB || ECGame.EngineLib.AABB2.create(0,0,1,1);
	this._myChildren = null;
	this._myMinSize = inMinSize || 1;
	this._myItems = [];
	this._myParent = inParent || null;
	//TODO solid space??
	
	ECGame.log.assert(this._myAABB.myWidth === this._myAABB.myHeight, "QuadTree Node is not a square.");
};



ECGame.EngineLib.GameQuadTree.prototype._createChildren = function _createChildren()
{
	var aHalfWidth,
		aHalfHeight,
		createAABB = ECGame.EngineLib.AABB2.create;
	
	if(this._myChildren === null)
	{
		aHalfWidth = Math.floor(this._myAABB.myWidth / 2);//Should be the same, and power of 2
		aHalfHeight = Math.floor(this._myAABB.myHeight / 2);//Should be the same, and power of 2
		
		//if children will not be smaller than the min, create them
		if(!(aHalfWidth < this._myMinSize || aHalfHeight < this._myMinSize))
		{
			this._myChildren = 
			[
				ECGame.EngineLib.GameQuadTree.create(),
				ECGame.EngineLib.GameQuadTree.create(),
				ECGame.EngineLib.GameQuadTree.create(),
				ECGame.EngineLib.GameQuadTree.create()
			];
			this._myChildren[0].init(
				createAABB(this._myAABB.myX, this._myAABB.myY, aHalfWidth, aHalfHeight)
				,this._myMinSize
				,this
			);
			this._myChildren[1].init(
				createAABB(this._myAABB.myX + aHalfWidth, this._myAABB.myY, aHalfWidth, aHalfHeight),
				this._myMinSize,
				this
			);
			this._myChildren[2].init(
				createAABB(this._myAABB.myX, this._myAABB.myY + aHalfHeight, aHalfWidth, aHalfHeight),
				this._myMinSize,
				this
			);
			this._myChildren[3].init(
				createAABB(this._myAABB.myX + aHalfWidth, this._myAABB.myY + aHalfHeight, aHalfWidth, aHalfHeight),
				this._myMinSize,
				this
			);
		}
	}
};



//Note: you can delete the inserted item strait from the list of outContainingNodes
ECGame.EngineLib.GameQuadTree.prototype.insertToSmallestContaining = function insertToSmallestContaining(inItem, outContainingNodes, inTargetNodesMinSize)
{
	var i, aThisNodesSize;
	
	if(this._myAABB.containsRect(inItem.getAABB()))
	{
		inTargetNodesMinSize = inTargetNodesMinSize || Math.max(inItem.getAABB().myWidth, inItem.getAABB().myHeight);
		aThisNodesSize = Math.max(this._myAABB.myWidth, this._myAABB.myHeight);

		if(aThisNodesSize / 2 < Math.max(inTargetNodesMinSize, this._myMinSize))
		{
			//ECGame.log.assert(this._myItems.indexOf(inItem) === -1,"Multiple insertions!");
			
			//it doesn't fit in the children so it goes here
			this._myItems.push(inItem);
			if(outContainingNodes)
			{
				outContainingNodes.push(this);
			}
		}
		else
		{
			if(this._myChildren === null)
			{
				this._createChildren();
			}
			if(this._myChildren !== null)
			{
				for(i = 0; i < this._myChildren.length; ++i)
				{
					this._myChildren[i].insertToSmallestContaining(inItem, outContainingNodes, inTargetNodesMinSize);
				}
			}
		}
	}
};



//Note: you can delete the inserted item strait from the list of outContainingNodes
ECGame.EngineLib.GameQuadTree.prototype.insertToAllBestFitting = function insertToAllBestFitting(inItem, outContainingNodes, inTargetNodesMinSize)
{
	var i, aThisNodesSize;
	
	inTargetNodesMinSize = inTargetNodesMinSize || Math.max(inItem.getAABB().myWidth, inItem.getAABB().myHeight);
	aThisNodesSize = Math.max(this._myAABB.myWidth, this._myAABB.myHeight);
	
	if(aThisNodesSize < inTargetNodesMinSize)
	{
		return;
	}
	
	if(this._myAABB.intersectsRect(inItem.getAABB()))
	{
		if(aThisNodesSize / 2 < Math.max(inTargetNodesMinSize, this._myMinSize))
		{
			//ECGame.log.assert(this._myItems.indexOf(inItem) === -1,"Multiple insertions!");
			
			//it doesn't fit in the children so it goes here
			this._myItems.push(inItem);
			if(outContainingNodes)
			{
				outContainingNodes.push(this);
			}
		}
		else
		{
			if(this._myChildren === null)
			{
				this._createChildren();
			}
			if(this._myChildren !== null)
			{
				for(i = 0; i < this._myChildren.length; ++i)
				{
					this._myChildren[i].insertToAllBestFitting(inItem, outContainingNodes, inTargetNodesMinSize);
				}
			}
		}
	}
};



ECGame.EngineLib.GameQuadTree.prototype.deleteItem = function deleteItem(inItem, inTargetNodesMinSize)
{
	var i, aThisNodesSize;
	
	if(this._myAABB.intersectsRect(inItem.getAABB()))
	{
		inTargetNodesMinSize = inTargetNodesMinSize || Math.max(inItem.getAABB().myWidth, inItem.getAABB().myHeight);
		aThisNodesSize = Math.max(this._myAABB.myWidth, this._myAABB.myHeight);
		
		//if there are children and the children are not to small to contain the item:
		if(this._myChildren !== null && !(aThisNodesSize / 2 < Math.max(inTargetNodesMinSize, this._myMinSize)))
		{
			for(i = 0; i < this._myChildren.length; ++i)
			{
				this._myChildren[i].deleteItem(inItem, inTargetNodesMinSize);
			}
		}
		
		i = this._myItems.indexOf(inItem);
		if(i !== -1)
		{
			this._myItems.splice(i,1);
		}
		
		this.pruneTowardsRoot();
	}
};


/*
//TODO outArray[] containing deleted items, see deleteContained below
ECGame.EngineLib.GameQuadTree.prototype.deleteIntersecting = function deleteIntersecting(inGame2DAABB)
{
	var loops,
		i,
		keepChild = false;
	
	if(inGame2DAABB.containsRect(this._myAABB))
	{
		this._myChildren = null;
		this._myItems = [];
		return false;
	}
	else if(this._myAABB.intersectsRect(inGame2DAABB))
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
};*/



ECGame.EngineLib.GameQuadTree.prototype.deleteContained = function deleteContained(inGame2DAABB, outDeletedItems)
{
	var i, aKeepChildren, aChild;
	
	outDeletedItems = outDeletedItems || [];
	aKeepChildren = false;
	
	if(inGame2DAABB.containsRect(this._myAABB))
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
	}
	else if(this._myAABB.intersectsRect(inGame2DAABB))
	{
		if(this._myChildren !== null)
		{
			for(i = 0; i < this._myChildren.length; ++i)
			{
				aChild = this._myChildren[i];
				aChild.deleteContained(inGame2DAABB, outDeletedItems);
				aKeepChildren = aKeepChildren || aChild.containsItems();
			}
			if(!aKeepChildren)
			{
				this._myChildren = null;
			}
		}
	
		for(i = 0; i < this._myItems.length; ++i)
		{
			if(inGame2DAABB.containsRect(this._myItems[i].getAABB()))
			{
				//delete it
				outDeletedItems.push(this._myItems[i]);
				this._myItems.splice(i,1);
				--i;
			}
		}
	}
};



ECGame.EngineLib.GameQuadTree.prototype.walk = function walk(inFunction, inGame2DAABB)
{
	var aItem, i;
	
	//if nothing is specified walk the whole tree
	inGame2DAABB = inGame2DAABB || this._myAABB;
	
	if(this._myAABB.intersectsRect(inGame2DAABB))
	{
		for(i = 0; i < this._myItems.length; ++i)
		{
			aItem = this._myItems[i];
			if(aItem.getAABB().intersectsRect(inGame2DAABB))
			{
				inFunction(aItem);
			}
		}
		if(this._myChildren !== null)
		{
			for(i = 0; i < this._myChildren.length; ++i)
			{
				this._myChildren[i].walk(inFunction, inGame2DAABB);
			}
		}
	}
};



ECGame.EngineLib.GameQuadTree.prototype.debugDraw = function debugDraw(inCanvas2DContext, inCameraRect, inNodeColor, inFullNodeColor, inItemColor)
{
	var i;
	
	inNodeColor = inNodeColor || ECGame.Settings.Debug.SpacialPartitioningTree_Node_DrawColor;
	inFullNodeColor = inFullNodeColor || ECGame.Settings.Debug.SpacialPartitioningTree_OccupiedNode_DrawColor;
	inItemColor = inItemColor || ECGame.Settings.Debug.SpacialPartitioningTree_Item_DrawColor;
	//inCameraRect = inCameraRect || this._myAABB;
	
	if(!this._myAABB.intersectsRect(inCameraRect))
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
			this._myAABB.myX - inCameraRect.myX + 1,
			this._myAABB.myY - inCameraRect.myY + 1,
			this._myAABB.myWidth - 2,
			this._myAABB.myHeight - 2
		);
	}

	inCanvas2DContext.strokeStyle = inNodeColor;
	inCanvas2DContext.strokeRect(
		this._myAABB.myX - inCameraRect.myX,
		this._myAABB.myY - inCameraRect.myY,
		this._myAABB.myWidth,
		this._myAABB.myHeight
	);
			
	if(this._myChildren !== null)
	{
		for(i = 0; i < this._myChildren.length; ++i)
		{
			this._myChildren[i].debugDraw(inCanvas2DContext, inCameraRect, inNodeColor, inFullNodeColor, inItemColor);
		}
	}
};



ECGame.EngineLib.GameQuadTree.prototype.containsItems = function containsItems()
{
	return (this._myItems.length !== 0 || this._myChildren !== null);
};



ECGame.EngineLib.GameQuadTree.prototype.pruneTowardsRoot = function pruneTowardsRoot()
{
	var aCurrentNode,
		i;
	
	aCurrentNode = this;
	while(aCurrentNode)
	{
		if(aCurrentNode._myChildren)
		{
			for(i = 0; i < aCurrentNode._myChildren.length; ++i)
			{
				if(aCurrentNode._myChildren[i].containsItems())
				{
					return;
				}
			}
			aCurrentNode._myChildren = null;
		}
		aCurrentNode = aCurrentNode._myParent;
	}
};


