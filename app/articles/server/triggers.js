import { callbacks } from '../../callbacks';
import { triggerHandler } from './lib/triggerHandler';
import { settings } from '../../settings';

const callbackHandler = function _callbackHandler(eventType) {
	return function _wrapperFunction(...args) {
		return triggerHandler.executeTrigger(eventType, ...args);
	};
};

const priority = settings.get('Articles_Enabled') ? callbacks.priority.HIGH : callbacks.priority.LOW;

callbacks.add('afterUserEmailChange', callbackHandler('userEmail'), priority);
callbacks.add('afterUserRealNameChange', callbackHandler('userRealname'), priority);
callbacks.add('afterUsernameChange', callbackHandler('userName'), priority);
callbacks.add('afterRoomTypeChange', callbackHandler('roomType'), priority);
callbacks.add('afterDeleteUser', callbackHandler('deleteUser'), priority);
// TODO: find why roomName have no arg passed even with High priority.
callbacks.add('afterRoomNameChange', callbackHandler('roomName'), priority);

settings.get('Article_Site_Title', (key, value) => {
	triggerHandler.executeTrigger('siteTitle', { title: value });
});
