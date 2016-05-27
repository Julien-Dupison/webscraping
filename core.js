//on importe les differents modules node.js necessaires au fonctionnement de l'application
express = require('express');
fs = require('fs');
request = require('request');
cheerio = require('cheerio');
path = require('path');
bodyParser = require('body-parser');
app = express();

var demandeur;

//on importe les parametres definis dans parametres.json et on appelle la suite du programme
function start(demandeur){
	var parametres = require('./parametres/parametres-'+demandeur+'.json');
	recherche(parametres,demandeur,checkreturn);
}

//on importe le module de chaque site que l'on souhaite parcourir
var module_leboncoin = require('./modules/module_leboncoin.js');
var module_homeliday = require('./modules/module_homeliday.js');
var module_abritel = require('./modules/module_abritel.js');

//fonction permettant d'enclancher la procédure, on appelle la fonction getlinks de chaque module avec, comme parametres, les données extraites de parametre.json, un encodage spécifique à chaque site et le callback (checkreturn).
function recherche(parametres,demandeur,callback){
	console.log("debut de generation des .json")
	module_homeliday.getlinks(parametres.region,parametres.ville,parametres.nbpage,"utf8",demandeur,callback);
	module_leboncoin.getlinks(parametres.region,parametres.ville,parametres.nbpage,"binary",demandeur,callback);
	module_abritel.getlinks(parametres.region,parametres.ville,parametres.nbpage,"binary",demandeur,callback);
}

//On initialise un objet contenant les valeurs de retour des modules, à la fin de l'execution de chaque module un callback (checkreturn) se charge de passer la valeur de ce module à vrai
var returns = {
	leboncoin:false,
	homeliday:false,
	abritel:false
}

//Fonction de callback de recherche(), elle prend en paramètre une chaine de caractères génerée dans le module, permettant d'identifier la source du callback et de définir la valeur correspondante de l'objet returns à vrai, à chaque appel on vérifie si toutes les valeurs de l'objet returns sont vraies, si c'est le cas, tous les modules ont terminé leur processus, on peut appeller la suite du programme, la fonction regroupement().
function checkreturn(ref,demandeur){
	switch(ref){
		case "leboncoin":
			returns.leboncoin = true;
			console.log('	leboncoin-'+demandeur+'.json généré');
		break;

		case "homeliday":
			returns.homeliday = true;
			console.log('	homeliday-'+demandeur+'.json généré');
		break;

		case "abritel":
			returns.abritel = true;
			console.log('	abritel-'+demandeur+'.json généré');
		break;
	}

	//if(returns.leboncoin == true && returns.homeliday == true && returns.abritel == true){
	if(returns.abritel && returns.homeliday && returns.leboncoin){
		console.log('tous les .json ont été générés, regroupement en cours ...');
		regroupement(purgetemp,demandeur,getdata);
	}
}

//On initialise un tableau destiné à stocker les liens générés par les modules
var tablink = [];

//fonction permettant de rassembler en un seul tableau les données de tous les modules, elle prend comme parametres deux fonctions, la première permettant de supprimer les .json et l'autre etant le callback (getdata()).
function regroupement(purge,demandeur,callback){

	//on importe le .json généré par chaque module
	var links_leboncoin = require('./data/leboncoin-'+demandeur+'.json');
	var links_homeliday = require('./data/homeliday-'+demandeur+'.json');
	var links_abritel = require('./data/abritel-'+demandeur+'.json');

	//on pousse dans tablink le contenu de ces .json
	tablink = tablink.concat(links_leboncoin.annonces);
	tablink = tablink.concat(links_homeliday.annonces);
	tablink = tablink.concat(links_abritel.annonces);
	//appel de la fonction purgetemp() qui detruit les .json, ils ne sont plus utiles un
	purge(demandeur);

	//appel de la fonction getdata() avec comme parametre le premier index de tablink
	callback(tablink[0],demandeur);
}

//fonction permettant de supprimer les .json, desormais inutiles, du disque
function purgetemp(demandeur){
	fs.unlink('data/leboncoin-'+demandeur+'.json',function(){
		console.log('leboncoin-'+demandeur+'.json purgé');
	});
	fs.unlink('data/homeliday-'+demandeur+'.json',function(){
		console.log('homeliday-'+demandeur+'.json purgé');
	});
	fs.unlink('data/abritel-'+demandeur+'.json',function(){
		console.log('abritel-'+demandeur+'.json purgé');
	});
}

