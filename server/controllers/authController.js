const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, area, isAdmin } = req.body;
    
    if (await User.findOne({ email })) {
      return res.status(400).json({ error: { code: 'EXISTS', message: 'User already exists' } });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      passwordHash,
      phone,
      area,
      isAdmin: isAdmin || false
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      area: user.area,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(400).json({ error: { code: 'INVALID', message: error.message } });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      if (!user.isActive) return res.status(401).json({ error: { code: 'INACTIVE', message: 'Account deactivated' } });
      
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        area: user.area,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });
    }
  } catch (error) {
    res.status(400).json({ error: { code: 'INVALID', message: error.message } });
  }
};

const getMe = async (req, res) => {
  res.json(req.user);
};

const updateMe = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, req.body, { new: true }).select('-passwordHash');
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: { code: 'INVALID', message: error.message } });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: { code: 'INVALID', message: error.message } });
  }
};

module.exports = { registerUser, loginUser, getMe, updateMe, getUser };
