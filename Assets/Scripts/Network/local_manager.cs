using UnityEngine;
using System.Collections;

public class local_manager : MonoBehaviour 
{

	// Use this for initialization
	void Start () 
	{
		Camera.main.transform.rotation *= Quaternion.Euler(0, 0, 180);
		GameObject player1_area = (GameObject)Instantiate (Resources.Load ("local_hand_area"), new Vector3 (0, 0, 15), Quaternion.identity);
		player1_area.tag = "hand_area";
		player1_area.GetComponent<Renderer>().material.color = Color.gray;
		player1_area.GetComponent("Play_Area").SendMessage("Set_Player_Id", 1);

		GameObject player = (GameObject)Instantiate (Resources.Load ("local_hero_object"), new Vector3 (0, 1, 0), Quaternion.identity);
		player.GetComponent("Hero").SendMessage("Set_Player", 1);
		GameObject computer = (GameObject)Instantiate (Resources.Load ("computer_object"), new Vector3 (0, 1, 0), Quaternion.identity);
		computer.GetComponent("Hero").SendMessage("Set_Player", 2);

		GameObject player2_area = (GameObject)Instantiate (Resources.Load ("local_hand_area"), new Vector3 (0, 0, -15), Quaternion.identity);
		player2_area.tag = "op_hand_area";
		player2_area.GetComponent<Renderer>().material.color = Color.red;
		player2_area.GetComponent("Play_Area").SendMessage("Set_Player_Id", 2);
	}
	
	// Update is called once per frame
	void Update () 
	{
	
	}
}
