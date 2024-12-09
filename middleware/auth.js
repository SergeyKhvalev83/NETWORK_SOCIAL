const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // we get only token without "Bearer"

  if (!token) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user; // we add to req entire authorized user
    next();
  });
};

module.exports = authenticateToken;
