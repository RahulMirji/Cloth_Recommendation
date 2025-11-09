/**
 * Expo Config Plugin for react-native-razorpay
 * 
 * This plugin adds the necessary configurations for react-native-razorpay
 * to work with Expo managed workflow.
 */

const { withPlugins, AndroidConfig, withAndroidManifest } = require('@expo/config-plugins');

/**
 * Add Razorpay activity to AndroidManifest.xml
 */
const withRazorpayAndroid = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const { manifest } = androidManifest;

    // Ensure application exists
    if (!manifest.application) {
      manifest.application = [{}];
    }

    const application = manifest.application[0];

    // Ensure activity array exists
    if (!application.activity) {
      application.activity = [];
    }

    // Check if Razorpay activity already exists
    const hasRazorpayActivity = application.activity.some(
      (activity) =>
        activity.$?.['android:name'] === 'com.razorpay.CheckoutActivity'
    );

    // Add Razorpay activity if not present
    if (!hasRazorpayActivity) {
      application.activity.push({
        $: {
          'android:name': 'com.razorpay.CheckoutActivity',
          'android:configChanges': 'keyboard|keyboardHidden|orientation|screenSize',
          'android:exported': 'true',
          'android:theme': '@style/CheckoutTheme',
        },
      });
    }

    return config;
  });
};

/**
 * Main plugin export
 */
module.exports = function withRazorpay(config) {
  return withPlugins(config, [withRazorpayAndroid]);
};
