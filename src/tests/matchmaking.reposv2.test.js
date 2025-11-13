import { describe, it, expect } from "vitest";
import { generateMatches, validateMatchmaking } from "@/utils/matchmaking";

describe("Matchmaking round complet", () => {
  it("génère les matchs et met à jour les repos correctement", () => {
    // Joueurs de test
    const players = [
      { id: 1, name: "j1", wins: 0, restCount: 0 },
      { id: 2, name: "j2", wins: 0, restCount: 0 },
      { id: 3, name: "j3", wins: 0, restCount: 0 },
      { id: 4, name: "j4", wins: 0, restCount: 0 },
      { id: 5, name: "j5", wins: 0, restCount: 0 },
      { id: 6, name: "j6", wins: 0, restCount: 0 },
      { id: 7, name: "j7", wins: 0, restCount: 0 },
      { id: 8, name: "j8", wins: 0, restCount: 0 },
      { id: 9, name: "j9", wins: 0, restCount: 0 },
    ];

    // Génération des matchs
    const { matches, resting } = generateMatches(players, 2); // 2 terrains => 8 joueurs max

    expect(matches.length).toBe(2); // 2 matchs générés
    expect(resting.length).toBe(1); // 1 joueur restant (j9)

    // Validation du matchmaking (incrément des repos)
    const updatedPlayers = validateMatchmaking(players, { matches, resting });

    // Vérification : le joueur restant (j9) a bien son restCount incrémenté
    const j9 = updatedPlayers.find((p) => p.id === 9);
    expect(j9.restedLastRound).toBe(true);
    expect(j9.restCount).toBe(1);

    // Les autres joueurs ont restedLastRound = false
    updatedPlayers
      .filter((p) => p.id !== 9)
      .forEach((p) => {
        expect(p.restedLastRound).toBe(false);
        expect(p.restCount).toBe(0);
      });
  });
});

describe("validateMatchmaking", () => {
  it("met correctement à jour restedLastRound et restCount", () => {
    const players = [
      { id: 1, name: "j1", restedLastRound: false, restCount: 0 },
      { id: 2, name: "j2", restedLastRound: false, restCount: 1 },
      { id: 3, name: "j3", restedLastRound: false, restCount: 2 },
    ];

    const matchResults = {
      matches: [], // pas utile pour ce test
      resting: [
        { id: 1, name: "j1" },
        { id: 3, name: "j3" },
      ],
    };

    const updatedPlayers = validateMatchmaking(players, matchResults);

    // Vérification des joueurs au repos
    const j1 = updatedPlayers.find((p) => p.id === 1);
    const j2 = updatedPlayers.find((p) => p.id === 2);
    const j3 = updatedPlayers.find((p) => p.id === 3);

    expect(j1.restedLastRound).toBe(true);
    expect(j1.restCount).toBe(1); // 0 + 1

    expect(j2.restedLastRound).toBe(false);
    expect(j2.restCount).toBe(1); // reste inchangé

    expect(j3.restedLastRound).toBe(true);
    expect(j3.restCount).toBe(3); // 2 + 1
  });
});

describe("Simulation multi-rounds avec logs détaillés", () => {
  it("simule 10 rounds et affiche les repos comme dans tes logs", () => {
    const players = Array.from({ length: 9 }, (_, i) => ({
      id: i + 1,
      name: `j${i + 1}`,
      wins: 0,
      restCount: 0,
      restedLastRound: false,
      pastPartners: new Set(),
      partnersHistory: {},
    }));

    let currentPlayers = [...players];
    const rounds = 10;

    for (let round = 1; round <= rounds; round++) {
      const { matches, resting } = generateMatches(currentPlayers, 2);

      // Mise à jour des compteurs de repos
      currentPlayers = validateMatchmaking(currentPlayers, {
        matches,
        resting,
      });

      // Affichage détaillé comme dans tes logs
      const restCounts = currentPlayers.map((p) => p.restCount);
      console.log(`Round ${round}: ${restCounts.join(" ")}`);
    }

    // Vérification rapide : tous les restCount >= 0
    currentPlayers.forEach((p) => {
      expect(p.restCount).toBeGreaterThanOrEqual(0);
    });
  });
});

describe("simulate 4 rounds - j9 resting imbalance", () => {
  it("doit détecter que j9 a trop de repos après 4 rounds", () => {
    // ⚙️ Initialisation : 9 joueurs
    let players = Array.from({ length: 9 }, (_, i) => ({
      id: `j${i + 1}`,
      name: `J${i + 1}`,
      wins: 0,
      restCount: 0,
      restedLastRound: false,
      pastPartners: new Set(),
      partnersHistory: {},
      pastOpponents: new Set(),
    }));

    const NB_COURTS = 2; // 8 joueurs actifs / 1 au repos

    // 🔁 Simule 4 rounds
    for (let round = 1; round <= 4; round++) {
      const { matches, resting } = generateMatches(players, NB_COURTS);

      // Mise à jour des partenaires et adversaires fictifs
      for (const match of matches) {
        const [teamA, teamB] = [match.teamA, match.teamB];

        // Ajout des partenaires et adversaires dans l’historique
        for (const player of teamA) {
          player.pastPartners.add(teamA.find((p) => p !== player).id);
          player.pastOpponents.add(teamB[0].id);
          player.pastOpponents.add(teamB[1].id);
        }

        for (const player of teamB) {
          player.pastPartners.add(teamB.find((p) => p !== player).id);
          player.pastOpponents.add(teamA[0].id);
          player.pastOpponents.add(teamA[1].id);
        }
      }

      // ⚙️ Applique la validation du round
      players = validateMatchmaking(players, { resting, matches });

      console.log(
        `Round ${round}: repos =`,
        players.map((p) => `${p.id}:${p.restCount}`).join(", ")
      );
    }

    // 🧪 Vérifie que j9 n’a pas été trop souvent au repos
    const j9 = players.find((p) => p.id === "j9");
    expect(j9.restCount).toBeLessThan(3);
  });
});
