
DROP TABLE IF EXISTS signatures;

DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    firstname           VARCHAR(255) NOT NULL,
    lastname            VARCHAR(255) NOT NULL,
    email           VARCHAR(50) NOT NULL UNIQUE,
    password_hash    VARCHAR NOT NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE signatures (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL UNIQUE REFERENCES users (id),
    signature   TEXT NOT NULL CHECK (signature != '')
);