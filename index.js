const boom = require('boom');
const pluginDefaults = {
  includeEnvVars: true,
  endpoint: '/_config'
};

const register = (server, pluginOptions) => {
  const options = Object.assign({}, pluginDefaults, pluginOptions);
  if (!options.key) {
    throw new Error('hapi-config-route requires a secure key');
  }
  const routeSpec = {
    method: 'get',
    path: options.endpoint,
    handler(request, h) {
      if (!options.auth && request.query.key !== options.key) {
        return boom.unauthorized();
      }
      const ret = {
        settings: server.settings.app
      };
      if (options.includeEnvVars) {
        ret.env = process.env;
      }
      return ret;
    }
  };
  if (options.auth || options.auth === false) {
    routeSpec.config = { auth: options.auth };
  }
  server.route(routeSpec);
};

exports.plugin = {
  register,
  name: 'hapi-config-route',
  once: true,
  pkg: require('./package.json')
};
