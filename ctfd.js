const axios = require('axios');
require('dotenv').config();

module.exports = (io) => {
	const solvesSets = [new Set(), new Set()];

	const updateSolves = async ({init = false} = {}) => {
		for (const [index, team] of [3, 4].entries()) {
			const {data: {data: solves}} = await axios.get(`${process.env.CTFD_HOST}/api/v1/teams/${team}/solves`);
			const solvesSet = solvesSets[index];

			for (const solve of solves) {
				if (init) {
					solvesSet.add(solve.challenge_id);
					continue;
				}

				if (solvesSet.has(solve.challenge_id)) {
					continue;
				}

				solvesSet.add(solve.challenge_id);

				const category = solve.challenge.category;
				const name = solve.challenge.name;
				const value = solve.challenge.value;

				io.emit('update', {
					type: 'ctf',
					team: index,
					category,
					name,
					value,
				});
			}
		}

		io.emit('ctf-heartbeat', {
			type: 'ctf',
			solves: solvesSets.map((set) => Array.from(set)),
		});
	};

	updateSolves({init: true});
	setInterval(() => {
		updateSolves();
	}, 10 * 1000);
};