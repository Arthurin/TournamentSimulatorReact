import { useEffect, useMemo, useState } from "react";

export default function TableauJoueursFullScreen({
  players,
  matchResults,
  onClose,
}) {
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const onResize = () =>
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* 🔹 Tri alphabétique */
  const sortedPlayers = useMemo(
    () =>
      [...players].sort((a, b) =>
        a.name.localeCompare(b.name, "fr", { sensitivity: "base" })
      ),
    [players]
  );

  /* 🔹 Map joueur → statut */
  const statusById = useMemo(() => {
    const map = new Map();

    matchResults.matches.forEach((m, i) => {
      m.teamA.forEach((p) => {
        const partner = m.teamA.find((x) => x.id !== p.id);
        map.set(p.id, {
          type: "play",
          terrain: i + 1,
          partner: partner?.name,
        });
      });
      m.teamB.forEach((p) => {
        const partner = m.teamB.find((x) => x.id !== p.id);
        map.set(p.id, {
          type: "play",
          terrain: i + 1,
          partner: partner?.name,
        });
      });
    });

    matchResults.resting.forEach((p) => map.set(p.id, { type: "rest" }));

    return map;
  }, [matchResults]);

  /* 🔹 Calcul layout */
  const HEADER_HEIGHT = 110; // header + padding
  const availableHeight = viewport.height - HEADER_HEIGHT;

  const MAX_FONT = 42;
  const MIN_FONT = 20;

  const estimatedRowHeight = (fontSize) => fontSize * 2.2;

  let fontSize = MAX_FONT;
  let rowsPerColumn = Math.floor(
    availableHeight / estimatedRowHeight(fontSize)
  );

  while (rowsPerColumn * 2 < sortedPlayers.length && fontSize > MIN_FONT) {
    fontSize -= 2;
    rowsPerColumn = Math.floor(availableHeight / estimatedRowHeight(fontSize));
  }

  const columnsCount = Math.ceil(sortedPlayers.length / rowsPerColumn);

  const columns = Array.from({ length: columnsCount }, (_, colIndex) =>
    sortedPlayers.slice(
      colIndex * rowsPerColumn,
      (colIndex + 1) * rowsPerColumn
    )
  );

  const measureTextWidth = (text, fontSize) => {
    return text.length * fontSize * 0.62; // approximation fiable monospace-like
  };

  const columnNameWidths = columns.map((col) =>
    Math.max(
      ...col.map((p) => measureTextWidth(p.name, fontSize)),
      120 // largeur minimale
    )
  );

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900 text-white">
      {/* HEADER */}
      <div className="float-right">
        <button
          onClick={onClose}
          className="px-5 py-3 bg-red-600 text-l rounded hover:bg-red-700"
        >
          Retour
        </button>
      </div>

      {/* CONTENU */}
      <div className="flex px-6 gap-6" style={{ height: availableHeight }}>
        {columns.map((col, colIndex) => (
          <div key={colIndex} className="flex-1 flex flex-col">
            {col.map((player) => {
              const status = statusById.get(player.id);

              return (
                <div
                  key={player.id}
                  className="bg-neutral-800 rounded-xl px-6 flex items-center"
                  style={{
                    height: availableHeight / rowsPerColumn,
                    fontSize,
                  }}
                >
                  <div
                    className="grid items-center gap-x-6"
                    style={{
                      gridTemplateColumns: `${columnNameWidths[colIndex]}px 1fr`,
                      width: "100%",
                    }}
                  >
                    {/* PRÉNOM */}
                    <div className="font-extrabold truncate">{player.name}</div>

                    {/* STATUT */}
                    <div className="flex items-center gap-4 text-left">
                      {status?.type === "rest" && (
                        <span className="italic text-gray-300 text-[0.9em]">
                          Repos 💤
                        </span>
                      )}

                      {status?.type === "play" && (
                        <>
                          <span className="text-green-400 font-semibold truncate">
                            {status.partner}
                          </span>
                          <span className="text-gray-300 text-[0.9em] flex items-center gap-1">
                            🏸 {status.terrain}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
