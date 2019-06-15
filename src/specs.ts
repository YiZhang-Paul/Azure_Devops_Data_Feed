import { stub } from 'sinon';

// mute console log in source code
const logStub = stub(console, 'log');

after('global test teardown', () => {

    logStub.restore();
});

const context = require.context('.', true, /\.spec\.(t|j)s/);
context.keys().forEach(context);
