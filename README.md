# projet_annuel

### Compilation de la solution client
```sh
$ npm install nw-builder
```
- Se rendre dans le dossier nodejs_client
```sh
$ nwbuild -p linux64 .
```
- L'exécutable sera build/Client/linux64/Client

### Création de la base de données pour les utilisateurs
```sh
# Suppresion de l'ancienne base si elle existe
$ php bin/console doctrine:database:drop --force

# Création de la base
$ php bin/console doctrine:database:create

# Mise à jour du schéma des tables en fonctions des classes annotées
$ php bin/console doctrine:schema:update --force

# Création d'un utilisateur testuser (username email password)
$ php bin/console fos:user:create testuser testuser@example.com password

# Promotion de testuser au statut d'admin
$ php bin/console fos:user:promote testuser ROLE_ADMIN

# Changement des droits du fichier database.sqlite et du dossier parent afin que le serveur web puisse y écrire
$ chown :www-data database.sqlite
$ chmod g+w database.sqlite
$ chown :www-data .
$ chmod g+w .

# Changement des droits du dossier où on upload les vidéos afin que le serveur web puisse y écrire
$ chown :www-data src/AppBundle/Resources/public/uploads
$ chmod g+w src/AppBundle/Resources/public/uploads
```
