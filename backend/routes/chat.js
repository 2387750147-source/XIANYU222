const express = require('express');
const router = express.Router();
const https = require('https');
const querystring = require('querystring');

const SYSTEM_PROMPT = `你是一个校园二手交易平台的智能客服，你的名字叫"小橘"。请用友好、专业、热情的语气回答用户的问题。

平台名称：校园二手交易平台
目标用户：在校大学生
主要功能：发布闲置商品、浏览商品列表、搜索商品、收藏商品、用户注册登录、个人中心管理

你的职责包括：
1. 回答关于商品发布的问题（如何发布、需要填写什么信息、审核时间、发布限制等）
2. 回答关于商品浏览和搜索的问题（如何搜索、筛选条件、商品分类等）
3. 回答关于商品交易的问题（如何购买、交易方式、价格协商等）
4. 回答关于商品收藏的问题（如何收藏、查看收藏、取消收藏等）
5. 回答关于账号的问题（注册、登录、找回密码、修改资料、实名认证等）
6. 回答关于平台规则的问题（禁止交易的物品、交易安全、投诉举报等）
7. 帮助用户解决遇到的问题（发布失败、登录异常、页面报错等）
8. 提供平台使用建议和帮助

平台详细信息：
- 商品分类：数码产品、学习资料、生活电器、美妆护肤、服饰鞋包、运动户外、其他
- 交易方式：支持当面交易（推荐）、快递邮寄
- 商品状态：待审核、已上架、已售出、已下架
- 审核时间：一般在24小时内完成审核
- 发布限制：每个用户每天最多发布5件商品，禁售品包括：违禁物品、假冒伪劣商品、食品药品、活体动物、色情物品等

常见问题知识库：
Q: 如何发布商品？
A: 登录后点击页面底部的"发布"按钮，填写商品标题、描述、价格、上传图片，选择分类和交易方式，然后提交审核。

Q: 商品发布后多久能看到？
A: 商品发布后需要经过审核，一般在24小时内审核通过后会显示在平台上。

Q: 如何修改已发布的商品？
A: 在"我的发布"中找到要修改的商品，点击编辑按钮进行修改，修改后需要重新审核。

Q: 如何删除商品？
A: 在"我的发布"中找到要删除的商品，点击删除按钮即可删除。

Q: 如何搜索商品？
A: 在首页搜索框输入关键词，或者使用筛选条件（分类、价格区间、发布时间等）进行筛选。

Q: 如何联系卖家？
A: 点击商品详情页的"联系卖家"按钮，可以查看卖家联系方式或发送消息。

Q: 交易安全吗？
A: 我们非常重视交易安全，建议尽量选择当面交易，验货后再付款。如遇欺诈行为请及时举报。

Q: 如何收藏商品？
A: 点击商品卡片上的爱心图标即可收藏，在"我的收藏"中可以查看所有收藏的商品。

Q: 如何取消收藏？
A: 在"我的收藏"中再次点击爱心图标即可取消收藏。

Q: 如何注册账号？
A: 点击页面右上角的"注册"按钮，填写用户名、密码、昵称、手机号等信息即可注册。

Q: 忘记密码怎么办？
A: 在登录页面点击"忘记密码"，输入注册手机号，通过验证码找回密码。

Q: 如何修改个人资料？
A: 进入"我的"页面，点击"编辑资料"即可修改头像、昵称、联系方式等信息。

Q: 如何实名认证？
A: 在"我的"页面找到"实名认证"入口，按照提示上传身份证照片完成认证。

Q: 商品被下架了怎么办？
A: 商品可能因违规被下架，可以联系客服了解具体原因，修改后重新发布。

Q: 如何投诉举报？
A: 在商品详情页或用户主页找到举报按钮，选择举报类型并填写原因提交。

请遵循以下规则：
- 回答要简洁明了，不要啰嗦
- 使用中文回答
- 如果用户的问题不在你的职责范围内，礼貌地说明并建议咨询其他渠道
- 不要泄露平台的技术细节
- 不要提供虚假信息
- 遇到无法回答的问题，引导用户联系人工客服

示例回答：
用户："如何发布商品？"
回答："您好！您可以登录后点击页面底部的'发布'按钮，填写商品信息（标题、描述、价格、图片等），然后提交审核，审核通过后商品就会显示在平台上啦~"

用户："交易安全吗？"
回答："您好！我们平台非常重视交易安全，请尽量选择当面交易，验货后再付款。如果遇到问题可以联系客服哦~"`;

