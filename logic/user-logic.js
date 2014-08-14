var mongoose = require("../database").mongoose,
  Schema = mongoose.Schema,
  bcrypt = require("bcrypt"),
  SALT_WORK_FACTOR = 10,
  MAX_LOGIN_ATTEMPTS = 5,
  LOCK_TIME = 2 * 60 * 60 * 1000;


var userSchema = new Schema({
  _id: {type: String, required: true},
  scope: {type: Number, required: true},
  name: {type: String, required: true},
  password: {type: String, required: true},
  loginAttempts: {type: Number, required: true, default: 0},
  lockUntil: {type: Number}
}, {collection: "internalUsers"});

userSchema.virtual('isLocked').get(function () {
  //CHECK lockUntil TIMESTAMP
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.pre("save", function (next) {
  var user = this;

  //ONLY HASH IF MODIFIED/CREATED
  if (!user.isModified("password")) {
    return next();
  }

  //GENERATE SALT
  bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
    if (err) {
      return next(err);
    }

    //HASH CONCATENATED PASSWORD AND SALT
    bcrypt.hash(user.password, salt, function (err, hash) {
      if (err) {
        return next(err);
      }

      user.password = hash;
      next();

    });
  });
});

userSchema.methods.comparePassword = function (candidate, cb) {
  bcrypt.compare(candidate, this.password, function (err, isMatch) {
    if (err) {
      return cb(err);
    }
    cb(null, isMatch);
  });
};

userSchema.methods.incLoginAttempts = function (cb) {
  // if we have a previosu lcok that has expired, restart at 1
  if (this.lockUntil && this.lockUnil < Date.now()) {
    return this.update({
      $set: {loginAttempts: 1},
      $unset: {lockUntil: 1}
    }, cb);
  }

  //otherwise increment
  var updates = {$inc: {loginAttempts: 1}};
  //lock if MAX_ATTEMPTS reached
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
    updates.$set = {lockUntil: Date.now() + LOCK_TIME};
  }

  return this.update(updates, cb);
};

var reasons = userSchema.statics.failedLogin = {
  NOT_FOUND: 0,
  PASSWORD_INCORRECT: 1,
  MAX_ATTEMPTS: 2
};

var scopes = userSchema.statics.scopes = {
  admin: 0,
  manager: 1,
  employeeSales: 2,
  employeeOrders: 3,
  user: 5
};

userSchema.statics.getAuthenticated = function (username, password, cb) {
  this.findOne({_id: username}, function (err, user) {
    if (err) {
      return cb(err);
    }
    console.log("USER", user);
    if (!user || user === null) {
      return cb(null, null, reasons.NOT_FOUND);
    }

    if (user.isLocked) {
      return user.incLoginAttempts(function (err) {
        if (err) {
          return cb(err);
        }
        return cb(null, null, reasons.MAX_ATTEMPTS);
      });
    }

    user.comparePassword(password, function (err, isMatch) {
      if (err) {
        return cb(err);
      }

      if (isMatch) {
        if (!user.loginAttempts && !user.lockUntil) {
          return cb(null, user);
        }

        var updates = {
          $set: {loginAttempts: 0},
          $unset: {lockUntil: 1}
        };

        return user.update(updates, function (err) {
          if (err) {
            return cb(err);
          }
          return cb(null, user);
        });
      }

      user.incLoginAttempts(function (err) {
        if (err) {
          return cb(err);
        }
        return cb(null, null, reasons.PASSWORD_INCORRECT);
      });
    });
  });
};
exports.User = mongoose.model('User', userSchema);