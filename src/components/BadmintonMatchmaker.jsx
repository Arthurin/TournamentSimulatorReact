// components/BadmintonMatchmaker.jsx
import { useState, useEffect } from "react";
import { generateMatches, validateRound } from "../utils/matchmaking";

function getName(players, id) {
  const p = players.find((player) => player.id === id);
  return p ? p.name : "?";
}

export default function BadmintonMatchmaker() {
  const [players, setPlayers] = useState(createInitialPlayers);
  const [newName, setNewName] = useState("");

  const [roundCount, setRoundCount] = useState(1);
  const [matchmakingGenerated, setMatchmakingGenerated] = useState(false);
  const [matchmakingValidated, setMatchmakingValidated] = useState(false);

  const [admin, setAdmin] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editWins, setEditWins] = useState(0);

  const [matchResults, setMatchResults] = useState({
    matches: [],
    resting: [],
  });

  function createInitialPlayers() {
    const initialState = [
      generatePlayerByName("j1"),
      generatePlayerByName("j2"),
      generatePlayerByName("j3"),
      generatePlayerByName("j4"),
      generatePlayerByName("j5"),
      generatePlayerByName("j6"),
      generatePlayerByName("j7"),
      generatePlayerByName("j8"),
      generatePlayerByName("j9"),
    ];
    return initialState;
  }

  function addPlayer() {
    if (!newName.trim()) return;
    setPlayers((prev) => [...prev, generatePlayerByName(newName.trim())]);
    setNewName("");
  }

  function generatePlayerByName(playerName) {
    const newPlayer = {
      id: crypto.randomUUID(),
      name: playerName,
      wins: 0,
      pastPartners: new Set(),
      lastRest: false,
    };
    return newPlayer;
  }

  function startEdit(player) {
    setEditingPlayerId(player.id);
    setEditName(player.name);
    setEditWins(player.wins);
  }

  function confirmEdit(id) {
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, name: editName.trim(), wins: editWins } : p
      )
    );
    setEditingPlayerId(null);
  }

  function deletePlayer(id) {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }

  function endRoundAndStartNext() {
    // ✅ Incrémenter le compteur de repos pour les joueurs au repos
    const updatedPlayers = validateRound(players, matchResults);
    setPlayers(updatedPlayers);

    // Incrémenter le compteur de round
    setRoundCount((r) => r + 1);
    // Générer de nouvelles équipes
    runMatchmaking();
    setMatchmakingGenerated(true);
    setMatchmakingValidated(false);
  }

  function runMatchmaking() {
    const { matches, resting } = generateMatches(players, 7);

    setMatchResults({
      matches: matches.map((m) => ({ ...m, winner: null })), // ajout
      resting,
    });
  }

  function recordMatchResult(match, winner) {
    const winningTeam = winner === "A" ? match.teamA : match.teamB;
    const losingTeam = winner === "A" ? match.teamB : match.teamA;

    // 1️⃣ Mise à jour des victoires
    setPlayers((prev) =>
      prev.map((p) => {
        const isWinner = winningTeam.some((w) => w.id === p.id);
        if (isWinner) return { ...p, wins: (p.wins || 0) + 1 };
        return p;
      })
    );

    // 2️⃣ Mise à jour partenaires / partenaires history
    setPlayers((prev) => {
      const updated = new Map(
        prev.map((p) => [
          p.id,
          {
            ...p,
            pastPartners: new Set(p.pastPartners),
            partnersHistory: { ...p.partnersHistory }, // ajout du compteur
          },
        ])
      );

      const addHistory = (playerA, playerB) => {
        // pastPartners
        updated.get(playerA.id).pastPartners.add(playerB.id);
        updated.get(playerB.id).pastPartners.add(playerA.id);

        // partnersHistory
        if (!updated.get(playerA.id).partnersHistory[playerB.id])
          updated.get(playerA.id).partnersHistory[playerB.id] = 0;
        updated.get(playerA.id).partnersHistory[playerB.id] += 1;

        if (!updated.get(playerB.id).partnersHistory[playerA.id])
          updated.get(playerB.id).partnersHistory[playerA.id] = 0;
        updated.get(playerB.id).partnersHistory[playerA.id] += 1;
      };

      // Pour chaque équipe, ajouter les paires
      addHistory(winningTeam[0], winningTeam[1]);
      addHistory(losingTeam[0], losingTeam[1]);

      return Array.from(updated.values());
    });

    // 3️⃣ Empêche de recliquer sur ce match
    setMatchResults((prev) => ({
      ...prev,
      matches: prev.matches.map((m) => (m === match ? { ...m, winner } : m)),
    }));
  }

  function undoMatchResult(match) {
    const { winner, teamA, teamB } = match;
    console.log("Undo match result for match:", match);
    if (!winner) return;

    const winningTeam = winner === "A" ? teamA : teamB;
    const losingTeam = winner === "A" ? teamB : teamA;

    // 1️⃣ Retirer les victoires
    setPlayers((prev) =>
      prev.map((p) => {
        const isWinner = winningTeam.some((w) => w.id === p.id);
        if (isWinner) return { ...p, wins: Math.max(0, (p.wins || 0) - 1) };
        return p;
      })
    );

    // 2️⃣ Retirer historique partenaires / partnersHistory
    setPlayers((prev) => {
      const updated = new Map(
        prev.map((p) => [
          p.id,
          {
            ...p,
            pastPartners: new Set(p.pastPartners),
            partnersHistory: { ...p.partnersHistory },
          },
        ])
      );

      const removeHistory = (playerA, playerB) => {
        updated.get(playerA.id).partnersHistory[playerB.id] -= 1;
        if (updated.get(playerA.id).partnersHistory[playerB.id] <= 0) {
          delete updated.get(playerA.id).partnersHistory[playerB.id];
          updated.get(playerA.id).pastPartners.delete(playerB.id);
        }

        updated.get(playerB.id).partnersHistory[playerA.id] -= 1;
        if (updated.get(playerB.id).partnersHistory[playerA.id] <= 0) {
          delete updated.get(playerB.id).partnersHistory[playerA.id];
          updated.get(playerB.id).pastPartners.delete(playerA.id);
        }
      };

      removeHistory(winningTeam[0], winningTeam[1]);
      removeHistory(losingTeam[0], losingTeam[1]);

      return Array.from(updated.values());
    });

    // 3️⃣ Remettre winner à null
    setMatchResults((prev) => ({
      ...prev,
      matches: prev.matches.map((m) =>
        m === match ? { ...m, winner: null } : m
      ),
    }));
  }

  return (
    <div className="p-4">
      {/* BOUTON SECRET POUR ADMIN */}
      <button
        className="absolute top-0 right-0 w-10 h-10 bg-white cursor-pointer"
        onClick={() => setAdmin((a) => !a)}
      />

      <h2 className="text-xl font-bold mb-3">Liste des participant·e·s </h2>

      <input
        className="border p-1 rounded mr-2"
        placeholder="Ajouter un prénom..."
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && addPlayer()}
      />

      <button
        className={`mt-4 px-3 py-2 bg-orange-600 text-white rounded ${
          matchmakingValidated
            ? "opacity-60 cursor-not-allowed"
            : "opacity-100 cursor-pointer"
        }`}
        onClick={() => {
          runMatchmaking();
          setMatchmakingGenerated(true);
          setMatchmakingValidated(false); // reset validation si on regénère
        }}
        disabled={matchmakingValidated}
      >
        {matchResults.matches.length !== 0
          ? "Regénérer les matchs (en cas d'ajout de joueur·euse·s)"
          : "Générer les matchs"}
      </button>
      <div className="overflow-x-auto">
        <table className="mt-3 table-auto border-collapse border w-full">
          <thead>
            <tr>
              {/* Colonne prénom fixe */}
              <th className="border px-2 py-1 sticky left-0 bg-white z-10">
                Prénom
              </th>
              <th className="border px-2 py-1">Victoires</th>
              <th className="border px-2 py-1">Nb Repos</th>
              <th className="border px-2 py-1">Partenaires précédents</th>
              {admin && <th className="border px-2 py-1">Actions</th>}

              {/* Colonnes rounds inversées */}
              {Array.from(
                {
                  length: Math.max(
                    ...players.map((p) => p.roundHistory?.length || 0)
                  ),
                },
                (_, i) => {
                  const roundIndex =
                    Math.max(
                      ...players.map((p) => p.roundHistory?.length || 0)
                    ) -
                    1 -
                    i;
                  return (
                    <th
                      key={i}
                      className="border px-2 py-1 text-center bg-gray-100 sticky top-0"
                    >
                      Round {roundIndex + 1}
                    </th>
                  );
                }
              )}
            </tr>
          </thead>

          <tbody>
            {players.map((player) => (
              <tr key={player.id}>
                {/* Prénom fixe */}
                <td className="border px-2 py-1 sticky left-0 bg-white z-10">
                  {admin && editingPlayerId === player.id ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  ) : (
                    player.name
                  )}
                </td>

                <td className="border px-2 py-1 text-center">
                  {admin && editingPlayerId === player.id ? (
                    <input
                      type="number"
                      value={editWins}
                      onChange={(e) => setEditWins(Number(e.target.value))}
                    />
                  ) : (
                    player.wins
                  )}
                </td>

                <td className="border px-2 py-1 text-center">
                  {player.restCount || 0}
                </td>

                <td className="border px-2 py-1 text-center">
                  {[...player.pastPartners]
                    .map((partnerId) => {
                      const name = getName(players, partnerId);
                      const count = player.partnersHistory?.[partnerId] || 1;
                      return count > 1 ? `${name} (x${count})` : name;
                    })
                    .join(" ; ")}
                </td>

                {admin && (
                  <td className="border px-2 py-1 text-center">
                    {editingPlayerId === player.id ? (
                      <button
                        className="text-green-600"
                        onClick={() => confirmEdit(player.id)}
                      >
                        OK
                      </button>
                    ) : (
                      <>
                        <button
                          className="text-blue-600 mr-2"
                          onClick={() => startEdit(player)}
                        >
                          Modifier
                        </button>
                        <button
                          className="text-red-600"
                          onClick={() => deletePlayer(player.id)}
                        >
                          Supprimer
                        </button>
                      </>
                    )}
                  </td>
                )}

                {/* 🆕 Colonnes rounds */}
                {Array.from(
                  {
                    length: Math.max(
                      ...players.map((p) => p.roundHistory?.length || 0)
                    ),
                  },
                  (_, i) => {
                    const roundIndex =
                      Math.max(
                        ...players.map((p) => p.roundHistory?.length || 0)
                      ) -
                      1 -
                      i;
                    const round = player.roundHistory?.[roundIndex];

                    if (!round) {
                      return (
                        <td
                          key={i}
                          className="border px-2 py-1 text-center text-gray-300"
                        >
                          –
                        </td>
                      );
                    }

                    if (round.result === "rest") {
                      return (
                        <td
                          key={i}
                          className="border px-2 py-1 text-center italic text-gray-500 bg-gray-100 whitespace-nowrap"
                        >
                          Repos 💤
                        </td>
                      );
                    }

                    const opponentsNames = (round.opponents || []).join(" & ");

                    return (
                      <td
                        key={i}
                        className={`border px-2 py-1 text-center whitespace-nowrap ${
                          round.won ? "bg-green-100" : "bg-red-100"
                        }`}
                      >
                        <div className="flex flex-row items-center gap-1 whitespace-nowrap">
                          <span className="text-gray-600">
                            Terrain {round.terrain ?? "?"}
                          </span>
                          <span className="text-blue-700">
                            👥 {round.partner}
                          </span>
                          <span className="text-red-700">
                            ⚔️ {opponentsNames || "?"}
                          </span>
                          <span className="font-semibold text-gray-700 text-xl ml-auto">
                            {round.won ? "🏆" : "☠️"}
                          </span>
                        </div>
                      </td>
                    );
                  }
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-neutral-100 p-5 mt-5">
        <div className="flex mb-3 text-xl align-baseline">
          <div className="font-bold mr-2">Round {roundCount} -</div>

          {matchmakingGenerated && (
            <>
              {matchResults.matches.every((m) => m.winner !== null) ? (
                // Round Terminé //
                <div className="text-black">Round terminé</div>
              ) : matchmakingValidated ? (
                <div className="text-emerald-700">Round en cours</div>
              ) : (
                // Validation du matchmaking
                // Disparait une fois que le matchmaking est validé
                <>
                  <div className="text-amber-500">
                    Round généré, en attente de validation
                  </div>
                </>
              )}
            </>
          )}
        </div>
        <div className="flex align-baseline items-start">
          <div className="mt-2 px-3 ps-0 py-2 font-bold">
            Actions disponibles :{" "}
          </div>
          {
            /* BOUTON Générer le prochain round : uniquement quand des équipes ont été générés et que le round actuel est terminé ! */
            matchResults.matches.length !== 0 &&
            matchResults.matches.every((m) => m.winner !== null) ? (
              <button
                className="cursor-pointer mt-2 px-3 py-2 bg-amber-500 text-white rounded opacity-100"
                onClick={() => {
                  endRoundAndStartNext();
                }}
              >
                Générer le round {roundCount + 1}
              </button>
            ) : matchmakingValidated ? (
              <div className="mt-2 px-3 py-2 ps-0">
                Clique sur les gagnant·e·s pour noter le score
              </div>
            ) : (
              matchResults.matches.length !== 0 && (
                <>
                  <button
                    className={`mt-2 px-3 py-2 ml-3 bg-green-600 rounded ${
                      matchmakingValidated
                        ? "opacity-60 text-white cursor-not-allowed"
                        : "opacity-100 text-white cursor-pointer"
                    }`}
                    disabled={matchmakingValidated}
                    onClick={() => {
                      setMatchmakingValidated(true);
                    }}
                  >
                    Valider et commencer les matchs
                  </button>
                </>
              )
            )
          }
        </div>

        {/* AFFICHAGE MATCHS */}
        <div className="mt-6">
          <h4 className="mt-3 font-bold mb-2">
            Au repos :
            {matchResults.resting.map((p) => (
              <span
                key={p.id}
                className="inline-block font-medium px-2 py-1 border rounded mr-1 ml-1"
              >
                {p.name}
              </span>
            ))}
          </h4>

          {/* TERRAIN */}
          {matchResults.matches.map((m, i) => (
            <div key={i} className={`p-3 mb-2 w-fit border rounded space-y-2`}>
              <div className="flex justify-between">
                <div>
                  <div className="font-medium">Terrain {i + 1}</div>
                </div>
              </div>

              {/* ✅ matchs et boutons résultat */}
              <div className="flex gap-2">
                {/* EQUIPE A */}
                {matchmakingValidated ? (
                  /*Affichage du bouton pour saisir les gagnants*/
                  <button
                    onClick={() => {
                      if (m.winner === "A") {
                        undoMatchResult(m); // annule si on reclique sur le gagnant
                      } else if (!m.winner) {
                        recordMatchResult(m, "A"); // enregistre si pas encore de gagnant
                      }
                    }}
                    className={`px-3 py-1 rounded ${
                      m.winner === "A"
                        ? "bg-green-500 text-white"
                        : "bg-blue-600 text-white hover:bg-green-500"
                    } ${
                      m.winner && m.winner !== "A"
                        ? "opacity-60 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    {m.teamA.map((p) => (
                      <div key={p.id}>
                        {p.name} (wins: {p.wins})
                      </div>
                    ))}
                    {m.winner === null
                      ? ""
                      : m.winner === "A"
                      ? "Victoire"
                      : " Défaite"}
                  </button>
                ) : (
                  /*Affichage du texte, on met les boutons que si c'est validé*/
                  <button
                    disabled
                    className="px-3 py-1 bg-blue-600 text-white rounded"
                  >
                    {m.teamA.map((p) => (
                      <div key={p.id}>
                        {p.name} (wins: {p.wins})
                      </div>
                    ))}
                  </button>
                )}

                <div className="px-2 self-center">VS</div>

                {/* EQUIPE B */}
                {matchmakingValidated ? (
                  /*Affichage du bouton pour saisir les gagnants*/
                  <button
                    onClick={() => {
                      if (m.winner === "B") {
                        undoMatchResult(m); // annule si on reclique sur le gagnant
                      } else if (!m.winner) {
                        recordMatchResult(m, "B"); // enregistre si pas encore de gagnant
                      }
                    }}
                    className={`px-3 py-1 rounded ${
                      m.winner === "B"
                        ? "bg-green-500 text-white"
                        : "bg-pink-600 text-white hover:bg-green-500"
                    } ${
                      m.winner && m.winner !== "B"
                        ? "opacity-60 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    {m.teamB.map((p) => (
                      <div key={p.id}>
                        {p.name} (wins: {p.wins})
                      </div>
                    ))}
                    {m.winner === null
                      ? ""
                      : m.winner === "B"
                      ? "Victoire"
                      : " Défaite"}
                  </button>
                ) : (
                  /*Affichage du texte, on met les boutons que si c'est validé*/
                  <button
                    disabled
                    className="px-3 py-1 bg-pink-600 text-white rounded"
                  >
                    {m.teamB.map((p) => (
                      <div key={p.id}>
                        {p.name} (wins: {p.wins})
                      </div>
                    ))}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
