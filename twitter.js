const {OAuth} = require('oauth');
const {range} = require('lodash');
const qs = require('querystring');
require('dotenv').config();

const slack = require('./slack');

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
					q: '#tsg_live OR #tsglive -filter:retweets -filter:replies -from:tsg_ut',
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

				console.log(text);

				io.emit('message', {
					text,
					username: tweet.user.name,
					type: 'twitter',
				});

				const userDescription = (tweet.user.isProtected ? ':lock:' : '')
				+ ` ${tweet.user.name} `
				+ `<https://twitter.com/${tweet.user.screen_name}|@${tweet.user.screen_name}>`;

				const tweetUrl = `https://twitter.com/${tweet.user.screen_name}/${tweet.id_str}`;

				slack('twitter', text, {
					blocks: [
						{
							type: 'context',
							elements: [
								{
									type: 'image',
									image_url: tweet.user.profile_image_url_https,
									alt_text: `@${tweet.user.screen_name}'s icon`,
								},
								{
									type: 'mrkdwn',
									text: userDescription + '\n' + tweet.user.description,
								},
							],
						},
						{
							type: 'section',
							text: {
								type: 'mrkdwn',
								text: text,
							},
						},
						{
							type: 'context',
							elements: [{
								type: 'mrkdwn',
								text: tweetUrl,
							}],
						},
					],
				});
			}
		}
	};

	updateComments(true);
	setInterval(() => {
		updateComments(false);
	}, 10 * 1000);
};