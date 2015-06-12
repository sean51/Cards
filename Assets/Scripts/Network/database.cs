using UnityEngine;
using System.Collections;

public class database : MonoBehaviour
{
	string login_URL = "http://www.weapondb.com/tcg/tcg.php";
	string deck_URL = "http://www.weapondb.com/tcg/deck.php";
	string register_URL = "http://www.weapondb.com/tcg/register.php";

	string username = "";
	string password = "";
	string email = "";
	string label = "";

	string deck1 = "0,0,0,0,0,0,0,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,3,4,3,5,4,9,3,2,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0";
	string deck2 = "5,6,8,0,0,20,0,0,8,6,10,7,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0";

	bool register = false;

	//Window and Rect sizes and locations
	static float WINDOW_START_X;
	static float WINDOW_START_Y;
	static float WINDOW_WIDTH;
	static float WINDOW_HEIGHT;
	static float LABEL_HEIGHT;
	static float INPUT_HEIGHT;
	static float BUTTON_HEIGHT;
	static float PADDING_X;
	static float PADDING_Y;

	//Defines the sizes in case of window resize
	void Awake()
	{
		WINDOW_START_X = Screen.width / 4;
		WINDOW_START_Y = Screen.height / 4;
		WINDOW_WIDTH = Screen.width / 2;
		WINDOW_HEIGHT = Screen.height / 1.5f;
		
		LABEL_HEIGHT = Screen.height / 25;
		INPUT_HEIGHT = Screen.height / 20;
		
		BUTTON_HEIGHT = Screen.height / 10;
		
		PADDING_X = Screen.width / 50;
		PADDING_Y = Screen.height / 20;
	}

	void OnGUI()
	{
		if(register)
		{
			GUI.Window(0, new Rect(WINDOW_START_X, WINDOW_START_Y, WINDOW_WIDTH, WINDOW_HEIGHT), Register_Window, "Register");
		}
		else
		{
			GUI.Window(0, new Rect(WINDOW_START_X, WINDOW_START_Y, WINDOW_WIDTH, WINDOW_HEIGHT), Login_Window, "Login");
		}
	}

	void Register_Window(int window_ID)
	{
		float height_builder = PADDING_Y;
		GUI.Label(new Rect((WINDOW_WIDTH / 2) - 40, height_builder, WINDOW_WIDTH, LABEL_HEIGHT), "<Username>");
		height_builder += LABEL_HEIGHT;;
		username = GUI.TextField (new Rect(PADDING_X, height_builder, WINDOW_WIDTH - (PADDING_X * 2), INPUT_HEIGHT), username);
		height_builder += INPUT_HEIGHT;
		GUI.Label(new Rect((WINDOW_WIDTH / 2) - 36, height_builder, WINDOW_WIDTH, LABEL_HEIGHT), "<Password>");
		height_builder += LABEL_HEIGHT;
		password = GUI.PasswordField(new Rect(PADDING_X, height_builder, WINDOW_WIDTH - (PADDING_X * 2), INPUT_HEIGHT), password, '*');
		height_builder += INPUT_HEIGHT;
		GUI.Label(new Rect((WINDOW_WIDTH / 2) - 28, height_builder, WINDOW_WIDTH, LABEL_HEIGHT), "<Email>");
		height_builder += LABEL_HEIGHT;
		email = GUI.TextField (new Rect(PADDING_X, height_builder, WINDOW_WIDTH - (PADDING_X * 2), INPUT_HEIGHT), email);
		height_builder += INPUT_HEIGHT + PADDING_Y;

		if(GUI.Button(new Rect(PADDING_X, height_builder, WINDOW_WIDTH - (PADDING_X * 2), BUTTON_HEIGHT), "Register"))
		{
			StartCoroutine(Handle_Register(username, password, email));
		}

		height_builder += BUTTON_HEIGHT;
		GUI.Label (new Rect(PADDING_X, height_builder, WINDOW_WIDTH - (PADDING_X * 2), LABEL_HEIGHT), label);
		height_builder += LABEL_HEIGHT;

		if(GUI.Button(new Rect(PADDING_X, height_builder, WINDOW_WIDTH - (PADDING_X * 2), BUTTON_HEIGHT), "Back To Login"))
		{
			label = "";
			register = false;
		}
	}

