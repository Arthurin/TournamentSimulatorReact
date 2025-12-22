Matchmaking pour jouer en 2V2

L'algorithme prend en compte le nombre de pauses et priorise les joueurs qui étaient au repos le dernier round. Ensuite ça regroupe et cherche les meilleurs combinaisons en priorisant le nombre de victoire, puis le nombre de fois qu'on a déjà joué avec les joueurs ayant ce nombre de victoire.

Sur la page on peut voir un tableau récapitulatif, et en bas de la page il y a le round en cours.
En fonction de l'état du round on aura : un bouton pour valider le matchmaking et commencer le round ;
Ensuite quand le round est en cours on peut cliquer sur les binomes pour indiquer qui a gagné ;
Et enfin, quand tous les résultats sont obtenus, on peut cliquer sur le bouton pour passer au round suivant.

Fonctionnalité cachée : il y a un bouton invisible tout en haut à droite qui permet d'activer le mode "admin" : supprimer un joueur, modifier son prénom.

Pour ajouter plusieurs joueurs d'un coup, il est possible d'utiliser le séparateur ";". Par exemple :
j1 ; j2 ; j3 ; j4 ; j5 ; j6 ; j7 ; j8 ; j9 ; j10 ; j11 ; j12 ; j13 ; j14 ; j15 ; j16 ; j17 ; j18 ; j19 ; j20 ; j21 ; j22 ; j23 ; j24 ; j25

Testable ici : https://arthurin.github.io/TournamentSimulatorReact/

Idées d'amélioration :

- Scénario de navigation cohérent : Accueil - En place - Saisir les résultats
- Ajout de joueurs séparés par un retour à la ligne plutôt qu'un ;
- Sauvegarder dans le navigateur les données pour ne pas tout perdre en cas de rafraichissement de la page
- Permettre de mettre un joueur sur la touche depuis la page Accueil et de le rajouter ensuite.
- Dans la saisie des résultats permettre de donner un point à un joueur au repos (comme ça 2 personnes au repos peuvent faire un match simple)

Commande de dev :
Pour publier sur github : npm run deploy
