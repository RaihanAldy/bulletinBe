import jwt from 'jsonwebtoken';
import User from '../models/user.js';

export const auth = async (req, res, next) => {
  try {
    console.log('🔐 Auth Middleware triggered');
    console.log('Headers:', req.headers);
    
    const authHeader = req.header('Authorization');
    console.log('Auth Header:', authHeader);
    
    if (!authHeader) {
      console.log('❌ No Authorization header');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.log('❌ Invalid Authorization format - missing Bearer');
      return res.status(401).json({ message: 'Invalid token format' });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token:', token ? `${token.substring(0, 20)}...` : 'Empty');
    
    if (!token) {
      console.log('❌ No token found after Bearer');
      return res.status(401).json({ message: 'No token found' });
    }

    // Verify token
    console.log('JWT Secret exists:', !!process.env.JWT_SECRET);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);

    // Find user
    const user = await User.findById(decoded.userId).select('-password');
    console.log('User found:', user ? user.email : 'No user found');
    
    if (!user) {
      console.log('❌ User not found in database');
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    console.log('✅ Auth successful for user:', user.email);
    next();
  } catch (error) {
    console.log('🔴 Auth error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    res.status(401).json({ message: 'Authentication failed' });
  }
};