/**
 * 邮件智能助手 - Popup弹出页面
 * 
 * @author 云淡风轻
 * @license MIT
 * @version 1.0.0
 * @copyright 2025 云淡风轻
 */

// API配置
let API_BASE_URL = 'http://localhost:3000';
let API_KEY = '';

// DOM元素
let elements = {};

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  // 获取DOM元素
  elements = {
    settingsBtn: document.getElementById('settingsBtn'),
    refreshBtn: document.getElementById('refreshBtn'),
    statusBar: document.getElementById('statusBar'),
    statusText: document.getElementById('statusText'),
    statusIcon: document.getElementById('statusIcon'),
    emailSubject: document.getElementById('emailSubject'),
    emailBody: document.getElementById('emailBody'),
    analyzeBtn: document.getElementById('analyzeBtn'),
    resultsSection: document.getElementById('resultsSection'),
    summaryText: document.getElementById('summaryText'),
    actionItemsList: document.getElementById('actionItemsList'),
    replySuggestions: document.getElementById('replySuggestions'),
    draftSection: document.getElementById('draftSection'),
    replyIntent: document.getElementById('replyIntent'),
    replyTone: document.getElementById('replyTone'),
    generateDraftBtn: document.getElementById('generateDraftBtn'),
    draftResult: document.getElementById('draftResult'),
    draftText: document.getElementById('draftText'),
    copyDraftBtn: document.getElementById('copyDraftBtn')
  };

  // 加载配置
  await loadSettings();

  // 尝试自动提取邮件内容
  await tryExtractEmailFromPage();

  // 绑定事件
  elements.settingsBtn.addEventListener('click', openSettings);
  elements.refreshBtn.addEventListener('click', refreshEmailContent);
  elements.analyzeBtn.addEventListener('click', analyzeEmail);
  elements.generateDraftBtn.addEventListener('click', generateDraft);
  elements.copyDraftBtn.addEventListener('click', copyDraft);
});

// 加载设置
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(['apiBaseUrl', 'apiKey']);
    if (result.apiBaseUrl) {
      API_BASE_URL = result.apiBaseUrl;
    }
    if (result.apiKey) {
      API_KEY = result.apiKey;
    }
    updateStatus('就绪', 'success');
  } catch (error) {
    console.error('加载设置失败:', error);
    updateStatus('加载设置失败', 'error');
  }
}

// 打开设置页面
function openSettings() {
  chrome.runtime.openOptionsPage();
}

// 刷新邮件内容
async function refreshEmailContent() {
  try {
    elements.refreshBtn.disabled = true;
    updateStatus('正在刷新...', 'loading');
    
    // 清空现有内容
    elements.emailSubject.value = '';
    elements.emailBody.value = '';
    
    // 等待一下让页面DOM更新（特别是163邮箱的iframe）
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 重新提取（强制）
    await tryExtractEmailFromPage(true);
  } catch (error) {
    console.error('刷新失败:', error);
    updateStatus('刷新失败', 'error');
  } finally {
    elements.refreshBtn.disabled = false;
  }
}

// 更新状态
function updateStatus(message, type = 'normal') {
  elements.statusText.textContent = message;
  elements.statusBar.className = 'status-bar';
  
  if (type === 'success') {
    elements.statusBar.classList.add('success');
    elements.statusIcon.textContent = '';
  } else if (type === 'error') {
    elements.statusBar.classList.add('error');
    elements.statusIcon.textContent = '';
  } else if (type === 'loading') {
    elements.statusBar.classList.add('loading');
    elements.statusIcon.innerHTML = '<span class="loading-spinner"></span>';
  } else {
    elements.statusIcon.textContent = '';
  }
}

// 从页面提取邮件内容
async function tryExtractEmailFromPage(force = false) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.url) return;
    
    // 检查是否是邮件页面
    if (tab.url.includes('mail.google.com') || 
        tab.url.includes('outlook.live.com') || 
        tab.url.includes('outlook.office.com') ||
        tab.url.includes('mail.163.com')) {
      
      // 发送消息到内容脚本（增加超时保护）
      const sendWithTimeout = new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('内容脚本响应超时')), 2500);
        chrome.tabs.sendMessage(tab.id, { action: 'extractEmail', force }, (resp) => {
          clearTimeout(timer);
          resolve(resp);
        });
      });
      let response;
      try {
        response = await sendWithTimeout;
      } catch (e) {
        console.warn('提取超时/失败:', e);
        updateStatus('未能提取邮件内容（页面未就绪或权限不足）', 'error');
        return;
      }
      
      if (response && response.success) {
        elements.emailSubject.value = response.data.subject || '';
        elements.emailBody.value = response.data.body || '';
        updateStatus('已自动提取邮件内容', 'success');
      } else {
        updateStatus('未能提取邮件内容', 'error');
      }
    }
  } catch (error) {
    updateStatus('未能提取邮件内容', 'error');
  }
}

