public class Game_Mouse extends MonoBehaviour
{
	//Raycast objects constantly updating.
	protected var hit : RaycastHit;
	protected var ray : Ray;

	//Statics for easy manipulation.
	protected static var MOVE_SPEED: float = 2.0f;
	private static var CLICK_THRESHOLD: float = 0.1f;

	//The pointer object.
	public var arrow_object: GameObject;

	//Objects that will fill depending on what the player is grabbing.
	private var held_creature: GameObject = null;
	private var held_spell: GameObject = null;
	private var held_global_spell: GameObject = null;
	private var held_energy: GameObject = null;
	private var attack_card : GameObject = null;
	private var held_enchantment: GameObject = null;

	//Helper objects that save references to things.
	protected var preview_card : GameObject = null;
	private var arrow_start: Vector3;
	private var raycast_group: Function;

	//Created objects that are instantiated and destroyed.
	protected var preview: GameObject = null;
	private var arrow: GameObject = null;
	private var target_creature: GameObject = null;

	//Splits of the two phases of spell casting and creature playing.
	private var casting_spell: boolean = false;
	private var two_stage_creature: boolean = false;
	private var targeting_creature: boolean = false;

	//GameObject for communication.
	private var text: GUIText;

	//Time of clicks.
	private var time_clicked: float;

	//For easy reference to scripts
	private var script: Base_Card;
	private var hero_script: Hero;

	//Sounds
	public var sound01: AudioClip;
	public var click_sound: AudioClip;
	public var reject_sound: AudioClip;

	////////////////////////////////////////////////////////////////////////////////
	//UNITY FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	function Start () 
	{
		hero_script = gameObject.GetComponent(Hero);
		ray = Camera.main.ScreenPointToRay (Input.mousePosition);
		text = GameObject.FindGameObjectWithTag("text").GetComponent(GUIText);
	}

	function Update () 
	{
		if(Input.GetMouseButtonDown(0))
		{
			if(Card_Is_Held())
			{
				if(!Activate_Card())
				{
					Drop_Card();
				}
			}
			else
			{
				Hold_Card();
				time_clicked = Time.time;
			}
			AudioSource.PlayClipAtPoint(click_sound, gameObject.transform.position);
		}
		if(Input.GetMouseButtonUp(0))
		{
			if(Time.time - time_clicked > CLICK_THRESHOLD)
			{
				if(Card_Is_Held())
				{
					if(!Activate_Card())
					{
						Drop_Card();
					}
				}
			}
		}
		if(Input.GetMouseButtonDown(1))
		{
			Drop_Card();
		}
		Move_Held_Card();
		Update_Preview();
		ray = Camera.main.ScreenPointToRay (Input.mousePosition);
	}

	////////////////////////////////////////////////////////////////////////////////
	//HIGHLIGHTING FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	function Highlight_Creatures(raycast_method: Function)
	{
		var new_target: GameObject = raycast_method();
		if(new_target != null)
		{
			if(target_creature == null)
			{
				Select_Target_Creature(new_target);
			}
			else if(target_creature != new_target)
			{
				Deselect_Target_Creature();
				Select_Target_Creature(new_target);
			}
		}
		else
		{
			Deselect_Target_Creature();
		}
	}

	////////////////////////////////////////////////////////////////////////////////
	//MOVE FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	function Move_Held_Card()
	{
		if(held_creature != null)
		{
			if(two_stage_creature)
			{
				Two_Stage_Creature(held_creature);
			}
			else if(Valid_Movement_Check(held_creature))
			{
				hero_script.SendMessage("Make_Space", hit.point.x);
			}
		}
		else if(held_spell != null)
		{
			Spell_Card_Selected(held_spell);
		}
		else if(held_global_spell != null)
		{
			Valid_Movement_Check(held_global_spell);
		}
		else if(held_enchantment != null)
		{
			Spell_Card_Selected(held_enchantment);
		}
		else if(held_energy != null)
		{
			Valid_Movement_Check(held_energy);
		}
		else if(attack_card != null)
		{
			Move_Arrow();
			Highlight_Creatures(Raycast_Find_Enemy_Creature);
		}
	}

