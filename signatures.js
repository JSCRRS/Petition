const spicedPg = require("spiced-pg");

const { username, password } = require("./data.json");

const database = "signatures";

const db = spicedPg(
    `postgres:${username}:${password}@localhost:5432/${database}`
);

function registerUser({ firstname, lastname, email, password_hash }) {
    return db
        .query(
            "INSERT INTO users (firstname, lastname, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id",
            [firstname, lastname, email, password_hash]
        )
        .then((result) => result.rows[0].id);
}

function createSignature({ user_id, signature }) {
    return db
        .query(
            "INSERT INTO signatures (user_id, signature) VALUES ($1, $2) RETURNING id",
            [user_id, signature]
        )
        .then((result) => result.rows[0].id);
}

function getSignatures() {
    return db
        .query(
            "SELECT users.firstname AS firstname, users.lastname AS lastname, signatures.id AS signature_id FROM users JOIN signatures ON users.id = signatures.user_id"
        )
        .then((result) => result.rows);
}

function getNumberOfSignatures() {
    return db
        .query("SELECT COUNT (id) FROM signatures")
        .then((result) => result.rows[0].count)
        .catch((error) => console.log(error));
}

function getIndividualSignature(id) {
    return db
        .query("SELECT signature FROM signatures WHERE user_id = $1", [id]) //hier NICHT id außerhalb von () !!
        .then((result) => result.rows[0].signature)
        .catch((error) => console.log(error));
}

function getUserByEmail(email) {
    console.log(email);
    return db
        .query("SELECT * FROM users WHERE email = $1", [email])
        .then((result) => result.rows[0]);
}

module.exports = {
    registerUser,
    createSignature,
    getSignatures,
    getNumberOfSignatures,
    getIndividualSignature,
    getUserByEmail,
};
