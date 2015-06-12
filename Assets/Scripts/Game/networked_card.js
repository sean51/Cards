//For the use of Lists.
import System.Collections.Generic;

public var attack: int = 0;
public var max_defense: int = 0;
public var spell_power: int = 0;
public var mana_gain: int[] = [0, 0, 0, 0];
public var mana_cost: int[] = [0, 0, 0, 0];
public var temp_mana_gain: int[] = [0, 0, 0, 0];
public var stat_increase: int[] = [0, 0];
public var ranged: boolean = false;

public var single_target: boolean = false;
public var adjacent_target: boolean = false;
public var all_enemies_target: boolean = false;
public var all_creatures_target: boolean = false;
public var all_enemy_creatures_target: boolean = false;

public var on_play_ability: boolean = false;

private var current_defense: int;
private var attacked: boolean = true;

//The text written on each card
private var attack_text: GameObject;
private var defense_text: GameObject;
private var cost_text: GameObject;
private static var TEXT_LINE_LENGTH: int = 14;

//Child objects of the card
private var glow: GameObject;
private var cover: GameObject;

//States
private var attacking: boolean = false;
private var retreating: boolean = false;
private var traveling: boolean = false;
private var local_traveling: boolean = false;
private static var ATTACK_IN_PROGRESS = false;

//Destinations
private var start_position: Vector3;
private var end_position: Vector3;
public var queued_destination: List.<Vector3> = new List.<Vector3>();

//Traveling variables
private var start_time: float;
private var distance: float;
private static var CARD_HOVER_HEIGHT: float = .1;
private static var CARD_ATTACK_HEIGHT: float = .5;
private static var TRAVEL_SPEED: float = 20.0;
private static var RETREAT_SPEED: float = 40.0;
private static var MELEE_DISTANCE: float = 7.0;
private static var DISTANCE_ALLOWANCE: float = 0.1;

//Attack Targets
private var attack_target: GameObject;

//The owner of the card.
private var owner: GameObject;

////////////////////////////////////////////////////////////////////////////////
//UNITY FUNCTIONS
////////////////////////////////////////////////////////////////////////////////

function Start () 
{
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
			else if(child.name == "cost")
			{
				cost_text = child.gameObject;
				child.GetComponent(TextMesh).text = "";
				for(var i: int = 0; i < 4; i++)
				{
					if(mana_cost[i] > 0)
					{
						child.GetComponent(TextMesh).text += "" + mana_cost[i];
						switch(i)
						{
							case 0:
								break;
							case 1:
								break;
							case 2:
								break;
							case 3:
								gameObject.GetComponent.<Renderer>().material.SetTexture("_DecalTex", Resources.Load("blue_mana_tex"));
								break;
						}
					}
				}
				//child.GetComponent(TextMesh).text = "" + mana_cost[0] + mana_cost[1] + mana_cost[2] + mana_cost[3];
			}
			else if(child.name == "glow")
			{
				glow = child.gameObject;
			}
			else if(child.name == "cover")
			{
				cover = child.gameObject;
			}
			else if(child.name == "text")
			{
				//The text was already calculated
				if(!child.GetComponent(TextMesh).text.Contains("\n"))
				{
					var current_line: int = 1;
					var string_manipulation: String[] = child.GetComponent(TextMesh).text.Split(" "[0]);
					child.GetComponent(TextMesh).text = "";
					var additional_text: String = "";
					if(ranged)
					{
						additional_text += "ranged\n";
					}
					if(single_target)
					{
						additional_text += "deal " + spell_power + " damage\n";
					}
					if(adjacent_target)
					{
						additional_text += "deal " + spell_power + " damage\n(radius 1)\n";
					}
					if(all_enemies_target)
					{
						additional_text += "deal " + spell_power + " damage\nto all enemies\n";
					}
					if(all_creatures_target)
					{
						additional_text += "deal " + spell_power + " damage\nto all creatures\n";
					}
					if(all_enemy_creatures_target)
					{
						additional_text += "deal " + spell_power + " damage\nto all enemy\ncreatures\n";
					}
					for(var line : String in string_manipulation)
					{
						if(child.GetComponent(TextMesh).text.Length + line.Length > current_line * TEXT_LINE_LENGTH)
						{
							child.GetComponent(TextMesh).text += "\n";
							current_line++;
						}
						child.GetComponent(TextMesh).text += line + " ";
					}
					child.GetComponent(TextMesh).text = additional_text + child.GetComponent(TextMesh).text;
				}
			}
		}
}

