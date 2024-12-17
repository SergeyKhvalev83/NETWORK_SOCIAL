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
    console.log('LOGIN: ', email, password);
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
        { email: isUserExist.email, userId: isUserExist.id },
        process.env.SECRET_KEY
      );
      console.log('TOKEN: ', token);
      //  res.status(200).cookie('token', token).json(isUserExist);
      res.status(201).json({ token });
    } catch (error) {
      console.log('ERROR NEW USER LOGIN: ', error);
      res.status(500).json({
        message: 'Internal server error',
      });
    }
  },
  getUserById: async (req, res) => {
    // stands for searching user by ID. For example I can find any user when I am login
    const { id } = req.params; // id of user which we searching for
    const { userId } = req.user.userId; // my id
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          followers: true, // we also need all followers and folloging of that user
          following: true,
        },
      });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const isFollowing = await prisma.follows.findFirst({
        // check if I as person which loge=in is follower of searching user
        where: {
          AND: [
            { followerId: userId }, // if I is follower of user which we searching for
            { followingId: id }, // id if user which we looking for
          ],
        },
      });

      res.status(200).json({
        ...user,
        isFollowing: Boolean(isFollowing), // we spread info user we searching for boolean if I am his follower
      });
    } catch (error) {
      console.log('Error get user by ID: ', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },


  updateUser: async (req, res) => {
    const { id } = req.params;
    const { email, name, dateOfBirth, bio, location } = req.body;

    let filePath; // check if user add phote to updatr avatar icon
    if (req.file && req.file.path) {
      // that properties will be added to req automaticaly by multer
      filePath = req.file.path;
    }

    if (id !== req.user.userId) {
      // we define if user try to udpade his/her info (req.user.id) => that field we add to request thanks for middleware
      return res.status(403).json({ error: 'Forbidden' });
    }

    try {
      if (email) {
        const isUserWIthEmailAlreadyExist = await prisma.user.findFirst({
          where: { email },
        });
          if (isUserWIthEmailAlreadyExist && id !== isUserWIthEmailAlreadyExist.id) {
        // email must be unique, so if user try to change email, but it is already in use, user must take another email
        return res
          .status(400)
          .json({ error: 'Email already in use, try another email' });
      }

      }
    
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          email: email || undefined, // undefined to cover case if no data came from front end. and if it undefined => overriting data not happens its leave it as is
          name: name || undefined,
          dateOfBirth: dateOfBirth || undefined,
          bio: bio || undefined,
          location: location || undefined,
          avatarUrl: filePath ? `/${filePath}` : undefined,
        },
      });
      res.status(200).json(updatedUser);
    } catch (error) {
      console.log('ERROR update user info: ', error);
      res.status(500).json({ message: 'Internal server error when update user info' });
    }
  },



  currentUser: async (req, res) => { // get current login user base on token
  try{
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.userId // userId we get from token. (req.user.id) => that field we add to request thanks for middleware
    },
    include: {
      followers:{
        include:{
          follower: true
        }
      },
      following:{
        include:{
          following: true
        }
        
      }
    }
  })

  if(!user){
    return res.status(400).json({message: "User not found"})
  }
  res.status(200).json(user);
  }catch(error){
    console.log('ERROR get current user: ', error);
    res.status(500).json({ message: 'Internal server error when try to pull currentUser' });
  }
  },
};

module.exports = UserController;
