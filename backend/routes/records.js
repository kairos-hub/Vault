const router = require('express').Router();
const db = require('../config/database');
const auth = require('../middleware/auth');
const { encrypt, decrypt } = require('../config/crypto');

// 获取产品下所有记录（带分页和全列搜索）
router.get('/product/:productId', auth, async (req, res) => {
  const { page = 1, limit = 20, search = '' } = req.query;
  const offset = (page - 1) * limit;

  try {
    const [prod] = await db.query(
      'SELECT id FROM products WHERE id = ? AND user_id = ?',
      [req.params.productId, req.user.id]
    );
    if (!prod.length) return res.status(404).json({ success: false, message: '产品不存在' });

    let recordIds;
    if (search) {
      // 全列检索：标题 + 所有非敏感字段值
      const [matched] = await db.query(
        `SELECT DISTINCT r.id FROM records r
         LEFT JOIN record_values rv ON rv.record_id = r.id
         LEFT JOIN column_definitions cd ON cd.id = rv.column_id AND cd.is_sensitive = 0
         WHERE r.product_id = ?
           AND (r.title LIKE ? OR rv.field_value LIKE ?)`,
        [req.params.productId, `%${search}%`, `%${search}%`]
      );
      recordIds = matched.map(r => r.id);
      if (recordIds.length === 0) {
        return res.json({ success: true, data: [], pagination: { total: 0, page: 1, limit: parseInt(limit), pages: 0 } });
      }
    }

    const whereCond = search
      ? `WHERE r.product_id = ? AND r.id IN (${recordIds.map(() => '?').join(',')})`
      : `WHERE r.product_id = ?`;
    const baseParams = search ? [req.params.productId, ...recordIds] : [req.params.productId];

    const [records] = await db.query(
      `SELECT r.id, r.title, r.created_at, r.updated_at FROM records r
       ${whereCond} ORDER BY r.updated_at DESC LIMIT ? OFFSET ?`,
      [...baseParams, parseInt(limit), offset]
    );

    for (const record of records) {
      const [values] = await db.query(
        `SELECT rv.*, cd.field_key, cd.field_label, cd.field_type, cd.is_sensitive, cd.sort_order
         FROM record_values rv
         JOIN column_definitions cd ON cd.id = rv.column_id
         WHERE rv.record_id = ? ORDER BY cd.sort_order`,
        [record.id]
      );
      record.values = values.map(v => ({
        ...v,
        field_value: v.is_sensitive ? '••••••••' : v.field_value
      }));
    }

    const [countRes] = await db.query(
      `SELECT COUNT(*) as total FROM records r ${whereCond}`,
      baseParams
    );

    // 读取标题列配置
    const [[titleLabel]] = await db.query(
      "SELECT `value` FROM system_settings WHERE `key` = ?",
      [`title_label_${req.params.productId}`]
    );
    const [[titleHidden]] = await db.query(
      "SELECT `value` FROM system_settings WHERE `key` = ?",
      [`title_hidden_${req.params.productId}`]
    );

    res.json({
      success: true,
      data: records,
      title_config: {
        label: titleLabel?.value || '标题',
        hidden: titleHidden?.value === '1',
      },
      pagination: {
        total: countRes[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countRes[0].total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 获取单条记录（含解密）
router.get('/:id', auth, async (req, res) => {
  try {
    const [records] = await db.query(
      `SELECT r.* FROM records r
       JOIN products p ON p.id = r.product_id
       WHERE r.id = ? AND p.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!records.length) return res.status(404).json({ success: false, message: '记录不存在' });

    const record = records[0];
    const [values] = await db.query(
      `SELECT rv.*, cd.field_key, cd.field_label, cd.field_type, cd.is_sensitive, cd.sort_order
       FROM record_values rv
       JOIN column_definitions cd ON cd.id = rv.column_id
       WHERE rv.record_id = ? ORDER BY cd.sort_order`,
      [record.id]
    );

    record.values = values.map(v => ({
      ...v,
      field_value: v.is_sensitive && v.is_encrypted ? decrypt(v.field_value) : v.field_value
    }));

    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 创建记录
router.post('/product/:productId', auth, async (req, res) => {
  const { title, values } = req.body;
  // 标题非必填

  try {
    const [prod] = await db.query(
      'SELECT id FROM products WHERE id = ? AND user_id = ?',
      [req.params.productId, req.user.id]
    );
    if (!prod.length) return res.status(404).json({ success: false, message: '产品不存在' });

    const [cols] = await db.query(
      'SELECT * FROM column_definitions WHERE product_id = ?',
      [req.params.productId]
    );

    const conn = await db.getConnection();
    await conn.beginTransaction();
    try {
      const [result] = await conn.query(
        'INSERT INTO records (product_id, title) VALUES (?, ?)',
        [req.params.productId, title]
      );
      const recordId = result.insertId;

      for (const col of cols) {
        const val = values?.[col.field_key] ?? '';
        const storedVal = col.is_sensitive ? encrypt(val) : val;
        await conn.query(
          'INSERT INTO record_values (record_id, column_id, field_value, is_encrypted) VALUES (?, ?, ?, ?)',
          [recordId, col.id, storedVal, col.is_sensitive ? 1 : 0]
        );
      }

      await conn.commit();
      res.json({ success: true, message: '创建成功', id: recordId });
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

// 更新记录
router.put('/:id', auth, async (req, res) => {
  const { title, values } = req.body;
  try {
    const [records] = await db.query(
      `SELECT r.* FROM records r
       JOIN products p ON p.id = r.product_id
       WHERE r.id = ? AND p.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!records.length) return res.status(404).json({ success: false, message: '记录不存在' });

    const record = records[0];
    const [cols] = await db.query(
      'SELECT * FROM column_definitions WHERE product_id = ?',
      [record.product_id]
    );

    const conn = await db.getConnection();
    await conn.beginTransaction();
    try {
      if (title) {
        await conn.query('UPDATE records SET title = ? WHERE id = ?', [title, req.params.id]);
      }
      for (const col of cols) {
        if (values?.[col.field_key] !== undefined) {
          const val = values[col.field_key];
          const storedVal = col.is_sensitive ? encrypt(val) : val;
          await conn.query(
            `UPDATE record_values SET field_value = ?, is_encrypted = ?
             WHERE record_id = ? AND column_id = ?`,
            [storedVal, col.is_sensitive ? 1 : 0, req.params.id, col.id]
          );
        }
      }
      await conn.commit();
      res.json({ success: true, message: '更新成功' });
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

// 删除记录
router.delete('/:id', auth, async (req, res) => {
  try {
    const [records] = await db.query(
      `SELECT r.id FROM records r
       JOIN products p ON p.id = r.product_id
       WHERE r.id = ? AND p.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!records.length) return res.status(404).json({ success: false, message: '记录不存在' });

    await db.query('DELETE FROM records WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 解密单个字段
router.post('/:id/decrypt', auth, async (req, res) => {
  const { field_key } = req.body;
  try {
    const [records] = await db.query(
      `SELECT r.* FROM records r
       JOIN products p ON p.id = r.product_id
       WHERE r.id = ? AND p.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!records.length) return res.status(403).json({ success: false, message: '无权访问' });

    const [values] = await db.query(
      `SELECT rv.field_value, rv.is_encrypted, cd.is_sensitive
       FROM record_values rv
       JOIN column_definitions cd ON cd.id = rv.column_id
       WHERE rv.record_id = ? AND cd.field_key = ?`,
      [req.params.id, field_key]
    );
    if (!values.length) return res.status(404).json({ success: false, message: '字段不存在' });

    const v = values[0];
    if (!v.is_sensitive) return res.status(400).json({ success: false, message: '非敏感字段' });

    const plain = v.is_encrypted ? decrypt(v.field_value) : v.field_value;
    res.json({ success: true, value: plain });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 导出产品所有记录（含解密，CSV格式）
router.get('/product/:productId/export', auth, async (req, res) => {
  try {
    const [prod] = await db.query(
      'SELECT * FROM products WHERE id = ? AND user_id = ?',
      [req.params.productId, req.user.id]
    );
    if (!prod.length) return res.status(404).json({ success: false, message: '产品不存在' });

    const [cols] = await db.query(
      'SELECT * FROM column_definitions WHERE product_id = ? ORDER BY sort_order',
      [req.params.productId]
    );

    // 支持按 ids 筛选（逗号分隔），不传则导出全部
    const { ids } = req.query;
    let records;
    if (ids) {
      const idList = ids.split(',').map(Number).filter(Boolean);
      if (!idList.length) return res.status(400).json({ success: false, message: 'ids 参数无效' });
      const placeholders = idList.map(() => '?').join(',');
      [records] = await db.query(
        `SELECT * FROM records WHERE product_id = ? AND id IN (${placeholders}) ORDER BY updated_at DESC`,
        [req.params.productId, ...idList]
      );
    } else {
      [records] = await db.query(
        'SELECT * FROM records WHERE product_id = ? ORDER BY updated_at DESC',
        [req.params.productId]
      );
    }

    for (const record of records) {
      const [values] = await db.query(
        `SELECT rv.*, cd.field_key, cd.is_sensitive FROM record_values rv
         JOIN column_definitions cd ON cd.id = rv.column_id
         WHERE rv.record_id = ?`,
        [record.id]
      );
      record.values = {};
      values.forEach(v => {
        record.values[v.field_key] = v.is_sensitive && v.is_encrypted
          ? decrypt(v.field_value)
          : v.field_value;
      });
    }

    // 按前端传入的 col_order 重排列顺序
    const { col_order } = req.query;
    let orderedCols = cols;
    if (col_order) {
      const orderIds = col_order.split(',').map(Number).filter(Boolean);
      // 按 orderIds 排序，找不到的列追加到末尾
      const colMap = new Map(cols.map(c => [c.id, c]));
      const sorted = orderIds.map(cid => colMap.get(cid)).filter(Boolean);
      const rest = cols.filter(c => !orderIds.includes(c.id));
      orderedCols = [...sorted, ...rest];
    }

    // 生成 CSV（标题列始终第一列）
    const escapeVal = (val) => {
      if (!val) return '';
      const s = String(val);
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };
    const headers = ['标题', ...orderedCols.map(c => c.field_label)];
    const rows = records.map(r => [
      escapeVal(r.title),
      ...orderedCols.map(c => escapeVal(r.values[c.field_key] || ''))
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const filename = encodeURIComponent(`${prod[0].name}_export_${new Date().toISOString().slice(0,10)}.csv`);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);
    res.send('\uFEFF' + csv); // BOM 头，Excel 正确识别 UTF-8
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 批量导入记录（CSV）— 纯新增，不覆盖已有数据
router.post('/product/:productId/import', auth, async (req, res) => {
  const { rows } = req.body; // [{ title, ...fieldValues }]
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ success: false, message: '导入数据不能为空' });
  }

  try {
    const [prod] = await db.query(
      'SELECT id FROM products WHERE id = ? AND user_id = ?',
      [req.params.productId, req.user.id]
    );
    if (!prod.length) return res.status(404).json({ success: false, message: '产品不存在' });

    const [cols] = await db.query(
      'SELECT * FROM column_definitions WHERE product_id = ?',
      [req.params.productId]
    );

    const conn = await db.getConnection();
    await conn.beginTransaction();
    let imported = 0;
    try {
      for (const row of rows) {
        const title = row['标题'] || row.title || '导入记录';
        const [result] = await conn.query(
          'INSERT INTO records (product_id, title) VALUES (?, ?)',
          [req.params.productId, title]
        );
        const recordId = result.insertId;

        for (const col of cols) {
          const val = row[col.field_label] || row[col.field_key] || '';
          const storedVal = col.is_sensitive ? encrypt(val) : val;
          await conn.query(
            'INSERT INTO record_values (record_id, column_id, field_value, is_encrypted) VALUES (?, ?, ?, ?)',
            [recordId, col.id, storedVal, col.is_sensitive ? 1 : 0]
          );
        }
        imported++;
      }
      await conn.commit();
      res.json({ success: true, message: `成功导入 ${imported} 条记录`, imported });
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