//fonction principale du programme, elle prend comme parametre un objet issu de tablink ayant cette structure {"lien":"urlduneannonce","provenance":"lesite"}, puis selon la provenance, ouvre l"url et parcoure le DOM correspondant afin de recolter les informations
function getdata(link,demandeur){
	//switch permettant de differencier les sites
	switch(link.provenance){
		//cas leboncoin
		case "leboncoin":
			//objet option contenant l'url et l'encodage du sites
			var option = {'url':link.lien, 'encoding':'binary'};
			//on utilise request() pour envoyer une requete HTTP
			request(option, function(error, response, body){
				//s'il n'y a pas d'erreur
				if(!error){

					//on recupère l'url
					var url = this.uri.href;
					//on initialise un objet donneesannonce contenant toutes les informations que l'on cherche
					var donneesannonce = {"lien":url,"titre":"","ville":"","CP":"","latitude":"","longitude":"","description":"","telephone":"","mail":"","image":"","provenance":"leboncoin"};

					//on utilise cheerio pour simplifier le parcours du DOM puis on commence à chercher les informations dans la page
					var $ = cheerio.load(body);
					var titre = $('h1.no-border').text();

					var adresse = $("[itemprop='address']").text();

					var ville = adresse.substring(adresse.length, adresse.length-6);
					var CP = adresse.substring(adresse.length-5, adresse.length);

					var coord = $('.lbcParams').first().children().eq(1).first().first().children().eq(1).children().eq(1);

					var latitude = coord.children().eq(0).children().eq(0).attr('content');
					var longitude = coord.children().eq(1).children().eq(0).attr('content');

					var description = $("[itemprop='description']").text();
					description = description.replace(/\s+/g," ");

					if(description){
						var telephone = description.match(/[0-9]{10,10}|[0-9]{2,2}\s[0-9]{2,2}\s[0-9]{2,2}\s[0-9]{2,2}\s[0-9]{2,2}/g);
						donneesannonce.telephone = telephone;
						var mail = description.match(/[a-zA-Z0-9]*@[a-zA-Z]*.[a-zA-Z]{2,3}/g);
						donneesannonce.mail = mail;
					}

					var image = $("[data-popin-type='image']").children().eq(0).attr('src');
					if(image){
						image = 'http:'+image;
					}

					//on remplis l'objet donneesannonce avec ce que l'on a extrait du site
					donneesannonce.titre = titre;
					donneesannonce.ville = ville;
					donneesannonce.CP = CP;
					donneesannonce.latitude = latitude;
					donneesannonce.longitude = longitude;
					donneesannonce.description = description;
					donneesannonce.image = image;

					//on appelle la fonction checkdata() qui prends en parametre l'objet donneesannonce et un rapport d'erreur, ici pas d'erreur, on renvoie false
					checkdata(donneesannonce,demandeur,false);

				} else { //sinon en cas d'erreur
					//on recupère l'url
					var url = this.uri.href;
					//on initialise un objet donneesannonce vide qui ne sert que de placeholder pour la fonction checkdata()
					var donneesannonce = {"lien":url,"titre":"ERREUR","ville":"","CP":"","latitude":"","longitude":"","description":"","telephone":"","mail":"","image":"","provenance":"leboncoin"};

					//on appelle la fonction checkdata avec le placeholder et le rapport d'erreur
					checkdata(donneesannonce,demandeur,error);
				}
			});
		break;
		//cas homeliday
		case "homeliday":
			//objet option contenant l'url et l'encodage du sites
			var option = {'url':link.lien, 'encoding':'utf8'};
			//on utilise request() pour envoyer une requete HTTP
			request(option, function(error, response, body){
				//s'il n'y a pas d'erreur
				if(!error){
					//on recupère l'url
					var url = this.uri.href;
					//on initialise un objet donneesannonce contenant toutes les informations que l'on cherche
					var donneesannonce = {"lien":url,"titre":"","ville":"","CP":"","latitude":"","longitude":"","description":"","telephone":"","mail":"","image":"","provenance":"homeliday"};
					//on utilise cheerio pour simplifier le parcours du DOM puis on commence à chercher les informations dans la page
					var $ = cheerio.load(body);

					var titre = $('.property-actions-wrapper').children().eq(0).text();
					titre = titre.replace(/\s+/g," ");
					titre = titre.substr(1,titre.length-2);

					var ville = $('.breadcrumb-lt-header').children().eq(6).children().eq(0).children().eq(0).text();
					if(ville == ""){
						ville = $('.breadcrumb-lt-header').children().eq(5).children().eq(0).children().eq(0).text();
					}
					ville = ville.replace(/\s+/g," ");
					ville = ville.substr(0,ville.length-1);

					var latitude = body.match(/"latitude":[0-9]{1,}.[0-9]{0,9}/g);
					if(latitude){
						latitude = latitude[0];
						latitude = latitude.substr(11,latitude.lenght);
						donneesannonce.latitude = latitude
					}

					var longitude = body.match(/"longitude":[0-9]{1,}.[0-9]{0,9}/g);
					if(longitude){
						longitude = longitude[0];
						longitude = longitude.substr(12,longitude.lenght);
						donneesannonce.longitude = longitude
					}

					var image = $('.carousel-placeholder-image').children().eq(0).attr('src');
					image = image.substr(5,image.lenght);
					image = 'http'+image;

					var description = $('.property-information').children().eq(1).children().eq(0).text();
					if(description == ""){
						description = $('.preview').text();
						if(description == ""){
							description = $('.property-information').children().eq(2).text();
						}
					}

					description = description.replace(/\s+/g," ");
					if(description == "Les points clés de votre logement"){
						description = $('.preview').text();
					}
					description = description.replace(/\s+/g," ");

					if(description){
						var telephone = description.match(/[0-9]{10,10}|[0-9]{2,2}\s[0-9]{2,2}\s[0-9]{2,2}\s[0-9]{2,2}\s[0-9]{2,2}/g);
						donneesannonce.telephone = telephone;
						var mail = description.match(/[a-zA-Z0-9]*@[a-zA-Z]*.[a-zA-Z]{2,3}/g);
						donneesannonce.mail = mail;
					}

					//on remplis l'objet donneesannonce avec ce que l'on a extrait du site
					donneesannonce.description = description;
					donneesannonce.image = image;
					donneesannonce.titre = titre;
					donneesannonce.ville = ville;

					//on appelle la fonction checkdata() qui prends en parametre l'objet donneesannonce et un rapport d'erreur, ici par d'erreur, on renvoie false
					checkdata(donneesannonce,demandeur,false);

				} else {
					//on recupère l'url
					var url = this.uri.href;
					//on initialise un objet donneesannonce vide qui ne sert que de placeholder pour la fonction checkdata()
					var donneesannonce = {"lien":url,"titre":"ERREUR","ville":"","CP":"","latitude":"","longitude":"","description":"","telephone":"","mail":"","image":"","provenance":"leboncoin"};
					//on appelle la fonction checkdata avec le placeholder et le rapport d'erreur
					checkdata(donneesannonce,demandeur,error);
				}
			});

		break;
		//cas abritel
		case "abritel" :
			//objet option contenant l'url et l'encodage du sites
			var option = {'url':link.lien, 'encoding':'utf8'};
			//on utilise request() pour envoyer une requete HTTP
			request(option, function(error, response, body){
				//s'il n'y a pas d'erreur
				if(!error){
					//on recupère l'url
					var url = this.uri.href;
					//on initialise un objet donneesannonce contenant toutes les informations que l'on cherche
					var donneesannonce = {"lien":url,"titre":"","ville":"","CP":"","latitude":"","longitude":"","description":"","telephone":"","mail":"","image":"","provenance":"abritel"};
					//on utilise cheerio pour simplifier le parcours du DOM puis on commence à chercher les informations dans la page
					var $ = cheerio.load(body);

					var titre = $('#wrapper').children().eq(1).children().eq(2).children().eq(3).text();
					if(!titre){
						titre = $('#wrapper').children().eq(2).children().eq(2).children().eq(3).text();
					}
					var ville = $('#wrapper').children().eq(1).children().eq(2).children().eq(1).children('.last').children().eq(0).children().eq(0).text();
					if(!ville){
						ville =  $('#wrapper').children().eq(2).children().eq(2).children().eq(1).children('.last').children().eq(0).children().eq(0).text();
					}

					var latitude = body.match(/"latitude":[0-9]{1,}.[0-9]{0,9}/g);
					if(latitude){
						latitude = latitude[0];
						latitude = latitude.substr(11,latitude.lenght);
						donneesannonce.latitude = latitude
					}

					var longitude = body.match(/"longitude":[0-9]{1,}.[0-9]{0,9}/g);
					if(longitude){
						longitude = longitude[0];
						longitude = longitude.substr(12,longitude.lenght);
						donneesannonce.longitude = longitude
					}

					var description = $('.prop-desc-txt').text();
					description = description.replace(/\s+/g," ");

					if(description){
						var telephone = description.match(/[0-9]{10,10}|[0-9]{2,2}\s[0-9]{2,2}\s[0-9]{2,2}\s[0-9]{2,2}\s[0-9]{2,2}/g);
						donneesannonce.telephone = telephone;
						var mail = description.match(/[a-zA-Z0-9]*@[a-zA-Z]*.[a-zA-Z]{2,3}/g);
						donneesannonce.mail = mail;
					}

					var image = $('.carousel-placeholder-image').children().eq(0).attr('src');
					image = image.substr(5,image.lenght);
					image = 'http'+image;

					donneesannonce.titre = titre;
					donneesannonce.ville = ville;
					donneesannonce.description = description;
					donneesannonce.image = image;

					//on appelle la fonction checkdata() qui prends en parametre l'objet donneesannonce et un rapport d'erreur, ici par d'erreur, on renvoie false
					checkdata(donneesannonce,demandeur,false);
				} else { //en cas d'erreur
					//on recupère l'url
					var url = this.uri.href;
					//on initialise un objet donneesannonce vide qui ne sert que de placeholder pour la fonction checkdata()
					var donneesannonce = {"lien":url,"titre":"ERREUR","ville":"","CP":"","latitude":"","longitude":"","description":"","telephone":"","mail":"","image":"","provenance":"abritel"};
					//on appelle la fonction checkdata avec le placeholder et le rapport d'erreur
					checkdata(donneesannonce,demandeur,error);
				}
			});
			break;
		}
	}

	//variable comptant le nombre de fois que la fonction checkdata à été appellée. Comme cette fonction est appellée à la fin de chaque execution de la fonction getdata, on se sert de cette variable pour garder trace du nombre de fois qu'a été executé getdata, ainsi on peut l'appeller avec, comme parametre, tablink[cpt] pour associer à cette itération de getdata, l'index de tablink correspondant
	var cpt = 0;

	function checkdata(data,demandeur,error){
		if(!error){ // si error n'existe pas
			console.log("nombre d'annonces parcourues : "+(cpt+1));
			//on indente cpt
			cpt++;
			//on appelle writemanager avec en parametres l'objet data issus de getdata() (donneesannonce) et false car il n'y a pas d'erreur
			writemanager(data,demandeur,false);
			// si le compteur est inferieur à la longeur du tableau on appelle getdata avec comme parametre tablink au nouvel index
			if(cpt < tablink.length){
				getdata(tablink[cpt],demandeur);
			}
		} else {
			console.log("erreur, lien ignoré");
			console.log(error); // on affiche l'erreur
			writemanager(data,demandeur,true); // on appelle writemanager avec l'objet data vide et true car il y a une erreur
			cpt++; //on indente cpt pour passer au prochain index du tableau
			// si le compteur est inferieur à la longeur du tableau on appelle getdata avec comme parametre tablink au nouvel index
			if(cpt < tablink.length){
				getdata(tablink[cpt],demandeur);
			}
		}
	}

	//Tableau destiné à stoker les données extraites des liens
	var donnees = [];

	//Variable comptant le nombre d'appel de writemanager()
	var cptwm = 0;
	function writemanager(data, demandeur,error){
		if(!error){ // si on a pas d'erreur
			cptwm++; // on incrémente cptwm
			donnees.push(data); //et on remplit les tableau de données avec data
		} else { //sinon, en cas d'erreur, on incrémente juste cptwm
			cptwm++;
		}

		if(cptwm == tablink.length){ //si cptwm est égal à la longeur du tableau c'est qu'on l'a parcouru entierrement
			//on ecrit alors un json contenant toutes les informations
			var tabdonnees = {"donnees" : donnees};
			fs.writeFile('data/donnees-'+demandeur+'.json', JSON.stringify(tabdonnees, null, 4), function(err){
				console.log('toutes les annonces ont été parcourues, donnees-'+demandeur+'.json généré');
			});
		}
	}

