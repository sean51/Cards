//Button Styles
public var play_button_style: GUIStyle;
public var editor_button_style: GUIStyle;
public var logout_button_style: GUIStyle;
public var quit_button_style: GUIStyle;
public var deck1_button_style: GUIStyle;
public var deck2_button_style: GUIStyle;
public var back_button_style: GUIStyle;

private var deck1: GameObject;
private var deck2: GameObject;

//Menu states
private var play: boolean = false;
private var edit_deck_selection: boolean = false;
private var edit_deck: boolean = false;

public var selected_deck: GameObject;
public var restore_deck: String[];

private var index: int = 0;
private var owned_card_index: int = 0;

//Deck editing variables
private var selected_deck_overview: Dictionary.<String, int> = new Dictionary.<String, int>();
private static var CARDS_TO_DISPLAY: int = 9;
private static var MAX_CARDS: int = 60;
private var owned_cards: List.<GameObject>;

private var displayed_cards: List.<GameObject> = new List.<GameObject>();
private var displayed_owned_cards: List.<GameObject> = new List.<GameObject>();

//GUI static positions.
private static var DECK_EDITOR_HEIGHT: float = Screen.height/2; //50
private static var STARTING_HEIGHT: float = Screen.height/20;
private static var SMALL_ITEM_HEIGHT: float = Screen.height/5; //2 = 40
private static var PLAY_HEIGHT: float = Screen.height/1.1111111111111; //100 = 90x
private static var STARTING_WIDTH: float = Screen.width/22;
private static var STARTING_WIDTH_2: float = Screen.width/2;
private static var ITEM_WIDTH: float = Screen.width/2.2;

private static var EDITOR_ITEM_HEIGHT: float = Screen.height/8;
private static var EDITOR_ITEM_SMALL_WIDTH: float = Screen.width/6;
private static var EDITOR_ITEM_LARGE_WIDTH: float = Screen.width/4;

function Start () 
{
	deck1 = GameObject.FindGameObjectWithTag("deck_1");
	deck2 = GameObject.FindGameObjectWithTag("deck_2");
	
	//Not really...
	owned_cards = deck1.GetComponent("networked_deck").Get_All_Cards();
	//^ Owning all cards
	
	Destroy(GameObject.FindGameObjectWithTag("deck"));
}

