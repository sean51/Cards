//For the use of Lists.
import System.Collections.Generic;

public class Hero extends MonoBehaviour
{
	//Lists for keeping track of cards.
	public var hand: List.<GameObject>;
	public var in_play: List.<GameObject>;
	public var deck: List.<GameObject>;
	public var op_in_play: List.<GameObject>;

	//Sounds
	public var draw_sound: AudioClip;
	public var play_sound: AudioClip;
	
	//Button Styles
	public var game_button_style: GUIStyle;
	public var energy_box_style: GUIStyle;
	
	//Arrays for keeping track of mana.
	protected var max_energy: int[] = [1, 1, 1, 1];
	protected var current_energy: int[] = [1, 1, 1, 1];
	protected var op_max_energy: int[] = [1, 1, 1, 1];
	protected var op_current_energy: int[] = [1, 1, 1, 1];

	//Booleans for keeping track of the state of the turn/game.
	private var wager_sent: boolean = false;
	protected var played_energy: boolean = false;
	protected var my_turn: boolean = false;
	protected var game_over: boolean = false;

	//Whether this is player1 or player2.
	protected var player_number: int = 1;

	//References to GameObjects for communication.
	protected var game_master: Game_Master;
	private var text: GUIText;

	//Formatting numbers.
	protected static var CARD_HOVER_HEIGHT: float = .1;
	protected var skip_number: int = 10;

	//For easy reference to scripts
	protected var script: Base_Card;
	
	//Rects and formatting for GUI
	private static var ENERGY_WIDTH: float = 150;
	private static var ENERGY_HEIGHT: float = 30;
	
	private static var ENERGY_START_X: float;
	private static var ENERGY_START_Y: float;
	private static var OP_ENERGY_START_Y: float;
	private var energy_box: Rect;
	private var op_energy_box: Rect;

	////////////////////////////////////////////////////////////////////////////////
	//UNITY FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	function Awake ()
	{
		ENERGY_START_X = Screen.width - ENERGY_WIDTH;
		ENERGY_START_Y = Screen.height - ENERGY_HEIGHT - (Screen.height / 5.5);
		OP_ENERGY_START_Y = (Screen.height / 5.5);
		energy_box = Rect(ENERGY_START_X, ENERGY_START_Y, ENERGY_WIDTH, ENERGY_HEIGHT);
		op_energy_box = Rect(ENERGY_START_X, OP_ENERGY_START_Y, ENERGY_WIDTH, ENERGY_HEIGHT);
	}
	
	//Finds the game_master and the text, creates the deck.
	function Start () 
	{
		game_master = GameObject.FindGameObjectWithTag("game_master").GetComponent(Game_Master);
		text = GameObject.FindGameObjectWithTag("text").GetComponent(GUIText);
		deck = GameObject.FindGameObjectWithTag("deck").GetComponent("networked_deck").Get_Shuffled_Deck();
		Draw(5);
		text.SendMessage("Local_Move", [0, 70]);
		text.SendMessage("Local_Message", "Wager Life To Go First.");
		text.SendMessage("Local_Show");
	}

