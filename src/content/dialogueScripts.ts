export const dialogueScripts = {
    intro: [
        {
         speaker: "Narrator",
         text: "You are a famous mountaineer. Your stories inspired your closest friend to go on a solo backpacking trip."

        },
        {
         speaker: "Narrator",
         text: "An avalanche hit during the trip. Your friend is missing and has lost all contact."
        },
        {
         speaker: "Narrator",
         text: "The weather is getting worse and the common trails are blocked, so you head into the mountains to find them." 
        }
    ],
    howCrossingWorks: [
        {
          speaker: "Narrator",
          text: "You will need to cross deep chasms. At each one there are a few fallen logs. Pick the one that is exactly the right length."
        },
        {
          speaker: "Narrator",
          text: "Too short and it falls into the chasm. Too long and it smashes the item your friend left on the other side."
        }
    ],
    // These are the Level done messages shown after Levels 1 and 2. GameFlow picks one from the
    // level's points through model/levelDone, which also fills in {level}, since the same words
    // serve every level.
    levelDoneAllPoints: [
        {
          speaker: "Narrator",
          text: "Congratulations! You earned all the points on Level {level}.",
          choices: ["Continue along the trail"]
        }
    ],
    // GameFlow reads the choice by its position, so restarting stays first and moving on stays second.
    levelDoneUnder100: [
        {
          speaker: "Narrator",
          text: "Do you want to restart Level {level} so you can get closer to earning your desired medal?",
          choices: ["Begin level {level} again", "Continue on to next level"]
        }
    ]
};