function OnGUI()
{
	////////////////////////////////////////////////////////////////////////////////////////////////////
	//
	//
	// ONLINE OR LOCAL GAME MENU
	//
	//
	////////////////////////////////////////////////////////////////////////////////////////////////////
	if(play)
	{
		if (GUI.Button (new Rect (STARTING_WIDTH, STARTING_HEIGHT, ITEM_WIDTH, DECK_EDITOR_HEIGHT), "Online Game")) 
		{
			var play_deck1: GameObject = Instantiate(selected_deck, Vector3(0, 0, 0), Quaternion.identity);
			selected_deck.tag = "deck";
			GameObject.DontDestroyOnLoad(play_deck1);
			Application.LoadLevel("Match_Making"); 
		}
		if (GUI.Button (new Rect (STARTING_WIDTH + ITEM_WIDTH, STARTING_HEIGHT, ITEM_WIDTH, DECK_EDITOR_HEIGHT), "Local Game")) 
		{
			var play_deck2: GameObject = Instantiate(selected_deck, Vector3(0, 0, 0), Quaternion.identity);
			selected_deck.tag = "deck";
			GameObject.DontDestroyOnLoad(play_deck2);
			Application.LoadLevel("Local_Game");
		}
		if (GUI.Button (new Rect (STARTING_WIDTH, STARTING_HEIGHT + DECK_EDITOR_HEIGHT, ITEM_WIDTH, SMALL_ITEM_HEIGHT), "Back", back_button_style))
		{
			play = false;
		}
		if (GUI.Button(new Rect(STARTING_WIDTH + ITEM_WIDTH, STARTING_HEIGHT + DECK_EDITOR_HEIGHT, ITEM_WIDTH/2, SMALL_ITEM_HEIGHT), "Deck 1"))
		{
			selected_deck = deck1;
		}
		if (GUI.Button(new Rect(STARTING_WIDTH + ITEM_WIDTH + ITEM_WIDTH/2, STARTING_HEIGHT + DECK_EDITOR_HEIGHT, ITEM_WIDTH/2, SMALL_ITEM_HEIGHT), "Deck 2"))
		{
			selected_deck = deck2;
		}
	}
	////////////////////////////////////////////////////////////////////////////////////////////////////
	//
	//
	// DECK EDITOR
	//
	//
	////////////////////////////////////////////////////////////////////////////////////////////////////
	else if(edit_deck)
	{
		/*
		var spacing: int = 0;
		for(var item : KeyValuePair.<String, int> in selected_deck_overview)
		{
			//Debug.Log(item.Key);
			GUI.Box(new Rect(Screen.width/1.5, 20 * spacing, 200, 20), item.Key + "    " + item.Value);
			spacing++;
		}
		*/
		GUI.Box(new Rect (Screen.width / 4 - 75f, Screen.height / 3.3, 150f, 30f), "Card Count: " + selected_deck.GetComponent("networked_deck").Size());
		if(index + CARDS_TO_DISPLAY < MAX_CARDS)
		{
			if(GUI.Button (new Rect (Screen.width / 4, Screen.height / 2.9, 150f, 30f), ">"))
			{
				index += CARDS_TO_DISPLAY;
				Destroy_Display_Cards();
				Display_Cards();
			}
		}
		if(index != 0)
		{
			if(GUI.Button (new Rect (Screen.width / 4 - 150f, Screen.height / 2.9, 150f, 30f), "<"))
			{
				index -= CARDS_TO_DISPLAY;
				Destroy_Display_Cards();
				Display_Cards();
			}
		}
		if(owned_card_index + CARDS_TO_DISPLAY < owned_cards.Count)
		{
			if(GUI.Button (new Rect (Screen.width / 1.33, Screen.height / 2.9, 150f, 30f), ">"))
			{
				owned_card_index += CARDS_TO_DISPLAY;
				Destroy_Owned_Display_Cards();
				Display_Owned_Cards();
			}
		}
		if(owned_card_index != 0)
		{
			if(GUI.Button (new Rect (Screen.width / 1.33 - 150f, Screen.height / 2.9, 150f, 30f), "<"))
			{
				owned_card_index -= CARDS_TO_DISPLAY;
				Destroy_Owned_Display_Cards();
				Display_Owned_Cards();
			}
		}
		var current_x: float = 0;
		if(GUI.Button (new Rect (current_x, 0, EDITOR_ITEM_SMALL_WIDTH, EDITOR_ITEM_HEIGHT), "Save"))
		{
			selected_deck.GetComponent("networked_deck").Export();
			Destroy_Display_Cards();
			Destroy_Owned_Display_Cards();
			edit_deck = false;
		}
		current_x += EDITOR_ITEM_SMALL_WIDTH;
		if(GUI.Button (new Rect (current_x, 0, EDITOR_ITEM_SMALL_WIDTH, EDITOR_ITEM_HEIGHT), "Cancel"))
		{
			Destroy_Display_Cards();
			Destroy_Owned_Display_Cards();
			selected_deck.GetComponent("networked_deck").Create(restore_deck);
			edit_deck = false;
		}
		current_x += EDITOR_ITEM_SMALL_WIDTH;
		if(GUI.Button (new Rect (current_x, 0, EDITOR_ITEM_SMALL_WIDTH, EDITOR_ITEM_HEIGHT), "Clear"))
		{
			selected_deck.GetComponent("networked_deck").Clear();
			Refresh_Deck_Builder_View();
		}
		current_x += EDITOR_ITEM_SMALL_WIDTH;
		if(GUI.Button (new Rect (current_x, 0, EDITOR_ITEM_LARGE_WIDTH, EDITOR_ITEM_HEIGHT), "Overview"))
		{
			//FILL THIS IN
		}
		current_x += EDITOR_ITEM_LARGE_WIDTH;
		if(GUI.Button (new Rect (current_x, 0, EDITOR_ITEM_LARGE_WIDTH, EDITOR_ITEM_HEIGHT), "Hero Equipment"))
		{
			//FILL THIS IN
		}
		for(var card_index: int = 0; card_index < displayed_cards.Count; card_index++)
		{
			GUI.Box(new Rect((Screen.width / 8) * ((card_index % 3) + 1), (Screen.height / 5) *( (card_index / 3) + 2.8), 20, 20), "" + selected_deck.GetComponent("networked_deck").Get_Unique_Counts()[card_index + index]);
		}
		
	}
	////////////////////////////////////////////////////////////////////////////////////////////////////
	//
	//
	// DECK CHOICE FOR DECK EDITOR
	//
	//
	////////////////////////////////////////////////////////////////////////////////////////////////////
	else if(edit_deck_selection)
	{
		if (GUI.Button (new Rect (STARTING_WIDTH, STARTING_HEIGHT, ITEM_WIDTH, DECK_EDITOR_HEIGHT), "Deck 1", deck1_button_style)) 
		{
			restore_deck = deck1.GetComponent("networked_deck").Backup();
			selected_deck = deck1;
			index = 0;
			owned_card_index = 0;
			Refresh_Deck_Builder_View();
			edit_deck = true;
		}
		if(GUI.Button (new Rect (STARTING_WIDTH_2, STARTING_HEIGHT, ITEM_WIDTH, DECK_EDITOR_HEIGHT), "Deck 2", deck2_button_style))
		{
			restore_deck = deck2.GetComponent("networked_deck").Backup();
			selected_deck = deck2;
			index = 0;
			owned_card_index = 0;
			Refresh_Deck_Builder_View();
			edit_deck = true;
		}
		if(GUI.Button (new Rect (STARTING_WIDTH, STARTING_HEIGHT + DECK_EDITOR_HEIGHT, ITEM_WIDTH, SMALL_ITEM_HEIGHT), "Back", back_button_style))
		{
			edit_deck_selection = false;
		}
	}
	////////////////////////////////////////////////////////////////////////////////////////////////////
	//
	//
	// HOME
	//
	//
	////////////////////////////////////////////////////////////////////////////////////////////////////
	else
	{
		if (GUI.Button (new Rect (STARTING_WIDTH, STARTING_HEIGHT, ITEM_WIDTH, PLAY_HEIGHT), "Play", play_button_style)) 
		{
			selected_deck = deck1;
			play = true; 
		}
		if (GUI.Button (new Rect (STARTING_WIDTH_2, STARTING_HEIGHT, ITEM_WIDTH, DECK_EDITOR_HEIGHT), "Deck Editor", editor_button_style)) 
		{
			edit_deck_selection = true; 
		}
		if(GUI.Button (new Rect (STARTING_WIDTH_2, STARTING_HEIGHT + DECK_EDITOR_HEIGHT, ITEM_WIDTH, SMALL_ITEM_HEIGHT), "Log Out", logout_button_style))
		{
			Destroy(deck1);
			Destroy(deck2);
			Application.LoadLevel("Login"); 
		}
		if(GUI.Button (new Rect (STARTING_WIDTH_2, STARTING_HEIGHT + DECK_EDITOR_HEIGHT + SMALL_ITEM_HEIGHT, ITEM_WIDTH, SMALL_ITEM_HEIGHT), "Quit", quit_button_style))
		{
			Application.Quit();
		}
	}
}

