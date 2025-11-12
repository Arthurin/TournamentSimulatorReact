import { describe, it, expect } from "vitest";
import { generateMatches } from "@/utils/matchmaking.js";

/**
 * Cas de test : un joueur (j1) a déjà joué avec j2.
 * On veut vérifier que j1 et j2 ne soient PAS remis ensemble.
 */
describe("generateMatches() - cas partenaire déjà rencontré", () => {
  it("ne doit pas remettre j1 et j2 ensemble s'ils ont déjà été partenaires", () => {
    // --- Données de départ ---
    const players = [
      {
        id: "j1",
        name: "J1",
        wins: 1,
        lastRest: false,
        pastPartners: new Set(["j2"]), // déjà joué avec j2
        pastOpponents: new Set(["j3"]),
      },
      {
        id: "j2",
        name: "J2",
        wins: 1,
        lastRest: false,
        pastPartners: new Set(["j1"]), // déjà joué avec j1
        pastOpponents: new Set(["j4"]),
      },
      {
        id: "j3",
        name: "J3",
        wins: 1,
        lastRest: false,
        pastPartners: new Set(),
        pastOpponents: new Set(["j1"]),
      },
      {
        id: "j4",
        name: "J4",
        wins: 1,
        lastRest: false,
        pastPartners: new Set(),
        pastOpponents: new Set(["j2"]),
      },
    ];

    // --- Génération des matchs ---
    const result = generateMatches(players, 1); // 1 terrain → 4 joueurs actifs max

    expect(result.matches).toHaveLength(1);

    const match = result.matches[0];

    // On extrait les équipes sous forme de tableau d'IDs
    const teamA = match.teamA.map((p) => p.id);
    const teamB = match.teamB.map((p) => p.id);

    console.log("🧩 Match généré :", teamA, "vs", teamB);

    // --- Vérification : j1 et j2 ne doivent PAS être dans la même équipe ---
    const sameTeam =
      (teamA.includes("j1") && teamA.includes("j2")) ||
      (teamB.includes("j1") && teamB.includes("j2"));

    expect(sameTeam).toBe(false);
  });
});
