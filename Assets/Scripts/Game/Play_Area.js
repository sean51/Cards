#pragma strict

public class Play_Area extends MonoBehaviour
{
	public var life_box_style: GUIStyle;
	
	protected var max_defense: int = 20;
	protected var current_defense: int = 20;
	protected var game_master: Game_Master;
	protected var player_id: int;
	
	private static var LIFE_SIZE: int = 50;

	function Start () 
	{
		game_master = GameObject.FindGameObjectWithTag("game_master").GetComponent(Game_Master);
	}

	function Update () 
	{

	}

	function Set_Player_Id(new_id: int)
	{
		GetComponent.<NetworkView>().RPC("Networked_Set_Player_Id", RPCMode.AllBuffered, new_id);
		if(game_master == null)
		{
			game_master = GameObject.FindGameObjectWithTag("game_master").GetComponent(Game_Master);
		}
		game_master.SendMessage("Set_Player", gameObject);
	}

	function Get_Defense(): int
	{
		return current_defense;
	}

	function Get_Player_Id(): int
	{
		return player_id;
	}

	function Take_Damage(amount: int)
	{
		GetComponent.<NetworkView>().RPC("Networked_Take_Damage", RPCMode.AllBuffered, amount);
		if(current_defense <= 0)
		{
			//networkView.RPC("Networked_End_Game", RPCMode.AllBuffered);
			game_master.SendMessage("End_Game", player_id);
			//Destroy(gameObject);
		}
	}

	//Rect(Width - Self - Buffer,        Height - Self - Buffer,          Self Width,            Self Height)
	function OnGUI()
	{
		if(gameObject.tag == "op_hand_area")
		{
			GUI.Box(new Rect((Screen.width / 20), (Screen.height / 5.5), LIFE_SIZE, LIFE_SIZE), "" + current_defense, life_box_style);
		}
		else
		{
			GUI.Box(new Rect((Screen.width / 20), Screen.height - LIFE_SIZE -(Screen.height / 5.5), LIFE_SIZE, LIFE_SIZE), "" + current_defense, life_box_style);
		}
	}

	@RPC
	function Networked_Set_Player_Id(new_id: int)
	{
		player_id = new_id;
	}

	@RPC
	function Networked_Take_Damage(amount : int)
	{
		current_defense -= amount;
	}
}