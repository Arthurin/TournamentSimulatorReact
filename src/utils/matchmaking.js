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

  // coût pair à pair : plus haut = moins désirable
  function matchCost(a, b) {
    let cost = 0;
    if (a.pastPartners?.has(b.id) || b.pastPartners?.has(a.id)) cost += 1000; // déjà partenaires : grosse pénalité
    if (a.pastOpponents?.has(b.id) || b.pastOpponents?.has(a.id)) cost += 50; // déjà adversaires : pénalité moindre
    // plus on a d'historique de partenaires, plus on a tendance à éviter (soft)
    cost += (a.pastPartners?.size ?? 0) + (b.pastPartners?.size ?? 0);
    console.log(`Compatibilité entre ${a.name} et ${b.name} : ${cost}`);
    return cost;
  }

  /**
   * Construction des matchs par groupes (buckets de même wins)
   */
  for (let i = 0; i < activeCandidates.length; i += 4) {
    const group = activeCandidates.slice(i, i + 4);
    if (group.length < 4) break;

    // 1) Trier les joueurs par nombre de partenaires déjà rencontrés
    group.sort((a, b) => a.pastPartners.size - b.pastPartners.size);

    const used = new Set();
    const pairs = [];

    // 2) Former les paires une par une
    for (let p = 0; p < group.length; p++) {
      const player = group[p];
      if (used.has(player.id)) continue;

      let bestPartner = null;
      let bestScore = -Infinity; // car matchCost retourne négatif si "mauvais"

      for (let q = p + 1; q < group.length; q++) {
        const other = group[q];
        if (used.has(other.id)) continue;

        // Priorité à un partenaire jamais joué ensemble
        if (!player.pastPartners.has(other.id)) {
          bestPartner = other;
          break;
        }

        // Sinon on choisit celui avec le coût le moins mauvais
        const cost = matchCost(player, other);
        if (cost > bestScore) {
          bestScore = cost;
          bestPartner = other;
        }
      }

      // On marque les deux joueurs comme utilisés
      if (bestPartner) {
        used.add(player.id);
        used.add(bestPartner.id);
        pairs.push([player, bestPartner]);
      }
    }

    // Si on n’a pas deux paires complètes → passer ce groupe
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
