<h1 align="center"><a href="https://TSAVideoGame2022.github.io/2022TSA-VidGame/" target="_blank">2022TSA VidGame</a></h1>

<p align="center">
  <img alt="Github top language" src="https://img.shields.io/github/languages/top/TSAVideoGame2022/2022tsa-vidgame?color=56BEB8">

  <img alt="Github language count" src="https://img.shields.io/github/languages/count/TSAVideoGame2022/2022tsa-vidgame?color=56BEB8">

  <img alt="Repository size" src="https://img.shields.io/github/repo-size/TSAVideoGame2022/2022tsa-vidgame?color=56BEB8">

<p>
<!-- Status -->

<h4 align="center"> 
	🚧  2022TSA VidGame 🚀 Under construction...  🚧
</h4> 

# CONTROLS #

A, S, D, SPACE

`A`: Moves the player to the `left`<br>
`D`: Moves the player to the `right`<br>
`S`: Makes the player `crouch` (_reduces hitbox by 1/2_)<br>
`SPACE`: Makes the player `jump`<br>

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
Hit the `shift` key to enter debug mode, press it again to disable.

