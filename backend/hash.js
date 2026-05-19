const bcrypt = require('bcrypt');

(async () => {
  const hash = await bcrypt.hash('Admin1234', 10);
  console.log(hash);
})();