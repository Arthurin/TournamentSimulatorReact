// utils/matchmaking.js

export function generateMatches(players, nbCourts = 7) {
  const maxActivePlayers = nbCourts * 4;
  const sortedPlayers = [...players].sort((a, b) => a.wins - b.wins);

  let activeCandidates = sortedPlayers.slice(0, maxActivePlayers);
  let restingPlayers = sortedPlayers.slice(maxActivePlayers);

  const remainder = activeCandidates.length % 4;
  if (remainder !== 0) {
    const surplus = activeCandidates.slice(-remainder);
    activeCandidates = activeCandidates.slice(
      0,
      activeCandidates.length - remainder
    );
    restingPlayers = [...restingPlayers, ...surplus];
  }

  const forcedReturnees = restingPlayers.filter(
    (p) => p.restedLastRound === true
  );
  for (const returningPlayer of forcedReturnees) {
    const candidateToSit = activeCandidates.find(
      (p) => p.restedLastRound === false
    );
    if (candidateToSit) {
      activeCandidates = activeCandidates.filter(
        (p) => p.id !== candidateToSit.id
      );
      restingPlayers = restingPlayers.filter(
        (p) => p.id !== returningPlayer.id
      );

      activeCandidates.push(returningPlayer);
      restingPlayers.push(candidateToSit);
    }
  }

  restingPlayers = restingPlayers.map((p) => ({ ...p, restedLastRound: true }));
  activeCandidates = activeCandidates.map((p) => ({
    ...p,
    restedLastRound: false,
  }));

  const matches = [];

  function matchCost(a, b) {
    const PENALTY_PARTNER = 1000;
    const PENALTY_REPEAT_COUNT = 300;
    const BONUS_DIVERSITY = 5;

    let cost = 0;

    if (a.pastPartners?.has(b.id) || b.pastPartners?.has(a.id)) {
      const countA = a.partnersHistory?.[b.id] || 0;
      const countB = b.partnersHistory?.[a.id] || 0;
      cost += PENALTY_PARTNER + (countA + countB) * PENALTY_REPEAT_COUNT;
    }

    const diversityA = a.pastPartners?.size ?? 0;
    const diversityB = b.pastPartners?.size ?? 0;
    cost -= (diversityA + diversityB) * BONUS_DIVERSITY;

    console.log(
      `Compatibilité ${a.name}-${b.name} : coût=${cost.toFixed(
        2
      )} (divA=${diversityA}, divB=${diversityB})`
    );

    return cost;
  }

  for (let i = 0; i < activeCandidates.length; i += 4) {
    const group = activeCandidates.slice(i, i + 4);
    if (group.length < 4) break;

    // Les 3 configurations possibles pour 4 joueurs
    const allConfigs = [
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

    for (const config of allConfigs) {
      const [[i1, i2], [j1, j2]] = config;
      const cost =
        matchCost(group[i1], group[i2]) + matchCost(group[j1], group[j2]);

      if (cost < bestCost) {
        bestCost = cost;
        bestConfig = config;
      }
    }

    const teamA = [group[bestConfig[0][0]], group[bestConfig[0][1]]];
    const teamB = [group[bestConfig[1][0]], group[bestConfig[1][1]]];

    console.log(
      `Match généré : ${teamA[0].name} & ${teamA[1].name} vs ${teamB[0].name} & ${teamB[1].name}`
    );

    matches.push({ teamA, teamB });
  }

  return {
    matches,
    resting: restingPlayers,
  };
}
