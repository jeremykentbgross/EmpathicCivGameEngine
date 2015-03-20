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

ECGame.EngineLib.LinkedListNode = function LinkedListNode(inItem)
{
	this.myItem = inItem;
	
	this.myNext = this;
	this.myPrev = this;
};
ECGame.EngineLib.LinkedListNode.prototype.constructor = ECGame.EngineLib.LinkedListNode;

ECGame.EngineLib.LinkedListNode.create = function create(inItem)
{
	return new ECGame.EngineLib.LinkedListNode(inItem);
};



//TODO insertItem_ListFront = function insertItem_ListFront(inItem, inCompareFunction)

ECGame.EngineLib.LinkedListNode.prototype.insertItem_ListBack = function insertItem_ListBack(inItem, inCompareFunction)
{
	var aHead
		,aCurrentNode
		,anInsertNode
	;

	aHead = this;
	aCurrentNode = this.myPrev;
	anInsertNode = ECGame.EngineLib.LinkedListNode.create(inItem);
	
	if(inCompareFunction)
	{
		while(aCurrentNode !== aHead)
		{
			if(inCompareFunction(inItem, aCurrentNode.myItem) >= 0)
			{
				aCurrentNode.insertNode_NodeBack(anInsertNode);
				return;
			}

			aCurrentNode = aCurrentNode.myPrev;
		}
	}
	
	aCurrentNode.insertNode_NodeBack(anInsertNode);
	
	return anInsertNode;
};



ECGame.EngineLib.LinkedListNode.prototype.findItemNode = function findItemNode(inFindItem)
{
	var aHead
		,aCurrentNode
	;
	
	aHead = this;
	aCurrentNode = this.myNext;
	
	while(aCurrentNode !== aHead)
	{
		if(inFindItem === aCurrentNode.myItem)
		{
			return aCurrentNode;
		}
		
		aCurrentNode = aCurrentNode.myNext;
	}

	return null;
};
//TODO reverseFindItemNode = function reverseFindItemNode(inFindItem)



ECGame.EngineLib.LinkedListNode.prototype.removeItem = function removeItem(inItem)
{
	var aNode
	;
	
	aNode = this.findItemNode(inItem);
	
	if(aNode)
	{
		aNode.remove();
	}
};



//TODO insertNode_NodeFront = function insertNode_NodeFront(inNode)

ECGame.EngineLib.LinkedListNode.prototype.insertNode_NodeBack = function insertNode_NodeBack(inNode)
{
	inNode.myPrev = this;
	inNode.myNext = this.myNext;
	this.myNext.myPrev = inNode;
	this.myNext = inNode;
};

//TODO proper insertNode_ListFront with priority sort (would then be called by insertItem_ListFront)
ECGame.EngineLib.LinkedListNode.prototype.insertNode_ListFront = ECGame.EngineLib.LinkedListNode.prototype.insertNode_NodeBack;

//TODO proper insertNode_ListBack with priority sort (would then be called by insertItem_ListBack)



ECGame.EngineLib.LinkedListNode.prototype.remove = function remove()
{
	this.myPrev.myNext = this.myNext;
	this.myNext.myPrev = this.myPrev;
	this.myPrev = null;
	this.myNext = null;
};



ECGame.EngineLib.LinkedListNode.prototype.forAll = function forAll(inFunction)
{
	var aHead
		,aCurrentNode
	;
	
	aHead = this;
	aCurrentNode = this.myNext;
	
	while(aCurrentNode !== aHead)
	{
		if(inFunction(aCurrentNode.myItem, aCurrentNode))
		{
			return;
		}
		
		aCurrentNode = aCurrentNode.myNext;
	}
};
