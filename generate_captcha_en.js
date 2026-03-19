const fs = require('fs');
const path = require('path');

const names = ["Alex", "Sarah", "John", "Emma", "Michael", "Olivia", "James", "Sophia", "David", "Isabella", "Daniel", "Mia"];
const contexts = [
    {
        place: "the supermarket to buy",
        valid: ["apples", "bananas", "bread", "milk", "tomatoes", "potatoes", "meat", "chicken", "fish", "juice", "water", "cheese", "eggs"],
        invalid: ["a spaceship", "the moon", "a dinosaur", "clouds", "stars", "the sun", "a planet", "a mountain", "an ocean", "a dragon"]
    },
    {
        place: "the library to borrow",
        valid: ["a book", "a story", "a magazine", "a novel", "an encyclopedia", "a dictionary", "a map", "a newspaper", "a comic book"],
        invalid: ["a fish", "a rock", "an airplane", "a tree", "fire", "rain", "sand", "a mountain", "a lion"]
    },
    {
        place: "the kitchen to cook",
        valid: ["food", "chicken", "soup", "meat", "eggs", "rice", "pasta", "fish", "a cake", "vegetables"],
        invalid: ["a phone", "a closet", "clothes", "the moon", "a TV", "a car", "a window", "a computer", "a shoe"]
    },
    {
        place: "the school to learn",
        valid: ["math", "reading", "writing", "science", "history", "geography", "languages", "physics", "chemistry", "art"],
        invalid: ["how to fly", "space swimming", "eating rocks", "sleeping in water", "hunting dinosaurs", "breathing lava"]
    },
    {
        place: "the garden to plant",
        valid: ["a rose", "a tree", "a plant", "a flower", "seeds", "trees", "vegetables", "herbs"],
        invalid: ["a computer", "a car", "a TV", "the moon", "a screen", "bricks", "iron", "plastic"]
    },
    {
        place: "the stadium to play",
        valid: ["soccer", "tennis", "basketball", "running", "volleyball", "gymnastics", "baseball", "rugby"],
        invalid: ["underwater chess", "deep sleep", "eating glass", "flying without wings", "building a house"]
    },
    {
        place: "the hospital to treat",
        valid: ["a cold", "a headache", "a stomachache", "a wound", "a cough", "a fever", "a broken arm", "an infection"],
        invalid: ["a broken car", "a sad moon", "TV screens", "orange juice", "a torn book"]
    },
    {
        place: "the cafe to drink",
        valid: ["coffee", "tea", "juice", "water", "warm milk", "hot chocolate", "soda", "an espresso"],
        invalid: ["sand", "gas", "rocks", "books", "wood", "nails", "glass", "dirt"]
    },
    {
        place: "the closet to wear",
        valid: ["a shirt", "pants", "a dress", "shoes", "a jacket", "a hat", "socks", "a coat", "a sweater"],
        invalid: ["a television", "a bicycle", "a cloud", "a pizza", "a building", "an airplane", "a tree"]
    },
    {
        place: "the garage to fix",
        valid: ["a car", "a bicycle", "a motorcycle", "an engine", "the tires", "the brakes", "a truck", "a scooter"],
        invalid: ["an apple", "the sun", "a cloud", "a rainbow", "a sandwich", "a dog", "a thought"]
    }
];

// Helper to get random elements
const getRandom = (arr, count) => {
    let copy = [...arr];
    let result = [];
    for(let i=0; i<count; i++) {
        let index = Math.floor(Math.random() * copy.length);
        result.push(copy[index]);
        copy.splice(index, 1);
    }
    return result;
}

const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const captchas = [];
let idCounter = 1;

// Combinatorial generation until we hit our target
const TARGET_COUNT = 1050;

while (captchas.length < TARGET_COUNT) {
    const name = names[Math.floor(Math.random() * names.length)];
    const context = contexts[Math.floor(Math.random() * contexts.length)];
    
    // Pick 1 correct answer
    const validAnswer = getRandom(context.valid, 1)[0];
    
    // Pick 3 incorrect answers
    const invalidAnswers = getRandom(context.invalid, 3);
    
    // Combine to 4 options
    const options = [validAnswer, ...invalidAnswers];
    const shuffledOptions = shuffle([...options]);
    
    const sentence = `${name} went to ${context.place} ...`;
    
    const captchaObj = {
        id: idCounter,
        sentence: sentence,
        options: shuffledOptions,
        answer: validAnswer
    };
    
    // Make sure we have no duplicate sentence+answer combinations
    const exists = captchas.some(c => c.sentence === captchaObj.sentence && c.answer === captchaObj.answer);
    if (!exists) {
        captchas.push(captchaObj);
        idCounter++;
    }
}

// Slice exactly to 1050 and create JS file directly
const outputPath = path.join(__dirname, 'public', 'captcha_data.js');
const fileContent = 'window.CAPTCHA_DATA = ' + JSON.stringify(captchas, null, 2) + ';';

fs.writeFileSync(outputPath, fileContent, 'utf8');
console.log(`Successfully generated ${captchas.length} English logic questions into ${outputPath}`);
