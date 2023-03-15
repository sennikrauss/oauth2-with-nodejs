const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const routes = require('./routes');

const app = express();

app.use(express.json());
app.use('/', routes);

app.listen(process.env.PORT, (error) => {
    if (error) {
        console.log(error);
    } else {
        console.log(`Server started and listening on port ${process.env.PORT}`);
    }
});
