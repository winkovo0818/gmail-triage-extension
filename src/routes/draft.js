/**
 * 邮件智能助手 - 草稿生成路由
 * 
 * @author 云淡风轻
 * @license MIT
 * @copyright 2025 云淡风轻
 */

const express = require('express');
const { callLLMForDraft } = require('../llm/llmAdapter');
const { log } = require('../utils/enhancedLogger');
const { llmLimiter } = require('../middleware/rateLimiter');
const { validate, draftReplySchema } = require('../middleware/validator');
const { AppError } = require('../middleware/errorHandler');
const config = require('../config');

const router = express.Router();

/**
 * @swagger
 * /draft_reply:
 *   post:
 *     summary: 生成回复草稿
 *     description: 根据邮件内容和意图生成回复草稿
 *     tags: [Email Draft]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DraftReplyRequest'
 *     responses:
 *       200:
 *         description: 草稿生成成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DraftReplyResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', llmLimiter, validate(draftReplySchema), async (req, res, next) => {
  const startTime = Date.now();
  
  try {
    const { email, intent, tone = 'concise', max_chars = 800 } = req.body;

    log('info', 'Generating draft reply', {
      from: email.from || '',
      to: email.to || '',
      intent: intent.substring(0, 50),
      tone,
      max_chars
    });

    const llmResp = await callLLMForDraft(email, intent, tone, max_chars);
    const content = llmResp.choices?.[0]?.message?.content || llmResp.choices?.[0]?.text || '';
    
    // 返回修剪后的草稿
    const draft = (typeof content === 'string') ? content.trim() : JSON.stringify(content);

    const processingTime = Date.now() - startTime;

    log('info', 'Draft reply generated successfully', {
      from: email.from,
      to: email.to,
      draftLength: draft.length,
      processingTime,
      tokensUsed: llmResp.usage?.total_tokens || 0
    });

    res.json({ 
      draft,
      metadata: {
        tone,
        length: draft.length,
        processingTime,
        model: config.LLM_MODEL
      }
    });
  } catch (err) {
    log('error', 'Draft generation failed', {
      message: err.message,
      stack: err.stack
    });
    next(new AppError('Draft generation failed: ' + err.message, 500));
  }
});

module.exports = router;
