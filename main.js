const expressjs = require("express");
const path = require("path");
const port = 6060;
const app = expressjs();
const mongoose = require("mongoose");
const Crypto = require("crypto-js");
const passport = require("passport");
// var MagicLinkStrategy = require('passport-magic-link').Strategy;
// var sendgrid = require('@sendgrid/mail');
var jwt = require("jsonwebtoken");
var nodemailer = require('nodemailer');

app.use(expressjs.json());
app.use(expressjs.urlencoded({ extended: true }));

const TOKEN_SECRET = "cargo";
let TOKEN;

const cookieParser = require("cookie-parser");
app.use(cookieParser());

require('./auth');
const session = require("express-session");

// require('./sendgrid');

app.use(session({
    secret: 'conda',
    resave: false,
    saveUninitialized: false,
    // cookie: { secure: true }
}));
app.use(passport.initialize());
app.use(passport.session());

const GLOBAL_PASS = "sudo-pt"

const ECINVALID = "Wrong Credentials."

const conn = mongoose.connect('mongodb://127.0.0.1:27017/user_db');
const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            require: true,
            unique: true
        },
        password: {
            type: String,
            require: true,
        },
        name: {
            type: String,
            require: true,
            unique: false
        },
    },
    {
        timestamps: true,
    }
);
const coll = mongoose.model('user', userSchema)

var email;
var login_email;

var uname;

// var otp = Math.random();
// otp = otp * 1000000;
// otp = parseInt(gen_otp);
var otp;
console.log(otp);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'email',
        pass: 'app_password',
    },
});

var mailid;
var encryptedpass;
var name;

// app.get("/conn", async (req, res) => {
//       var obj = { uid: "1", username: "sk_123", password: "sk1234"};
//       coll.create(obj);
//       res.send("Connected");
// })

app.get("/home", async (req, res) => {
    res.sendFile(path.join(__dirname, "home.html"));
})

app.get("/", async (req, res) => {
    res.sendFile(path.join(__dirname, "reg.html"));
})

app.get("/login", async (req, res) => {
    res.sendFile(path.join(__dirname, "log.html"));
})

app.post("/user_reg", async (req, res) => {
    let input_data = req.body;
    // var user_pwd = req.query.pwd;
    var user_pwd = input_data.pwd;
    var encryptedPwd = Crypto.AES.encrypt(user_pwd, GLOBAL_PASS).toString();
    // mailid = req.query.mailid;
    mailid = input_data.mailid;
    encryptedpass = encryptedPwd;
    // name = req.query.name;
    name = input_data.name;
    // var obj = {
    //     email: `${req.query.mailid}`,
    //     password: `${encryptedPwd}`,
    //     name: `${req.query.name}`
    // };
    if (input_data.mailid != "" && input_data.pwd != "" && input_data.cnfpwd != "" && input_data.name != "") {
        if (input_data.pwd == input_data.cnfpwd) {
            let query = coll.where({ email: `${input_data.mailid}` });
            let value = await query.findOne();
            if (value != null) {
                if (value.email == input_data.mailid) {
                    res.send("Account already exists with same email address.")
                }
            } else {
                res.redirect('http://localhost:6060/register_user');
                // coll.create(obj);
                // res.send(`Account created successfully. <a href="http://localhost:6060/login">Login here</a>`);
            }
        } else {
            res.send(ECINVALID);
        }
    } else {
        res.send(ECINVALID);
    }
    // var decP = Crypto.AES.decrypt(encryptedPwd, GLOBAL_PASS).toString();
    // var de = decP.toString(Crypto.enc.Utf8);
    // var decryptedP = Crypto.AES.decrypt(encryptedPwd, GLOBAL_PASS).toString();
    // var dec = decryptedP.toString(Crypto.enc.Utf8);
    // console.log(dec);
    // console.log(de);
})

app.post("/user_lg", async (req, res) => {
    let input_data = req.body;
    // let usr_pwd = req.query.pwd;
    let usr_pwd = input_data.pwd;
    var encryptedPass = Crypto.AES.encrypt(usr_pwd, GLOBAL_PASS).toString();
    var decryptedPass = Crypto.AES.decrypt(encryptedPass, GLOBAL_PASS).toString();
    var encrp = decryptedPass.toString(Crypto.enc.Utf8);
    console.log(`enc == ${encrp}`);
    // let query = coll.where({ email: `${req.query.userid}` });
    let query = coll.where({ email: `${input_data.userid}` });
    let value = await query.findOne();
    if (input_data.userid != "" && input_data.pwd != "") {
        if (value != null) {
            console.log(value.email);
            mailid = value.email;
            uname = value.name;
            let pswd = value.password;
            var decryptedPwd = Crypto.AES.decrypt(pswd.trim().toString(), GLOBAL_PASS).toString();
            var decrypt = decryptedPwd.toString(Crypto.enc.Utf8);
            console.log(`dec == ${decrypt}`);
            // if (value.email == req.query.userid && decrypt == encrp) {
            if (value.email == input_data.userid && decrypt == encrp) {
                res.redirect('http://localhost:6060/login_otp');
                // res.send(`Hey ${value.name},<br>You have successfully logged in.`);
            } else {
                res.send(ECINVALID);
            }
        } else {
            res.send(ECINVALID);
        }
    } else {
        res.send(ECINVALID);
    }
})

async function isLogged(req, res, next) {
    req.user ? next() : res.sendStatus(401);
}

app.get("/auth/google",
    passport.authenticate('google', { scope: ['email', 'profile'] })
);

app.get("/google/callback",
    passport.authenticate('google', {
        successRedirect: 'http://localhost:6060/user',
        failureRedirect: 'http://localhost:6060/fail'
    })
);

