// components/BadmintonMatchmaker.jsx
import { useState, useEffect } from "react";
import { generateMatches, validateRound } from "../utils/matchmaking";
import FullScreenMatches from "./FullScreenMatches";
import TableauJoueursFullScreen from "./TableauJoueursFullScreen";
import TableauStatsJoueurs from "./TableauStatsJoueurs";

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

  const [showSaisirResultats, setshowSaisirResultats] = useState(false);
  const [showPage, setShowPage] = useState("home");
  const [zoom, setZoom] = useState(1);

  const [matchResults, setMatchResults] = useState({
    matches: [],
    resting: [],
  });

  function createInitialPlayers() {
    const initialState = [];
    return initialState;
  }

  function addPlayer() {
    if (!newName.trim()) return;

    // Séparer sur " ; "
    const names = newName
      .split(";")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (names.length === 0) return;

    setPlayers((prev) => [
      ...prev,
      ...names.map((name) => generatePlayerByName(name)),
    ]);

    setNewName("");
  }

  function generatePlayerByName(playerName) {
    const newPlayer = {
      id: crypto.randomUUID(),
      name: playerName,
      wins: 0,
      pastPartners: new Set(),
      restedLastRound: true,
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
    const updatedPlayers = validateRound(players, matchResults, roundCount);
    console.log(
      "Résultats des matchs après validation des joueurs:",
      updatedPlayers
    );
    setPlayers(() => [...updatedPlayers]); //attention à ne pas mettre setPlayers(updatedPlayers) qui ne sauvegarderait pas le tableau.

    // Incrémenter le compteur de round
    setRoundCount((r) => r + 1);
    // Générer de nouvelles équipes
    runMatchmaking(updatedPlayers);
    setMatchmakingGenerated(true);
    setMatchmakingValidated(true);

    // Changer de page pour afficher la liste des joueurs
    setShowPage("players");
  }

  function runMatchmaking(currentPlayers) {
    console.log("** Lancement du matchmaking", currentPlayers);
    const { matches, resting } = generateMatches(currentPlayers, 7);
    console.log("Matches generated:", matches, resting);

    setMatchResults({
      matches: matches.map((m) => ({ ...m, winner: null })), // ajout
      resting,
    });
  }

  function recordMatchResult(match, winner) {
    const winningTeam = winner === "A" ? match.teamA : match.teamB;
    const losingTeam = winner === "A" ? match.teamB : match.teamA;

    // 1️⃣ Mise à jour des victoires -> j'utilise maintenant validateMatch

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

  // 🔽 joueurs triés par nombre de victoires (descendant)
  const sortedPlayersByWins = [...players].sort(
    (a, b) => (b.wins || 0) - (a.wins || 0)
  );

  function zoomUp() {
    setZoom(zoom + 0.1);
  }

  function zoomDown() {
    setZoom(zoom - 0.1);
  }

  let playerPage = (
    <TableauJoueursFullScreen
      players={players}
      matchResults={matchResults}
      zoom={zoom}
      onClose={() => setShowTableauJoueurs(false)}
    />
  );

  let resultsPage = (
    <FullScreenMatches
      matchResults={matchResults}
      matchmakingValidated={matchmakingValidated}
      recordMatchResult={recordMatchResult}
      undoMatchResult={undoMatchResult}
      onClose={() => setShowFullScreenMatches(false)}
    />
  );

  let homePage = (
    <div>
      {/* HEADER */}
      {/* BOUTON SECRET POUR ADMIN */}
      <button
        className="absolute top-0 right-0 w-10 h-10 bg-transparent cursor-pointer"
        onClick={() => setAdmin((a) => !a)}
      />

      {/* AFFICHAGE DU ROUND + ACTIONS + DONNER LES RESULTATS */}
      <div className="">
        {/* AFFICHAGE ETAT DU ROUND */}
        <div className="flex mb-3 text-xl align-baseline">
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
        {/* AFFICHAGE ACTIONS DU ROUND */}
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
        {/* AJOUTER DES PARTICIPANT.E.S */}
        <div className="w-full flex items-baseline">
          <h3 className="font-bold mr-5">Ajouter des participant·e·s : </h3>
          <div className="relative w-full max-w-sm mr-5">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim()) addPlayer();
              }}
              placeholder="Ajouter un prénom"
              className="border rounded-lg w-full py-2 px-3 pr-10"
            />

            {/* Bouton + intégré dans l'input */}
            <button
              onClick={addPlayer}
              disabled={!newName.trim()}
              className={`
absolute right-1 top-1/2 -translate-y-1/2 
p-1.5 rounded-md 
transition 
${
  newName.trim()
    ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
    : "bg-gray-300 text-gray-500 cursor-not-allowed"
}
`}
            >
              <span className="text-xl leading-none">+</span>
            </button>
          </div>

          <button
            className="mt-4 px-3 py-2 bg-orange-600 text-white rounded opacity-100 cursor-pointer"
            onClick={() => {
              runMatchmaking(players);
              setMatchmakingGenerated(true);
              setMatchmakingValidated(true);
              // Changer de page pour afficher la liste des joueurs
              setShowPage("players");
            }}
          >
            {matchResults.matches.length !== 0
              ? "Regénérer le round (en cas d'ajout de joueur·euse·s)"
              : "Générer le round"}
          </button>
        </div>
        {/* TABLEAU */}
        <TableauStatsJoueurs
          players={players}
          sortedPlayersByWins={sortedPlayersByWins}
          admin={admin}
          editingPlayerId={editingPlayerId}
          editName={editName}
          setEditName={setEditName}
          startEdit={startEdit}
          confirmEdit={confirmEdit}
          deletePlayer={deletePlayer}
        />
        {/* AFFICHAGE DES MATCHS avec les REPOS et les TERRAINS */}
        <button
          className="mt-4 px-4 py-2 bg-slate-700 text-white rounded text-lg"
          onClick={() => setshowSaisirResultats((v) => !v)}
        >
          Ancien affichage des matchs
        </button>
        {showSaisirResultats && (
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
              <div
                key={i}
                className={`p-3 mb-2 w-fit border rounded space-y-2`}
              >
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
        )}{" "}
      </div>
    </div>
  );

  let contentPage = homePage;
  switch (showPage) {
    case "players":
      contentPage = playerPage;
      break;
    case "results":
      contentPage = resultsPage;
      break;
    default:
      homePage;
  }

  return (
    <div className="flex">
      {/* MENU */}
      <div className="top-4 right-4 z-10 flex flex-col menuContainer">
        <h1 className="font-bold text-2xl text-center mb-10">
          Round n°{roundCount}
        </h1>

        <button
          onClick={() => {
            setShowPage("home");
          }}
          className="cursor-pointer mb-2 border px-6 py-3 bg-indigo-600 rounded-xl text-2xl text-white hover:bg-indigo-400"
        >
          Accueil
        </button>

        <button
          className="cursor-pointer mb-2 border px-4 py-3 bg-emerald-600 rounded-xl text-2xl text-white hover:bg-emerald-400"
          onClick={() => setShowPage("players")}
        >
          Terrains
        </button>
        <button
          className="cursor-pointer mb-2 border px-4 py-3 bg-green-600 rounded-xl text-2xl text-white hover:bg-green-400"
          onClick={() => setShowPage("results")}
        >
          Résultats
        </button>

        {showPage == "players" && (
          <>
            <button
              onClick={zoomUp}
              className="cursor-pointer mt-30 mb-2 border px-4 py-3 bg-neutral-600 rounded-xl text-l text-white hover:bg-neutral-400"
            >
              Zoom +
            </button>

            <button
              onClick={zoomDown}
              className="cursor-pointer mb-2 border px-4 py-3 bg-neutral-600 rounded-xl text-l text-white hover:bg-neutral-400"
            >
              Zoom -
            </button>
          </>
        )}
      </div>
      {/* CONTENU */}
      <div className="bg-neutral-100 ml-5 p-5 pageContainer">{contentPage}</div>
    </div>
  );
}
