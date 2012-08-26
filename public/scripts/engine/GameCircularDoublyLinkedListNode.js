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