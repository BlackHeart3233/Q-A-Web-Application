const mongoose  = require('mongoose');
const connection = require('../bin/www');
const bcrypt = require("bcrypt");
const { fileTypeFromBuffer } = require('file-type');
const path = require('path');
const fs = require('fs');

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    picture:{
        data: Buffer,
        contentType: String
    }
});


Users = mongoose.model('users', userSchema);

async function createUser(username, email, password) {
  try {
    const existingUser = await Users.findOne({ username });
    if (existingUser) {
      console.log('User already exists');
      return null;
    }

    const hashed = await bcrypt.hash(password, 10);
    const imagePath = path.join(__dirname, '../public/images/blank_profile.jpg');
    const imageBuffer = fs.readFileSync(imagePath);

    const newUser = new Users({
      username,
      email,
      password: hashed, 
      picture: {
        data: imageBuffer,
        contentType: 'image/jpeg'
      }
    });

    await newUser.save();
    return newUser;

  } catch (err) {
    console.error("Error creating user:", err);
    return null;
  }
}


async function checkLogin(username, password) {
  const user = await Users.findOne({ username });
  if (!user) {
    console.log('User not found');
    return null;
  }
  const match = await bcrypt.compare(password, user.password);
  if (match) {
    console.log('Login successful');
    return user;
  }
  console.log('Invalid password');
  return null;
}


async function changeImage(imageBase64, userId) {
  try {
    const user = await Users.findById(userId);
    if (!user) {
      console.log("ERROR: User not found");
      return false;
    }
    const base64Data = imageBase64.split(';base64,').pop();
    const buffer = Buffer.from(base64Data, 'base64');
    const type = await fileTypeFromBuffer(buffer);
    if (!type || !type.mime.startsWith("image/")) {
      throw new Error("Invalid file type");
    }
    user.picture = {
      data: buffer,
      contentType: type.mime
    };
    await user.save();
    console.log("Image updated successfully");
    return true;
  } catch (err) {
    console.error("Error updating image:", err);
    return false;
  }
}

async function getUserInfo(userId) {
    const user = await Users.findById(userId);
    if (!user) {
        console.log("ERROR: User not found");
        return null;
    }
    return {
        _id: user._id,
        username: user.username,
        email: user.email,
        picture: user.picture
    };
}



module.exports = {
  checkLogin,
  createUser,
  changeImage,
  getUserInfo,
};