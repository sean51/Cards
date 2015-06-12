public class Local_Game_Master extends Game_Master
{
	//Overwritten
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
			player_turn = 1;
		}
		else
		{
			player_2.SendMessage("Take_Damage", player_2_wager);
			player_turn = 2;
		}
	}
	//Overwritten.
	function Set_Wager(wager_info: int[])
	{
		if(wager_info[0] == 1)
		{
			player_1_wager = wager_info[1];
			wagers_received++;
		}
		else
		{
			player_2_wager = wager_info[1];
			wagers_received++;
		}
		if(wagers_received == 2)
		{
			Start_Game();
		}
	}
	
	//Overwritten.
	function Set_Player(player_info: GameObject)
	{
		if(player_info.GetComponent(Play_Area).Get_Player_Id() == 1)
		{
			player_1 = 	player_info;	
		}
		else
		{
			player_2 = 	player_info;		
		}
	}
	
	//Overwritten.
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
		player_turn = player_id;
	}
	
	//Overwritten.
	function End_Game(player_id: int)
	{
		winner = (player_id % 2) + 1;
		game_over = true;
	}
}