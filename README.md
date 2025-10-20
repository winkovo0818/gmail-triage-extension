# 📧 邮件智能助手 (Mail Assistant)

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/winkovo0818/gmail-triage-extension)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Chrome](https://img.shields.io/badge/Chrome-Extension-orange.svg)](https://www.google.com/chrome/)

一个基于AI的智能邮件助手，支持自动提取邮件内容、生成摘要、识别待办事项和智能回复建议。

## ✨ 核心功能

- 🤖 **AI智能分析** - 自动生成邮件摘要和关键信息提取
- ✅ **待办事项识别** - 智能识别任务、负责人和截止日期
- 💡 **回复建议** - 提供多种回复选项和模板
- ✍️ **智能草稿生成** - 根据意图自动生成回复草稿
- 📥 **自动内容提取** - 支持163邮箱自动提取邮件内容
- 🎨 **多语气支持** - 简洁、正式、友好、专业、随意五种语气
- ⚡ **快速响应** - 内存缓存优化，响应时间<500ms

## 🏗️ 架构

```
┌─────────────────────────────────────────────────────┐
│                Chrome扩展 (前端)                      │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐        │
│  │  Popup   │  │ Options  │  │  Content   │        │
│  │  界面    │  │  设置页  │  │  脚本      │        │
│  └──────────┘  └──────────┘  └────────────┘        │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS/REST API
┌────────────────────▼────────────────────────────────┐
│              Node.js后端服务                         │
│  ┌──────────────────────────────────────────┐      │
│  │  Express API Server                      │      │
│  │  ├─ /analyze     - 邮件分析             │      │
│  │  ├─ /draft_reply - 草稿生成             │      │
│  │  └─ /health      - 健康检查             │      │
│  └──────────────────────────────────────────┘      │
│  ┌────────────┐  ┌──────────┐  ┌──────────┐       │
│  │ LLM适配器  │  │ 数据验证 │  │ 速率限制 │       │
│  └────────────┘  └──────────┘  └──────────┘       │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│   外部服务                                           │
│   └─ DeepSeek API (LLM)                             │
└─────────────────────────────────────────────────────┘
```

## 🚀 快速开始

### 环境要求

- Node.js >= 16.x
- Chrome 浏览器 >= 88.x
- DeepSeek API Key（或其他OpenAI兼容的API）

### 安装步骤

#### 1. 后端服务部署

```bash
# 克隆项目
git clone https://github.com/winkovo0818/gmail-triage-extension.git
cd gmail-triage-extension

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑.env文件，填写：
# LLM_API_KEY=你的DeepSeek-API-Key
# BACKEND_API_KEY=自定义的后端密钥（可选）

# 启动服务
npm start

# 或开发模式（自动重启）
npm run dev
```

服务将运行在 `http://localhost:3000`

#### 2. Chrome扩展安装

```bash
# 方法1：开发者模式安装（推荐测试）
1. 打开 Chrome 浏览器
2. 访问 chrome://extensions/
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目中的 chrome-extension 文件夹

# 方法2：打包安装
npm run build
# 将生成的 dist/mail-assistant-v1.0.0.zip 安装到Chrome
```

#### 3. 配置扩展

1. 右键扩展图标 → "选项"
2. 填写API服务器地址：`http://localhost:3000`（或你的服务器地址）
3. 填写API密钥（如果后端配置了）
4. 点击"测试连接"确保配置正确
5. 保存设置

## 📖 使用指南

### 基础使用

1. **打开163邮箱** → https://mail.163.com
2. **点击邮件** 进入阅读界面
3. **点击扩展图标** 自动提取邮件内容
4. **点击"分析邮件"** 查看AI分析结果：
   - 📝 邮件摘要
   - ✅ 待办事项清单
   - 💡 回复建议

### 生成回复草稿

1. 在分析结果下方填写**回复意图**
   - 例如："同意并确认时间"、"礼貌拒绝"
2. 选择**语气风格**（简洁/正式/友好/专业/随意）
3. 点击**"生成回复草稿"**
4. 点击**"复制草稿"**一键复制到剪贴板

### 刷新功能

如果自动提取失败或需要更新：
- 点击**"刷新"按钮**重新提取邮件内容

## 🔧 配置说明

### 后端环境变量 (.env)

```bash
# 必需配置
NODE_ENV=production                    # 运行环境：development/production
PORT=3000                              # 服务端口
LLM_PROVIDER=deepseek                  # LLM提供商：openai/deepseek
DEEPSEEK_API_KEY=sk-xxxxx              # DeepSeek API密钥

# 可选配置
BACKEND_API_KEY=your-secret-key        # 后端API密钥（建议生产环境启用）
CORS_ORIGIN=*                          # CORS允许的源
CACHE_TTL=3600                         # 缓存时间（秒）
LOG_LEVEL=info                         # 日志级别：debug/info/warn/error
```

### 扩展配置选项

在扩展的"选项"页面可配置：

- **API服务器地址** - 后端服务地址
- **API密钥** - 后端认证密钥（可选）
- **自动提取邮件** - 打开扩展时自动提取
- **显示浮动按钮** - 在邮件页面显示快捷按钮（待启用）
- **默认回复语气** - 生成草稿的默认语气

## 📁 项目结构

```
mail-assistant/
├── src/                          # 后端源代码
│   ├── routes/                   # API路由
│   │   ├── analyze.js           # 邮件分析端点
│   │   └── draft.js             # 草稿生成端点
│   ├── llm/                      # LLM适配器
│   │   └── llmAdapter.js        # 统一LLM接口
│   ├── middleware/               # 中间件
│   │   ├── rateLimiter.js       # 速率限制
│   │   ├── validator.js         # 输入验证
│   │   └── errorHandler.js      # 错误处理
│   ├── config/                   # 配置文件
│   │   ├── swagger.js           # API文档
│   │   └── index.js             # 主配置
│   ├── utils/                    # 工具函数
│   │   └── enhancedLogger.js    # 日志系统
│   └── server.js                 # 服务器入口
├── chrome-extension/             # Chrome扩展
│   ├── manifest.json            # 扩展清单
│   ├── popup/                   # 弹窗界面
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── popup.css
│   ├── options/                 # 设置页面
│   │   ├── options.html
│   │   ├── options.js
│   │   └── options.css
│   ├── content/                 # 内容脚本
│   │   └── content.js           # 邮件提取逻辑
│   ├── background/              # 后台脚本
│   │   └── background.js
│   └── icons/                   # 图标资源
├── scripts/                      # 构建脚本
│   └── build.ps1                # 打包脚本
├── .env.example                 # 环境变量模板
├── package.json                 # 依赖配置
├── DEPLOYMENT.md                # 部署指南
├── FEATURES.md                  # 功能清单
├── TODO.md                      # 待办事项
└── README.md                    # 本文件
```

## 🔌 API文档

启动服务后访问：http://localhost:3000/api-docs

### POST /analyze

分析邮件内容，生成摘要和建议。

**请求**:
```json
{
  "subject": "项目进度汇报",
  "body": "各位好，本周项目进展如下...",
  "language": "zh"
}
```

**响应**:
```json
{
  "summary": "本周项目进展顺利...",
  "action_items": [
    {
      "title": "提交测试报告",
      "assignee": "张三",
      "deadline": "2025-10-25"
    }
  ],
  "reply_suggestions": [
    {
      "label": "确认收到",
      "draft": "收到，感谢更新..."
    }
  ]
}
```

### POST /draft_reply

生成回复草稿。

**请求**:
```json
{
  "email": {
    "subject": "会议邀请",
    "body": "下周三下午2点..."
  },
  "intent": "同意参加",
  "tone": "professional",
  "max_chars": 800
}
```

**响应**:
```json
{
  "draft": "感谢邀请。我确认下周三下午2点可以参加会议..."
}
```

## 🧪 测试

```bash
# 运行单元测试（待实现）
npm test

# 运行集成测试
npm run test:integration

# 测试覆盖率
npm run test:coverage
```

## 🚢 部署

### Vercel部署（推荐）

```bash
# 安装Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel

# 设置环境变量
vercel env add DEEPSEEK_API_KEY
vercel env add BACKEND_API_KEY

# 生产部署
vercel --prod
```

详细部署指南请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📊 性能

- **响应时间**: 
  - 自动提取：<500ms（缓存命中）
  - 邮件分析：2-5秒（取决于LLM）
  - 草稿生成：2-4秒

- **并发支持**: 
  - 速率限制：100次/15分钟（通用）
  - LLM限制：10次/分钟

- **缓存策略**:
  - 内存缓存：TTL 3600秒
  - 相同邮件避免重复分析
  - 无需数据库，轻量化部署

## 🛡️ 安全

- ✅ HTTPS通信
- ✅ API密钥加密存储
- ✅ 请求速率限制
- ✅ 输入验证和过滤
- ✅ SQL注入防护
- ✅ XSS防护（Helmet）

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📝 版本历史

### v1.0.0 (2025-10-20)
- ✨ 首次发布
- ✅ 163邮箱自动提取
- ✅ AI邮件分析
- ✅ AI回复草稿生成
- ✅ 完整后端API
- ✅ Chrome扩展

查看完整更新日志：[CHANGELOG.md](./CHANGELOG.md)

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](./LICENSE) 文件了解详情。

## 👤 作者

**云淡风轻**

- 项目主页: [GitHub](https://github.com/winkovo0818/gmail-triage-extension)
- 问题反馈: [Issues](https://github.com/winkovo0818/gmail-triage-extension/issues)

## 🙏 致谢

- [DeepSeek](https://www.deepseek.com/) - 提供强大的AI能力
- [Express](https://expressjs.com/) - Web框架
- 所有贡献者和使用者

## ⭐ Star History

如果这个项目对你有帮助，请给个Star⭐️支持一下！

---

**Built with ❤️ by 云淡风轻**
