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

GameEngineLib.createGameCircularDoublyLinkedListNode = function(inItem)
{
	var outNode = { item : inItem };
	
	outNode.myNext = outNode;
	outNode.myPrev = outNode;
	
	outNode.insert = function(node)
	{
		node.myPrev = this;
		node.myNext = this.myNext;
		this.myNext.myPrev = node;
		this.myNext = node;
	}
	
	outNode.insertBack = function(inNode)
	{
		this.myPrev.insert(inNode);
	}
	
	outNode.remove = function()
	{
		this.myPrev.myNext = this.myNext;
		this.myNext.myPrev = this.myPrev;
		this.myPrevActivePhysObj = null;
		this.myNextActivePhysObj = null;
	}
	
	outNode.forAll = function(inFunction)
	{
		var last = this;
		var current = this;
		do{
			inFunction(current.item, current);
			current = current.myNext;
		}while(current != last);
	}
	
	outNode.forAllReverse = function(inFunction)
	{
		var last = this.myPrev;
		var current = this.myPrev;
		do{
			inFunction(current.item, current);
			current = current.myPrev;
		}while(current != last);
	}
	
	return outNode;
};