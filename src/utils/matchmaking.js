// utils/matchmaking.js

/**
 * Génère des matchs en double (2 vs 2).
 *
 * @param {Array} players - Liste des joueurs : { id, name, wins, partners, opponents, lastRest }
 * @param {number} nbCourts - Nombre de terrains disponibles
 * @returns {Object} { matches: Array, resting: Array }
 */
export function generateMatches(players, nbCourts = 7) {
  // Nombre maximum de joueurs pouvant jouer ce tour
  const maxActivePlayers = nbCourts * 4;

  // On trie par niveau pour équilibrer les matchs
  const sortedPlayers = [...players].sort((a, b) => a.wins - b.wins);

  // Tous les joueurs qu’on pourrait utiliser (limite terrains)
  let activeCandidates = sortedPlayers.slice(0, maxActivePlayers);

  // Tous les joueurs excédentaires (manque de place)
  let restingPlayers = sortedPlayers.slice(maxActivePlayers);

  /**
   * Étape importante :
   * Si le nombre de joueurs actifs n'est pas divisible par 4,
   * on met les joueurs surnuméraires au repos.
   */
  const remainder = activeCandidates.length % 4;
  if (remainder !== 0) {
    const surplus = activeCandidates.slice(-remainder);
    activeCandidates = activeCandidates.slice(
      0,
      activeCandidates.length - remainder
    );
    restingPlayers = [...restingPlayers, ...surplus];
  }

  /**
   * Évite que des personnes restent 2 fois d'affilée au repos :
   * Si un joueur mis au repos avait déjà lastRest = true, on essaie de l'échanger
   * avec quelqu’un en jeu qui n'était pas au repos.
   */
  const forcedReturnees = restingPlayers.filter((p) => p.lastRest === true);

  for (const returningPlayer of forcedReturnees) {
    const candidateToSit = activeCandidates.find((p) => p.lastRest === false);
    if (candidateToSit) {
      // Swap
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

  // On marque état repos pour le prochain tour.
  restingPlayers = restingPlayers.map((p) => ({ ...p, lastRest: true }));
  activeCandidates = activeCandidates.map((p) => ({ ...p, lastRest: false }));

  const matches = [];

  function matchCost(a, b) {
    let cost = 0;
    // déjà partenaires → grosse pénalité
    if (a.pastPartners?.has(b.id) || b.pastPartners?.has(a.id)) cost += 1000;
    // déjà adversaires → petite pénalité
    if (a.pastOpponents?.has(b.id) || b.pastOpponents?.has(a.id)) cost += 50;
    // plus on a de partenaires différents, mieux c’est (on soustrait légèrement)
    cost -= (a.pastPartners?.size ?? 0) + (b.pastPartners?.size ?? 0);
    console.log(`Compatibilité entre ${a.name} et ${b.name} : ${cost}`);
    return cost;
  }

  for (let i = 0; i < activeCandidates.length; i += 4) {
    const group = activeCandidates.slice(i, i + 4);
    if (group.length < 4) break;

    group.sort((a, b) => a.pastPartners.size - b.pastPartners.size);

    const used = new Set();
    const pairs = [];

    for (let p = 0; p < group.length; p++) {
      const player = group[p];
      if (used.has(player.id)) continue;

      let bestPartner = null;
      let bestScore = Infinity; // on cherche le coût minimal

      for (let q = p + 1; q < group.length; q++) {
        const other = group[q];
        if (used.has(other.id)) continue;

        const cost = matchCost(player, other);

        // priorité à un partenaire jamais rencontré
        const neverPlayedTogether =
          !player.pastPartners.has(other.id) &&
          !other.pastPartners.has(player.id);

        // on garde le partenaire si :
        // - jamais joué ensemble (prioritaire)
        // - ou bien si le coût est plus faible
        if (neverPlayedTogether && cost < bestScore) {
          bestPartner = other;
          bestScore = cost;
        } else if (!bestPartner || cost < bestScore) {
          bestPartner = other;
          bestScore = cost;
        }
      }

      if (bestPartner !== null) {
        used.add(player.id);
        used.add(bestPartner.id);
        pairs.push([player, bestPartner]);
      }
    }

    if (pairs.length < 2) continue;

    const teamA = pairs[0];
    const teamB = pairs[1];

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
