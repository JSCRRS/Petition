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
    getUserById,
    updateUsersTable,
    updateUserProfilesTable,
    deleteSignature,
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
    response.redirect("registration");
});

//LOGIN

app.get("/login", (request, response) => {
    response.render("login", { title: "login" });
});

app.post("/login", (request, response) => {
    const email = request.body.email;
    const password = request.body.password;

    if (!email || !password) {
        response.render("login", {
            error: "need all your credentials",
            title: "login",
        });
        return;
    }
    getUserByEmail(email)
        .then((user) => {
            if (!user) {
                response.render("login", {
                    title: "login",
                    error: "check email",
                });
                return;
            }
            compare(password, user.password_hash).then((match) => {
                if (!match) {
                    response.render("login", {
                        title: "login",
                        error: "check password",
                    });
                    return;
                }
                request.session.user_id = user.id;
                response.redirect("signed");
            });
        })
        .catch((error) => {
            console.log(error);
            response.render("login", {
                error: "something went wrong",
                title: "login",
            });
        });
});

//REGISTER

app.get("/registration", (request, response) => {
    if (request.session.user_id) {
        response.redirect("login");
        return;
    }
    response.render("registration", { title: "registration" });
});

app.post("/registration", (request, response) => {
    const { firstname, lastname, email, password } = request.body;

    if (!firstname || !lastname || !email || !password) {
        response.render("registration", { error: "provide all information" });
        return;
    }
    hash(request.body.password).then((password_hash) => {
        return registerUser({
            firstname: `${firstname}`,
            lastname: `${lastname}`,
            email: `${email}`,
            password_hash,
        })
            .then((id) => {
                request.session.user_id = id;
                response.redirect("profile");
            })
            .catch((error) => {
                console.log(error);
                response.render("registration", {
                    error: "check your credentials",
                });
            });
    });
});

// SIGN

app.get("/yourSign", (request, response) => {
    response.render("yourSign", { title: "sign" });
});

app.post("/yourSign", (request, response) => {
    const { signature } = request.body;
    const user_id = request.session.user_id;

    if (!signature) {
        response.render("yourSign", { error: "provide your signature" });
        return;
    }
    createSignature({
        user_id,
        signature,
    })
        .then(() => {
            response.redirect("signed");
        })
        .catch((error) => {
            console.log(error);
            response.render("yourSign", {
                error: "could not create signature",
            });
        });
});

//DISPLAY INDIVIDUAL SIGNATURE

app.get("/signed", (request, response) => {
    const user_id = request.session.user_id;

    if (!user_id) {
        response.redirect("registration");
        return;
    }
    Promise.all([getIndividualSignature(user_id), getNumberOfSignatures()])
        .then(([signature, numbers]) =>
            response.render("signed", {
                signature,
                numbers,
                title: "signature",
            })
        )
        .catch((error) => {
            console.log("error loading your singature", error);
            response.render("signed", {
                //render
                title: "signature",
            });
        });
});

// DELETE SIGNATURE

app.post("/signed", (request, response) => {
    const user_id = request.session.user_id;
    deleteSignature(user_id)
        .then(() => response.redirect("signed"))
        .catch((error) => console.log(error));
});

// USER PROFILE

app.get("/profile", (request, response) => {
    if (request.session.user_id) {
        response.render("profile", { title: "profile" });
        return;
    }
    response.render("registration");
});

app.post("/profile", (request, response) => {
    const { age, city, url } = request.body;
    const user_id = request.session.user_id;
    if (!age && !city && !url) {
        response.redirect("yourSign");
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
    const user_id = request.session.user_id;
    if (!user_id) {
        response.redirect("registration");
        return;
    }

    getAllSignedUsersDetails()
        .then((details) => {
            response.render("allSigners", {
                details,
                title: "all",
            });
        })
        .catch((error) => console.log(error));
});

// GET ALL SIGNERS RESP. CITY

app.get("/allSigners/:city", (request, response) => {
    const user_id = request.session.user_id;
    if (!user_id) {
        response.redirect("registration");
        return;
    }
    const { city } = request.params;
    getSignaturesByCity(city)
        .then((details) => {
            response.render("signaturesByCity", {
                city,
                details,
                title: `${city}`,
            });
        })

        .catch((error) => console.log(error));
});

// UPDATE USER PROFILE

app.get("/profile/edit", (request, response) => {
    const user_id = request.session.user_id;
    if (!user_id) {
        response.redirect("registration");
        return;
    }
    getUserById(user_id).then((details) => {
        response.render("editUserProfile", {
            title: "edit",
            details,
        });
    });
});

app.post("/profile/edit", (request, response) => {
    const user_id = request.session.user_id;
    const password = request.body.password;

    if (password) {
        hash(password).then((newPassword_hash) => {
            updateUsersTable({
                newPassword_hash,
                user_id,
                ...request.body,
            });
        });
    }
    Promise.all([
        updateUsersTable({
            user_id,
            ...request.body,
        }),
        updateUserProfilesTable({
            user_id,
            ...request.body,
        }),
    ])
        .then(() => {
            getUserById(user_id).then((details) => {
                response.render("editUserProfile", {
                    title: "edit",
                    details,
                    update: "updated",
                });
            });
        })
        .catch((error) => {
            console.log("error updating your profile", error);
            response.render("editUserProfile", {
                title: "edit",
                error: "error updating your profile",
            });
        });
    /*     Promise.all([
        updateUsersTable({
            password,
            user_id,
            ...request.body,
        }),
        updateUserProfilesTable({
            user_id,
            ...request.body,
        }),
    ]).then(() => {
        getUserById(user_id).then((details) => {
            console.log("hier sind detail", details);
            response.render("editUserProfile", {
                details,
            });
        });
    }); */
});

app.listen(process.env.PORT || 8080);
