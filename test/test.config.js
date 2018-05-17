const tap = require('tap');
const Hapi = require('hapi');
const plugin = require('../index.js');
const hapiPassword = require('hapi-password');

tap.test('throw error if no key ', async(t) => {
  const server = new Hapi.Server({ port: 8080 });
  try {
    await server.register({
      plugin,
      options: {
      }
    });
  } catch (e) {
    t.ok(e);
    return t.end();
  }
  t.fail();
});

tap.test('block if key not passed ', async(t) => {
  const server = new Hapi.Server({ port: 8080 });
  await server.register({
    plugin,
    options: {
      key: 'key'
    }
  });
  const response = await server.inject({
    url: '/_config',
    method: 'GET',
  });
  t.equal(response.statusCode, 401);
  t.end();
});

tap.test('allow if key passed ', async(t) => {
  const server = new Hapi.Server({ port: 8080 });
  server.settings.app = {
    hapiConfigRoute: 'inthehouse'
  };
  process.env.HAPICONFIGPLUGIN = 1234;
  await server.register({
    plugin,
    options: {
      key: 'key'
    }
  });
  const response = await server.inject({
    url: '/_config?key=key',
    method: 'GET',
  });
  t.equal(response.statusCode, 200);
  t.equal(response.result.settings.hapiConfigRoute, 'inthehouse', 'returns server.settings.app');
  t.equal(response.result.env.HAPICONFIGPLUGIN, '1234', 'returns process.env');
  t.end();
});

tap.test('disable env ', async(t) => {
  const server = new Hapi.Server({ port: 8080 });
  server.settings.app = {
    hapiConfigRoute: 'inthehouse'
  };
  process.env.HAPICONFIGPLUGIN = 1234;
  await server.register({
    plugin,
    options: {
      key: 'key',
      includeEnvVars: false
    }
  });
  const response = await server.inject({
    url: '/_config?key=key',
    method: 'GET',
  });
  t.equal(response.statusCode, 200);
  t.notOk(response.result.env, 'does not return process.env');
  t.end();
});

tap.test('specify config route ', async(t) => {
  const server = new Hapi.Server({ port: 8080 });
  server.settings.app = {
    hapiConfigRoute: 'inthehouse'
  };
  process.env.HAPICONFIGPLUGIN = 1234;
  await server.register({
    plugin,
    options: {
      key: 'key',
      endpoint: '/endpoint'
    }
  });
  const response = await server.inject({
    url: '/endpoint?key=key',
    method: 'GET',
  });
  t.equal(response.statusCode, 200);
  t.end();
});

tap.test('config will be protected by auth if one is passed in ', async(t) => {
  const server = new Hapi.Server({ port: 8080 });
  server.settings.app = {
    hapiConfigRoute: 'inthehouse'
  };
  process.env.HAPICONFIGPLUGIN = 1234;
  // register hapi-password to be our auth scheme:
  await server.register({
    plugin: hapiPassword,
    options: {
      salt: 'aSalt',
      password: 'password'
    }
  });
  await server.register({
    plugin,
    options: {
      key: 'key',
      auth: 'password',
      endpoint: '/endpoint'
    }
  });
  const response = await server.inject({
    url: '/endpoint?key=key',
    method: 'GET',
  });
  t.equal(response.statusCode, 302, 'auth should redirect to a login page if it was registered');
  t.end();
});
