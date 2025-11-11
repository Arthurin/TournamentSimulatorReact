// utils/matchmaking.js

/**
 * Génère des matchs en double (2 vs 2) pour un ensemble de joueurs.
 * Objectifs :
 *  1. Les joueurs sont regroupés par nombre de victoires (niveaux comparables).
 *  2. On essaie d'éviter de former une équipe ou d'affronter des joueurs déjà rencontrés.
 *  3. Si plus de joueurs que de places : certains sont mis au repos.
 *  4. On évite que la même personne soit au repos deux fois de suite.
 *
 * @param {Array} players - Liste des joueurs { id, name, wins, partners, opponents, lastRest }
 * @param {number} nbCourts - Nombre de terrains disponibles
 * @returns {Object} { matches: Array, resting: Array }
 */
export function generateMatches(players, nbCourts = 7) {
  // Nombre total maximum de joueurs actifs : 4 joueurs par terrain
  const maxActivePlayers = nbCourts * 4;

  // On trie par nombre croissant de victoires pour que les matchs soient équilibrés
  const sortedPlayers = [...players].sort((a, b) => a.wins - b.wins);

  // Sélection des joueurs actifs (ceux qui joueront) et au repos
  let activePlayers = sortedPlayers.slice(0, maxActivePlayers);
  let restingPlayers = sortedPlayers.slice(maxActivePlayers);

  /**
   * Si certains joueurs sont au repos pour la 2e fois d'affilée,
   * on essaie de les réintégrer en remplaçant quelqu’un d’autre.
   */
  if (restingPlayers.some((p) => p.lastRest === true)) {
    const forcedReturnees = restingPlayers.filter((p) => p.lastRest === true);
    for (const p of forcedReturnees) {
      const someoneActive = activePlayers.find((a) => a.lastRest !== true);
      if (someoneActive) {
        activePlayers = activePlayers.filter((a) => a.id !== someoneActive.id);
        restingPlayers = restingPlayers.filter((r) => r.id !== p.id);
        activePlayers.push(p);
        restingPlayers.push(someoneActive);
      }
    }
  }

  // On marque les joueurs mis au repos pour le prochain calcul
  restingPlayers = restingPlayers.map((p) => ({ ...p, lastRest: true }));
  activePlayers = activePlayers.map((p) => ({ ...p, lastRest: false }));

  const matches = [];

  /**
   * Fonction utilitaire : calcule un score de compatibilité entre deux joueurs
   * basé sur le fait qu’ils aient déjà joué ensemble ou l’un contre l’autre.
   * Moins ils se connaissent → meilleur score.
   */
  function compatibilityScore(playerA, playerB) {
    let score = 0;
    if (playerA.partners.includes(playerB.id)) score += 10;
    if (playerA.opponents.includes(playerB.id)) score += 5;

    console.log(
      `Compatibilité entre ${playerA.name} et ${playerB.name} : ${score}`
    );
    return score;
  }

  /**
   * Composition des équipes :
   *  - On forme les équipes en minimisant la compatibilité pour éviter re-matchs.
   */
  for (let i = 0; i < activePlayers.length; i += 4) {
    if (i + 3 >= activePlayers.length) break;

    const group = activePlayers.slice(i, i + 4);

    // On cherche la meilleure combinaison possible pour limiter les re-matchs
    // On trie par ordre de compatibilité croissante
    group.sort((a, b) => compatibilityScore(a, b));
    console.log(
      `Groupe de joueurs trié par compatibilité : ${group
        .map((p) => p.name)
        .join(", ")}`
    );

    // On forme les équipes en prenant les joueurs les moins compatibles ensemble
    const teamA = [group[0], group[3]];
    const teamB = [group[1], group[2]];
    console.log(
      `Match formé : ${teamA.map((p) => p.name).join(" & ")} vs ${teamB
        .map((p) => p.name)
        .join(" & ")}`
    );

    matches.push({ teamA, teamB });
  }

  return { matches, resting: restingPlayers };
}
