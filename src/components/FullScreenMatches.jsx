export default function FullScreenMatches({
  matchResults,
  matchmakingValidated,
  recordMatchResult,
  undoMatchResult,
  onClose,
}) {
  return (
    <div className="matchesContainer">
      {/* REPOS */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Au repos</h2>
        <div className="flex flex-wrap gap-3">
          {matchResults.resting.map((p) => (
            <div
              key={p.id}
              className="px-4 py-2 bg-neutral-200 rounded text-2xl font-semibold"
            >
              {p.name}
            </div>
          ))}
        </div>
      </div>

      {/* MATCHES */}
      <div className="fieldContainer">
        {matchResults.matches.map((m, i) => (
          <div
            key={i}
            className="bg-neutral-200 rounded-xl p-6 flex flex-col justify-between"
          >
            {/* TERRAIN */}
            <div className="text-center mb-4">
              <div className="text-3xl h-fit font-extrabold uppercase tracking-widest">
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
