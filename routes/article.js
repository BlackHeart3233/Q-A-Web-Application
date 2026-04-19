var express = require('express');
var router = express.Router();
var model = require('../models/article');
var comment_model = require('../models/comment');
var user_model = require('../models/users');
const sub_comment_model = require('../models/sub_comment');


router.get('/all', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/users/login');
    }
    const articles = await model.getAllArticles();
    res.render('article/all', { articles });
});

router.get('/hot', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/users/login');
    }
    const articles = await model.hotArticles();
    res.render('article/all', { articles });
});

router.get('/new', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/users/login');
    }
    res.render('article/form_new');
});

router.post('/new', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/users/login');
    }
    const { title, content } = req.body;
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).render('article/form_new', {
        error: 'Title and content are required.'
      });
    }
    const article = await model.createArticle(
      title,
      content,
      req.session.userId
    );
    if (article) {
      return res.redirect('/article/all');
    }
    res.status(400).render('article/form_new', {
      error: 'Failed to create article.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.get('/:id', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/users/login');
  }
  const articleId = req.params.id;
  try {
    const article = await model.getArticleById(articleId);
    if (!article) {
      return res.status(404).send('Article not found');
    }
    const owner = await user_model.getUserInfo(article.owner);
    await model.updateArticleViews(articleId);
    const comments = await comment_model.getMainCommentsByArticleId(articleId);
    for (let comment of comments) {
      comment.subComments = await sub_comment_model.getSubCommentsByCommentId(comment._id);
    }
    res.render('article/article', { 
      article, 
      owner, 
      comments, 
      user: req.session.userId 
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.post('/delete/:id', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/users/login');
    }
    const articleId = req.params.id;
    try {
        const article = await model.getArticleById(articleId);
        if (!article) {
            return res.status(404).send('Article not found');
        }
        if (article.owner.toString() !== req.session.userId) {
            return res.status(403).send('Forbidden');
        }
        await model.deleteArticleById(articleId);
        await comment_model.deleteCommentsByArticleId(articleId);
        await sub_comment_model.removeSubCommentsByCommentId(commentId);
        res.redirect('/article/all');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