function Get_Cards(deck: List.<GameObject>, start_point: int): List.<GameObject>
{
	var return_list: List.<GameObject> = new List.<GameObject>();
	for(var i: int = start_point; i < start_point + CARDS_TO_DISPLAY && i < deck.Count; i++)
	{
		return_list.Add(deck[i]);
	}
	return return_list;
}

function Get_Overview(deck: List.<GameObject>): Dictionary.<String, int>
{
	var return_overview: Dictionary.<String, int> = new Dictionary.<String, int>();
	for(var i: int = 0; i < deck.Count; i++)
	{
		if(return_overview.ContainsKey(deck[i].name))
		{
			return_overview[deck[i].name] = return_overview[deck[i].name] + 1;
		}
		else
		{
			return_overview[deck[i].name] = 1;
		}
	}
	return return_overview;
}

function Destroy_Display_Cards()
{
	for(var i: int = displayed_cards.Count - 1; i >= 0; i--)
	{
		Destroy(displayed_cards[i]);
		displayed_cards.RemoveAt(i);
	}
}

function Destroy_Owned_Display_Cards()
{
	for(var j: int = displayed_owned_cards.Count - 1; j >= 0; j--)
	{
		Destroy(displayed_owned_cards[j]);
		displayed_owned_cards.RemoveAt(j);
	}
}