	//Subtract 4 per letter from starting width.
	void Login_Window(int window_ID)
	{
		float height_builder = PADDING_Y;
		GUI.Label(new Rect((WINDOW_WIDTH / 2) - 40, height_builder, WINDOW_WIDTH, LABEL_HEIGHT), "<Username>");
		height_builder += LABEL_HEIGHT;;
		username = GUI.TextField (new Rect(PADDING_X, height_builder, WINDOW_WIDTH - (PADDING_X * 2), INPUT_HEIGHT), username);
		height_builder += INPUT_HEIGHT;
		GUI.Label(new Rect((WINDOW_WIDTH / 2) - 36, height_builder, WINDOW_WIDTH, LABEL_HEIGHT), "<Password>");
		height_builder += LABEL_HEIGHT;
		password = GUI.PasswordField(new Rect(PADDING_X, height_builder, WINDOW_WIDTH - (PADDING_X * 2), INPUT_HEIGHT), password, '*');
		height_builder += INPUT_HEIGHT + PADDING_Y;

		if(GUI.Button(new Rect(PADDING_X, height_builder, WINDOW_WIDTH - (PADDING_X * 2), BUTTON_HEIGHT), "Login"))
		{
			StartCoroutine(Handle_Login(username, password));
		}

		height_builder += BUTTON_HEIGHT;
		GUI.Label (new Rect(PADDING_X, height_builder, WINDOW_WIDTH - (PADDING_X * 2), LABEL_HEIGHT), label);
		height_builder += LABEL_HEIGHT;

		if(GUI.Button(new Rect(PADDING_X, height_builder, WINDOW_WIDTH - (PADDING_X * 2), BUTTON_HEIGHT), "Register"))
		{
			label = "";
			register = true;
		}

		height_builder += BUTTON_HEIGHT;
		height_builder += LABEL_HEIGHT;
		
		if(GUI.Button(new Rect(PADDING_X, height_builder, WINDOW_WIDTH - (PADDING_X * 2), BUTTON_HEIGHT), "Try Now"))
		{
			Try_Game("anonymous", "");
		}
	}

	void Try_Game(string username, string password)
	{
		GameObject deck1_object = Instantiate(Resources.Load("deck")) as GameObject;
		deck1_object.GetComponent("networked_deck").SendMessage("Create", new string[]{deck1, username, password});
		GameObject.DontDestroyOnLoad(deck1_object);
		
		GameObject deck2_object = Instantiate(Resources.Load("deck")) as GameObject;
		deck2_object.GetComponent("networked_deck").SendMessage("Create", new string[]{deck2, username, password});
		deck2_object.tag = "deck_2";
		GameObject.DontDestroyOnLoad(deck2_object);
		
		Application.LoadLevel("Main_Menu");
	}

	IEnumerator Handle_Register(string username, string password, string email)
	{
		label = "Checking input.";
		string URL = this.register_URL + "?username=" + username + "&password=" + password + "&email=" + email;
		Debug.Log (URL);
		WWW registerReader = new WWW (URL);
		yield return registerReader;
		if (registerReader.error != null) 
		{
			label = "Error connecting to database server.";
		}
		else
		{
			if(registerReader.text == "success")
			{
				label = "Successfully registered!";
				//StartCoroutine(Get_Deck());
			}
			else
			{
				label = registerReader.text;
			}
		}
	}

	IEnumerator Handle_Login(string username, string password)
	{
		label = "Checking username and password.";
		string URL = this.login_URL + "?username=" + username + "&password=" + password;
		WWW login_reader = new WWW(URL);
		yield return login_reader;
		if (login_reader.error != null) 
		{
			label = "Error connecting to database server: " + login_reader.error;
		}
		else
		{
			if(login_reader.text == "success")
			{
				label = "Successfully logged in.";
				StartCoroutine(Get_Deck());
			}
			else
			{
				label = "Invalid username or password.";
			}
		}
	}

	IEnumerator Get_Deck()
	{
		string URL_1 = this.deck_URL + "?username=" + username + "&deck=1";
		WWW deck_reader = new WWW(URL_1);
		yield return deck_reader;
		if (deck_reader.error != null) 
		{
			label = "Error connecting to database server.";
		}
		else
		{
			if(deck_reader.text == "nope")
			{
				label = "Failed to find deck.";
			}
			else
			{
				deck1 = deck_reader.text;
			}
		}
		string URL_2 = this.deck_URL + "?username=" + username + "&deck=2";
		deck_reader = new WWW(URL_2);
		yield return deck_reader;
		if (deck_reader.error != null) 
		{
			label = "Error connecting to database server.";
		}
		else
		{
			if(deck_reader.text == "nope")
			{
				label = "Failed to find deck.";
			}
			else
			{
				deck2 = deck_reader.text;
				GameObject deck1_object = Instantiate(Resources.Load("deck")) as GameObject;
				deck1_object.GetComponent("networked_deck").SendMessage("Create", new string[]{deck1, username, password});
				GameObject.DontDestroyOnLoad(deck1_object);

				GameObject deck2_object = Instantiate(Resources.Load("deck")) as GameObject;
				deck2_object.GetComponent("networked_deck").SendMessage("Create", new string[]{deck2, username, password});
				deck2_object.tag = "deck_2";
				GameObject.DontDestroyOnLoad(deck2_object);

				Debug.Log (deck2);
				Application.LoadLevel("Main_Menu"); 
			}
		}
	}
}