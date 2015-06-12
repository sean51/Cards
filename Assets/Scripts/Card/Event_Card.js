public class Event_Card extends Targeting_System
{
	//Targeting types for the mouse
	public var targets_any_creature: boolean = false;
	public var targets_enemy_creatures: boolean = false;
	public var targets_friendly_creatures: boolean = false;
	public var targets_any_player: boolean = false;
	public var targets_any_player_any_creature: boolean = false;
	public var targets_enemy_player_enemy_creatures: boolean = false;
	
	public var gain_creature: boolean = false;
	public var temp_mana_gain: int[] = [0, 0, 0, 0];
	public var swap_stats: boolean = false;
	
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
		if (summon > 0)
		{
			abilities.Add(effect_radius, effect.summon, summon, additional_card);
		}
		else if (deal_damage > 0)
		{
			abilities.Add(effect_radius, effect.damage, deal_damage);
		}
		if (draw > 0)
		{
			abilities.Add(effect_radius, effect.draw, draw);
		}
		else if (gain_creature)
		{
			abilities.Add(effect_radius, effect.convert);
		}
		else if (swap_stats)
		{
			abilities.Add(effect_radius, effect.swap);
		}
		else if(temp_mana_gain[0] > 0 || temp_mana_gain[1] > 0 || temp_mana_gain[2] > 0 || temp_mana_gain[3] > 0)
		{
			abilities.Add(effect_radius, effect.temp_mana, (temp_mana_gain[0] * 1000) + (temp_mana_gain[1] * 100) + (temp_mana_gain[2] * 10) + temp_mana_gain[3]);
		}
	}
	
	////////////////////////////////////////////////////////////////////////////////
	//ATTACK FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////
	
	function Cast(targets: List.<GameObject>)
	{
		//Tell the subclass Targeting_System what to do
		Activate_Ability(abilities.All_Packet(), targets);
	}
	
	////////////////////////////////////////////////////////////////////////////////
	//GETTER FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////
	
	function Get_Targeting_System(): int
	{
		if(targets_any_creature)
		{
			return 1;
		}
		else if(targets_enemy_creatures)
		{
			return 2;
		}
		else if(targets_friendly_creatures)
		{
			return 3;
		}
		else if(targets_any_player)
		{
			return 4;
		}
		else if(targets_any_player)
		{
			return 5;
		}
		else if(targets_any_player_any_creature)
		{
			return 6;
		}
		else if(targets_enemy_player_enemy_creatures)
		{
			return 7;
		}
		else
		{
			return 0;
		}
	}
	
	function Get_Added_Creature(): boolean
	{
		return abilities.Added_Creature();
	}
}