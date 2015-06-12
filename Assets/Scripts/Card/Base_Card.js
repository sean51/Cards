//For the use of Lists.
import System.Collections.Generic;

public class Base_Card extends MonoBehaviour 
{
	//Attributes
	public var mana_cost: int[] = [0, 0, 0, 0];
	public var draw: int = 0;
	private var play_out_of_turn: boolean = false;

	//Static variables
	protected static var TEXT_LINE_LENGTH: int = 14;
	protected static var CARD_HOVER_HEIGHT: float = .1;
	protected static var TRAVEL_SPEED: float = 20.0;
	protected static var DISTANCE_ALLOWANCE: float = 0.1;
	
	//Child objects of the card
	private var cost_text: GameObject;
	private var glow: GameObject;
	private var cover: GameObject;

	//States
	protected var traveling: boolean = false;
	protected var local_traveling: boolean = false;
	protected var local: boolean = false;

	//Destinations
	protected var start_position: Vector3;
	protected var end_position: Vector3;
	protected var queued_destination: List.<Vector3> = new List.<Vector3>();

	//Traveling variables
	protected var start_time: float;
	protected var distance: float;

	//The owner of the card.
	protected var owner: Hero;
	
	////////////////////////////////////////////////////////////////////////////////
	//UNITY FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	function Start () 
	{
		for (var child : Transform in gameObject.transform) 
		{
			if(child.name == "cost")
			{
				cost_text = child.gameObject;
				child.GetComponent(TextMesh).text = "";
				for(var i: int = 0; i < 4; i++)
				{
					if(mana_cost[i] > 0)
					{
						child.GetComponent(TextMesh).text += "" + mana_cost[i];
						switch(i)
						{
							case 0:
								gameObject.GetComponent.<Renderer>().material.SetTexture("_DecalTex", Resources.Load("red_mana_tex"));
								break;
							case 1:
								gameObject.GetComponent.<Renderer>().material.SetTexture("_DecalTex", Resources.Load("yellow_mana_tex"));
								break;
							case 2:
								gameObject.GetComponent.<Renderer>().material.SetTexture("_DecalTex", Resources.Load("green_mana_tex"));
								break;
							case 3:
								gameObject.GetComponent.<Renderer>().material.SetTexture("_DecalTex", Resources.Load("blue_mana_tex"));
								break;
						}
					}
				}
			}
			else if(child.name == "glow")
			{
				glow = child.gameObject;
			}
			else if(child.name == "cover")
			{
				cover = child.gameObject;
			}
		}
	}

