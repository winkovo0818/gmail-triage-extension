/**
 * 邮件智能助手 - LLM适配器
 * 支持OpenAI聊天补全接口
 * 
 * @author 云淡风轻
 * @license MIT
 * @copyright 2025 云淡风轻
 */

const axios = require('axios');
const config = require('../config');
const { log } = require('../utils/logger');

async function callOpenAIChat(messages, max_tokens = 800, temperature = 0.2) {
  if (!config.LLM_API_KEY) throw new Error('LLM_API_KEY not set');
  const url = `${config.LLM_API_BASE.replace(/\/$/, '')}/chat/completions`;
  const body = {
    model: config.LLM_MODEL,
    messages,
    max_tokens,
    temperature
  };
  try {
    const resp = await axios.post(url, body, {
      headers: {
        'Authorization': `Bearer ${config.LLM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });
    log('debug', 'LLM call success', { status: resp.status });
    return resp.data;
  } catch (err) {
    log('error', 'LLM call failed', { message: err.message, code: err.code, resp: err.response?.data });
    throw err;
  }
}

async function callLLMForAnalysis(emailPayload) {
  // 根据提示词构建消息
  const system = { role: 'system', content: `You are an assistant that summarizes emails and extracts action items and suggested short reply drafts. Return a JSON object with keys: summary, action_items (array of {title, assignee, deadline?}), reply_suggestions (array of {label, draft}). Keep language consistent with the input email.` };
  const user = { role: 'user', content: `Email metadata: ${JSON.stringify({ subject: emailPayload.subject, from: emailPayload.from, to: emailPayload.to })}\n\nBody:\n${emailPayload.body}` };
  const resp = await callOpenAIChat([system, user], 800);
  return resp;
}

async function callLLMForDraft(emailPayload, intent, tone = 'concise', max_chars = 800) {
  const system = { role: 'system', content: `You are an assistant that writes reply drafts to emails. Use the requested tone. Return only the reply text (no JSON wrapper).` };
  const userPrompt = `Write a reply in ${emailPayload.language || 'the email language'}. Tone: ${tone}. Max chars: ${max_chars}. Intent: ${intent}. Email: ${JSON.stringify({ subject: emailPayload.subject, from: emailPayload.from, to: emailPayload.to, body: emailPayload.body })}`;
  const user = { role: 'user', content: userPrompt };
  const resp = await callOpenAIChat([system, user], 500);
  return resp;
}

module.exports = { callLLMForAnalysis, callLLMForDraft };
