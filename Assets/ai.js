import System.Collections.Generic;

public var card: GameObject;

public var hand: List.<GameObject>;
public var in_play: List.<GameObject>;
public var deck: List.<GameObject>;

public var max_mana: int[] = [0, 0, 0, 0];
public var current_mana: int[] = [0, 0, 0, 0];

private var chosen_mana: boolean = false;

function Start () 
{
	for(var i: int = 0; i < 30; i++)
	{
		deck.Add(card);
	}
	Draw(3);
}

function Update () 
{

}

function Play(play_card: GameObject)
{
	if(Can_Play(play_card))
	{
		Spend_Mana(play_card.GetComponent("card").Get_Cost());
		play_card.tag = "played_op_card";
		play_card.SendMessage("Set_Owner", gameObject);
		hand.Remove(play_card);
		in_play.Add(play_card);
		Arrange_Play_Area();
	}
	Arrange_Hand();
}

function Card_Died(dead_card: GameObject)
{
	in_play.Remove(dead_card);
}

function Can_Play(checked_card: GameObject): boolean
{
	if(in_play.Count >= 10)
	{
		return false;
	}
	var required_mana: int[] = checked_card.GetComponent("card").Get_Cost();
	for(var i: int = 0; i < 4; i++)
	{
		if(required_mana[i] > current_mana[i])
		{
			return false;
		}
	}
	return true;
}

//Test if the card can be played using a foreign mana source.
function Can_Play_Foreign_Mana(checked_card: GameObject, mana_source: int[]): boolean
{
	if(in_play.Count >= 10)
	{
		return false;
	}
	var required_mana: int[] = checked_card.GetComponent("card").Get_Cost();
	for(var i: int = 0; i < 4; i++)
	{
		if(required_mana[i] > mana_source[i])
		{
			return false;
		}
	}
	return true;
}

function Spend_Mana(required_mana: int[])
{
	for(var i: int = 0; i < 4; i++)
	{
		current_mana[i] -= required_mana[i];
	}
}

//Draws a certain amount of cards and tags them as enemy cards.
function Draw(amount: int)
{
	if(hand.Count < 10)
	{
		for(var i: int = 0; i < amount; i++)
		{
			if(deck.Count > 0)
			{
				var card_drawn = deck[0];
				var material_card: GameObject = Instantiate(card_drawn, Vector3(0, 0, 0), Quaternion.identity);
				material_card.tag = "played_op_card";
				material_card.GetComponent.<Renderer>().material.color = Color(Random.Range(0.0,1.0), Random.Range(0.0,1.0), Random.Range(0.0,1.0));
				hand.Add(material_card);
				deck.RemoveAt(0);
			}
			else
			{
				//FATIGUE WILL GO HERE
			}
		}
		Arrange_Hand();
	}
	else
	{
		deck.RemoveAt(0);
	}
}

function Attack(cards: GameObject[])
{
	var attacker: GameObject = cards[0];
	var defender: GameObject = cards[1];
	var damage: int = cards[0].GetComponent("card").Get_Attack();
	//var defense: int = cards[1].GetComponent("card").Get_Defense();
	attacker.GetComponent("card").SendMessage("Set_Attacked", true);
	if(defender.gameObject.tag == "played_card")
	{
		defender.GetComponent("card").SendMessage("Take_Damage", damage);
	}
	else
	{
		defender.GetComponent("player").SendMessage("Take_Damage", damage);
	}
}

function Arrange_Play_Area()
{
	var play_count = in_play.Count;
	var start_x: float = (play_count - 1) * -2.5f;
	for(var i: int = 0; i < play_count; i++)
	{
		in_play[i].transform.position = Vector3(start_x, .5, 7);
		start_x += 5.0f;
	}
}

function Arrange_Hand()
{
	var hand_count = hand.Count;
	var start_x: float = (hand_count - 1) * -2.5f;
	for(var i: int = 0; i < hand_count; i++)
	{
		hand[i].transform.position = Vector3(start_x, .5, 20);
		start_x += 5.0f;
	}
}

