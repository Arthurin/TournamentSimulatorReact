export default function FullScreenMatches({
  matchResults,
  matchmakingValidated,
  recordMatchResult,
  undoMatchResult,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-50 bg-neutral-900 text-white p-6 flex flex-col">
      {/* REPOS */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Au repos</h2>
        <div className="flex flex-wrap gap-3">
          {matchResults.resting.map((p) => (
            <div
              key={p.id}
              className="px-4 py-2 bg-neutral-700 rounded text-2xl font-semibold"
            >
              {p.name}
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="text-xl px-4 py-2 bg-red-600 rounded hover:bg-red-700 fixed top-4 right-4"
        >
          Retour
        </button>
      </div>

      {/* MATCHES */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-auto">
        {matchResults.matches.map((m, i) => (
          <div
            key={i}
            className="bg-neutral-800 rounded-xl p-6 flex flex-col justify-between"
          >
            {/* TERRAIN */}
            <div className="text-center mb-4">
              <div className="text-3xl font-extrabold uppercase tracking-widest">
                Terrain {i + 1}
              </div>
            </div>

            {/* EQUIPES */}
            <div className="flex flex-col gap-6">
              {/* TEAM A */}
              <button
                disabled={!matchmakingValidated}
                onClick={() => {
                  if (m.winner === "A") undoMatchResult(m);
                  else if (!m.winner) recordMatchResult(m, "A");
                }}
                className={`rounded-xl p-6 text-3xl font-bold transition
                    ${
                      m.winner === "A"
                        ? "bg-green-600"
                        : "bg-blue-600 hover:bg-green-600"
                    }
                    ${
                      m.winner && m.winner !== "A"
                        ? "opacity-40 cursor-not-allowed"
                        : ""
                    }
                  `}
              >
                {m.teamA.map((p) => (
                  <div key={p.id}>{p.name}</div>
                ))}
                {m.winner === "A" && <div className="mt-2">🏆 Victoire</div>}
              </button>

              <div className="text-center text-4xl font-extrabold">VS</div>

              {/* TEAM B */}
              <button
                disabled={!matchmakingValidated}
                onClick={() => {
                  if (m.winner === "B") undoMatchResult(m);
                  else if (!m.winner) recordMatchResult(m, "B");
                }}
                className={`rounded-xl p-6 text-3xl font-bold transition
                    ${
                      m.winner === "B"
                        ? "bg-green-600"
                        : "bg-pink-600 hover:bg-green-600"
                    }
                    ${
                      m.winner && m.winner !== "B"
                        ? "opacity-40 cursor-not-allowed"
                        : ""
                    }
                  `}
              >
                {m.teamB.map((p) => (
                  <div key={p.id}>{p.name}</div>
                ))}
                {m.winner === "B" && <div className="mt-2">🏆 Victoire</div>}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
