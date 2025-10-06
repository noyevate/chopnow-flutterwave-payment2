const express = require('express');
const app = express();
const dotenv = require('dotenv')
const port = process.env.PORT || 7000;

const payment = require("./route/payment_rote");



dotenv.config();




app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get('/', (req,res) => res.send("Hello world"));
app.use('/', payment);


app.listen(port, () => console.log(`chopnow backend services is running on port: ${port}`))