// 清理邮箱地址格式
function cleanEmailAddress(email) {
  if (!email) return '';
  
  const trimmed = email.trim();
  
  // 识别"我"、"me"、"myself"等关键词为空值（表示收件人是自己）
  const selfKeywords = ['我', 'me', 'myself', '自己', 'self'];
  if (selfKeywords.includes(trimmed.toLowerCase())) {
    return '';
  }
  
  // 去除尖括号、引号等特殊字符，只保留邮箱地址
  const emailMatch = trimmed.match(/[^\s<>"]+@[^\s<>"]+\.[^\s<>"]+/);
  if (emailMatch) {
    return emailMatch[0].trim();
  }
  
  // 如果不是邮箱格式，返回原文本（让后续验证处理）
  return trimmed;
}

// 分析邮件
async function analyzeEmail() {
  const subject = elements.emailSubject.value.trim();
  const body = elements.emailBody.value.trim();

  // 验证必填字段
  if (!subject || !body) {
    updateStatus('请填写完整的邮件信息（主题、正文）', 'error');
    return;
  }

  // 禁用按钮
  elements.analyzeBtn.disabled = true;
  updateStatus('正在分析邮件...', 'loading');

  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        subject,
        body,
        language: 'zh'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '分析失败');
    }

    const result = await response.json();
    displayResults(result);
    updateStatus('分析完成', 'success');

    // 显示草稿生成区域
    elements.draftSection.classList.remove('hidden');

  } catch (error) {
    console.error('分析失败:', error);
    updateStatus(`分析失败: ${error.message}`, 'error');
  } finally {
    elements.analyzeBtn.disabled = false;
  }
}

// 显示分析结果
function displayResults(result) {
  // 处理可能的字符串格式JSON
  let data = result;
  if (typeof result === 'string') {
    try {
      data = JSON.parse(result);
    } catch (e) {
      data = { summary: result, action_items: [], reply_suggestions: [] };
    }
  }
  
  // 显示摘要
  elements.summaryText.textContent = data.summary || '无摘要';

  // 显示待办事项
  elements.actionItemsList.innerHTML = '';
  if (data.action_items && data.action_items.length > 0) {
    data.action_items.forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${escapeHtml(item.title)}</strong>
        ${item.assignee ? `<small>负责人: ${escapeHtml(item.assignee)}</small>` : ''}
        ${item.deadline ? `<small>截止: ${escapeHtml(item.deadline)}</small>` : ''}
      `;
      elements.actionItemsList.appendChild(li);
    });
  } else {
    elements.actionItemsList.innerHTML = '<li>无待办事项</li>';
  }

  // 显示回复建议
  elements.replySuggestions.innerHTML = '';
  if (data.reply_suggestions && data.reply_suggestions.length > 0) {
    data.reply_suggestions.forEach(suggestion => {
      const div = document.createElement('div');
      div.className = 'reply-suggestion';
      div.innerHTML = `
        <div class="label">${escapeHtml(suggestion.label)}</div>
        <div class="draft">${escapeHtml(suggestion.draft)}</div>
      `;
      div.addEventListener('click', () => {
        elements.replyIntent.value = suggestion.label;
      });
      elements.replySuggestions.appendChild(div);
    });
  } else {
    elements.replySuggestions.innerHTML = '<div class="reply-suggestion"><div class="draft">无回复建议</div></div>';
  }

  // 显示结果区域
  elements.resultsSection.classList.remove('hidden');
}

// 生成回复草稿
async function generateDraft() {
  const subject = elements.emailSubject.value.trim();
  const body = elements.emailBody.value.trim();
  const intent = elements.replyIntent.value.trim();
  const tone = elements.replyTone.value;

  if (!intent) {
    updateStatus('请输入回复意图', 'error');
    return;
  }

  elements.generateDraftBtn.disabled = true;
  updateStatus('正在生成回复草稿...', 'loading');

  try {
    const response = await fetch(`${API_BASE_URL}/draft_reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        email: {
          subject,
          body,
          language: 'zh'
        },
        intent,
        tone,
        max_chars: 800
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '生成失败');
    }

    const result = await response.json();
    elements.draftText.value = result.draft;
    elements.draftResult.classList.remove('hidden');
    updateStatus('草稿生成完成', 'success');

  } catch (error) {
    console.error('生成草稿失败:', error);
    updateStatus(`生成失败: ${error.message}`, 'error');
  } finally {
    elements.generateDraftBtn.disabled = false;
  }
}

// 复制草稿
async function copyDraft() {
  try {
    await navigator.clipboard.writeText(elements.draftText.value);
    elements.copyDraftBtn.textContent = '✓ 已复制';
    setTimeout(() => {
      elements.copyDraftBtn.textContent = '📋 复制';
    }, 2000);
  } catch (error) {
    console.error('复制失败:', error);
    updateStatus('复制失败', 'error');
  }
}

// HTML转义
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