	function Valid_Movement_Check(moving_card: GameObject): boolean
	{
		Move_Card(moving_card);
		if(!Raycast_Find_Player_Hand_Area())
		{
			if(!hero_script.Can_Play(moving_card))
			{
				Cant_Play();
				return false;
			}
			return true;
		}
		return false;
	}

	function Move_Card(card_to_move: GameObject)
	{
		if(Physics.Raycast (ray, hit))
		{
			card_to_move.GetComponent(Base_Card).SendMessage("Move", Vector3.Lerp(card_to_move.transform.position, Vector3(hit.point.x, 3.0, hit.point.z), MOVE_SPEED));
		}
	}

	function Move_Arrow()
	{
		if(Physics.Raycast (ray, hit))
		{
			var v3 = hit.point - arrow_start;
			arrow.transform.position = arrow_start + (v3) / 2.0;
			arrow.transform.localScale.y = v3.magnitude/2.0;
			arrow.transform.rotation = Quaternion.FromToRotation(Vector3.up, v3);
		}
	}

	function Cant_Play()
	{
		AudioSource.PlayClipAtPoint(reject_sound, gameObject.transform.position);
		Drop_Card();
		text.SendMessage("Local_Temporary_Message", "You can't play that.");
	}

	////////////////////////////////////////////////////////////////////////////////
	//SELECT FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	//Selects a creature by glowing them.
	function Select_Target_Creature(new_target: GameObject)
	{
		target_creature = new_target;
		var local_script: Base_Card = target_creature.GetComponent(Base_Card);
		if(local_script != null)
		{
			local_script.SendMessage("Set_Glow_Color", Color.red);
			local_script.SendMessage("Glow", true);
		}
	}

	//Deselects a creature by removing their glow.				
	function Deselect_Target_Creature()
	{
		if(target_creature != null)
		{
			var local_script: Base_Card = target_creature.GetComponent(Base_Card);
			if(local_script != null)
			{
				local_script.SendMessage("Set_Glow_Color", Color.green);
				local_script.SendMessage("Glow", false);
			}
		}
		target_creature = null;
		hero_script.SendMessage("Glow_Play_Area");
	}

	function Hold_Card()
	{
		if(Physics.Raycast (ray, hit))
		{
			var raycast_hit: GameObject = hit.transform.gameObject;
			var raycast_tag: String = raycast_hit.tag;
			script = raycast_hit.GetComponent(Base_Card);
			
			if(raycast_tag == "card")
			{
				held_creature = raycast_hit;
				script.SendMessage("Glow", false);
				if(script.Get_Two_Stage_Play())
				{
					raycast_group = Raycast_Find_Any;
					two_stage_creature = true;
					targeting_creature = false;
				}
				else
				{
					two_stage_creature = false;
				}
			}
			else if(raycast_tag == "played_card")
			{
				if(script.Can_Attack())
				{
					attack_card = raycast_hit;
					script.SendMessage("Set_Glow_Color", Color.red);
					arrow = Instantiate(arrow_object, hit.transform.position, Quaternion.identity);
					arrow_start = arrow.transform.position;
				}
			}
			else if(raycast_tag == "spell_card")
			{
				var targeting_system: int = script.Get_Targeting_System();
				switch(targeting_system)
				{
					case 1:
						break;
					case 2:
						raycast_group = Raycast_Find_Enemy_Creature;
						held_spell = raycast_hit;
						break;
					case 3:
						break;
					case 4:
						break;
					case 5:
						break;
					case 6:
						raycast_group = Raycast_Find_Creature_Or_Enemy;
						held_spell = raycast_hit;
						break;
					case 7:
						raycast_group = Raycast_Find_Enemy;
						held_spell = raycast_hit;
						break;
					case 0:
						held_global_spell = raycast_hit;
						break;
				}
				script.SendMessage("Glow", false);
			}
			else if(raycast_tag == "enchantment_card")
			{
				held_enchantment = raycast_hit;
				if(script.Get_Target_Enemies())
				{
					raycast_group = Raycast_Find_Creature;
				}
				else
				{
					raycast_group = Raycast_Find_Friendly_Creature;
				}
				script.SendMessage("Glow", false);
			}
			else if(raycast_tag == "energy_card")
			{
				held_energy = raycast_hit;
				script.SendMessage("Glow", false);
			}
		}
	}

