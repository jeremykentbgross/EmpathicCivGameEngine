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



ECGame.EngineLib.QuadTreeItem = ECGame.EngineLib.Class.create({
	Constructor : function QuadTreeItem(inAABB)
	{
		this._myAABB = inAABB;
		this._myOwningNodes = [];
		
		this._myID = ECGame.EngineLib.QuadTreeItem._ourNextID++;
	},

	Parents : [],
	flags : {},

	ChainUp : [],
	ChainDown : [],

	Definition :
	{
		_ourNextID : 0	//this is needed by the raytracer, physics system, etc
		,getID : function getID()
		{
			return this._myID;
		}
		
		,init : function init(inAABB)
		{
			this._myAABB = inAABB;
			this._myOwningNodes = [];
		}
		
		,getAABB2D : function getAABB2D()
		{
			return this._myAABB;
		}
		,setAABB2D : function setAABB2D(inAABB2D)
		{
			this._myAABB.copyFrom(inAABB2D);
		}
		
		//TODO removeFromTree()
		//TODO addedToNode
		//TODO manage owning nodes
	}
});










ECGame.EngineLib.QuadTree = ECGame.EngineLib.Class.create({
	Constructor : function QuadTree()
	{
		return;
	},
	Parents : [],
	flags : {},

	ChainUp : [],
	ChainDown : [],

	Definition :
	{
		init : function init(inAABB, inMinSize, inParent)
		{
			this._myAABB = inAABB || ECGame.EngineLib.AABB2D.create(0,0,1,1);
			this._myChildren = null;
			this._myMinSize = inMinSize || 1;	//TODO find a way to have this in shared data or something
			this._myItems = [];
			this._myParent = inParent || null;
			//TODO solid space??
			
			console.assert(this._myAABB.myWidth === this._myAABB.myHeight, "QuadTree Node is not a square.");
		}
		
		,getAABB2D : function getAABB2D()
		{
			return this._myAABB;//Note not cloned because it **should be** faster for ray tracer which asks this often for read only purposes
		}
		
		,getParent : function getParent()
		{
			return this._myParent;
		}
		
		,_createChildren : function _createChildren()
		{
			var aHalfWidth,
				aHalfHeight,
				createAABB = ECGame.EngineLib.AABB2D.create;
			
			if(this._myChildren === null)
			{
				aHalfWidth = Math.floor(this._myAABB.myWidth / 2);//Should be the same, and power of 2
				aHalfHeight = Math.floor(this._myAABB.myHeight / 2);//Should be the same, and power of 2
				
				//if children will not be smaller than the min, create them
				if(!(aHalfWidth < this._myMinSize || aHalfHeight < this._myMinSize))
				{
					this._myChildren = 
					[
						ECGame.EngineLib.QuadTree.create(),
						ECGame.EngineLib.QuadTree.create(),
						ECGame.EngineLib.QuadTree.create(),
						ECGame.EngineLib.QuadTree.create()
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
		}
		
		//Note: you can delete the inserted item strait from the list of outContainingNodes
		//TODO change functionality to write containing nodes to the item
		,insertToSmallestContaining : function insertToSmallestContaining(inItem, outContainingNodes, inTargetNodesMinSize)
		{
			var i, aThisNodesSize;
			
			if(this._myAABB.containsAABB2D(inItem.getAABB2D()))
			{
				inTargetNodesMinSize = inTargetNodesMinSize || Math.max(inItem.getAABB2D().myWidth, inItem.getAABB2D().myHeight);
				aThisNodesSize = Math.max(this._myAABB.myWidth, this._myAABB.myHeight);

				if(aThisNodesSize / 2 < Math.max(inTargetNodesMinSize, this._myMinSize))
				{
					//console.assert(this._myItems.indexOf(inItem) === -1,"Multiple insertions!");
					
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
		}
		
		//Note: you can delete the inserted item strait from the list of outContainingNodes
		//TODO change functionality to write containing nodes to the item
		,insertToAllBestFitting : function insertToAllBestFitting(inItem, outContainingNodes, inTargetNodesMinSize)
		{
			var i, aThisNodesSize;
			
			inTargetNodesMinSize = inTargetNodesMinSize || Math.max(inItem.getAABB2D().myWidth, inItem.getAABB2D().myHeight);
			aThisNodesSize = Math.max(this._myAABB.myWidth, this._myAABB.myHeight);
			
			if(aThisNodesSize < inTargetNodesMinSize)
			{
				return;
			}
			
			if(this._myAABB.intersectsAABB2D(inItem.getAABB2D()))
			{
				if(aThisNodesSize / 2 < Math.max(inTargetNodesMinSize, this._myMinSize))
				{
					//console.assert(this._myItems.indexOf(inItem) === -1,"Multiple insertions!");
					
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
		}
		
		,deleteItem : function deleteItem(inItem, inTargetNodesMinSize)
		{
			var i, aThisNodesSize;
			
			if(this._myAABB.intersectsAABB2D(inItem.getAABB2D()))
			{
				inTargetNodesMinSize = inTargetNodesMinSize || Math.max(inItem.getAABB2D().myWidth, inItem.getAABB2D().myHeight);
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
		}
		
		/*
		//TODO outArray[] containing deleted items, see deleteContained below
		,deleteIntersecting : function deleteIntersecting(inAABB)
		{
			var loops,
				i,
				keepChild = false;
			
			if(inAABB.containsAABB2D(this._myAABB))
			{
				this._myChildren = null;
				this._myItems = [];
				return false;
			}
			else if(this._myAABB.intersectsAABB2D(inAABB))
			{
				if(this._myChildren !== null)
				{
					loops = this._myChildren.length;
					for(i = 0; i < loops; ++i)
					{
						if(this._myChildren[i].deleteIntersecting(inAABB))
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
					if(inAABB.intersectsAABB2D(this._myItems[i].getAABB2D()))
					{
						//delete it
						this._myItems.splice(i,1);
						loops = this._myItems.length;
						--i;
					}
				}
			}
			
			return (this._myItems.length !==0) || (this._myChildren !== null);
		}*/
		
		,deleteContained : function deleteContained(inAABB, outDeletedItems)
		{
			var i, aKeepChildren, aChild;
			
			outDeletedItems = outDeletedItems || [];
			aKeepChildren = false;
			
			if(inAABB.containsAABB2D(this._myAABB))
			{
				//delete everything
				for(i in this._myItems)
				{
					outDeletedItems.push(this._myItems[i]);
				}
				
				//traverse children for deleted items
				for(i in this._myChildren)
				{
					this._myChildren[i].deleteContained(inAABB, outDeletedItems);
				}
				
				this._myChildren = null;
				this._myItems = [];
			}
			else if(this._myAABB.intersectsAABB2D(inAABB))
			{
				if(this._myChildren !== null)
				{
					for(i = 0; i < this._myChildren.length; ++i)
					{
						aChild = this._myChildren[i];
						aChild.deleteContained(inAABB, outDeletedItems);
						aKeepChildren = aKeepChildren || aChild.containsItems();
					}
					if(!aKeepChildren)
					{
						this._myChildren = null;
					}
				}
			
				for(i = 0; i < this._myItems.length; ++i)
				{
					if(inAABB.containsAABB2D(this._myItems[i].getAABB2D()))
					{
						//delete it
						outDeletedItems.push(this._myItems[i]);
						this._myItems.splice(i,1);
						--i;
					}
				}
			}
		}
		
		,walk : function walk(inFunction, inAABB)
		{
			var aItem, i;
			
			//if nothing is specified walk the whole tree
			inAABB = inAABB || this._myAABB;
			
			if(this._myAABB.intersectsAABB2D(inAABB))
			{
				for(i = 0; i < this._myItems.length; ++i)
				{
					aItem = this._myItems[i];
					if(aItem.getAABB2D().intersectsAABB2D(inAABB))
					{
						inFunction(aItem);
					}
				}
				if(this._myChildren !== null)
				{
					for(i = 0; i < this._myChildren.length; ++i)
					{
						this._myChildren[i].walk(inFunction, inAABB);
					}
				}
			}
		}
		
		,debugDraw : function debugDraw(inGraphics, inNodeColor, inFullNodeColor, inItemColor)
		{
			var i;
			
			inNodeColor = inNodeColor || ECGame.Settings.Debug.QuadTree_Node_DrawColor;
			inFullNodeColor = inFullNodeColor || ECGame.Settings.Debug.QuadTree_OccupiedNode_DrawColor;
			inItemColor = inItemColor || ECGame.Settings.Debug.QuadTree_Item_DrawColor;
			
			if(!this._myAABB.intersectsAABB2D(inGraphics.getCamera2D().getCaptureVolumeAABB2D()))
			{
				return;
			}
			
			if(this._myItems.length !== 0)
			{
				inGraphics.setStrokeStyle(inItemColor);
				for(i in this._myItems)
				{
					inGraphics.strokeRect(this._myItems[i].getAABB2D());
				}
				
				inGraphics.setStrokeStyle(inFullNodeColor);
				inGraphics.strokeRectXYWH(
					this._myAABB.myX + 1,
					this._myAABB.myY + 1,
					this._myAABB.myWidth - 2,
					this._myAABB.myHeight - 2
				);
			}

			inGraphics.setStrokeStyle(inNodeColor);
			inGraphics.strokeRect(this._myAABB);
					
			if(this._myChildren !== null)
			{
				for(i = 0; i < this._myChildren.length; ++i)
				{
					this._myChildren[i].debugDraw(inGraphics, inNodeColor, inFullNodeColor, inItemColor);
				}
			}
		}
		
		,containsItems : function containsItems()
		{
			return (this._myItems.length !== 0 || this._myChildren !== null);
		}
		
		,pruneTowardsRoot : function pruneTowardsRoot()
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
		}
		
		,findSmallestContainingNodeFromHere : 
			function findSmallestContainingNodeFromHere(inPoint, inMinSize)
		{
			var aNode;
			
			inMinSize = inMinSize || 0.0;
			
			aNode = this.findSmallestContainingAncestor(inPoint);
			if(aNode)
			{
				return aNode.findSmallestContainingDescendant(inPoint, inMinSize);
			}
			return null;
		}
		
		,findSmallestContainingDescendant : 
			function findSmallestContainingDescendant(inPoint, inMinSize)
		{
			var index,
				aSmallestNode = null;
			
			inMinSize = inMinSize || 0.0;
			
			if(!this._myAABB.containsPoint(inPoint))
			{
				return null;
			}
			if(this._myChildren === null || this._myAABB.myWidth / 2 < inMinSize)
			{
				return this;
			}
			
			for(index = 0; index < this._myChildren.length; ++index)
			{
				aSmallestNode = this._myChildren[index].findSmallestContainingDescendant(inPoint, inMinSize);
				if(aSmallestNode !== null)
				{
					return aSmallestNode;
				}
			}

			return aSmallestNode;	//should not happen, todo assert??
		}
		
		,findSmallestContainingAncestor : 
			function findSmallestContainingAncestor(inPoint)
		{
			var aCurrentNode;
			
			aCurrentNode = this;
			while(!aCurrentNode._myAABB.containsPoint(inPoint))
			{
				aCurrentNode = aCurrentNode._myParent;
				if(aCurrentNode === null)
				{
					break;
				}
			}
				
			return aCurrentNode;
		}
		
	}
});


