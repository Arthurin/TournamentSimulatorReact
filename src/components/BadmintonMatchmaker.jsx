// components/BadmintonMatchmaker.jsx
import { useState, useEffect } from "react";
import { generateMatches } from "../utils/matchmaking";

function getName(players, id) {
  const p = players.find((player) => player.id === id);
  return p ? p.name : "?";
}

export default function BadmintonMatchmaker() {
  const [players, setPlayers] = useState(createInitialPlayers);
  const [newName, setNewName] = useState("");

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
      pastOpponents: new Set(),
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

  function runMatchmaking() {
    const { matches, resting } = generateMatches(players, 7);

    // ✅ AJOUT DEBUG : affichage clair des joueurs retenus
    console.log("=== Sélection du round ===");
    console.log(
      "Joueurs qui jouent :",
      players
        .filter((p) => !resting.some((r) => r.id === p.id))
        .map((p) => p.name)
    );
    console.log(
      "Joueurs qui se reposent :",
      resting.map((p) => p.name)
    );
    console.log(
      "Nombre total :",
      players.length,
      "| jouent :",
      players.length - resting.length,
      "| repos :",
      resting.length
    );
    console.log("=========================");

    // update players' rest counts and restedLastRound flag
    const restingIds = new Set(resting.map((p) => p.id));
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        restedLastRound: restingIds.has(p.id),
        restCount: restingIds.has(p.id)
          ? (p.restCount || 0) + 1
          : p.restCount || 0,
      }))
    );

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

      <h2 className="text-xl font-bold mb-3">Joueurs</h2>

      <input
        className="border p-1 rounded mr-2"
        placeholder="Ajouter un prénom..."
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && addPlayer()}
      />

      <table className="mt-3 table-auto border-collapse border w-full">
        <thead>
          <tr>
            <th className="border px-2 py-1">Prénom</th>
            <th className="border px-2 py-1">Victoires</th>
            <th className="border px-2 py-1">Nb Repos</th>
            <th className="border px-2 py-1">Partenaires précédents</th>
            <th className="border px-2 py-1">Adversaires précédents</th>
            {admin && <th className="border px-2 py-1">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr key={player.id}>
              <td className="border px-2 py-1">
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
                  .map((partnerId) => getName(players, partnerId))
                  .join(" ; ")}
              </td>

              <td className="border px-2 py-1 text-center">
                {[...player.pastOpponents]
                  .map((oppId) => getName(players, oppId))
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
            </tr>
          ))}
        </tbody>
      </table>

      <button
        className="cursor-pointer mt-4 px-3 py-2 bg-orange-600 text-white rounded"
        onClick={runMatchmaking}
      >
        Générer les matchs
      </button>

      {/* AFFICHAGE MATCHS */}
      <div className="mt-6">
        <h3 className="font-bold mb-2">Matchs générés</h3>

        {/* TERRAIN */}
        {matchResults.matches.map((m, i) => (
          <div key={i} className={`p-3 w-fit border rounded space-y-2`}>
            <div className="flex justify-between">
              <div>
                <div className="font-medium">Terrain {i + 1}</div>
              </div>
            </div>

            {/* ✅ matchs et boutons résultat */}
            <div className="flex gap-2">
              <button
                onClick={() => recordMatchResult(m, "A")}
                disabled={m.winner !== null}
                className={`px-3 py-1 hover:bg-green-600 rounded ${
                  m.winner === "A"
                    ? "bg-green-600 text-white"
                    : "bg-blue-600 text-white"
                } ${
                  m.winner !== null
                    ? "opacity-60 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                {m.teamA.map((p) => (
                  <div key={p.id}>
                    {p.name} (wins: {p.wins})
                  </div>
                ))}
                Clique sur les gagnant·e·s
              </button>
              <div className="px-2 self-center">VS</div>
              <button
                onClick={() => recordMatchResult(m, "B")}
                disabled={m.winner !== null}
                className={`px-3 py-1 hover:bg-green-600 rounded ${
                  m.winner === "B"
                    ? "bg-green-600 text-white"
                    : "bg-pink-600 text-white"
                } ${
                  m.winner !== null
                    ? "opacity-60 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                {m.teamB.map((p) => (
                  <div key={p.id}>
                    {p.name} (wins: {p.wins})
                  </div>
                ))}
                Clique sur les gagnant·e·s
              </button>

              {m.winner !== null && (
                <button
                  onClick={() => undoMatchResult(m)}
                  className="px-3 py-1 bg-red-600 text-white rounded"
                >
                  Annuler le résultat
                </button>
              )}
            </div>
          </div>
        ))}

        <h4 className="mt-4 font-medium">Au repos :</h4>
        {matchResults.resting.map((p) => (
          <span
            key={p.id}
            className="inline-block px-2 py-1 border rounded mr-2"
          >
            {p.name}
          </span>
        ))}
      </div>
    </div>
  );
}
