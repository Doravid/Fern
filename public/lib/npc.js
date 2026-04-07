class Npc {
  constructor(dialogues, iterator, image, position, id) {
    // Dialouges' variables
    this.dialogues = dialogues;
    this.iterator = iterator; // just an int to keep track of current dialog
    this.position = position;

    this.image = image;
    this.id = id;
    this.texture;
  }
}
