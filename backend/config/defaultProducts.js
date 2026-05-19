/**
 * 新用户默认产品初始化
 * 注册和管理员创建用户时调用
 */

const DEFAULT_PRODUCTS = [
  {
    name: '服务器管理',
    description: '管理所有服务器的账号密码信息',
    icon: 'server',
    color: '#6366f1',
    columns: [
      { field_key: 'ip',       field_label: '服务器IP', field_type: 'text',     is_required: 1, is_sensitive: 0 },
      { field_key: 'port',     field_label: 'SSH端口',  field_type: 'number',   is_required: 0, is_sensitive: 0 },
      { field_key: 'username', field_label: '账号',     field_type: 'text',     is_required: 1, is_sensitive: 0 },
      { field_key: 'password', field_label: '密码',     field_type: 'password', is_required: 1, is_sensitive: 1 },
      { field_key: 'region',   field_label: '地域',     field_type: 'select',   is_required: 0, is_sensitive: 0,
        field_options: ['华东-上海','华北-北京','华南-广州','华西-成都','香港','新加坡','美国-西部','美国-东部','欧洲-法兰克福','日本-东京'] },
      { field_key: 'purpose',  field_label: '用途',     field_type: 'text',     is_required: 0, is_sensitive: 0 },
      { field_key: 'notes',    field_label: '备注',     field_type: 'textarea', is_required: 0, is_sensitive: 0 },
    ]
  },
  {
    name: '数据库账号',
    description: '数据库连接信息管理',
    icon: 'database',
    color: '#0ea5e9',
    columns: [
      { field_key: 'host',          field_label: '主机地址',   field_type: 'text',     is_required: 1, is_sensitive: 0 },
      { field_key: 'port',          field_label: '端口',       field_type: 'number',   is_required: 1, is_sensitive: 0 },
      { field_key: 'db_type',       field_label: '数据库类型', field_type: 'select',   is_required: 1, is_sensitive: 0,
        field_options: ['MySQL','PostgreSQL','Redis','MongoDB','Oracle','SQL Server','SQLite'] },
      { field_key: 'database_name', field_label: '数据库名',   field_type: 'text',     is_required: 0, is_sensitive: 0 },
      { field_key: 'username',      field_label: '用户名',     field_type: 'text',     is_required: 1, is_sensitive: 0 },
      { field_key: 'password',      field_label: '密码',       field_type: 'password', is_required: 1, is_sensitive: 1 },
      { field_key: 'notes',         field_label: '备注',       field_type: 'textarea', is_required: 0, is_sensitive: 0 },
    ]
  },
  {
    name: '网站账号',
    description: '各类网站和服务的登录信息',
    icon: 'globe',
    color: '#10b981',
    columns: [
      { field_key: 'url',      field_label: '网站地址',   field_type: 'url',      is_required: 1, is_sensitive: 0 },
      { field_key: 'username', field_label: '账号/邮箱',  field_type: 'text',     is_required: 1, is_sensitive: 0 },
      { field_key: 'password', field_label: '密码',       field_type: 'password', is_required: 1, is_sensitive: 1 },
      { field_key: 'phone',    field_label: '绑定手机',   field_type: 'text',     is_required: 0, is_sensitive: 0 },
      { field_key: 'email',    field_label: '绑定邮箱',   field_type: 'email',    is_required: 0, is_sensitive: 0 },
      { field_key: 'notes',    field_label: '备注',       field_type: 'textarea', is_required: 0, is_sensitive: 0 },
    ]
  },
  {
    name: 'API密钥',
    description: '第三方服务API密钥管理',
    icon: 'key',
    color: '#f59e0b',
    columns: [
      { field_key: 'service',     field_label: '服务名称', field_type: 'text',     is_required: 1, is_sensitive: 0 },
      { field_key: 'api_key',     field_label: 'API Key',  field_type: 'password', is_required: 1, is_sensitive: 1 },
      { field_key: 'api_secret',  field_label: 'API Secret', field_type: 'password', is_required: 0, is_sensitive: 1 },
      { field_key: 'endpoint',    field_label: '接入地址', field_type: 'url',      is_required: 0, is_sensitive: 0 },
      { field_key: 'expire_date', field_label: '到期日期', field_type: 'text',     is_required: 0, is_sensitive: 0 },
      { field_key: 'notes',       field_label: '备注',     field_type: 'textarea', is_required: 0, is_sensitive: 0 },
    ]
  },
];

/**
 * 为指定用户初始化默认产品和列定义
 * @param {object} conn - MySQL 连接（事务内使用）
 * @param {number} userId
 */
async function initDefaultProducts(conn, userId) {
  for (const product of DEFAULT_PRODUCTS) {
    const [result] = await conn.query(
      'INSERT INTO products (name, description, icon, color, user_id) VALUES (?, ?, ?, ?, ?)',
      [product.name, product.description, product.icon, product.color, userId]
    );
    const productId = result.insertId;

    for (let i = 0; i < product.columns.length; i++) {
      const col = product.columns[i];
      const opts = col.field_options ? JSON.stringify(col.field_options) : null;
      await conn.query(
        `INSERT INTO column_definitions
         (product_id, field_key, field_label, field_type, field_options, is_required, is_sensitive, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [productId, col.field_key, col.field_label, col.field_type, opts,
         col.is_required, col.is_sensitive, i + 1]
      );
    }
  }
}

module.exports = { initDefaultProducts };
