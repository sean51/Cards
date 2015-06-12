#pragma strict

import System.Collections.Generic;

public enum trigger {passive, on_play, on_death};

public enum effect {ranged, guardian, rush, buff, nerf, combine, summon, damage, draw, convert, swap, temp_mana, other};

public enum radius {single, adjacent, enemies, creatures, enemy_creatures, random_enemy, other};

public class Abilities
{
	private var abilities: List.<Ability> = new List.<Ability>();
	
	////////////////////////////////////////////////////////////////////////////////
	//MASSIVELY OVERLOADED ADD FUNCTION
	////////////////////////////////////////////////////////////////////////////////
	
	//Card without a numerical value
	function Add(targets: radius, ability_effect: effect)
	{
		abilities.Add(Ability(targets, trigger.passive, ability_effect, 0, null));
	}
	
	//Creature without a numerical value with cast time
	function Add(targets: radius, cast_time: trigger, ability_effect: effect)
	{
		abilities.Add(Ability(targets, cast_time, ability_effect, 0, null));
	}
	
	//Creature with a cast time and numerical value
	function Add(targets: radius, cast_time: trigger, ability_effect: effect, amount: int)
	{
		abilities.Add(Ability(targets, cast_time, ability_effect, amount, null));
	}
	
	//Creature with cast time, numerical value, and additional object
	function Add(targets: radius, cast_time: trigger, ability_effect: effect, amount: int, additional: GameObject)
	{
		abilities.Add(Ability(targets, cast_time, ability_effect, amount, additional));
	}
	
	//Event card with additional object and numerical value
	function Add(targets: radius, ability_effect: effect, amount: int, additional: GameObject)
	{
		abilities.Add(Ability(targets, trigger.passive, ability_effect, amount, additional));
	}
	
	//Event card or Boost card with numerical value
	function Add(targets: radius, ability_effect: effect, amount: int)
	{
		abilities.Add(Ability(targets, trigger.passive, ability_effect, amount, null));
	}
	
	////////////////////////////////////////////////////////////////////////////////
	//QUERIES
	////////////////////////////////////////////////////////////////////////////////
	
	function Ranged(): boolean
	{
		for each (ab in abilities)
		{
			if(ab.Effect() == effect.ranged)
			{
				return true;
			}
		}
		return false;
	}
	
	function Guardian(): boolean
	{
		for each (ab in abilities)
		{
			if(ab.Effect() == effect.guardian)
			{
				return true;
			}
		}
		return false;
	}
	
	function Rush(): boolean
	{
		for each (ab in abilities)
		{
			if(ab.Effect() == effect.rush)
			{
				return true;
			}
		}
		return false;
	}
	
	function Added_Creature(): boolean
	{
		for each (ab in abilities)
		{
			if(ab.Effect() == effect.summon || ab.Effect() == effect.convert)
			{
				return true;
			}
		}
		return false;
	}
	
	function On_Play(): boolean
	{
		for each (ab in abilities)
		{
			if(ab.Trigger() == trigger.on_play)
			{
				return true;
			}
		}
		return false;
	}
	
	function On_Death(): boolean
	{
		for each (ab in abilities)
		{
			if(ab.Trigger() == trigger.on_death)
			{
				return true;
			}
		}
		return false;
	}
	
	////////////////////////////////////////////////////////////////////////////////
	//ABILITY EXPORTS
	////////////////////////////////////////////////////////////////////////////////
	
	function Play_Packet(): List.<Object[]>
	{
		var packet: List.<Object[]> = new List.<Object[]>();
		for each (ab in abilities)
		{
			if(ab.Trigger() == trigger.on_play)
			{
				packet.Add(ab.Export());
			}
		}
		return packet;
	}
	
	function Death_Packet(): List.<Object[]>
	{
		var packet: List.<Object[]> = new List.<Object[]>();
		for each (ab in abilities)
		{
			if(ab.Trigger() == trigger.on_death)
			{
				packet.Add(ab.Export());
			}
		}
		return packet;
	}
	
	function All_Packet(): List.<Object[]>
	{
		var packet: List.<Object[]> = new List.<Object[]>();
		for each (ab in abilities)
		{
			packet.Add(ab.Export());
		}
		return packet;
	}
	
	////////////////////////////////////////////////////////////////////////////////
	//CARD TEXT
	////////////////////////////////////////////////////////////////////////////////
	
