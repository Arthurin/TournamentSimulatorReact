// ✅ Fonction principale : génération des matchs
export function generateMatches(players, nbCourts = 7) {
  console.log("generateMatches", players, "nbCourts", nbCourts);
  const maxActivePlayers = nbCourts * 4;

  // 1️⃣ Les joueurs qui étaient au repos doivent jouer ce tour
  const mustPlay = players.filter((p) => p.restedLastRound);
  const others = players.filter((p) => !mustPlay.includes(p));

  // 2️⃣ Tri des autres : priorise ceux qui ont eu le plus de repos et le moins de victoires
  others.sort((a, b) => {
    if (a.restCount !== b.restCount) return b.restCount - a.restCount;
    return a.wins - b.wins;
  });

  // 3️⃣ Sélection des joueurs actifs
  let activeCandidates = [...mustPlay, ...others].slice(0, maxActivePlayers);
  let restingPlayers = [...players].filter(
    (p) => !activeCandidates.includes(p)
  );

  // 4️⃣ Ajustement si le nombre de joueurs n'est pas multiple de 4
  const remainder = activeCandidates.length % 4;
  console.log("remainder", remainder, "et candidats", activeCandidates);
  if (remainder !== 0) {
    const surplus = activeCandidates.slice(-remainder);
    activeCandidates = activeCandidates.slice(
      0,
      activeCandidates.length - remainder
    );
    restingPlayers = [...restingPlayers, ...surplus];
  }

  console.log(
    "matchmaking.js selection des joueurs actifs. Candidats",
    activeCandidates,
    "Joueurs au repos d'après le filtre :",
    restingPlayers
  );

  // 🆕 4.5️⃣ Tri préalable des joueurs actifs par nombre de victoires
  // Cela assure que les blocs de 4 joueurs ont des niveaux proches
  activeCandidates.sort((a, b) => (a.wins || 0) - (b.wins || 0));

  // 5️⃣ Nouvelle fonction de coût : priorité aux victoires proches
  function matchCost(a, b) {
    const PENALTY_PARTNER = 300; // secondaire
    const PENALTY_REPEAT_COUNT = 100;
    const BONUS_DIVERSITY = 3;
    const PENALTY_VICTORY_GAP = 30; // 🔥 priorité forte

    let cost = 0;

    // ⚠️ Pénalité si déjà partenaires
    if (a.pastPartners?.has(b.id) || b.pastPartners?.has(a.id)) {
      const countA = a.partnersHistory?.[b.id] || 0;
      const countB = b.partnersHistory?.[a.id] || 0;
      cost += PENALTY_PARTNER + (countA + countB) * PENALTY_REPEAT_COUNT;
    }

    // ⚙️ Pénalité quadratique sur l'écart de victoires
    const winGap = Math.abs((a.wins || 0) - (b.wins || 0));
    cost += winGap * PENALTY_VICTORY_GAP;

    // 🌈 Légère récompense pour diversité
    const diversityA = a.pastPartners?.size ?? 0;
    const diversityB = b.pastPartners?.size ?? 0;
    cost -= (diversityA + diversityB) * BONUS_DIVERSITY;

    // Petit facteur aléatoire pour briser les égalités
    cost += (Math.random() - 0.5) * 1e-6;

    return cost;
  }

  // 🆕 Fonction d'évaluation du coût global d'un groupe de 4
  function groupCost(group) {
    const wins = group.map((p) => p.wins || 0);
    const gap = Math.max(...wins) - Math.min(...wins);
    return gap * 200; // énorme pénalité si écart trop grand
  }

  // 6️⃣ Création des matchs optimisés (équipes équilibrées)
  const matches = [];

  for (let i = 0; i < activeCandidates.length; i += 4) {
    const group = activeCandidates.slice(i, i + 4);
    if (group.length < 4) break;

    const configs = [
      [
        [0, 1],
        [2, 3],
      ],
      [
        [0, 2],
        [1, 3],
      ],
      [
        [0, 3],
        [1, 2],
      ],
    ];

    let bestConfig = null;
    let bestCost = Infinity;

    // 🔍 On cherche la config avec coût global minimal
    for (const cfg of configs) {
      const [[a1, a2], [b1, b2]] = cfg;
      const pairCost =
        matchCost(group[a1], group[a2]) + matchCost(group[b1], group[b2]);
      const totalCost = pairCost + groupCost(group); // 🆕 inclut l’équilibre global
      if (totalCost < bestCost) {
        bestCost = totalCost;
        bestConfig = cfg;
      }
    }

    const teamA = [group[bestConfig[0][0]], group[bestConfig[0][1]]];
    const teamB = [group[bestConfig[1][0]], group[bestConfig[1][1]]];
    console.log(
      group[bestConfig[0][0]].name,
      group[bestConfig[0][1]].name,
      "vs",
      group[bestConfig[1][0]].name,
      group[bestConfig[1][1]].name,
      "with cost",
      bestCost
    );
    matches.push({ teamA, teamB });
  }
  console.log(
    "Matchs générés :",
    matches[0].teamA,
    matches[0].teamB,
    "Joueurs au repos :",
    restingPlayers
  );
  return { matches, resting: restingPlayers };
}

