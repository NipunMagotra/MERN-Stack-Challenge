const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const ProductTransaction = require('./models/ProductTransaction');
require('dotenv').config();
const app = express();
const port = 3000;
const mongoURI = 'your_mongodb_uri';

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(bodyParser.json());

app.get('/transactions', async (req, res) => {
  const { page = 1, perPage = 10, search = '' } = req.query;
  const query = {
    $or: [
      { title: new RegExp(search, 'i') },
      { description: new RegExp(search, 'i') },
      { price: new RegExp(search, 'i') },
    ],
  };
  const transactions = await ProductTransaction.find(query)
    .skip((page - 1) * perPage)
    .limit(parseInt(perPage));
  res.json(transactions);
});

app.get('/statistics', async (req, res) => {
  const { month } = req.query;
  const start = new Date(`2022-${month}-01`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const totalSaleAmount = await ProductTransaction.aggregate([
    { $match: { dateOfSale: { $gte: start, $lt: end } } },
    { $group: { _id: null, total: { $sum: '$price' } } },
  ]);

  const totalSoldItems = await ProductTransaction.countDocuments({
    dateOfSale: { $gte: start, $lt: end },
    sold: true,
  });

  const totalNotSoldItems = await ProductTransaction.countDocuments({
    dateOfSale: { $gte: start, $lt: end },
    sold: false,
  });

  res.json({
    totalSaleAmount: totalSaleAmount[0] ? totalSaleAmount[0].total : 0,
    totalSoldItems,
    totalNotSoldItems,
  });
});

app.get('/bar-chart', async (req, res) => {
  const { month } = req.query;
  const start = new Date(`2022-${month}-01`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const priceRanges = [
    { min: 0, max: 100 },
    { min: 101, max: 200 },
    { min: 201, max: 300 },
    { min: 301, max: 400 },
    { min: 401, max: 500 },
    { min: 501, max: 600 },
    { min: 601, max: 700 },
    { min: 701, max: 800 },
    { min: 801, max: 900 },
    { min: 901, max: Infinity },
  ];

  const barChartData = await Promise.all(
    priceRanges.map(async (range) => {
      const count = await ProductTransaction.countDocuments({
        dateOfSale: { $gte: start, $lt: end },
        price: { $gte: range.min, $lte: range.max },
      });
      return { range: `${range.min}-${range.max}`, count };
    })
  );

  res.json(barChartData);
});

app.get('/pie-chart', async (req, res) => {
  const { month } = req.query;
  const start = new Date(`2022-${month}-01`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const categories = await ProductTransaction.aggregate([
    { $match: { dateOfSale: { $gte: start, $lt: end } } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);

  res.json(categories);
});

app.get('/combined-data', async (req, res) => {
  const [transactions, statistics, barChartData, pieChartData] = await Promise.all([
    (async () => {
      const { page = 1, perPage = 10, search = '' } = req.query;
      const query = {
        $or: [
          { title: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') },
          { price: new RegExp(search, 'i') },
        ],
      };
      return await ProductTransaction.find(query)
        .skip((page - 1) * perPage)
        .limit(parseInt(perPage));
    })(),
    (async () => {
      const { month } = req.query;
      const start = new Date(`2022-${month}-01`);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      const totalSaleAmount = await ProductTransaction.aggregate([
        { $match: { dateOfSale: { $gte: start, $lt: end } } },
        { $group: { _id: null, total: { $sum: '$price' } } },
      ]);

      const totalSoldItems = await ProductTransaction.countDocuments({
        dateOfSale: { $gte: start, $lt: end },
        sold: true,
      });

      const totalNotSoldItems = await ProductTransaction.countDocuments({
        dateOfSale: { $gte: start, $lt: end },
        sold: false,
      });

      return {
        totalSaleAmount: totalSaleAmount[0] ? totalSaleAmount[0].total : 0,
        totalSoldItems,
        totalNotSoldItems,
      };
    })(),
    (async () => {
      const { month } = req.query;
      const start = new Date(`2022-${month}-01`);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      const priceRanges = [
        { min: 0, max: 100 },
        { min: 101, max: 200 },
        { min: 201, max: 300 },
        { min: 301, max: 400 },
        { min: 401, max: 500 },
        { min: 501, max: 600 },
        { min: 601, max: 700 },
        { min: 701, max: 800 },
        { min: 801, max: 900 },
        { min: 901, max: Infinity },
      ];

      return await Promise.all(
        priceRanges.map(async (range) => {
          const count = await ProductTransaction.countDocuments({
            dateOfSale: { $gte: start, $lt: end },
            price: { $gte: range.min, $lte: range.max },
          });
          return { range: `${range.min}-${range.max}`, count };
        })
      );
    })(),
    (async () => {
      const { month } = req.query;
      const start = new Date(`2022-${month}-01`);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      return await ProductTransaction.aggregate([
        { $match: { dateOfSale: { $gte: start, $lt: end } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]);
    })(),
  ]);

  res.json({ transactions, statistics, barChartData, pieChartData });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});