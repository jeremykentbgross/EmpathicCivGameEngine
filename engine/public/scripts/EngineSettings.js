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

////////////////////////////////////////////////////////////////////
//NOTE: THESE ARE DEFAULTS!! ADD CUSTOM LOCAL CHANGES AT THE BOTTOM! (Or in the game specific file(s))
//
//Example:
//	Add the following to the bottom of the page to turn on the drawing of physics
// =>
//	ECGame.Settings.Debug.Physics_Draw = true;
//
////////////////////////////////////////////////////////////////////
ECGame.Settings =
{
	DEBUG : true,
	RUN_UNIT_TESTS : true,
	
	//TODO appname
		
	Graphics :
	{
		MODES :
		{
			SINGLE_PANE : 0,
			SPLIT_HORIZONTAL : 1,
			//SPLIT_VERTICAL : 2,
			SPLIT_4WAY : 3,
			CUSTOM_SCREEN_LAYOUT : 4
		}
		,mode : 0	//MODES.SINGLE_PANE
		
		,backBufferWidth : 768	//TODO back buffer size, presentation size!
		,backBufferHeight : 768
		
		,resizable : true
		
		//use 3d?
		//canvas (2d), webgl (3d), threejs (3d), noDefault (none)
	},
	
	Sound :
	{
		masterVolume : 0.85//TODO save user changes in their local settings
		,effectsVolume : 1.0//TODO save user changes in their local settings
		
		//Note this should be roughly the renderspace radius (or a bit more to hear off screen)
		,default2DRadius : 543	//~sqrt(768^2 + 768^2) / 2, or half the diagnal of the screen
		
		/*
		Note: should instead probably convert pixels to meters,
			have AudioListener.speedOfSound set in pix/sec (instead of meters/sec)
			instead of setting AudioListener.dopplerFactor to a trial and error 'magic number'
			BUT for some reason this works better than doing it the theoretically 'correct' way
		Note: default AudioListener.speedOfSound === 343.3 (meters / sec)
		*/
		,dopplerFactor : 0.001
		,speedOfSound : 343.3/*meters/sec*/ // * 128/*pixels in a meter*/
	},
	
	Input :
	{
		//TODO controls
	},
	
	World2D :
	{
		MaxMapSizeInTiles : 256,
		MinTileSize : 8,
		MaxTileSize : 256,
		MaxNumberOfTiles : 255	//TODO allow this to be 65535 with u16 type array option, etc
	},
	
	Network :
	{
		isServer : false	//TODO consider function for this
		,isMultiplayer : true
		,GamePort : null	//if null then it defaults (I don't know to what), cannot put 80 here.
		//TODO editorPort : ??
	},
	
	Timer :
	{
		useRequestAnimFrame : false	//false -> requestAnimFrame is almost certainly less secure, and possibly slower
		,averageDeltaTimes : false
	},
	
	Server :	//TODO move this to a private file
	{
		generateDocumentation : false//true
		,compressClientCode : true//true	//TODO should also only be considered in debug.
		////////////////////////////////////////////
		//only working when compressing client code:
		,removeTextForLocalization : true//true
		,removeNonNewlineWhiteSpace : true//true
		,removeNewlines : true//true
		,obfuscateNames : true//true
		,useModifiedNamesNotPureObfuscate : false//false
		,saveResultsNotesToFile : true//true
		//:only working when compressing client code
		////////////////////////////////////////////
		
		//TODO jshint also
		,jslintCheckCode : true	//TODO disable in !DEBUG (looks like it adds some global vars that are ignored in obf)
		,jslint_options :
		{
			ass : true,			//if assignment expressions should be allowed
			bitwise : false,		//if bitwise operators should be allowed
			browser : true,		//if the standard browser globals should be predefined
			closure : false,		//if Google Closure idioms should be tolerated
			'continue' : true,		//if the continuation statement should be tolerated
			'debug' : true,			//if debugger statements should be allowed
			devel : true,			//if logging should be allowed (console, alert, etc.)
			eqeq : false,			//if == should be allowed
			evil : false,			//if eval should be allowed
			forin : true,			//if for in statements need not filter
			//'indent' : 1,			//the indentation factor
			//'maxerr' : 65535,		//the maximum number of errors to allow
			//'maxlen' : 100,			//the maximum length of a source line
			newcap : true,		//if constructor names capitalization is ignored
			node : true,			//if Node.js globals should be predefined
			nomen : true,			//if names may have dangling _
			passfail : false,		//if the scan should stop on first error
			plusplus : true,		//if increment/decrement should be allowed
			properties : false,	//if all property names must be declared with /*properties*/
			regexp : true,		//if the . should be allowed in regexp literals
			rhino : false,		//if the Rhino environment globals should be predefined
			unparam : false,		//if unused parameters should be tolerated
			sloppy : true,		//if the 'use strict'; pragma is optional
			stupid : false,		//if really stupid practices are tolerated
			sub : false,			//if all forms of subscript notation are tolerated
			todo : true,			//if TODO comments are tolerated
			vars : false,			//if multiple var statements per function should be allowed
			white : true			//if sloppy whitespace is tolerated
		}
	},
	
	UpdateOrder :
	{
		INPUT : 0,
		PHYSICS : 1,
		SPRITES : 2,	//should be animation?
		SOUND : 3,
		NETWORK : 4
	},
	
	Caps :
	{
		Audio : (function isAudioAvailable()
		{
			try
			{
				if(window === undefined)	//NOTE! This could be the test for the isServer!!
				{
					return false;
				}
				return (
					window.AudioContext !== undefined ||
					window.webkitAudioContext !== undefined
				);
			}
			catch(inError)
			{
				return false;
			}
		}())//evaluate the function
		//TODO audio formats: https://hacks.mozilla.org/2013/02/simplifying-audio-in-the-browser/
	},
	
	//TODO make the logger in global or instance space??????????
	
	//TODO move all debug items into their normal specific categories?
	Debug :
	{
		//variables should be of the format: Name_Type
		//	where Type is one of:
		//		Print (bool)
		//		Draw (bool)
		//		DrawColor (color)
		//		Size (int/float)
		
		TextMessages_Draw : true,
		
		//scenegraph
		SceneGraph_Draw : false,
		
		//map
		Map_Draw : false,
		//TODO colors
		
		//physics
		Physics_Draw : false,
		Physics_StaticObject_DrawColor : 'rgba(0, 0, 0, 0.5)',
		Physics_SleepingObject_DrawColor : 'rgba(0, 0, 255, 0.5)',
		Physics_ActiveObject_DrawColor : 'rgba(0, 180, 180, 0.5)',
		Physics_AlwaysActiveObject_DrawColor : 'rgba(0, 128, 0, 0.5)',
		Physics_ObjectCollision_DrawColor : 'rgba(255, 0, 0, 0.5)',
		Physics_ActiveObjectBorder_DrawColor : 'rgba(0, 255, 0, 1.0)',
		//TODO colors
		
		//TODO physics rays (inside gameworld)
		
		//camera
		CameraTarget_Draw : false,
		CameraTarget_Size : 10,
		CameraTarget_DrawColor : 'rgba(255, 255, 0, 1)',
		//TODO draw entity position locators
		
		//QuadTree
		QuadTree_Node_DrawColor : 'rgba(64, 64, 64, 1)',
		QuadTree_OccupiedNode_DrawColor : 'rgba(255, 255, 255, 1)',
		QuadTree_Item_DrawColor : 'rgba(128, 0, 128, 1)',
		
		//input
		Input_Draw : false,
		Input_Active_DrawColor : 'rgba(0, 255, 0, 1)',
		Input_Inactive_DrawColor : 'rgba(0, 0, 255, 1)',
		Input_Print : false,
		//TODO this goes in input NOT gameworld, how make sure the cursor is rendered?? have renderer listen to input?
		//also there should be something here that is NOT debug, ie a custom cursor
		Input_MouseCursor_Draw : true,//TODO merge this with Input_Draw
		Input_MouseCursor_Size : 10,
		Input_MouseCursor_DrawColor : 'rgba(0, 255, 0, 1)',	//TODO use active and inactive colors instead?
		
		//frame stats
		FrameStats_Draw : true,
		FrameStats_DrawColor : 'rgba(255, 255, 0, 1)',
		FrameStats_Print : false,
		
		//Object
		GameObject_Print : false,
		
		Ray_NodeCollision_Size : 10,
		Ray_ItemCollision_Size : 8,
		Ray_EndPoint_Size : 12,
		Ray_CurrentPoint_Size : 6,
		
		//Sound:
		Sound_Print : false,
		Sound_Draw : false,
		Sound_Area_DrawColor : 'rgba(0, 0, 255, 1)',//'rgba(255, 128, 0, 1)',//'rgba(128, 128, 255, 1)',//
		Sound_Listener_Size : 20,//TODO this should be in the regular sound part!??
		Sound_Source_Size : 10,
		
		Sprite_Draw : false,
		Sprite_AABB_DrawColor : 'rgba(256, 128, 128, 1)',
		Sprite_Origin_DrawColor : 'rgba(256, 128, 128, 1)',
		Sprite_Origin_Size : 10,
		
		//TODO search for rgba in all files and move it here as settings vars
		
		//Network
	//	NetworkMessages_Draw : true,
	//	NetworkMessages_DrawColor : 'rgba(0, 255, 0, 1)',
		NetworkMessages_Print : false,	//TODO: print levels?	0 - none, 1 - connection, 2 - Basic, 3 - detailed, 4 - packet
		//TODO NetworkDetailedMessages_Print
		Network_SimulatedLag : 0,
		
		WorldSpacialHash_Draw : false,
		
		//default debug text color
		TextDefault_DrawColor : 'rgba(255, 255, 255, 1)',
		TextBackground_DrawColor : 'rgba(0, 0, 0, 0.5)',
		Text_Size : 12,
		
		Obfuscation_Print : false,//TODO maybe put with the other obfuscation stuff
		
		Updater_Print : false,
		Updater_Draw : true,
		Updater_DrawColor : 'rgba(0, 255, 0, 1)'
	},
	
	//helper isDebug functions
	isDebugDraw : function isDebugDraw()
	{
		return this.DEBUG && !this.Network.isServer;
	},
	isDebugPrint : function isDebugPrint()
	{
		return this.DEBUG;
	},
	
	
	isDebugDraw_Text : function isDebugDraw_Text()
	{
		return this.isDebugDraw() && this.Debug.TextMessages_Draw;
	},
	isDebugDraw_SceneGraph : function isDebugDraw_SceneGraph()
	{
		return this.isDebugDraw() && this.Debug.SceneGraph_Draw;
	},
	isDebugDraw_Map : function isDebugDraw_Map()
	{
		return this.isDebugDraw() && this.Debug.Map_Draw;
	},
	isDebugDraw_Physics : function isDebugDraw_Physics()
	{
		return this.isDebugDraw() && this.Debug.Physics_Draw;
	},
	isDebugDraw_CameraTarget : function isDebugDraw_CameraTarget()
	{
		return this.isDebugDraw() && this.Debug.CameraTarget_Draw;
	},
	isDebugDraw_Input : function isDebugDraw_Input()
	{
		return this.isDebugDraw() && this.Debug.Input_Draw;
	},
	isDebugPrint_Input : function isDebugPrint_Input()
	{
		return this.isDebugPrint() && this.Debug.Input_Print;
	},
	isDebugDraw_MouseCursor : function isDebugDraw_MouseCursor()
	{
		return this.isDebugDraw() && this.Debug.Input_MouseCursor_Draw;
	},
	isDebugDraw_FrameStats : function isDebugDraw_FrameStats()
	{
		return this.isDebugDraw() && this.Debug.FrameStats_Draw;
	},
	isDebugPrint_FrameStats : function isDebugPrint_FrameStats()
	{
		return this.isDebugPrint() && this.Debug.FrameStats_Print;
	},
	isDebugPrint_GameObject : function isDebugPrint_GameObject()
	{
		return this.isDebugPrint() && this.Debug.GameObject_Print;
	},
	isDebugPrint_Sound : function isDebugPrint_Sound()
	{
		return this.isDebugPrint() && this.Debug.Sound_Print;
	},
	isDebugDraw_Sound : function isDebugDraw_Sound()
	{
		return this.isDebugDraw() && this.Debug.Sound_Draw;
	},
	isDebugDraw_Sprite : function isDebugDraw_Sprite()
	{
		return this.isDebugDraw() && this.Debug.Sprite_Draw;
	},
/*	isDebugDraw_NetworkMessages : function isDebugDraw_NetworkMessages()
	{
		return this.isDebugDraw() && this.Debug.NetworkMessages_Draw;
	},*/
	isDebugPrint_NetworkMessages : function isDebugPrint_NetworkMessages()
	{
		return this.isDebugPrint() && this.Debug.NetworkMessages_Print;
	},
	getDebugSimulatedLagTime : function getDebugSimulatedLagTime()
	{
		if(!this.DEBUG)
		{
			return 0;
		}
		return this.Debug.Network_SimulatedLag;
	},
	isDebugPrint_Obfuscation : function isDebugPrint_Obfuscation()
	{
		return this.isDebugPrint() && this.Debug.Obfuscation_Print;
	},	
	isDebugPrint_Updater : function isDebugPrint_Updater()
	{
		return this.isDebugPrint() && this.Debug.Updater_Print;
	},
	isDebugDraw_Updater : function isDebugDraw_Updater()
	{
		return this.isDebugDraw() && this.Debug.Updater_Draw;
	}
	,isDebugDraw_WorldSpacialHash : function isDebugDraw_WorldSpacialHash()
	{
		return this.isDebugDraw() && this.Debug.WorldSpacialHash_Draw;
	}
	/*
	isDebugDraw_ : function isDebugDraw_()
	{
		return this.isDebugDraw() && this.Debug.;
	},
	isDebugPrint_ : function isDebugPrint_()
	{
		return this.isDebugPrint() && this.Debug.;
	},*/
};



///////////////////////////////////////////////////////////////////
//NOTE: CUSTOM LOCAL CHANGES GO BELOW HERE
//
//example:
//	ECGame.Settings.Debug.Physics_Draw = true;
//
///////////////////////////////////////////////////////////////////

//ECGame.Settings.Debug.Text_Size = 10;
//ECGame.Settings.Graphics.backBufferWidth = 1024;
//ECGame.Settings.Graphics.backBufferHeight = 512;