import jwt from 'jsonwebtoken';
import config from '../config.js';

export function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expect 'Bearer <token>'

  if (!token) {
    return res.status(401).json({ message: 'No token provided, authorization denied.' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
} 