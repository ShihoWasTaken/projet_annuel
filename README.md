# projet_annuel

### Création de la base de données pour les utilisateurs
```sh
# Suppresion de l'ancienne base si elle existe
$ php app/console doctrine:database:drop --force

# Création de la base
$ php app/console doctrine:database:create

# Mise à jour du schéma des tables en fonctions des classes annotées
$ php app/console doctrine:schema:update --force

# Création d'un utilisateur testuser (username email password)
$ php app/console fos:user:create testuser testuser@example.com password

# Promotion de testuser au statut d'admin
$ php app/console fos:user:promote testuser ROLE_ADMIN
```

