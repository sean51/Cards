//For the use of Lists.
import System.Collections.Generic;

//List of all cards currently in the game.
public var all_cards: List.<GameObject>;

//List of the cards currently in this deck.
public var deck: List.<GameObject> = new List.<GameObject>();

//An array containing the username and password.
public var owner_details: String[];

public var unique_cards: List.<GameObject> = new List.<GameObject>();
public var unique_counts: List.<int> = new List.<int>();

function Start () 
{

}

function Update () 
{
	
}

//Takes in the list of cards as comma separated indexes, the username, and password as an array
function Create(packet: String[])
{
	deck.Clear();
	unique_cards.Clear();
	unique_counts.Clear();
	var card_list: String = packet[0];
	owner_details = [packet[1], packet[2]];
	var card_list_array: String[] = card_list.Split(","[0]);
	for(var i: int = 0; i < card_list_array.length; i++)
	{
		var x: int = int.Parse(card_list_array[i]);
		if(x > 0)
		{
			for(var j: int = 0; j < x; j++)
			{
				Add_Card(all_cards[i]);
			}
		}
	}
}

//Writes the deck back out to the MySql database.
function Export()
{
	if(owner_details[0] == "anonymous")
	{
		return;
	}
	var returnable: String = Deck_To_String();
	var URL: String = "http://www.weapondb.com/tcg/save_deck.php";
	if(gameObject.tag == "deck_1")
	{
		URL += "?deck=1";
	}
	else if(gameObject.tag == "deck_2")
	{
		URL += "?deck=2";
	}
	URL += "&username=" + owner_details[0] + "&password=" + owner_details[1] + "&new_deck=" + returnable;
	var saveWriter: WWW = new WWW (URL);
	yield saveWriter; 
	if (saveWriter.error != null) 
	{
		Debug.Log("Error connecting to database server.");
	}
	else
	{
		Debug.Log("Deck has been saved.");
	}
}

function Deck_To_String(): String
{
	var card_list_array: int[] = new int[200];
	for(var i: int = 0; i < deck.Count; i++)
	{
		card_list_array[all_cards.IndexOf(deck[i])]++;
	}
	var returnable: String = "" + card_list_array[0];
	for(var j: int = 1; j < card_list_array.Length; j++)
	{
		returnable += "," + card_list_array[j];
	}
	return returnable;
}

//Randomizes the order of the cards using the Fischer method.
function Shuffle()
{
	for(var i: int = 0; i < deck.Count; i++)
	{
		var temp: GameObject = deck[i];
		var random_index: int = Random.Range(i, deck.Count);
		deck[i] = deck[random_index];
		deck[random_index] = temp;
	}
}

//Splits the deck into 4 sections with equal amounts of energy.
function Fair_Shuffle()
{
	var energy_index: int = 0;
	var other_index: int = 0;
	var sections: List.<GameObject>[] = [new List.<GameObject>(), new List.<GameObject>(), new List.<GameObject>(), new List.<GameObject>()];
	
	Shuffle();
	for(var j: int = 0; j < deck.Count; j++)
	{
		if(deck[j].tag == "energy_card")
		{
			sections[energy_index].Add(deck[j]);
			energy_index = (energy_index + 1) % sections.Length;
		}
		else
		{
			sections[other_index].Add(deck[j]);
			other_index = (other_index + 1) % sections.Length;
		}
	}
	deck.Clear();
	for(var k: int = 0; k < sections.Length; k++)
	{
		for(var l: int = 0; l < sections[k].Count; l++)
		{
			deck.Add(sections[k][l]);
		}
	}
}

//Returns the list of cards in the deck.
function Get_Deck(): List.<GameObject>
{
	return deck;
}

function Get_Shuffled_Deck(): List.<GameObject>
{
	Fair_Shuffle();
	return deck;
}

function Get_All_Cards(): List.<GameObject>
{
	return all_cards;
}

//Returns the amount of cards in the deck.
function Size(): int
{
	return deck.Count;
}

function Uniques_Size(): int
{
	return unique_cards.Count;
}

function Clear()
{
	unique_cards.Clear();
	unique_counts.Clear();
	deck.Clear();
}

//Adds a new card to the deck by taking in the gameobject.
function Add_Card(new_card: GameObject)
{
	if(unique_cards.Contains(new_card))
	{
		var index: int = unique_cards.IndexOf(new_card);
		unique_counts[index] = unique_counts[index] + 1;
	}
	else
	{
		unique_cards.Add(new_card);
		unique_counts.Add(1);
	}
	deck.Add(new_card);
}

//Removes a card from the deck based on its position in the deck.
function Remove_Card(old_card_position: int)
{
	var index: int = unique_cards.IndexOf(deck[old_card_position]);
	unique_counts[index] = unique_counts[index] - 1;
	if(unique_counts[index] < 1)
	{
		unique_cards.RemoveAt(index);
		unique_counts.RemoveAt(index);
	}
	deck.RemoveAt(old_card_position);
}

function Remove_Card(old_card: GameObject)
{
	var index: int = unique_cards.IndexOf(old_card);
	unique_counts[index] = unique_counts[index] - 1;
	if(unique_counts[index] < 1)
	{
		unique_cards.RemoveAt(index);
		unique_counts.RemoveAt(index);
	}
	deck.Remove(old_card);
}

function Backup(): String[]
{
	return [Deck_To_String(), owner_details[0], owner_details[1]];
}

function Get_Uniques(): List.<GameObject>
{
	return unique_cards;
}

function Get_Unique_Counts(): List.<int>
{
	return unique_counts;
}

function Last_Copy(checked_card: GameObject): boolean
{
	return unique_counts[unique_cards.IndexOf(checked_card)] == 1;
}