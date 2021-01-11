const express = require('express');
const app = express();
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const errorhandler = require('errorhandler');
const apiRouter = require('./api/api.js');

const PORT = process.env.PORT || 4000;
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(errorhandler());
app.use('/api', apiRouter);

app.listen(PORT, () => {
    console.log(`Listening on PORT ${PORT}`);
});

module.exports = app;