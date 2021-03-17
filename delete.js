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
                    return { user, match: false };
                }
                // log true oder false:
                compare(password, user.password_hash).then((result) =>
                    console.log(result)
                );
                return { user, match: compare(password, user.password_hash) }; //im query wurde die ganze row des users abgeholt
            })
            .then(({ user, match }) => {
                if (match === false) {
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
