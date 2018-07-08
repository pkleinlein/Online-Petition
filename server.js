const express = require("express");
const app = express();
const hb = require("express-handlebars");
const cookieSession = require("cookie-session");
const db = require("./db.js");
const csurf = require("csurf");
var profile = 0;

app.use(
    require("body-parser").urlencoded({
        extended: false
    })
);

app.use(require("cookie-parser")());

app.use(express.static(__dirname + "/public"));

app.use(
    cookieSession({
        secret: "Nobody knows what i know",
        maxAge: 1000 * 60 * 60 * 24 * 14
    })
);
app.engine("handlebars", hb());
app.set("view engine", "handlebars");
app.use(express.static("public"));
app.use(csurf());
app.use(function(req, res, next) {
    res.setHeader("X-Frame-Option", "DENY");
    res.locals.csrfToken = req.csrfToken();
    next();
});

function requireNoSignature(req, res, next) {
    if (req.session.sigId) {
        return res.redirect("/thanks");
    } else {
        next();
    }
}

function requireSignature(req, res, next) {
    if (!req.session.sigId) {
        return res.redirect("/petition");
    } else {
        next();
    }
}
function requireUserId(req, res, next) {
    if (!req.session.userId) {
        res.redirect("/register");
    } else {
        next();
    }
}

function requireNoUserId(req, res, next) {
    if (req.session.userId) {
        res.redirect("/petition");
    } else {
        next();
    }
}

//---------------------------------------------------------------------------
//------------------------------ROUTES---------------------------------------
//---------------------------------------------------------------------------

app.get("/", function(req, res) {
    res.redirect("/petition");
});
app.get("/login", requireNoUserId, function(req, res) {
    res.render("login", {
        layout: "main"
    });
});
app.post("/login", (req, res) => {
    let first, sur, id;
    db
        .getUserByEmail(req.body.loginEmail)
        .then(function(result) {
            first = result.rows[0].first;
            sur = result.rows[0].sur;
            id = result.rows[0].id;
            return db.checkPassword(
                req.body.loginPass,
                result.rows[0].password
            );
        })
        .then(function(result) {
            if (result == false) {
                throw new Error();
            } else {
                req.session.first = first;
                req.session.sur = sur;
                req.session.userId = id;
            }
        })
        .then(function() {
            return db.getSigId(id);
        })
        .then(function(data) {
            req.session.sigId = data.rows[0].id;
        })
        .catch(function() {
            req.session.sigId = null;
        })
        .then(function() {
            return res.redirect("/thanks");
        })
        .catch(function(err) {
            console.log(err);
            res.render("login", {
                layout: "main",
                error: "error"
            });
        });
});

app.get("/register", requireNoUserId, function(req, res) {
    res.render("register", {
        layout: "main"
    });
});
app.post("/register", function(req, res) {
    db
        .hashPassword(req.body.passwordReg)
        .then(function(hashedPass) {
            return db.register(
                req.body.firstReg,
                req.body.surReg,
                req.body.emailReg,
                hashedPass
            );
        })
        .then(function(results) {
            // console.log("THIS IS THE USER ID: ", results);
            req.session.userId = results.rows[0].id;
            req.session.first = results.rows[0].first;
            req.session.sur = results.rows[0].sur;
        })
        .then(function() {
            res.redirect("/petition");
        })
        .catch(function(err) {
            console.log(err);
            res.render("register", {
                layout: "main"
            });
        });
});
app.get("/profile", requireUserId, function(req, res) {
    res.render("profile", {
        layout: "main"
    });
});

app.post("/profile", function(req, res) {
    if(req.session.proId){
        res.redirect("/edit");
    }
    db
        .updateProfile(
            req.body.cityPro,
            req.body.agePro,
            req.body.petPro,
            req.session.userId
        )
        .then(function() {
            profile = req.session.userId;
            req.session.proId = profile;
            res.redirect("/petition");
        })
        .catch(function(err) {
            console.log(err);
        });
});
app.get("/edit", requireUserId,  (req, res) => {
    db
        .getProfile(req.session.userId)
        .then(function(result) {
            res.render("edit", {
                layout: "main",
                signer: result.rows[0]
            });
        })
        .catch(function(err) {
            console.log("profile edit error  ", err);
        });
});

app.post("/edit", (req, res) => {
    const { first, sur, email, age, city, pet, password } = req.body;
    const { userId } = req.session;
    if (password) {
        db
            .hashPassword(password)
            .then(function(hashedPassword) {
                Promise.all([
                    db.updateUser(first, sur, email, hashedPassword, userId),
                    db.updateUserProfile(age, city, pet, userId)
                ]);
            })
            .then(function() {
                return res.redirect("/thanks");
            })
            .catch(function(err) {
                console.log(err);
            });
    }
    else {
        res.send("<h1> Wrong password, go back </h1>");
    }
});

app.get("/petition", requireUserId, requireNoSignature, function(req, res) {
    res.render("home", {
        layout: "main"
    });
});

app.post("/petition", requireNoSignature, function(req, res) {
    db
        .signSignature(
            req.session.userId,
            req.session.first,
            req.session.sur,
            req.body.sig
        )
        .then(function(result) {
            var sesId = result.rows[0].id;
            req.session.sigId = sesId;
            res.redirect("/thanks");
        })
        .catch(function(err) {
            console.log("this is the " + err);
            res.end();
        });
});

app.get("/thanks", requireSignature, requireUserId, function(req, res) {
    db
        .getSignatureById(req.session.sigId)
        .then(function(result) {
            res.render("thanks", {
                layout: "main",
                sig: result.rows[0].sig,
                count: req.session.sigId
            });
        })
        .catch(function(err) {
            console.log("this is the error ", err);
        });
});
app.get("/signers", requireSignature, requireUserId, function(req, res) {
    db
        .getSigners(`SELECT first, sur FROM signatures`)
        .then(function(result) {
            res.render("signers", {
                layout: "main",
                signers: result.rows
            });
        })
        .catch(function(err) {
            console.log("this is the /singers catch", err);
        });
});
app.get("/logout", function(req, res) {
    req.session = null;
    res.redirect("/petition");
});

app.listen(process.env.PORT || 8080, () => console.log("petition-server listening on port8080"));
