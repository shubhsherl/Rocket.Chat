import { metrics } from '../../../../metrics';
import { Notifications } from '../../../../notifications';

export function shouldNotifyServiceAccountOwner({
	hasMentionToAll,
	hasMentionToHere,
	isHighlighted,
	hasMentionToUser,
	hasReplyToThread,
	roomType,
}) {
	return roomType === 'd' || hasMentionToAll || hasMentionToHere || isHighlighted || hasMentionToUser || hasReplyToThread;
}

export function notifyServiceAccountOwner(receiver, ownerId, message, room) {
	metrics.notificationsSent.inc({ notification_type: 'sa' });
	Notifications.notifyUser(ownerId, 'sa-notification', {
		payload: {
			_id: message._id,
			rid: message.rid,
			sender: message.u,
			receiver: receiver.username,
			type: room.t,
			name: room.name,
		},
	});
}
