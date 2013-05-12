/*
� Copyright 2012 Jeremy Gross
	jeremykentbgross@gmail.com
	Distributed under the terms of the GNU Lesser GPL (LGPL)
		
	This file is part of EmpathicCivGameEngine�.
	
	EmpathicCivGameEngine� is free software: you can redistribute it and/or modify
	it under the terms of the GNU Lesser General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.
	
	EmpathicCivGameEngine� is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU Lesser General Public License for more details.
	
	You should have received a copy of the GNU Lesser General Public License
	along with EmpathicCivGameEngine�.  If not, see <http://www.gnu.org/licenses/>.
*/

require("../../public/scripts/EngineLoader");

function ECGServer_Main()
{
	//Paths looks wrong (because they will run from inside the loader)
	LoadEngine(true,
		"../",	//engine public parth
		"../../private/",	//engine private path
		"../../../engine_test_game/public/",/*TODO get some command line param or something!*/
		"../../../engine_test_game/private/"/*TODO get some command line param or something!*/
	);
};
ECGServer_Main();
