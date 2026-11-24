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
          text: "Your friend left markers on the trail to help you find them. These are precious items to them that they hope you'll collect and bring to them upon your reuniting!"
        },
        {
          speaker: "Narrator",
          text: "Each item awaits you across a deep chasm. At every chasm there are a few fallen logs. Pick the one that is exactly the right length."
        },
        {
          speaker: "Narrator",
          text: "If your log choice is too short, the log falls into the chasm. If it's too long, it smashes your friend's item on the other side."
        },
        {
          speaker: "Narrator",
          text: "You may use a calculator, handheld or online, at each crossing. What matters is knowing how to find each log’s length."
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
    ],
    // Results screen dialogue
    results: [
      {
        speaker: "Narrator",
        text: "Here is how you did. Use it to see what to practice next.",
        choices: ["Play again"],
      },
    ],
}; 
