const spicedPg = require("spiced-pg");

const database = process.env.DB || "signatures";

function getDatabaseURL() {
    if (process.env.DATABASE_URL) {
        return process.env.DATABASE_URL;
    }
    const { username, password } = require("./data.json");
    return `postgres:${username}:${password}@localhost:5432/${database}`;
}

const db = spicedPg(getDatabaseURL());

console.log(`[db] Connecting to: ${database}`);

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

function getAllSignedUsersDetails() {
    return db
        .query(
            "SELECT firstname, lastname, age, city, url FROM users JOIN signatures ON users.id = signatures.user_id FULL JOIN user_profiles ON users.id = user_profiles.user_id WHERE signatures.signature IS NOT NULL"
        )
        .then((result) => result.rows);
}

function getSignaturesByCity(signerCity) {
    return db
        .query(
            "SELECT firstname, lastname, age, url FROM users JOIN signatures ON users.id = signatures.user_id FULL JOIN user_profiles ON users.id = user_profiles.user_id WHERE city = $1",
            [signerCity]
        )
        .then((result) => result.rows);
}

// (syntax for checking if signature IS NOT NULL ;)

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
    return db
        .query("SELECT * FROM users WHERE email = $1", [email])
        .then((result) => result.rows[0]);
}

function createUserProfile({ age, city, url, user_id }) {
    if (age) {
        return db
            .query(
                "INSERT INTO user_profiles (age, city, url, user_id) VALUES ($1, $2, $3, $4) RETURNING id",
                [age, city, url, user_id]
            )
            .then((result) => result.rows[0].id);
    }
    return db
        .query(
            "INSERT INTO user_profiles (city, url, user_id) VALUES ($1, $2, $3) RETURNING id",
            [city, url, user_id]
        )
        .then((result) => result.rows[0].id);
}

module.exports = {
    registerUser,
    createSignature,
    getAllSignedUsersDetails,
    getNumberOfSignatures,
    getIndividualSignature,
    getUserByEmail,
    createUserProfile,
    getSignaturesByCity,
};
