import { ghostAPI } from '../utils/ghostAPI';

export const triggerHandler = new class ArticlesSettingsHandler {
	eventNameArgumentsToObject(...args) {
		const argObject = {
			event: args[0],
		};
		switch (argObject.event) {
			case 'userEmail':
			case 'userRealname':
			case 'userName':
			case 'deleteUser':
				if (args.length >= 2) {
					argObject.user = args[1];
				}
				break;
			case 'roomType':
			case 'roomName':
				if (args.length >= 2) {
					argObject.room = args[1];
				}
				break;
			case 'siteTitle':
				argObject.article = args[1];
				break;
			default:
				argObject.event = undefined;
				break;
		}
		return argObject;
	}

	mapEventArgsToData(data, { event, room, user, article }) {
		data.event = event;
		switch (event) {
			case 'userEmail':
			case 'userRealname':
			case 'userName':
			case 'deleteUser':
				data.user_id = user._id;

				if (user.name) {
					data.name = user.name;
				}

				if (user.email) {
					data.email = user.email;
				}

				if (user.username) {
					data.username = user.username;
				}
				break;
			case 'roomType':
			case 'roomName':
				data.room_id = room.rid;

				if (room.name) {
					data.name = room.name;
				}

				if (room.type) {
					data.type = room.type;
				}
				break;
			case 'siteTitle':
				if (article && article.title) {
					data.title = article.title;
				}
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
