const axios = require('axios');
const mongoose = require('mongoose');
const ProductTransaction = require('./models/ProductTransaction'); // Define your schema in this file
require('dotenv').config();
const mongoURI = 'mongodb+srv://teheb17102:sldqRmQbuWDnT0N8@cluster0.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

const seedDatabase = async () => {
  try {
    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    const transactions = response.data;

    await ProductTransaction.deleteMany({});
    await ProductTransaction.insertMany(transactions);
    console.log('Database seeded successfully!');
    mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding the database:', error);
  }
};

seedDatabase();
