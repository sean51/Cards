public class Computer extends Local_Hero
{
	private var target_hero: GameObject;
	
	private var playable_cards: List.<GameObject>;
	private var card_ranks: List.<int>;
	
	private enum computer_state {idle, draw, energy, play, attack, end};
	private var state: computer_state = computer_state.idle;
	
	////////////////////////////////////////////////////////////////////////////////
	//UNITY FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	//Overwritten.
	function Update () 
	{
		if(game_master.Get_Game())
		{
			game_over = true;
		}
		else if(my_turn == false)
		{
			if(game_master.Get_Turn() == player_number)
			{
				my_turn = true;
				state = computer_state.draw;
			}
		}
		else
		{
			Turn();
		}
	}
	
	//Overwritten.
	function Start () 
	{
		game_master = GameObject.FindGameObjectWithTag("game_master").GetComponent(Game_Master);
		//CREATION OF COMPUTER DECK
		var deck_object: GameObject = Instantiate(Resources.Load("deck"), Vector3(0, 0, 0), Quaternion.identity);
		deck_object.GetComponent("networked_deck").Create(["0,0,0,0,0,0,0,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,3,4,3,5,4,9,3,2,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0", "computer", ""]);
		deck = deck_object.GetComponent("networked_deck").Get_Shuffled_Deck();
		//deck = GameObject.FindGameObjectWithTag("deck").GetComponent("networked_deck").Get_Shuffled_Deck();
		
		target_hero = GameObject.FindGameObjectWithTag("hand_area");
		other_player = GameObject.FindGameObjectWithTag("player");
		Draw(5);
		game_master.SendMessage("Set_Wager", [2, 0]);
	}
	
	////////////////////////////////////////////////////////////////////////////////
	//HAND MANIPULATION FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

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
					var material_card: GameObject = Instantiate(card_drawn, Vector3(30 + (10 * i), CARD_HOVER_HEIGHT, -14), Quaternion.identity);
					//TAKE THIS OUT
					material_card.GetComponent(Base_Card).SendMessage("Reveal");
					//FOR TESTING ONLY
					hand.Add(material_card);
					material_card.GetComponent(Base_Card).Set_Local();
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
		var start_x: float = (play_count - 1) * -2.5f;
		if(skip)
		{
			start_x = (play_count) * -2.5f;
		}
		for(var i: int = 0; i < play_count; i++)
		{
			if(i == skip_number)
			{
				start_x += 5.0f;
			}
			in_play[i].GetComponent(Base_Card).Local_Travel(Vector3(start_x, CARD_HOVER_HEIGHT, -5));
			start_x += 5.0f;
		}
	}
	
	//Overwritten.
	function Arrange_Hand()
	{
		var hand_count = hand.Count;
		var start_x: float = (hand_count - 1) * -2.5f;
		for(var i: int = 0; i < hand_count; i++)
		{
			hand[i].GetComponent(Base_Card).Local_Travel(Vector3(start_x, CARD_HOVER_HEIGHT, -14));
			start_x += 5.0f;
		}
	}
	
	////////////////////////////////////////////////////////////////////////////////
	//GLOW FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	//Overwritten.
	function Glow_Hand()
	{/*I do not require glowing cards.*/}

	//Overwritten.
	function Glow_Off()
	{/*I do not require glowing cards.*/}

	//Overwritten.
	function Glow_Play_Area()
	{/*I do not require glowing cards.*/}
	
	////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////
	//
	//THE COMPUTERS TURN
	//
	////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////


	//MAYBE STATES SHOULD CHANGE IN THE LOCAL FUNCTIONS!!!
	//Overwritten.
	function Turn()
	{
		switch(state)
		{
			case computer_state.idle:
				break;
			case computer_state.draw:
				state = computer_state.idle;
				played_energy = false;
				Draw(1);
				Refresh_Mana();
				Refresh_Creatures();
				yield WaitForSeconds(2);
				state = computer_state.energy;
				break;
			case computer_state.energy:
				state = computer_state.idle;
				playable_cards = Energy_Phase();
				yield WaitForSeconds(1);
				state = computer_state.play;
				break;
			case computer_state.play:
				state = computer_state.idle;
				Play_Phase();
				break;
			case computer_state.attack:
				state = computer_state.idle;
				Assign_Attackers();
				break;
			case computer_state.end:
				state = computer_state.idle;
				yield WaitForSeconds(1);
				End_Turn();
				break;
		}
	}
	
	function Energy_Phase(): List.<GameObject>
	{
		var not_energy_cards: List.<GameObject> = new List.<GameObject>();
		for(var i: int = 0; i < hand.Count; i++)
		{
			if(hand[i].tag == "energy_card")
			{
				if(!played_energy)
				{
					if(Can_Play(hand[i]))
					{
						Cast_Energy(hand[i]);
					}
				}
			}
			else
			{
				not_energy_cards.Add(hand[i]);
			}
		}
		return not_energy_cards;
	}
	
	function Play_Phase()
	{
		yield WaitForSeconds(1.5);
		Rank_Cards();
		Play_Cards();
	}
	
	function Rank_Cards()
	{
		card_ranks = new List.<int>();
		
		for(var i: int = 0; i < hand.Count; i++)
		{
			var score: int = 0;
			var current_card: GameObject = hand[i];
			if(Can_Play(current_card))
			{
				if(current_card.tag == "op_card")
				{
					var attack_defense: int[] = current_card.GetComponent(Base_Card).Get_Stats();
					score += attack_defense[0];
					score += attack_defense[1];
				}
				else if(current_card.tag == "spell_card")
				{
					score = 5;
				}
				else if(current_card.tag == "energy_card")
				{
					score = 100;
				}
				else if(current_card.tag == "enchantment_card")
				{
					if(in_play.Count > 0)
					{
						score = 5;
					}
				}
			}
			card_ranks.Add(score);
		}
	}
	
	function Play_Cards()
	{
		//Finding the best card to play
		var max_value: int = 0;
		var best_option: int = 0;
		for(var max_tester: int = 0; max_tester < card_ranks.Count; max_tester++)
		{
			if(card_ranks[max_tester] > max_value)
			{
				best_option = max_tester;
				max_value = card_ranks[max_tester];
			}
		}
		//If a card was found activate it.
		if(max_value > 0)
		{
			var current_card: GameObject = hand[best_option];
			//Debug.Log(current_card.GetComponent(Base_Card).About());
			if(current_card.tag == "op_card")
			{
				Play(current_card);
			}
			else if(current_card.tag == "spell_card")
			{
				var targeting_system: int = current_card.GetComponent(Base_Card).Get_Targeting_System();
				switch(targeting_system)
				{
					case 1:
						//targets any creature
						break;
					case 2:
						//targets_enemy_creatures
						break;
					case 3:
						//targets_friendly_creatures
						break;
					case 4:
						Cast_Spell([current_card, target_hero]);
						break;
					case 5:
						Cast_Spell([current_card, target_hero]);
						break;
					case 6:
						Cast_Spell([current_card, target_hero]);
						break;
					case 7:
						Cast_Spell([current_card, target_hero]);
						break;
					case 0:
						Cast_Spell([current_card, gameObject]);
						break;
				}
			}
			else if(current_card.tag == "energy_card")
			{
				Cast_Energy(current_card);
			}
			else if(current_card.tag == "enchantment_card")
			{
				Cast_Enchantment([current_card, in_play[0]]);
			}
			else
			{
				Debug.Log("I don't know what this card is: Card #" + best_option);
			}
			Play_Phase();
		}
		else
		{
			state = computer_state.attack;
			return;
		}
	}
	
	function Assign_Attackers()
	{
		for(var i: int = 0; i < in_play.Count; i++)
		{
			var defenders: List.<GameObject> = other_player.GetComponent(Hero).Get_Creatures();
			if(in_play[i].GetComponent(Base_Card).Can_Attack())
			{
				var scores: int[] = new int[defenders.Count];
				for(var enemy_number: int = 0; enemy_number < defenders.Count; enemy_number++)
				{
					var enemy_stats: int[] = defenders[enemy_number].GetComponent(Base_Card).Get_Stats();
					var my_stats: int[] = in_play[i].GetComponent(Base_Card).Get_Stats();
					var enemy_melee: boolean = defenders[enemy_number].GetComponent(Base_Card).Get_Melee();
					var my_melee: boolean = in_play[i].GetComponent(Base_Card).Get_Melee();
					scores[enemy_number] = Rank_Attack(enemy_stats, my_stats, enemy_melee, my_melee);
				}
				var max_score: int = 0;
				var max_index: int = -1;
				for(var j: int = 0; j < scores.Length; j++)
				{
					if(scores[j] > max_score)
					{
						max_score = scores[j];
						max_index = j;
					}
				}
				if(max_index > -1)
				{
					Attack([in_play[i], defenders[max_index]]);
				}
				else
				{
					Attack([in_play[i], target_hero]);
				}
				yield WaitForSeconds(1);
			}
		}
		yield WaitForSeconds(1);
		state = computer_state.end;
	}
	
	function Rank_Attack(enemy: int[], friendly: int[], enemy_melee: boolean, friendly_melee: boolean): int
	{
		var score: int = 0;
		var my_death: boolean = false;
		var your_death: boolean = false;
		
		//My attack is greater than your defense
		if(friendly[0] >= enemy[1])
		{
			your_death = true;
		}
		
		//Your attack is greater than my defense
		if(enemy[0] >= friendly[1])
		{
			my_death = true;
		}
		
		//Checking for ranged kills
		if(my_death && your_death)
		{
			if(enemy_melee && !friendly_melee)
			{
				my_death = false;
			}
			else if(!enemy_melee && friendly_melee)
			{
				your_death = false;
			}
		}
		
		//You will die, I will not!
		if(your_death && !my_death)
		{
			score = enemy[1] + enemy[0];
		}
		//It is a suicide mission
		else if(my_death && !your_death)
		{
			//COMPLICATED
			score = 0;
		}
		//Mutual death agreement
		else if(my_death && your_death)
		{
			score = enemy[1] - friendly[1] + enemy[0] - friendly[0];
		}
		//Everyone lives today
		else
		{
			score = enemy[1] - friendly[1] + enemy[0] - friendly[0];
		}
		return score;
	}
	
	function End_Turn()
	{
		Deactivate_Creatures();
		game_master.End_Turn();
		my_turn = false;
	}
	
	////////////////////////////////////////////////////////////////////////////////
	//ENERGY MANIPULATION FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	//Overwritten.
	function Spend_Mana(required_mana: int[])
	{
		super(required_mana);
		other_player.GetComponent(Hero).SendMessage("Set_Op_Current_Energy", current_energy);
	}
	
	//Overwritten.
	function Gain_Mana(new_mana: int[])
	{
		super(new_mana);
		other_player.GetComponent(Hero).SendMessage("Set_Op_Max_Energy", max_energy);
		other_player.GetComponent(Hero).SendMessage("Set_Op_Current_Energy", current_energy);
	}
	
	//Overwritten.
	function Refresh_Mana()
	{
		super();
		other_player.GetComponent(Hero).SendMessage("Set_Op_Current_Energy", current_energy);
	}
	
	//Overwritten
	function Gain_Temp_Mana(new_mana: int[])
	{
		super(new_mana);
		other_player.GetComponent(Hero).SendMessage("Set_Op_Current_Energy", current_energy);
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
			play_card.tag = "played_op_card";
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
		else
		{
			Debug.Log("I cant play that.");
		}
		Arrange_Hand();
	}
	
	////////////////////////////////////////////////////////////////////////////////
	//SHOW CARD FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	//Overwritten.
	function Show_Card(card: GameObject)
	{
		for(var child: Transform in card.transform) 
		{
			if(child.name == "glow")
			{
				Destroy(child.gameObject);
			}
		}
		card.layer = LayerMask.NameToLayer("Ignore Raycast");
		card.tag = "preview_card";
		card.transform.position = Vector3 (-13, 10, 0);		
		Destroy(card, 2);
	}
	
	function Lose_Creature(old_creature: GameObject)
	{
		in_play.Remove(old_creature);
		Share_Information();
		Arrange_Play_Area();
	}
	
	////////////////////////////////////////////////////////////////////////////////
	//GRAPHICAL USER INTERFACE FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	//Overwritten.
	function OnGUI()
	{/*I don't need this, I am a computer.*/}
}