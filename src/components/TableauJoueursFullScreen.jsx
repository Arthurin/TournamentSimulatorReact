import { useEffect, useMemo, useState } from "react";

export default function TableauJoueursFullScreen({
  players,
  matchResults,
  onClose,
}) {
  const [zoom, setZoom] = useState(1);

  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const onResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
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

  /* 🔹 Statut par joueur */
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

  /* 🔹 Layout constants */
  const MIN_AVAILABLE_HEIGHT = 200;
  const MAX_FONT = 42;
  const MIN_FONT = 18;

  const availableHeight = viewport.height;

  function zoomUp() {
    setZoom(zoom + 0.1);
  }

  function zoomDown() {
    setZoom(zoom - 0.1);
  }

  /* 🔴 CAS LIMITE : écran trop petit */
  if (availableHeight < MIN_AVAILABLE_HEIGHT) {
    return (
      <div className="fixed inset-0 z-50 bg-white text-black flex flex-col items-center justify-center">
        <div className="text-2xl font-bold mb-6 text-center">
          Fenêtre trop petite
        </div>
        <div className="text-black text-center mb-10">
          Agrandis la hauteur de l’écran pour afficher le tableau des joueurs.
        </div>
        <button
          onClick={onClose}
          className="px-6 py-3 bg-red-300 rounded-xl text-xl hover:bg-red-700"
        >
          Retour
        </button>
      </div>
    );
  }

  const MIN_COLUMN_CHARS = 28; // prénom + partenaire + icône + terrain

  function estimatedColumnWidth(fontSize) {
    return MIN_COLUMN_CHARS * fontSize * 0.6;
  }

  /* 🔹 Calcul dynamique font / lignes */
  const estimatedRowHeight = (fontSize) => fontSize * 2.2;
  const availableWidth = window.innerWidth - 32; // padding sécurité

  let fontSize = MAX_FONT;
  let rowsPerColumn = Math.floor(
    availableHeight / estimatedRowHeight(fontSize)
  );

  let columnsCount = Math.ceil(sortedPlayers.length / rowsPerColumn);

  while (
    rowsPerColumn > 0 &&
    (rowsPerColumn * 4 < sortedPlayers.length ||
      estimatedColumnWidth(fontSize) * columnsCount > availableWidth) &&
    fontSize > MIN_FONT
  ) {
    fontSize -= 2;
    rowsPerColumn = Math.floor(availableHeight / estimatedRowHeight(fontSize));

    rowsPerColumn = Math.max(rowsPerColumn, 1);
    columnsCount = Math.ceil(sortedPlayers.length / rowsPerColumn);
  }

  rowsPerColumn = Math.max(rowsPerColumn, 1);

  const columns = Array.from({ length: columnsCount }, (_, colIndex) =>
    sortedPlayers.slice(
      colIndex * rowsPerColumn,
      (colIndex + 1) * rowsPerColumn
    )
  );

  /* 🔹 Alignement prénom / statut */
  const measureTextWidth = (text, fontSize) => text.length * fontSize * 0.62;

  const columnNameWidths = columns.map((col) =>
    Math.max(...col.map((p) => measureTextWidth(p.name, fontSize)), 140)
  );

  return (
    <div className="fixed inset-0 z-50 bg-white text-black">
      {/* HEADER */}
      <div className="top-4 right-4 z-10 flex flex-col menuContainer">
        <button
          onClick={onClose}
          className="px-6 py-3 bg-red-300 rounded-xl text-xl hover:bg-red-700"
        >
          Retour
        </button>
        {""}
        <button
          onClick={zoomUp}
          className="px-6 py-3 bg-neutral-300 rounded-xl text-xl hover:bg-neutral-700"
        >
          Zoom +
        </button>
        {""}
        <button
          onClick={zoomDown}
          className="px-6 py-3 bg-neutral-300 rounded-xl text-xl hover:bg-neutral-700"
        >
          Zoom -
        </button>
      </div>

      {/* CONTENU */}
      <div className="listeJoueursFullScreen" style={{ zoom: zoom }}>
        {columns.map((col, colIndex) =>
          col.map((player) => {
            const status = statusById.get(player.id);

            return (
              <div
                key={player.id}
                className="bg-neutral-100 rounded-xl border-2 border-b-black itemJoueurFullScreen flex"
              >
                <div className="items-center w-full">
                  <div className="flex items-center">
                    {/* PRÉNOM */}
                    <div className="font-extrabold">{player.name}</div>

                    {status?.type === "play" && (
                      <>
                        <span className="fieldIcon">🏸</span>
                        <span className="text-black flex items-center gap-1">
                          {status.terrain}
                        </span>
                      </>
                    )}
                  </div>

                  {/* STATUT */}

                  {status?.type === "rest" && (
                    <span className="italic text-black">Repos 💤</span>
                  )}

                  {status?.type === "play" && (
                    <span className="text-green-700 font-semibold">
                      {status.partner}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
