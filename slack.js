const { WebClient } = require('@slack/web-api');

const token = process.env.SLACK_TOKEN;

const web = new WebClient(token);

// type = 'anonymous' | 'twitter' | 'youtube'
module.exports = async (type, text, additionalParams) => {
    let templateParams;
    if (type === 'anonymous') {
        templateParams = {
            username: 'TSG LIVE! 公式サイト 匿名コメント',
            icon_emoji: ':dare:',
        };
    } else if (type === 'twitter') {
        templateParams = {
            username: 'Twitter #tsg_live ツイート',
            icon_emoji: ':twitter:',
        };
    } else if (type === 'youtube') {
        templateParams = {
            username: 'YouTube Live! コメント',
            icon_emoji: ':youtube:',
        };
    } else if (type === 'ctf') {
        templateParams = {
            username: 'CTF',
            icon_emoji: ':flags:',
        };
    }
    const params = {...templateParams, ...additionalParams};
    await web.chat.postMessage({
        channel: process.env.SLACK_CHANNEL_COMMENT,
        text,
        ...params,
    });
};