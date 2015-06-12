private var attack: int = 1;
private var max_defense: int = 2;
private var current_defense: int = 2;
private var attacked: boolean = true;

private var owner: GameObject;
public var mana_cost: int[] = [1, 0, 0, 0];

//The text written on each card
private var attack_text: GameObject;
private var defense_text: GameObject;
private var cost_text: GameObject;

function Start () 
{
	//DELETE THIS
	mana_cost[0] = Random.Range(0, 2);
	mana_cost[1] = Random.Range(0, 2);
	mana_cost[2] = Random.Range(0, 2);
	mana_cost[3] = Random.Range(0, 2);
	attack = Random.Range(0, 6);
	var temp = Random.Range(1, 6);
	max_defense = temp;
	current_defense = temp;
	
	
	for (var child : Transform in gameObject.transform) 
	{
		if(child.name == "attack")
		{
			attack_text = child.gameObject;
			child.GetComponent(TextMesh).text = "" + attack;
		}
		else if(child.name == "defense")
		{
			defense_text = child.gameObject;
			child.GetComponent(TextMesh).text = "" + max_defense;
		}
		else if(child.name == "cost")
		{
			cost_text = child.gameObject;
			child.GetComponent(TextMesh).text = "" + mana_cost[0] + mana_cost[1] + mana_cost[2] + mana_cost[3];
		}
	}
}

function Update () {

}

function Get_Attack(): int
{
	return attack;
}

function Get_Defense(): int
{
	return current_defense;
}

function Take_Damage(amount: int)
{
	current_defense -= amount;
	if(current_defense <= 0)
	{
		if(owner.tag == "MainCamera")
		{
			owner.GetComponent("cards").SendMessage("Card_Died", gameObject);
		}
		else
		{
			owner.GetComponent("ai").SendMessage("Card_Died", gameObject);
		}
		Destroy(gameObject);
	}
	else
	{
		defense_text.GetComponent(TextMesh).text = "" + current_defense;
	}
}

function Get_Cost(): int[]
{
	return mana_cost;
}

function Get_Cost_Sum(): int
{
	return mana_cost[0] + mana_cost[1] + mana_cost[2] + mana_cost[3];
}

function Set_Attacked(toggle: boolean)
{
	attacked = toggle;
}

function Get_Attacked(): boolean
{
	return attacked;
}

function Set_Owner(player: GameObject)
{
	owner = player;
}