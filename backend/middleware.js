const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const authenticationKey = (req, response, next) => {
    let api_key = req.header("x-api-key");
    if (api_key === process.env.API_KEY) {
        next();
    } else {
        response.status(403).send({error: {code: 403, message: "You not allowed."}});
    }
}

async function getAccessToken(code, state, client_id, client_secret, redirect_uri) {
    const request = await fetch(GITHUB_TOKEN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            client_id,
            client_secret,
            code,
            state,
            redirect_uri
        })
    });
    const text = await request.text();
    const params = new URLSearchParams(text);
    return params.get("access_token");
}

async function fetchGitHubUser(token) {
    const request = await fetch("https://api.github.com/user", {
        headers: {
            Authorization: "token " + token
        }
    });
    return await request.json();
}

function isLoggedIn(req, res, next) {
    req.session.loggedIn ?
        next() :
        res.status(403).send({
            error: {
                code: 403,
                message: "You not allowed."
            }
        })
}

module.exports = {
    authenticationKey,
    getAccessToken,
    fetchGitHubUser,
    isLoggedIn
};
