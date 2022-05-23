const Sequelize = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { STRING } = Sequelize;
const config = {
  logging: false,
};

if (process.env.LOGGING) {
  delete config.logging;
}
const conn = new Sequelize(
  process.env.DATABASE_URL || 'postgres://localhost/acme_db',
  config
);

const User = conn.define('user', {
  username: STRING,
  password: STRING,
});

const Note = conn.define('note', {
  text: STRING,
});

User.hasMany(Note);
Note.belongsTo(User);

User.byToken = async (token) => {
  try {
    const decoded = jwt.verify(token, 'process.env.JWT');
    const user = await User.findByPk(decoded.userId );
    return user;
  } catch (ex) {
    const error = Error('BAD TOKEN bad credentials');
    error.status = 401;
    throw error;
  }
};

User.authenticate = async ({ username, password }) => {
  try {
    const user = await User.findOne({
      where: {
        username: username,
      },
    });
    if (bcrypt.compareSync(password, user.password)) {
      const token = await jwt.sign({ userId: user.id }, 'process.env.JWT');
      return token;
    }
    const error = Error('bad credentials');
    error.status = 403;
    throw error;
  } catch (ex) {
    const error = Error('user not found');
    error.status = 401;
    throw error;
  }
};

User.beforeCreate((user, options) => {
  const hashed = bcrypt.hashSync(user.password, 10);
  user.password = hashed;
});

const syncAndSeed = async () => {
  await conn.sync({ force: true });
  const credentials = [
    {
      username: 'lucy',
      password: 'lucy_pw',
    },
    {
      username: 'moe',
      password: 'moe_pw',
    },
    {
      username: 'larry',
      password: 'larry_pw',
    },
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map((credential) => User.create(credential))
  );
  const newNotes = [
    {
      text: '1Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed id augue et diam malesuada ultrices in id nunc. In mollis mi et vehicula placerat.',
    },
    {
      text: '2temporary',
    },
    {
      text: '3the death star.',
    },
    {
      text: '4teenage mutant ninja turtles',
    },
  ];
  const [note1, note2, note3, note4] = await Promise.all(
    newNotes.map((note) => Note.create(note))
  );

  lucy.addNote(note1);
  lucy.addNote(note2);
  moe.addNote(note3);
  larry.addNote(note4);

  return {
    users: {
      lucy,
      moe,
      larry,
    },
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User,
    Note,
  },
};
