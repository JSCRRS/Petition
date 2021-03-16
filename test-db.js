const spicedPg = require("spiced-pg");

const { username, password } = require("./data.json");

const database = "testing";

const db = spicedPg(
    `postgres:${username}:${password}@localhost:5432/${database}`
);

function login(email, password) {
    return db
        .query("SELECT * FROM users")
        .then((result) => {
            console.log(result);
            if (result.rows[0].email !== email) {
                console.log("nein");
                return;
            }
            if (result.rows[0].password_hash !== password) {
                console.log("nein2");
                return;
            }
            console.log("yes!");
            return;
        })
        .catch((error) => console.log(error));
}

module.exports = {
    login,
};
/*
    // first, let's check if there is an user with given email:
    return findUserByEmail(email, password).then((foundUser) => {
        if (!foundUser) {
            // if not, just return false
            return null;
        }
        if (password !== foundUser.password) {
            // if request password and stored password do not match,
            // return false
            return null;
        }
        // if we arrived here, it means that the email exists
        // AND the password match - login is successful!
        return foundUser;
    });
}
*/
