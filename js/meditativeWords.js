// js/meditativeWords.js

import { meditativeWords } from './wordlist.js'; // adjust path as needed

export function getRandomWord() {
  // adjust weight curve here:
  const adjustedWords = meditativeWords.map(w => ({
    ...w,
    adjustedIndex: Math.pow(w.index, 0.75)  // or 0.4, or use Math.log
  }));

  const totalWeight = adjustedWords.reduce((sum, w) => sum + w.adjustedIndex, 0);
  const rand = Math.random() * totalWeight;

  let cumulative = 0;
  for (const item of adjustedWords) {
    cumulative += item.adjustedIndex;
    if (rand < cumulative) {
      return item.word;
    }
  }

  return adjustedWords[adjustedWords.length - 1].word;
}
