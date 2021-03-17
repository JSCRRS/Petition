const express = require("express");
const handlebars = require("express-handlebars");
const path = require("path");
const cookieSession = require("cookie-session");
const csurf = require("csurf");

const {
    getSignatures,
    getNumberOfSignatures,
    registerUser,
    createSignature,
    getIndividualSignature,
    getUserByEmail,
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

app.get("/login", (response, request) => {
    response.render("login");
});
/*
app.get("/login", (response, request) => {      // FUNKTIONIER NICHT!
    if (request.session.user_id) {
        response.render("login");
        return;
    }
    response.redirect("signed");
    return;
});
*/

app.post("/login", (request, response) => {
    const email = request.body.email;
    const password = request.body.password;

    if (!email || !password) {
        response.render("login", { error: "need all your credentials" });
        return;
    } else {
        getUserByEmail(email)
            .then((user) => {
                console.log(user);
                if (!user) {
                    return { user, match: false };
                }
                return { user, match: compare(password, user.password_hash) }; //im query wurde die ganze row des users abgeholt
            })
            .then(({ user, match }) => {
                if (!match) {
                    response.render("login", { error: "wrong credentials" });
                    return;
                }
                request.session.user_id = user.id;
                response.redirect("signed");
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
        response.render("registration", { error: "Something happened" });
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
                    response.render("yourSign");
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
        const error = "we need you signature!";
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

//GET ALL SIGNERS

app.get("/allSigners", (request, response) => {
    getSignatures().then((signatures) => {
        response.render("allSigners", {
            signatures,
        });
        return;
    });
});

app.listen(process.env.PORT || 8080);
