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
} = require("./signatures");

const { compare, hash } = require("./password");
const { request } = require("express");

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
        response.redirect("allSigners");
        return;
    }
    response.render("registration"); //redirect("register") klappt hier nicht! - response.redirect("/")
    return;
});

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

/*
app.post("/register", (request, response) => {
    const { firstname, lastname, signature } = request.body;

    if (!firstname || !lastname) {
        const error = "You forgot some details!";
        response.render("register", { error });
        return;
    } else {
        createSignature({
            firstname: `${firstname}`,
            lastname: `${lastname}`,
            signature: `${signature}`,
        }).then((id) => {
            //gib der Person, die sich erfolgreich registriert hat einen cookie:
            request.session.signature_id = id;
            response.redirect("signed");
            return;
        });
    }
});
*/

app.post("/yourSign", (request, response) => {
    const { signature } = request.body;
    const user_id = request.session.user_id;

    if (!signature) {
        const error = "We need you signature!";
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
                    error: "Something went wrong!", //der error KLAPPT!!
                });
            });
    }
});

app.get("/signed", (request, response) => {
    const user_id = request.session.user_id;
    console.log(user_id);
    console.log("SJSJSJSJS");

    //Wenn der Besucher einen cookie mit id hat, dann soll er seine signature sehen:
    if (user_id) {
        const yourID = user_id.rows[0].id;
        console.log(yourID);
        Promise.all([
            getIndividualSignature(yourID),
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

app.get("/allSigners", (request, response) => {
    getSignatures().then((signatures) => {
        response.render("allSigners", {
            signatures,
        });
        return;
    });
});

app.listen(8080);
