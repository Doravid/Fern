// let words = [
//     {
//         "vn": "Chào",
//         "eng": "Hi"
//     },
//     {
//         "vn": "Tôi",
//         "eng": "I"
//     },
//     {
//         "vn": "Bạn",
//         "eng": "You"
//     }
// ]

function dictionary(words, isFinished) {
  if (isFinished) {
    document.getElementById("actual_word_list").innerHTML = "";

    console.log(document.getElementsByClassName("word"));

    let dictionary = document.getElementById("actual_word_list");

    for (let i = 0; i < words.length; i++) {
      const newWord = document.createElement("div");
      newWord.classList.add("word");

      const newVn = document.createElement("p");
      newVn.textContent = words[i].vn;
      newVn.classList.add("wordVn");

      const newEng = document.createElement("p");
      newEng.textContent = words[i].eng;
      newEng.classList.add("wordEng");

      newWord.appendChild(newVn);
      newWord.appendChild(newEng);

      dictionary.appendChild(newWord);
      console.log(document.getElementsByClassName("word"));
    }
  } else {
    // Delete by setting the word list to nothing
    document.getElementById("actual_word_list").innerHTML = "";

    console.log(document.getElementsByClassName("word"));

    let dictionary = document.getElementById("actual_word_list");

    for (let i = 0; i < words.length; i++) {
      const newWord = document.createElement("div");
      newWord.classList.add("word");

      const newVn = document.createElement("p");
      newVn.textContent = words[i].vn;
      newVn.classList.add("wordVn");

      // const newEng = document.createElement('p');
      // newEng.textContent = words[i].eng;
      // newEng.classList.add("wordEng");

      // Create an input field for the English translation
      const newEngInput = document.createElement("input");
      newEngInput.type = "text";
      // newEngInput.placeholder = 'Type English translation...';
      newEngInput.classList.add("wordEngInput");

      newEngInput.addEventListener("blur", function () {
        if (
          newEngInput.value.trim().toLowerCase() === words[i].eng.toLowerCase()
        ) {
          newEngInput.style.borderColor = "green";
        } else {
          newEngInput.style.borderColor = "red";
        }
        validateAll(words);

      });

      newWord.appendChild(newVn);
      // newWord.appendChild(newEng);
      newWord.appendChild(newEngInput);

      dictionary.appendChild(newWord);
      console.log(document.getElementsByClassName("word"));
    }
  }
}

function validateAll(words) {
  const inputs = document.getElementsByClassName("wordEngInput");
  console.log("hi");
  let i =0;
  for (let input of inputs) {

    if (input.value.trim().toLowerCase() !== words[i].eng.toLowerCase()) {
      return false;
    }
    i++;
  }
  levelIsFinished();
  console.log("hiiii");
}

function autoFillThree(){
  let dictionary = document.getElementById("actual_word_list");
  // console.log(dictionary);
  // Remove
  const inputs = document.getElementsByClassName("word");
  inputs[inputs.length - 1].remove();


  // Add
  // console.log(dictionary);
  const newWord = document.createElement("div");
  newWord.classList.add("word");

  const newVn = document.createElement("p");
  newVn.textContent = "Ba";
  newVn.classList.add("wordVn");

  const newEng = document.createElement("p");
  newEng.textContent = "Three";
  newEng.classList.add("wordEng");

  newWord.appendChild(newVn);
  newWord.appendChild(newEng);

  dictionary.appendChild(newWord);

}