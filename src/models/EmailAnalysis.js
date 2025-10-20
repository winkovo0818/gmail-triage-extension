// src/models/EmailAnalysis.js
// 邮件分析记录数据模型
const mongoose = require('mongoose');

const emailAnalysisSchema = new mongoose.Schema({
  // 邮件信息
  emailId: {
    type: String,
    unique: true,
    sparse: true, // 允许多个null值
    index: true
  },
  subject: {
    type: String,
    maxlength: 500
  },
  from: {
    type: String,
    required: false,
    lowercase: true,
    trim: true,
    default: ''
  },
  to: {
    type: String,
    required: false,
    lowercase: true,
    trim: true,
    default: ''
  },
  bodyHash: {
    type: String,
    index: true // 用于快速查找重复邮件
  },
  
  // 分析结果
  summary: {
    type: String,
    required: true
  },
  actionItems: [{
    title: String,
    assignee: String,
    deadline: Date
  }],
  replySuggestions: [{
    label: String,
    draft: String
  }],
  
  // 元数据
  language: {
    type: String,
    default: 'en'
  },
  processingTime: {
    type: Number, // 毫秒
    min: 0
  },
  llmModel: {
    type: String
  },
  llmTokensUsed: {
    type: Number,
    min: 0
  },
  
  // 缓存和统计
  accessCount: {
    type: Number,
    default: 1,
    min: 0
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true, // 自动添加createdAt和updatedAt
  collection: 'email_analyses'
});

// 索引
emailAnalysisSchema.index({ from: 1, createdAt: -1 });
emailAnalysisSchema.index({ to: 1, createdAt: -1 });
emailAnalysisSchema.index({ createdAt: -1 });

// 实例方法：增加访问计数
emailAnalysisSchema.methods.incrementAccess = async function() {
  this.accessCount += 1;
  this.lastAccessedAt = new Date();
  return this.save();
};

// 静态方法：根据邮件内容哈希查找
emailAnalysisSchema.statics.findByBodyHash = function(hash) {
  return this.findOne({ bodyHash: hash });
};

// 静态方法：清理旧记录（超过30天）
emailAnalysisSchema.statics.cleanOldRecords = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const result = await this.deleteMany({
    createdAt: { $lt: cutoffDate }
  });
  
  return result.deletedCount;
};

// 虚拟字段：格式化的创建时间
emailAnalysisSchema.virtual('formattedCreatedAt').get(function() {
  return this.createdAt.toISOString();
});

// 转换为JSON时的配置
emailAnalysisSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

const EmailAnalysis = mongoose.model('EmailAnalysis', emailAnalysisSchema);

module.exports = EmailAnalysis;
