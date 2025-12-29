#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const input = process.argv[2];
if (!input) {
  console.error('Usage: node checkQualify.js "3E,3J,..."');
  process.exit(2);
}

const tokens = input.split(',').map(s => s.trim()).filter(Boolean).map(s => s.toUpperCase());
const file = path.join(__dirname, 'group_combo.json');
let combos;
try {
  combos = JSON.parse(fs.readFileSync(file, 'utf8'));
} catch (e) {
  console.error('Failed to read group_combo.json:', e.message);
  process.exit(1);
}

function normalize(arr) {
  return arr.map(s => s.toUpperCase()).slice().sort().join(',');
}

const target = normalize(tokens);
for (const row of combos) {
  const vals = Object.keys(row).filter(k => k !== 'Option').map(k => String(row[k]));
  if (normalize(vals) === target) {
    console.log('Match found. Option:', row.Option);
    console.log('Mapping:', JSON.stringify(row, null, 2));
    process.exit(0);
  }
}

console.log('No match for tokens:', tokens);
process.exit(0);