const fallbackReplies = {
    '下单': '您好！我们平台是二手交易平台，您看中商品后可以直接联系卖家沟通交易事宜哦~',
    '怎么下单': '您好！我们平台是二手交易平台，您看中商品后可以直接联系卖家沟通交易事宜哦~',
    '购买': '您好！您可以浏览商品列表，点击感兴趣的商品查看详情，然后联系卖家沟通购买~',
    '怎么购买': '您好！您可以浏览商品列表，点击感兴趣的商品查看详情，然后联系卖家沟通购买~',
    '发布': '您好！登录后点击页面底部的"发布"按钮，填写商品信息（标题、描述、价格、图片等）即可发布~',
    '怎么发布': '您好！登录后点击页面底部的"发布"按钮，填写商品信息即可发布~',
    '商品发布': '您好！登录后点击页面底部的"发布"按钮，填写商品信息即可发布~',
    '审核': '您好！商品发布后一般会在24小时内审核通过，请耐心等待~',
    '审核时间': '您好！商品发布后一般会在24小时内审核通过，请耐心等待~',
    '多久审核': '您好！商品发布后一般会在24小时内审核通过，请耐心等待~',
    '审核通过': '您好！审核通过后商品会自动上架显示在平台上~',
    '收藏': '您好！点击商品卡片上的爱心图标就可以收藏商品啦，在"我的收藏"中可以查看~',
    '怎么收藏': '您好！点击商品卡片上的爱心图标就可以收藏商品啦，在"我的收藏"中可以查看~',
    '取消收藏': '您好！在"我的收藏"中再次点击爱心图标即可取消收藏~',
    '我的收藏': '您好！您可以在"我的"页面找到"我的收藏"查看收藏的商品~',
    '注册': '您好！点击页面右上角的"注册"按钮，填写用户名和密码即可注册账号~',
    '怎么注册': '您好！点击页面右上角的"注册"按钮，填写用户名和密码即可注册账号~',
    '登录': '您好！点击页面右上角的"登录"按钮，输入账号密码即可登录~',
    '怎么登录': '您好！点击页面右上角的"登录"按钮，输入账号密码即可登录~',
    '忘记密码': '您好！在登录页面点击"忘记密码"，输入注册手机号，通过验证码找回密码~',
    '找回密码': '您好！在登录页面点击"忘记密码"，输入注册手机号，通过验证码找回密码~',
    '交易安全': '您好！我们非常重视交易安全，建议尽量选择当面交易，避免私下转账~',
    '安全吗': '您好！我们非常重视交易安全，建议尽量选择当面交易，避免私下转账~',
    '当面交易': '您好！我们推荐当面交易，可以验货后再付款，更加安全~',
    '快递': '您好！二手商品的运费需要和卖家协商，平台不强制包邮哦~',
    '包邮': '您好！二手商品的运费需要和卖家协商，平台不强制包邮哦~',
    '运费': '您好！二手商品的运费需要和卖家协商，平台不强制包邮哦~',
    '退款': '您好！如果遇到交易纠纷，可以联系客服协助处理~',
    '退货': '您好！二手商品交易建议当面验货，如有问题请及时与卖家沟通~',
    '投诉': '您好！在商品详情页或用户主页找到举报按钮，选择举报类型并填写原因提交~',
    '举报': '您好！在商品详情页或用户主页找到举报按钮，选择举报类型并填写原因提交~',
    '违规': '您好！如果您的商品被判定违规，请检查是否涉及禁售品或违反平台规则~',
    '下架': '您好！商品可能因违规被下架，可以联系客服了解具体原因，修改后重新发布~',
    '客服': '您好！我就是智能客服小橘，很高兴为您服务~',
    '小橘': '您好！我就是智能客服小橘，很高兴为您服务~',
    '你好': '您好！我是智能客服小橘，很高兴为您服务~',
    '您好': '您好！我是智能客服小橘，很高兴为您服务~',
    'hi': '您好！我是智能客服小橘，很高兴为您服务~',
    'hello': '您好！我是智能客服小橘，很高兴为您服务~',
    '谢谢': '不客气！很高兴能帮到您~',
    '感谢': '不客气！很高兴能帮到您~',
    '再见': '再见！欢迎下次再来~',
    '拜拜': '再见！欢迎下次再来~',
    '搜索': '您好！在首页搜索框输入关键词，或者使用筛选条件进行筛选~',
    '怎么搜索': '您好！在首页搜索框输入关键词，或者使用筛选条件进行筛选~',
    '查找': '您好！在首页搜索框输入关键词，或者使用筛选条件进行筛选~',
    '分类': '您好！我们平台商品分为：数码产品、学习资料、生活电器、美妆护肤、服饰鞋包、运动户外等~',
    '商品分类': '您好！我们平台商品分为：数码产品、学习资料、生活电器、美妆护肤、服饰鞋包、运动户外等~',
    '个人中心': '您好！点击页面底部的"我的"按钮即可进入个人中心~',
    '我的': '您好！点击页面底部的"我的"按钮即可进入个人中心~',
    '资料': '您好！在"我的"页面点击"编辑资料"即可修改个人信息~',
    '修改资料': '您好！在"我的"页面点击"编辑资料"即可修改个人信息~',
    '头像': '您好！在"我的"页面点击头像即可更换~',
    '实名认证': '您好！在"我的"页面找到"实名认证"入口，按照提示上传身份证照片完成认证~',
    '联系卖家': '您好！点击商品详情页的"联系卖家"按钮，可以查看卖家联系方式或发送消息~',
    '卖家': '您好！点击商品详情页的"联系卖家"按钮，可以查看卖家联系方式或发送消息~',
    '价格': '您好！二手商品的价格由卖家自行设定，您可以和卖家协商议价~',
    '议价': '您好！二手商品的价格由卖家自行设定，您可以和卖家协商议价~',
    '砍价': '您好！二手商品的价格由卖家自行设定，您可以和卖家协商议价~',
    '包邮': '您好！二手商品的运费需要和卖家协商，平台不强制包邮哦~',
    '物流': '您好！我们平台主要支持当面交易，您也可以和卖家协商快递邮寄~',
    '发货': '您好！二手商品的发货时间需要和卖家协商确认~',
    '收货': '您好！请在收到商品后及时确认，如有问题请及时联系卖家或客服~',
    '商品详情': '您好！点击商品卡片即可查看商品详情~',
    '详情': '您好！点击商品卡片即可查看商品详情~',
    '编辑商品': '您好！在"我的发布"中找到要修改的商品，点击编辑按钮进行修改~',
    '修改商品': '您好！在"我的发布"中找到要修改的商品，点击编辑按钮进行修改~',
    '删除商品': '您好！在"我的发布"中找到要删除的商品，点击删除按钮即可删除~',
    '上架': '您好！审核通过的商品会自动上架显示~',
    '下架': '您好！在"我的发布"中可以手动下架商品~',
    '已售出': '您好！商品售出后请及时在平台标记为已售出~',
    '禁售': '您好！禁售品包括：违禁物品、假冒伪劣商品、食品药品、活体动物、色情物品等~',
    '违规物品': '您好！禁售品包括：违禁物品、假冒伪劣商品、食品药品、活体动物、色情物品等~',
    '大学生': '您好！我们是面向大学生的二手交易平台，欢迎您的使用~',
    '校园': '您好！我们是面向大学生的校园二手交易平台，欢迎您的使用~',
    '二手': '您好！我们是校园二手交易平台，专门为大学生提供闲置物品交易服务~',
    '闲置': '您好！我们是校园二手交易平台，专门为大学生提供闲置物品交易服务~',
    '帮助': '您好！请问有什么可以帮到您的？',
    '使用帮助': '您好！请问有什么可以帮到您的？',
    '问题': '您好！请问有什么可以帮到您的？',
    '意见': '您好！感谢您的反馈，我们会认真处理每一条建议~',
    '建议': '您好！感谢您的反馈，我们会认真处理每一条建议~',
    '反馈': '您好！感谢您的反馈，我们会认真处理每一条建议~'
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

let cachedAccessToken = null;
let tokenExpireTime = 0;

function isNewApiKeyFormat(apiKey) {
    return apiKey && apiKey.startsWith('bce-v3/');
}

function getAccessToken() {
    return new Promise((resolve, reject) => {
        const apiKey = process.env.BAIDU_API_KEY;

        if (isNewApiKeyFormat(apiKey)) {
            return resolve(apiKey);
        }

        const now = Date.now();
        if (cachedAccessToken && now < tokenExpireTime) {
            return resolve(cachedAccessToken);
        }

        const secretKey = process.env.BAIDU_SECRET_KEY;

        if (!apiKey || !secretKey) {
            return reject(new Error('缺少百度API Key或Secret Key'));
        }

        const postData = querystring.stringify({
            grant_type: 'client_credentials',
            client_id: apiKey,
            client_secret: secretKey
        });

        const options = {
            hostname: 'aip.baidubce.com',
            port: 443,
            path: '/oauth/2.0/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
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
                    if (result.access_token) {
                        cachedAccessToken = result.access_token;
                        tokenExpireTime = now + (result.expires_in - 60) * 1000;
                        resolve(cachedAccessToken);
                    } else {
                        reject(new Error(result.error_description || '获取access_token失败'));
                    }
                } catch (err) {
                    reject(new Error('解析access_token响应失败'));
                }
            });
        });

        request.on('error', (error) => {
            reject(error);
        });

        request.write(postData);
        request.end();
    });
}

