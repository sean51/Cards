//Raycast objects constantly updating.
private var hit : RaycastHit;
private var ray : Ray;

//The speed the cards move at.
private static var MOVE_SPEED: float = 2.0f;

private var held_deck_card: GameObject = null;
private var held_owned_card: GameObject = null;

private var original_position: Vector3;

private var highlighted_card: GameObject = null;

private var preview_card : GameObject = null;
private var preview: GameObject = null;

//Time of clicks.
private var time_clicked: float;

function Start () 
{
	ray = Camera.main.ScreenPointToRay (Input.mousePosition);
}

function Update () 
{
	if(Input.GetMouseButtonDown(0))
	{
		if(Physics.Raycast (ray, hit))
		{
			if(hit.transform.gameObject.tag == "owned_card")
			{
				held_owned_card = hit.transform.gameObject;
				original_position = held_owned_card.transform.position;
				held_owned_card.GetComponent(Base_Card).SendMessage("Glow", false);
				//held_owned_card.layer = LayerMask.NameToLayer("Default");
				time_clicked = Time.time;
			}
			else if(hit.transform.gameObject.tag == "deck_card")
			{
				held_deck_card = hit.transform.gameObject;
				original_position = held_deck_card.transform.position;
				held_deck_card.GetComponent(Base_Card).SendMessage("Glow", false);
				//held_deck_card.layer = LayerMask.NameToLayer("Default");
				time_clicked = Time.time;
			}
		}
	}
	if(Input.GetMouseButton(0))
	{
		if(held_owned_card != null)
		{
			Move_Card(held_owned_card);
		}
		else if(held_deck_card != null)
		{
			Move_Card(held_deck_card);
		}
	}
	if(Input.GetMouseButtonUp(0))
	{
		if(Time.time - time_clicked < .1f)
		{
			if(held_owned_card != null)
			{
				gameObject.GetComponent("main_menu").SendMessage("Add_Card_To_Deck", held_owned_card);
				Reset_Card(held_owned_card);
				held_owned_card = null;
			}
			else if(held_deck_card != null)
			{
				gameObject.GetComponent("main_menu").SendMessage("Remove_Card_From_Deck", held_deck_card);
				Reset_Card(held_deck_card);
				held_deck_card = null;
			}
		}
		else if(held_owned_card != null)
		{
			var all_targets = Physics.RaycastAll(ray);
			for(var i : int = 0; i < all_targets.Length; i++)
			{
				if(all_targets[i].transform.gameObject.tag == "deck_area")
				{
					gameObject.GetComponent("main_menu").SendMessage("Add_Card_To_Deck", held_owned_card);
				}
			}
			Reset_Card(held_owned_card);
			held_owned_card = null;
		}
		else if(held_deck_card != null)
		{
			var all_targets2 = Physics.RaycastAll(ray);
			for(var i2 : int = 0; i2 < all_targets2.Length; i2++)
			{
				if(all_targets2[i2].transform.gameObject.tag == "owned_card_area")
				{
					gameObject.GetComponent("main_menu").SendMessage("Remove_Card_From_Deck", held_deck_card);
				}
			}
			//NOT REALLY
			Reset_Card(held_deck_card);
			held_deck_card = null;
		}
	}
	if(Input.GetMouseButtonDown(1))
	{
	
		if(held_deck_card != null)
		{
			Reset_Card(held_deck_card);
			held_deck_card = null;
		}
		else if(held_owned_card != null)
		{
			Reset_Card(held_owned_card);
			held_owned_card = null;
		}
	}
	if(Physics.Raycast (ray, hit))
	{
		if(!held_owned_card && !held_deck_card)
		{
			if(hit.transform.gameObject.layer == LayerMask.NameToLayer("card"))
			{
				if(highlighted_card == null)
				{
					highlighted_card = hit.transform.gameObject;
					highlighted_card.GetComponent(Base_Card).SendMessage("Glow", true);
				}
				else if(highlighted_card != hit.transform.gameObject)
				{
					highlighted_card.GetComponent(Base_Card).SendMessage("Glow", false);
					highlighted_card = hit.transform.gameObject;
					highlighted_card.GetComponent(Base_Card).SendMessage("Glow", true);
				}
				if(preview_card == null)
				{
					if(preview != null)
					{
						Destroy(preview);
					}
					Create_Preview_Card();
				}
				else if(preview_card != hit.transform.gameObject)
				{
					Destroy(preview);
					Create_Preview_Card();
				}
			}
			else
			{
				if(highlighted_card != null)
				{
					highlighted_card.GetComponent(Base_Card).SendMessage("Glow", false);
					highlighted_card = null;
				}
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
	ray = Camera.main.ScreenPointToRay (Input.mousePosition);
}

function Reset_Card(card_to_move: GameObject)
{
	card_to_move.transform.position = original_position;
	//card_to_move.layer = LayerMask.NameToLayer("card");
}

function Move_Card(card_to_move: GameObject)
{
	if(Physics.Raycast (ray, hit))
	{
		card_to_move.transform.position = Vector3(hit.point.x, .5, hit.point.z);
	}
}

function Create_Preview_Card()
{
	preview_card = hit.transform.gameObject;
	preview = Instantiate (preview_card, new Vector3 (0, 5, 0), Quaternion.identity);
	Destroy(preview.GetComponent(Base_Card));
	Destroy(preview.GetComponent(NetworkView));
	for(var child: Transform in preview.transform) 
	{
		if(child.name == "glow")
		{
			Destroy(child.gameObject);
		}
	}
	preview.layer = LayerMask.NameToLayer("Ignore Raycast");
	preview.tag = "preview_card";
}