const fs = require('fs-extra');
const xml2js = require('xml2js');
const {promisify} = require('util');
const get = require('lodash/get');

const parser = new xml2js.Parser();

const commentFile = process.env.LIVE_COMMENTS_FILE;

const commentSet = new Set();

module.exports = async (io) => {
	const watcher = fs.watch(commentFile)

	const updateComments = async (isInit) => {
		const commentData = await fs.readFile(commentFile);
		const xml = await promisify(parser.parseString)(commentData.toString());
		const comments = get(xml, ['log', 'comment'])

		for (const comment of comments) {
			if (!commentSet.has(comment.$.time)) {
				commentSet.add(comment.$.time);
				if (!isInit) {
					io.emit('message', {
						text: comment._,
						username: comment.$.handle,
						type: comment.$.service,
					});
				}
			}
		}
	};

	watcher.on('change', () => {
		updateComments(false);
	});

	updateComments(true);
};
