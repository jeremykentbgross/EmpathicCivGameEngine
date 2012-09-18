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
GameEngineLib.createGameCircularDoublyLinkedListNode = function(inItem)
{
	return new GameEngineLib.GameCircularDoublyLinkedListNode(inItem);
};



GameEngineLib.GameCircularDoublyLinkedListNode = function GameCircularDoublyLinkedListNode(inItem)
{
	this.item = inItem;
	
	this.myNext = this;
	this.myPrev = this;
}
GameEngineLib.GameCircularDoublyLinkedListNode.prototype.constructor = GameEngineLib.GameCircularDoublyLinkedListNode;



GameEngineLib.GameCircularDoublyLinkedListNode.prototype.insert = function insert(node)
{
	node.myPrev = this;
	node.myNext = this.myNext;
	this.myNext.myPrev = node;
	this.myNext = node;
}



GameEngineLib.GameCircularDoublyLinkedListNode.prototype.insertBack = function insertBack(inNode)
{
	this.myPrev.insert(inNode);
}



GameEngineLib.GameCircularDoublyLinkedListNode.prototype.remove = function remove()
{
	this.myPrev.myNext = this.myNext;
	this.myNext.myPrev = this.myPrev;
	this.myPrevActivePhysObj = null;
	this.myNextActivePhysObj = null;
}



GameEngineLib.GameCircularDoublyLinkedListNode.prototype.forAll = function forAll(inFunction)
{
	var last = this;
	var current = this;
	do{
		inFunction(current.item, current);
		current = current.myNext;
	}while(current != last);
}



GameEngineLib.GameCircularDoublyLinkedListNode.prototype.forAllReverse = function forAllReverse(inFunction)
{
	var last = this.myPrev;
	var current = this.myPrev;
	do{
		inFunction(current.item, current);
		current = current.myPrev;
	}while(current != last);
}