	//Checks for the end of the game and if it is the players turn.
	function Update () 
	{
		if(game_master.Get_Game())
		{
			game_over = true;
			if(game_master.Get_Winner() == player_number)
			{
				text.SendMessage("Local_Message", "Victory!");
				text.SendMessage("Local_Show");
			}
			else
			{
				text.SendMessage("Local_Message", "Defeat!");
				text.SendMessage("Local_Show");
			}
		}
		else if(my_turn == false)
		{
			if(game_master.Get_Turn() == player_number)
			{
				my_turn = true;
				Turn();
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////
	//HAND MANIPULATION FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	//Adds an amount of cards to the players hand based on the parameter.
	function Draw(amount: int)
	{
		if(hand.Count < 10)
		{
			for(var i: int = 0; i < amount; i++)
			{
				if(deck.Count > 0)
				{
					var card_drawn = deck[0];
					var material_card: GameObject;
					if(GetComponent.<NetworkView>().isMine)
					{
						material_card = Network.Instantiate(card_drawn, Vector3(-30 - (10 * i), CARD_HOVER_HEIGHT, 14), Quaternion.identity, 0);
					}
					else
					{
						material_card = Network.Instantiate(card_drawn, Vector3(30 + (10 * i), CARD_HOVER_HEIGHT, -14), Quaternion.identity, 0);
					}
					AudioSource.PlayClipAtPoint(draw_sound, material_card.transform.position);
					Flip_Card(material_card);
					if(material_card.tag == "op_card")
					{
						material_card.tag = "card";
					}
					material_card.GetComponent(Base_Card).SendMessage("Reveal");
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
	//PLAYING CARD FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	//Returns if the card can be played.
	function Can_Play(checked_card: GameObject): boolean
	{
		script = checked_card.GetComponent(Base_Card);
		if(!my_turn && !script.Get_Play_Out_Of_Turn())
		{
			return false;
		}
		else if(checked_card.tag == "energy_card")
		{
			return !played_energy;
		}
		else if(in_play.Count >= 9)
		{
			var is_spell_card : Event_Card = checked_card.GetComponent(Event_Card);
			if(is_spell_card != null)
			{
				if(is_spell_card.Get_Added_Creature())
				{
					return false;
				}
			}
			else if(checked_card.tag == "card")
			{
				return false;
			}
		}
		var required_mana: int[] = script.Get_Cost();
		for(var i: int = 0; i < 4; i++)
		{
			if(required_mana[i] > current_energy[i])
			{
				return false;
			}
		}
		return true;
	}

	//Tries to play the card passed as the parameter.
	function Play(play_card: GameObject)
	{
		if(Can_Play(play_card))
		{
			script = play_card.GetComponent(Base_Card);
			Spend_Mana(script.Get_Cost());
			script.Set_Owner(gameObject);
			script.Play_Creature();
			play_card.tag = "played_card";
			script.SendMessage("Network_Reveal");
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
			var creature_update: NetworkViewID[] = new NetworkViewID[in_play.Count];
			for(var i: int = 0; i < in_play.Count; i++)
			{
				creature_update[i] = in_play[i].GetComponent.<NetworkView>().viewID;
			}
			GetComponent.<NetworkView>().RPC("Networked_Show_Creatures", RPCMode.Others, creature_update);
			AudioSource.PlayClipAtPoint(play_sound, play_card.transform.position);
			Arrange_Play_Area();
		}
		Arrange_Hand();
		Glow_Play_Area();
	}

	//Plays an energy card.
	function Cast_Energy(card: GameObject)
	{
		if(Can_Play(card))
		{
			Show_Card(card);
			played_energy = true;
			card.GetComponent(Base_Card).SendMessage("Set_Owner", gameObject);
			hand.Remove(card);
			Show_Card(card);
		}
		Arrange_Hand();
	}

	function Cast_Spell(cards: GameObject[])
	{
		var attacker: GameObject = cards[0];
		var defender: GameObject = cards[1];
		if(Can_Play(attacker))
		{
			script = attacker.GetComponent(Base_Card);
			Spend_Mana(script.Get_Cost());
			script.SendMessage("Set_Owner", gameObject);
			var packet: List.<GameObject> = new List.<GameObject>();
			packet.Add(defender);
			for(var creature: GameObject in op_in_play)
			{
				packet.Add(creature);
			}
			hand.Remove(attacker);
			Show_Card(attacker);
			script.SendMessage("Cast", packet);
		}
		Arrange_Hand();
	}

	//Plays an enchantment card.
	function Cast_Enchantment(cards: GameObject[])
	{
		var attacker: GameObject = cards[0];
		var defender: GameObject = cards[1];
		if(Can_Play(attacker))
		{
			script = attacker.GetComponent(Base_Card);
			Spend_Mana(script.Get_Cost());
			script.SendMessage("Set_Owner", gameObject);
			script.SendMessage("Activate", defender);
			hand.Remove(attacker);
			Show_Card(attacker);
		}
		Arrange_Hand();
	}

	////////////////////////////////////////////////////////////////////////////////
	//ENERGY MANIPULATION FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	//Subtracts the mana needed to play a card.
	function Spend_Mana(required_mana: int[])
	{
		for(var i: int = 0; i < 4; i++)
		{
			current_energy[i] -= required_mana[i];
		}
		GetComponent.<NetworkView>().RPC("Networked_Show_Energy", RPCMode.Others, current_energy, max_energy);
	}

	function Gain_Mana(new_mana: int[])
	{
		for(var i: int = 0; i < 4; i++)
		{
			current_energy[i] += new_mana[i];
			max_energy[i] += new_mana[i];
		}
		GetComponent.<NetworkView>().RPC("Networked_Show_Energy", RPCMode.Others, current_energy, max_energy);
	}

	//Return all the mana types to full.
	function Refresh_Mana()
	{
		for(var i: int = 0; i < 4; i++)
		{
			current_energy[i] = max_energy[i];
		}
		GetComponent.<NetworkView>().RPC("Networked_Show_Energy", RPCMode.Others, current_energy, max_energy);
	}

	function Gain_Temp_Mana(new_mana: int[])
	{
		for(var i: int = 0; i < 4; i++)
		{
			current_energy[i] += new_mana[i];
		}
		GetComponent.<NetworkView>().RPC("Networked_Show_Energy", RPCMode.Others, current_energy, max_energy);
	}

	////////////////////////////////////////////////////////////////////////////////
	//CREATURE FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	//Takes an attacker and defender and calculates the attack.
	function Attack(cards: GameObject[])
	{
		var attacker: GameObject = cards[0];
		var defender: GameObject = cards[1];
		if(defender.tag == "op_hand_area")
		{
			if(Check_For_Guardian())
			{
				text.SendMessage("Local_Temporary_Message", "You must attack the guardian first.");
			}
			else
			{
				attacker.SendMessage("Attack", defender);
			}
		}
		else
		{
			attacker.SendMessage("Attack", defender);
		}
		Glow_Play_Area();
	}

	//Tell all the cards in play that they can attack.
	function Refresh_Creatures()
	{
		for(var i: int = 0; i < in_play.Count; i++)
		{
			in_play[i].GetComponent(Base_Card).SendMessage("Set_Attacked", false);
		}
	}

	//Tell all the cards in play that they can attack.
	function Deactivate_Creatures()
	{
		for(var i: int = 0; i < in_play.Count; i++)
		{
			in_play[i].GetComponent(Base_Card).SendMessage("Set_Attacked", true);
		}
		Glow_Off();
	}

	function Get_Creatures(): List.<GameObject>
	{
		return in_play;
	}

	function Get_Enemy_Creatures(): List.<GameObject>
	{
		return op_in_play;
	}

	function Gain_Creature(new_creature: GameObject)
	{
		GetComponent.<NetworkView>().RPC("Networked_Lose_Creature", RPCMode.Others, new_creature.GetComponent.<NetworkView>().viewID);
		new_creature.GetComponent(Base_Card).Change_Owner(gameObject);
		new_creature.tag = "played_card";
		in_play.Add(new_creature);
		var creature_update: NetworkViewID[] = new NetworkViewID[in_play.Count];
		for(var i: int = 0; i < in_play.Count; i++)
		{
			creature_update[i] = in_play[i].GetComponent.<NetworkView>().viewID;
		}
		GetComponent.<NetworkView>().RPC("Networked_Show_Creatures", RPCMode.Others, creature_update);
		Arrange_Play_Area();
	}

	function Lose_Creature(old_creature: GameObject)
	{
		old_creature.GetComponent(Base_Card).Change_Owner(null);
		old_creature.tag = "played_op_card";
		in_play.Remove(old_creature);
		Arrange_Play_Area();
	}
	
	function Check_For_Guardian(): boolean
	{
		for(var enemy_creature: GameObject in op_in_play)
		{
			if(enemy_creature.GetComponent(Base_Card).Get_Guardian())
			{
				return true;
			}
		}
		return false;
	}

	////////////////////////////////////////////////////////////////////////////////
	//CARD ARRANGE FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	//Aligns the cards in the play area.
	function Arrange_Play_Area()
	{
		var play_count = in_play.Count;
		var skip: boolean = false;
		if(skip_number <= play_count)
		{
			skip = true;
		}
		if(!GetComponent.<NetworkView>().isMine)
		{
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
				in_play[i].GetComponent(Base_Card).Travel(Vector3(start_x, CARD_HOVER_HEIGHT, -5));
				start_x += 5.0f;
			}
		}
		else
		{
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
				in_play[i2].GetComponent(Base_Card).Travel(Vector3(start_x2, CARD_HOVER_HEIGHT, 5));
				start_x2 += 5.0f;
			}
		}
		Glow_Play_Area();
	}

	//Aligns the cards in hand.
	function Arrange_Hand()
	{
		if(!GetComponent.<NetworkView>().isMine)
		{
			var hand_count = hand.Count;
			var start_x: float = (hand_count - 1) * -2.5f;
			for(var i: int = 0; i < hand_count; i++)
			{
				hand[i].GetComponent(Base_Card).Travel(Vector3(start_x, CARD_HOVER_HEIGHT, -14));
				start_x += 5.0f;
			}
		}
		else
		{
			var hand_count2 = hand.Count;
			var start_x2: float = (hand_count2 - 1) * -2.5f;
			for(var i2: int = hand_count2 - 1; i2 >= 0; i2--)
			{
				hand[i2].GetComponent(Base_Card).Travel(Vector3(start_x2, CARD_HOVER_HEIGHT, 14));
				start_x2 += 5.0f;
			}
		}
		Glow_Hand();
	}

	//Takes in the position of the mouse on the x-axis
	//Determines where the card would go according to this position
	//Sets the skip_number to where the card would go
	//Arranges the area if this number has changed
	function Make_Space(x_pos: float)
	{
		var pos: int = 0;
		
		//Count how many cards the x_pos is past, saved as pos
		for(var i: int = 0; i < in_play.Count; i++)
		{
			if(x_pos > in_play[i].transform.position.x)
			{
				pos++;
			}
		}
		
		//If skip_number changes arrange the play area
		if(pos != skip_number)
		{
			skip_number = pos;
			Arrange_Play_Area();
		}
	}

	//skip_number is set out of bounds so it doesn't affect Arrange_Play_Area()
	function Reset_Skip()
	{
		skip_number = 10;
	}
	
	function Get_Insert_Position(): Vector3
	{
		var x_coord: float = (in_play.Count) * -2.5f + (skip_number * 5.0f);
		if(!GetComponent.<NetworkView>().isMine)
		{
			return new Vector3(x_coord, CARD_HOVER_HEIGHT, -5);
		}
		else
		{
			return new Vector3(x_coord, CARD_HOVER_HEIGHT, 5);
		}
	}

	////////////////////////////////////////////////////////////////////////////////
	//GLOW FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	//Glow the cards that can be played in hand.
	function Glow_Hand()
	{
		for(var i: int = 0; i < hand.Count; i++)
		{
			if(Can_Play(hand[i]))
			{
				hand[i].GetComponent(Base_Card).SendMessage("Glow", true);
			}
			else
			{
				hand[i].GetComponent(Base_Card).SendMessage("Glow", false);
			}
		}
	}

	//Turn all glowing off.
	function Glow_Off()
	{
		for(var i: int = 0; i < hand.Count; i++)
		{
			hand[i].GetComponent(Base_Card).SendMessage("Glow", false);
		}
		for(var j: int = 0; j < in_play.Count; j++)
		{
			in_play[j].GetComponent(Base_Card).SendMessage("Glow", false);
		}
	}

	//Glow all the cards that can attack.
	function Glow_Play_Area()
	{
		for(var i: int = 0; i < in_play.Count; i++)
		{
			script = in_play[i].GetComponent(Base_Card);
			if(script.Can_Attack())
			{
				script.SendMessage("Glow", true);
			}
			else
			{
				script.SendMessage("Glow", false);
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////
	//UTILITY FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	//The players turn, called at the beginning.
	function Turn()
	{
		//Clean_Up();
		//Arrange_Play_Area();
		played_energy = false;
		Draw(1);
		Refresh_Mana();
		Refresh_Creatures();
		yield WaitForSeconds(.1);
		Glow_Hand();
		Glow_Play_Area();
	}

	//If a creature was destroyed it will be removed here.
	function Clean_Up()
	{
		for(var i: int = in_play.Count - 1; i >= 0; i--)
		{
			if(in_play[i] == null)
			{
				in_play.RemoveAt(i);
			}
		}
	}

	//Removes the card from in_play and destroys it.
	function Card_Died(dead_card: GameObject)
	{
		in_play.Remove(dead_card);
		script = dead_card.GetComponent(Base_Card);
		if(script.Get_On_Death_Ability())
		{
			script.Activate_Ability(script.Get_Death_Abilities(), new List.<GameObject>());
		}
		if(in_play.Count == 0)
		{
			GetComponent.<NetworkView>().RPC("Networked_Show_Empty_Creatures", RPCMode.Others);
		}
		else
		{
			var creature_update: NetworkViewID[] = new NetworkViewID[in_play.Count];
			for(var i: int = 0; i < in_play.Count; i++)
			{
				creature_update[i] = in_play[i].GetComponent.<NetworkView>().viewID;
			}
			GetComponent.<NetworkView>().RPC("Networked_Show_Creatures", RPCMode.Others, creature_update);
		}
		Network.Destroy(dead_card);
		Clean_Up();
		Arrange_Play_Area();
	}

	//Sets the player, used for assigning the client player2.
	function Set_Player(player_id: int)
	{
		player_number = player_id;
	}

	//Orientates the card according to the player number so all cards are upright.
	function Flip_Card(card: GameObject)
	{
		if(player_number == 1)
		{
			card.GetComponent(Base_Card).Flip();
		}
		else
		{
			card.GetComponent(Base_Card).Network_Flip();
		}
	}

	////////////////////////////////////////////////////////////////////////////////
	//SHOW CARD FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	function Show_Card(card: GameObject)
	{
		card.GetComponent(Base_Card).SendMessage("Network_Reveal");
		for(var child: Transform in card.transform) 
		{
			if(child.name == "glow")
			{
				Destroy(child.gameObject);
			}
		}
		card.layer = LayerMask.NameToLayer("Ignore Raycast");
		card.tag = "preview_card";
		GetComponent.<NetworkView>().RPC("Networked_Show_Card", RPCMode.Others, card.GetComponent.<NetworkView>().viewID);
		Destroy(card);
	}

	////////////////////////////////////////////////////////////////////////////////
	//GRAPHICAL USER INTERFACE FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	//The graphical display.
	function OnGUI()
	{
		if(game_over)
		{
			if(GUI.Button(new Rect(Screen.width - (Screen.width / 10) - (Screen.width / 20), (Screen.height / 2) - (Screen.height / 20), Screen.width / 10, Screen.height / 10), "Ok", game_button_style))
			{
				Network.Disconnect();
				Application.LoadLevel("Main_Menu"); 
			}
			return;
		}
		else if(!wager_sent)
		{
			for(var i: int = 0; i < 5; i++)
			{
				if(GUI.Button(new Rect(((Screen.width / 8) * (i - 2)) + (Screen.width / 2) - (Screen.width / 20), (Screen.height / 2) - (Screen.height / 20), Screen.width / 10, Screen.height / 10), i + " Life", game_button_style))
				{
					game_master.SendMessage("Set_Wager", [player_number, i]);
					wager_sent = true;
					text.SendMessage("Local_Hide");
				}
			}
			return;
		}
		
		if(energy_box.Contains(Event.current.mousePosition))
		{
			GUI.Box(energy_box, max_energy[0] + "       " + max_energy[1] + "       " + max_energy[2] + "       " + max_energy[3], energy_box_style);
		}
		else
		{
			GUI.Box(energy_box, current_energy[0] + "       " + current_energy[1] + "       " + current_energy[2] + "       " + current_energy[3], energy_box_style);
		}
		
		if(op_energy_box.Contains(Event.current.mousePosition))
		{
			GUI.Box(op_energy_box, op_max_energy[0] + "       " + op_max_energy[1] + "       " + op_max_energy[2] + "       " + op_max_energy[3], energy_box_style);
		}
		else
		{
			GUI.Box(op_energy_box, op_current_energy[0] + "       " + op_current_energy[1] + "       " + op_current_energy[2] + "       " + op_current_energy[3], energy_box_style);
		}
		
		if(my_turn)
		{
			if(GUI.Button(new Rect(Screen.width - (Screen.width / 10) - (Screen.width / 20), (Screen.height / 2) - (Screen.height / 20), Screen.width / 10, Screen.height / 10), "Turn", game_button_style))
			{
				Deactivate_Creatures();
				game_master.End_Turn();
				my_turn = false;
				Glow_Off();
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////
	//NETWORKED FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	@RPC
	function Networked_Show_Card(view_id: NetworkViewID)
	{
		var view: NetworkView = NetworkView.Find(view_id);
		if(GetComponent.<NetworkView>().isMine)
		{
			view.gameObject.transform.position = Vector3 (-13, 10, 0);
		}
		else
		{
			view.gameObject.transform.position = Vector3 (13, 10, 0);
		}
		Destroy(view.gameObject, 2);
	}

	@RPC
	function Networked_Lose_Creature(view_id: NetworkViewID)
	{
		var view: NetworkView = NetworkView.Find(view_id);
		Lose_Creature(view.gameObject);
	}

	@RPC
	function Networked_Show_Energy(new_current_energy: int[], new_max_energy: int[])
	{
		op_max_energy = new_max_energy;
		op_current_energy = new_current_energy;
	}

	@RPC
	function Networked_Show_Creatures(creature_list: NetworkViewID[])
	{
		op_in_play = new List.<GameObject>();
		for(var creature: NetworkViewID in creature_list)
		{
			var view: NetworkView = NetworkView.Find(creature);
			op_in_play.Add(view.gameObject);
		}
	}

	@RPC
	function Networked_Show_Empty_Creatures()
	{
		op_in_play = new List.<GameObject>();
	}
}