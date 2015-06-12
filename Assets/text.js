#pragma strict

private var timer: float = 0.0;
private var displayed: boolean = false;
private var text: GUIText;

function Start () 
{
	text = gameObject.GetComponent(GUIText);
}

function Update () 
{
	if(displayed)
	{
		timer -= Time.deltaTime;
		if(timer < 0.0)
		{
			displayed = false;
			Local_Hide();
		}
	}
}

function Local_Move(offset: int[])
{
	text.pixelOffset = Vector2(offset[0], offset[1]);
}

function Local_Temporary_Message(message: String)
{
	text.text = message;
	text.enabled = true;
	timer = 2.0;
	displayed = true;
}

function Local_Message(message: String)
{
	if(displayed)
	{
		displayed = false;
	}
	text.text = message;
}

function Local_Show()
{
	text.enabled = true;
}

function Local_Hide()
{
	text.enabled = false;
	text.pixelOffset = Vector2(0, 0);
}

function Show()
{
	GetComponent.<NetworkView>().RPC("Networked_Show", RPCMode.AllBuffered);
}

function Hide()
{
	GetComponent.<NetworkView>().RPC("Networked_Hide", RPCMode.AllBuffered);
}

@RPC
function Networked_Show()
{
	text.enabled = true;
}

@RPC
function Networked_Hide()
{
	text.enabled = false;
}