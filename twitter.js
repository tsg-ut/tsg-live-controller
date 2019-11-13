const {OAuth} = require('oauth');
const {range} = require('lodash');
const qs = require('querystring');
require('dotenv').config();

const tweetSet = new Set();

module.exports = async (io) => {
	const oauth = new OAuth(
		'https://api.twitter.com/oauth/request_token',
		'https://api.twitter.com/oauth/access_token',
		process.env.TWITTER_CONSUMER_KEY,
		process.env.TWITTER_CONSUMER_KEY_SECRET,
		'1.0A',
		null,
		'HMAC-SHA1',
	);

	const updateComments = async (isInit) => {
		const data = await new Promise((resolve, reject) => {
			oauth.get(
				`https://api.twitter.com/1.1/search/tweets.json?${qs.encode({
					q: '#tsg_live OR #tsglive -filter:retweets -filter:replies',
					result_type: 'recent',
					count: 20,
				})}`,
				process.env.TWITTER_ACCESS_TOKEN,
				process.env.TWITTER_ACCESS_TOKEN_SECRET,
				(error, data) => {
					if (error) {
						reject(error);
					} else {
						resolve(JSON.parse(data));
					}
				},
			);
		});

		const tweets = data.statuses;

		for (const tweet of tweets) {
			if (tweetSet.has(tweet.id_str)) {
				continue;
			}

			tweetSet.add(tweet.id_str);

			if (!isInit) {
				// Erase entities
				const chars = Array.from(tweet.text);

				const entitiesList = [
					tweet.entities.hashtags,
					tweet.entities.symbols,
					tweet.entities.user_mentions,
					tweet.entities.urls,
				];

				for (const entities of entitiesList) {
					for (const entity of entities) {
						const [from, to] = entity.indices;
						for (const index of range(from, to)) {
							chars[index] = '';
						}
					}
				}

				const text = chars.join('').replace(/\s+/g, ' ').trim().slice(0, 60);

				io.emit('message', {
					text,
					username: tweet.user.name,
					type: 'twitter',
				});
			}
		}
	};

	updateComments(true);
	setInterval(() => {
		updateComments(false);
	}, 10 * 1000);
};