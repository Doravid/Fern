class Level {
  constructor(npc_array, image, connections, words) {
    this.npc_array = npc_array;
    this.image = image;
    this.connections = connections;
    this.words = words;
    this.isFinished = false;
    this.items = [];
  }
}
class Connections {
  constructor(up, down, left, right) {
    this.up = up;
    this.down = down;
    this.left = left;
    this.right = right;
  }
}
class Item {
  constructor(image, position) {
    this.position = position;
    this.image = image;
    this.texture;
    this.enabled = true;
  }
}

let wordLists = [
  //Level 0
  [
    {
      vn: "Chào",
      eng: "Hi",
    },
    {
      vn: "Tôi",
      eng: "I",
    },
    {
      vn: "Bạn",
      eng: "You",
    },
  ],
  //Level 1
  [
    {
      vn: "Một",
      eng: "One",
    },
    {
      vn: "Hai",
      eng: "Two",
    },
    {
      vn: "Ba",
      eng: "Three",
    },
  ],
  //Level 2
  [
    {
      vn: "Không",
      eng: "No",
    },
    {
      vn: "Muốn",
      eng: "Want",
    },
  ],
];
let items = [
  new Item("https://www.dev-fern.com/mot.png", vec2(-0.6, 0.1)),
  new Item("https://www.dev-fern.com/hai.png", vec2(-0.6, -0.2)),
  new Item("https://www.dev-fern.com/ba.png", vec2(-0.6, -0.5)),
];

let dialogues = [
  // NP1 - Level 0
  [
    "Hi",
    "Chào",
    "Chào?",
    "Tôi muốn một bánh mì",
    "I need to see the plane behind you",
    "*block your way* Tôi muốn một bánh mì",
  ],

  // NPC 2 - Level 0
  ["Hi!", "Chào bạn. Tôi là Emma"],

  // NPC 3 - Level 1
  ["Chào bạn", "Chào bạn, tôi muốn 3"],

  // NPC 4 (the banh mi person) - Level 1
  [
    "Can I have a bánh mì?",
    "Tôi không hiểu.",
    "Me: Me. That bánh mì thing.",
    "*refuses to talk*",
  ],

  // NPC 5 - Level 2
  ["Chào bạn!", "Chào. Bạn muốn nước?", "Không Muốn (n) / Muốn (y)"],
  // Then question

  // NPC 4 (the banh mi person) - Final puzzle
  ["Chào bạn.", "Chào bạn.", "Tôi muốn một bánh mì.", "Bánh mì của bạn đây."],
  // Then puzzle

  ["Bánh mì bạn.", "Bánh mì tôi *unblocks your way*", "Yay!"],
];

function loadLevels() {
  let levels = [];
  //NPCS
  const steve = new Npc(
    dialogues[0],
    0,
    "https://www.dev-fern.com/character.png",
    vec2(-0.5, 0),
    "steve"
  );
  const jeff = new Npc(
    dialogues[3],
    0,
    "https://www.dev-fern.com/npc3.png",
    vec2(0.5, 0.5),
    "jeff"
  );
  const numberGuy = new Npc(
    dialogues[2],
    0,
    "https://www.dev-fern.com/npc.png",
    vec2(0.4, -0.5),
    "number"
  );
  const waterGuy = new Npc(
    dialogues[4],
    0,
    "https://www.dev-fern.com/npc5.png",
    vec2(0.4, -0.5),
    "water"
  );
  const girl = new Npc(
    dialogues[1],
    0,
    "https://www.dev-fern.com/npc4.png",
    vec2(0.4, 0.5),
    "emma"
  );
  const me = new Npc(
    ["Hi", "Chào Bạn, tôi là David"],
    0,
    "https://www.dev-fern.com/me.png",
    vec2(0.57, 0.4),
    "emma"
  );
  //Levels
  levels.push(
    new Level(
      [steve, girl, me],
      "https://www.dev-fern.com/Untitled.png",
      new Connections(1, -1, -1, -1),
      wordLists[0]
    )
  );

  levels.push(
    new Level(
      [jeff, numberGuy],
      "https://www.dev-fern.com/map2.png",
      new Connections(-1, 0, -1, 2),
      wordLists[1]
    )
  );
  levels.push(
    new Level(
      [waterGuy],
      "https://www.dev-fern.com/map3.png",
      new Connections(-1, -1, 1, -1),
      wordLists[2]
    )
  );
  levels[1].items = items;

  return levels;
}
