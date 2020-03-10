import loginPage from '../../pageobjects/login.page';

const version = 'viasat-0.1';
const file = '/manifest.json';

describe('[Service-Worker]', () => {
	before(() => {
		loginPage.open();
		// This Can Cause Timeouts erros if the server is slow so it should have a big wait
		loginPage.emailOrUsernameField.waitForVisible(15000);
	});

    it('it should support service worker', () => {
        const { value } = browser.execute(() => 'serviceWorker' in navigator);
        value.should.be.true;
    });

	it('it should be in active state', () => {
        const { value: { state } } = browser.execute(() => navigator.serviceWorker.controller);
        state.should.equal('activated');
    });

    it('it should create the cache storage', () => {
        const { value } = browser.executeAsync((version, done) => {
            caches.has(version)
                .then((exist) => done(exist));
        }, version);
        value.should.be.true;
    });

    it.skip('it should cache the manifest file', () => {
        const { value } = browser.executeAsync((version, file, done) => {
            caches.open(version)
                .then((storage) => storage.match(file)
                    .then((res) => done(res)));
        }, version, file);
        value.status.should.equal(200);
    });
});
