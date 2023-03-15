const session = require("express-session");
const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
dotenv.config();

const {isLoggedIn, getAccessToken, fetchGitHubUser} = require("./middleware");

const GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize?";

const app = express();
app.use(express.static("public"));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.get('/', function(req, res){
    res.send('Welcome Home');
});

//protect API with oauth2
app.get('/account', isLoggedIn, function(req, res){
    res.send(req.session.github)
});

app.get('/login', function(req, res){
    res.send(`<a href="/auth/github">Login with GitHub</a>`)
});

app.get("/auth/github",function (req, res){
    let randomString = (Math.random() + 1).toString(36).substring(2);
    const stateParam = randomString;
    res.cookie("stateParam", stateParam, { maxAge: 1000 * 60 * 5, signed: true });
    const query = {
        scope: ["user", "profile"],
        client_id: process.env.GITHUB_CLIENT_ID,
        state: stateParam,
    };

    const urlEncoded = new URLSearchParams(query).toString();
    res.redirect(
        `${GITHUB_AUTH_URL}${urlEncoded}`
    )
})

app.get("/github/callback", async (req, res) => {
        const {code, state} = req.query;
        const {stateParam} = req.signedCookies;
        if (state !== stateParam){
            res.status(422).send("Invalid State");
            return;
        }

        const access_token = await getAccessToken(
            code,
            state,
            process.env.GITHUB_CLIENT_ID,
            process.env.GITHUB_CLIENT_SECRET
        );
        req.session.token = access_token;
        const user = await fetchGitHubUser(access_token);

        if (user) {
            req.session.access_token = access_token;
            req.session.github = user;
            req.session.loggedIn = true;
            res.redirect("/account");
        } else {
            res.redirect("/auth/failure");
        }
    }
)

app.get("/logout", (req, res) => {
    req.session.destroy(function() {
        res.redirect('/');
    })
})
app.get("/auth/failure", (req, res) => {
    res.send("Login did not succeed!");
})

module.exports = app;