	function Update () 
	{
		if(traveling)
		{
			Move(Vector3.Lerp(start_position, end_position, ((Time.time - start_time) * TRAVEL_SPEED) / distance));
			if(Vector3.Distance(gameObject.transform.position, end_position) < DISTANCE_ALLOWANCE)
			{
				traveling = false;
				gameObject.layer = LayerMask.NameToLayer("card");
				if(queued_destination.Count > 0)
				{
					var temp: Vector3 = queued_destination[0];
					queued_destination.RemoveAt(0); 
					Travel(temp);
				}
			}
		}
		else if (local_traveling)
		{
			Local_Move(Vector3.Lerp(start_position, end_position, ((Time.time - start_time) * TRAVEL_SPEED) / distance));
			if(Vector3.Distance(gameObject.transform.position, end_position) < DISTANCE_ALLOWANCE)
			{
				local_traveling = false;
				gameObject.layer = LayerMask.NameToLayer("card");
				if(queued_destination.Count > 0)
				{
					var temp2: Vector3 = queued_destination[0];
					queued_destination.RemoveAt(0); 
					Local_Travel(temp2);
				}
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////
	//GETTER FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	function Get_Cost(): int[]
	{
		return mana_cost;
	}

	function Get_Cost_Sum(): int
	{
		return mana_cost[0] + mana_cost[1] + mana_cost[2] + mana_cost[3];
	}

	function Get_Play_Out_Of_Turn(): boolean
	{
		return play_out_of_turn;
	}
	
	function Get_Destination(): Vector3
	{
		return end_position;
	}

	//Not as grim as it sounds...
	function Get_Final_Destination(): Vector3
	{
		if(traveling || local_traveling)
		{
			if(queued_destination.Count > 0)
			{
				return queued_destination[queued_destination.Count - 1];
			}
			else
			{
				return end_position;
			}
		}
		else
		{
			return gameObject.transform.position;
		}
	}

	////////////////////////////////////////////////////////////////////////////////
	//SETTER FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	function Set_Owner(player: GameObject)
	{
		owner = player.GetComponent(Hero);
	}
	
	function Change_Owner(player: GameObject)
	{
		if(player == null)
		{
			owner = null;
		}
		else
		{
			owner = player.GetComponent(Hero);
		}
	}
	
	function Set_Play_Out_Of_Turn(toggle: boolean)
	{
		play_out_of_turn = toggle;
	}
	
	function Set_Local()
	{
		local = true;
	}

	////////////////////////////////////////////////////////////////////////////////
	//UTILITY FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	function Flip()
	{
		gameObject.transform.rotation *= Quaternion.Euler(0, 180, 0);
	}

	function Reveal()
	{
		if(cover != null)
		{
			cover.SetActive(false);
		}
		else
		{
			for (var child : Transform in gameObject.transform) 
			{
				if(child.name == "cover")
				{
					cover = child.gameObject;
					break;
				}
			}
			cover.SetActive(false);
		}
	}

	function Travel(destination: Vector3)
	{
		if(traveling || local_traveling)
		{
			queued_destination.Add(destination);
			return;
		}
		start_position = gameObject.transform.position;
		end_position = destination;
		if(start_position == end_position)
		{
			if(queued_destination.Count > 0)
			{
				var temp: Vector3 = queued_destination[0];
				queued_destination.RemoveAt(0); 
				Travel(temp);
			}
			return;
		}
		gameObject.layer = LayerMask.NameToLayer("Ignore Raycast");
		start_time = Time.time;
		distance = Vector3.Distance(start_position, end_position);
		traveling = true;
	}

	function Local_Travel(destination: Vector3)
	{
		if(traveling || local_traveling)
		{
			queued_destination.Add(destination);
			return;
		}
		start_position = gameObject.transform.position;
		end_position = destination;
		if(start_position == end_position)
		{
			return;
		}
		gameObject.layer = LayerMask.NameToLayer("Ignore Raycast");
		start_time = Time.time;
		distance = Vector3.Distance(start_position, end_position);
		local_traveling = true;
	}
	
	function Local_Move(new_position: Vector3)
	{
		gameObject.transform.position = new_position;
	}
	
	////////////////////////////////////////////////////////////////////////////////
	//GLOW FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	function Glow(set_glow: boolean)
	{
		if(glow != null)
		{
			glow.GetComponent(Projector).enabled = set_glow;
		}
		else
		{
			for (var child : Transform in gameObject.transform) 
			{
				if(child.name == "glow")
				{
					glow = child.gameObject;
					glow.GetComponent(Projector).enabled = set_glow;
					break;
				}
			}
		}
	}

	function Set_Glow_Color(new_color: Color)
	{
		var new_material: Material = new Material(glow.GetComponent(Projector).material);
		new_material.SetColor("_Color", new_color);
		glow.GetComponent(Projector).material = new_material;
	}

	////////////////////////////////////////////////////////////////////////////////
	//NETWORK CALL FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	function Network_Reveal()
	{
		GetComponent.<NetworkView>().RPC("Networked_Reveal", RPCMode.AllBuffered);
	}

	function Network_Flip()
	{
		GetComponent.<NetworkView>().RPC("Networked_Flip", RPCMode.Others, 180);
	}

	function Move(new_position: Vector3) 
	{
		GetComponent.<NetworkView>().RPC("Networked_Move", RPCMode.AllBuffered, new_position);
	}

	////////////////////////////////////////////////////////////////////////////////
	//NETWORKED FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	@RPC
	function Networked_Reveal()
	{
		if(cover == null)
		{
			for (var child : Transform in gameObject.transform) 
			{
				if(child.name == "cover")
				{
					cover = child.gameObject;
					break;
				}
			}
		}
		cover.SetActive(false);
	}

	@RPC
	function Networked_Flip(new_rotation: int)
	{
		gameObject.transform.rotation = gameObject.transform.rotation * Quaternion.Euler(0, new_rotation, 0);
	}

	@RPC
	function Networked_Move(new_position : Vector3)
	{
		gameObject.transform.position = new_position;
	}
	
	////////////////////////////////////////////////////////////////////////////////
	//DEBUG FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////
	
	function About(): String
	{
		return "Base_Card";
	}
}