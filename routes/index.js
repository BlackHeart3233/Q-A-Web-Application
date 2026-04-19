var express = require('express');
var router = express.Router();
const model = require('../models/users');

/* GET home page. */
router.get('/', async function(req, res, next) {
  if(req.session.userId){
    const user = await model.getUserInfo(req.session.userId);
    res.render("users/profile", { user });
  }else{
    res.render("users/login", { error_message: null });
  }
});

module.exports = router;
