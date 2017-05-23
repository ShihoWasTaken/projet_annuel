# projet_annuel

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

# Changement des droits du fichier users.sqlite afin que le serveur web puisse y écrire
chown :www-data users.sqlite
chmod g+w users.sqlite
```

