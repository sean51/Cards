public class Local_Hero extends Hero
{
	protected var other_player: GameObject;
	
	////////////////////////////////////////////////////////////////////////////////
	//HAND MANIPULATION FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	//Overwritten
	function Start()
	{
		super.Start();
		other_player = GameObject.FindGameObjectWithTag("computer");
	}
	
	//Overwritten.
	function Draw(amount: int)
	{
		if(hand.Count < 10)
		{
			for(var i: int = 0; i < amount; i++)
			{
				if(deck.Count > 0)
				{
					var card_drawn = deck[0];
					var material_card: GameObject = Instantiate(card_drawn, Vector3(-30 - (10 * i), CARD_HOVER_HEIGHT, 14), Quaternion.identity);
					AudioSource.PlayClipAtPoint(draw_sound, material_card.transform.position);
					//Why?
					if(material_card.tag == "op_card")
					{
						material_card.tag = "card";
					}
					material_card.GetComponent(Base_Card).SendMessage("Reveal");
					material_card.GetComponent(Base_Card).Set_Local();
					hand.Add(material_card);
					deck.RemoveAt(0);
					//yield WaitForSeconds(.5f);
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
	
	////////////////////////////////////////////////////////////////////////////////
	//CARD ARRANGE FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	//Overwritten.
	function Arrange_Play_Area()
	{
		var play_count = in_play.Count;
		var skip: boolean = false;
		if(skip_number <= play_count)
		{
			skip = true;
		}
		var start_x2: float = (play_count - 1) * -2.5f;
		if(skip)
		{
			start_x2 = (play_count) * -2.5f;
		}
		for(var i2: int = 0; i2 < play_count; i2++)
		{
			if(i2 == skip_number)
			{
				start_x2 += 5.0f;
			}
			in_play[i2].GetComponent(Base_Card).Local_Travel(Vector3(start_x2, CARD_HOVER_HEIGHT, 5));
			start_x2 += 5.0f;
		}
		Glow_Play_Area();
	}
	
	//Overwritten.
	function Arrange_Hand()
	{
		var hand_count = hand.Count;
		var start_x: float = (hand_count - 1) * -2.5f;
		for(var i: int = hand_count - 1; i >= 0; i--)
		{
			hand[i].GetComponent(Base_Card).Local_Travel(Vector3(start_x, CARD_HOVER_HEIGHT, 14));
			start_x += 5.0f;
			}
		Glow_Hand();
	}
	
	////////////////////////////////////////////////////////////////////////////////
	//ENERGY MANIPULATION FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	//Overwritten.
	function Spend_Mana(required_mana: int[])
	{
		for(var i: int = 0; i < 4; i++)
		{
			current_energy[i] -= required_mana[i];
		}
	}
	
	//Overwritten.
	function Gain_Mana(new_mana: int[])
	{
		for(var i: int = 0; i < 4; i++)
		{
			current_energy[i] += new_mana[i];
			max_energy[i] += new_mana[i];
		}
	}
	
	//Overwritten.
	function Refresh_Mana()
	{
		for(var i: int = 0; i < 4; i++)
		{
			current_energy[i] = max_energy[i];
		}
	}
	
	//Overwritten
	function Gain_Temp_Mana(new_mana: int[])
	{
		for(var i: int = 0; i < 4; i++)
		{
			current_energy[i] += new_mana[i];
		}
	}
	
	function Set_Op_Max_Energy(new_energy: int[])
	{
		for(var i: int = 0; i < 4; i++)
		{
			op_max_energy[i] = new_energy[i];
		}
	}
	
	function Set_Op_Current_Energy(new_energy: int[])
	{
		for(var i: int = 0; i < 4; i++)
		{
			op_current_energy[i] = new_energy[i];
		}
	}
	
	////////////////////////////////////////////////////////////////////////////////
	//UTILITY FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////
	
	//Removes the card from in_play and destroys it.
	function Card_Died(dead_card: GameObject)
	{
		in_play.Remove(dead_card);
		script = dead_card.GetComponent(Base_Card);
		if(script.Get_On_Death_Ability())
		{
			script.Activate_Ability(script.Get_Death_Abilities(), new List.<GameObject>());
		}
		Destroy(dead_card);
		Clean_Up();
		Arrange_Play_Area();
	}
	
	//Overwritten
	function Gain_Creature(new_creature: GameObject)
	{
		other_player.GetComponent(Hero).Lose_Creature(new_creature);
		new_creature.GetComponent(Base_Card).Change_Owner(gameObject);
		new_creature.tag = "played_card";
		in_play.Add(new_creature);
		Share_Information();
		Arrange_Play_Area();
	}
	
	////////////////////////////////////////////////////////////////////////////////
	//SHOW CARD FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	//Overwritten.
	function Show_Card(card: GameObject)
	{
		Destroy(card);
	}
	
	////////////////////////////////////////////////////////////////////////////////
	//PLAYING CARD FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////
	
	//Overwritten.
	function Play(play_card: GameObject)
	{
		if(Can_Play(play_card))
		{
			script = play_card.GetComponent(Base_Card);
			Spend_Mana(script.Get_Cost());
			script.Set_Owner(gameObject);
			play_card.tag = "played_card";
			hand.Remove(play_card);
			if(skip_number < in_play.Count)
			{
				in_play.Insert(skip_number, play_card);
			}
			else
			{
				in_play.Add(play_card);
			}
			skip_number = 10;
			Share_Information();
			AudioSource.PlayClipAtPoint(play_sound, play_card.transform.position);
			Arrange_Play_Area();
		}
		Arrange_Hand();
		Glow_Play_Area();
	}
	
	//A local way of keeping track of the opponets cards
	function Share_Information()
	{
		other_player.GetComponent(Hero).Set_Op_In_Play(in_play);
	}
	
	//Sets the op_in_play list to the received parameter
	function Set_Op_In_Play(new_list: List.<GameObject>)
	{
		op_in_play = new_list;
	}
}