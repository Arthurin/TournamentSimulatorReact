import { describe, it, expect } from "vitest";
import { generateMatches, validateMatchmaking } from "@/utils/matchmaking.js";

describe("matchmaking - équilibre des victoires entre équipiers", () => {
  it("échoue si des joueurs aux victoires trop éloignées jouent ensemble (cas j8 vs j21)", () => {
    // 🧱 22 joueurs simulés
    let players = Array.from({ length: 22 }, (_, i) => ({
      id: `j${i + 1}`,
      name: `J${i + 1}`,
      wins: 0,
      restCount: 0,
      restedLastRound: false,
      pastPartners: new Set(),
      partnersHistory: {},
      pastOpponents: new Set(),
    }));

    const NB_COURTS = 6; // 24 places max (22 joueurs -> parfois du repos)

    // 🔁 Simulation sur 12 rounds
    for (let round = 1; round <= 12; round++) {
      const { matches, resting } = generateMatches(players, NB_COURTS);

      // 🎲 Attribution aléatoire d’un vainqueur par match
      for (const match of matches) {
        const winnerTeam = Math.random() < 0.5 ? match.teamA : match.teamB;
        for (const winner of winnerTeam) {
          winner.wins += 1;
        }

        // Historique partenaires / adversaires
        for (const team of [match.teamA, match.teamB]) {
          const opponents = team === match.teamA ? match.teamB : match.teamA;
          for (const player of team) {
            const partner = team.find((p) => p !== player);
            if (partner) {
              player.pastPartners.add(partner.id);
              player.partnersHistory[partner.id] =
                (player.partnersHistory[partner.id] || 0) + 1;
            }
            for (const opp of opponents) {
              player.pastOpponents.add(opp.id);
            }
          }
        }
      }

      // ✅ Validation du round
      players = validateMatchmaking(players, { matches, resting });

      // Log pour debug
      console.log(
        `Round ${round}: ${players.map((p) => `${p.id}(${p.wins})`).join(" ")}`
      );
    }

    // 🧩 Vérifie la cohérence des équipes : pas d’écart > 3 entre équipiers
    const { matches } = generateMatches(players, NB_COURTS);

    let foundLargeGap = false;

    for (const match of matches) {
      const allPlayers = [...match.teamA, ...match.teamB];
      const wins = allPlayers.map((p) => p.wins);
      const max = Math.max(...wins);
      const min = Math.min(...wins);
      const gap = max - min;

      if (gap > 3) {
        console.log(
          `⚠️  Écart trop grand détecté dans un match : joueurs ${allPlayers
            .map((p) => `${p.id}(${p.wins})`)
            .join(", ")}`
        );
        foundLargeGap = true;
      }
    }

    // ❌ Ce test doit échouer avec le code actuel
    expect(foundLargeGap).toBe(false);
  });
});
