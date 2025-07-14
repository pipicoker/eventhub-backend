const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    req.user = decoded; // ✅ Attach user info to request
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authenticate;