function Mana_Subtraction(large: int[], small: int[]): int[]
{
	return [large[0] - small[0], large[1] - small[1], large[2] - small[2], large[3] - small[3]];
}

//The AI chooses what mana type to upgrade.
function Choose_Mana()
{
	//Generate a list of cards that cannot be played this turn.
	var unplayables: List.<GameObject> = new List.<GameObject>();
	var unused_mana: int[] = [current_mana[0], current_mana[1], current_mana[2], current_mana[3]];
	for(var i: int = 0; i < hand.Count; i++)
	{
		if(!Can_Play_Foreign_Mana(hand[i], unused_mana))
		{
			unplayables.Add(hand[i]);
		}
		else
		{
			unused_mana = Mana_Subtraction(unused_mana, hand[i].GetComponent("card").Get_Cost());
		}
	}
	//If there is a card that cannot be played.
	if(unplayables.Count > 0)
	{
		//Find the smallest mana cost card that cannot be played.
		var minimum_cost: GameObject = unplayables[0];
		for(var j: int = 1; j < unplayables.Count; j++)
		{
			if(unplayables[j].GetComponent("card").Get_Cost_Sum() < minimum_cost.GetComponent("card").Get_Cost_Sum())
			{
				minimum_cost = unplayables[j];
			}
		}
		//Gain a mana type towards playing it.
		var goal_mana: int[] = minimum_cost.GetComponent("card").Get_Cost();
		if(unused_mana[0] < goal_mana[0])
		{
			max_mana[0] = max_mana[0] + 1;
			current_mana[0] = current_mana[0] + 1;
		}
		else if(unused_mana[1] < goal_mana[1])
		{
			max_mana[1] = max_mana[1] + 1;
			current_mana[1] = current_mana[1] + 1;
		}
		else if(unused_mana[2] < goal_mana[2])
		{
			max_mana[2] = max_mana[2] + 1;
			current_mana[2] = current_mana[2] + 1;
		}
		else if(unused_mana[3] < goal_mana[3])
		{
			max_mana[3] = max_mana[3] + 1;
			current_mana[3] = current_mana[3] + 1;
		}
	}
	//If there is no card that cannot be played.
	else
	{
		//Find the smallest mana pool we have and increase it.
		var lowest_mana: int = max_mana[0];
		var lowest_type: int = 0;
		for(var k: int = 1; k < 4; k++)
		{
			if(max_mana[k] < lowest_mana)
			{
				lowest_type = k;
				lowest_mana = max_mana[k];
			}
		}
		max_mana[lowest_type] = max_mana[lowest_type] + 1;
		current_mana[lowest_type] = current_mana[lowest_type] + 1;
	}
	chosen_mana = true;
}

function Refresh_Mana()
{
	for(var i: int = 0; i < 4; i++)
	{
		current_mana[i] = max_mana[i];
	}
}

function Refresh_Creatures()
{
	for(var i: int = 0; i < in_play.Count; i++)
	{
		in_play[i].GetComponent("card").SendMessage("Set_Attacked", false);
	}
}

function Turn()
{
	Draw(1);
	Refresh_Mana();
	yield WaitForSeconds(.5);
	Choose_Mana();
	Refresh_Creatures();
	for(var k: int = 0; k < hand.Count; k++)
	{
		Play(hand[k]);
	}
	for(var l: int = 0; l < in_play.Count; l++)
	{
		if(!in_play[l].GetComponent("card").Get_Attacked())
		{
			var packet: GameObject[] = [in_play[l], GameObject.FindGameObjectWithTag("hand_area")];
			GameObject.FindGameObjectWithTag("MainCamera").GetComponent("cards").SendMessage("Attack", packet);
		}
	}
	yield WaitForSeconds(2);
	GameObject.FindGameObjectWithTag("MainCamera").GetComponent("cards").Turn();
}

function OnGUI()
{
	GUI.Box(new Rect(100, 200, 100, 35), current_mana[0] + "/" + max_mana[0] + " " + current_mana[1] + "/" + max_mana[1] + " " + current_mana[2] + "/" + max_mana[2] + " " + current_mana[3] + "/" + max_mana[3]);
}