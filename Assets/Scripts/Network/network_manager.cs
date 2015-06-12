using UnityEngine;
using System.Collections;


public class network_manager : MonoBehaviour 
{
	string registeredGameName = "TCG_511";
	//bool isRefreshing = false;
	float refreshRequestLength = 3.0f;
	HostData[] hostData;

	public GameObject text;

	private bool hide_buttons = false;

	void Start()
	{
		StartCoroutine ("RefreshHostList");
	}

	private void StartServer()
	{
		//bool useVat = !Network.HavePublicAddress();
		Network.InitializeServer (2, 25000, false);
		MasterServer.RegisterHost (registeredGameName, "Networking Test Game2", "Test Implementation Of Server Code2");
	}

	void OnServerInitialized()
	{
		Debug.Log ("Server has been initialized!");
		SpawnPlayer1();
	}

	void OnPlayerConnected(NetworkPlayer player) 
	{
		if(Network.isClient)
		{
			Debug.Log ("I AM A CLIENT");
			Camera.main.transform.position = new Vector3(10, 10, 10);
		}
	}

	void OnConnectedToServer() 
	{
		//Camera.main.transform.rotation *= Quaternion.Euler(0, 0, 180);
		SpawnPlayer2();
	}

	void OnMasterServerEvent(MasterServerEvent masterServerEvent)
	{
		if (masterServerEvent == MasterServerEvent.RegistrationSucceeded) 
		{
			Debug.Log ("Registration successful!");
		}
	}

	void OnFailedToConnect(NetworkConnectionError error) 
	{
		Debug.Log("Could not connect to server: "+ error);
	}

	public IEnumerator RefreshHostList()
	{
		//Debug.Log ("Refeshing...");
		MasterServer.RequestHostList (registeredGameName);
		//float timeStarted = Time.time;
		float timeEnd = Time.time + refreshRequestLength;

		while(Time.time < timeEnd)
		{
			hostData = MasterServer.PollHostList();
			yield return new WaitForEndOfFrame();
		}

		if(hostData == null || hostData.Length == 0)
		{
			//Debug.Log ("No active servers have been found.");
			StartServer();
		}
		else
		{
			Network.Connect(hostData[0]);
			//Debug.Log ("Total games found: " + hostData.Length);
		}
	}

	private void SpawnPlayer1()
	{
		Debug.Log ("Player 1 has joined the game.");

		//Do not show buttons anymore.
		hide_buttons = true;

		//Creating the hand area and the player health.
		GameObject player1_area = (GameObject)Network.Instantiate (Resources.Load ("hand_area"), new Vector3 (0, 0, -15), Quaternion.identity, 0);
		player1_area.tag = "hand_area";
		player1_area.GetComponent<Renderer>().material.color = Color.gray;
		player1_area.GetComponent("Play_Area").SendMessage("Set_Player_Id", 1);

		text.GetComponent("text").SendMessage("Local_Show");

		//DELETEEEEEEEE
		//text.GetComponent("text").SendMessage("Hide");
		//GameObject player = (GameObject)Network.Instantiate (Resources.Load (Hero), new Vector3 (0, 1, 0), Quaternion.identity, 0);
	}
	
	private void SpawnPlayer2()
	{
		//DELETEEEEEEEEEEEEEEE
		Camera.main.transform.rotation *= Quaternion.Euler(0, 0, 180);



		Debug.Log ("Player 2 has joined the game.");

		//Do not show buttons anymore.
		hide_buttons = true;

		//Close the message for player1.
		text.GetComponent("text").SendMessage("Hide");

		//Creating the hand area and the player health.
		GameObject player2_area = (GameObject)Network.Instantiate (Resources.Load ("hand_area"), new Vector3 (0, 0, 15), Quaternion.identity, 0);
		player2_area.tag = "hand_area";
		player2_area.GetComponent<Renderer>().material.color = Color.gray;
		player2_area.GetComponent("Play_Area").SendMessage("Set_Player_Id", 2);

		//Creating the shared functions for the players.
		GameObject player = (GameObject)Network.Instantiate (Resources.Load ("hero_object"), new Vector3 (0, 1, 0), Quaternion.identity, 0);
		player.GetComponent("Hero").SendMessage("Set_Player", 2);
	}

	public void OnGUI()
	{
		if (Network.isClient || Network.isServer || hide_buttons)
		{
			return;
		}
		/*
		if (GUI.Button (new Rect (25f, 25f, 150f, 30f), "Start New Server")) 
		{
			StartServer();
		}
		if(GUI.Button (new Rect (25f, 25f, 150f, 30f), "Play Online"))
		{
			StartCoroutine ("RefreshHostList");
		}
		*/
		if(GUI.Button (new Rect (25f, 105f, 150f, 30f), "Home"))
		{
			Application.LoadLevel("Main_Menu"); 
		}
		/*
		if(hostData != null)
		{
			for(int i = 0; i < hostData.Length; i++)
			{
				if(GUI.Button (new Rect(Screen.width/2, 65f + (30f * i), 300f, 30f), hostData[i].gameName))
				{
					Network.Connect(hostData[i]);
				}
			}
		}
		*/
	}
}
