import { ghostAPI } from '../utils/ghostAPI';

export const triggerHandler = new class ArticlesSettingsHandler {
	eventNameArgumentsToObject(...args) {
		const argObject = {
			event: args[0],
		};
		switch (argObject.event) {
			case 'deleteUser':
				if (args.length >= 2) {
					argObject.user = args[1];
				}
				break;
			default:
				argObject.event = undefined;
				break;
		}
		return argObject;
	}

	mapEventArgsToData(data, { event, user }) {
		data.event = event;
		switch (event) {
			case 'deleteUser':
				data.user_id = user._id;
				break;
			default:
				break;
		}
	}

	executeTrigger(...args) {
		const argObject = this.eventNameArgumentsToObject(...args);
		const { event } = argObject;

		if (!event) {
			return;
		}

		const data = {};

		this.mapEventArgsToData(data, argObject);

		ghostAPI.executeTriggerUrl(data, 0);
	}
}();
