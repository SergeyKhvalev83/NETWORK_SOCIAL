require('dotenv').config();
const { prisma } = require('../prisma/prisma-client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const jdenIcon = require('jdenticon'); // to generate avatar during registration
const path = require('path');
const fs = require('fs');

const salt = bcrypt.genSaltSync(10);

const UserController = {
  register: async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'email, password, name required',
      });
    }

    try {
      const isUserExist = await prisma.user.findUnique({ where: { email } });
      if (isUserExist) {
        return res.status(400).json({
          error: 'User with that email already registered, please login',
        });
      }
      const bcryptedPass = await bcrypt.hash(password, salt);
      // icon parameters and creation
      const size = 200;
      const png = jdenIcon.toPng(name, size); // generate icon
      const avatarName = `${name}_${Date.now()}.png`;
      const avatarpath = path.join(__dirname, '../uploads/', avatarName);
      fs.writeFileSync(avatarpath, png);

      const createNewUser = await prisma.user.create({
        data: {
          email,
          password: bcryptedPass,
          name,
          avatarUrl: `/uploads/${avatarpath}`,
        },
      });
      if (createNewUser) {
        return res.status(201).json(createNewUser);
      }
    } catch (error) {
      console.log('ERROR NEW USER REGISTRATION: ', error);
      res.status(500).json({
        message: 'Internal server error',
      });
    }
  },

  login: async (req, res) => {
    const { email, password } = req.body;
    console.log("LOGIN: ", email, password)
    if (!email || !password) {
      return res.status(400).json({
        error: 'email and (or) password required',
      });
    }
    try {
      const isUserExist = await prisma.user.findUnique({ where: { email } });
      if (!isUserExist) {
        return res.status(400).json({
          error: 'Wrong email or password provided ... please try again',
        });
      }
      const isPasswordMatched = await bcrypt.compare(
        password,
        isUserExist.password
      );

      if (!isPasswordMatched) {
        return res.status(401).json({
          error: 'Wrong email or password provided ... please try again',
        });
      }

      //token generating
      const token = jwt.sign(
        { email: isUserExist.email, id: isUserExist.id },
        process.env.SECRET_KEY
      );
      res.status(200).cookie('token', token).json(isUserExist);
    } catch (error) {
      console.log('ERROR NEW USER LOGIN: ', error);
      res.status(500).json({
        message: 'Internal server error',
      });
    }
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