//serveur

//recupération du fichier donnees-'x'.json
app.get('/getdata', function(req, res){
	var client = req.query.client;
	fs.access('data/donnees-'+client+'.json', fs.F_OK, function(err) {
	    if (!err) {
	        console.log(client+" retrieved his datas");
			res.sendFile('donnees-'+client+'.json', { root: path.join(__dirname, '/data') });
	    } else {
			console.log(err);
			res.send('Le fichier que vous cherchez n\'existe pas');
	    }
	});
});

//recupération du fichier parametres-'x'.json
app.get('/getparam', function(req, res){
	var client = req.query.client;
	fs.access('parametres/parametres-'+client+'.json', fs.F_OK, function(err) {
	    if (!err) {
			res.sendFile('parametres-'+client+'.json', { root: path.join(__dirname, '/parametres') });
	    } else {
			console.log(err);
			res.send('Le fichier que vous cherchez n\'existe pas');
	    }
	});
});

//édition du fichier parametres-'x'.json
app.post('/postparam', bodyParser.urlencoded({ extended: true }), function(req, res) {
	var nbpage = req.body.nbpage;
	var region = req.body.region;
	var ville = req.body.ville;
	var client = req.body.client;

	if(nbpage == "" || parseInt(nbpage) <= 0){
		nbpage = 1;
	} else {
		nbpage = parseInt(nbpage);
	}

	var parametres = {"nbpage":nbpage, "region":region, "ville":ville};
	fs.writeFile('parametres/parametres-'+client+'.json', JSON.stringify(parametres, null, 4), function(err){
		console.log('parametres de '+client+' mis à jours');
	});

	res.send();
});

//lancement d'une requete de scraping pour 'x'
app.get('/startscrap', function(req, res){
	var client = req.query.client;
	start(client);
	res.send();
});

//lancement du serveur sur le port 8000
app.listen(8000);
console.log("API Running on port 8000");
