const mongoose  = require('mongoose');
const connection = require('../bin/www');
const { MainComment } = require('./comment');
const comment_model = require('./comment');
const articleSchema  = new mongoose.Schema({
    title: String,
    content: String,
    date: Date,
    views: Number,
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

const Article  = mongoose.model('article', articleSchema );

async function createArticle(title, content, owner) {
    try {
    if(!title || !content || !owner) {
      throw new Error('Missing required fields');
    }

    const newArticle = new Article({
      title,
      content,
      date: new Date(),
      owner,
      views: 0
    });

    await newArticle.save();
    return newArticle;

    }catch (err) {
        console.error("Error creating article:", err);
        return null;
    }

}

async function getAllArticles() {
    try {
        const articles = await Article.find({});
        return articles;
    } catch (err) {
        console.error("Error fetching articles:", err);
        return [];
    }
}

async function getArticleById(id) {
    try{
        const article = await Article.findById(id);
        return article;
    }catch (err) {
        console.error("Error fetching article by ID:", err);
        return null;
    }
}

async function deleteArticleById(id) {
    try {
        await Article.findByIdAndDelete(id);
        return true;
    } catch (err) {
        console.error("Error deleting article:", err);
        return false;
    }
}

async function updateArticleViews(id) {
    try {
        const article = await Article.findById(id);
        if (!article) {
            throw new Error('Article not found');
        }
        article.views = (article.views || 0) + 1;
        await article.save();
        return article;
    } catch (err) {
        console.error("Error updating article views:", err);
        return null;
    }
}

async function getArticlesByOwnerId(ownerId) {
    try {
        const articles = await Article.find({ owner: ownerId });
        return articles;
    } catch (err) {
        console.error("Error fetching articles by owner ID:", err);
        return [];
    }
}

async function hotArticles() {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 1);
    const articles = await Article.find();
    for (let article of articles) {
      const commentsCount = await comment_model.countByArticle(
        article._id,
        since
      );
      article.score = (article.views || 0) + commentsCount * 10;
    }
    articles.sort((a, b) => b.score - a.score);
    return articles.slice(0, 10);
  } catch (err) {
    console.error(err);
    return [];
  }
}

module.exports = { createArticle, getAllArticles, getArticleById, deleteArticleById, updateArticleViews,getArticlesByOwnerId,hotArticles };