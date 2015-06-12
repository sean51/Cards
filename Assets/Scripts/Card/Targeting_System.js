public class Targeting_System extends Base_Card
{
	public var deal_damage: int = 0;
	
	public var affects_single: boolean = false;
	public var affects_adjacent: boolean = false;
	public var affects_all_enemies: boolean = false;
	public var affects_all_creatures: boolean = false;
	public var affects_all_enemy_creatures: boolean = false;
	public var affects_random_enemy: boolean = false;
	
	public var summon: int = 0;
	public var additional_card: GameObject;
	
	//Abilities
	protected var abilities: Abilities = new Abilities();
	
	////////////////////////////////////////////////////////////////////////////////
	//UNITY FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	function Start () 
	{
		super.Start();
		for (var child : Transform in gameObject.transform)
		{
			if(child.name == "text")
			{
				child.GetComponent(TextMesh).text = abilities.Text();
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////
	//TARGETING FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////
	
	/*	
	//	targets:		A list containing possible targets [0] is the object clicked, the remainder are the 
	//					enemy creatures in play INCLUDING [0] REPEATED
	//	affect:			A function that will be applied to all the appropriate targets from the target list
	//	ability_radius:	The enumeration which states which objects int the targets list to apply the affect
	//					function to
	//	Overall this function takes a list of targets and passes them into a function based on the ability_radius
	*/
	function Target(targets: List.<GameObject>, affect: Function, ability_radius: int, ability_power: int)
	{
		if(ability_radius == radius.single)
		{
			affect(targets[0], ability_power);
		}
		else if(ability_radius == radius.adjacent)
		{
			var original_target: GameObject = targets[0];
			targets.RemoveAt(0);
			var target_index = targets.IndexOf(original_target);
			affect(targets[target_index], ability_power);
			if(target_index > 0)
			{
				affect(targets[target_index - 1], ability_power);
			}
			if(target_index >= 0 && target_index < targets.Count - 1)
			{
				affect(targets[target_index + 1], ability_power);
			}
		}
		else if(ability_radius == radius.enemies)
		{
			affect(GameObject.FindGameObjectWithTag("op_hand_area"), ability_power);
			targets.RemoveAt(0);
			for(var target: GameObject in targets)
			{
				affect(target, ability_power);
			}
		}
		else if(ability_radius == radius.creatures)
		{
			targets.RemoveAt(0);
			for(var target2: GameObject in targets)
			{
				affect(target2, ability_power);
			}
			for(var target3: GameObject in owner.Get_Creatures())
			{
				affect(target3, ability_power);
			}
		}
		else if(ability_radius == radius.enemy_creatures)
		{
			targets.RemoveAt(0);
			for(var target3: GameObject in targets)
			{
				affect(target3, ability_power);
			}
		}
		else if(ability_radius == radius.random_enemy)
		{
			targets[0] = GameObject.FindGameObjectWithTag("op_hand_area");
			affect(targets[Random.Range(0, targets.Count)], ability_power);
		}
		else
		{
			Debug.Log("A card is trying to target something without a targeting type.");
		}
	}
	
	////////////////////////////////////////////////////////////////////////////////
	//ABILITY FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////
	
	/*	
	//	abilities:		A list containing an array of objects that represent different aspects of an ability
	//	targets:		A list containing possible targets [0] is the object clicked, the remainder are the 
	//					enemy creatures in play INCLUDING [0] REPEATED
	//	Overall this function activates all abilities passed to it
	*/
	function Activate_Ability(abilities: List.<Object[]>, targets: List.<GameObject>)
	{
		//Loop through every ability
		for each (ab in abilities)
		{
			var target_type: int = ab[1];
			var the_effect: int = ab[0];
			var the_power: int = ab[2];
			if (the_effect == effect.damage)
			{
				//deal_damage = ab[2];
				Target(targets, Direct_Damage, target_type, the_power);
			}
			else if (the_effect == effect.summon)
			{
				summon = ab[2];
				additional_card = ab[3];
				if(local)
				{
					Local_Summon();
				}
				else
				{
					Summon();
				}
			}
			else if (the_effect == effect.convert)
			{
				Target(targets, Convert, target_type, the_power);
			}
			else if (the_effect == effect.temp_mana)
			{
				var energy_packet: int[] = 	[the_power / 1000, 
											(the_power % 1000) / 100, 
											(the_power % 100) / 10, 
											the_power % 10];
				if(owner != null)
				{
					owner.SendMessage("Gain_Temp_Mana", energy_packet);
				}
			}
			else if (the_effect == effect.draw)
			{
				owner.SendMessage("Draw", the_power);
			}
			else if (the_effect == effect.swap)
			{
				Target(targets, Swap_Stats, target_type, the_power);
			}
			else if (the_effect == effect.buff)
			{
				Target(targets, Buff, target_type, the_power);
			}
			//THIS EFFECT SHOULD GO THROUGH TARGET
			else if (the_effect == effect.combine)
			{
				var original_target: GameObject = targets[0];
				var victims: GameObject[] = new GameObject[2];
				var stolen_stats: int[] = [0, 0];
				targets.RemoveAt(0);
				var target_index = targets.IndexOf(original_target);
				if(target_index > 0)
				{
					var victim_1_stats: int[] = targets[target_index - 1].GetComponent("Base_Card").Get_Stats();
					stolen_stats[0] += victim_1_stats[0];
					stolen_stats[1] += victim_1_stats[1];
					victims[0] = targets[target_index - 1];
				}
				if(target_index >= 0 && target_index < targets.Count - 1)
				{
					var victim_2_stats: int[] = targets[target_index + 1].GetComponent("Base_Card").Get_Stats();
					stolen_stats[0] += victim_2_stats[0];
					stolen_stats[1] += victim_2_stats[1];
					victims[1] = targets[target_index + 1];
				}
				if(victims[0] != null)
				{
					victims[0].GetComponent("Base_Card").SendMessage("Inform_Death");
				}
				if(victims[1] != null)
				{
					victims[1].GetComponent("Base_Card").SendMessage("Inform_Death");
				}
				original_target.GetComponent(Base_Card).SendMessage("Increase_Stats", stolen_stats);
			}
		}
	}
	
	function Convert(target: GameObject, power_level: int)
	{
		owner.SendMessage("Gain_Creature", target);
	}
	
	function Buff(target: GameObject, buff_amount: int)
	{
		var stat_buff: int[] = [buff_amount / 10, buff_amount % 10];
		target.GetComponent(Base_Card).SendMessage("Increase_Stats", stat_buff);
	}
	
	function Swap_Stats(target: GameObject, power_level: int)
	{
		var old_stats: int[] = target.GetComponent(Base_Card).Get_Stats();
		target.GetComponent("Base_Card").SendMessage("Set_Stats", [old_stats[1], old_stats[0]]);
	}
	
	function Direct_Damage(target: GameObject, damage_amount: int)
	{
		if(target.tag == "played_op_card" || target.tag == "played_card")
		{
			target.GetComponent("Base_Card").SendMessage("Take_Damage", damage_amount);
		}
		else
		{
			target.GetComponent(Play_Area).SendMessage("Take_Damage", damage_amount);
		}
	}
	
	function Summon()
	{
		for(var k: int = 0; k < summon; k++)
		{
			var material_card: GameObject;
			if(GetComponent.<NetworkView>().isMine)
			{
				material_card = Network.Instantiate(additional_card, Vector3(-30 - (10 * k), .1, 0), Quaternion.identity, 0);
			}
			else
			{
				material_card = Network.Instantiate(additional_card, Vector3(30 + (10 * k), .1, 0), Quaternion.identity, 0);
			}
			owner.SendMessage("Flip_Card", material_card);
			if(material_card.tag == "op_card")
			{
				material_card.tag = "card";
			}
			material_card.GetComponent(Base_Card).SendMessage("Set_Play_Out_Of_Turn", true);
			material_card.GetComponent(Base_Card).SendMessage("Reveal");
			if(owner.Can_Play(material_card))
			{
				owner.SendMessage("Play", material_card);
			}
			else
			{
				Network.Destroy(material_card);
			}
		}
	}
	
	function Local_Summon()
	{
		for(var k: int = 0; k < summon; k++)
		{
			var material_card: GameObject = Instantiate(additional_card, Vector3(-30 - (10 * k), .1, 0), Quaternion.identity);
			var card_script: Base_Card = material_card.GetComponent(Base_Card);
			card_script.SendMessage("Set_Play_Out_Of_Turn", true);
			card_script.SendMessage("Reveal");
			card_script.SendMessage("Set_Local");
			if(owner.Can_Play(material_card))
			{
				owner.SendMessage("Play", material_card);
			}
			else
			{
				Destroy(material_card);
			}
		}
	}
}