/**
 * 邮件智能助手 - Background Service Worker
 * 
 * @author 云淡风轻
 * @license MIT
 * @version 1.0.0
 * @copyright 2025 云淡风轻
 */

// 监听扩展安装事件
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    
    // 设置默认配置
    chrome.storage.sync.set({
      apiBaseUrl: 'http://localhost:3000',
      apiKey: ''
    });
    
    // 打开欢迎页面或设置页面
    chrome.runtime.openOptionsPage();
  }
});

// 监听来自内容脚本或popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeEmail') {
    handleAnalyzeEmail(request.data, sendResponse);
    return true; // 保持消息通道开放以进行异步响应
  } else if (request.action === 'generateDraft') {
    handleGenerateDraft(request.data, sendResponse);
    return true;
  } else if (request.action === 'getConfig') {
    chrome.storage.sync.get(['apiBaseUrl', 'apiKey'], (result) => {
      sendResponse({
        apiBaseUrl: result.apiBaseUrl || 'http://localhost:3000',
        apiKey: result.apiKey || ''
      });
    });
    return true;
  }
});

// 处理邮件分析请求
async function handleAnalyzeEmail(data, sendResponse) {
  try {
    // 获取配置
    const config = await chrome.storage.sync.get(['apiBaseUrl', 'apiKey']);
    const apiBaseUrl = config.apiBaseUrl || 'http://localhost:3000';
    const apiKey = config.apiKey || '';

    // 调用API
    const response = await fetch(`${apiBaseUrl}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`API错误: ${response.status}`);
    }

    const result = await response.json();
    sendResponse({ success: true, data: result });

  } catch (error) {
    console.error('分析邮件失败:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// 处理草稿生成请求
async function handleGenerateDraft(data, sendResponse) {
  try {
    // 获取配置
    const config = await chrome.storage.sync.get(['apiBaseUrl', 'apiKey']);
    const apiBaseUrl = config.apiBaseUrl || 'http://localhost:3000';
    const apiKey = config.apiKey || '';

    // 调用API
    const response = await fetch(`${apiBaseUrl}/draft_reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`API错误: ${response.status}`);
    }

    const result = await response.json();
    sendResponse({ success: true, data: result });

  } catch (error) {
    console.error('生成草稿失败:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// 监听标签页更新事件（可选：用于检测邮件页面）
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // 检查是否是支持的邮件服务
    if (tab.url.includes('mail.google.com') || 
        tab.url.includes('outlook.live.com') || 
        tab.url.includes('outlook.office.com')) {
      // 可以在这里注入内容脚本或显示页面操作按钮
    }
  }
});

// 创建右键菜单（可选功能）
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'analyzeSelectedText',
    title: '分析选中的邮件内容',
    contexts: ['selection']
  });
});

// 监听右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'analyzeSelectedText') {
    const selectedText = info.selectionText;
    // 可以打开popup或直接处理选中的文本
    // TODO: 实现分析选中文本功能
  }
});
