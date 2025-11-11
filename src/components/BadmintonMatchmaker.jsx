// components/BadmintonMatchmaker.jsx
import { useState } from "react";
import { generateMatches } from "../utils/matchmaking";

export default function BadmintonMatchmaker() {
  const [players, setPlayers] = useState([]);
  const [newName, setNewName] = useState("");

  const [admin, setAdmin] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editWins, setEditWins] = useState(0);

  const [matchResults, setMatchResults] = useState({
    matches: [],
    resting: [],
  });

  function addPlayer() {
    if (!newName.trim()) return;
    setPlayers((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: newName.trim(),
        wins: 0,
        partners: [],
        opponents: [],
        lastRest: false,
      },
    ]);
    setNewName("");
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
    // winner = "A" ou "B"
    const winningTeam = winner === "A" ? match.teamA : match.teamB;
    const losingTeam = winner === "A" ? match.teamB : match.teamA;

    // Mise à jour dans une nouvelle copie des players
    setPlayers((prev) =>
      prev.map((p) => {
        const isWinner = winningTeam.some((w) => w.id === p.id);
        if (isWinner) {
          return { ...p, wins: (p.wins || 0) + 1 };
        }
        return p;
      })
    );

    // Mise à jour des partenaires/adversaires
    setPlayers((prev) => {
      const updated = new Map(
        prev.map((p) => [
          p.id,
          {
            ...p,
            pastPartners: new Set(p.pastPartners),
            pastOpponents: new Set(p.pastOpponents),
          },
        ])
      );

      const addHistory = (playerA, playerB, opponent1, opponent2) => {
        updated.get(playerA.id).pastPartners.add(playerB.id);
        updated.get(playerB.id).pastPartners.add(playerA.id);
        updated.get(playerA.id).pastOpponents.add(opponent1.id);
        updated.get(playerA.id).pastOpponents.add(opponent2.id);
      };

      // Partners + Opponents
      addHistory(winningTeam[0], winningTeam[1], losingTeam[0], losingTeam[1]);
      addHistory(losingTeam[0], losingTeam[1], winningTeam[0], winningTeam[1]);

      return Array.from(updated.values());
    });

    // ✅ Empêche nouveau clic
    setMatchResults((prev) => ({
      ...prev,
      matches: prev.matches.map((m) => (m === match ? { ...m, winner } : m)),
    }));
  }

  function undoMatchResult(match) {
    const { winner, teamA, teamB } = match;
    if (!winner) return; // rien à annuler

    const winningTeam = winner === "A" ? teamA : teamB;
    const losingTeam = winner === "A" ? teamB : teamA;

    // 1) Retirer les victoires ajoutées
    setPlayers((prev) =>
      prev.map((p) => {
        const isWinner = winningTeam.some((w) => w.id === p.id);
        if (isWinner) {
          return { ...p, wins: Math.max(0, (p.wins || 0) - 1) };
        }
        return p;
      })
    );

    // 2) Retirer l'historique partenaires / adversaires
    setPlayers((prev) => {
      const updated = new Map(
        prev.map((p) => [
          p.id,
          {
            ...p,
            pastPartners: new Set(p.pastPartners),
            pastOpponents: new Set(p.pastOpponents),
          },
        ])
      );

      const removeHistory = (playerA, playerB, opponent1, opponent2) => {
        updated.get(playerA.id).pastPartners.delete(playerB.id);
        updated.get(playerB.id).pastPartners.delete(playerA.id);
        updated.get(playerA.id).pastOpponents.delete(opponent1.id);
        updated.get(playerA.id).pastOpponents.delete(opponent2.id);
      };

      removeHistory(
        winningTeam[0],
        winningTeam[1],
        losingTeam[0],
        losingTeam[1]
      );
      removeHistory(
        losingTeam[0],
        losingTeam[1],
        winningTeam[0],
        winningTeam[1]
      );

      return Array.from(updated.values());
    });

    // 3) Remettre `winner` à null → les boutons redeviennent cliquables
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
        className="absolute top-0 right-0 w-6 h-6 bg-white"
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
        className="mt-4 px-3 py-2 bg-blue-600 text-white rounded"
        onClick={runMatchmaking}
      >
        Générer les matchs
      </button>

      {/* AFFICHAGE MATCHS */}
      <div className="mt-6">
        <h3 className="font-bold mb-2">Matchs générés</h3>
        {matchResults.matches.map((m, i) => (
          <div key={i} className={`p-3 border rounded space-y-2`}>
            <div className="flex justify-between">
              <div>
                <div className="font-medium">Terrain {i + 1}</div>
                <div className="text-sm">
                  {m.teamA.map((p) => p.name).join(" + ")}
                  <span className="px-2">vs</span>
                  {m.teamB.map((p) => p.name).join(" + ")}
                </div>
              </div>
              <div className="text-sm text-gray-500">
                (wins: {m.teamA[0].wins} vs {m.teamB[0].wins})
              </div>
            </div>

            {/* ✅ Nouveaux boutons résultat */}
            <div className="flex gap-2">
              <button
                onClick={() => recordMatchResult(m, "A")}
                disabled={m.winner !== null}
                className={`px-3 py-1 rounded ${
                  m.winner === "A"
                    ? "bg-blue-800 text-white"
                    : "bg-blue-600 text-white"
                } ${m.winner !== null ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                Victoire équipe A
              </button>

              <button
                onClick={() => recordMatchResult(m, "B")}
                disabled={m.winner !== null}
                className={`px-3 py-1 rounded ${
                  m.winner === "B"
                    ? "bg-red-800 text-white"
                    : "bg-red-600 text-white"
                } ${m.winner !== null ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                Victoire équipe B
              </button>

              {m.winner !== null && (
                <button
                  onClick={() => undoMatchResult(m)}
                  className="px-3 py-1 bg-gray-300 text-white rounded"
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
