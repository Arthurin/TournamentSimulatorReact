import { describe, it, expect } from "vitest";
import { generateMatches } from "@/utils/matchmaking.js";

/**
 * Fabrique un joueur factice pour les tests
 */
function makePlayer(
  id,
  wins = 0,
  partners = [],
  opponents = [],
  lastRest = false
) {
  return {
    id,
    name: id,
    wins,
    pastPartners: new Set(partners),
    pastOpponents: new Set(opponents),
    lastRest,
  };
}

describe("generateMatches()", () => {
  it("génère des matchs corrects pour 8 joueurs", () => {
    const players = [
      makePlayer("j1"),
      makePlayer("j2"),
      makePlayer("j3"),
      makePlayer("j4"),
      makePlayer("j5"),
      makePlayer("j6"),
      makePlayer("j7"),
      makePlayer("j8"),
    ];

    const { matches, resting } = generateMatches(players, 2); // 2 terrains = 8 joueurs

    expect(matches.length).toBe(2);
    expect(resting.length).toBe(0);

    for (const match of matches) {
      expect(match.teamA.length).toBe(2);
      expect(match.teamB.length).toBe(2);
    }
  });

  it("met au repos les joueurs surnuméraires quand > 28 joueurs", () => {
    const players = Array.from({ length: 30 }, (_, i) =>
      makePlayer(`j${i + 1}`)
    );
    const { matches, resting } = generateMatches(players, 7); // 7 terrains = 28 joueurs

    expect(matches.length).toBe(7);
    expect(resting.length).toBe(2);
  });

  it("met au repos les joueurs quand le total n’est pas un multiple de 4", () => {
    const players = [
      makePlayer("j1"),
      makePlayer("j2"),
      makePlayer("j3"),
      makePlayer("j4"),
      makePlayer("j5"),
      makePlayer("j6"),
    ]; // 6 joueurs

    const { matches, resting } = generateMatches(players, 2);

    expect(matches.length).toBe(1); // un seul match (4 joueurs)
    expect(resting.length).toBe(2); // 2 au repos
  });

  it("évite de rejouer avec le même partenaire", () => {
    const players = [
      makePlayer("j1", 0, ["j2"]), // déjà joué avec j2
      makePlayer("j2", 0, ["j1"]),
      makePlayer("j3", 0),
      makePlayer("j4", 0),
    ];

    const { matches } = generateMatches(players, 1);

    // j1 et j2 ne doivent pas être ensemble
    const teamA = matches[0].teamA.map((p) => p.id);
    const teamB = matches[0].teamB.map((p) => p.id);
    const allTeams = [teamA, teamB];

    const forbiddenPair = allTeams.find(
      (team) => team.includes("j1") && team.includes("j2")
    );
    expect(forbiddenPair).toBeUndefined();
  });

  it("évite deux tours de repos consécutifs si possible", () => {
    const players = [
      makePlayer("j1", 0, [], [], true), // déjà au repos
      makePlayer("j2"),
      makePlayer("j3"),
      makePlayer("j4"),
      makePlayer("j5"),
    ]; // 5 joueurs → 1 au repos

    const { resting } = generateMatches(players, 1);

    // j1 ne devrait plus être au repos
    const stillResting = resting.find((p) => p.id === "j1");
    expect(stillResting).toBeUndefined();
  });
});
