#!/usr/bin/env node
// scripts/generate_bulk_commands.js
// Generates data/commands_bulk.json with ~11500 placeholder commands distributed across provided categories.

const fs = require('fs');
const path = require('path');

const total = 11500;
const categories = {
  pairing: 6,
  user_profile: 10,
  economy: 80,
  gambling: 20,
  heist: 15,
  games: 40,
  downloads: 35,
  stickers: 20,
  group: 40,
  utility: 30,
  ai: 40,
  settings: 30,
  owner: 40,
  fun: 20,
  special: 12
};

const weightSum = Object.values(categories).reduce((a,b)=>a+b,0);

const allocations = {};
let allocated = 0;
Object.keys(categories).forEach((k, idx, arr) => {
  let n = Math.floor(total * (categories[k] / weightSum));
  // ensure at least the base number
  n = Math.max(n, categories[k]);
  allocations[k] = n;
  allocated += n;
});

// Adjust to hit exactly total by distributing remainder
let remainder = total - allocated;
const keys = Object.keys(allocations);
let i = 0;
while (remainder > 0) {
  allocations[keys[i % keys.length]] += 1;
  remainder -= 1;
  i += 1;
}

// Generate commands
const commands = [];
let globalIndex = 1;
for (const [cat, count] of Object.entries(allocations)) {
  for (let j = 1; j <= count; j++) {
    const trigger = `.${cat}_${String(j).padStart(5,'0')}`;
    const response = `[AUTO] ${cat.toUpperCase()} placeholder response #${j}. Replace with real implementation.`;
    commands.push({ trigger, category: cat, response, metadata: { generated: true, index: j } });
    globalIndex += 1;
  }
}

// Ensure unique count
console.log('Generated commands count:', commands.length);

const outDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'commands_bulk.json'), JSON.stringify(commands, null, 2));
console.log('Wrote data/commands_bulk.json');
