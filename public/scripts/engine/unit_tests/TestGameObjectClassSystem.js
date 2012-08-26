GameUnitTests.registerTest(
	"GameObjectClassSystem",
	function()
	{
		var passedTest = true;
		var local = {};
		local.actionIndex = 0;
	
		
		local.classFactory = GameEngineLib.createGameObjectClassFactory();
		
		local.classFactory.create(
			"GameObject",
			null,
			GameEngineLib.createGameObject
		);
		
		local.classFactory.create(
			"BaseClass",
			null,
			function(instance, private)
			{
				instance.destroy = function()
				{
					local.BaseClassDestroyed = local.actionIndex++;
				}
				instance.serialize = function()
				{
					local.BaseClassSerialized = local.actionIndex++;
				}
				instance.bs = function(){}
				instance.bs.chaindown = true;
				
				instance.bs2 = function(){}
				instance.bs2.chainup = true;
			}
		);
		
		local.classFactory.create(
			"ChildClass",
			"BaseClass",
			function(instance, private)
			{
				instance.destroy = function()
				{
					local.ChildClassDestroyed = local.actionIndex++;
				}
				instance.serialize = function()
				{
					local.ChildClassSerialized = local.actionIndex++;
				}
				instance.bs = function(){}
				instance.bs2 = function(){}
			}
		);
		
		local.childInstance = local.classFactory.findByName("ChildClass").create("child1");
		local.childInstance.deref().serialize();
		local.childInstance.deref().destroy();
		
		if(local.BaseClassSerialized !== 0 || local.ChildClassSerialized !== 1)
		{
			GameEngineLib.logger.error("Failed to serialize the chain in order!");
			passedTest = false;
		}
		
		if(local.ChildClassDestroyed !== 2 || local.BaseClassDestroyed !== 3)
		{
			GameEngineLib.logger.error("Failed to destroy the chain in order!");
			passedTest = false;
		}
				
		
		return passedTest;
	}
);