app.get("/logout", async (req, res, next) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('http://localhost:6060/');
    });
})

app.get("/user", isLogged, async (req, res) => {
    res.send(`<img src="${req.user.picture}" width="100" height="100" alt="${req.user.given_name}"><br><br>Hey <b>${req.user.displayName}</b>,<br>You've logged in with <b>${req.user.email}</b><br><br><br><a href="http://localhost:6060/logout">Logout</a>`);
    console.log(req.user);
})

app.get("/fail", async (req, res) => {
    res.send("Failed to connect.");
})

// app.get("/mongo", async (req, res) => {
//     try {
//         conn = await client.connect();
//         var database = conn.db("mongo_node");
//         var obj = { name: "abc", age: "20"};
//         database.collection("demo").insertOne(obj, async(res, err)=>{ console.log(err)});
//         // console.log(conn);
//         console.log(database);
//       } catch(e) {
//         console.error(e);
//       }
// })

app.listen(port, async (req, res) => {
    console.log(`listening to port ${port}`);
})

// ----------------------------------------------------------------
app.get("/register_user", async (req, res) => {
    var _otp = Math.random();
    _otp = _otp * 1000000;
    otp = parseInt(_otp);
    var mailOptions = {
        to: mailid,
        subject: "OTP FOR SIGNUP",
        html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>" // html body
    };
    // var mailOptions = {
    //     from: 'spsuthar600@gmail.com',
    //     to: `${receiver}`,
    //     subject: 'OTP',
    //     text: 'Hey user.'
    //   };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            res.send(error);
            console.log(error);
        } else {
            // res.send(`Mail sent to <b>${email}</b>.`);
            res.redirect('http://localhost:6060/verify_otp');
            console.log('Email sent: ' + info.response);
        }
    });
    // res.sendFile(path.join(__dirname, "email.html"));
})

app.get('/verify', function (req, res) {
    var obj = {
        email: `${mailid}`,
        password: `${encryptedpass}`,
        name: `${name}`
    };
    if (parseInt(req.query.otp) == otp) {
        coll.create(obj);
        res.send(`Account created successfully. <a href="http://localhost:6060/login">Login here</a>`);;
    }
    else {
        res.send('otp is incorrect');
    }
});

app.get("/login_otp", async (req, res) => {
    var _otp = Math.random();
    _otp = _otp * 1000000;
    otp = parseInt(_otp);
    var mailOptions = {
        to: mailid,
        subject: "OTP FOR SIGNIN",
        html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>"
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            res.send(error);
            console.log(error);
        } else {
            res.redirect('http://localhost:6060/loginotp');
            console.log('Email sent: ' + info.response);
        }
    });
})

app.get('/log_verify', function (req, res) {
    if (parseInt(req.query.otp) == otp) {
        res.send(`Hey ${uname},<br>You have successfully logged in.`);
    }
    else {
        res.send('otp is incorrect');
    }
});

app.get('/resend', function (req, res) {
    var _otp = Math.random();
    _otp = _otp * 1000000;
    otp = parseInt(_otp);
    var mailOptions = {
        to: mailid,
        subject: "OTP RESEND",
        html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>"
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            res.send(error);
            return console.log(error);
        }
        res.redirect('http://localhost:6060/verify_otp');
    });
});

app.get('/resend_otp', function (req, res) {
    var _otp = Math.random();
    _otp = _otp * 1000000;
    otp = parseInt(_otp);
    var mailOptions = {
        to: mailid,
        subject: "OTP RESEND",
        html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>"
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            res.send(error);
            return console.log(error);
        }
        res.redirect('http://localhost:6060/loginotp');
    });
});

app.get("/otp", async (req, res) => {
    res.sendFile(path.join(__dirname, "email.html"));
})

app.get("/verify_otp", async (req, res) => {
    res.sendFile(path.join(__dirname, "otp.html"));
})

app.get("/loginotp", async (req, res) => {
    res.sendFile(path.join(__dirname, "login_otp.html"));
})

app.get("/magiclink", async (req, res) => {
    res.sendFile(path.join(__dirname, "magic-email.html"));
})

app.get("/dashboard", async (req, res) => {
    res.sendFile(path.join(__dirname, "dashboard.html"));
})

app.get("/get_token", async (req, res) => {
    let query = coll.where({ email: `${req.query.emailid}` });
    let value = await query.findOne();
    if (value != null) {
        let email = value.email;
        // var token = jwt.sign(email, TOKEN_SECRET, { expiresIn: 60 * 60 });
        TOKEN = jwt.sign({ email }, TOKEN_SECRET, { expiresIn: '300s' });
        console.log(TOKEN);
        var mailOptions = {
            to: email,
            subject: "Magic Link",
            html: "<p>Click on the link</p>" + "<p> http://localhost:6060/verify_token?token=" + TOKEN + "</p>"
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                res.send(error);
                console.log(error);
            } else {
                res.send('Link sent to registered email address.');
                console.log('Email sent: ' + info.response);
            }
        });
    } else {
        res.send(`User is not registered.  <a href="http://localhost:6060/">REGISTER NOW</a>`);
    }
})

app.get("/verify_token", async (req, res) => {
    jwt.verify(req.query.token, TOKEN_SECRET, async (err, user) => {
        if (user != null) {
            let query = coll.where({ email: `${user.email}` });
            let value = await query.findOne();
            if (err) return res.sendStatus(403)
            if (value.email == user.email) {
                console.log(user.email);
                res.redirect(`http://localhost:6060/dashboard`);
            }
        } else {
            res.send("link expired.");
        }
    })
})

app.post('/pf', function (req, res) {
    var dataAll = req.body;
    console.log(dataAll.name);
});


module.exports = { uname, mailid };