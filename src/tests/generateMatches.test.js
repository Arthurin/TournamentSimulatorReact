import { generateMatches, validateRound } from "@/utils/matchmaking.js";
import { describe, it, expect } from "vitest";

function makePlayers(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    name: `Joueur ${i + 1}`,
    wins: 0,
    restCount: 0,
    restedLastRound: false,
    pastPartners: new Set(),
    partnersHistory: {},
  }));
}

describe("generateMatches() Gestion des pauses", () => {
  it("les joueurs au repos au round précédent doivent jouer le round suivant", () => {
    const players = makePlayers(10);

    // Simule un round précédent où 2 joueurs étaient au repos
    players[8].restedLastRound = true;
    players[9].restedLastRound = true;
    players[8].restCount = 1;
    players[9].restCount = 1;

    const { matches, resting } = generateMatches(players, 2); // 2 terrains → 8 joueurs actifs

    const activeIds = matches.flatMap((m) => [
      ...m.teamA.map((p) => p.id),
      ...m.teamB.map((p) => p.id),
    ]);
    const restingIds = resting.map((p) => p.id);

    // Vérifie que ceux qui se reposaient jouent cette fois-ci
    expect(activeIds).toEqual(expect.arrayContaining([9, 10]));

    // Et qu'ils ne sont PAS encore au repos
    expect(restingIds).not.toEqual(expect.arrayContaining([9, 10]));
  });

  it("les joueurs au plus fort restCount doivent être prioritairement au repos", () => {
    const players = makePlayers(12);

    // Simule un historique de repos
    players[0].restCount = 3; // a beaucoup reposé
    players[1].restCount = 2;
    players[2].restCount = 1;
    players[3].restCount = 0;
    players[4].restCount = 0;
    players[5].restCount = 0;
    players[6].restCount = 0;
    players[7].restCount = 0;
    players[8].restCount = 0;
    players[9].restCount = 0;
    players[10].restCount = 0;
    players[11].restCount = 0;

    const { resting } = generateMatches(players, 2); // 8 joueurs actifs, 4 au repos

    // Les joueurs ayant le plus de repos ne doivent PAS être choisis pour reposer
    const restingIds = resting.map((p) => p.id);
    expect(restingIds).not.toEqual(expect.arrayContaining([1, 2, 3]));
  });

  it("mettre en repos 4 joueurs pour 2 terrains (8 joueurs actifs sur les 12)", () => {
    const players = makePlayers(12);
    const { resting } = generateMatches(players, 2);

    expect(resting.length).toBe(4);
  });

  it("chaque match doit contenir 4 joueurs distincts répartis en 2 équipes", () => {
    const players = makePlayers(8);
    const { matches } = generateMatches(players, 2);

    for (const m of matches) {
      const allPlayers = [...m.teamA, ...m.teamB];
      const uniqueIds = new Set(allPlayers.map((p) => p.id));
      expect(uniqueIds.size).toBe(4);
    }
  });
});

describe("validateRound()", () => {
  it("ajoute correctement une entrée dans roundHistory pour chaque joueur", () => {
    // --- Données d'entrée simulées ---
    const players = [
      { id: "j1", name: "j1", restCount: 0, roundHistory: [] },
      { id: "j2", name: "j2", restCount: 0, roundHistory: [] },
      { id: "j3", name: "j3", restCount: 0, roundHistory: [] },
      { id: "j4", name: "j4", restCount: 0, roundHistory: [] },
      { id: "j5", name: "j5", restCount: 0, roundHistory: [] },
    ];

    const matchResults = {
      matches: [
        {
          teamA: [
            { id: "j1", name: "j1" },
            { id: "j2", name: "j2" },
          ],
          teamB: [
            { id: "j3", name: "j3" },
            { id: "j4", name: "j4" },
          ],
          winner: "A", // j1 et j2 gagnent
        },
      ],
      resting: [{ id: "j5", name: "j5" }],
    };

    // --- Appel de la fonction ---
    const updatedPlayers = validateRound(players, matchResults);

    // --- Vérifications ---
    const j1 = updatedPlayers.find((p) => p.id === "j1");
    const j2 = updatedPlayers.find((p) => p.id === "j2");
    const j3 = updatedPlayers.find((p) => p.id === "j3");
    const j4 = updatedPlayers.find((p) => p.id === "j4");
    const j5 = updatedPlayers.find((p) => p.id === "j5");

    // ✅ Chaque joueur a bien un historique d'un round
    expect(j1.roundHistory).toHaveLength(1);
    expect(j5.roundHistory).toHaveLength(1);

    // ✅ Victoire de j1 et j2
    expect(j1.roundHistory[0]).toMatchObject({
      partner: "j2",
      opponents: ["j3", "j4"],
      won: true,
      result: "win",
    });

    expect(j2.roundHistory[0]).toMatchObject({
      partner: "j1",
      opponents: ["j3", "j4"],
      won: true,
      result: "win",
    });

    // ✅ Défaite de j3 et j4
    expect(j3.roundHistory[0]).toMatchObject({
      partner: "j4",
      opponents: ["j1", "j2"],
      won: false,
      result: "loss",
    });

    expect(j4.roundHistory[0]).toMatchObject({
      partner: "j3",
      opponents: ["j1", "j2"],
      won: false,
      result: "loss",
    });

    // ✅ Joueur au repos
    expect(j5.roundHistory[0]).toMatchObject({
      result: "rest",
      partner: null,
      opponents: [],
      won: false,
    });

    // ✅ Rest count bien incrémenté
    expect(j5.restCount).toBe(1);
    expect(j1.restCount).toBe(0);
  });
});
