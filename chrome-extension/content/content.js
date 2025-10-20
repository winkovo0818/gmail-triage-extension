/**
 * 邮件智能助手 - Content Script
 * 
 * @author 云淡风轻
 * @license MIT
 * @version 1.0.0
 * @copyright 2025 云淡风轻
 */

// 清理邮箱地址格式
function cleanEmailAddress(text) {
  if (!text) return '';
  const trimmed = String(text).trim();
  // 识别"我"、"me"、"myself"等关键词为空值（表示收件人是自己）
  const selfKeywords = ['我', 'me', 'myself', '自己', 'self'];
  if (selfKeywords.includes(trimmed.toLowerCase())) return '';
  // 提取邮箱地址，去除尖括号、引号等
  const emailMatch = trimmed.match(/[^\s<>"]+@[^\s<>"]+\.[^\s<>"]+/);
  if (emailMatch) return emailMatch[0].trim();
  // 否则返回原文本（交由后续逻辑判断）
  return trimmed;
}

// 清理文本内容，去除HTML标签和样式
function cleanTextContent(element) {
  if (!element) return '';
  
  // 克隆元素避免修改原DOM
  const clone = element.cloneNode(true);
  
  // 移除script、style、svg等非文本元素
  const unwantedElements = clone.querySelectorAll('script, style, svg, img, video, audio');
  unwantedElements.forEach(el => el.remove());
  
  // 获取纯文本
  let text = clone.textContent || clone.innerText || '';
  
  // 清理多余空白
  text = text
    .replace(/\s+/g, ' ')  // 多个空白字符替换为单个空格
    .replace(/\n\s*\n/g, '\n')  // 多个换行替换为单个换行
    .trim();
  
  return text;
}

// 工具：判断元素是否可见（供iframe筛选使用）
function isVisible(el) {
  try {
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  } catch (_) {
    return false;
  }
}

// 顶层缓存与自动监听
let cachedEmailData = null;
let lastCacheTS = 0;
let updateTimerId = null;
const observedDocs = new WeakSet();

function scheduleCacheUpdate(delay = 300) {
  if (updateTimerId) clearTimeout(updateTimerId);
  updateTimerId = setTimeout(async () => {
    try {
      const data = await extractEmailData(true);
      if (data && (data.body || data.subject || data.from)) {
        cachedEmailData = data;
        lastCacheTS = Date.now();
      }
    } catch (e) {
      console.warn('自动缓存更新失败', e);
    }
  }, delay);
}

function attachObserverToDoc(doc) {
  try {
    if (!doc || !doc.body || observedDocs.has(doc)) return;
    const obs = new MutationObserver(() => scheduleCacheUpdate(300));
    obs.observe(doc.body, { childList: true, subtree: true, characterData: true });
    observedDocs.add(doc);
  } catch (_) {}
}

function scanAndObserveFrames() {
  const iframes = Array.from(document.querySelectorAll('iframe'));
  for (const f of iframes) {
    try {
      const doc = f.contentDocument || f.contentWindow?.document;
      if (doc) attachObserverToDoc(doc);
    } catch (_) {}
  }
}

// 监听来自popup的消息（支持异步）
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  if (request.action === 'extractEmail') {
    // 只在顶层frame处理，避免子frame返回空数据覆盖结果
    if (window.self !== window.top) {
      return false;
    }
    (async () => {
      // 优先返回近期缓存（2s内），除非force
      if (!request.force && cachedEmailData && Date.now() - lastCacheTS < 2000) {
        sendResponse({ success: true, data: cachedEmailData });
        return;
      }

      const emailData = await extractEmailData(!!request.force);
      sendResponse({ success: true, data: emailData });
    })();
    return true; // 异步响应
  }
  return false;
});

// 提取邮件数据
async function extractEmailData(force = false) {
  const url = window.location.href;
  
  if (url.includes('mail.google.com')) {
    return extractGmailData();
  } else if (url.includes('outlook.live.com') || url.includes('outlook.office.com')) {
    return extractOutlookData();
  } else if (url.includes('mail.163.com')) {
    return await extract163Data(force);
  }
  
  return {
    from: '',
    to: '',
    subject: '',
    body: ''
  };
}

// 初始挂载：扫描并监听 iframe 变化
if (window.self === window.top) {
  scanAndObserveFrames();
  // 定时补扫，防止首次未命中
  setInterval(scanAndObserveFrames, 1500);
}

// 提取Gmail邮件数据
function extractGmailData() {
  try {
    // Gmail的DOM结构可能会变化，这里提供基本选择器
    const emailData = {
      from: '',
      to: '',
      subject: '',
      body: ''
    };

    // 提取主题
    const subjectElement = document.querySelector('h2.hP');
    if (subjectElement) {
      emailData.subject = subjectElement.textContent.trim();
    }

    // 提取发件人
    const fromElement = document.querySelector('span.go');
    if (fromElement) {
      emailData.from = cleanEmailAddress(fromElement.textContent);
    }

    // 提取收件人
    const toElement = document.querySelector('span.g2');
    if (toElement) {
      emailData.to = cleanEmailAddress(toElement.textContent);
    }

    // 提取邮件正文
    const bodyElement = document.querySelector('div.a3s.aiL');
    if (bodyElement) {
      emailData.body = cleanTextContent(bodyElement);
    }

    return emailData;
  } catch (error) {
    console.error('提取Gmail数据失败:', error);
    return { from: '', to: '', subject: '', body: '' };
  }
}