	function Text(): String
	{
		var text_builder: String = "";
		for each (ab in abilities)
		{
			if(ab.Trigger() == trigger.on_death)
			{
				text_builder += "death:\n";
			}
			if (ab.Effect() == effect.guardian)
			{
				text_builder += "guardian\n";
			}
			else if (ab.Effect() == effect.rush)
			{
				text_builder += "rush\n";
			}
			else if (ab.Effect() == effect.ranged)
			{
				text_builder += "ranged\n";
			}
			else if (ab.Effect() == effect.damage)
			{
				text_builder += "deal " + ab.Power() + " damage to" + Suffix_Builder(ab.Radius());
			}
			else if (ab.Effect() == effect.summon)
			{
				var stats: int[] = ab.Additional().GetComponent(Creature_Card).Get_Maximum_Stats();
				var number: int = ab.Power();
				if (number == 1)
				{
					text_builder += "summon a (" + stats[0] + "/" + stats[1] + ") \ncreature\n";
				}
				else
				{
					text_builder += "summon " + ab.Power() + " (" + stats[0] + "/" + stats[1] + ") \ncreatures\n";
				}
			}
			else if (ab.Effect() == effect.temp_mana)
			{
				var energy_aggregate: int = ab.Power();
				var red: int = energy_aggregate / 1000;
				var yellow: int = (energy_aggregate % 1000) / 100;
				var green: int = (energy_aggregate % 100) / 10;
				var blue: int = energy_aggregate % 10;
				if (red > 0)
				{
					text_builder += "gain " + red + " red\nenergy this turn\n";
				}
				if (yellow > 0)
				{
					text_builder += "gain " + yellow + " yellow\nenergy this turn\n";
				}
				if (green > 0)
				{
					text_builder += "gain " + green + " green\nenergy this turn\n";
				}
				if (blue > 0)
				{
					text_builder += "gain " + blue + " blue\nenergy this turn\n";
				}
			}
			else if (ab.Effect() == effect.draw)
			{
				var cards: int = ab.Power();
				if(cards == 1)
				{
					text_builder += "draw a card\n";
				}
				else
				{
					text_builder += "draw " + cards + " cards\n";
				}
			}
			else if (ab.Effect() == effect.convert)
			{
				text_builder += "convert" + Suffix_Builder(ab.Radius());
			}
			else if (ab.Effect() == effect.swap)
			{
				text_builder += "swap stats of" + Suffix_Builder(ab.Radius());
			}
			else if (ab.Effect() == effect.buff)
			{
				var aggregate_stats: int = ab.Power();
				var attack: int = aggregate_stats / 10;
				var defense: int = aggregate_stats % 10;
				text_builder += "+" + attack + "/+" + defense + " to" + Suffix_Builder(ab.Radius());
			}
			else if (ab.Effect() == effect.combine)
			{
				text_builder += "destroy" + Suffix_Builder(ab.Radius()) + "and gain their stats\n";
			}
		}
		return text_builder;
	}
	
	function Suffix_Builder(radius_enumeration: int): String
	{
		if (radius_enumeration == radius.single)
		{
			return "\na creature\n";
		}
		else if (radius_enumeration == radius.adjacent)
		{
			return "\n(radius 1)\n";
		}
		else if (radius_enumeration == radius.enemies)
		{
			return "\nall enemies\n";
		}
		else if (radius_enumeration == radius.creatures)
		{
			return "\nall creatures\n";
		}
		else if (radius_enumeration == radius.enemy_creatures)
		{
			return "\nall enemy\ncreatures\n";
		}
		else if (radius_enumeration == radius.random_enemy)
		{
			return "\na random enemy\n";
		}
		else
		{
			return "";
		}
	}
	
	////////////////////////////////////////////////////////////////////////////////
	//INNER ABILITY CLASS
	////////////////////////////////////////////////////////////////////////////////
	
	private class Ability
	{
		private var activate: trigger = trigger.passive;
		private var effect_type: effect = effect.other;
		private var effect_radius: radius = radius.other;
		private var power: int = 0;
		private var additional_card: GameObject = null;

		function Ability(targets: radius, cast_time: trigger, ability_effect: effect, amount: int, additional: GameObject)
		{
			effect_radius = targets;
			activate = cast_time;
			effect_type = ability_effect;
			power = amount;
			additional_card = additional;
		}
		
		function Trigger(): trigger
		{
			return activate;
		}
		
		function Effect(): effect
		{
			return effect_type;
		}
		
		function Power(): int
		{
			return power;
		}
		
		function Radius(): radius
		{
			return effect_radius;
		}
		
		function Additional(): GameObject
		{
			return additional_card;
		}
		
		function Export(): Object[]
		{
			return [effect_type, effect_radius, power, additional_card];
		}
	}
}