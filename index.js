const express = require('express');
const cors = require('cors');
const path = require('path');

const connectDB = require('./src/config/db.config');
const formRoutes = require('./src/routes/form.routes');
//const userRoutes = require('./src/routes/user.route')

require('dotenv').config();

const app = express();
const PORT = process.env.PORT;

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/forms', formRoutes);
//app.use('/user', userRoutes)

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});