module.exports = (req, res, next) => {
  if (!req.user?.is_admin) {
    return res.status(403).json({ success: false, message: '无权限，仅管理员可操作' });
  }
  next();
};
