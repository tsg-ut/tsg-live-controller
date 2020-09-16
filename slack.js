const { WebClient } = require('@slack/web-api');

const token = process.env.SLACK_TOKEN;

const web = new WebClient(token);

// type = 'anonymous' | 'twitter' | 'youtube'

module.exports = async (type, text, url) => {
    let username;
    let icon_emoji;
    if (type === 'anonymous') {
        username = 'TSG LIVE! 公式サイト 匿名コメント';
        icon_emoji = ':dare:';
    } else if (type === 'twitter') {
        uesrname = 'Twitter #tsg_live ツイート';
        icon_emoji = ':twitter:';
    } else if (type === 'youtube') {
        username = 'YouTube Live! コメント';
        icon_emoji = ':youtube:'
    }
    await web.chat.postMessage({
        channel: process.env.SLACK_CHANNEL_COMMENT,
        username,
        icon_emoji,
        text: url ? text + '\n' +  url : text,
    });
};