
const windowsCerts = require('./index.js');


const process = require('process');

if (process.platform === 'win32'){

  const fs = require('fs');

  console.log("Reading windows ROOT certifcate store");
  const certsROOT = windowsCerts.getCerts();
  fs.writeFileSync('windowsROOT.json', JSON.stringify(certsROOT));
  console.log("Wrote windows certificates to windowsROOT.json");
  fs.writeFileSync('windowsROOT.txt', certsROOT.join('\n\n'));
  console.log("Wrote windows certificates to windowsROOT.txt");

  console.log("Reading windows CA certifcate store");
  const certsCA = windowsCerts.getCerts('CA');
  fs.writeFileSync('windowsCA.json', JSON.stringify(certsCA));
  console.log("Wrote windows certificates to windowsCA.json");
  fs.writeFileSync('windowsCA.txt', certsCA.join('\n\n'));
  console.log("Wrote windows certificates to windowsCA.txt");

  //https://badssl.com/certs/badssl.com-client.pem
  var oneBadCert = [ fs.readFileSync("badssl.com-client.pem") ];


  const https = require('https');

  var testfailed = false;

  // no tls modification
  function readWithNodeCerts() {
    console.log("readWithNodeCerts");
    https.get('https://google.com', function(res) {
      
      console.log("statusCode: ", res.statusCode);
      console.log("headers: ", res.headers);

      res.on('data', function(d) {
        //process.stdout.write(d);
      });

      res.on('end', function() {
        readWithNoCertsCached();
      });
    }).on('error', function(e) {
      console.error(e);
      readWithNoCertsCached();
      testfailed = (testfailed || '')+'\n' +'readWithNodeCerts on error';
    });
  }

  // modify tls to have no certs, but access google.com again
  function readWithNoCertsCached() {
    console.log("readWithNoCerts - Cached connection");
    windowsCerts.patchTls( [] );
    https.get('https://google.com', function(res) {
      
      console.log("statusCode: ", res.statusCode);
      console.log("headers: ", res.headers);

      res.on('data', function(d) {
        //process.stdout.write(d);
      });

      res.on('end', function() {
        readWithWindowsCerts();
      });
    }).on('error', function(e) {
      console.error(e);
      readWithWindowsCerts();
      testfailed = (testfailed || '')+'\n' +'readWithNoCertsCached on error';
    });
  }

  // use Windows ROOT certs
  function readWithWindowsCerts() {
    console.log("readWithWindowsCerts");
    windowsCerts.useWindowsCerts();
    https.get('https://ibm.com', function(res) {
      
      console.log("statusCode: ", res.statusCode);
      console.log("headers: ", res.headers);

      res.on('data', function(d) {
        //process.stdout.write(d);
      });

      res.on('end', function() {
        readWithNoCerts();
      });
    }).on('error', function(e) {
      console.error(e);
      readWithNoCerts();
      testfailed = (testfailed || '')+'\n' +'readWithWindowsCerts on error';
    });
  }

  // use no certs, and access a new site
  function readWithNoCerts() {
    console.log("readWithNoCerts");
    windowsCerts.patchTls( [] );
    https.get('https://amazon.com', function(res) {
      
      console.log("statusCode: ", res.statusCode);
      console.log("headers: ", res.headers);

      res.on('data', function(d) {
        //process.stdout.write(d);
      });

      res.on('end', function() {
        readWithNodePlusOne();
        testfailed = (testfailed || '')+'\n' +'readWithNoCerts end callback';
      });
    }).on('error', function(e) {
      console.log('We expect to error with "unable to get local issuer certificate"');
      console.error(e);
      readWithNodePlusOne();
    });
  }

  //https://badssl.com/certs/ca-untrusted-root.crt
  // add one additional cert to node's defaults
  function readWithNodePlusOne() {
    console.log("readWithNodePlusOne");
    windowsCerts.patchTls( oneBadCert, { includeNodeCerts: true } );
    https.get('https://example.com/', function(res) {
      
      console.log("statusCode: ", res.statusCode);
      console.log("headers: ", res.headers);

      res.on('data', function(d) {
        //process.stdout.write(d);
      });

      res.on('end', function() {
        finish();
      });
    }).on('error', function(e) {
      console.error(e);
      testfailed = (testfailed || '')+'\n' +'readWithNodePlusOne on error';
      finish();
    });
  }

  function finish(){
    if (testfailed){
      console.log('Failures: '+testfailed);
      throw('failed');
    }
  }


  readWithNodeCerts();
} else {
  console.log('no testinhg done as was not run on windows');
}
