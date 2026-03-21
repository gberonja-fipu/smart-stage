const express = require('express');

const app = express();
const PORT = 3001;

app.get('/', (req, res) => {
  res.json({ message: 'Pametna pozornica - server radi!' });
});

app.listen(PORT, () => {
  console.log(`Server pokrenut na http://localhost:${PORT}`);
});
