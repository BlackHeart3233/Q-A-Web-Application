var express = require('express');
var router = express.Router();
var model = require('../models/comment');
var user_model = require('../models/users');
var article_model = require('../models/article');


router.post('/new', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/users/login');
    }
    const { content, articleId } = req.body;
    if (!content?.trim() || !articleId) {
        return res.status(400).send('Content and article ID are required.');
    }
    try {
        const comment = await model.createMainComment(
            content,
            articleId,
            req.session.userId
        );
        res.redirect('/article/' + articleId);
    } catch (err) {
        console.error("Error creating comment:", err);
        res.status(500).send("Error creating comment.");
    }
});

router.post('/delete/:id', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/users/login');
  }
  const commentId = req.params.id;
  try {
    const comment = await model.getCommentById(commentId);
    if (!comment) {
      return res.status(404).send('Comment not found');
    }
    const isCommentOwner =comment.owner_user.toString() === req.session.userId.toString();
    const article = await article_model.getArticleById(comment.owner_article);
    const isArticleOwner =
      article.owner.toString() === req.session.userId.toString();

    if (!isCommentOwner && !isArticleOwner) {
      return res.status(403).send('Forbidden');
    }
    await model.deleteCommentById(commentId);
    return res.redirect('/article/' + comment.owner_article);
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).send("Error deleting comment.");
  }
});

router.post('/accept/:id', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/users/login');
    }
    const commentId = req.params.id;
    try {
        const comment = await model.getCommentById(commentId);
        if (!comment) {
            return res.status(404).send('Comment not found');
        }
        const article = await article_model.getArticleById(comment.owner_article);
        if (article.owner.toString() !== req.session.userId.toString()) {
            return res.status(403).send('Forbidden');
        }
        await model.acceptComment(commentId);
        res.redirect('/article/' + comment.owner_article);
    } catch (err) {
        console.error("Error accepting comment:", err);
        res.status(500).send("Error accepting comment.");
    }
});

router.post('/unaccept/:id', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/users/login');
    }
    const commentId = req.params.id;
    try {
        const comment = await model.getCommentById(commentId);
        if (!comment) {
            return res.status(404).send('Comment not found');
        }
        const article = await article_model.getArticleById(comment.owner_article);
        if (article.owner.toString() !== req.session.userId.toString()) {
            return res.status(403).send('Forbidden');
        }
        await model.removeAcceptComment(commentId);
        res.redirect('/article/' + comment.owner_article);
    } catch (err) {
        console.error("Error unaccepting comment:", err);
        res.status(500).send("Error unaccepting comment.");
    }
});

router.post('/upvote/:id', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/users/login');
    }
    const commentId = req.params.id;
    try {        
        const comment = await model.getCommentById(commentId);
        if (!comment) {
            return res.status(404).send('Comment not found');
        }     
        await model.upvoteComment(commentId, req.session.userId);
        res.redirect('/article/' + comment.owner_article);
    } catch (err) {
        console.error("Error upvoting comment:", err);
        res.status(500).send("Error upvoting comment.");
    }
});

router.post('/downvote/:id', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/users/login');
    }
    const commentId = req.params.id;
    try {        
        const comment = await model.getCommentById(commentId);
        if (!comment) {
            return res.status(404).send('Comment not found');
        }     
        await model.downvoteComment(commentId, req.session.userId);
        res.redirect('/article/' + comment.owner_article);
    } catch (err) {
        console.error("Error downvoting comment:", err);
        res.status(500).send("Error downvoting comment.");
    }
});


module.exports = router;
