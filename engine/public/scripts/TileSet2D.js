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


ECGame.EngineLib.TileSet2D = ECGame.EngineLib.Class.create(
{
	Constructor : function TileSet2D()
	{
		this.GameObject();
		
		this._myTiles =	[];
		//TODO _myTilesRefs??
	},
	
	Parents : [ECGame.EngineLib.GameObject],
	
	flags : {},
	
	ChainUp : [],
	ChainDown : [],
	
	Definition :
	{
		init : function init(inTiles)
		{
			this._myTiles = inTiles || this._myTiles;
		},
		
		getNumberOfTiles : function getNumberOfTiles()
		{
			return this._myTiles.length;
		},
		
		getTileDescription : function getTileDescription(inTileIndex)
		{
			return this._myTiles[inTileIndex];
		},

		//set<classname>NetDirty
		clearNetDirty : function clearNetDirty(){return;},
		postSerialize : function postSerialize(){return;},
		cleanup : function cleanup(){return;},//TODO
		serialize : function serialize(){return;},//TODO
		copyFrom : function copyFrom(/*inOther*/){return;}//TODO
	}
});