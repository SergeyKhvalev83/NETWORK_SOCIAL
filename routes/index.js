const express = require('express');
const router = express.Router();
const multer = require('multer');

// show to project where we going to store uploaded files
const storage = multer.diskStorage({ // that is settings for multer storage
  destination: 'uploads',
  filename: function(req, file, callback){ // that function stands for file name generating help avoid duplicated file names
    callback(null, file.originalname); // instead callback will be placedrelevant router callback. And we get access to file original name
  }
});

const uploads = multer({// we create variable which contains multer storage with "storage" configuration 
  storage: storage 
})

router.get('/register', async (req, res) => {
  res.status(200).json('message: hey bro');
});

module.exports = router;
