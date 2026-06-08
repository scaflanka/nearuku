const appJson = require('./app.json');

module.exports = () => {
  const plugins = appJson.expo.plugins.map((plugin) => {
    if (plugin === '@rnmapbox/maps') {
      return ['@rnmapbox/maps', { RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOAD_TOKEN }];
    }
    return plugin;
  });

  return {
    ...appJson.expo,
    plugins,
  };
};
