import { settings } from '../../settings';
import { ghostAPI } from './utils/ghostAPI';

export function ghostCleanUp(cookie) {
	try {
		if (settings.get('Articles_Enabled')) {
			ghostAPI.deleteSesseion(cookie);
		}
	} catch (e) {
		// Do nothing if failed to logout from Ghost.
		// Error will be because user has not logged in to Ghost.
	}
}
