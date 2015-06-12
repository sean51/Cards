public class Creature_Card extends Targeting_System
{
	//attributes
	public var attack: int = 0;
	public var max_defense: int = 0;
	
	//Abilities
	public var ranged: boolean = false;
	public var rush: boolean = false;
	public var guardian: boolean = false;
	public var on_play_ability: boolean = false;
	public var on_death_ability: boolean = false;
	
	//hidden attributes
	private var current_defense: int;
	private var attacked: boolean = true;
	
	//The text written on each card
	private var attack_text: GameObject;
	private var defense_text: GameObject;
	
	//States
	private var attacking: boolean = false;
	private var retreating: boolean = false;
	private static var ATTACK_IN_PROGRESS = false;
	
	//Traveling variables
	private static var RETREAT_SPEED: float = 40.0;
	private static var MELEE_DISTANCE: float = 7.0;
	private static var CARD_ATTACK_HEIGHT: float = .5;
	
	//Attack Targets
	private var attack_target: GameObject;
	private var ability_target: GameObject;
	
	//Sounds
	public var hit_sound: AudioClip;
	
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
		if (ranged)
		{
			abilities.Add(effect_radius, effect.ranged);
		}
		if (guardian)
		{
			abilities.Add(effect_radius, effect.guardian);
		}
		if (rush)
		{
			abilities.Add(effect_radius, effect.rush);
		}
		if (on_play_ability)
		{
			if (summon > 0)
			{
				abilities.Add(effect_radius, trigger.on_play, effect.summon, summon, additional_card);
			}
			else if (deal_damage > 0)
			{
				abilities.Add(effect_radius, trigger.on_play, effect.damage, deal_damage);
			}
		}
		else if (on_death_ability)
		{
			if (summon > 0)
			{
				abilities.Add(effect_radius, trigger.on_death, effect.summon, summon, additional_card);
			}
			else if (deal_damage > 0)
			{
				abilities.Add(effect_radius, trigger.on_death, effect.damage, deal_damage);
			}
		}
	}
	
	function Start () 
	{
		super.Start();
		ability_target = gameObject;
		current_defense = max_defense;
		for (var child : Transform in gameObject.transform)
		{
			if(child.name == "attack")
			{
				attack_text = child.gameObject;
				child.GetComponent(TextMesh).text = "" + attack;
			}
			else if(child.name == "defense")
			{
				defense_text = child.gameObject;
				child.GetComponent(TextMesh).text = "" + max_defense;
			}
		}
	}
	
	function Update()
	{
		super.Update();
		
		attack_text.GetComponent(TextMesh).text = "" + attack;
		defense_text.GetComponent(TextMesh).text = "" + current_defense;
		
		if(attacking)
		{
			if(local)
			{
				Local_Move(Vector3.Lerp(start_position, end_position, ((Time.time - start_time) * TRAVEL_SPEED) / distance));
			}
			else
			{
				Move(Vector3.Lerp(start_position, end_position, ((Time.time - start_time) * TRAVEL_SPEED) / distance));
			}
			if(Vector3.Distance(gameObject.transform.position, end_position) < MELEE_DISTANCE)
			{
				if(attack_target != null)
				{
					Deal_Damage(attack_target);
				}
				else
				{
					Set_Attacked(false);
				}
				end_position = gameObject.transform.position;
				start_time = Time.time;
				attacking = false;
				retreating = true;
			}
		}
		else if(retreating)
		{
			if(local)
			{
				Local_Move(Vector3.Lerp(end_position, start_position, ((Time.time - start_time) * RETREAT_SPEED) / distance));
			}
			else
			{
				Move(Vector3.Lerp(end_position, start_position, ((Time.time - start_time) * RETREAT_SPEED) / distance));
			}
			if(Vector3.Distance(gameObject.transform.position, start_position) < DISTANCE_ALLOWANCE)
			{
				ATTACK_IN_PROGRESS = false;
				retreating = false;
				gameObject.transform.position = Vector3(gameObject.transform.position.x, CARD_HOVER_HEIGHT, gameObject.transform.position.z);
			}
		}
	}
	
	////////////////////////////////////////////////////////////////////////////////
	//GETTER FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	function Get_Attack(): int
	{
		return attack;
	}
	
	function Get_Defense(): int
	{
		return current_defense;
	}
	
	function Get_Maximum_Stats(): int[]
	{
		return [attack, max_defense];
	}
	
	function Get_Stats(): int[]
	{
		return [attack, current_defense];
	}
	
	function Can_Attack(): boolean
	{
		return !attacked;
	}
	
	function Get_Melee(): boolean
	{
		return !abilities.Ranged();
	}
	
	function Get_Guardian(): boolean
	{
		return !abilities.Guardian();
	}
	
	function Get_On_Death_Ability(): boolean
	{
		return abilities.On_Death();
	}
	
	function Get_Play_Abilities(): List.<Object[]>
	{
		return abilities.Play_Packet();
	}
	
	function Get_Death_Abilities(): List.<Object[]>
	{
		return abilities.Death_Packet();
	}
	
	//OVERWRITTEN from Base_Card
	function Get_Final_Destination(): Vector3
	{
		if(traveling || local_traveling || retreating || attacking)
		{
			if(queued_destination.Count > 0)
			{
				return queued_destination[queued_destination.Count - 1];
			}
			else
			{
				return end_position;
			}
		}
		else
		{
			return gameObject.transform.position;
		}
	}
	
	function Get_Two_Stage_Play(): boolean
	{
		return affects_single || affects_adjacent;
	}
	
	////////////////////////////////////////////////////////////////////////////////
	//SETTER FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	function Set_Attacked(toggle: boolean)
	{
		attacked = toggle;
	}
	
	//OVERWRITTEN from Base_Card
	function Set_Owner(player: GameObject)
	{
		super.Set_Owner(player);
		
		//If there are abilities to be cast when played
		if(abilities.On_Play())
		{
			//Create a packet with the target (default this gameObject) and all enemy creatures.
			var packet: List.<GameObject> = new List.<GameObject>();
			packet.Add(ability_target);
			for(var target: GameObject in owner.Get_Enemy_Creatures())
			{
				packet.Add(target);
			}
			
			
			Activate_Ability(Get_Play_Abilities(), packet);
		}
		if(abilities.Rush())
		{
			Set_Attacked(false);
		}
	}
	
	function Set_Stats(new_stats: int[])
	{
		attack = new_stats[0];
		current_defense = new_stats[1];
		GetComponent.<NetworkView>().RPC("Networked_Update_Stats", RPCMode.AllBuffered, attack, current_defense);
		if(current_defense <= 0)
		{
			Inform_Death();
		}
	}
	
	function Set_Ability_Target(new_target: GameObject)
	{
		ability_target = new_target;
	}
	
	////////////////////////////////////////////////////////////////////////////////
	//ATTACK FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	function Attack(defender: GameObject)
	{
		if(traveling || attacking || retreating)
		{
			return;
		}
		if(defender.tag == "played_op_card")
		{
			if(attack >= defender.GetComponent("Base_Card").Get_Defense())
			{
				if(!local)
				{
					defender.GetComponent("Base_Card").SendMessage("Kill_Creature");
				}
			}
		}
		attacked = true;
		while(ATTACK_IN_PROGRESS)
		{
			yield WaitForSeconds(.5);
		}
		ATTACK_IN_PROGRESS = true;
		if(defender == null)
		{
			attacked = false;
			ATTACK_IN_PROGRESS = false;
			return;
		}
		gameObject.transform.position = Vector3(gameObject.transform.position.x, CARD_ATTACK_HEIGHT, gameObject.transform.position.z);
		attack_target = defender;
		start_position = gameObject.transform.position;
		end_position = defender.transform.position;
		start_time = Time.time;
		distance = Vector3.Distance(start_position, end_position);
		attacking = true;
	}

	function Deal_Damage(defender: GameObject)
	{
		AudioSource.PlayClipAtPoint(hit_sound, gameObject.transform.position);
		if(defender.gameObject.tag == "played_op_card")
		{
			defender.GetComponent(Base_Card).SendMessage("Take_Damage", [attack, gameObject]);
		}
		else if(defender.gameObject.tag == "played_card")
		{
			defender.GetComponent(Base_Card).SendMessage("Take_Damage", [attack, gameObject]);
		}
		else
		{
			defender.GetComponent(Play_Area).SendMessage("Take_Damage", attack);
		}
	}
	
	////////////////////////////////////////////////////////////////////////////////
	//STAT MODIFICATION FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	//Damage which cannot be retaliated against.
	function Take_Damage(amount: int)
	{
		current_defense -= amount;
		if(!local)
		{
			GetComponent.<NetworkView>().RPC("Networked_Update_Stats", RPCMode.AllBuffered, attack, current_defense);
		}
		if(current_defense <= 0)
		{
			yield WaitForSeconds(.4);
			Inform_Death();
		}
	}
	
	//Damage with a chance of retaliation.
	function Take_Damage(packet: Object[])
	{
		//I am ranged and he is melee
		if(abilities.Ranged() && packet[1].GetComponent("Base_Card").Get_Melee())
		{
			if(attack >= packet[1].GetComponent("Base_Card").Get_Defense())
			{
				if(!local)
				{
					packet[1].GetComponent("Base_Card").SendMessage("Kill_Creature");
				}
				packet[1].GetComponent("Base_Card").SendMessage("Take_Damage", attack);
			}
			else
			{
				current_defense -= packet[0];
				packet[1].GetComponent("Base_Card").SendMessage("Take_Damage", attack);
			}
		}
		//I am ranged and so is he
		else if(abilities.Ranged())
		{
			current_defense -= packet[0];
			packet[1].GetComponent("Base_Card").SendMessage("Take_Damage", attack);
		}
		//I am melee and so is he
		else if(packet[1].GetComponent("Base_Card").Get_Melee())
		{
			current_defense -= packet[0];
			packet[1].GetComponent("Base_Card").SendMessage("Take_Damage", attack);
		}
		//I am melee and he is ranged
		else
		{
			current_defense -= packet[0];
			if(current_defense > 0)
			{
				packet[1].GetComponent("Base_Card").SendMessage("Take_Damage", attack);
			}
		}
		if(!local)
		{
			GetComponent.<NetworkView>().RPC("Networked_Update_Stats", RPCMode.AllBuffered, attack, current_defense);
		}
		if(current_defense <= 0)
		{
			yield WaitForSeconds(.4);
			Inform_Death();
		}
	}

	function Increase_Stats(increase_amount: int[])
	{
		attack += increase_amount[0];
		current_defense += increase_amount[1];
		if(!local)
		{
			GetComponent.<NetworkView>().RPC("Networked_Update_Stats", RPCMode.AllBuffered, attack, current_defense);
		}
	}
	
	////////////////////////////////////////////////////////////////////////////////
	//UTILITY FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////
	
	//OVERWRITTEN from Base_Card
	function Travel(destination: Vector3)
	{
		if(traveling || attacking || retreating)
		{
			queued_destination.Add(destination);
			return;
		}
		start_position = gameObject.transform.position;
		end_position = destination;
		if(start_position == end_position)
		{
			if(queued_destination.Count > 0)
			{
				var temp: Vector3 = queued_destination[0];
				queued_destination.RemoveAt(0); 
				Travel(temp);
			}
			return;
		}
		gameObject.layer = LayerMask.NameToLayer("Ignore Raycast");
		start_time = Time.time;
		distance = Vector3.Distance(start_position, end_position);
		traveling = true;
	}
	
	//OVERWRITTEN from Base_Card
	function Local_Travel(destination: Vector3)
	{
		if(traveling || attacking || retreating || local_traveling)
		{
			queued_destination.Add(destination);
			return;
		}
		start_position = gameObject.transform.position;
		end_position = destination;
		if(start_position == end_position)
		{
			return;
		}
		gameObject.layer = LayerMask.NameToLayer("Ignore Raycast");
		start_time = Time.time;
		distance = Vector3.Distance(start_position, end_position);
		local_traveling = true;
	}
	
	function Inform_Death()
	{
		if(owner != null)
		{
			owner.SendMessage("Card_Died", gameObject);
		}
		else
		{
			GetComponent.<NetworkView>().RPC("Networked_Inform_Death", RPCMode.Others);
		}
	}
	
	////////////////////////////////////////////////////////////////////////////////
	//NETWORK CALL FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////
	
	function Play_Creature()
	{
		GetComponent.<NetworkView>().RPC("Networked_Play_Creature", RPCMode.AllBuffered);
	}

	function Kill_Creature()
	{
		GetComponent.<NetworkView>().RPC("Networked_Kill_Creature", RPCMode.AllBuffered);
	}
	
	////////////////////////////////////////////////////////////////////////////////
	//NETWORKED FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	@RPC
	function Networked_Update_Stats(new_attack: int, new_defense: int)
	{
		attack = new_attack;
		current_defense = new_defense;
		attack_text.GetComponent(TextMesh).text = "" + new_attack;
		defense_text.GetComponent(TextMesh).text = "" + new_defense;
	}

	@RPC
	function Networked_Kill_Creature()
	{
		gameObject.tag = "played_op_card";
	}

	@RPC
	function Networked_Play_Creature()
	{
		gameObject.tag = "played_op_card";
	}
	
	@RPC
	function Networked_Inform_Death()
	{
		GameObject.FindGameObjectWithTag("player").GetComponent(Hero).SendMessage("Card_Died", gameObject);
	}
	
	////////////////////////////////////////////////////////////////////////////////
	//DEBUG FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////
	
	//OVERWRITTEN from Base_Card
	function About(): String
	{
		return "Creature_Card (" + attack + "/" + max_defense + ") Cost (" + mana_cost[0] + mana_cost[1] + mana_cost[2] + mana_cost[3] + ").";
	}
}