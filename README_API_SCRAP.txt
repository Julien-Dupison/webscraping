structure des fichiers :

data/
   donnees-x.json
   donnees-y.json
   ect ...
modules/
   module_abritel.js
   module_homeliday.js
   module_leboncoin.js
node_modules/
   body-parser/
   cheerio/
   express/
   request/
parametres/
   parametres-x.json
   parametres-y.json
core.js

Description :

   data/ : Dossier contenant un fichier donnees-x.json pour chaque client
   modules/ : Dossier contenant l'ensemble des modules specifiques aux sites
   node_modules/ : Dossier contenant l'ensemble des modules node necessaires au fonctionnement de l'appli
   parametres/ : Dossier contenant un fichier parametres-x.json pour chaque client
   core.js : fichier principal � executer pour lancer l'appli

fonctionnement global :

l'appli consiste en un serveur node.js qui est charg� de recuperer les donn�es des annonces pass�es sur
differents sites web en fonctions des parametres de recherche de chaque client, un fichier donnees-x.json
est ainsi cr�e o� x est le nom du client

fonctionnement d�taill� :

   ajouter un client :

   pour ajouter un client, il suffit de creer un fichier parametres-'$subdomain'.json o� $subdomain est le
   subdomaine du client, core.js se chargera de creer automatiquement le fichier donnees-'$subdomain'.json
    


   ajouter la gestion d'un site :

   afin d'ajouter un site web, il faut creer un fichier module_'nomdusite'.js et de le ranger dans le
   dossier modules/.

   module_'nomdusite'.js est constitu� d'une fonction getlinks() qui est appell�e par core.js et genere 
   un fichier 'nomdusite'-'$subdomain'.json qui contient une liste de lien vers les annonces detaill�es
   de chaque site. Ne pas oublier d'exporter la fonction getlinks afin de pouvoir l'utiliser dans core.js

   dans core.js il faut : importer le nouveau module
                          appeller la fonction getlinks du nouveau module dans la fonction recherche
                          ajouter un index que l'on nomme 'nomindex' dans l'objet returns pour le nouveau module et l'initialiser � false
                          ajouter un cas dans le switch de la fonction checkreturn o� l'on mets returns.'nomindex' � true
                          toujours dans checkreturns, rajouter "&& returns.'nomindex'" dans le if()
			  dans la fonction regroupement recuperer le fichier 'nomdusite'-'$subdomain'.json et le concat � tablink
			  dans la fonction purgetemp supprimer le fichier temporaire 'nomdusite'-'$subdomain'.json
                          dans la fonction getdata ajouter un case pour le nouveau site
