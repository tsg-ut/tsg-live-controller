const qs = require('querystring');
const React = require('react');
const sumBy = require('lodash/sumBy');

require('@babel/polyfill');
require('core-js/stage/4');
require('core-js/stage/3');
require('core-js/stage/2');
require('core-js/stage/1');

require('./Ctf.pcss');

const socket = global.io();
socket.on('connect', () => {
	console.log('websocket connected');
});

module.exports = class App extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			solves: [[], []],
		};

		this.initialize();
	}

	async initialize() {
		socket.on('ctf-heartbeat', async (data) => {
			console.log(data);
			this.setState({
				solves: data.solves,
			});
		});
	}

	render() {
		return (
			<div className="app">
				{this.state.solves.map((teamSolves, index) => {
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
			</div>
		);
	}
};
