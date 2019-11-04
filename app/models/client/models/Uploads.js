import { Base } from './_Base';
import { PersistentMinimongo2 } from 'meteor/frozeman:persistent-minimongo2';

export class Uploads extends Base {
	constructor() {
		super();
		this._initModel('uploads');
	}
}

export default new Uploads();

// new PersistentMinimongo2(Uploads.model, 'Uploads');
