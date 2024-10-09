const express = require('express');
const cors = require('cors');
const dbGet = require('./dbGetter.js');

const app = express();
const port = 3000;

app.use(cors({
  origin: 'http://localhost:8080' 
}));

app.get('/', (req, res) => {
  res.send("<h1>Advanto Running</h1>")
})

app.get('/insert', async () => {
  await dbGet.insertData();
})

app.get('/search', async (req, res) => {
  await dbGet.searchData(req, res);
});

app.get('/paginate', async (req, res) => {
  await dbGet.paginateData(req, res);
})

app.get('/prices', async (req, res) => {
  await dbGet.getSaleAmount(req, res);
});

app.get('/sold-items', async (req, res) => {
  await dbGet.getSoldItems(req, res);
});

app.get('/not-sold-items', async (req, res) => {
  await dbGet.getNotSoldItems(req, res);
});

app.get('/price-ranges', async (req, res) => {
  await dbGet.getItemInPrice(req, res);
});

app.get('/categories', async (req, res) => {
  await dbGet.getItemInCategory(req, res);
});

app.listen(port, () => {
    console.log(`Server Running on ${port} port`);
})