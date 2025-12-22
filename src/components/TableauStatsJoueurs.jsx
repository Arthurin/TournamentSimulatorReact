// components/TableauStatsJoueurs.jsx
function getName(players, id) {
  const p = players.find((player) => player.id === id);
  return p ? p.name : "?";
}

export default function TableauStatsJoueurs({
  players,
  sortedPlayersByWins,
  admin,
  editingPlayerId,
  editName,
  setEditName,
  startEdit,
  confirmEdit,
  deletePlayer,
}) {
  return (
    <div className="overflow-x-auto relative scrollbar-thick scrollbar-thumb-gray-400 scrollbar-track-gray-200">
      <table className="mt-3 table-auto border-collapse border w-full min-w-[900px]">
        <thead className="bg-gray-100 border-2 border-black sticky top-0 z-30">
          <tr>
            <th className="border px-2 py-1 sticky left-0 bg-white z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.2)]">
              Prénom
            </th>
            <th className="border px-2 py-1 sticky top-0 bg-gray-100 z-20">
              Victoires
            </th>

            {admin && (
              <th className="border px-2 py-1 sticky top-0 bg-gray-100 z-20">
                Actions
              </th>
            )}

            {Array.from(
              {
                length: Math.max(
                  ...players.map((p) => p.roundHistory?.length || 0)
                ),
              },
              (_, i) => {
                const roundIndex =
                  Math.max(...players.map((p) => p.roundHistory?.length || 0)) -
                  1 -
                  i;
                return (
                  <th
                    key={i}
                    className="border border-black px-2 py-1 text-center sticky top-0 z-20"
                  >
                    Round {roundIndex + 1}
                  </th>
                );
              }
            )}

            <th className="border px-2 py-1 sticky top-0 bg-gray-100 z-20">
              Nb Repos
            </th>
            <th className="border px-2 py-1 sticky top-0 bg-gray-100 z-20">
              Partenaires précédents
            </th>
          </tr>
        </thead>

        <tbody>
          {sortedPlayersByWins.map((player) => (
            <tr key={player.id} className="hover:bg-gray-50">
              <td className="border px-2 py-1 sticky left-0 bg-white z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.2)]">
                {admin && editingPlayerId === player.id ? (
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                ) : (
                  player.name
                )}
              </td>

              <td className="border px-2 py-1 text-center">{player.wins}</td>

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
                        className="border px-2 py-1 text-center italic text-gray-500"
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
                      <div className="flex items-center gap-1">
                        <span className="text-gray-600">
                          Terrain {round.terrain ?? "?"}
                        </span>
                        <span className="text-blue-700">
                          👥 {round.partner}
                        </span>
                        <span className="text-red-700">
                          ⚔️ {opponentsNames || "?"}
                        </span>
                        <span className="font-semibold text-xl ml-auto">
                          {round.won ? "🏆" : "☠️"}
                        </span>
                      </div>
                    </td>
                  );
                }
              )}

              <td className="border px-2 py-1 text-center">
                {player.restCount || 0}
              </td>

              <td className="border px-2 py-1 text-center whitespace-nowrap">
                {[...player.pastPartners]
                  .map((partnerId) => {
                    const name = getName(players, partnerId);
                    const count = player.partnersHistory?.[partnerId] || 1;
                    return count > 1 ? `${name} (x${count})` : name;
                  })
                  .join(" ; ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
