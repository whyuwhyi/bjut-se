const adminAuth = async (req, res, next) => {
  try {
    // 先验证登录状态
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }
    
    // 验证管理员权限
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '需要管理员权限'
      });
    }
    
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({
      success: false,
      message: '权限验证失败'
    });
  }
};

module.exports = { adminAuth };