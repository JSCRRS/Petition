const express = require("express");
const handlebars = require("express-handlebars");
const path = require("path");
const cookieSession = require("cookie-session");

const {
    getSignatures,
    createSignature,
    getIndividualSignature,
} = require("./signatures");

const app = express();
app.engine("handlebars", handlebars());
app.set("view engine", "handlebars");

app.use(express.static(path.join(__dirname, "public")));

//Was war das hier?
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

app.get("/", (request, response) => {
    if (request.session.signature_id) {
        response.redirect("allSigners");
        return;
    }
    response.render("register"); //redirect("register") klappt hier nicht! - response.redirect("/")
});

app.post("/register", (request, response) => {
    const { firstname, lastname, signature } = request.body;

    if (!firstname || !lastname) {
        console.log(firstname, lastname);
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
        });
    }
});

app.get("/signed", (request, response) => {
    const signature_id = request.session.signature_id;

    //Wenn der Besucher einen cookie mit id hat, dann soll er seine signature sehen:
    if (signature_id) {
        const yourID = signature_id.rows[0].id;

        getIndividualSignature(yourID).then((signature) => {
            response.render("signed", { signature });
        });
    } else {
        response.redirect("/");
    }
});

app.get("/allSigners", (request, response) => {
    getSignatures().then((signatures) => {
        response.render("allSigners", {
            signatures,
        });
    });
});

app.listen(8080);