	function Drop_Card()
	{
		if(attack_card != null)
		{
			Deselect_Target_Creature();
			attack_card.GetComponent(Base_Card).SendMessage("Set_Glow_Color", Color.green);
			attack_card = null;
			if(arrow != null)
			{
				Destroy(arrow);
			}
		}
		else if(held_spell != null)
		{
			Deselect_Target_Creature();
			held_spell.GetComponent(Base_Card).SendMessage("Set_Glow_Color", Color.green);
			held_spell = null;
			hero_script.SendMessage("Arrange_Hand");
			if(arrow != null)
			{
				Destroy(arrow);
			}
		}
		else if(held_enchantment != null)
		{
			Deselect_Target_Creature();
			held_enchantment.GetComponent(Base_Card).SendMessage("Set_Glow_Color", Color.green);
			held_enchantment = null;
			hero_script.SendMessage("Arrange_Hand");
			if(arrow != null)
			{
				Destroy(arrow);
			}
		}
		else if(held_creature != null)
		{
			if(two_stage_creature)
			{
				Deselect_Target_Creature();
				held_creature.GetComponent(Base_Card).SendMessage("Set_Glow_Color", Color.green);
				if(arrow != null)
				{
					Destroy(arrow);
				}
				targeting_creature = false;
				two_stage_creature = false;
			}
			held_creature = null;
			hero_script.SendMessage("Reset_Skip");
			hero_script.SendMessage("Arrange_Play_Area");
			hero_script.SendMessage("Arrange_Hand");
		}
		else if(held_energy != null)
		{
			held_energy = null;
			hero_script.SendMessage("Arrange_Hand");
		}
		else if(held_global_spell != null)
		{
			held_global_spell = null;
			hero_script.SendMessage("Arrange_Hand");
		}
	}

	function Card_Is_Held(): boolean
	{
		return held_creature != null ||
		attack_card != null ||
		held_enchantment != null ||
		held_spell != null ||
		held_global_spell != null ||
		held_energy != null;
		
	}
	////////////////////////////////////////////////////////////////////////////////
	//RAYCASTING FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	function Raycast_Find_Play_Area(): boolean
	{
		var all_targets = Physics.RaycastAll(ray);
		for(var i : int = 0; i < all_targets.Length; i++)
		{
			if(all_targets[i].transform.gameObject.tag == "play_area")
			{
				return true;
			}
		}
		return false;
	}

	function Raycast_Find_Enemy(): GameObject
	{
		var all_targets = Physics.RaycastAll(ray);
		for(var i : int = 0; i < all_targets.Length; i++)
		{
			if(all_targets[i].transform.gameObject.tag == "played_op_card" || all_targets[i].transform.gameObject.tag == "op_hand_area")
			{
				return all_targets[i].transform.gameObject;
			}
		}
		return null;
	}

	function Raycast_Find_Enemy_Creature(): GameObject
	{
		var all_targets = Physics.RaycastAll(ray);
		for(var i : int = 0; i < all_targets.Length; i++)
		{
			if(all_targets[i].transform.gameObject.tag == "played_op_card")
			{
				return all_targets[i].transform.gameObject;
			}
		}
		return null;
	}

	function Raycast_Find_Friendly_Creature(): GameObject
	{
		var all_targets = Physics.RaycastAll(ray);
		for(var i : int = 0; i < all_targets.Length; i++)
		{
			if(all_targets[i].transform.gameObject.tag == "played_card")
			{
				return all_targets[i].transform.gameObject;
			}
		}
		return null;
	}

