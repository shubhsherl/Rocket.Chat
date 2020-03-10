const httpProxy = require('http-proxy');

var proxy = httpProxy.createProxyServer({target:'http://localhost:3000'});

let useProxy = false;
let proxyClosed = true;

class Page {
	get body() { return browser.element('body'); }

	open(path) {
		browser.windowHandleSize({
			width: 1600,
			height: 1600,
		});

		if (useProxy) {
			port = 5000;
			this.offlineMode(offline);
		}
		
		browser.url(`http://localhost:${ port }/${ path }`);

		this.body.waitForExist();
	}

	// offlineMode works only for proxy server
	offlineMode(offline) {
		if(offline && proxy !== null) {
			proxy.close();
			proxyClosed = true;
		} else if(!offline && proxyClosed) {
			proxy.listen(5000);
			proxyClosed = false;
		}
	}

	refresh() {
		browser.refresh();
	}

	// useProxy set the port to 5000 and setup a proxy connection
	useProxy(_proxy) { 
		useProxy = _proxy;
		if (_proxy && proxyClosed) {
			proxy.listen(5000);
			proxyClosed = false;
		}
	}	
}
module.exports = Page;
