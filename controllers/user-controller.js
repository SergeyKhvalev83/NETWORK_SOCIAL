const { param } = require('../routes');

const UserController = {
  register: async (req, res) => {
    const { email, password } = req.body;
    res
      .status(201)
      .json({ message: 'registry', email: email, password: password });
  },
  login: async (req, res) => {
    const { email, password } = req.body;
    res
      .status(200)
      .json({ message: 'login', email: email, password: password });
  },
  getUserById: async (req, res) => {
    const { id } = req.params;
    res.status(201).json({
      message: 'getUserById',
      id: id,
    });
  },
  updateUser: async (req, res) => {
    const { id } = req.params;
    res.status(201).json({
      message: 'updateUserById',
      id: id,
    });
  },
  currentUser: async (req, res) => {
    res.status(200).json({
      message: 'current user - Sergey',
    });
  },
};

module.exports = UserController;
