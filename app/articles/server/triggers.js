import { callbacks } from '../../callbacks';
import { triggerHandler } from './lib/triggerHandler';
import { settings } from '../../settings';

const callbackHandler = function _callbackHandler(eventType) {
	return function _wrapperFunction(...args) {
		return triggerHandler.executeTrigger(eventType, ...args);
	};
};

const priority = settings.get('Articles_Enabled') ? callbacks.priority.HIGH : callbacks.priority.LOW;

callbacks.add('afterDeleteUser', callbackHandler('deleteUser'), priority);
