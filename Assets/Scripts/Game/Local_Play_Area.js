public class Local_Play_Area extends Play_Area
{
	//Overwritten
	function Set_Player_Id(new_id: int)
	{
		player_id = new_id;
		if(game_master == null)
		{
			game_master = GameObject.FindGameObjectWithTag("game_master").GetComponent(Game_Master);
		}
		game_master.SendMessage("Set_Player", gameObject);
	}
	
	//Overwritten
	function Take_Damage(amount: int)
	{
		current_defense -= amount;
		if(current_defense <= 0)
		{
			game_master.SendMessage("End_Game", player_id);
		}
	}
}