// 提取Outlook邮件数据
function extractOutlookData() {
  try {
    const emailData = {
      from: '',
      to: '',
      subject: '',
      body: ''
    };

    // 提取主题
    const subjectElement = document.querySelector('[role="heading"]');
    if (subjectElement) {
      emailData.subject = subjectElement.textContent.trim();
    }

    // 提取发件人
    const fromElement = document.querySelector('[aria-label*="发件人"]');
    if (fromElement) {
      emailData.from = cleanEmailAddress(fromElement.textContent);
    }

    // 提取邮件正文
    const bodyElement = document.querySelector('[role="document"]');
    if (bodyElement) {
      emailData.body = cleanTextContent(bodyElement);
    }

    return emailData;
  } catch (error) {
    console.error('提取Outlook数据失败:', error);
    return { from: '', to: '', subject: '', body: '' };
  }
}

// 提取163邮箱数据（异步，支持force重试）
async function extract163Data(force = false) {
  try {
    const emailData = { from: '', to: '', subject: '', body: '' };

    // 单次尝试：从主文档取主题/发件人；从所有可访问iframe中选择正文
    const attemptOnce = () => {
      // 主题（主文档）
      const subjectSelectors = ['.subject','[class*="subject"]','.nui-subject','.gWel-title','h2','h3'];
      for (const s of subjectSelectors) {
        const el = document.querySelector(s);
        if (el && el.textContent?.trim() && el.textContent.trim().length < 200) {
          emailData.subject = el.textContent.trim();
          break;
        }
      }

      // 发件人（主文档）
      const fromSelectors = ['.nui-addr-email','.from','[class*="from"]','.nui-from','[data-from]','.sender'];
      for (const s of fromSelectors) {
        const el = document.querySelector(s);
        if (el && el.textContent?.trim()) {
          emailData.from = cleanEmailAddress(el.textContent);
          break;
        }
      }

      // 正文（扫描所有可访问的iframe，取文本最长者）
      const iframes = Array.from(document.querySelectorAll('iframe')).filter(isVisible);
      let bestText = '';
      for (const f of iframes) {
        let doc = null;
        try {
          doc = f.contentDocument || f.contentWindow?.document || null;
        } catch (_) {
          doc = null;
        }
        if (!doc) continue;
        const bodySelectors = ['.netease_mail_readhtml','.public-DraftEditor-content','[class*="mail_readhtml"]','.body','[class*="mailContent"]','.mail-body','.nui-mailBody','.content','#contentDiv'];
        for (const s of bodySelectors) {
          const el = doc.querySelector(s);
          if (!el) continue;
          const txt = cleanTextContent(el);
          if (txt && txt.length > bestText.length && txt.length > 60) {
            bestText = txt;
          }
        }
      }
      if (bestText) {
        emailData.body = bestText;
      }
    };

    // 重试（force时 6 次 ≈ 1.8s）
    const maxAttempts = force ? 10 : 1;
    for (let i = 0; i < maxAttempts; i++) {
      attemptOnce();
      if (emailData.body || emailData.subject || emailData.from) break;
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, 300));
    }

    return emailData;
  } catch (error) {
    console.error('提取163邮箱数据失败:', error);
    return { from: '', to: '', subject: '', body: '' };
  }
}

// 添加浮动按钮到邮件页面（可选功能）
function addFloatingButton() {
  // 检查按钮是否已存在
  if (document.getElementById('mail-assistant-btn')) {
    return;
  }

  const button = document.createElement('button');
  button.id = 'mail-assistant-btn';
  button.className = 'mail-assistant-floating-btn';
  button.innerHTML = '📧 智能分析';
  button.title = '使用邮件智能助手分析当前邮件';
  
  button.addEventListener('click', async () => {
    const emailData = extractEmailData();
    
    // 发送消息到后台脚本进行分析
    chrome.runtime.sendMessage({
      action: 'analyzeEmail',
      data: emailData
    }, (response) => {
      if (response.success) {
        showNotification('分析完成！请查看扩展弹出窗口。', 'success');
      } else {
        showNotification('分析失败: ' + response.error, 'error');
      }
    });
  });

  document.body.appendChild(button);
}

// 显示通知
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `mail-assistant-notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// 浮动按钮功能已禁用，使用popup代替
// 如需启用，取消下面的注释
// if (document.readyState === 'loading') {
//   document.addEventListener('DOMContentLoaded', addFloatingButton);
// } else {
//   addFloatingButton();
// }
