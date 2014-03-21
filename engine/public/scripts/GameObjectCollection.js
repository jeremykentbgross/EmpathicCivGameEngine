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

ECGame.EngineLib.GameObjectCollection = ECGame.EngineLib.Class.create({
	Constructor : function GameObjectCollection()
	{
		this._myGameObjects = [];
		this._myAddedGameObjects = [];
		this._myRemovedGameObjects = [];
		
		this._myGameObjectRefs = [];
		this._myAddedGameObjectRefs = [];
		this._myRemovedGameObjectRefs = [];
		
		this._myAddedListener = null;
		this._myRemovedListener = null;
		
		this._mySerializeFormat =
		[
			{
				name : '_myGameObjectRefs',
				type : 'objRef',
				net : false,
				maxArrayLength : 32
			},
			{
				name : '_myAddedGameObjectRefs',
				type : 'objRef',
				net : true,
				netOnly : true,
				maxArrayLength : 32
			},
			{
				name : '_myRemovedGameObjectRefs',
				type : 'objRef',
				net : true,
				netOnly : true,
				maxArrayLength : 32
			}
		];
	},
	Parents : [],
	flags : {},
	
	ChainUp : [],
	ChainDown : [],
	
	Definition :
	{
		init : function init(inMaxTotal, inMaxAdded, inMaxRemoved, inAddedListener, inRemovedListener)
		{
			this._mySerializeFormat[0].maxArrayLength = inMaxTotal;
			this._mySerializeFormat[1].maxArrayLength = inMaxAdded;
			this._mySerializeFormat[2].maxArrayLength = inMaxRemoved;
			
			this._myGameObjects = [];
			this._myAddedGameObjects = [];
			this._myRemovedGameObjects = [];
			
			this._myGameObjectRefs = [];
			this._myAddedGameObjectRefs = [];
			this._myRemovedGameObjectRefs = [];
			
			this.addListeners(inAddedListener, inRemovedListener);
		}
		
		//TODO make real even?
		,addListeners : function addListeners(inAddedListener, inRemovedListener)
		{
			this._myAddedListener = inAddedListener;
			this._myRemovedListener = inRemovedListener;
		}
		
		,add : function add(inGameObject, inDontDeltaTrack)
		{
			if(ECGame.Settings.DEBUG)
			{
				console.assert(this._myRemovedGameObjects.indexOf(inGameObject) === -1);
			}
			
			if(this._myGameObjects.indexOf(inGameObject) !== -1)
			{
				//console.info('already added', inGameObject);
				return false;
			}
			
			this._myGameObjects.push(inGameObject);
			if(!inDontDeltaTrack)
			{
				this._myAddedGameObjects.push(inGameObject);
			}
			
			if(this._myAddedListener)
			{
				this._myAddedListener(inGameObject);
			}
			
			return true;
		}
		
		,remove : function remove(inGameObject, inDontDeltaTrack)
		{
			var anIndex;
			
			if(ECGame.Settings.DEBUG)
			{
				console.assert(this._myAddedGameObjects.indexOf(inGameObject) === -1);
			}
			
			anIndex = this._myGameObjects.indexOf(inGameObject);
			if(anIndex === -1)
			{
				//console.info('not present', inGameObject);
				return false;
			}
			this._myGameObjects[anIndex] = this._myGameObjects[this._myGameObjects.length - 1];
			this._myGameObjects.pop();
			
			if(!inDontDeltaTrack)
			{
				this._myRemovedGameObjects.push(inGameObject);
			}
			
			if(this._myRemovedListener)
			{
				this._myRemovedListener(inGameObject);
			}
			
			return true;
		}
		
		,contains : function contains(inGameObject)
		{
			return this._myGameObjects.indexOf(inGameObject) !== -1;
		}
		
		,serialize : function serialize(inSerializer)
		{
			var i
				;
			
			if(inSerializer.isNetMode())
			{
				this._myAddedGameObjectRefs = [];
				this._myRemovedGameObjectRefs = [];
				for(i = 0; i < this._myAddedGameObjects.length; ++i)
				{
					this._myAddedGameObjectRefs.push(this._myAddedGameObjects[i].getRef());
				}
				for(i = 0; i < this._myRemovedGameObjects.length; ++i)
				{
					this._myRemovedGameObjectRefs.push(this._myRemovedGameObjects[i].getRef());
				}
			}
			else
			{
				this._myGameObjectRefs = [];
				for(i = 0; i < this._myGameObjects.length; ++i)
				{
					this._myGameObjectRefs.push(this._myGameObjects[i].getRef());
				}
			}
			
			inSerializer.serializeObject(this, this._mySerializeFormat);
		}
		
		,postSerialize : function postSerialize()
		{
			var aGameObject
				,i
				;
			
			for(i = 0; i < this._myGameObjectRefs.length; ++i)
			{
				aGameObject = this._myGameObjectRefs[i].deref();
				console.assert(aGameObject, "Missing GameObject during serialization!");
				this.add(aGameObject, true);
			}
			for(i = 0; i < this._myAddedGameObjectRefs.length; ++i)
			{
				aGameObject = this._myAddedGameObjectRefs[i].deref();
				console.assert(aGameObject, "Missing GameObject during serialization!");
				this.add(aGameObject, true);
			}
			for(i = 0; i < this._myRemovedGameObjectRefs.length; ++i)
			{
				aGameObject = this._myRemovedGameObjectRefs[i].deref();
				//console.assert(aGameObject, "Missing GameObject during serialization!");
				if(aGameObject)
				{
					this.remove(aGameObject, true);
				}
			}
			
			this._myGameObjectRefs = [];
			this._myAddedGameObjectRefs = [];
			this._myRemovedGameObjectRefs = [];
		}
		
		,clearNetDirty : function clearNetDirty()
		{
			this._myAddedGameObjects = [];
			this._myRemovedGameObjects = [];
			
			this._myGameObjectRefs = [];
			this._myAddedGameObjectRefs = [];
			this._myRemovedGameObjectRefs = [];
		}
		
		,forall : function forall(inCallback)
		{
			var i;
			
			for(i = 0; i < this._myGameObjects.length; ++i)
			{
				inCallback(this._myGameObjects[i]);
			}
		}
		
		,cleanup : function cleanup()
		{
			//TODO manual relase?
			
			this._myGameObjects = [];
			this._myAddedGameObjects = [];
			this._myRemovedGameObjects = [];
			
			this._myGameObjectRefs = [];
			this._myAddedGameObjectRefs = [];
			this._myRemovedGameObjectRefs = [];
		}
	}
});