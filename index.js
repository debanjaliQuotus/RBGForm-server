const express = require('express');
const cors = require('cors');
const path = require('path');

const connectDB = require('./src/config/db.config');
const formRoutes = require('./src/routes/form.routes');
const userRoutes = require('./src/routes/user.routes');
const adminRoutes = require('./src/routes/admin.routes');
const { createDefaultUsers } = require('./src/controller/user.controller');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT;

connectDB();
createDefaultUsers();

app.use(cors("*"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/forms', formRoutes);
app.use('/users', userRoutes);
app.use('/admin', adminRoutes);





app.get('/', (req, res) => {
  res.send('API is running...');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

