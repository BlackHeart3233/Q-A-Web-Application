var express = require('express');
var router = express.Router();
const model = require('../models/users');
const model_comment = require('../models/comment');
const model_article = require('../models/article');

const fs = require('fs');


router.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect("/users/profile");
  }
  res.render('users/login', { error_message: null });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.render('users/login', {
      error_message: 'Please enter both username and password'
    });
  }
  const user = await model.checkLogin(username, password);
  if (!user) {
    return res.render('users/login', {
      error_message: 'Invalid username or password'
    });
  }
  req.session.userId = user._id;
  return res.redirect("/users/profile");
});

router.get('/register', (req, res) => {
  if (req.session.userId) {
    return res.redirect(`/users/profile/${req.session.userId}`)
  }
  res.render('users/register', { error_message: null });
});

router.post('/register', async (req, res) => {
  const { username, email, password, confirm_password } = req.body;
  if (!username || !email || !password || !confirm_password) {
    return res.render("users/register", {
      error_message: 'Please fill in all fields'
    });
  }
  if (password !== confirm_password) {
    return res.render("users/register", {
      error_message: 'Passwords do not match'
    });
  }
  user = await model.createUser(username, email, password);
  if (user) {
    req.session.userId = user._id;
    return res.redirect("/users/profile");
  }
  return res.render("users/register", {
    error_message: 'User already exists or error'
  });
});

router.get('/profile', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/users/login');
  }

  res.redirect('/users/user_profile/' + req.session.userId);
});

router.get('/user_profile/:id', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/users/login');
  }

  const { id } = req.params;
  const user = await model.getUserInfo(id);

  if (!user) {
    return res.status(404).send('User not found');
  }

  try {
    const [comments, articles] = await Promise.all([
      model_comment.getCommentsByUserId(id),
      model_article.getArticlesByOwnerId(id)
    ]);

    let avg_rating = 0;

    for (const comment of comments) {
      avg_rating += comment.votes;
    }

    user.answers = comments.length;
    user.articles = articles.length;
    user.avg_rating = comments.length > 0
      ? avg_rating / comments.length
      : 0;

  } catch (err) {
    console.error("Error fetching data:", err);
    user.answers = 0;
    user.avg_rating = 0;
    user.articles = 0;
  }

  return res.render('users/profile', { user_profile: user });
});

router.post('/avatarUpdate', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/users/login');
  }
  const { imageBase64 } = req.body;
  if (!imageBase64) {
    console.log("No image received");
    return res.redirect(`/users/profile/${req.session.userId}`)
  }
  await model.changeImage(imageBase64, req.session.userId);
  return res.redirect("/users/profile")
});

router.get('/avatar/:id', async (req, res) => {
  const user = await model.getUserInfo(req.params.id);
  if (!user || !user.picture || !user.picture.data) {
    return res.sendStatus(404);
  }
  res.contentType(user.picture.contentType);
  res.send(user.picture.data);
});

router.get('/logout', function(req, res) {
  req.session.userId = null;
  return res.redirect('/users/login');
});


module.exports = router;
