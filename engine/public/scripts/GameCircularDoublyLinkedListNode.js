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

//TODO depricated:
ECGame.EngineLib.createGameCircularDoublyLinkedListNode = function TODODepricated(inItem)
{
	return new ECGame.EngineLib.GameCircularDoublyLinkedListNode(inItem);
};



ECGame.EngineLib.GameCircularDoublyLinkedListNode = function GameCircularDoublyLinkedListNode(inItem)
{
	this.item = inItem;
	
	this.myNext = this;
	this.myPrev = this;
};
ECGame.EngineLib.GameCircularDoublyLinkedListNode.prototype.constructor = ECGame.EngineLib.GameCircularDoublyLinkedListNode;




/*Not tested:
ECGame.EngineLib.GameCircularDoublyLinkedListNode.prototype.insertItemFront = function insertItemFront(inItem, inCompareFunction)
{
	var aLastNode
		,aCurrentNode
		;
	
	aLastNode = this;
	aCurrentNode = this;
	do{
		if(aCurrentNode.item)
		{
			if(inCompareFunction(inItem, aCurrentNode.item) > 0)
			{
				aCurrentNode.insertBack(new ECGame.EngineLib.GameCircularDoublyLinkedListNode(inItem));
				return;
			}
		}
		aCurrentNode = aCurrentNode.myNext;
	} while(aCurrentNode !== aLastNode);

	return null;
};*/


ECGame.EngineLib.GameCircularDoublyLinkedListNode.prototype.insertItemBack = function insertItemBack(inItem, inCompareFunction)
{
	var aLastNode
		,aCurrentNode
		;
	
	aLastNode = this;
	aCurrentNode = this.myPrev;
	do{
		if(aCurrentNode.item)
		{
			if(inCompareFunction(inItem, aCurrentNode.item) > 0)
			{
				aCurrentNode.insert(new ECGame.EngineLib.GameCircularDoublyLinkedListNode(inItem));
				return;
			}
		}
		else
		{
			aCurrentNode.insert(new ECGame.EngineLib.GameCircularDoublyLinkedListNode(inItem));
			return;
		}
		aCurrentNode = aCurrentNode.myPrev;
	} while(aCurrentNode !== aLastNode);

	return null;
};


ECGame.EngineLib.GameCircularDoublyLinkedListNode.prototype.findItem = function findItem(inFindItem)
{
	var aLastNode
		,aCurrentNode
		;
	
	aLastNode = this;
	aCurrentNode = this;
	do{
		if(inFindItem === aCurrentNode.item)
		{
			return aCurrentNode;
		}
		aCurrentNode = aCurrentNode.myNext;
	} while(aCurrentNode !== aLastNode);

	return null;
};


ECGame.EngineLib.GameCircularDoublyLinkedListNode.prototype.removeItem = function removeItem(inItem)
{
	var aNode;
	
	aNode = this.findItem(inItem);
	if(aNode)
	{
		aNode.remove();
	}
	return aNode;
};





ECGame.EngineLib.GameCircularDoublyLinkedListNode.prototype.insert = function insert(node)
{
	node.myPrev = this;
	node.myNext = this.myNext;
	this.myNext.myPrev = node;
	this.myNext = node;
};


//WARNING: This function is only 'insertBack' at the head node.  Otherwise it basically inserts in front of the current node
ECGame.EngineLib.GameCircularDoublyLinkedListNode.prototype.insertBack = function insertBack(inNode)
{
	this.myPrev.insert(inNode);
};



ECGame.EngineLib.GameCircularDoublyLinkedListNode.prototype.remove = function remove()
{
	this.myPrev.myNext = this.myNext;
	this.myNext.myPrev = this.myPrev;
	this.myPrev = null;
	this.myNext = null;
};



ECGame.EngineLib.GameCircularDoublyLinkedListNode.prototype.forAll = function forAll(inFunction, inSkipEmptyNodes)
{
	var aLastNode
		,aCurrentNode
		;
	
	aLastNode = this;
	aCurrentNode = this;
	do{
		if(!inSkipEmptyNodes || aCurrentNode.item)
		{
			if(inFunction(aCurrentNode.item, aCurrentNode))
			{
				return;
			}
		}
		aCurrentNode = aCurrentNode.myNext;
	} while(aCurrentNode !== aLastNode);
};



ECGame.EngineLib.GameCircularDoublyLinkedListNode.prototype.forAllReverse = function forAllReverse(inFunction, inSkipEmptyNodes)
{
	var aLastNode
		,aCurrentNode
		;
	
	aLastNode = this;
	aCurrentNode = this;
	do{
		if(!inSkipEmptyNodes || aCurrentNode.item)
		{
			if(inFunction(aCurrentNode.item, aCurrentNode))
			{
				return;
			}
		}
		aCurrentNode = aCurrentNode.myPrev;
	} while(aCurrentNode !== aLastNode);
};



ECGame.EngineLib.GameCircularDoublyLinkedListNode.prototype.size = function size()
{
	var aLastNode
		,aCurrentNode
		,aCount
		;
	
	aLastNode = this;
	aCurrentNode = this.myNext;
	aCount = 0;
	while(aCurrentNode !== aLastNode)
	{
		++aCount;
		aCurrentNode = aCurrentNode.myNext;
	}
	
	return aCount;
};

