var express = require('express');
var router = express.Router();
const model = require('../models/users');
const model_comment = require('../models/comment');
const model_article = require('../models/article');
const model_sub_comment = require('../models/sub_comment');
const fs = require('fs');

router.post('/new', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect('/users/login');
        }
        const { content, commentId, articleId } = req.body;
        if (!content?.trim() || !commentId || !articleId) {
            return res.status(400).send('Content, comment ID, and article ID are required.');
        }
        const subComment = await model_sub_comment.createSubComment(
            content,
            commentId,
            req.session.userId
        );
        if (subComment) {
            return res.redirect(`/article/${articleId}`);
        }
        res.status(400).send('Failed to create sub comment.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

router.post('/delete/:id', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect('/users/login');
        }
        const { id } = req.params;
        const subComment = await model_sub_comment.removeSubComment(id);
        if (!subComment) {
            return res.status(404).send('Sub comment not found');
        }
        res.redirect('back');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

module.exports = router;