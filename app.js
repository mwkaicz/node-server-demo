const http = require('http');
const { exec } = require('child_process'); //spousteni procesů
const { stdout, stderr } = require('process'); //podprocesy a jejich odezvy
const fs = require('fs'); //filesystem
const url = require('url'); //parsovani url
const path = require('path'); //parsovani souborove cesty 

const port = 80;

const server = http.createServer(routovaciFce);
const io = require('socket.io')(server);
server.listen(port);

socketInit();






/**
 * funkce která se stará o zpracování dotazu na stránku
 * @param {*} request 
 * @param {*} result 
 */
function routovaciFce(request, result){
  let params = {};
  let sUrl = request.url;
  if (request.url.indexOf('?') > -1){
    let tmpArr = request.url.substr(request.url.indexOf('?')+1).split('&'); 
    for (let i = 0; i < tmpArr.length; i++){
      let tmpS = tmpArr[i].split('=');
      params[tmpS[0]] = tmpS[1];
    }
    sUrl = request.url.substr(0,request.url.indexOf('?')) ;
  }

  let ret = '';
  if (request.method === 'GET'){        
    switch(sUrl){  
      
      /**
       * 
       *  TATO CELA ČÁST JE, DÍKY SOCKET.IO ZBYTEČNÁ, ALE STÁLE FUNKČNÍ, PONECHÁVÁM POUZE PRO STUDIJNÍ ÚČELY 
       * 
       */

      // case '/test':
      //     ret = 'text/html/json/cokoliv';
      //     if (params['c'] !== void 0 && params['a'] !== void 0 && params['c'] === 'ping' ){
      //       //POZOR:  prikazy které jdou do nasledne do konzole systemu musí byt vzdy na pevno v kodu a nikdy by neměly být soucastí nejakeho prichoziho parametru!l
      //       let promisa = spustBashPrikaz('ping ' + params['a'])
      //       // let promisa = spustBashPrikaz('ping 1.1.1.1')
      //         .then(function(navratovaHodnota){
      //           console.log(navratovaHodnota);
      //           ret = navratovaHodnota;
      //           result.end(ret);
      //         })
      //         .catch(function(e){
      //           console.error(e);
      //         }); 
      //     }
      //     break;
      // case '/testHTML':
      //     ret = '<!DOCTYPE html>'
      //     + '<html>'
      //       + '<head></head>'
      //       + '<body>nejaky obsah HTML stranky</body>'
      //     + '</html>';
      //     result.end(ret);
      //     break;
      
      /**
       * 
       * ^^^ KONEC ZBYTEČNÉHO KÓDU ^^^
       * 
       */




      default: 
        //pokud se url neshoduje s ničím, o čem víme (nepatří mezi předdefinované routy), zkusíme jestli se název neshoduje se souborem v /assets, pokud ano, vrátime jej
        serveFile(request, result); 
    }
  }  
}


/**
 * @name socketInit
 * @description inicializace socketů (zpracovaní requestů a jejich odpovedí)
 * 
 */
function socketInit(){
  io.on('connection', (socket) => {
    let id = socket.id;
    console.log('user connected', id);

    //nove pripojeni
    let url = socket.request.headers.referer.substr( socket.request.headers.referer.indexOf(socket.request.headers.host) + socket.request.headers.host.length);
    url = (url.indexOf('?') > -1 ? url.substr(0, url.indexOf('?')) : url );


    socket.join('ovladani'); //pripojim se do mistnosti

    switch (url){
      // case '/reports':
      //   socket.join('reports');
      //   break;
      case '/':
      default:
        socket.join('info'); //a poku jsme v rootu, nebo nekde v neznamu, tak treba jeste do jedné
        break;
    }

    
    socket.on('provedPrikaz', (data) => {
      let ret = { snippets: {} };
      if (data.cmd !== void 0){  // stejne jako   typeof data.cmd !== 'undefined'
        switch (data.cmd){
          case 'ping':
            if (data.address !== void 0){
              let promisa = spustBashPrikaz('ping ' + data.address).then(function(navratovaHodnota){
                
                
                socket.emit('novaData', {val: navratovaHodnota}); //vratime odpoved clientovi, třeba jako objekt


              }).catch(function(e){
                console.error(e);
              });
            }
        }
      }      
    });


    socket.on('turnLeft', (data) => {
      socket.emit('info', 'zatáčím doleva'); //vratime odpoved clientovi, taky muže být jako text
    });

    socket.on('turnRight', (data) => {
      socket.emit('info', 'zatáčím doprava'); 
    });

    
    socket.broadcast.emit('info', 'Ahoj! Připojil se někdo další.' ); // poslat zpravu vsem
 
    
    socket.on('disconnect', () => {
      //pri odpojeni klienta muzeme take neco udelat
      console.log('user disconnected', id);
    });

  });
}



/**
 *
 * nize neni potreba nic menit ;)
 * 
 **/



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
          // resolve ('prikaz se provedl / popr. nejaka ziskana data z stdout');
          resolve(stdout);
        }
    });
    // priklad jednoducheho odstraneni sitove jednotky:   exec('net use M: /delete');
  }, reject => {
    console.warn(e, stdout, stderr);
  });
};



/**
 * @description funkce, která nám podle požadavku vrátí do HTML celý soubor (např. JS, obrázek atd.)
 * @param {object} req 
 * @param {object} res 
 */
function serveFile(req, res){
  // parse URL
  const parsedUrl = url.parse(req.url);

  if (parsedUrl.pathname === '/'){ //inject index.html
    parsedUrl.pathname = '/index.html';
  } 

  // extract URL path
  let pathname = `./assets${parsedUrl.pathname}`;
  // based on the URL path, extract the file extention. e.g. .js, .doc, ...
  const ext = path.parse(pathname).ext;
  // maps file extention to MIME typere
  const map = {
    '.ico': 'image/x-icon',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword'
  };

  fs.access(pathname, function (err) {
    if(err) {
      // if the file is not found, return 404
      res.statusCode = 404;
      res.end(`File ${pathname} not found!`);
      return;
    }

    // if is a directory search for index file matching the extention
    if (fs.statSync(pathname).isDirectory()) pathname += '/index' + ext;

    // read file from file system
    fs.readFile(pathname, function(err, data){
      if(err){
        res.statusCode = 500;
        res.end(`Error getting the file: ${err}.`);
      } else {
        // if the file is found, set Content-type and send data
        res.setHeader('Content-type', map[ext] || 'text/plain' );
        res.end(data);
      }
    });
  });
}
