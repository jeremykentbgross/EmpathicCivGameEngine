if(GameSystemVars.RUN_UNIT_TESTS)
	GameUnitTests.runTests();
	
GameInstance = GameEngineLib.createGameFrameWork();
GameInstance.run();