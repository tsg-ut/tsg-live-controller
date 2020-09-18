const axios = require('axios');
require('dotenv').config();

const slack = require('./slack');

module.exports = (io) => {
	const solvesSets = [new Set(), new Set()];

	const updateSolves = async ({init = false} = {}) => {
		for (const [index, team] of [1, 2].entries()) {
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
				const teamName = index === 0 ? '関東' : '関西';
				slack('ctf', `${teamName}チームが【${name}】(${category}) を解きました! (+${value} pt)`);
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
