/**
 * 邮件智能助手 - Options设置页面
 * 
 * @author 云淡风轻
 * @license MIT
 * @version 1.0.0
 * @copyright 2025 云淡风轻
 */

// DOM元素
let elements = {};

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  // 获取DOM元素
  elements = {
    form: document.getElementById('settingsForm'),
    apiBaseUrl: document.getElementById('apiBaseUrl'),
    apiKey: document.getElementById('apiKey'),
    toggleApiKey: document.getElementById('toggleApiKey'),
    testConnection: document.getElementById('testConnection'),
    connectionStatus: document.getElementById('connectionStatus'),
    autoExtract: document.getElementById('autoExtract'),
    showFloatingButton: document.getElementById('showFloatingButton'),
    defaultTone: document.getElementById('defaultTone'),
    resetBtn: document.getElementById('resetBtn'),
    saveStatus: document.getElementById('saveStatus')
  };

  // 加载保存的设置
  await loadSettings();

  // 绑定事件
  elements.form.addEventListener('submit', saveSettings);
  elements.toggleApiKey.addEventListener('click', toggleApiKeyVisibility);
  elements.testConnection.addEventListener('click', testConnection);
  elements.resetBtn.addEventListener('click', resetToDefaults);
});

// 加载设置
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get([
      'apiBaseUrl',
      'apiKey',
      'autoExtract',
      'showFloatingButton',
      'defaultTone'
    ]);

    elements.apiBaseUrl.value = result.apiBaseUrl || 'http://localhost:3000';
    elements.apiKey.value = result.apiKey || '';
    elements.autoExtract.checked = result.autoExtract !== false;
    elements.showFloatingButton.checked = result.showFloatingButton !== false;
    elements.defaultTone.value = result.defaultTone || 'concise';

  } catch (error) {
    console.error('加载设置失败:', error);
    showSaveStatus('加载设置失败', 'error');
  }
}

// 保存设置
async function saveSettings(e) {
  e.preventDefault();

  const settings = {
    apiBaseUrl: elements.apiBaseUrl.value.trim(),
    apiKey: elements.apiKey.value.trim(),
    autoExtract: elements.autoExtract.checked,
    showFloatingButton: elements.showFloatingButton.checked,
    defaultTone: elements.defaultTone.value
  };

  // 验证URL
  try {
    new URL(settings.apiBaseUrl);
  } catch (error) {
    showSaveStatus('API地址格式不正确', 'error');
    return;
  }

  try {
    await chrome.storage.sync.set(settings);
    showSaveStatus('设置已保存！', 'success');
  } catch (error) {
    console.error('保存设置失败:', error);
    showSaveStatus('保存失败: ' + error.message, 'error');
  }
}

// 显示/隐藏API密钥
function toggleApiKeyVisibility() {
  if (elements.apiKey.type === 'password') {
    elements.apiKey.type = 'text';
    elements.toggleApiKey.textContent = '隐藏';
  } else {
    elements.apiKey.type = 'password';
    elements.toggleApiKey.textContent = '显示';
  }
}

// 测试连接
async function testConnection() {
  const apiBaseUrl = elements.apiBaseUrl.value.trim();
  const apiKey = elements.apiKey.value.trim();

  if (!apiBaseUrl) {
    updateConnectionStatus('请输入API地址', 'error');
    return;
  }

  elements.testConnection.disabled = true;
  updateConnectionStatus('测试中...', 'loading');

  try {
    const response = await fetch(`${apiBaseUrl}/health`, {
      method: 'GET',
      headers: apiKey ? { 'x-api-key': apiKey } : {}
    });

    if (response.ok) {
      const data = await response.json();
      if (data.ok) {
        updateConnectionStatus(`✓ 连接成功 (v${data.version})`, 'success');
      } else {
        updateConnectionStatus('服务器响应异常', 'error');
      }
    } else if (response.status === 401) {
      updateConnectionStatus('认证失败，请检查API密钥', 'error');
    } else {
      updateConnectionStatus(`连接失败 (${response.status})`, 'error');
    }
  } catch (error) {
    console.error('测试连接失败:', error);
    updateConnectionStatus('无法连接到服务器', 'error');
  } finally {
    elements.testConnection.disabled = false;
  }
}

// 更新连接状态
function updateConnectionStatus(message, type) {
  elements.connectionStatus.textContent = message;
  elements.connectionStatus.className = `status-badge ${type}`;
}

// 恢复默认设置
async function resetToDefaults() {
  if (!confirm('确定要恢复默认设置吗？')) {
    return;
  }

  const defaults = {
    apiBaseUrl: 'http://localhost:3000',
    apiKey: '',
    autoExtract: true,
    showFloatingButton: true,
    defaultTone: 'concise'
  };

  try {
    await chrome.storage.sync.set(defaults);
    
    elements.apiBaseUrl.value = defaults.apiBaseUrl;
    elements.apiKey.value = defaults.apiKey;
    elements.autoExtract.checked = defaults.autoExtract;
    elements.showFloatingButton.checked = defaults.showFloatingButton;
    elements.defaultTone.value = defaults.defaultTone;
    
    showSaveStatus('已恢复默认设置', 'success');
  } catch (error) {
    console.error('恢复默认设置失败:', error);
    showSaveStatus('恢复失败: ' + error.message, 'error');
  }
}

// 显示保存状态
function showSaveStatus(message, type) {
  elements.saveStatus.textContent = message;
  elements.saveStatus.className = `save-status ${type} show`;
  
  setTimeout(() => {
    elements.saveStatus.classList.remove('show');
  }, 3000);
}
