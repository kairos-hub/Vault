const router = require('express').Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// 获取当前用户所有产品
router.get('/', auth, async (req, res) => {
  try {
    const [products] = await db.query(
      `SELECT p.*, 
        (SELECT COUNT(*) FROM records r WHERE r.product_id = p.id) AS record_count
       FROM products p WHERE p.user_id = ? ORDER BY p.sort_order ASC, p.created_at ASC`,
      [req.user.id]
    );
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 创建产品
router.post('/', auth, async (req, res) => {
  const { name, description, icon, color } = req.body;
  if (!name) return res.status(400).json({ success: false, message: '产品名称不能为空' });
  try {
    const [[{ maxOrder }]] = await db.query(
      'SELECT COALESCE(MAX(sort_order), 0) AS maxOrder FROM products WHERE user_id = ?',
      [req.user.id]
    );
    const [result] = await db.query(
      'INSERT INTO products (name, description, icon, color, user_id, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description || '', icon || 'folder', color || '#6366f1', req.user.id, maxOrder + 1]
    );
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 批量更新产品排序（必须在 /:id 之前，否则 reorder 会被当成 id）
router.put('/reorder', auth, async (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) {
    return res.status(400).json({ success: false, message: 'order 必须是数组' });
  }
  try {
    const ids = order.map(o => o.id);
    const placeholders = ids.map(() => '?').join(',');
    const [rows] = await db.query(
      `SELECT id FROM products WHERE id IN (${placeholders}) AND user_id = ?`,
      [...ids, req.user.id]
    );
    if (rows.length !== ids.length) {
      return res.status(403).json({ success: false, message: '包含无权操作的产品' });
    }
    for (const { id, sort_order } of order) {
      await db.query('UPDATE products SET sort_order = ? WHERE id = ?', [sort_order, id]);
    }
    res.json({ success: true, message: '排序已保存' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 更新产品
router.put('/:id', auth, async (req, res) => {
  const { name, description, icon, color } = req.body;
  try {
    const [exists] = await db.query(
      'SELECT id FROM products WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!exists.length) return res.status(404).json({ success: false, message: '产品不存在' });
    await db.query(
      'UPDATE products SET name=?, description=?, icon=?, color=? WHERE id=?',
      [name, description, icon, color, req.params.id]
    );
    res.json({ success: true, message: '更新成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 删除产品
router.delete('/:id', auth, async (req, res) => {
  try {
    const [exists] = await db.query(
      'SELECT id FROM products WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!exists.length) return res.status(404).json({ success: false, message: '产品不存在' });
    await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 获取产品的列定义（含标题列配置）
router.get('/:id/columns', auth, async (req, res) => {
  try {
    const [cols] = await db.query(
      `SELECT cd.* FROM column_definitions cd
       JOIN products p ON p.id = cd.product_id
       WHERE cd.product_id = ? AND p.user_id = ?
       ORDER BY cd.sort_order`,
      [req.params.id, req.user.id]
    );
    // 读取标题列配置
    const [[titleLabel]] = await db.query(
      "SELECT `value` FROM system_settings WHERE `key` = ?",
      [`title_label_${req.params.id}`]
    );
    const [[titleHidden]] = await db.query(
      "SELECT `value` FROM system_settings WHERE `key` = ?",
      [`title_hidden_${req.params.id}`]
    );
    res.json({
      success: true,
      data: cols,
      title_config: {
        label: titleLabel?.value || '标题',
        hidden: titleHidden?.value === '1',
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 保存标题列配置
router.put('/:id/title-config', auth, async (req, res) => {
  const { label, hidden } = req.body;
  try {
    const [exists] = await db.query(
      'SELECT id FROM products WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!exists.length) return res.status(404).json({ success: false, message: '产品不存在' });

    await db.query(
      'INSERT INTO system_settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',
      [`title_label_${req.params.id}`, label || '标题', label || '标题']
    );
    await db.query(
      'INSERT INTO system_settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',
      [`title_hidden_${req.params.id}`, hidden ? '1' : '0', hidden ? '1' : '0']
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 批量保存列定义（增量更新，保留已有数据）
router.put('/:id/columns', auth, async (req, res) => {
  const { columns } = req.body;
  if (!Array.isArray(columns)) {
    return res.status(400).json({ success: false, message: 'columns 必须是数组' });
  }
  try {
    const [exists] = await db.query(
      'SELECT id FROM products WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!exists.length) return res.status(404).json({ success: false, message: '产品不存在' });

    // 取出当前已有列（按 field_key 索引）
    const [oldCols] = await db.query(
      'SELECT * FROM column_definitions WHERE product_id = ?',
      [req.params.id]
    );
    const oldMap = {};
    oldCols.forEach(c => { oldMap[c.field_key] = c; });

    const newKeys = new Set(columns.map(c => c.field_key));

    const conn = await db.getConnection();
    await conn.beginTransaction();
    try {
      for (let idx = 0; idx < columns.length; idx++) {
        const col = columns[idx];
        const opts = col.field_options ? JSON.stringify(col.field_options) : null;

        if (oldMap[col.field_key]) {
          // 已存在：只更新元信息，不动 record_values
          await conn.query(
            `UPDATE column_definitions
             SET field_label=?, field_type=?, field_options=?, is_required=?, is_sensitive=?, sort_order=?
             WHERE id=?`,
            [
              col.field_label,
              col.field_type || 'text',
              opts,
              col.is_required ? 1 : 0,
              col.is_sensitive ? 1 : 0,
              idx + 1,
              oldMap[col.field_key].id
            ]
          );
        } else {
          // 新列：INSERT，并为所有已有记录补一条空值
          const [insertRes] = await conn.query(
            `INSERT INTO column_definitions
             (product_id, field_key, field_label, field_type, field_options, is_required, is_sensitive, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              req.params.id,
              col.field_key,
              col.field_label,
              col.field_type || 'text',
              opts,
              col.is_required ? 1 : 0,
              col.is_sensitive ? 1 : 0,
              idx + 1
            ]
          );
          const newColId = insertRes.insertId;

          // 为该产品下每条已有记录补空值行
          const [existingRecords] = await conn.query(
            'SELECT id FROM records WHERE product_id = ?',
            [req.params.id]
          );
          if (existingRecords.length > 0) {
            const fillValues = existingRecords.map(r => [r.id, newColId, '', 0]);
            await conn.query(
              'INSERT INTO record_values (record_id, column_id, field_value, is_encrypted) VALUES ?',
              [fillValues]
            );
          }
        }
      }

      // 删除被移除的列（及其关联的 record_values 会由外键级联删除）
      for (const oldKey of Object.keys(oldMap)) {
        if (!newKeys.has(oldKey)) {
          await conn.query(
            'DELETE FROM column_definitions WHERE id = ?',
            [oldMap[oldKey].id]
          );
        }
      }

      await conn.commit();
      res.json({ success: true, message: '列定义已保存' });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