	function Raycast_Find_Creature(): GameObject
	{
		var all_targets = Physics.RaycastAll(ray);
		for(var i : int = 0; i < all_targets.Length; i++)
		{
			if(all_targets[i].transform.gameObject.tag == "played_op_card" || all_targets[i].transform.gameObject.tag == "played_card")
			{
				return all_targets[i].transform.gameObject;
			}
		}
		return null;
	}

	function Raycast_Find_Creature_Or_Enemy(): GameObject
	{
		var all_targets = Physics.RaycastAll(ray);
		for(var i : int = 0; i < all_targets.Length; i++)
		{
			if(all_targets[i].transform.gameObject.tag == "played_op_card" || all_targets[i].transform.gameObject.tag == "played_card" || all_targets[i].transform.gameObject.tag == "op_hand_area")
			{
				return all_targets[i].transform.gameObject;
			}
		}
		return null;
	}

	function Raycast_Find_Any(): GameObject
	{
		var all_targets = Physics.RaycastAll(ray);
		for(var i : int = 0; i < all_targets.Length; i++)
		{
			if(all_targets[i].transform.gameObject.tag == "played_op_card" || all_targets[i].transform.gameObject.tag == "played_card" || all_targets[i].transform.gameObject.tag == "op_hand_area" || all_targets[i].transform.gameObject.tag == "hand_area")
			{
				return all_targets[i].transform.gameObject;
			}
		}
		return null;
	}

	function Raycast_Find_Player_Hand_Area(): boolean
	{
		var all_targets = Physics.RaycastAll(ray);
		for(var i : int = 0; i < all_targets.Length; i++)
		{
			if(all_targets[i].transform.gameObject.tag == "hand_area")
			{
				return true;
			}
		}
		return false;
	}

	////////////////////////////////////////////////////////////////////////////////
	//SPELL/CREATURE BEHAVIOR FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

	function Spell_Card_Selected(current_card: GameObject)
	{
		script = current_card.GetComponent(Base_Card);
		var current_area: boolean = Raycast_Find_Player_Hand_Area();
		if(!casting_spell)
		{
			if(current_area)
			{
				Move_Card(current_card);
			}
			else
			{
				if(hero_script.Can_Play(current_card))
				{
					AudioSource.PlayClipAtPoint(sound01, current_card.transform.position);
					casting_spell = true;
					hero_script.SendMessage("Arrange_Hand");
					script.SendMessage("Set_Glow_Color", Color.red);
					script.SendMessage("Glow", true);
					arrow = Instantiate(arrow_object, script.Get_Destination(), Quaternion.identity);
					arrow_start = arrow.transform.position;
				}
				else
				{
					Cant_Play();
				}
			}
		}
		else
		{
			if(!current_area)
			{
				Move_Arrow();
				Highlight_Creatures(raycast_group);
			}
			else
			{
				casting_spell = false;
				Deselect_Target_Creature();
				Destroy(arrow);
				script.SendMessage("Glow", false);
				script.SendMessage("Set_Glow_Color", Color.green);
			}
		}
	}

	function Two_Stage_Creature(current_card: GameObject)
	{
		script = current_card.GetComponent(Base_Card);
		var current_area: boolean = Raycast_Find_Player_Hand_Area();
		if(!targeting_creature)
		{
			if(Valid_Movement_Check(current_card))
			{
				hero_script.SendMessage("Make_Space", hit.point.x);
			}
		}
		else
		{
			Move_Arrow();
			Highlight_Creatures(raycast_group);
		}
	}

