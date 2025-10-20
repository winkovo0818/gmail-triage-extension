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
- 🔒 **内容保护** - 邮件正文只读，确保分析真实内容
- 🎨 **多语气支持** - 简洁、正式、友好、专业、随意五种语气
- ⚡ **快速响应** - 内存缓存优化，响应时间<500ms
- 🛡️ **安全防护** - XSS防护、速率限制、IP黑名单

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
   - ⚠️ 邮件正文为只读，无法手动编辑（确保分析真实内容）
   - ✅ 主题可以编辑
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

如果自动提取失败或邮件内容显示不正确：
- 点击**"刷新"按钮**重新提取邮件内容
- 邮件正文会自动更新为最新内容
- ⚠️ 注意：正文为只读，只能通过刷新获取新内容

## 🔧 配置说明

### 后端环境变量 (.env)

```bash
# 必需配置
NODE_ENV=production                    # 运行环境：development/production
PORT=3000                              # 服务端口
LLM_API_BASE=https://api.deepseek.com/v1  # LLM API地址
LLM_API_KEY=sk-xxxxx                   # LLM API密钥（DeepSeek或OpenAI）
LLM_MODEL=deepseek-chat                # LLM模型名称

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

### Vercel部署（两种方式）

> 💡 **推荐使用方式2（Dashboard）**，更稳定且可以看到详细构建日志

---

### 方式1: 命令行部署（CLI）

#### 1. 初始部署

```bash
# 在项目根目录执行
cd d:\hds\project\email

# 安装Vercel CLI（如果还没安装）
npm i -g vercel

# 登录Vercel账号
vercel login
# 会打开浏览器进行授权

# 首次部署（测试环境）
vercel
# 按提示操作：
# - Set up and deploy? Y
# - Which scope? 选择你的账号
# - Link to existing project? N
# - What's your project's name? gmail-triage-extension
# - In which directory is your code located? ./
# - Want to override the settings? N

# 等待部署完成，会得到一个URL
# 例如：https://gmail-triage-extension-xxxx.vercel.app
```

#### 2. 配置环境变量

```bash
# 添加LLM API密钥（DeepSeek或OpenAI）
vercel env add LLM_API_KEY
# 选择环境：Production, Preview, Development (选择 Production)
# 输入你的密钥：sk-xxxxx

# 添加LLM API地址（如果使用DeepSeek）
vercel env add LLM_API_BASE
# 输入：https://api.deepseek.com/v1

# 添加LLM模型（可选）
vercel env add LLM_MODEL
# 输入：deepseek-chat

# 添加后端API密钥（可选）
vercel env add BACKEND_API_KEY
# 输入一个强密码：your-secure-password

# 添加其他环境变量
vercel env add NODE_ENV
# 输入：production

vercel env add CORS_ORIGIN
# 输入：chrome-extension://*
```

#### 3. 生产环境部署

```bash
# 部署到生产环境
vercel --prod

# 部署完成后会得到生产URL
# 例如：https://gmail-triage-extension.vercel.app
```

#### 4. 配置Chrome扩展

部署成功后，**推荐使用Options页面配置**（无需修改代码）：

```
1. 右键点击扩展图标 → 选择"选项"
2. 在"API服务器地址"中填写你的Vercel URL：
   https://gmail-triage-extension.vercel.app
