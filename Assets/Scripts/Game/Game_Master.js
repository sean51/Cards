public class Game_Master extends MonoBehaviour
{
	public var game_over: boolean = false;

	public var player_turn: int = 0;

	public var winner: int = 0;

	public var player_1_wager: int = 0;
	public var player_2_wager: int = 0;
	public var wagers_received: int = 0;

	public var player_1: GameObject = null;
	public var player_2: GameObject = null;

	function Start () 
	{

	}

	function Update () 
	{

	}

	function Start_Game()
	{
		var wager_winner: int;
		if(player_1_wager == player_2_wager)
		{
			wager_winner = Random.Range(1, 3);
		}
		else if(player_1_wager > player_2_wager)
		{
			wager_winner = 1;
		}
		else
		{
			wager_winner = 2;
		}
		if(wager_winner == 1)
		{
			player_1.SendMessage("Take_Damage", player_1_wager);
			GetComponent.<NetworkView>().RPC("Networked_Turn", RPCMode.AllBuffered, 1);
		}
		else
		{
			player_2.SendMessage("Take_Damage", player_2_wager);
			GetComponent.<NetworkView>().RPC("Networked_Turn", RPCMode.AllBuffered, 2);
		}
	}

	function Get_Turn(): int
	{
		return player_turn;
	}

	function Get_Game(): boolean
	{
		return game_over;
	}

	function Get_Winner(): int
	{
		return winner;
	}

	function Set_Wager(wager_info: int[])
	{
		if(wager_info[0] == 1)
		{
			GetComponent.<NetworkView>().RPC("Networked_Set_Wager_Player_1", RPCMode.AllBuffered, wager_info[1]);
		}
		else
		{
			GetComponent.<NetworkView>().RPC("Networked_Set_Wager_Player_2", RPCMode.AllBuffered, wager_info[1]);
		}
		if(wagers_received == 2)
		{
			Start_Game();
		}
	}

	function Set_Player(player_info: GameObject)
	{
		if(player_info.GetComponent(Play_Area).Get_Player_Id() == 1)
		{
			GetComponent.<NetworkView>().RPC("Networked_Set_Player_1", RPCMode.AllBuffered, player_info.GetComponent.<NetworkView>().viewID);
		}
		else
		{
			GetComponent.<NetworkView>().RPC("Networked_Set_Player_2", RPCMode.AllBuffered, player_info.GetComponent.<NetworkView>().viewID);
		}
	}

	function End_Turn()
	{
		var player_id: int;
		if(player_turn == 2)
		{
			player_id = 1;
		}
		else
		{
			player_id = 2;
		}
		GetComponent.<NetworkView>().RPC("Networked_Turn", RPCMode.AllBuffered, player_id);
	}

	function End_Game(player_id: int)
	{
		GetComponent.<NetworkView>().RPC("Networked_Game_Over", RPCMode.AllBuffered, (player_id % 2) + 1);
	}

	@RPC
	function Networked_Turn(player_id: int)
	{
		player_turn = player_id;
	}

	@RPC
	function Networked_Set_Wager_Player_1(wager: int)
	{
		player_1_wager = wager;
		wagers_received++;
	}

	@RPC
	function Networked_Set_Wager_Player_2(wager: int)
	{
		player_2_wager = wager;
		wagers_received++;
	}

	@RPC
	function Networked_Set_Player_1(view_id: NetworkViewID)
	{
		var view: NetworkView = NetworkView.Find(view_id);
		player_1 = view.gameObject;
	}

	@RPC
	function Networked_Set_Player_2(view_id: NetworkViewID)
	{
		var view: NetworkView = NetworkView.Find(view_id);
		player_2 = view.gameObject;
	}

	@RPC
	function Networked_Game_Over(champion: int)
	{
		winner = champion;
		game_over = true;
	}
}