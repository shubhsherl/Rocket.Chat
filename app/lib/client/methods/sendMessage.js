import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';
import toastr from 'toastr';

import { ChatMessage, ChatRoom, ChatSubscription } from '../../../models';
import { settings } from '../../../settings';
import { callbacks } from '../../../callbacks';
import { promises } from '../../../promises/client';
import { t } from '../../../utils/client';

Meteor.methods({
	sendMessage(message, offlineTrigerred = false) {
		if (!Meteor.userId() || s.trim(message.msg) === '' || offlineTrigerred) {
			return false;
		}
		const messageAlreadySent = message._id && ChatMessage.findOne({ _id: message._id, temp: { $exists: false } });
		if (messageAlreadySent) {
			return toastr.error(t('Message_Already_Sent'));
		}
		const user = Meteor.user();
		message.ts = new Date();
		message.u = {
			_id: Meteor.userId(),
			username: user.username,
		};
		if (settings.get('UI_Use_Real_Name')) {
			message.u.name = user.name;
		}
		message.temp = true;
		message.tempActions = { send: true };
		if (settings.get('Message_Read_Receipt_Enabled')) {
			message.unread = true;
		}
		message = callbacks.run('beforeSaveMessage', message);
		promises.run('onClientMessageReceived', message).then(function(message) {
			ChatMessage.insert(message);
			ChatRoom.setLastMessage(message.rid, message);
			ChatSubscription.setLastMessage(message.rid, message);
			return callbacks.run('afterSaveMessage', message);
		});
	},
});
