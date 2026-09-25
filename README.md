# Démineur

Un démineur jouable dans le navigateur, en JavaScript vanilla (pas de build, pas de dépendance).

## Lancer le jeu

Ouvrir `index.html` directement dans un navigateur (double-clic, ou glisser-déposer dans une fenêtre). Aucun serveur ni installation n'est nécessaire.

## Règles

Le plateau contient des mines cachées. Le but est de révéler toutes les cases qui ne sont pas des mines. Une case révélée affiche soit un nombre (le compte de mines parmi les 8 cases voisines), soit rien si elle n'a aucune mine adjacente — dans ce cas les cases voisines se révèlent automatiquement en chaîne.

- **Clic gauche** sur une case : la révèle. Cliquer sur une mine termine la partie en défaite (toutes les mines sont alors affichées, celle qui a explosé étant distinguée visuellement).
- **Clic droit** sur une case : pose ou retire un drapeau 🚩, pour marquer une case suspectée de contenir une mine sans la révéler.
- La partie est gagnée quand toutes les cases sans mine sont révélées.
- Le premier clic est toujours sûr : les mines ne sont placées qu'après ce premier clic, et jamais sur la case cliquée ni ses voisines directes.

## Interface

- Le compteur en haut à gauche indique le nombre de mines restantes (total de mines moins drapeaux posés).
- Le bouton central (🙂) relance une nouvelle partie à tout moment.
- Le chrono en haut à droite démarre au premier clic et s'arrête à la fin de la partie.
- Le sélecteur de difficulté change la taille de la grille et le nombre de mines :
  - Débutant : 9×9, 10 mines
  - Intermédiaire : 16×16, 40 mines
  - Expert : 30×16, 99 mines
- À la fin d'une partie (victoire ou défaite), un écran de résumé propose de rejouer.

## Notes techniques

Détails d'implémentation et choix d'architecture dans [`docs/architecture.md`](docs/architecture.md).
