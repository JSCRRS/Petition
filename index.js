const express = require("express");
const handlebars = require("express-handlebars");
const path = require("path");

const { getSignatures, createSignature } = require("./signatures");

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

app.get("/", (request, response) => {
    response.render("register"); //redirect("register") klappt hier nicht!
});

app.post("/register", (request, response) => {
    const { firstname, lastname, signature } = request.body;
    console.log(request.body);

    if (!firstname || !lastname) {
        console.log(firstname, lastname);
        const error = "You forgot some details!";
        response.render("register", { error });
        return;
    } else {
        createSignature({
            firstname: `${firstname}`,
            lastname: `${lastname}`,
            signature: "someSIGNATURRREEE",
        }).then(() => {
            console.log("saved!");
        });
        response.redirect("signed");
    }
});

app.get("/signed", (request, response) => {
    response.render("signed");
});

app.get("/allSigners", (request, response) => {
    getSignatures().then((signatures) => {
        response.render("allSigners", {
            signatures,
        });
    });
});

app.listen(8080);
