/**
 * 邮件智能助手 - 邮件分析路由
 * 
 * @author 云淡风轻
 * @license MIT
 * @copyright 2025 云淡风轻
 */

const express = require('express');
const NodeCache = require('node-cache');
const crypto = require('crypto');
const { callLLMForAnalysis } = require('../llm/llmAdapter');
const config = require('../config');
const { log } = require('../utils/enhancedLogger');
const { llmLimiter } = require('../middleware/rateLimiter');
const { validate, analyzeSchema } = require('../middleware/validator');
const { AppError } = require('../middleware/errorHandler');
const { contentFilter } = require('../middleware/contentFilter');

const cache = new NodeCache({ 
  stdTTL: config.CACHE_TTL, 
  checkperiod: Math.floor(config.CACHE_TTL / 10) 
});

const router = express.Router();

/**
 * @swagger
 * /analyze:
 *   post:
 *     summary: 分析邮件内容
 *     description: 分析邮件并生成摘要、待办事项和回复建议
 *     tags: [Email Analysis]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailAnalysisRequest'
 *     responses:
 *       200:
 *         description: 分析成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmailAnalysisResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', llmLimiter, validate(analyzeSchema), contentFilter, async (req, res, next) => {
  const startTime = Date.now();
  
  try {
    const { subject = '', from = '', to = '', body, language = 'en' } = req.body;

    // 生成内容哈希用于缓存
    const bodyHash = crypto
      .createHash('sha256')
      .update(body)
      .digest('hex');

    // 检查内存缓存
    const cacheKey = bodyHash;
    const cached = cache.get(cacheKey);
    if (cached) {
      log('info', 'Memory cache hit for analyze', { from, to });
      return res.json(cached);
    }

    // 调用LLM分析
    log('info', 'Calling LLM for email analysis', { 
      from, 
      to, 
      bodyLength: body.length 
    });

    const llmResp = await callLLMForAnalysis({ subject, from, to, body, language });
    
    // 期望助手返回JSON格式。尝试解析第一个选择的内容
    let content = llmResp.choices?.[0]?.message?.content || llmResp.choices?.[0]?.text || '';
    let parsed;
    
    // 清理markdown代码块标记
    content = content.trim();
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\s*\n?/, '').replace(/\n?```\s*$/, '');
    }
    
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      log('warn', 'Failed to parse LLM response as JSON', { 
        content: content.substring(0, 200),
        error: e.message
      });
      // 最佳努力降级：包装内容
      parsed = { 
        summary: content, 
        action_items: [], 
        reply_suggestions: [] 
      };
    }

    const processingTime = Date.now() - startTime;

    // 保存到内存缓存
    cache.set(cacheKey, parsed);

    log('info', 'Email analysis completed', { 
      from, 
      to, 
      processingTime 
    });

    res.json(parsed);
  } catch (err) {
    log('error', 'Email analysis failed', { 
      message: err.message,
      stack: err.stack
    });
    next(new AppError('Email analysis failed: ' + err.message, 500));
  }
});

module.exports = router;
