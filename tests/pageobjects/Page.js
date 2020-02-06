class Page {
	get body() { return browser.element('body'); }

	open(path, {offline = false, port = 3000}) {
		browser.windowHandleSize({
			width: 1600,
			height: 1600,
		});
		
		this.offlineMode(offline);
		
		browser.url(`http://localhost:${ port }/${ path }`);

		this.body.waitForExist();
	}

	offlineMode(offline) {

		if(offline) {
			browser.stopProxy();  // custom command to stop proxy setup
			browser.setNetworkConditions({ latency: 0, throughput: 0, offline: true });
			console.log('Offline')
		} else {
			browser.startProxy(); // custom command to start proxy setup
			browser.setNetworkConditions({}, 'Good 3G');
			console.log('Online')
		}
		// this.refresh();
	}

	refresh() {
		browser.refresh();
	}
}
module.exports = Page;
