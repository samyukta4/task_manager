'use-strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema,
    passportLocalMongoose = require("passport-local-mongoose");
    

const User = new Schema({
    email:String,
	state:Object,
	reminders:[{"Event":"","date":""}]
});

User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);