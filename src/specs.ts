process.env.TESTING = 'true';
const contexts = require.context('.', true, /\.spec\.ts$/);
contexts.keys().forEach(contexts);
