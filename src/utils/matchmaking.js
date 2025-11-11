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

  /**
   * Fonction scoring : mesure la "mauvaise compatibilité".
   * Plus le score est haut → moins c'est idéal de jouer ensemble.
   */
  function matchCost(a, b) {
    let cost = 0;
    if (a.partners.includes(b.id)) cost += 10; // Ils ont déjà joué ensemble
    if (a.opponents.includes(b.id)) cost += 5; // Ils se sont déjà affrontés
    console.log(`Compatibilité entre ${a.name} et ${b.name} : ${cost}`);

    return cost;
  }

  /**
   * Construction des matchs par groupes de 4 joueurs.
   */
  for (let i = 0; i < activeCandidates.length; i += 4) {
    const group = activeCandidates.slice(i, i + 4);
    if (group.length < 4) break;

    // On essaie de réduire les re-matchs entre coéquipiers et adversaires
    group.sort((a, b) => matchCost(a, b));

    const teamA = [group[0], group[3]];
    const teamB = [group[1], group[2]];

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
