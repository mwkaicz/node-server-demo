const http = require('http');
const { exec } = require('child_process');

const port = 80;

const server = http.createServer(routovaciFce);
server.listen(port);


/**
 * funkce která se stará o zpracování dotazu na stránku
 * @param {*} request 
 * @param {*} result 
 */
function routovaciFce(request, result){
  let params = {};
  let url = request.url;
  if (request.url.indexOf('?') > -1){
    let tmpArr = request.url.substr(request.url.indexOf('?')+1).split('&'); 
    for (let i = 0; i < tmpArr.length; i++){
      let tmpS = tmpArr[i].split('=');
      params[tmpS[0]] = tmpS[1];
    }
    url = request.url.substr(0,request.url.indexOf('?')) ;
  }

  console.log(url, params);

  let ret = '';
  if (request.method === 'GET'){        
    switch(url){            
      case '/test':
          if (params['a'] !== void 0 && params['a'] === '10' ){
            let hodnota = spustBashPrikaz('ping 1.1.1.1'); //POZOR: tento prikaz by mel byt vzdy na pevno v kodu a nikdy by nemel být soucastí nejakeho prichoziho parametru!
            console.log(hodnota);
          }
          ret = 'text/html/json/cokoliv';
          break;
      case '/':
      default: 
          ret = '<!DOCTYPE html>'
          + '<html>'
            + '<head></head>'
            + '<body>nejaky obsah HTML stranky</body>'
          + '</html>';
    }
  }
  result.end(ret);
}


/**
 * funkce pro spusteni prikazu na serveru
 * POZOR: tento prikaz by mel byt vzdy na pevno v kodu a nikdy by nemel být soucastí nejakeho prichoziho parametru!
 * 
 * @param {*} prikaz 
 * @param {*} timeout 
 * @returns {Promise} - prikaz muze trvat neomezene dlouho, takze navratova hodnota je promisa (příslib) .... zbytek procesu na ni počká, dokud se tato funkce nedokončí
 */
function spustBashPrikaz(prikaz, timeout = -1){
  return new Promise(resolve => {
    exec(
      prikaz,
      timeout > 0 ? {timeout: timeout} : {},
      function(e, stdout, stderr){
        if (e){
          /* error handler */
          console.error(e,stdout,stderr);  
          resolve( 'nejaka navratova hodnota pro chybu');
        }else{
          console.log(stdout);
          resolve ('prikaz se provedl / popr. nejaka ziskana data z stdout');
        }
    });

    // priklad jednoducheho odstraneni sitove jednotky:   exec('net use M: /delete');

  });
};

