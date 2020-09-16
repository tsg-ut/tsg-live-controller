const React = require('react');
const sumBy = require('lodash/sumBy');
const sum = require('lodash/sum');

require('@babel/polyfill');
require('core-js/stage/4');
require('core-js/stage/3');
require('core-js/stage/2');
require('core-js/stage/1');

require('./Status.pcss');

const socket = global.io();
socket.on('connect', () => {
	console.log('websocket connected');
});

module.exports = class App extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			solves: [[], []],
			scores: [0, 0],
			mode: this.getMode(),
		};

		this.initialize();
	}

	getMode() {
		if (location.pathname === '/ctf.html') {
			return 'ctf';
		}
		if (location.pathname === '/ai.html') {
			return 'ai';
		}
		if (location.pathname === '/procon.html') {
			return 'procon';
		}
		return null;
	}

	initialize() {
		if (this.getMode() === 'ctf') {
			socket.on('ctf-heartbeat', async (data) => {
				console.log(data);
				this.setState({
					solves: data.solves,
				});
			});
		}
		if (this.getMode() === 'ai') {
			socket.on('ai-heartbeat', async (data) => {
				console.log(data);
				this.setState({
					scores: data.scores,
				});
			});
		}
		// if (this.getMode() === 'procon') {
		// 	socket.on('hackerrank-heartbeat', async (data) => {
		// 		console.log(data);
		// 		this.setState({
		// 			solves: data.solves,
		// 		});
		// 	});
		// }
	}

	getScore(chals) {
		return sum(chals.map((chal) => {
			const score = {A: 100, B: 200, C: 300, D: 400, E: 500, F: 600, G: 700}[chal];
			return score || 0;
		}));
	}

	render() {
		return (
			<div className={`app ${this.state.mode}`}>
				{this.state.mode === 'ctf' && this.state.solves.map((teamSolves, index) => {
					const chunks = [
						[3],
						[2, 5, 8],
						[1, 4, 6, 7, 9],
					];

					const score = sumBy(teamSolves, (solve) => (
						[400, 300, 200][chunks.findIndex((chunk) => chunk.includes(solve))]
					));

					return (
						<div className={`team ${index === 0 ? 'red' : 'blue'}`}>
							<div className="solve">{score}</div>
							{chunks.map((challengeIds, chunkIndex) => (
								<div className="chunk">
									{challengeIds.map((id) => (
										<div className={`challenge chunk-${chunkIndex} ${teamSolves.includes(id) ? 'active' : ''}`}/>
									))}
								</div>
							))}
						</div>
					)
				})}
				{this.state.mode === 'ai' && this.state.scores.map((score, index) => (
					<div key={index} className={`team ${index === 0 ? 'red' : 'blue'}`}>
						<div className="score">{new Intl.NumberFormat('en-US').format(score)}</div>
						<div className="bar" style={{
							width: `${50 + (score < Math.max(...this.state.scores) ? -1 : 1) * Math.log10(Math.abs(this.state.scores[0] - this.state.scores[1]) + 1) / Math.log10(1e13 + 1) * 50}%`,
						}}/>
					</div>
				))}
				{this.state.mode === 'procon' && this.state.solves.map((chals, index) => (
					<div key={index} className={`team ${index === 0 ? 'red' : 'blue'}`}>
						{[['A', 'B', 'C'], ['D', 'E'], ['F', 'G']].map((ids, idsIndex) => (
							<div key={idsIndex} className="row">
								{ids.map((id, idIndex) => (
									<div key={idIndex} className={`cell ${chals.includes(id) ? 'solved' : ''}`}>
										{id}
									</div>
								))}
							</div>
						))}
						<div className="row score">{this.getScore(chals)}</div>
					</div>
				))}
			</div>
		);
	}
};
