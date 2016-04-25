function getlinks(parregion,parville,parnbpage,parencoding,demandeur,callback){

	var annonces = []; //tableau d'ID de page
	var nbpage = parnbpage;
	var compteur = 0;

	if(parville != ""){
		var url = "https://www.abritel.fr/search/keywords:"+parville+"/page:0";
	} else {
		var url =  "https://www.abritel.fr/search/keywords:"+parregion+"/page:0";
	}

	for(var i=1;i<=nbpage;i++){
		url = url.substring(0, url.length-1);
		url = url+i;
		option = {'url' : url, 'encoding':parencoding};
		request(option, function(error, response, html){
			if(!error){
				var $ = cheerio.load(html);
				$('.hit-headline').filter(function(){
					var lien = $(this).children().eq(0).attr('href');
					lien = "https://www.abritel.fr"+lien;
					var annonce = {"lien":"","provenance":"abritel"};
					annonce.lien = lien;
					annonces.push(annonce);
				});
			}
			writemanager(annonces,callback);
		});
	}

	function writemanager(annonces,callback){
		compteur++;
		if(compteur == nbpage){
			write(annonces,callback);
		}
	}

	function write(annonces,callback){
		var json = {"annonces" : annonces};
		fs.writeFile('data/abritel-'+demandeur+'.json', JSON.stringify(json, null, 4), function(err){
			callback("abritel",demandeur);
		});
	}
}

module.exports.getlinks = getlinks;
