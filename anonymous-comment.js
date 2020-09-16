require('dotenv').config();

const slack = require('./slack');

module.exports = async (io, db) => {
	let isInit = true;

	db.collection('tsglive_audience_comments').onSnapshot((snapshot) => {
		if (isInit) {
			isInit = false;
			return;
		}

		const changes = snapshot.docChanges();
		for (const change of changes) {
			if (change.type === 'added') {
				const text = change.doc.get('text');
				io.emit('message', {
					type: 'anonymous',
					username: 'anonymous',
					text,
				});
				slack('anonymous', text);
			}
		}
	});
};