function Refresh_Deck_Builder_View()
{
	selected_deck_overview = Get_Overview(selected_deck.GetComponent("networked_deck").Get_Deck());
	Destroy_Owned_Display_Cards();
	Destroy_Display_Cards();
	Display_Cards();
	Display_Owned_Cards();
}

/*
function Add_Card_To_Deck(card: GameObject)
{
	selected_deck.GetComponent("networked_deck").Add_Card(owned_cards[displayed_owned_cards.IndexOf(card) + owned_card_index]);
	if(displayed_cards.Count < CARDS_TO_DISPLAY)
	{
		var new_card: GameObject = Instantiate(card, card.transform.position, Quaternion.identity);
		new_card.GetComponent(Base_Card).SendMessage("Local_Travel", Vector3(16 - (5 * (displayed_cards.Count % 3)), .1, -11 + (7 * (displayed_cards.Count / 3))));
		new_card.tag = "deck_card";
		displayed_cards.Add(new_card);
	}
	selected_deck_overview = Get_Overview(selected_deck.GetComponent("networked_deck").Get_Deck());
}
*/

function Add_Card_To_Deck(card: GameObject)
{
	selected_deck.GetComponent("networked_deck").Add_Card(owned_cards[displayed_owned_cards.IndexOf(card) + owned_card_index]);
	if(selected_deck.GetComponent("networked_deck").Last_Copy(owned_cards[displayed_owned_cards.IndexOf(card) + owned_card_index]))
	{
		if(displayed_cards.Count < CARDS_TO_DISPLAY)
		{
			var new_card: GameObject = Instantiate(card, card.transform.position, Quaternion.identity);
			new_card.GetComponent(Base_Card).SendMessage("Local_Travel", Vector3(16 - (5 * (displayed_cards.Count % 3)), .1, -11 + (7 * (displayed_cards.Count / 3))));
			new_card.tag = "deck_card";
			displayed_cards.Add(new_card);
		}
	}
	//selected_deck_overview = Get_Overview(selected_deck.GetComponent("networked_deck").Get_Deck());
}


/*
function Remove_Card_From_Deck(card: GameObject)
{
	var card_index: int = displayed_cards.IndexOf(card);
	for(var i: int = card_index + 1; i < displayed_cards.Count; i++)
	{
		if(i % 3 == 0)
		{
				displayed_cards[i].GetComponent(Base_Card).SendMessage("Local_Travel", displayed_cards[i].GetComponent(Base_Card).Get_Final_Destination() - Vector3(10, 0, 7));
		}
		else
		{
			displayed_cards[i].GetComponent(Base_Card).SendMessage("Local_Travel", displayed_cards[i].GetComponent(Base_Card).Get_Final_Destination() + Vector3(5, 0, 0));
		}
	}
	selected_deck.GetComponent("networked_deck").Remove_Card(card_index + index);
	select_deck_cards = selected_deck.GetComponent("networked_deck").Get_Deck();
	displayed_cards.Remove(card);
	if(selected_deck.GetComponent("networked_deck").Size() >= (index + CARDS_TO_DISPLAY))
	{
		var new_card: GameObject = Instantiate(selected_deck.GetComponent("networked_deck").Get_Deck()[index + CARDS_TO_DISPLAY - 1], Vector3(6, .1, 3), Quaternion.identity);
		new_card.GetComponent(Base_Card).SendMessage("Reveal");
		new_card.tag = "deck_card";
		displayed_cards.Add(new_card);
	}
	Destroy(card);
	selected_deck_overview = Get_Overview(selected_deck.GetComponent("networked_deck").Get_Deck());
}
*/

