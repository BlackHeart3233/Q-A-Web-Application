const mongoose  = require('mongoose');
const connection = require('../bin/www');
const User = require('./users');


const subCommentSchema  = new mongoose.Schema({
    content: String,
    date: Date,
    owner_comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'mainComment'
    },
    owner_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
});

const SubComment = mongoose.model('subComment', subCommentSchema );

async function createSubComment(content, owner_comment, owner_user) {
    try {
        if(!content || !owner_comment || !owner_user) {
        throw new Error('Missing required fields');
        }
        const newSubComment = new SubComment({
        content,
        date: new Date(),
        owner_comment: new mongoose.Types.ObjectId(owner_comment),
        owner_user: new mongoose.Types.ObjectId(owner_user)
    });
    await newSubComment.save();
    return newSubComment;
} catch (err) {
    console.error("Error creating sub comment:", err);
    return null;
    }
}

async function removeSubCommentsByCommentId(commentId) {
    try {
        if (!mongoose.Types.ObjectId.isValid(commentId)) return false;
        await SubComment.deleteMany({ owner_comment: new mongoose.Types.ObjectId(commentId) });
        return true;
    } catch (err) {
        console.error("Error deleting sub comments:", err);
        return false;
    }
}

async function getSubCommentsByCommentId(commentId) {
  try {
    if (!commentId) return [];

    const comments = await SubComment.find({
      owner_comment: commentId   // ✅ NO casting
    })
    .populate('owner_user')
    .sort({ date: 1 });

    return comments;
  } catch (err) {
    console.error("Error fetching sub comments:", err);
    return [];
  }
}

async function removeSubComment(subCommentId) {
    try {
        if (!mongoose.Types.ObjectId.isValid(subCommentId)){
                console.error("Invalid sub comment ID:", subCommentId);
                return false;
        }
        await SubComment.findByIdAndDelete(subCommentId);
        return true;
    } catch (err) {
        console.error("Error deleting sub comment:", err);
        return false;
    }
}

module.exports = {
    createSubComment,
    getSubCommentsByCommentId,
    removeSubCommentsByCommentId,
    removeSubComment
};
