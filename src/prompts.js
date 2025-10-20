// src/prompts.js
// 集中管理的提示词模板，便于维护和测试
function analysisPrompt(email) {
  return `You are an email assistant. Given the following email, produce a JSON object with keys:\n- summary: (one short paragraph)\n- action_items: an array of objects with keys title, assignee (if inferable), deadline (if inferable)\n- reply_suggestions: an array of objects with keys label and draft (a short reply suggestion).\n\nEmail metadata: ${JSON.stringify({ subject: email.subject, from: email.from, to: email.to })}\n\nEmail body:\n${email.body}\n\nReturn valid JSON only.`;
}

function draftPrompt(email, intent, tone='concise', max_chars = 800) {
  return `Write a reply to the following email. Tone: ${tone}. Max characters: ${max_chars}. Intent: ${intent}.\nEmail metadata: ${JSON.stringify({ subject: email.subject, from: email.from, to: email.to })}\n\nEmail body:\n${email.body}\n\nReturn only the email reply text.`;
}

module.exports = { analysisPrompt, draftPrompt };