	////////////////////////////////////////////////////////////////////////////////
	//PREVIEW FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////

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
					if(GetComponent.<NetworkView>().isMine)
					{
						Create_Preview_Card(13);
					}
					else
					{
						Create_Preview_Card(-13);
					}
				}
				else if(preview_card != hit.transform.gameObject)
				{
					if(GetComponent.<NetworkView>().isMine)
					{
						Destroy(preview);
						Create_Preview_Card(13);
					}
					else
					{
						Destroy(preview);
						Create_Preview_Card(-13);
					}
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

	function Create_Preview_Card(position: int)
	{
		preview_card = hit.transform.gameObject;
		preview = Instantiate (preview_card, new Vector3 (position, 10, 0), Quaternion.identity);
		script = preview.GetComponent(Base_Card);
		if(position == -13)
		{
			script.Flip();
		}
		Destroy(script);
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

	function Activate_Card(): boolean
	{
		var target: GameObject = null;
		if(held_creature != null)
		{
			if(two_stage_creature)
			{
				script = held_creature.GetComponent(Base_Card);
				if(targeting_creature)
				{
					target = raycast_group();
					if(target != null)
					{
						Destroy(arrow);
						Deselect_Target_Creature();
						script.SendMessage("Set_Glow_Color", Color.green);
						script.SendMessage("Set_Ability_Target", target);
						hero_script.SendMessage("Play", held_creature);
						hero_script.SendMessage("Reset_Skip");
						held_creature = null;
					}
					else
					{
						text.SendMessage("Local_Temporary_Message", "Click a target.");
					}
				}
				else
				{
					if(Raycast_Find_Play_Area())
					{
						script.SendMessage("Set_Glow_Color", Color.red);
						script.SendMessage("Glow", true);
						script.SendMessage("Travel", hero_script.Get_Insert_Position());
						arrow = Instantiate(arrow_object, script.Get_Destination(), Quaternion.identity);
						arrow_start = arrow.transform.position;
						targeting_creature = true;
					}
					else
					{
						//hero_script.SendMessage("Arrange_Hand");
						//hero_script.SendMessage("Reset_Skip");
						//held_creature = null;
						return false;
					}
				}
			}
			else if(Raycast_Find_Play_Area())
			{
				hero_script.SendMessage("Play", held_creature);
				hero_script.SendMessage("Reset_Skip");
				held_creature = null;
			}
			else
			{
				//hero_script.SendMessage("Arrange_Hand");
				//hero_script.SendMessage("Reset_Skip");
				//held_creature = null;
				return false;
			}
		}
		else if(attack_card != null)
		{
			Deselect_Target_Creature();
			target = Raycast_Find_Enemy();
			Destroy(arrow);
			attack_card.GetComponent(Base_Card).SendMessage("Set_Glow_Color", Color.green);
			if(target != null)
			{
				hero_script.SendMessage("Attack", [attack_card, target]);
			}
			attack_card = null;
		}
		else if(held_spell != null)
		{
			Deselect_Target_Creature();
			target = raycast_group();
			Destroy(arrow);
			held_spell.GetComponent(Base_Card).SendMessage("Set_Glow_Color", Color.green);
			if(target != null)
			{
				hero_script.SendMessage("Cast_Spell", [held_spell, target]);
			}
			else
			{
				hero_script.SendMessage("Arrange_Hand");
			}
			held_spell = null;
		}
		else if(held_enchantment != null)
		{
			Deselect_Target_Creature();
			target = raycast_group();
			Destroy(arrow);
			held_enchantment.GetComponent(Base_Card).SendMessage("Set_Glow_Color", Color.green);
			if(target != null)
			{
				hero_script.SendMessage("Cast_Enchantment", [held_enchantment, target]);
			}
			else
			{
				hero_script.SendMessage("Arrange_Hand");
			}
			held_enchantment = null;
		}
		else if(held_energy != null)
		{
			if(Raycast_Find_Play_Area())
			{
				hero_script.SendMessage("Cast_Energy", held_energy);
			}
			else
			{
				hero_script.SendMessage("Arrange_Hand");
			}
			held_energy = null;
		}
		else if(held_global_spell != null)
		{
			if(Raycast_Find_Play_Area())
			{
				hero_script.SendMessage("Cast_Spell", [held_global_spell, held_global_spell]);
			}
			else
			{
				hero_script.SendMessage("Arrange_Hand");
			}
			held_global_spell = null;
		}
		else
		{
			return false;
		}
		return true;
	}
}