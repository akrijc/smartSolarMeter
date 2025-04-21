module.exports = function withTextRecognition(config) {
  return {
    ...config,
    ios: {
      ...config.ios,
      infoPlist: {
        ...(config.ios?.infoPlist || {}),
        NSCameraUsageDescription: "We use the camera to scan meter values.",
      },
    },
  };
};