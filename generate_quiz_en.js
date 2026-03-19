const fs = require('fs');
const path = require('path');

const adjectives = ["innovative", "scalable", "secure", "decentralized", "advanced", "next-gen", "high-speed", "robust", "transparent", "efficient", "revolutionary", "seamless"];
const components = ["consensus mechanism", "smart contract platform", "node architecture", "data layer", "network protocol", "wallet integration", "bridge system", "staking module", "governance model", "validator network", "ecosystem", "tokenomics"];
const processes = ["transaction validation", "cross-chain communication", "data execution", "privacy preservation", "yield generation", "asset management", "liquidity provisioning", "identity verification", "token distribution", "network security", "user onboarding"];
const qualities = ["maximum security", "high scalability", "low latency", "cost-efficiency", "complete transparency", "user privacy", "immutable records", "censorship resistance", "energy efficiency", "fair distribution"];

const validAnswersType1 = [
    "Through decentralized nodes", 
    "By utilizing advanced cryptography", 
    "Via automated smart contracts", 
    "Through continuous network consensus",
    "By leveraging state-of-the-art blockchain technology",
    "Through community-driven governance"
];

const invalidAnswersType1 = [
    "By using manual paper records", 
    "Through centralized corporate servers", 
    "By asking the CEO for permission", 
    "Through unencrypted data transfer", 
    "By relying on single points of failure", 
    "Through outdated legacy systems",
    "By storing data in plain text",
    "Through a traditional bank database"
];

const validAnswersType2 = [
    "Its ability to process transactions rapidly", 
    "Its focus on user sovereignty", 
    "The elimination of high gas fees", 
    "Its seamless interoperability across chains",
    "The highly secure validation process",
    "Its truly decentralized nature"
];

const invalidAnswersType2 = [
    "It is controlled by a single bank", 
    "It requires weeks to settle transactions", 
    "It charges massive hidden fees", 
    "It blocks user access randomly",
    "It depends on a single computer to work",
    "It closes on weekends"
];

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

const quizzes = [];
const TARGET_COUNT = 2050;
let idCounter = 1;

while (quizzes.length < TARGET_COUNT) {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const comp = components[Math.floor(Math.random() * components.length)];
    const proc = processes[Math.floor(Math.random() * processes.length)];
    const qual = qualities[Math.floor(Math.random() * qualities.length)];

    // Randomly choose between Type 1 and Type 2 templates
    const isType1 = Math.random() > 0.5;

    let sentence = "";
    let validAnswer = "";
    let invalidAnsList = [];

    if (isType1) {
        // "How does the BILLIONS.NETWORK {component} ensure {quality} in its {process}?"
        sentence = `How does the BILLIONS.NETWORK ${comp} ensure ${qual} during ${proc}?`;
        validAnswer = getRandom(validAnswersType1, 1)[0];
        invalidAnsList = getRandom(invalidAnswersType1, 3);
    } else {
        // "What makes the {adjective} {component} of BILLIONS.NETWORK stand out for {process}?"
        sentence = `What makes the ${adj} ${comp} of BILLIONS.NETWORK stand out for ${proc}?`;
        validAnswer = getRandom(validAnswersType2, 1)[0];
        invalidAnsList = getRandom(invalidAnswersType2, 3);
    }

    const options = [validAnswer, ...invalidAnsList];
    const shuffledOptions = shuffle([...options]);

    const quizObj = {
        id: idCounter,
        question: sentence,
        options: shuffledOptions,
        answer: validAnswer
    };

    // Check duplicates
    const exists = quizzes.some(q => q.question === quizObj.question && q.answer === quizObj.answer);
    if (!exists) {
        quizzes.push(quizObj);
        idCounter++;
    }
}

const outputPath = path.join(__dirname, 'public', 'quiz_data.js');
const fileContent = 'window.QUIZ_DATA = ' + JSON.stringify(quizzes, null, 2) + ';';

fs.writeFileSync(outputPath, fileContent, 'utf8');
console.log(`Successfully generated ${quizzes.length} English quiz questions about BILLIONS.NETWORK into ${outputPath}`);
