public class Boost_Card extends Targeting_System
{
	public var combine: boolean = false;
	public var stat_increase: int[] = [0, 0];
	public var can_target_enemies: boolean = false;
	
	////////////////////////////////////////////////////////////////////////////////
	//UNITY FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////
	
	//Assign all abilities
	function Awake ()
	{
		var effect_radius: radius = radius.other;
		if (affects_single)
		{
			effect_radius = radius.single;
		}
		else if (affects_adjacent)
		{
			effect_radius = radius.adjacent;
		}
		else if (affects_all_enemies)
		{
			effect_radius = radius.enemies;
		}
		else if (affects_all_creatures)
		{
			effect_radius = radius.creatures;
		}
		else if (affects_all_enemy_creatures)
		{
			effect_radius = radius.enemy_creatures;
		}
		else if (affects_random_enemy)
		{
			effect_radius = radius.random_enemy;
		}
		if(combine)
		{
			abilities.Add(effect_radius, effect.combine);
		}
		else
		{
			abilities.Add(effect_radius, effect.buff, (stat_increase[0] * 10) + stat_increase[1]);
		}
	}
	
	////////////////////////////////////////////////////////////////////////////////
	//GETTER FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////
	
	function Get_Stat_Increase(): int[]
	{
		return stat_increase;
	}
	
	function Get_Target_Enemies(): boolean
	{
		return can_target_enemies;
	}
	
	////////////////////////////////////////////////////////////////////////////////
	//SETTER FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////
	
	function Set_Stat_Increase(new_stats: int[])
	{
		stat_increase = new_stats;
	}
	
	function Increase_Stat_Increase(increment_amount: int[])
	{
		stat_increase[0] += increment_amount[0];
		stat_increase[1] += increment_amount[1];
	}
	
	////////////////////////////////////////////////////////////////////////////////
	//PLAY FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////
	
	function Activate(target: GameObject)
	{
		var targets: List.<GameObject> = new List.<GameObject>();
		targets.Add(target);
		for each (creature in owner.Get_Creatures())
		{
			targets.Add(creature);
		}
		Activate_Ability(abilities.All_Packet(), targets);
	}
}