router.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: '请输入消息内容' });
        }

        const apiKey = process.env.BAIDU_API_KEY;

        if (!apiKey || apiKey === 'your-baidu-api-key-here') {
            const fallback = getFallbackReply(message);
            if (fallback) {
                return res.json({ reply: fallback });
            }
            return res.json({ 
                reply: '您好！智能客服正在初始化中，请稍后再试~ \n\n配置提示：请访问 https://cloud.baidu.com/product/wenxinworkshop 申请百度千帆API Key，然后在 .env 文件中配置 BAIDU_API_KEY'
            });
        }

        let accessToken;
        try {
            accessToken = await getAccessToken();
        } catch (tokenError) {
            console.error('获取access_token失败:', tokenError.message);
            const fallback = getFallbackReply(message);
            return res.json({ reply: fallback || '抱歉！连接百度AI服务失败，请稍后再试~' });
        }

        const postData = JSON.stringify({
            model: 'ernie-3.5-turbo',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: message }
            ],
            temperature: 0.7,
            max_tokens: 2000
        });

        const options = {
            hostname: 'aip.baidubce.com',
            port: 443,
            path: '/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'Authorization': 'Bearer ' + accessToken
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
                    if (response.statusCode === 401) {
                        console.error('access_token失效:', data);
                        if (!isNewApiKeyFormat(apiKey)) {
                            cachedAccessToken = null;
                        }
                        const fallback = getFallbackReply(message);
                        return res.json({ reply: fallback || '抱歉！服务暂时不可用，请稍后再试~' });
                    }
                    if (response.statusCode !== 200) {
                        console.error('API请求失败，状态码:', response.statusCode, ', 响应:', data);
                        const fallback = getFallbackReply(message);
                        return res.json({ reply: fallback || '抱歉，服务暂时不可用，请稍后再试~' });
                    }
                    if (result.result) {
                        res.json({ reply: result.result });
                    } else if (result.error_code) {
                        console.error('百度API返回错误:', result.error_code, result.error_msg);
                        if ((result.error_code === 110 || result.error_code === 111) && !isNewApiKeyFormat(apiKey)) {
                            cachedAccessToken = null;
                        }
                        const fallback = getFallbackReply(message);
                        res.json({ reply: fallback || '抱歉，我暂时无法回答这个问题~' });
                    } else {
                        console.error('API响应格式异常:', data);
                        const fallback = getFallbackReply(message);
                        res.json({ reply: fallback || '抱歉，我暂时无法回答这个问题~' });
                    }
                } catch (err) {
                    console.error('API响应解析失败:', err, ', 原始响应:', data);
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