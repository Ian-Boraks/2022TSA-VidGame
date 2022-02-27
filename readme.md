<h1 align="center"><a href="https://TSAVideoGame2022.github.io/2022TSA-VidGame/" target="_blank">2022TSA VidGame</a></h1>

<p align="center">
  <img alt="Github top language" src="https://img.shields.io/github/languages/top/TSAVideoGame2022/2022tsa-vidgame?color=56BEB8">

  <img alt="Github language count" src="https://img.shields.io/github/languages/count/TSAVideoGame2022/2022tsa-vidgame?color=56BEB8">

  <img alt="Repository size" src="https://img.shields.io/github/repo-size/TSAVideoGame2022/2022tsa-vidgame?color=56BEB8">

<p>
<!-- Status -->

<h4 align="center"> 
	2022TSA VidGame 🚀 Museum Runner <br>
	Third Place 🥉 at COTSA 2022 <br><br>
</h4> 

# CONTROLS #

A, S, D, SPACE

`A`: Moves the player to the `left`<br>
`D`: Moves the player to the `right`<br>
`S`: Makes the player `crouch` (_reduces hitbox by 1/2_)<br>
`SPACE`: Makes the player `jump`<br>

# DIFFERENT OBJECTS #
Lava: If touched, it will force you to respawn and you will loose some time/score<br>
![image](https://user-images.githubusercontent.com/31255827/151719798-dd195b24-5c72-4337-ade1-b1c5bb7c019c.png)

Ladder: If touched, the player will accelerate upwards<br>
![image](https://user-images.githubusercontent.com/31255827/151719825-b609caaf-21d3-44cc-93d5-b3c637674d6a.png)

Background: This object has no collision on it and can be walked through <br>
![image](https://user-images.githubusercontent.com/31255827/151719844-6ff740da-9a27-480d-a081-0dd2e6461de2.png)

Tokens: If touched, they will disapear and the player will gain time/score<br>
![image](https://user-images.githubusercontent.com/31255827/151719858-1042432c-e43a-4cc3-8a4a-f6cb1f5dfd94.png)

Stair: The user will automatically walk up them<br>
![image](https://user-images.githubusercontent.com/31255827/151719963-a38158a4-3a27-426c-bd7e-0d1d00d811f9.png)

Ground: Is a solid object with collision<br>
![image](https://user-images.githubusercontent.com/31255827/151719916-9396a38a-a306-4479-b833-69a71e0e0abf.png)

## HOW TO WALL JUMP ##
To wall jump, the player must jump towards a wall and while touching it they press the opposite directional key while holding space.

### Example 1 (Basic Wall Jump):
Hold `SPACE` and `A` <br>
![image](https://user-images.githubusercontent.com/31255827/151717869-298d6454-e4cf-49f8-8106-f213ff22000b.png)

At apex of jump, continue holding `SPACE`, release `A` and press `D`<br>
![image](https://user-images.githubusercontent.com/31255827/151717889-e9856e28-d8c9-4890-8e4e-6cf4d0d4209a.png)

### Example 2 (Chained Wall Jump)
Hold `SPACE` and `D` <br>
![image](https://user-images.githubusercontent.com/31255827/151718074-c5106ed1-1eed-4659-b552-987fe20f736e.png)

At apex of jump, continue holding `SPACE`, release `D` and press `A`<br>
![image](https://user-images.githubusercontent.com/31255827/151718080-c2f66892-95b4-4b91-b944-fad86acf7f28.png)

Once colliding with the next wall, continue holding `SPACE`, release `A` and press `D`<br>
![image](https://user-images.githubusercontent.com/31255827/151718082-69e1467b-7f08-4b8b-a2b2-95f62e6bcc94.png)

Repeat to climb up the wall<br>
![image](https://user-images.githubusercontent.com/31255827/151718091-1bd8c746-69a6-437d-95f7-a15d1426b85b.png)


# EDITOR #
To use the editor, hit the `enter` key while focused on the game window. (_To exit the editor, hit the `enter` key a second time_)

It should look somthing like this:
![editor example](https://user-images.githubusercontent.com/31255827/151484155-7a9e8f04-0242-415c-adff-8eab5b82d58d.png)

To change which type of object your are making, use the number keys on your keyboard.

The number and corresponding object type is listed below:
1. Ladder
2. Trap
3. Token
4. Solid Ground
5. Stairs
6. Background Element 

Once you have your object type selected, click and drag on the game canvas to create the object. 
If you want to change the snapping of the editor use `[` and `]` to either decresee or increase the grid size by 5.
The current size of the snapping grid is shown at the end of the second line of the editor text box.
(_You can also undo the last placed object by using `ctrl` + `z`_)

After every block is placed (or removed), a JSON string similar to the one below will be copied to your clipboard automatically. 
This string is used in the `assets/json/map.json` file to store the map data. (_This JSON will also be output to the console on exiting the editor_)
```
[
    {
        "width": 140,
        "height": 140,
        "initPosx": 385,
        "initPosy": 315,
        "styles": [
            "draw",
            "#2370db"
        ],
        "types": [
            "ladder"
        ]
    },
    {
        "width": 105,
        "height": 140,
        "initPosx": 595,
        "initPosy": 385,
        "styles": [
            "img",
            "trap",
            "idle"
        ],
        "types": [
            "trap"
        ]
    }
]
```

# DEBUG #
Hit the `shift` key to enter debug mode, press it again to disable. (_ONLY WORKS IN EDITOR MODE_)