3. 如果设置了BACKEND_API_KEY，也填写到"API密钥"框
4. 点击"测试连接"确保配置正确
5. 点击"保存设置"
6. 完成！✅
```

**优点**：
- ✅ 无需修改代码和重新打包
- ✅ 可以随时切换不同的后端地址
- ✅ 支持本地开发和生产环境切换

> 💡 **更多配置方式**：查看 [DEPLOYMENT_CONFIG.md](./DEPLOYMENT_CONFIG.md)
> - 方式1：Options页面配置（推荐）
> - 方式2：修改默认配置
> - 方式3：创建配置文件

---

#### 4备选. 修改默认配置（可选）

如果你想让扩展默认使用Vercel地址，可以修改代码：

**编辑 `chrome-extension/popup/popup.js`**：
```javascript
// 第11行，修改默认URL
let API_BASE_URL = 'https://gmail-triage-extension.vercel.app';
```

然后重新打包和安装：

```powershell
# Windows PowerShell
cd chrome-extension
Compress-Archive -Path * -DestinationPath ../mail-assistant-v1.0.1.zip -Force
```

重新加载扩展：
```
1. chrome://extensions/ → 刷新扩展
2. 或删除后重新安装
```

---

### 方式2: 网页部署（Dashboard）✨ 推荐

**优点**：
- ✅ 更稳定，不会卡住
- ✅ 可视化界面，易于操作
- ✅ 可以看到详细构建日志
- ✅ 自动部署（连接GitHub后）

#### 步骤1: 准备代码

```bash
# 1. 确保有vercel.json配置文件（项目根目录）
# 如果没有，创建一个：
```

**创建 `vercel.json`**：
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

```bash
# 2. 提交到GitHub
git add .
git commit -m "chore: 添加Vercel配置"
git push origin main
```

#### 步骤2: 在Vercel Dashboard部署

1. **访问Vercel控制台**
   ```
   https://vercel.com/dashboard
   ```

2. **创建新项目**
   - 点击 "Add New..." → "Project"
   - 或点击 "New Project" 按钮

3. **导入GitHub仓库**
   - 点击 "Import Git Repository"
   - 如果是第一次，需要连接GitHub账号
   - 找到 `winkovo0818/gmail-triage-extension` 仓库
   - 点击 "Import"

4. **配置项目**
   ```
   Project Name: gmail-triage-extension
   Framework Preset: Other
   Root Directory: ./
   Build Command: (留空)
   Output Directory: (留空)  
   Install Command: npm install
   ```

5. **添加环境变量**
   
   点击 "Environment Variables"，添加以下变量：
   
   | 变量名 | 值 | 说明 |
   |--------|-----|------|
   | `NODE_ENV` | `production` | 运行环境 |
   | `LLM_API_KEY` | `sk-xxxxx` | 你的LLM API密钥 |
   | `LLM_API_BASE` | `https://api.deepseek.com/v1` | API地址 |
   | `LLM_MODEL` | `deepseek-chat` | 模型名称 |
   | `CORS_ORIGIN` | `chrome-extension://*` | CORS设置 |
   | `BACKEND_API_KEY` | `your-secret-key` | 后端密钥（可选） |

   每个变量都选择 **Production** 环境。

6. **开始部署**
   - 点击 "Deploy" 按钮
   - 等待构建完成（通常1-3分钟）
   - 部署成功后会显示 ✅ 和访问链接

7. **获取部署URL**
   ```
   示例：https://gmail-triage-extension.vercel.app
   ```

#### 步骤3: 配置Chrome扩展

部署成功后，按照前面的"4. 配置Chrome扩展"步骤配置即可。

#### 步骤4: 启用自动部署（推荐）

部署成功后，Vercel会自动监听GitHub仓库：
- ✅ 每次push到main分支 → 自动部署
- ✅ 创建Pull Request → 自动生成预览环境
- ✅ 可以在Dashboard查看所有部署历史

**验证自动部署**：
```bash
# 修改代码
git add .
git commit -m "test: 测试自动部署"
git push origin main

# 几秒后，Vercel会自动开始部署
# 可以在Dashboard看到新的部署记录
```

---

### 📊 Vercel管理

#### 查看部署状态
```bash
# 查看所有部署
vercel ls

# 查看项目信息
vercel inspect

# 查看日志
vercel logs
# 或在 Vercel Dashboard: https://vercel.com/dashboard
```

#### 更新代码后重新部署
```bash
# 1. 提交代码
git add .
git commit -m "Update features"
git push origin main

# 2. 重新部署
vercel --prod

# 3. 自动部署（推荐）
# 在 Vercel Dashboard 连接 GitHub 仓库
# 每次 push 到 main 分支自动部署
```

#### 查看和修改环境变量
```bash
# 查看所有环境变量
vercel env ls

# 删除环境变量
vercel env rm VARIABLE_NAME

# 拉取环境变量到本地（用于本地开发）
vercel env pull
```

---

### 🔍 验证部署

部署完成后，测试以下端点：

```bash
# 1. 健康检查
curl https://your-project.vercel.app/health

# 应返回：
# {"ok":true,"ts":1697798400000,"version":"0.2.0","uptime":3600.5}

# 2. API文档
# 访问：https://your-project.vercel.app/api-docs

# 3. 测试分析接口（需要API密钥）
curl -X POST https://your-project.vercel.app/analyze \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-backend-api-key" \
  -d '{
    "subject": "测试",
    "body": "这是一封测试邮件",
    "language": "zh"
  }'
```

