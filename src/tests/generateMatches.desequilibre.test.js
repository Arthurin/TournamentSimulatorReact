import { describe, it, expect } from "vitest";
import { generateMatches } from "@/utils/matchmaking.js";

function makePlayers(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    name: `j${i + 1}`,
    wins: 0,
    restCount: 0,
    restedLastRound: false,
    pastPartners: new Set(),
    partnersHistory: {},
  }));
}

describe("Équilibrage des repos sur plusieurs rounds", () => {
  it("devrait garder un nombre de repos globalement équilibré sur plusieurs rounds", () => {
    let players = makePlayers(9);

    // On simule 10 rounds comme dans ton exemple
    for (let round = 0; round < 10; round++) {
      const { matches, resting } = generateMatches(players, 2);

      // On marque les joueurs au repos
      const restingIds = new Set(resting.map((p) => p.id));
      players = players.map((p) => ({
        ...p,
        restCount: restingIds.has(p.id)
          ? (p.restCount || 0) + 1
          : p.restCount || 0,
        restedLastRound: restingIds.has(p.id),
      }));

      // (optionnel) on pourrait aussi mettre à jour pastPartners ici
    }

    // On calcule le max et min des repos
    const restCounts = players.map((p) => p.restCount);
    const maxRest = Math.max(...restCounts);
    const minRest = Math.min(...restCounts);
    console.log(
      "Repos finaux :",
      players.map((p) => `${p.name}:${p.restCount}`).join(", ")
    );

    // ❌ Test : la différence ne doit pas dépasser 1 idéalement
    expect(maxRest - minRest).toBeLessThanOrEqual(1);
  });
});
