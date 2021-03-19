const express = require("express");
const handlebars = require("express-handlebars");
const path = require("path");
const cookieSession = require("cookie-session");
const csurf = require("csurf");

const {
    getAllSignedUsersDetails,
    getNumberOfSignatures,
    registerUser,
    createSignature,
    getIndividualSignature,
    getUserByEmail,
    createUserProfile,
    getSignaturesByCity,
} = require("./signatures");

const { compare, hash } = require("./password");

const app = express();
app.engine("handlebars", handlebars());
app.set("view engine", "handlebars");

app.use(express.static(path.join(__dirname, "public")));

app.use(
    express.urlencoded({
        extended: false,
    })
);

app.use(
    cookieSession({
        secret: "You have signed!",
        maxAge: 1000 * 60 * 60 * 24 * 7,
    })
);

app.use(csurf());

//vs. clickjacking
app.use((request, response, next) => {
    response.setHeader("x-frame-options", "deny");
    next();
});

app.use((request, response, next) => {
    response.locals.csrfToken = request.csrfToken();
    next();
});

app.get("/", (request, response) => {
    if (request.session.user_id) {
        response.redirect("signed");
        return;
    }
    response.render("registration");
    return;
});

//LOGIN

app.get("/login", (request, response) => {
    response.render("login");
});

app.post("/login", (request, response) => {
    const email = request.body.email;
    const password = request.body.password;

    if (!email || !password) {
        response.render("login", { error: "need all your credentials" });
        return;
    } else {
        getUserByEmail(email)
            .then((user) => {
                // log die ganzen daten des users aus dem user table:
                console.log(user);
                if (!user) {
                    response.render("login", {
                        error: "no such user",
                    });
                    return;
                }
                compare(password, user.password_hash).then((match) => {
                    if (!match) {
                        response.render("login", {
                            error: "check credentials",
                        });
                        return;
                    }
                    request.session.user_id = user.id;
                    response.redirect("signed");
                    return;
                });
            })
            .catch((error) => {
                console.log(error);
                response.render("login", {
                    error: "something went wrong",
                });
            });
    }
});

//REGISTER

app.post("/registration", (request, response) => {
    const { firstname, lastname, email, password } = request.body;

    if (!firstname || !lastname || !email || !password) {
        response.render("registration", { error: "provide all information" });
        return;
    } else {
        hash(request.body.password).then((password_hash) => {
            return registerUser({
                firstname: `${firstname}`,
                lastname: `${lastname}`,
                email: `${email}`,
                password_hash,
            })
                .then((id) => {
                    request.session.user_id = id;
                    response.redirect("profile"); //vorher:response.render("yourSign")
                    return;
                })
                .catch((error) => {
                    console.log(error);
                    response.render("registration", {
                        error: "Something went wrong!",
                    });
                });
        });
    }
});

// SIGN

app.post("/yourSign", (request, response) => {
    const { signature } = request.body;
    const user_id = request.session.user_id;

    if (!signature) {
        const error = "provide your signature";
        response.render("yourSign", { error });
        return;
    } else {
        createSignature({
            user_id,
            signature,
        })
            .then(() => {
                response.redirect("signed"); //oder render?? -- wenn man kein app.get("/signed") hat, wird es auch nicht redirect...
            })
            .catch((error) => {
                console.log(error);
                response.render("yourSign", {
                    error: "something went wrong", //der error KLAPPT!!
                });
            });
    }
});

//DISPLAY INDIVIDuAL SIGNATURE

app.get("/signed", (request, response) => {
    const user_id = request.session.user_id;

    //Wenn der Besucher einen cookie mit id hat, dann soll er seine signature sehen:
    if (user_id) {
        Promise.all([
            getIndividualSignature(user_id),
            getNumberOfSignatures(),
        ]).then(([signature, numbers]) =>
            response.render("signed", {
                signature,
                numbers,
            })
        );
    } else {
        response.redirect("/");
        return;
    }
});

// USER PROFILE

app.get("/profile", (request, response) => {
    if (request.session.user_id) {
        response.render("profile");
        return;
    }
    response.render("registration");
    return;
});

//dann app.post und response.render("yourSign")
app.post("/profile", (request, response) => {
    const { age, city, url } = request.body;
    const user_id = request.session.user_id;
    if (!age && !city && !url) {
        response.redirect("/");
        return;
    }
    createUserProfile({
        age: `${age}`,
        city: `${city}`,
        url: `${url}`,
        user_id: `${user_id}`,
    })
        .then(() => response.render("yourSign"))
        .catch((error) => console.log(error));
});

//GET ALL SIGNERS

app.get("/allSigners", (request, response) => {
    getAllSignedUsersDetails().then((details) => {
        response.render("allSigners", {
            details,
        });
        return;
    });
});

// GET ALL SIGNERS RESP. CITY

app.get("/allSigners/:city", (request, response) => {
    const { city } = request.params;
    getSignaturesByCity(city)
        .then((details) => {
            response.render("signaturesByCity", {
                city,
                details,
            });
        })

        .catch((error) => console.log(error));
});

app.listen(process.env.PORT || 8080);
