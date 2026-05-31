const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_with_a_real_secret';

async function register(req, res) {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password required' });

    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ message: 'Username already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ username, passwordHash, role });
    await user.save();

    return res.status(201).json({ message: 'User registered' });
  } catch (err) {
    console.error('Register error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password required' });

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const payload = { id: user._id, username: user.username, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    return res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { register, login };
