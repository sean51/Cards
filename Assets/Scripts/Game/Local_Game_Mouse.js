public class Local_Game_Mouse extends Game_Mouse
{
	////////////////////////////////////////////////////////////////////////////////
	//PREVIEW FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	//Overwritten.
	function Update_Preview()
	{
		if(Physics.Raycast (ray, hit))
		{
			if(hit.transform.gameObject.layer == LayerMask.NameToLayer("card"))
			{
				if(preview_card == null)
				{
					if(preview != null)
					{
						Destroy(preview);
					}
					Create_Preview_Card(13);
				}
				else if(preview_card != hit.transform.gameObject)
				{
					Destroy(preview);
					Create_Preview_Card(13);
				}
			}
			else
			{
				if(preview_card != null)
				{
					Destroy(preview);
					preview_card = null;
				}
				else if(preview != null)
				{
					Destroy(preview);
				}
				else
				{
					preview = null;
					preview_card = null;
				}
			}
		}
	}
	
	////////////////////////////////////////////////////////////////////////////////
	//MOVE FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////
	
	//Overwritten.
	function Move_Card(card_to_move: GameObject)
	{
		if(Physics.Raycast (ray, hit))
		{
			card_to_move.GetComponent(Base_Card).SendMessage("Local_Move", Vector3.Lerp(card_to_move.transform.position, Vector3(hit.point.x, 3.0, hit.point.z), MOVE_SPEED));
		}
	}
}