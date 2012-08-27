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

GameEngineLib.createGameObject = function(instance, private)
{
	instance = instance || {};
	private = private || {};
	
	if(GameSystemVars.DEBUG)
	{
		GameEngineLib.addDebugInfo("GameObject", instance, private);
	}
	
	private.myName = null;
	private.myID = null;
	private.myClass = null;
	
	instance.getName = function()
	{
		return private.myName;
	}
	
	instance.setName = function(inName)
	{
		if(private.myClass)
			private.myClass.deregister(this);
			
		private.myName = inName;
		if(GameSystemVars.DEBUG)
			this.debug_myName = inName;
		
		if(private.myClass)
			private.myClass.register(this);
			
		//TODO event to all listeners: name changed!
	}
		
	instance.getID = function()
	{
		return private.myID;
	}
	
	instance.setID = function(inID)
	{
		if(private.myClass)
			private.myClass.deregister(this);
			
		private.myID = inID;
		if(GameSystemVars.DEBUG)
			this.debug_myID = inID;
		
		if(private.myClass)
			private.myClass.register(this);
			
		//TODO event to all listeners: ID changed!
	}	
	
	instance.getClass = function()
	{
		return private.myClass;
	}
	
	instance.setClass = function(inClass)
	{
		if(private.myClass)
			private.myClass.deregister(this);
		
		private.myClass = inClass;
		if(GameSystemVars.DEBUG)
		{
			this.debug_myClassName = inClass.getName();
			this.debug_myClass = inClass;
		}
		
		if(private.myClass)
			private.myClass.register(this);
	}
	
	instance.destroy = function()
	{
		if(GameSystemVars.DEBUG && GameSystemVars.Debug.GameObject_Destroy_Print)
			GameEngineLib.logger.info("Destroying GameObject " + GameEngineLib.createGameObjectRef(this).getPath(), true);
			
		//TODO notify all listeners
		
		private.myClass.deregister(this);

		for(var i in this)
		{
			if(this.hasOwnProperty(i))
			{
				delete this[i];
			}
		}
	}
	instance.destroy.chainup = true;
	
	instance.serialize = function(serializer)
	{
		/*if(GameSystemVars.DEBUG)
			GameEngineLib.logger.info("Serializing GameObject " + GameEngineLib.GameObjectRef(this).getPath());
		
		var temp;
		
		if(serializer.isReading())
		{
			temp = serializer.read("myName");
			if(temp !== this.getName())
			{
				this.setName(temp);
			}
		}
		if(serializer.isWriting())
		{
			serializer.write("myName", this.getName());
		}*/
	}
	instance.serialize.chaindown = true;
	
	//todo work out how to do this right
	/*instance.clone = function(cloneInstance, clonePrivate)
	{
		cloneInstance.setName("copy of " + this.getName());
	}*/
	
	/*
	//todo maybe should go in object.prototype??
	//todo test and test and freaking test this
	instance.clone = function()
	{
		var copy = private.myClass.create();
		
		for(var i in this)
		{
			if(this.hasOwnProperty(i))//should this be?
			{
				//todo if object / object ref: clone it too
				copy[i] = this[i];
			}
		}
	}*/
	
	return instance;
}



//todo type checking version known to class
//todo this should be named with *create* at the start!
GameEngineLib.createGameObjectRef = function(inPathOrValue)
{
	var outRef = {};
	var private = {};
	
	private.path = null;
	private.value = null;
	//todo id {classid,instanceid}	//methodid/propertyid
	
	if(GameSystemVars.DEBUG)
	{
		GameEngineLib.addDebugInfo("GameObjectRef", outRef, private);
	}
	
	outRef.deref = function()
	{
		var objectClass;
		var pathTokens;
				
		if(private.value)
		{
			return private.value;
		}
		
		if(private.path === null)
			return null;
		
		pathTokens = private.path.split('\\');
		if(pathTokens.length !== 2)
			return null;
		
		objectClass = GameInstance.GameObjectClasses.findByName(pathTokens[0]);
		if(objectClass)
		{
			private.value = objectClass.findByName(pathTokens[1]);
			private.path = null;
		}
			
		return private.value;
	}
	
	//todo make sure class is right (if we type check them later) when assigning
	
	//todo try get/set and if they are direct, then have them check the type to decide path, value, or id
	outRef.setValue = function(inValue)
	{
		private.path = null;
		private.value = inValue;
	}
	
	outRef.setPath = function(inPath)
	{
		private.path = inPath;
		private.value = null;
	}
	
	outRef.getPath = function()
	{
		if(private.path === null)
		{
			if(private.value !== null)
			{
				private.path = private.value.getClass().getName() + "\\" + private.value.getName();
			}
		}
		private.value = null;
		
		return private.path;
	}
	
	if(inPathOrValue)
	{
		if(typeof inPathOrValue === 'string')
		{
			outRef.setPath(inPathOrValue);
		}
		//TODO else if(typeof inPathOrValue === 'integer??') handle binary path
		else
		{
			outRef.setValue(inPathOrValue);
		}
	}
	
	return outRef;
}