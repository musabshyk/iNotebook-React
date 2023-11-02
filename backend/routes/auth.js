const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const bcrypt = require("bcryptjs");
var jwt = require('jsonwebtoken');
var fetchuser = require('../middleware/fetchUser');
const JWT_SECRET= "Musabisagoodb$oy"
//ROUTE:1 create a new user: POST "/api/auth/createuser  .NO LOGIN REQUIRED"
router.post('/createuser', [
  body('name', 'Enter a valid name').isLength({ min: 3 }),
  body('email', 'Enter a valid email address').isEmail(),
  body('password', 'Password length must be at least five characters').isLength({ min: 5 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    const salt = await bcrypt.genSalt(10);
    const secPass = await bcrypt.hash(req.body.password,salt)
    const newUser = new User({
      name: req.body.name,
      password: secPass,
      email: req.body.email
    });
    const savedUser = await newUser.save();
    const data = {
      user:{
        id: savedUser.id
      }
    }
    const authToken = jwt.sign(data,JWT_SECRET);
    // const savedUser = await newUser.save();
    // res.json(savedUser);
    res.json({authToken});
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


//ROUTE:2 Authenticate a user using: POST "/api/auth/login  .NO LOGIN REQUIRED"
router.post('/login', [
  body('email', 'Enter a valid email address').isEmail(),
  body('password', 'Password cannot be blank').exists()
], async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const {email,password} = req.body;
  try{
    let user  = await User.findOne({email})
    if (!user) {
      return res.status(400).json({ error: 'Please try to login with correct credentials' });
    }
    const passwordCompare = await bcrypt.compare(password,user.password);
    if(!passwordCompare){
      return res.status(400).json({ error: 'Please try to login with correct credentials' });

    }
    const data = {
      user:{
        id: user.id
      }
    }
    const authToken = jwt.sign(data,JWT_SECRET);
    // const savedUser = await newUser.save();
    // res.json(savedUser);
    res.json({authToken});
  }catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
})

//ROUTE:3 Get logged-in user details using: POST "/api/auth/getuser  . LOGIN REQUIRED"
router.post('/getuser', fetchuser,async (req, res) => {
try{
  userId = req.user.id;
  const user = await User.findById(userId).select("-password");
  res.send(user);
}catch (error) {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal server error' });
}
})
module.exports = router;
