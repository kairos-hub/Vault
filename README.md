# Vault — 账号密码管理系统

一个小而美的自托管账号密码管理系统，支持多用户、多产品分类、自定义字段、AES 加密存储。

![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![MySQL](https://img.shields.io/badge/mysql-%3E%3D8.0-orange)

## 功能特性

### 核心功能
- **多产品分类管理** — 服务器、数据库、网站账号、API 密钥等，支持自定义图标和颜色
- **自定义列字段** — 支持文本、密码、下拉选择、链接、邮箱、数字、多行文本 7 种类型
- **AES 加密存储** — 敏感字段加密存储，仅在需要时解密，页面不留明文
- **密码显隐 & 一键复制** — 支持 HTTP 和 HTTPS 环境

### 记录管理
- **全列搜索** — 搜索标题、IP、账号等所有非敏感字段
- **分页 & 每页条数** — 支持 10 / 20 / 50 / 100 条每页，下拉选择，自动记忆
- **行选择 & 批量操作** — 勾选多条记录，批量删除或选择性导出
- **导入 / 导出** — CSV 格式，导入为纯新增不覆盖历史，导出支持全部或选中记录
- **导出按列顺序** — 导出 CSV 与页面当前列顺序一致

### 列设置
- **显示 / 隐藏列** — 可隐藏任意列（含标题列），按产品独立保存，刷新后保留
- **拖拽排序** — 列设置面板和表头均支持拖拽调整列顺序
- **Tooltip** — 鼠标悬停在被截断的内容上显示完整信息

### 用户系统
- **多用户支持** — JWT 认证，支持自行注册和管理员创建
- **注册开关** — 管理员可关闭公开注册，由管理员统一创建账号
- **新用户初始化** — 注册后自动分配服务器管理、数据库账号、网站账号、API 密钥四个默认产品

### 管理员功能
- **用户管理** — 查看所有用户、新建用户、禁用/启用、重置密码、删除、切换管理员权限
- **限流管理** — 查看登录失败限流记录（IP、账号、时间），支持解除限制和删除记录
- **系统设置** — 控制注册开关、配置 API 限流和登录失败限流策略（实时生效）

### 安全特性
- **IP 维度限流** — 登录失败按 IP 限流，不影响其他正常用户；管理员账号不受限
- **动态限流配置** — 阈值、窗口期在管理后台实时调整，30 秒内生效，无需重启
- **bcrypt 密码哈希** — 用户密码 bcrypt + salt 存储
- **账号禁用拦截** — 被禁用账号登录时直接拒绝并提示

### 界面
- **深色 / 浅色主题** — 侧边栏底部一键切换，自动记忆
- **SVG 网站图标** — 浏览器标签页显示盾牌图标
- **现代化 UI** — 基于 Tailwind CSS，深色主题为默认

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + Vite |
| 前端样式 | Tailwind CSS |
| 状态管理 | Zustand |
| HTTP 客户端 | Axios |
| 后端框架 | Node.js + Express |
| 数据库 | MySQL 8.0+ |
| 认证 | JWT |
| 加密 | AES (CryptoJS) + bcrypt |
| 限流 | 自定义 MySQL Store（持久化，支持管理查询） |

---

## 快速部署

### 环境要求

- Node.js >= 18
- MySQL >= 8.0
- npm >= 9

### 1. 初始化数据库

```bash
mysql -u root -p < database.sql
```

执行后创建 `vault_db` 数据库，包含所有表结构和初始配置数据。


```

### 2. 配置后端

```bash
cd backend
npm install
cp .env.example .env
```

编辑 `.env`：

```env
# 数据库
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=vault_db

# JWT 密钥（生产环境使用随机长字符串）
JWT_SECRET=your_super_secret_jwt_key

# AES 加密密钥（必须 32 位，生产环境必须修改，修改后旧数据无法解密）
ENCRYPT_KEY=your_32_char_encryption_key_here

# 服务端口
PORT=3001

# 前端地址（CORS）
FRONTEND_URL=http://localhost:5173
```

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 3. 配置前端

```bash
cd frontend
npm install
npm run dev
```

访问 `http://localhost:5173`

### 4. 创建管理员

注册第一个账号后，执行 SQL 将其设为管理员：

```sql
UPDATE users SET is_admin = 1 WHERE username = 'your_username';
```

之后可通过管理后台管理其他用户，无需再手动改数据库。

---

## 生产部署

### 前端构建

```bash
cd frontend && npm run build
# 产物在 frontend/dist/
```

### Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/vault/frontend/dist;
    index index.html;

    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### PM2 管理后端

```bash
npm install -g pm2
cd backend
pm2 start server.js --name vault
pm2 save && pm2 startup
```

---

## 项目结构

```
vault/
├── database.sql                    # 数据库建表 + 初始数据
├── backend/
│   ├── server.js                   # Express 入口，IP 限流中间件
│   ├── .env.example                # 环境变量模板
│   ├── config/
│   │   ├── database.js             # MySQL 连接池
│   │   ├── crypto.js               # AES 加解密
│   │   ├── defaultProducts.js      # 新用户默认产品初始化
│   │   ├── rateLimitConfig.js      # 限流配置缓存（30s TTL）
│   │   └── rateLimitStore.js       # MySQL 限流 Store
│   ├── middleware/
│   │   ├── auth.js                 # JWT 验证
│   │   └── admin.js                # 管理员权限校验
│   └── routes/
│       ├── auth.js                 # 登录 / 注册（含登录失败限流）
│       ├── products.js             # 产品 CRUD + 列定义（增量更新）
│       ├── records.js              # 记录 CRUD + 导入导出 + 解密
│       └── admin.js                # 用户管理 + 限流管理 + 系统设置
└── frontend/
    └── src/
        ├── main.jsx                # 路由入口
        ├── index.css               # 全局样式 + CSS 变量主题
        ├── components/
        │   ├── Layout.jsx          # 侧边栏 + 主题切换
        │   ├── ProductModal.jsx    # 产品弹窗
        │   └── RecordModal.jsx     # 记录弹窗
        ├── pages/
        │   ├── LoginPage.jsx       # 登录 / 注册
        │   ├── Dashboard.jsx       # 总览
        │   ├── ProductPage.jsx     # 记录表格（列设置、导入导出）
        │   ├── ColumnsEditor.jsx   # 自定义列编辑
        │   └── AdminUsers.jsx      # 管理后台
        └── utils/
            ├── api.js              # Axios 封装
            └── authStore.js        # Zustand 认证状态
```

---

## API 接口

### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录（失败自动计入限流） |
| GET | `/api/auth/register-status` | 查询注册开关状态 |

### 产品
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/products` | 获取所有产品（含记录数） |
| POST | `/api/products` | 创建产品 |
| PUT | `/api/products/:id` | 更新产品 |
| DELETE | `/api/products/:id` | 删除产品（级联删除记录） |
| GET | `/api/products/:id/columns` | 获取列定义 |
| PUT | `/api/products/:id/columns` | 保存列定义（增量更新，保留原有数据） |

### 记录
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/records/product/:id` | 记录列表（分页 + 全列搜索） |
| GET | `/api/records/:id` | 记录详情（含解密） |
| POST | `/api/records/product/:id` | 创建记录 |
| PUT | `/api/records/:id` | 更新记录 |
| DELETE | `/api/records/:id` | 删除记录 |
| POST | `/api/records/:id/decrypt` | 解密单个敏感字段 |
| GET | `/api/records/product/:id/export` | 导出 CSV（支持 `ids` 选中导出、`col_order` 自定义列顺序） |
| POST | `/api/records/product/:id/import` | 导入 CSV（纯新增） |

### 管理员（需管理员 Token）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/users` | 用户列表 |
| POST | `/api/admin/users` | 新建用户 |
| PATCH | `/api/admin/users/:id/toggle-disable` | 禁用 / 启用 |
| PATCH | `/api/admin/users/:id/toggle-admin` | 切换管理员权限 |
| PATCH | `/api/admin/users/:id/reset-password` | 重置密码 |
| DELETE | `/api/admin/users/:id` | 删除用户 |
| GET | `/api/admin/settings` | 获取系统设置 |
| PUT | `/api/admin/settings` | 保存系统设置 |
| GET | `/api/admin/rate-limits` | 查看限流记录 |
| POST | `/api/admin/rate-limits/release` | 解除 IP 限制 |
| DELETE | `/api/admin/rate-limits` | 删除限流记录 |

---

## 安全说明

> ⚠️ 生产环境部署前必须修改以下默认值

1. **`ENCRYPT_KEY`** — 必须是 32 位随机字符串。修改后已加密的数据将**无法解密**，请在初始部署时设置好，不要事后修改
2. **`JWT_SECRET`** — 使用足够长的随机字符串，泄露后所有 Token 失效
3. **HTTPS** — 生产环境强烈建议配置 SSL，`navigator.clipboard` 等 API 需要安全上下文
4. **数据库权限** — 建议为 Vault 创建单独的数据库用户，只授权 vault_db 的读写权限
5. **定期清理** — 限流记录表会持续增长，建议定期在管理后台执行「清理过期记录」

---

## License

MIT
