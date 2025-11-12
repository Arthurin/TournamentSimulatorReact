import { describe, it, expect } from "vitest";
import { generateMatches } from "@/utils/matchmaking.js";

describe("generateMatches() - pondération adaptative", () => {
  it("évite de remettre ensemble des joueurs ayant déjà été souvent partenaires", () => {
    const players = [
      {
        id: "j1",
        name: "J1",
        wins: 1,
        pastPartners: new Set(["j2"]),
        partnersHistory: { j2: 3 }, // 3 matchs ensemble
        pastOpponents: new Set(),
        restedLastRound: false,
      },
      {
        id: "j2",
        name: "J2",
        wins: 1,
        pastPartners: new Set(["j1"]),
        partnersHistory: { j1: 3 },
        pastOpponents: new Set(),
        restedLastRound: false,
      },
      {
        id: "j3",
        name: "J3",
        wins: 1,
        pastPartners: new Set(),
        partnersHistory: {},
        pastOpponents: new Set(),
        restedLastRound: false,
      },
      {
        id: "j4",
        name: "J4",
        wins: 1,
        pastPartners: new Set(),
        partnersHistory: {},
        pastOpponents: new Set(),
        restedLastRound: false,
      },
    ];

    const { matches } = generateMatches(players, 1);

    expect(matches).toHaveLength(1);

    const match = matches[0];
    const teamAIds = match.teamA.map((p) => p.id);
    const teamBIds = match.teamB.map((p) => p.id);

    // On interdit que j1 et j2 se retrouvent ensemble (pénalité très forte)
    expect(teamAIds).not.toEqual(expect.arrayContaining(["j1", "j2"]));
    expect(teamBIds).not.toEqual(expect.arrayContaining(["j1", "j2"]));
  });

  it("Si des joueurs ont déjà joué ensemble plusieurs fois ils ont un plus gros malus que si ils ont joués ensemble une seule fois (j1 va donc jouer avec j4)", () => {
    const players = [
      {
        id: "j1",
        name: "J1",
        wins: 1,
        pastPartners: new Set(["j2", "j3"]),
        partnersHistory: { j2: 2, j3: 1 },
        pastOpponents: new Set(),
        restedLastRound: false,
      },
      {
        id: "j2",
        name: "J2",
        wins: 1,
        pastPartners: new Set(["j1"]),
        partnersHistory: { j1: 2 },
        pastOpponents: new Set(),
        restedLastRound: false,
      },
      {
        id: "j3",
        name: "J3",
        wins: 1,
        pastPartners: new Set(["j4", "j1"]),
        partnersHistory: { j4: 2, j1: 1 },
        pastOpponents: new Set(),
        restedLastRound: false,
      },
      {
        id: "j4",
        name: "J4",
        wins: 1,
        pastPartners: new Set(["j3"]),
        partnersHistory: { j3: 2 },
        pastOpponents: new Set(),
        restedLastRound: false,
      },
    ];

    const { matches } = generateMatches(players, 1);

    expect(matches).toHaveLength(1);

    const match = matches[0];

    // J1 a déjà beaucoup joué avec j2 et un peu avec j3 → il doit être apparié avec j4
    const teamWithJ1 = match.teamA.some((p) => p.id === "j1")
      ? match.teamA
      : match.teamB;

    const partnerOfJ1 = teamWithJ1.find((p) => p.id !== "j1");

    expect(partnerOfJ1.id).toBe("j4");
  });

  it("Si un joueur à joué avec tout le monde, il faut éviter celui avec qui il a joué le plus de fois. (cas complexe, tout le monde a un mauvais score avec J1, surtout J2, et en plus J2 a joué avec J4)", () => {
    const players = [
      {
        id: "j1",
        name: "J1",
        wins: 1,
        pastPartners: new Set(["j2", "j3", "j4"]),
        partnersHistory: { j2: 2, j3: 1, j4: 1 },
        pastOpponents: new Set(),
        restedLastRound: false,
      },
      {
        id: "j2",
        name: "J2",
        wins: 1,
        pastPartners: new Set(["j1", "j4"]),
        partnersHistory: { j1: 2, j4: 1 },
        pastOpponents: new Set(),
        restedLastRound: false,
      },
      {
        id: "j3",
        name: "J3",
        wins: 1,
        pastPartners: new Set(["j1", "j55", "j66"]),
        partnersHistory: { j1: 1 },
        pastOpponents: new Set(),
        restedLastRound: false,
      },
      {
        id: "j4",
        name: "J4",
        wins: 1,
        pastPartners: new Set(["j1", "j2"]),
        partnersHistory: { j1: 1, j2: 1 },
        pastOpponents: new Set(),
        restedLastRound: false,
      },
    ];

    const { matches } = generateMatches(players, 1);

    expect(matches).toHaveLength(1);

    const match = matches[0];

    // J1 a déjà beaucoup joué avec j2 → il doit être apparié avec j3 ou j4. Vu que j2 et j4 ont déjà joués ensemble alors j1 va avec j4
    const teamWithJ1 = match.teamA.some((p) => p.id === "j1")
      ? match.teamA
      : match.teamB;

    const partnerOfJ1 = teamWithJ1.find((p) => p.id !== "j1");

    expect(partnerOfJ1.id).toBe("j4");
  });
});