function Update () 
{
	if(gameObject.tag == "card")
	{
		attack_text.GetComponent(TextMesh).text = "" + attack;
		defense_text.GetComponent(TextMesh).text = "" + current_defense;
		//cost_text.GetComponent(TextMesh).text = "" + mana_cost[0] + mana_cost[1] + mana_cost[2] + mana_cost[3];
	}
	if(traveling)
	{
		//Move(Vector3.Lerp(start_position, end_position, Mathf.SmoothStep(0.0, 1.0, ((Time.time - start_time) * 10.0) / distance)));
		Move(Vector3.Lerp(start_position, end_position, ((Time.time - start_time) * TRAVEL_SPEED) / distance));
		if(Vector3.Distance(gameObject.transform.position, end_position) < DISTANCE_ALLOWANCE)
		{
			traveling = false;
			gameObject.layer = LayerMask.NameToLayer("card");
			if(queued_destination.Count > 0)
			{
				var temp: Vector3 = queued_destination[0];
				queued_destination.RemoveAt(0); 
				Travel(temp);
			}
		}
	}
	else if(attacking)
	{
		Move(Vector3.Lerp(start_position, end_position, ((Time.time - start_time) * TRAVEL_SPEED) / distance));
		if(Vector3.Distance(gameObject.transform.position, end_position) < MELEE_DISTANCE)
		{
			Deal_Damage(attack_target);
			end_position = gameObject.transform.position;
			start_time = Time.time;
			attacking = false;
			retreating = true;
		}
	}
	else if(retreating)
	{
		Move(Vector3.Lerp(end_position, start_position, ((Time.time - start_time) * RETREAT_SPEED) / distance));
		if(Vector3.Distance(gameObject.transform.position, start_position) < DISTANCE_ALLOWANCE)
		{
			ATTACK_IN_PROGRESS = false;
			retreating = false;
			gameObject.transform.position = Vector3(gameObject.transform.position.x, CARD_HOVER_HEIGHT, gameObject.transform.position.z);
		}
	}
	else if (local_traveling)
	{
		gameObject.transform.position = Vector3.Lerp(start_position, end_position, ((Time.time - start_time) * TRAVEL_SPEED) / distance);
		if(Vector3.Distance(gameObject.transform.position, end_position) < DISTANCE_ALLOWANCE)
		{
			local_traveling = false;
			gameObject.layer = LayerMask.NameToLayer("card");
			if(queued_destination.Count > 0)
			{
				var temp2: Vector3 = queued_destination[0];
				queued_destination.RemoveAt(0); 
				Local_Travel(temp2);
			}
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

function Get_Cost(): int[]
{
	return mana_cost;
}

function Get_Cost_Sum(): int
{
	return mana_cost[0] + mana_cost[1] + mana_cost[2] + mana_cost[3];
}

function Get_Stat_Increase(): int[]
{
	return stat_increase;
}

function Can_Attack(): boolean
{
	return !attacked;
}

function Get_Destination(): Vector3
{
	return end_position;
}

//Not as grim as it sounds...
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

function Get_Melee(): boolean
{
	return !ranged;
}

////////////////////////////////////////////////////////////////////////////////
//SETTER FUNCTIONS
////////////////////////////////////////////////////////////////////////////////

function Set_Attacked(toggle: boolean)
{
	attacked = toggle;
}

function Set_Owner(player: GameObject)
{
	owner = player;
	if(on_play_ability)
	{
		var packet: List.<GameObject> = player.GetComponent("player3").Get_Enemy_Creatures();
		packet.Insert(0, gameObject);
		Cast(packet);
	}
	player.GetComponent("player3").SendMessage("Gain_Mana", mana_gain);
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
		if(attack >= defender.GetComponent("networked_card").Get_Defense())
		{
			defender.GetComponent("networked_card").SendMessage("Kill_Creature");
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
	if(defender.gameObject.tag == "played_op_card")
	{
		defender.GetComponent("networked_card").SendMessage("Take_Damage", [attack, gameObject]);
	}
	else
	{
		defender.GetComponent("player").SendMessage("Take_Damage", attack);
	}
}

function Cast(target: GameObject)
{
	if(attack > 0)
	{
		if(target.tag == "played_op_card")
		{
			target.GetComponent("networked_card").SendMessage("Take_Damage", attack);
		}
		else
		{
			target.GetComponent("player").SendMessage("Take_Damage", attack);
		}
	}
	for(var i : int = 0; i < 4; i++)
	{
		if(temp_mana_gain[i] > 0)
		{
			if(owner != null)
			{
				owner.GetComponent("player3").SendMessage("Gain_Temp_Mana", temp_mana_gain);
			}
		}
	}
}

function Cast(targets: List.<GameObject>)
{
	if(single_target)
	{
		if(targets[0].tag == "played_op_card")
		{
			targets[0].GetComponent("networked_card").SendMessage("Take_Damage", spell_power);
		}
		else
		{
			targets[0].GetComponent("player").SendMessage("Take_Damage", spell_power);
		}
	}
	else if(adjacent_target)
	{
		var original_target: GameObject = targets[0];
		targets.RemoveAt(0);
		var target_index = targets.IndexOf(original_target);
		targets[target_index].GetComponent("networked_card").SendMessage("Take_Damage", spell_power);
		if(target_index > 0)
		{
			targets[target_index - 1].GetComponent("networked_card").SendMessage("Take_Damage", spell_power);
		}
		if(target_index < targets.Count - 1)
		{
			targets[target_index + 1].GetComponent("networked_card").SendMessage("Take_Damage", spell_power);
		}
	}
	else if(all_enemies_target)
	{
		var op: GameObject = GameObject.FindGameObjectWithTag("op_hand_area");
		op.GetComponent("player").SendMessage("Take_Damage", spell_power);
		targets.RemoveAt(0);
		for(var target: GameObject in targets)
		{
			target.GetComponent("networked_card").SendMessage("Take_Damage", spell_power);
		}
	}
	else if(all_creatures_target)
	{
		targets.RemoveAt(0);
		for(var target2: GameObject in targets)
		{
			target2.GetComponent("networked_card").SendMessage("Take_Damage", spell_power);
		}
		for(var target3: GameObject in owner.GetComponent("player3").Get_Creatures())
		{
			target3.GetComponent("networked_card").SendMessage("Take_Damage", spell_power);
		}
	}
	else if(all_enemy_creatures_target)
	{
		targets.RemoveAt(0);
		for(var target3: GameObject in targets)
		{
			target3.GetComponent("networked_card").SendMessage("Take_Damage", spell_power);
		}
	}
	else
	{
		for(var i : int = 0; i < 4; i++)
		{
			if(temp_mana_gain[i] > 0)
			{
				if(owner != null)
				{
					owner.GetComponent("player3").SendMessage("Gain_Temp_Mana", temp_mana_gain);
				}
			}
		}
	}
}

////////////////////////////////////////////////////////////////////////////////
//STAT MODIFICATION FUNCTIONS
////////////////////////////////////////////////////////////////////////////////

function Take_Damage(amount: int)
{
	current_defense -= amount;
	GetComponent.<NetworkView>().RPC("Networked_Update_Stats", RPCMode.AllBuffered, attack, current_defense);
	if(current_defense <= 0)
	{
		yield WaitForSeconds(.4);
		Inform_Death();
		//Network.Destroy(gameObject);
	}
}

function Take_Damage(packet: Object[])
{
	//I am ranged and he is melee
	if(ranged && packet[1].GetComponent("networked_card").Get_Melee())
	{
		if(attack >= packet[1].GetComponent("networked_card").Get_Defense())
		{
			packet[1].GetComponent("networked_card").SendMessage("Kill_Creature");
			packet[1].GetComponent("networked_card").SendMessage("Take_Damage", attack);
		}
		else
		{
			current_defense -= packet[0];
			packet[1].GetComponent("networked_card").SendMessage("Take_Damage", attack);
		}
	}
	//I am ranged and so is he
	else if(ranged)
	{
		current_defense -= packet[0];
		packet[1].GetComponent("networked_card").SendMessage("Take_Damage", attack);
	}
	//I am melee and so is he
	else if(packet[1].GetComponent("networked_card").Get_Melee())
	{
		current_defense -= packet[0];
		packet[1].GetComponent("networked_card").SendMessage("Take_Damage", attack);
	}
	//I am melee and he is ranged
	else
	{
		current_defense -= packet[0];
		if(current_defense > 0)
		{
			packet[1].GetComponent("networked_card").SendMessage("Take_Damage", attack);
		}
	}
	GetComponent.<NetworkView>().RPC("Networked_Update_Stats", RPCMode.AllBuffered, attack, current_defense);
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
	GetComponent.<NetworkView>().RPC("Networked_Update_Stats", RPCMode.AllBuffered, attack, current_defense);
}

////////////////////////////////////////////////////////////////////////////////
//UTILITY FUNCTIONS
////////////////////////////////////////////////////////////////////////////////

function Flip()
{
	gameObject.transform.rotation *= Quaternion.Euler(0, 180, 0);
}

function Reveal()
{
	if(cover != null)
	{
		cover.SetActive(false);
	}
	else
	{
		for (var child : Transform in gameObject.transform) 
		{
			if(child.name == "cover")
			{
				cover = child.gameObject;
				break;
			}
		}
		cover.SetActive(false);
	}
}

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
		owner.GetComponent("player3").SendMessage("Card_Died", gameObject);
	}
	else
	{
		GetComponent.<NetworkView>().RPC("Networked_Inform_Death", RPCMode.Others);
	}
}

////////////////////////////////////////////////////////////////////////////////
//GLOW FUNCTIONS
////////////////////////////////////////////////////////////////////////////////

function Glow(set_glow: boolean)
{
	if(glow != null)
	{
		glow.GetComponent(Projector).enabled = set_glow;
	}
	else
	{
		for (var child : Transform in gameObject.transform) 
		{
			if(child.name == "glow")
			{
				glow = child.gameObject;
				glow.GetComponent(Projector).enabled = set_glow;
				break;
			}
		}
	}
}

function Set_Glow_Color(new_color: Color)
{
	var gggg: Material = new Material(glow.GetComponent(Projector).material);
	gggg.SetColor("_Color", new_color);
	glow.GetComponent(Projector).material = gggg;
}

////////////////////////////////////////////////////////////////////////////////
//NETWORK CALL FUNCTIONS
////////////////////////////////////////////////////////////////////////////////

function Network_Reveal()
{
	GetComponent.<NetworkView>().RPC("Networked_Reveal", RPCMode.AllBuffered);
}

function Network_Flip()
{
	GetComponent.<NetworkView>().RPC("Networked_Flip", RPCMode.Others, 180);
}

function Move(new_position: Vector3) 
{
	GetComponent.<NetworkView>().RPC("Networked_Move", RPCMode.AllBuffered, new_position);
}

function Create() 
{
	GetComponent.<NetworkView>().RPC("Networked_Create", RPCMode.AllBuffered, Vector3(Random.Range(0.0,1.0), Random.Range(0.0,1.0), Random.Range(0.0,1.0)), [Random.Range(0, 2), Random.Range(0, 2), Random.Range(0, 2), Random.Range(0, 2), Random.Range(0, 6), Random.Range(1, 6)]);
}

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
function Networked_Reveal()
{
	cover.SetActive(false);
}

@RPC
function Networked_Flip(new_rotation: int)
{
	gameObject.transform.rotation = gameObject.transform.rotation * Quaternion.Euler(0, new_rotation, 0);
}

@RPC
function Networked_Move(new_position : Vector3)
{
	gameObject.transform.position = new_position;
}

@RPC
function Networked_Inform_Death()
{
	GameObject.FindGameObjectWithTag("player").GetComponent("player3").SendMessage("Card_Died", gameObject);
}

@RPC
function Networked_Create(mat_color: Vector3, additional: int[])
{
	//gameObject.renderer.material.color = Color(mat_color.x, mat_color.y, mat_color.z);
	mana_cost[0] = additional[0];
	mana_cost[1] = additional[1];
	mana_cost[2] = additional[2];
	mana_cost[3] = additional[3];
	attack = additional[4];
	var temp = additional[5];
	max_defense = temp;
	current_defense = temp;
}

