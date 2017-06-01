# projet_annuel
### Pré-requis
#### Serveur
Il est nécessaire d'installer les paquets suivants:
- google-chrome-stable
- ffmpeg
- composer
- version 6 de NodeJS minimum
- La dernière version de npm
- Apache
- Version 5.5.9 de PHP minimum
- Extensions PHP: JSON, ctype, PDO, PDO_sqlite, XML, Apache

Il faut également:
- Renseigner le paramètre date.timezone dans le fichier php.ini

### Installation de NodeJS 6 (LTS)
```sh
# Install Node.js 6.x repository
sudo curl -sL https://deb.nodesource.com/setup_6.x | sudo bash -

# Install Node.js and npm
sudo apt-get install -y nodejs
```

### Compilation de la solution client
```sh
npm install nw-builder -g
```
- Se rendre dans le dossier nodejs_client
```sh
nwbuild -p linux64 .
```
- L'exécutable sera build/Client/linux64/Client

### Mise à jour de permissions du serveur web afin d'écrire dans le dossier cache et le dossier logs
```sh
HTTPDUSER=$(ps axo user,comm | grep -E '[a]pache|[h]ttpd|[_]www|[w]ww-data|[n]ginx' | grep -v root | head -1 | cut -d\  -f1)
sudo setfacl -R -m u:"$HTTPDUSER":rwX -m u:$(whoami):rwX var
sudo setfacl -dR -m u:"$HTTPDUSER":rwX -m u:$(whoami):rwX var
```
### Création de la base de données pour les utilisateurs
```sh
# Se rendre à la racine du projet
# Suppresion de l'ancienne base si elle existe
php bin/console doctrine:database:drop --force

# Création de la base
php bin/console doctrine:database:create

# Mise à jour du schéma des tables en fonctions des classes annotées
php bin/console doctrine:schema:update --force

# Création d'un utilisateur testuser (username email password)
php bin/console fos:user:create testuser testuser@example.com password

# Promotion de testuser au statut d'admin
php bin/console fos:user:promote testuser ROLE_ADMIN

# Changement des droits du fichier database.sqlite et du dossier parent afin que le serveur web puisse y écrire
sudo chown :www-data database.sqlite
sudo chmod g+w database.sqlite
sudo chown :www-data .
sudo chmod g+w .

# Changement des droits du dossier où on upload les vidéos afin que le serveur web puisse y écrire
sudo chown :www-data src/AppBundle/Resources/public/uploads
sudo chmod g+w src/AppBundle/Resources/public/uploads

# Installation des dépendances de l'éxécutable du serveur node
cd web/nodejs_server && npm install && cd ../..
```
