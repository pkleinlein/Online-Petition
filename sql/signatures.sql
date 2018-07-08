DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures(
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        first VARCHAR(200) NOT NULL,
        sur VARCHAR(200) NOT NULL,
        sig TEXT NOT NULL
);
