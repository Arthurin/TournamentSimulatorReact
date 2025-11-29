import { describe, it, expect } from "vitest";
import { generateMatches, validateRound } from "@/utils/matchmaking.js";

// Exemple de modèle joueur
function createPlayer(name, wins, games) {
  return { name, wins, games, id: crypto.randomUUID(), lastRest: false };
}

describe("Tournois avec un joueur qui arrive plus tard", () => {
  it("permet de jouer même si un nouveau joueur a 0 victoires et les autres 4 victoires", () => {
    // 4 joueurs initiaux
    let players = [
      createPlayer("A", 4, 8),
      createPlayer("B", 4, 8),
      createPlayer("C", 4, 8),
      createPlayer("D", 4, 8),
    ];

    for (let round = 0; round < 8; round++) {
      const { matches, resting } = generateMatches(players, 1);

      // Simule les résultats des matchs (par exemple, l'équipe A gagne toujours)
      for (const match of matches) {
        const winner = "A"; // Simule que l'équipe A gagne
        let matchResults = matches.map((m) =>
          m === match ? { ...m, winner } : m
        );

        players = validateRound(players, {
          matches: matchResults,
          resting,
        });
      }
    }

    console.log("Avant l'arrivée du nouveau joueur :", players);

    // On ajoute un nouveau joueur
    const newPlayer = createPlayer("E", 0, 0);
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

      players = validateRound(players, {
        matches: matchResults,
        resting: withNewPlayer.resting,
      });
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
