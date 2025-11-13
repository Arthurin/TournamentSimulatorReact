// tests/matchmaking.repos.test.js
import { describe, it, expect } from "vitest";
import { generateMatches } from "@/utils/matchmaking.js";

function createPlayers(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    name: `j${i + 1}`,
    wins: 0,
    restCount: 0,
    restedLastRound: false,
    pastPartners: new Set(),
    partnersHistory: {},
  }));
}

function simulateRounds(generateFn, players, rounds = 10, nbCourts = 3) {
  let current = players.map((p) => ({ ...p }));

  for (let r = 0; r < rounds; r++) {
    const { resting } = generateFn(current, nbCourts);
    const restingIds = new Set(resting.map((p) => p.id));

    current = current.map((p) => ({
      ...p,
      restedLastRound: restingIds.has(p.id),
      restCount: restingIds.has(p.id)
        ? (p.restCount || 0) + 1
        : p.restCount || 0,
    }));

    const counts = current.map((p) => p.restCount);
    console.log(`Round ${r + 1}:`, counts.join(" "));
  }

  return current;
}

describe("Matchmaking repos équilibré", () => {
  it("devrait équilibrer les repos avec la version corrigée", () => {
    const players = createPlayers(9);
    const result = simulateRounds(generateMatches, players, 12, 3);

    const restCounts = result.map((p) => p.restCount);
    const min = Math.min(...restCounts);
    const max = Math.max(...restCounts);

    console.log("Repos finaux :", restCounts);
    expect(max - min).toBeLessThanOrEqual(1);
  });
});