// ✅ Nouvelle fonction : validation du matchmaking (repos + compteur)
export function validateRound(players, matchResults, roundNumber) {
  console.log(
    "résultats des matchs avant validation des joueurs:",
    matchResults
  );
  const restingIds = new Set(matchResults.resting.map((p) => p.id));

  // On retourne les joueurs mis à jour sans toucher au composant
  return players.map((p) => {
    // 🔹 Chercher le match auquel ce joueur a participé (s'il n'était pas au repos)
    const playerMatch = matchResults.matches.find(
      (m) =>
        m.teamA.some((t) => t.id === p.id) || m.teamB.some((t) => t.id === p.id)
    );

    // 🔹 Construire une entrée d’historique pour ce round
    let roundEntry = null;
    let didWin = false;
    const pastPartners = new Set(p.pastPartners || []);
    const partnersHistory = { ...(p.partnersHistory || {}) };

    if (playerMatch) {
      const terrain = matchResults.matches.indexOf(playerMatch) + 1; // le numéro de terrain
      const isTeamA = playerMatch.teamA.some((t) => t.id === p.id);
      const partner = isTeamA
        ? playerMatch.teamA.find((t) => t.id !== p.id)
        : playerMatch.teamB.find((t) => t.id !== p.id);

      const opponents = isTeamA
        ? playerMatch.teamB.map((t) => t.name)
        : playerMatch.teamA.map((t) => t.name);

      const winnerTeam = playerMatch.winner; // peut être 'A', 'B', ou null

      didWin =
        winnerTeam &&
        ((winnerTeam === "A" && isTeamA) || (winnerTeam === "B" && !isTeamA));

      roundEntry = {
        terrain,
        partner: partner?.name || null,
        opponents,
        won: !!didWin,
        result: winnerTeam ? (didWin ? "win" : "loss") : "pending",
      };

      // Ajoute le partenaire
      if (partner?.id != null) {
        pastPartners.add(partner.id);
        partnersHistory[partner.id] = partnersHistory[partner.id]
          ? partnersHistory[partner.id] + 1
          : 1;
      }
    } else if (restingIds.has(p.id)) {
      // 🔹 S'il était au repos
      roundEntry = {
        terrain: null,
        partner: null,
        opponents: [],
        won: false,
        result: "rest",
      };
    }

    const updatedHistory = [...(p.roundHistory || [])];

    // On commence avec le round 1 qui est à l'entrée 0
    updatedHistory[roundNumber - 1] = roundEntry;

    // 🔹 Retourner le joueur mis à jour
    return {
      ...p,
      pastPartners,
      partnersHistory,
      wins: didWin ? p.wins + 1 : p.wins,
      restedLastRound: restingIds.has(p.id),
      restCount: restingIds.has(p.id)
        ? (p.restCount || 0) + 1
        : p.restCount || 0,
      roundHistory: updatedHistory,
    };
  });
}
