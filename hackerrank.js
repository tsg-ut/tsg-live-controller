const axios = require('axios');
require('dotenv').config();

module.exports = (io) => {
	const submissionSet = new Set();
	const teams = [['hakatashi'], ['MMNMM']];
	const solvesSets = [new Set(), new Set()];

	const updateSubmissions = async ({init = false} = {}) => {
		const {data} = await axios.get(`https://www.hackerrank.com/rest/contests/${process.env.HACKERRANK_CONTEST_ID}/judge_submissions/`, {
			params: {
				offset: 0,
				limit: 200,
			},
			headers: {
				Cookie: `_hrank_session=${process.env.HACKERRANK_SESSION_ID}`,
			},
		});

		for (const submission of data.models) {
			if (submission.status === 'Processing') {
				continue;
			}

			const user = submission.hacker_username;

			const team = teams.findIndex((members) => members.includes(user));
			if (team === undefined) {
				continue;
			}

			const challenge = submission.challenge.name;
			const score = submission.score;
			const status = submission.status;

			solvesSets[team].add(challenge.split(':')[0]);

			if (init) {
				submissionSet.add(submission.id);
				continue;
			}

			if (!submissionSet.has(submission.id)) {
				submissionSet.add(submission.id);

				io.emit('update', {
					type: 'hackerrank',
					team,
					user,
					challenge,
					score,
					status,
				});
			}
		}

		io.emit('hackerrank-heartbeat', {
			type: 'hackerrank',
			solves: solvesSets.map((set) => Array.from(set)),
		});
	};

	updateSubmissions({init: true});
	setInterval(() => {
		updateSubmissions();
	}, 10 * 1000);
};