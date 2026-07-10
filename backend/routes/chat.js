const express = require('express');
const router = express.Router();
const https = require('https');

const SYSTEM_PROMPT = `你是一个校园二手交易平台的智能客服，你的名字叫"小橘"。请用友好、专业、热情的语气回答用户的问题。

你的职责包括：
1. 回答关于商品发布的问题（如何发布、审核时间等）
2. 回答关于商品交易的问题（如何购买、付款方式、物流等）
3. 回答关于商品收藏的问题（如何收藏、查看收藏等）
4. 回答关于账号的问题（注册、登录、个人信息等）
5. 回答关于平台规则的问题
6. 帮助用户解决遇到的问题

请遵循以下规则：
- 回答要简洁明了，不要啰嗦
- 使用中文回答
- 如果用户的问题不在你的职责范围内，礼貌地说明
- 不要泄露平台的技术细节

平台信息：
- 平台名称：校园二手交易平台
- 主要功能：发布商品、浏览商品、收藏商品、交易沟通
- 目标用户：在校大学生

示例回答：
用户："如何发布商品？"
回答："您好！您可以登录后点击页面底部的'发布'按钮，填写商品信息（标题、描述、价格、图片等），然后提交审核，审核通过后商品就会显示在平台上啦~"

用户："交易安全吗？"
回答："您好！我们平台非常重视交易安全，请尽量选择当面交易，避免私下转账。如果遇到问题可以联系客服哦~"`;

const fallbackReplies = {
    '下单': '您好！我们平台是二手交易平台，您看中商品后可以直接联系卖家沟通交易事宜哦~',
    '怎么下单': '您好！我们平台是二手交易平台，您看中商品后可以直接联系卖家沟通交易事宜哦~',
    '购买': '您好！您可以浏览商品列表，点击感兴趣的商品查看详情，然后联系卖家沟通购买~',
    '怎么购买': '您好！您可以浏览商品列表，点击感兴趣的商品查看详情，然后联系卖家沟通购买~',
    '发布': '您好！登录后点击页面顶部的"发布闲置"按钮，填写商品信息即可发布~',
    '怎么发布': '您好！登录后点击页面顶部的"发布闲置"按钮，填写商品信息即可发布~',
    '商品发布': '您好！登录后点击页面顶部的"发布闲置"按钮，填写商品信息即可发布~',
    '收藏': '您好！点击商品卡片上的爱心图标就可以收藏商品啦，在"我的收藏"中可以查看~',
    '怎么收藏': '您好！点击商品卡片上的爱心图标就可以收藏商品啦，在"我的收藏"中可以查看~',
    '注册': '您好！点击页面右上角的"注册"按钮，填写用户名和密码即可注册账号~',
    '怎么注册': '您好！点击页面右上角的"注册"按钮，填写用户名和密码即可注册账号~',
    '登录': '您好！点击页面右上角的"登录"按钮，输入账号密码即可登录~',
    '怎么登录': '您好！点击页面右上角的"登录"按钮，输入账号密码即可登录~',
    '交易安全': '您好！我们非常重视交易安全，建议尽量选择当面交易，避免私下转账~',
    '安全吗': '您好！我们非常重视交易安全，建议尽量选择当面交易，避免私下转账~',
    '审核': '您好！商品发布后一般会在24小时内审核通过，请耐心等待~',
    '多久审核': '您好！商品发布后一般会在24小时内审核通过，请耐心等待~',
    '物流': '您好！我们平台主要支持当面交易，您可以和卖家协商具体的交易方式~',
    '包邮': '您好！二手商品的运费需要和卖家协商，平台不强制包邮哦~',
    '退款': '您好！如果遇到交易纠纷，可以联系客服协助处理~',
    '退货': '您好！二手商品交易建议当面验货，如有问题请及时与卖家沟通~',
    '客服': '您好！我就是智能客服小橘，很高兴为您服务~',
    '你好': '您好！我是智能客服小橘，很高兴为您服务~',
    '您好': '您好！我是智能客服小橘，很高兴为您服务~',
    'hi': '您好！我是智能客服小橘，很高兴为您服务~',
    'hello': '您好！我是智能客服小橘，很高兴为您服务~',
    '谢谢': '不客气！很高兴能帮到您~',
    '感谢': '不客气！很高兴能帮到您~',
    '再见': '再见！欢迎下次再来~',
    '拜拜': '再见！欢迎下次再来~'
};

function getFallbackReply(message) {
    const lowerMsg = message.toLowerCase();
    for (const [keyword, reply] of Object.entries(fallbackReplies)) {
        if (lowerMsg.includes(keyword)) {
            return reply;
        }
    }
    return null;
}

router.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: '请输入消息内容' });
        }

        const apiKey = process.env.QIANWEN_API_KEY;
        
        if (!apiKey || apiKey === 'your-qianwen-api-key-here') {
            const fallback = getFallbackReply(message);
            if (fallback) {
                return res.json({ reply: fallback });
            }
            return res.json({ 
                reply: '您好！智能客服正在初始化中，请稍后再试~ \n\n配置提示：请访问 https://dashscope.console.aliyun.com/ 申请通义千问API Key，然后在 .env 文件中配置 QIANWEN_API_KEY'
            });
        }

        const postData = JSON.stringify({
            model: 'qwen-turbo',
            input: {
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: message }
                ]
            },
            parameters: {
                temperature: 0.7,
                max_tokens: 2000
            }
        });

        const options = {
            hostname: 'dashscope.aliyuncs.com',
            port: 443,
            path: '/api/v1/services/aigc/text-generation/generation',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }
        };

        const request = https.request(options, (response) => {
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });
            response.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.output && result.output.text) {
                        res.json({ reply: result.output.text });
                    } else if (result.output && result.output.choices && result.output.choices.length > 0) {
                        res.json({ reply: result.output.choices[0].message.content });
                    } else if (result.output && result.output.completion) {
                        res.json({ reply: result.output.completion });
                    } else {
                        console.error('API响应格式异常:', data);
                        const fallback = getFallbackReply(message);
                        res.json({ reply: fallback || '抱歉，我暂时无法回答这个问题~' });
                    }
                } catch (err) {
                    console.error('API响应解析失败:', err);
                    const fallback = getFallbackReply(message);
                    res.json({ reply: fallback || '抱歉，服务器繁忙，请稍后再试~' });
                }
            });
        });

        request.on('error', (error) => {
            console.error('API请求失败:', error);
            const fallback = getFallbackReply(message);
            res.json({ reply: fallback || '抱歉，网络连接异常，请稍后再试~' });
        });

        request.write(postData);
        request.end();

    } catch (error) {
        console.error('聊天接口异常:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

module.exports = router;