function Remove_Card_From_Deck(card: GameObject)
{
	var card_index: int = displayed_cards.IndexOf(card);
	if(selected_deck.GetComponent("networked_deck").Last_Copy(selected_deck.GetComponent("networked_deck").Get_Uniques()[card_index + index]))
	{
		for(var i: int = card_index + 1; i < displayed_cards.Count; i++)
		{
			if(i % 3 == 0)
			{
					displayed_cards[i].GetComponent(Base_Card).SendMessage("Local_Travel", displayed_cards[i].GetComponent(Base_Card).Get_Final_Destination() - Vector3(10, 0, 7));
			}
			else
			{
				displayed_cards[i].GetComponent(Base_Card).SendMessage("Local_Travel", displayed_cards[i].GetComponent(Base_Card).Get_Final_Destination() + Vector3(5, 0, 0));
			}
		}
		displayed_cards.Remove(card);
		if(selected_deck.GetComponent("networked_deck").Uniques_Size() > (index + CARDS_TO_DISPLAY))
		{
			var new_card: GameObject = Instantiate(selected_deck.GetComponent("networked_deck").Get_Uniques()[index + CARDS_TO_DISPLAY], Vector3(6, .1, 3), Quaternion.identity);
			new_card.GetComponent(Base_Card).SendMessage("Reveal");
			new_card.tag = "deck_card";
			displayed_cards.Add(new_card);
		}
		Destroy(card);
	}
	selected_deck.GetComponent("networked_deck").Remove_Card(selected_deck.GetComponent("networked_deck").Get_Uniques()[card_index + index]);
	
	//selected_deck_overview = Get_Overview(selected_deck.GetComponent("networked_deck").Get_Deck());
}

function Display_Cards()
{
	//var cards : List.<GameObject> = Get_Cards(selected_deck.GetComponent("networked_deck").Get_Deck(), index);
	var cards : List.<GameObject> = Get_Cards(selected_deck.GetComponent("networked_deck").Get_Uniques(), index);

	var line_number: int = 3;
	var x: float = 16;
	var y: float = .1;
	var z: float = -11;
	for(var i: int = 0; i < cards.Count; i++)
	{
		var new_card: GameObject = Instantiate(cards[i], Vector3(x, y, z), Quaternion.identity);
		new_card.GetComponent(Base_Card).SendMessage("Reveal");
		new_card.tag = "deck_card";
		displayed_cards.Add(new_card);
		x -= 5;
		if(i % line_number == 2)
		{
			x = 16;
			z += 7;
		}
	}
}

function Display_Owned_Cards()
{
	var cards : List.<GameObject> = Get_Cards(owned_cards, owned_card_index);
	var line_number: int = 3;
	var x: float = -6;
	var y: float = .1;
	var z: float = -11;
	for(var i: int = 0; i < cards.Count; i++)
	{
		var new_card: GameObject = Instantiate(cards[i], Vector3(x, y, z), Quaternion.identity);
		new_card.GetComponent(Base_Card).SendMessage("Reveal");
		new_card.tag = "owned_card";
		displayed_owned_cards.Add(new_card);
		x -= 5;
		if(i % line_number == 2)
		{
			x = -6;
			z += 7;
		}
	}
}