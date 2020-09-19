const scrapeIt = require('scrape-it');
const {last} = require('lodash');

require('dotenv').config();

const slack = require('./slack');

const getTeam = (user) => {
	if (user === '@n4o847' || user === '@azaika_') {
		return 0;
	}
	if (user === '@naan112358' || user === '@hideo54') {
		return 1;
	}
	return null;
};

module.exports = (io) => {
	const matchesSet = new Set();
	const scores = [0, 0];

	const updateSolves = async ({ init = false } = {}) => {
		const { data } = await scrapeIt(`${process.env.AI_HOST}/contests/${process.env.AI_CONTEST}/matches`, {
			matches: {
				listItem: '.table tbody tr',
				data: {
					user: {
						selector: 'td:nth-child(1)',
						convert: (x) => x.replace(/\(.+?\)/, '').trim(),
					},
					score: 'td:nth-child(2)',
					id: {
						selector: 'td:nth-child(3) a',
						attr: 'href',
					},
				},
			},
		});

		for (const match of data.matches) {
			const id = last(match.id.split('/'));

			const team = getTeam(match.user);

			if (team === null) {
				continue;
			}

			if (!match.score.match(/^\d+$/)) {
				continue;
			}

			const score = parseInt(match.score);

			if (init) {
				if (scores[team] < score) {
					scores[team] = score;
				}
				matchesSet.add(id);
				continue;
			}

			if (matchesSet.has(id)) {
				continue;
			}

			matchesSet.add(id);

			let isUpdated = false;
			if (scores[team] < score) {
				scores[team] = score;
				isUpdated = true;
			}

			io.emit('update', {
				type: 'ai',
				team,
				score,
				scores,
				isUpdated,
			});
			const teamName = team === 0 ? '関東' : '関西';
			slack('ai', `${teamName}チームがコードを提出! ${new Intl.NumberFormat('en-US').format(score)}点${isUpdated ? ' (スコア更新)' : ''}`);
		}

		io.emit('ai-heartbeat', {
			type: 'ai',
			scores,
		});
	};

	updateSolves({ init: true });
	setInterval(() => {
		updateSolves();
	}, 10 * 1000);
};
