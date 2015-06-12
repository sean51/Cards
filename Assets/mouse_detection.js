private var hit : RaycastHit;
private var ray : Ray;

public var moveSpeed: float = 2.0f;

private var heldCard: GameObject = null;
private var held_spell: GameObject = null;
private var attack_card : GameObject = null;

private var preview_card : GameObject = null;
private var preview: GameObject = null;

private var card_preview: GameObject;

function Start () 
{
	ray = Camera.main.ScreenPointToRay (Input.mousePosition);
	card_preview = GameObject.FindGameObjectWithTag("card_preview");
}

function Update () 
{
	if(Input.GetMouseButtonDown(0))
	{
		if(Physics.Raycast (ray, hit))
		{
			if(hit.transform.gameObject.tag == "card")
			{
				heldCard = hit.transform.gameObject;
			}
			else if(hit.transform.gameObject.tag == "played_card")
			{
				if(!hit.transform.gameObject.GetComponent("card").Get_Attacked())
				{
					attack_card = hit.transform.gameObject;
				}
			}
			else if(hit.transform.gameObject.tag == "spell_card")
			{
				held_spell = hit.transform.gameObject;
			}
		}
	}
	if(Input.GetMouseButton(0))
	{
		if(heldCard != null)
		{
			if(Physics.Raycast (ray, hit))
			{
				heldCard.transform.position = Vector3.Lerp(heldCard.transform.position, Vector3(hit.point.x, 1.0, hit.point.z), moveSpeed);
			}
		}
		else if(held_spell != null)
		{
			if(Physics.Raycast (ray, hit))
			{
				held_spell.transform.position = Vector3.Lerp(held_spell.transform.position, Vector3(hit.point.x, 1.0, hit.point.z), moveSpeed);
			}
		}
	}
	if(Input.GetMouseButtonUp(0))
	{
		if(heldCard != null)
		{
			var all_hits = Physics.RaycastAll(ray);
			var played : boolean = false;
			for(var i : int = 0; i < all_hits.Length; i++)
			{
				if(all_hits[i].transform.gameObject.tag == "play_area")
				{
					//PLAY THE CARD
					gameObject.GetComponent("cards").SendMessage("Play", heldCard);
					played = true;
					break;
				}
			}
			if(!played)
			{
				//RETURN THE CARD TO HAND
				gameObject.GetComponent("cards").SendMessage("Arrange_Hand");
			}
			heldCard = null;
		}
		else if(attack_card != null)
		{
			if(Physics.Raycast (ray, hit))
			{
				if(hit.transform.gameObject.tag == "played_op_card" || hit.transform.gameObject.tag == "op_hand_area")
				{
					var packet: GameObject[] = [attack_card, hit.transform.gameObject];
					gameObject.GetComponent("cards").SendMessage("Attack", packet);
				}
			}
			attack_card = null;
		}
		else if(held_spell != null)
		{
			var all_targets = Physics.RaycastAll(ray);
			var card_played : boolean = false;
			for(var j : int = 0; j < all_targets.Length; j++)
			{
				if(all_targets[j].transform.gameObject.tag == "played_op_card" || all_targets[j].transform.gameObject.tag == "op_hand_area")
				{
					//PLAY THE CARD
					var spell_packet: GameObject[] = [held_spell, all_targets[j].transform.gameObject];
					gameObject.GetComponent("cards").SendMessage("Cast_Spell", spell_packet);
					card_played = true;
					break;
				}
			}
			if(!played)
			{
				//RETURN THE CARD TO HAND
				gameObject.GetComponent("cards").SendMessage("Arrange_Hand");
			}
			held_spell = null;
		}
	}
	if(Input.GetMouseButtonDown(1))
	{
		if(heldCard != null)
		{
			heldCard = null;
			gameObject.GetComponent("cards").SendMessage("Arrange_Hand");
		}
		if(attack_card != null)
		{
			attack_card = null;
		}
	}
	if(Physics.Raycast (ray, hit))
	{
		if(hit.transform.gameObject.layer == "card")
		{
			Debug.Log("This far");
			if(preview_card != hit.transform.gameObject)
			{
				preview_card = hit.transform.gameObject;
				preview = Instantiate(preview_card, Vector3(0, 0, 0), Quaternion.identity);
			}
		}
		else
		{
			Destroy(preview);
			preview_card = null;
		}
	}
	ray = Camera.main.ScreenPointToRay (Input.mousePosition);
}