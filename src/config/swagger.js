// src/config/swagger.js
// Swagger/OpenAPI 文档配置
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mail Assistant Backend API',
      version: '0.2.0',
      description: '邮件智能分类助手后端API文档',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: '开发服务器'
      },
      {
        url: 'https://api.example.com',
        description: '生产服务器'
      }
    ],
    components: {
      schemas: {
        EmailAnalysisRequest: {
          type: 'object',
          required: ['from', 'to', 'body'],
          properties: {
            subject: {
              type: 'string',
              description: '邮件主题',
              example: 'Project Update Meeting'
            },
            from: {
              type: 'string',
              format: 'email',
              description: '发件人邮箱',
              example: 'sender@example.com'
            },
            to: {
              type: 'string',
              format: 'email',
              description: '收件人邮箱',
              example: 'recipient@example.com'
            },
            body: {
              type: 'string',
              description: '邮件正文内容',
              example: 'Hi team, let\'s schedule a meeting to discuss the project progress...'
            },
            language: {
              type: 'string',
              description: '邮件语言',
              example: 'en',
              default: 'en'
            }
          }
        },
        EmailAnalysisResponse: {
          type: 'object',
          properties: {
            summary: {
              type: 'string',
              description: '邮件摘要',
              example: 'Meeting request to discuss project progress'
            },
            action_items: {
              type: 'array',
              description: '待办事项列表',
              items: {
                type: 'object',
                properties: {
                  title: {
                    type: 'string',
                    example: 'Schedule meeting'
                  },
                  assignee: {
                    type: 'string',
                    example: 'John Doe'
                  },
                  deadline: {
                    type: 'string',
                    example: '2025-10-25'
                  }
                }
              }
            },
            reply_suggestions: {
              type: 'array',
              description: '回复建议列表',
              items: {
                type: 'object',
                properties: {
                  label: {
                    type: 'string',
                    example: 'Accept'
                  },
                  draft: {
                    type: 'string',
                    example: 'Thank you for the update. I\'m available for a meeting next week.'
                  }
                }
              }
            }
          }
        },
        DraftReplyRequest: {
          type: 'object',
          required: ['email', 'intent'],
          properties: {
            email: {
              type: 'object',
              required: ['from', 'to', 'body'],
              properties: {
                subject: {
                  type: 'string',
                  example: 'Project Update'
                },
                from: {
                  type: 'string',
                  format: 'email',
                  example: 'sender@example.com'
                },
                to: {
                  type: 'string',
                  format: 'email',
                  example: 'recipient@example.com'
                },
                body: {
                  type: 'string',
                  example: 'Original email content...'
                },
                language: {
                  type: 'string',
                  example: 'en'
                }
              }
            },
            intent: {
              type: 'string',
              description: '回复意图',
              example: 'Accept the meeting invitation and suggest alternative time'
            },
            tone: {
              type: 'string',
              enum: ['concise', 'formal', 'friendly', 'professional', 'casual'],
              description: '回复语气',
              default: 'concise'
            },
            max_chars: {
              type: 'integer',
              description: '最大字符数',
              minimum: 100,
              maximum: 5000,
              default: 800
            }
          }
        },
        DraftReplyResponse: {
          type: 'object',
          properties: {
            draft: {
              type: 'string',
              description: '生成的回复草稿',
              example: 'Thank you for reaching out. I would be happy to discuss this further...'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error'
            },
            message: {
              type: 'string',
              example: 'Error message description'
            }
          }
        }
      },
      responses: {
        BadRequest: {
          description: '请求参数错误',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        Unauthorized: {
          description: '未授权访问',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        TooManyRequests: {
          description: '请求过于频繁',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        InternalServerError: {
          description: '服务器内部错误',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/server.js'] // 扫描包含注释的文件
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec
};
