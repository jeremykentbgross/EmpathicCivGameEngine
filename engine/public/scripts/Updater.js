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

ECGame.EngineLib.Updater = ECGame.EngineLib.Class.create({
	Constructor : function Updater()
	{
		this._myName = null;
		this._myPriority = null;
		this._myUpdateList = null;
	},
	Parents : [],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		init : function init(inName, inPriority)
		{
			this._myName = inName;
			this._myPriority = inPriority;
			this._myUpdateList = new ECGame.EngineLib.GameCircularDoublyLinkedListNode();
		},
		
		getName : function getName()
		{
			return this._myName;
		},
		
		getUpdatePriority : function getUpdatePriority()
		{
			return this._myPriority;
		},
		
		addUpdate : function addUpdate(inObject)
		{
			this._myUpdateList.insertItemBack(
				inObject
				,function compare(inLeft, inRight)
				{
					return inLeft.getUpdatePriority() - inRight.getUpdatePriority();
				}
			);
		},
		removeUpdate : function removeUpdate(inObject)
		{
			this._myUpdateList.removeItem(inObject);
		},
		
		update : function update(inUpdateData, inDepth)
		{
			var anUpdateArray
				,aString
				,i
				;
			
			inDepth = inDepth || 0;
			anUpdateArray = [];
			
			if(ECGame.Settings.DEBUG && !inDepth)
			{
				aString = this._getLeadingString(inDepth) + "Update: " + this.getName() + " (Priority:" + this.getUpdatePriority() + ')';
				if(ECGame.Settings.isDebugPrint_Updater())
				{
					console.info(aString);
				}
				if(ECGame.Settings.isDebugDraw_Updater())
				{
					ECGame.instance.getGraphics().drawDebugText(aString, ECGame.Settings.Debug.Updater_DrawColor);
				}
			}
			
			++inDepth;
			
			//just in case any items are removed during the update,
			//we make our update list in advance.  That way it doesnt
			//invalidate the 'iterator' (linked list) that we are looping
			//through
			this._myUpdateList.forAll(
				function UpdateChildren(inItem)
				{
					anUpdateArray.push(inItem);
				}
				,true
			);
			
			for(i = 0; i < anUpdateArray.length; ++i)
			{
				if(ECGame.Settings.DEBUG)
				{
					aString = (
						this._getLeadingString(inDepth) + "Update: "
						+ (
							anUpdateArray[i].getName ?
							anUpdateArray[i].getName()
							:'?'
						)
						+ " (Priority:"
						+ (
							anUpdateArray[i].getUpdatePriority ?
							anUpdateArray[i].getUpdatePriority()
							:'??????????????????????'
						)
						 + ')'
					);
					if(ECGame.Settings.isDebugPrint_Updater())
					{
						console.info(aString);
					}
					if(ECGame.Settings.isDebugDraw_Updater())
					{
						ECGame.instance.getGraphics().drawDebugText(aString, ECGame.Settings.Debug.Updater_DrawColor);
					}
				}
				anUpdateArray[i].update(inUpdateData, inDepth);
			}
		},
		
		//TODO should probably be in some generic/misc lib, as I think I needed this before/elswhere..
		_getLeadingString : function _getLeadingString(inDepth)
		{
			var aLeadString
				,i
				;
			
			aLeadString = '';
			for(i = 0; i < inDepth; ++i)
			{
				aLeadString += '    ';
			}
			
			return aLeadString;
		}
	}
});

