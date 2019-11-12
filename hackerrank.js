const axios = require('axios');
require('dotenv').config();

module.exports = (io) => {
	const submissionSet = new Set();
	const teams = [['hakatashi'], ['MMNMM']];

	const updateSubmissions = async ({init = false} = {}) => {
		const {data} = await axios.get('https://www.hackerrank.com/rest/contests/tsg-live-4-programming-contest-testflight/judge_submissions/', {
			params: {
				offset: 0,
				limit: 100,
			},
			headers: {
				Cookie: `_hrank_session=${process.env.HACKERRANK_SESSION_ID}`,
			},
		});

		for (const submission of models) {
			if (submission.status === 'Processing') {
				continue;
			}

			if (init) {
				submissionSet.add(submission.id);
				continue;
			}

			if (submissionSet.has(submission.id)) {
				continue;
			}

			submissionSet.add(submission.id);

			const user = submission.hacker_username;

			const team = teams.findIndex((members) => members.includes(user));
			if (team === undefined) {
				continue;
			}

			const challenge = submission.challenge.name;
			const score = submission.score;
			const status = submission.status;

			io.emit('update', {
				type: 'hackerrank',
				team,
				user,
				challenge,
				score,
				status,
			});
		}

		io.emit('hackerrank-heartbeat', {
			type: 'hackerrank',
			solves: Array.from(submissionSet),
		});
	};

	updateSubmissions({init: true});
	setInterval(() => {
		updateSubmissions();
	}, 10 * 1000);
};
