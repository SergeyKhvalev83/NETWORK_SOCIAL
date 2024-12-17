const express = require('express');
const router = express.Router();
const multer = require('multer');
const { UserController } = require('../controllers');
const authenticateToken = require('../middleware/auth');

// show to project where we going to store uploaded files
const storage = multer.diskStorage({
  // that is settings for multer storage
  destination: 'uploads',
  filename: function (req, file, callback) {
    // that function stands for file name generating help avoid duplicated file names
    callback(null, file.originalname); // instead callback will be placedrelevant router callback. And we get access to file original name
  },
});

const uploads = multer({
  // we create variable which contains multer storage with "storage" configuration
  storage: storage,
});

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.get('/users/:id',authenticateToken, UserController.getUserById);
router.put('/users/:id', authenticateToken, UserController.updateUser);
router.get('/current', authenticateToken, UserController.currentUser);

module.exports = router;
