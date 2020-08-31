import { Migrations } from '../../../app/migrations';
import { Permissions } from '../../../app/models';

Migrations.add({
	version: 203,
	up() {
		if (Permissions) {
			const newPermission = Permissions.findOne('view-livechat-manager');
			if (newPermission && newPermission.roles.length) {
				Permissions.upsert({ _id: 'view-livechat-filters' }, { $set: { roles: newPermission.roles } });
			}
		}
	},

	down() {
		if (Permissions) {
			// Revert permission
			Permissions.remove({ _id: 'view-livechat-filters' });
		}
	},
});
