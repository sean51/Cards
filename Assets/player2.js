import System.Collections.Generic;

public var card: GameObject;
//public var spell_card: GameObject;

public var hand: List.<GameObject>;
public var in_play: List.<GameObject>;
public var deck: List.<GameObject>;

public var max_mana: int[] = [0, 0, 0, 0];
public var current_mana: int[] = [0, 0, 0, 0];

private var chosen_mana: boolean = false;

function Start () 
{
	GameObject.FindGameObjectWithTag("game_master").GetComponent("game_master").Check_In_Player_2(gameObject);
	for(var i: int = 0; i < 30; i++)
	{
		deck.Add(card);
		//deck.Add(spell_card);
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
		play_card.tag = "played_card";
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

function Spend_Mana(required_mana: int[])
{
	for(var i: int = 0; i < 4; i++)
	{
		current_mana[i] -= required_mana[i];
	}
}

function Draw(amount: int)
{
	if(hand.Count < 10)
	{
		for(var i: int = 0; i < amount; i++)
		{
			if(deck.Count > 0)
			{
				var card_drawn = deck[0];
				var material_card: GameObject = Network.Instantiate(card_drawn, Vector3(0, 0, 0), Quaternion.identity, 0);
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

function Cast_Spell(cards: GameObject[])
{
	var attacker: GameObject = cards[0];
	var defender: GameObject = cards[1];
	if(Can_Play(attacker))
	{
		Spend_Mana(attacker.GetComponent("card").Get_Cost());
		var damage: int = cards[0].GetComponent("card").Get_Attack();
		if(defender.gameObject.tag == "played_op_card")
		{
			defender.GetComponent("card").SendMessage("Take_Damage", damage);
		}
		else
		{
			defender.GetComponent("player").SendMessage("Take_Damage", damage);
		}
		hand.Remove(attacker);
		Destroy(attacker);
	}
}

function Attack(cards: GameObject[])
{
	var attacker: GameObject = cards[0];
	var defender: GameObject = cards[1];
	var damage: int = cards[0].GetComponent("card").Get_Attack();
	//var defense: int = cards[1].GetComponent("card").Get_Defense();
	attacker.GetComponent("card").SendMessage("Set_Attacked", true);
	if(defender.gameObject.tag == "played_op_card")
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
		//hand[i].SendMessage("Move", Vector3(start_x, .5, 20));
		start_x += 5.0f;
	}
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
	chosen_mana = false;
	Draw(1);
	Refresh_Mana();
	Refresh_Creatures();
}

function OnGUI()
{
	if(GUI.Button(new Rect(Screen.width-200, Screen.height/2+100,100,50),"Turn"))
	{
		GameObject.FindGameObjectWithTag("op_hand_area").GetComponent("ai").Turn();
	}
	GUI.Box(new Rect(100, 500, 100, 35), current_mana[0] + "/" + max_mana[0] + " " + current_mana[1] + "/" + max_mana[1] + " " + current_mana[2] + "/" + max_mana[2] + " " + current_mana[3] + "/" + max_mana[3]);
	if(!chosen_mana)
	{
		if(GUI.Button(new Rect(100, 100, 100, 50),"Mana 1"))
		{
			max_mana[0] = max_mana[0] + 1;
			current_mana[0] = max_mana[0];
			chosen_mana = true;
		}
		else if(GUI.Button(new Rect(200, 100, 100, 50),"Mana 2"))
		{
			max_mana[1] = max_mana[1] + 1;
			current_mana[1] = max_mana[1];
			chosen_mana = true;
		}
		else if(GUI.Button(new Rect(300, 100, 100, 50),"Mana 3"))
		{
			max_mana[2] = max_mana[2] + 1;
			current_mana[2] = max_mana[2];
			chosen_mana = true;
		}
		else if(GUI.Button(new Rect(400, 100, 100, 50),"Mana 4"))
		{
			max_mana[3] = max_mana[3] + 1;
			current_mana[3] = max_mana[3];
			chosen_mana = true;
		}
	}
}