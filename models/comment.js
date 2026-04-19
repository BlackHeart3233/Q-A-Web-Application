const mongoose  = require('mongoose');
const connection = require('../bin/www');
const User = require('./users');


const mainCommentSchema  = new mongoose.Schema({
    content: String,
    date: Date,
    votes: Number,
    owner_article: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'article'
    },
    owner_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    Accepted: {
        type: Boolean,
        default: false
    }
});

const MainComment = mongoose.model('mainComment', mainCommentSchema );

async function createMainComment(content, owner_article, owner_user) {
    try {
    if(!content || !owner_article || !owner_user) {
      throw new Error('Missing required fields');
    }
    const newMainComment = new MainComment({
    content,
    date: new Date(),
    votes: 0,
    owner_article: new mongoose.Types.ObjectId(owner_article),
    owner_user: new mongoose.Types.ObjectId(owner_user),
    Accepted: false
    });
    await newMainComment.save();
    return newMainComment;
  } catch (err) {
    console.error("Error creating main comment:", err);
    return null;
  }
}

async function getMainCommentsByArticleId(articleId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(articleId)) return [];
    console.log(`Fetching main comments for article ID: ${articleId}`);
    const comments = await MainComment.find({
      owner_article: new mongoose.Types.ObjectId(articleId)
    })
    .populate('owner_user')
    .sort({ Accepted: -1, date: -1 });
    return comments;
  } catch (err) {
    console.error("Error fetching main comments:", err);
    return [];
  }
}

async function getCommentById(commentId) {
    try {
        const comment = await MainComment.findById(commentId).populate('owner_user');
        return comment;
    } catch (err) {
        console.error("Error fetching comment by ID:", err);
        return null;
    }
}

async function deleteCommentById(commentId) {
    try {
        await MainComment.findByIdAndDelete(commentId);
        return true;
    } catch (err) {
        console.error("Error deleting comment by ID:", err);
        return false;
    }
}     

async function acceptComment(commentId) {
    try {
        const comment = await MainComment.findById(commentId);
        if (!comment) {
            throw new Error('Comment not found');
        }
        comment.Accepted = true;
        await comment.save();
    } catch (err) {
        console.error("Error accepting comment:", err);
        throw err;
    }
}

async function removeAcceptComment(commentId) {
    try {
        const comment = await MainComment.findById(commentId);
        if (!comment) {
            throw new Error('Comment not found');
        }
        comment.Accepted = false;
        await comment.save();
    } catch (err) {
        console.error("Error removing accepted status from comment:", err);
        throw err;
    }
}
async function deleteCommentsByArticleId(articleId) {
    try {
        await MainComment.deleteMany({
        owner_article: new mongoose.Types.ObjectId(articleId)
        });
    } catch (err) {
        console.error("Error deleting comments by article ID:", err);
        throw err;
    }
}

async function upvoteComment(commentId) {
    try {
        const comment = await MainComment.findById(commentId);
        if (!comment) {
            throw new Error('Comment not found');
        }
        comment.votes += 1;
        await comment.save();
    } catch (err) {
        console.error("Error upvoting comment:", err);
        throw err;
    }
}

async function downvoteComment(commentId) { 
    try {
        const comment = await MainComment.findById(commentId);
        if (!comment) {
            throw new Error('Comment not found');
        }
        comment.votes -= 1;
        await comment.save();
    } catch (err) {
        console.error("Error downvoting comment:", err);
        throw err;
    }
}

async function getCommentsByUserId(userId) {
  try {
    const comments = await MainComment.find({
      owner_user: new mongoose.Types.ObjectId(userId)
    })
    .populate('owner_article', 'title')
    .sort({ date: -1 });
    console.log(`Fetched ${comments.length} comments for user ID ${userId}`);

    return comments;
  } catch (err) {
    console.error("Error fetching comments:", err);
    return [];
  }
}

async function countByArticle(articleId, since = null) {
  const query = { owner_article: articleId };
  if (since) {
    query.date = { $gte: since };
  }
  return await MainComment.countDocuments(query);
}

module.exports = {
    createMainComment,
    getMainCommentsByArticleId,
    getCommentById,
    deleteCommentById,
    acceptComment,
    removeAcceptComment,
    deleteCommentsByArticleId,
    downvoteComment,
    upvoteComment,
    getCommentsByUserId,
    countByArticle
};

module.exports.MainComment = MainComment;