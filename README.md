# Présentation

## Matchmaking pour tournois en 2V2

L'algorithme prend en compte le nombre de pauses et priorise les joueurs qui étaient au repos le dernier round. Ensuite ça regroupe et cherche les meilleurs combinaisons en priorisant le nombre de victoire, puis le nombre de fois qu'on a déjà joué avec les joueurs ayant ce nombre de victoire.

Sur la page on peut voir un tableau récapitulatif, et en bas de la page il y a le round en cours.
En fonction de l'état du round on aura : un bouton pour valider le matchmaking et commencer le round ;
Ensuite quand le round est en cours on peut cliquer sur les binomes pour indiquer qui a gagné ;
Et enfin, quand tous les résultats sont obtenus, on peut cliquer sur le bouton pour passer au round suivant.

Fonctionnalités d'admin depuis l'interface : activer le "mode admin" permet de supprimer des joueurs et de modifier les prénoms.

Pour ajouter plusieurs joueurs d'un coup, il est possible d'utiliser le séparateur ";". Par exemple :
Joueur A ; Joueur B ; Joueur C ; Joueur D ; Joueur E ; Joueur F ; Joueur G ; Joueur H ; Joueur I ; Joueur J ; Joueur K ; Joueur L ; Joueur M ; Joueur N ; Joueur O ; Joueur P ; Joueur Q

Idées d'amélioration :

- Ajout de joueurs séparés par un retour à la ligne plutôt qu'un ;
- Sauvegarder dans le navigateur les données pour ne pas tout perdre en cas de rafraichissement de la page
- Permettre de mettre un joueur sur la touche depuis la page Accueil et de le rajouter ensuite.
- Dans la saisie des résultats permettre de donner un point à un joueur au repos (comme ça 2 personnes au repos peuvent faire un match simple)

# Dev

Commande pour publier sur github : npm run deploy

Testable ici : https://arthurin.github.io/TournamentSimulatorReact/

# Screenshots

![Page d'accueil](/docs/1.png "Page d'accueil")
![Page joueurs - round 1](/docs/2.png "Page joueurs - round 1")
![Page résultats - round 1](/docs/3.png "Page résultats - round 1")
![Page résultats - round 1 (complété)](/docs/4.png "Page résultats - round 1 (complété)")
![Page joueurs - round 2](/docs/2.png "Page joueurs - round 2")
![Page d'accueil - round 3](/docs/6.png "Page d'accueil - round 3")
