const socketIoClient = require('socket.io-client');
const axios = require('axios');

module.exports = (io) => {
	const esolangClient = socketIoClient(process.env.ESOLANG_HOST);
	esolangClient.on('update-languages', (data) => {
		updateLanguages();
	});
	esolangClient.on('connect', (data) => {
		console.log('esolang battle connected');
	});

	const languageMap = new Map();

	const updateLanguages = async () => {
		const contest = process.env.ESOLANG_CONTEST;
		const {data: languages} = await axios.get(`${process.env.ESOLANG_HOST}/api/contests/${contest}/languages`);
		for (const language of languages) {
			if (!language.slug) {
				continue;
			}

			const name = language.name;
			const size = language.solution ? language.solution.size : null;
			const team = language.team !== undefined ? language.team : null;

			if (!languageMap.has(language.slug)) {
				languageMap.set(language.slug, {name, size, team});
				continue;
			}

			const previousLanguage = languageMap.get(language.slug);
			if (previousLanguage.size !== size) {
				io.emit('update', {
					type: 'esolang',
					contest,
					language: name,
					from: previousLanguage.team === null ? null : (previousLanguage.team === 0 ? 'red' : 'blue'),
					fromBytes: previousLanguage.size,
					to: team === null ? null : (team === 0 ? 'red' : 'blue'),
					toBytes: size,
				});
				languageMap.set(language.slug, {name, size, team});
			}
		}
	};

	updateLanguages();
}