it("favorise les joueurs ayant déjà eu plusieurs partenaires différents (diversité)", () => {
  const players = [
    {
      id: "j1",
      name: "J1",
      wins: 1,
      pastPartners: new Set(["j2", "j3", "j4"]),
      partnersHistory: { j2: 1, j3: 1, j4: 1 },
      pastOpponents: new Set(),
      restedLastRound: false,
    },
    {
      id: "j2",
      name: "J2",
      wins: 1,
      pastPartners: new Set(["j1"]),
      partnersHistory: { j1: 1 },
      pastOpponents: new Set(),
      restedLastRound: false,
    },
    {
      id: "j3",
      name: "J3",
      wins: 1,
      pastPartners: new Set(["j1"]),
      partnersHistory: { j1: 1 },
      pastOpponents: new Set(),
      restedLastRound: false,
    },
    {
      id: "j5",
      name: "J5",
      wins: 1,
      pastPartners: new Set(),
      partnersHistory: {},
      pastOpponents: new Set(),
      restedLastRound: false,
    },
  ];

  const { matches } = generateMatches(players, 1);

  expect(matches).toHaveLength(1);

  const match = matches[0];
  const teamAIds = match.teamA.map((p) => p.id);
  const teamBIds = match.teamB.map((p) => p.id);

  const allIds = [...teamAIds, ...teamBIds];

  // Tous les joueurs doivent être appariés
  expect(allIds.sort()).toEqual(["j1", "j2", "j3", "j5"]);

  // J1 a déjà beaucoup joué avec j2 et j3 → il doit être apparié avec j5 si possible
  const teamWithJ1 = match.teamA.some((p) => p.id === "j1")
    ? match.teamA
    : match.teamB;

  const partnerOfJ1 = teamWithJ1.find((p) => p.id !== "j1");

  expect(partnerOfJ1.id).toBe("j5");
});

describe("generateMatches() - cas partenaire déjà rencontré", () => {
  it("ne doit pas remettre j1 et j2 ensemble s'ils ont déjà été partenaires", () => {
    const players = [
      {
        id: "j1",
        name: "J1",
        wins: 0,
        pastPartners: new Set(["j2"]),
        partnersHistory: { j2: 1 },
      },
      {
        id: "j2",
        name: "J2",
        wins: 0,
        pastPartners: new Set(["j1"]),
        partnersHistory: { j1: 1 },
      },
      {
        id: "j3",
        name: "J3",
        wins: 0,
        pastPartners: new Set(),
        partnersHistory: {},
      },
      {
        id: "j4",
        name: "J4",
        wins: 0,
        pastPartners: new Set(),
        partnersHistory: {},
      },
    ];

    const { matches } = generateMatches(players, 1);

    expect(matches).toHaveLength(1);
    const teamAIds = matches[0].teamA.map((p) => p.id);
    const teamBIds = matches[0].teamB.map((p) => p.id);

    // Vérifie que j1 et j2 ne sont pas dans la même équipe
    expect(teamAIds).not.toEqual(expect.arrayContaining(["j1", "j2"]));
    expect(teamBIds).not.toEqual(expect.arrayContaining(["j1", "j2"]));

    // Vérifie que les autres paires sont formées
    const allIds = [...teamAIds, ...teamBIds].sort();
    expect(allIds).toEqual(["j1", "j2", "j3", "j4"]);
  });

  it("On vérifie que la gestion des repos marche même quand les contraites des joueurs qui ont déjà joué est forte (j1 va jouer avec j4)", () => {
    const players = [
      {
        id: "j1",
        name: "J1",
        wins: 4,
        pastPartners: new Set(["j2", "j3", "j5"]),
        partnersHistory: { j2: 2, j3: 1, j5: 1 },
        pastOpponents: new Set(),
        restedLastRound: true,
      },
      {
        id: "j2",
        name: "J2",
        wins: 1,
        pastPartners: new Set(["j1"]),
        partnersHistory: { j1: 2 },
        pastOpponents: new Set(),
        restedLastRound: false,
      },
      {
        id: "j3",
        name: "J3",
        wins: 1,
        pastPartners: new Set(["j4", "j1"]),
        partnersHistory: { j4: 2, j1: 1 },
        pastOpponents: new Set(),
        restedLastRound: false,
      },
      {
        id: "j4",
        name: "J4",
        wins: 1,
        pastPartners: new Set(["j3", "j1"]),
        partnersHistory: { j3: 2, j1: 1 },
        pastOpponents: new Set(),
        restedLastRound: false,
      },
      {
        id: "j5",
        name: "J5",
        wins: 1,
        pastPartners: new Set(["j4", "j1"]),
        partnersHistory: { j4: 2, j1: 1 },
        pastOpponents: new Set(),
        restedLastRound: false,
      },
    ];

    const { matches } = generateMatches(players, 1);

    expect(matches).toHaveLength(1);

    const match = matches[0];

    // J1 a déjà joué avec tout le monde mais il s'est reposé au dernier tour donc on force son entrée
    const teamWithJ1 = match.teamA.some((p) => p.id === "j1")
      ? match.teamA
      : match.teamB;

    const partnerOfJ1 = teamWithJ1.find((p) => p.id !== "j1");

    expect(partnerOfJ1.id).toBe("j4");
  });
});