---

### ⚠️ 常见问题

#### Q: CLI部署一直卡在 "Queued" 状态？
**A**: 这是Vercel服务器负载高或网络问题导致的。

**解决方法**：
1. **按 Ctrl+C 取消**，然后重试：
   ```bash
   vercel --prod
   ```

2. **改用Dashboard部署（推荐）**：
   - 参考上面的"方式2: 网页部署"
   - 更稳定且可以看到详细日志

3. **清理缓存重试**：
   ```bash
   vercel remove gmail-triage-extension --yes
   vercel --prod
   ```

4. **检查Vercel服务状态**：
   - 访问 https://www.vercel-status.com/
   - 如果服务异常，等待恢复后再部署

#### Q: 部署后扩展无法连接？
**A**: 检查以下几点：
1. ✅ Vercel URL是否正确（https://开头）
2. ✅ `popup.js` 中的 `API_BASE_URL` 是否已更新
3. ✅ 扩展是否重新加载
4. ✅ CORS环境变量是否设置为 `chrome-extension://*`

#### Q: API返回401错误？
**A**: 
1. 检查是否设置了 `BACKEND_API_KEY` 环境变量
2. 如果设置了，在扩展的Options页面填写相同的密钥

#### Q: 部署后如何查看错误日志？
**A**: 
```bash
# 命令行查看
vercel logs

# 或访问 Vercel Dashboard
# https://vercel.com/你的用户名/gmail-triage-extension
# 点击 "Logs" 标签
```

#### Q: 免费版Vercel有什么限制？
**A**: 
- ✅ 每月100GB带宽
- ✅ 每月100GB-hours执行时间
- ✅ 无限部署次数
- ⚠️ 函数执行时间限制10秒
- ⚠️ 无服务器函数大小限制50MB

---

### 🎯 最佳实践

1. **使用环境变量** - 不要在代码中硬编码密钥
2. **启用自动部署** - 连接GitHub自动部署
3. **监控日志** - 定期查看Vercel Dashboard
4. **设置告警** - 在Vercel中配置部署失败通知
5. **使用自定义域名** - 更专业的访问地址

---

详细部署指南和其他平台部署方式请查看：[DEPLOYMENT.md](./DEPLOYMENT.md)

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

### 多层安全防护

```
请求 → IP黑名单 → 速率限制 → XSS检测 → 长度验证 → API密钥 → 业务处理
```

### 安全特性

- ✅ **内容保护** - 邮件正文只读，防止篡改真实内容
- ✅ **XSS防护** - 注入攻击检测和拦截（脚本、事件处理器等）
- ✅ **速率限制** - 防止API盗刷（10次/分钟/IP）
- ✅ **IP黑名单** - 自动滥用检测（50次/小时）和自动拉黑
- ✅ **API密钥** - 访问权限控制（可选启用）
- ✅ **输入验证** - 严格的Joi Schema验证
- ✅ **请求限制** - 最大512KB请求体，防止攻击
- ✅ **HTTPS通信** - 加密传输保护
- ✅ **Helmet** - 安全响应头（CSP、XSS等）

### 设计原则

1. **内容真实性** - 正文只读，确保分析的是邮箱中的真实内容
2. **分层防护** - 多层安全检查，逐级过滤恶意请求
3. **自动响应** - 滥用检测和自动拉黑，无需人工干预
4. **最小权限** - API密钥可选，支持灵活的访问控制

> 📖 详细安全说明请查看：[SECURITY.md](./SECURITY.md) 和 [SECURITY_UPDATE.md](./SECURITY_UPDATE.md)

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📝 版本历史

### v1.0.1 (2025-10-20) - 安全增强
- 🔒 **新增** 邮件正文只读保护
- ❌ **移除** 违禁词检测（避免误杀）
- ✅ **保留** XSS防护、速率限制、IP黑名单
- 🎨 **优化** 用户界面提示

### v1.0.0 (2025-10-20) - 首次发布
- ✨ 163邮箱自动提取
- 🤖 AI邮件分析和摘要
- ✍️ AI回复草稿生成
- 🛡️ 完整安全防护体系
- 🎨 Chrome扩展完整功能
- ⚡ 轻量化部署（无数据库）

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
