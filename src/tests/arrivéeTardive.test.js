import { describe, it, expect } from "vitest";
import { generateMatches, validateRound } from "@/utils/matchmaking.js";

// Exemple de modèle joueur
function createPlayer(name, wins) {
  return { name, wins, id: crypto.randomUUID(), restedLastRound: true };
}

describe("Tournois avec un joueur qui arrive plus tard", () => {
  it("permet de jouer même si un nouveau joueur a 0 victoires et les autres 4 victoires", () => {
    // 4 joueurs initiaux
    let players = [
      createPlayer("A", 4),
      createPlayer("B", 4),
      createPlayer("C", 4),
      createPlayer("D", 4),
    ];

    for (let round = 1; round < 9; round++) {
      const { matches, resting } = generateMatches(players, 1);

      // Simule les résultats des matchs (par exemple, l'équipe A gagne toujours)
      for (const match of matches) {
        const winner = "A"; // Simule que l'équipe A gagne
        let matchResults = matches.map((m) =>
          m === match ? { ...m, winner } : m
        );

        players = validateRound(
          players,
          {
            matches: matchResults,
            resting,
          },
          round
        );
      }
    }

    console.log("Avant l'arrivée du nouveau joueur :", players);

    // On ajoute un nouveau joueur
    const newPlayer = createPlayer("E", 0);
    players.push(newPlayer);

    console.log("Après l'arrivée du nouveau joueur :", players);

    // On demande au système les prochains joueurs
    const withNewPlayer = generateMatches(players, 2);
    console.log(
      "Nouveaux matchs avec le joueur arrivé tardivement :",
      withNewPlayer
    );

    // Simule les résultats des matchs avec le nouveau joueur
    for (const match of withNewPlayer.matches) {
      const winner = "A"; // Simule que l'équipe A gagne
      let matchResults = withNewPlayer.matches.map((m) =>
        m === match ? { ...m, winner } : m
      );

      players = validateRound(
        players,
        {
          matches: matchResults,
          resting: withNewPlayer.resting,
        },
        10
      );
    }

    console.log("Données des joueurs après validation du round", players);

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

    // Vérifie que le nouveau joueur est bien en train de jouer
    const jE = players.find((p) => p.name === "E");
    console.log("Statut du joueur arrivé tardivement :", jE);
    expect(jE.restCount).toBe(0);
  });
});

// test généré par IA pour mettre en avant le bug des deux repos consécutifs
function P(name) {
  return {
    id: name,
    name,
    wins: 0,
    games: 0,
    restCount: 0,
    restedLastRound: false,
    roundHistory: [],
  };
}

describe("Repos consécutif — le système ne doit jamais laisser un joueur se reposer 2 fois", () => {
  it("montre que la logique actuelle est cassée", () => {
    let players = [P("A"), P("B"), P("C"), P("D"), P("E")];

    // ⚠️ 1 court → 4 joueurs jouent, 1 au repos
    // On va vérifier si le même joueur repose 2 fois
    let lastResting = null;

    for (let round = 1; round <= 7; round++) {
      const { matches, resting } = generateMatches(players, 1);

      if (resting.length !== 1)
        throw new Error("Test nécessite exactement 1 joueur repos");

      const restingNow = resting[0].name;

      if (lastResting === restingNow) {
        console.log("❌ BUG : joueur au repos 2 fois:", restingNow);
        expect(restingNow).toBe("NE DEVRAIT PAS ARRIVER");
      }

      // Simule un vainqueur
      players = validateRound(players, {
        matches: matches.map((m) => ({ ...m, winner: "A" })),
        resting,
      });

      lastResting = restingNow;
    }
  });
});
