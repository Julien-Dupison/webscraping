Ajouts :

------------------------------------------------------------------
aloa/cwtaxes/veille/ :

   images_annonce/
      1.jpg
      2.jpg
      ect ...
   includes/
      class_comparerimage.php
      fonction_veille.php
   scripts/
      insert_new_annonce.php
      lier_annonce_hebergement.php
      update_statut_annonce.php
   annonce.php
   veille.php
   
   Description :
   ____________________________________________________________________________________   

   images_annonces/ : dossier contenant l'ensemble des images

   includes/ : dossier contenant les classes et fonctions utilisées par annonce.php et veille.php
      class_comparerimage.php : classe permetant de comparer deux images
      fonction_veille.php : contient l'ensemble des fonctions d'affichage et de traitement

   scripts/ :
      insert_new_annonce.php : permets de recuperer les donnees generées par l'API node.js et de les inserer en base
      lier_annonce_hebergement.php : permets de referencer un hebergement sur une annonce
      update_statut_annonce.php : permets de changer le statut d'une annonce (en attente/reportée/validée/supprimée)
   ____________________________________________________________________________________

----------------------------------------------------------------------
aloa/css/

   veille.css

   Description :
   _____________________________________________________________________________________

   veille.css : feuille de style de mon projet
   _____________________________________________________________________________________

----------------------------------------------------------------------




Modifications :

----------------------------------------------------------------------
aloa/cwtaxes/includes/haut.inc.php

    ligne 208 : inclusion de fontawesome
    ligne 210 : inclusion de veille.css
----------------------------------------------------------------------



BDD :

Ajouts Table: 

cwtaxes_annonces :

Field                Type          Collation        Null    Key     Default  Extra           Privileges                       Comment  
-------------------  ------------  ---------------  ------  ------  -------  --------------  -------------------------------  ---------
id_annonce           int(12)       (NULL)           NO      PRI     (NULL)   auto_increment  select,insert,update,references           
titre_annonce        varchar(255)  utf8_general_ci  YES             (NULL)                   select,insert,update,references           
ville_annonce        varchar(255)  utf8_general_ci  YES             (NULL)                   select,insert,update,references           
CP_annonce           varchar(255)  utf8_general_ci  YES             (NULL)                   select,insert,update,references           
latitude_annonce     varchar(255)  utf8_general_ci  YES             (NULL)                   select,insert,update,references           
longitude_annonce    varchar(255)  utf8_general_ci  YES             (NULL)                   select,insert,update,references           
description_annonce  text          utf8_general_ci  YES             (NULL)                   select,insert,update,references           
image_annonce        varchar(255)  utf8_general_ci  YES             (NULL)                   select,insert,update,references           
telephone_annonce    varchar(255)  utf8_general_ci  YES             (NULL)                   select,insert,update,references           
mail_annonce         varchar(255)  utf8_general_ci  YES             (NULL)                   select,insert,update,references           
provenance_annonce   varchar(255)  utf8_general_ci  YES             (NULL)                   select,insert,update,references           
statut_annonce       int(1)        (NULL)           YES             1                        select,insert,update,references           
hebergement_annonce  int(8)        (NULL)           YES             (NULL)                   select,insert,update,references      


cwtaxes_annonces_statuts :

Field           Type          Collation        Null    Key     Default  Extra           Privileges                       Comment  
--------------  ------------  ---------------  ------  ------  -------  --------------  -------------------------------  ---------
id_statut       int(8)        (NULL)           NO      PRI     (NULL)   auto_increment  select,insert,update,references           
libelle_statut  varchar(255)  utf8_general_ci  YES             (NULL)                   select,insert,update,references           









