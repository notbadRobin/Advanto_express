const axios = require('axios');
let db = require('mysql2');

let conn = db.createConnection({
    host: 'localhost',  
    user: 'root',
    password: 'aaradhya@2003',
    database: 'advanto'
});

conn.connect(err => {
    if (err) {
      console.error('Error connecting to MySQL:', err);
      return;
    }
    console.log('Connected to MySQL');
});

function insertData() {
    axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json')
    .then(response => {
        const transactions = response.data;
  
        transactions.forEach(transaction => {
            const { id, title, price, description, category, image, sold, dateOfSale } = transaction;
  
            const sql = `INSERT INTO advanto.products (id, title, price, description, category, image, sold, dateOfSale)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  
            conn.query(sql, [id, title, price, description, category, image, sold, dateOfSale], (err, results) => {
                if (err) {
                    console.error('Error inserting data:', err);
                } 
                else {
                    console.log(`Inserted transaction with ID: ${id}`);
                }
            });
        });
    })
    .catch(error => {
      console.error('Error fetching data from API:', error);
    })
}

function searchData(req, res) {
    const searchTerm = req.query.q;
    const page = parseInt(req.query.page) || 1; 
    const limit = 10; 
    const offset = (page - 1) * limit;
  
    const sql = `
      SELECT * FROM advanto.products 
      WHERE title LIKE ? 
      OR description LIKE ?
      OR price LIKE ?
      LIMIT ? OFFSET ?
    `;
  
    const searchPattern = `%${searchTerm}%`;
  
    conn.query(sql, [searchPattern, searchPattern, searchPattern, limit, offset], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).send('Error executing query');
            return;
        }

        res.json({
            currentPage: page,
            data: results
        });
    });
}

function paginateData(req, res) {
    const page = parseInt(req.query.page) || 1; 
    const limit = 10; 
    const offset = (page - 1) * limit;
    const month = parseInt(req.query.month) || 3;
  
    const sql = `SELECT * FROM advanto.products WHERE MONTH(dateOfSale) = ? LIMIT ? OFFSET ?`;

    conn.query(sql, [month, limit, offset], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).send('Error executing query');
            return;
        }
      
        res.json({
            currentPage: page,
            selectedMonth: month,
            data: results
        });
    });
}

function getSaleAmount(req, res) {
    const month = req.query.month;

    if (!month) {
        return res.status(400).json({ error: 'Please provide month' });
    }
  
    const sql = `
      SELECT price FROM advanto.products
      WHERE MONTH(dateOfSale) = ?
    `;

    conn.query(sql, [month], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).send('Error executing query');
            return;
        }
        var sum = 0;
        results.forEach(r => {
            sum += parseFloat(r.price);
        });

        res.json({
            month: month,
            data: results,
            total: sum.toFixed(2)
        });
    });
}

function getSoldItems(req, res) {
    const month = req.query.month; 

    if (!month) {
        return res.status(400).json({ error: 'Please provide month' });
    }
  
    const sql = `
      SELECT COUNT(*) as totalSoldItems FROM advanto.products
      WHERE sold = true
      AND MONTH(dateOfSale) = ?
    `;
  
    conn.query(sql, [month], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).send('Error executing query');
            return;
        }
  
        res.json({
            month: month,
            totalSoldItems: results[0].totalSoldItems
        });
    });
}

function getNotSoldItems (req, res) {
    const month = req.query.month; 
    
    if (!month) {
        return res.status(400).json({ error: 'Please provide month' });
    }
  
    const sql = `
      SELECT COUNT(*) as totalNotSoldItems FROM advanto.products
      WHERE sold = false
      AND MONTH(dateOfSale) = ?
    `;

    conn.query(sql, [month], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).send('Error executing query');
            return;
        }
  
        res.json({
            month: month,
            totalNotSoldItems: results[0].totalNotSoldItems
        });
    });
}

function getItemInPrice (req, res) {
    const month = req.query.month; 
  
    if (!month) {
        return res.status(400).json({ error: 'Please provide a month' });
    }

    const sql = `
        SELECT
            CASE
                WHEN price >= 0 AND price <= 100 THEN '0-100'
                WHEN price >= 101 AND price < 200 THEN '101-200'
                WHEN price >= 201 AND price < 300 THEN '201-300'
                WHEN price >= 301 AND price < 400 THEN '301-400'
                WHEN price >= 401 AND price < 500 THEN '401-500'
                WHEN price >= 501 AND price < 600 THEN '501-600'
                WHEN price >= 601 AND price < 700 THEN '601-700'
                WHEN price >= 701 AND price < 800 THEN '701-800'
                WHEN price >= 801 AND price < 900 THEN '801-900'
                ELSE '901+'
            END AS price_range,
        COUNT(*) AS item_count
        FROM advanto.products
        WHERE MONTH(dateOfSale) = ?
        GROUP BY price_range
    `;

    conn.query(sql, [month], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).send('Error executing query');
            return;
        }

        res.json({
            month: month,
            data: results
        });
    });
}

function getItemInCategory (req, res) {
    const month = req.query.month;

    const sqlQuery = `
      SELECT category, COUNT(*) AS numberOfItems
      FROM advanto.products
      WHERE MONTH(dateOfSale) = ?
      GROUP BY category;
    `;
  
    conn.query(sqlQuery, [month], (err, results) => {
        if (err) throw err;
  
        res.json(results);
    });
}

module.exports = {getSaleAmount, insertData, searchData, paginateData, getSoldItems, getNotSoldItems, getItemInPrice, getItemInCategory}