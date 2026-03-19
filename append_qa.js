const fs = require('fs');
const path = require('path');

const textInput = `What is the TGE of Billions Network? → Not officially announced yet
When will the Billions Network token launch? → Date is unknown
Has the token price been set? → No, not disclosed
Will the token be tradable immediately? → Most likely yes after TGE
Will it be listed on major exchanges? → Expected but not confirmed
Will tokens be distributed to users? → Yes, via airdrop
Is there a vesting schedule? → Likely yes
Is the project backed by investors? → Yes, VC-backed
Can TGE be delayed? → Yes
Is the project official? → Yes
Is there an airdrop? → Yes
How can I get the airdrop? → By participating on the platform
Is registration free? → Yes
Are points important? → Very important
Does referral increase rewards? → Yes
Is the airdrop guaranteed? → No
Can I earn without investing? → Yes
Is this project similar to LayerZero? → Somewhat
Should I be active daily? → Recommended
Does activity affect distribution? → Yes
What is Billions Network? → A Web3 project
Is it an AI project? → Partially
Is it a blockchain? → Not directly
Is it trustworthy? → Appears so
Does it have an official website? → Yes
Is KYC required? → Not confirmed
Is it a new project? → Yes
Does it have a community? → Yes
Is the project popular? → Starting to grow
Can it succeed? → Possible
Can I earn from it? → Yes
How much can I earn? → Unknown
Is earning guaranteed? → No
Does it depend on luck? → Partially
Does it require time? → Yes
Can earnings be large? → Possible
Is early participation better? → Yes
Can I waste my time? → Yes
Is it similar to previous airdrops? → Yes
Is it worth trying? → Yes
Should I use referrals? → Yes
Should I invite friends? → Yes
Should I be active daily? → Yes
Should I follow news updates? → Yes
Should I use multiple accounts? → Risky
Does the system detect cheating? → Most likely
Is one strong account better? → Yes
Should I interact on Discord? → Useful
Is Twitter important? → Yes
Does engagement increase chances? → Yes
Is the project guaranteed? → No
Can it fail? → Yes
Could it be a scam? → Not confirmed
Should I be cautious? → Yes
Should I connect my wallet? → Yes
Is there risk to my wallet? → Possible
Should I use a new wallet? → Recommended
Can accounts be hacked? → If not careful
Should I never share keys? → Yes
Is the project 100% safe? → No
Is the project global? → Yes
Can anyone join from any country? → Yes
Do I need a VPN? → Usually no
Is there an app? → Mostly Web-based
Does it require experience? → No
Is it beginner-friendly? → Yes
Does it require capital? → No
Does it have competitors? → Yes
Does it use Web3? → Yes
Does it have a future? → Possible
Is engagement important? → Yes
Are comments useful? → Yes
Are likes important? → Slightly
Is posting content helpful? → Yes
Can I earn via Twitter? → Yes
Is Discord useful? → Yes
Is Telegram useful? → Sometimes
Is daily activity important? → Yes
Is consistency important? → Very much
Does inactivity affect rewards? → Yes
Can the token reach a high price? → Possible
Is the project hyped? → Yes
Is it worth waiting? → Yes
Will it achieve major success? → Unknown
Is it similar to zkSync? → Somewhat
Will it give rewards like Starknet? → Maybe
Is TGE soon? → Unclear
Can it be announced suddenly? → Yes
Should I prepare? → Yes
Can it be sold quickly? → Yes
Should I be patient? → Yes
Should I avoid rushing? → Yes
Should I diversify my projects? → Yes
Should I follow updates? → Yes
Should I ignore rumors? → Yes
Should I learn about the project? → Yes
Should I analyze the project? → Yes
Should I be careful with links? → Yes
Should I use a secure wallet? → Yes
Is Billions Network an opportunity? → Yes 🔥`;

const dataFile = path.join(__dirname, 'crypto_airdrops_5k.json');
let aiData = [];

try {
  aiData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
} catch(e) {
  console.error("Could not read file", e);
}

const lines = textInput.split('\n');
let maxId = aiData.length > 0 ? Math.max(...aiData.map(i => i.id)) : Date.now();

let added = 0;
for (let line of lines) {
  if (!line.includes('→')) continue;
  let parts = line.split('→');
  let q = parts[0].trim().toLowerCase();
  let a = parts[1].trim();
  
  if (q && a) {
    maxId++;
    aiData.push({ id: maxId, q: q, a: a });
    added++;
  }
}

fs.writeFileSync(dataFile, JSON.stringify(aiData, null, 2));
console.log(`Successfully added ${added} new Q&A pairs to ${dataFile}`);
