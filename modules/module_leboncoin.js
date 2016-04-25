function getlinks(parregion,parville,parnbpage,parencoding,demandeur,callback){

	var annonces = []; //on initialise un tableau vide qui contiendra toutes les annonces
	var nbpage = parnbpage; //on defini un nombre de pages à parcourir
	var compteur = 0; //on compte le nombre de page que l'on a parcouru
	var url = "http://www.leboncoin.fr/_vacances_/offres/"+parregion+"/?f=a&th=1&location="+parville+"&o=0";
	for(var i=1;i<=nbpage;i++){
		//on defini l'url en fonction des parametres
		url = url.substring(0, url.length-1);
		url = url+i;
		option = {'url' : url, 'encoding':parencoding};
		//on ouvre la balise body de la page grace à request
		request(option, function(error, response, body){
			if(!error){
				//on affecte à $ le body, on utilise ainsi une syntaxe proche de JQuery grâce à Cheerio
				var $ = cheerio.load(body);
				//quelques variable pour tenir ce que l'on cherche dans le markup
				var lien;

				$('.lbc').filter(function(){  //on selectionne toutes les elements ayant la classe lbc puis on les parcours un par un

					//lien de l'annonce detaillée
					lien = $(this).parent().attr('href');
					lien = "http:"+lien;

					//objet qui contient les informations relatives à l'annonce que l'on remplit avec nos variables
					var annonce = {"lien":"","provenance":"leboncoin"};
					annonce.lien = lien;
					//on insère l'annonce courrante dans le tableau d'annonces

					annonces.push(annonce);
				});
			};
			//chaque fois que les elements .lbc de la page sont entierement parcourus on appelle writemanager()
			writemanager(annonces,callback);
		});
	}

	//garde trace du nombre de pages parcourues en indentant compteur a chaque appel
	function writemanager(annonces,callback){
		compteur++;
		//lorsque le compteur atteint le nombre de page defini en parametre on appelle write()
		if(compteur == nbpage){
			write(annonces,callback)
		}
	}

	//se charge d'ecrire un fichier json contenant les annonces et la provenance de celles çi
	function write(annonces,callback){
		var json = {"annonces" : annonces};
		fs.writeFile('data/leboncoin-'+demandeur+'.json', JSON.stringify(json, null, 4), function(err){
			callback("leboncoin",demandeur);
		});
	}
}

//on exporte la fonction pour pouvoir l'utiliser dans core
module.exports.getlinks = getlinks;
