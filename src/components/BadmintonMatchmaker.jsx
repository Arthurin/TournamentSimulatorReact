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

  const [matchesResult, setMatchesResult] = useState({
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

    setMatchesResult({ matches, resting });
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
        {matchesResult.matches.map((m, i) => (
          <div key={i} className="p-2 border rounded mb-2">
            <strong>Terrain {i + 1}</strong> :
            {m.teamA.map((p) => p.name).join(" + ")} vs{" "}
            {m.teamB.map((p) => p.name).join(" + ")}
          </div>
        ))}

        <h4 className="mt-4 font-medium">Au repos :</h4>
        {matchesResult.resting.map((p) => (
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
