require('dotenv').config();

const tweetSet = new Set();

module.exports = async (io, db) => {
	let isInit = true;
	db.collection('tsglive_comments').onSnapshot((snapshot) => {
		if (isInit) {
			isInit = false;
			return;
		}

		const changes = snapshot.docChanges();
		for (const change of changes) {
			if (change.type === 'added') {
				io.emit('player-message', {
					team: change.doc.get('team'),
					user: change.doc.get('name'),
					text: change.doc.get('text'),
				});
			}
		}
	});
};