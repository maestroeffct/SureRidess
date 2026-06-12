/**
 * App version constants used for force-update enforcement.
 *
 * ⚠️ KEEP IN SYNC WITH RELEASE BUILDS ⚠️
 *
 * Before every release, bump `CURRENT_BUILD_CODE` to match:
 *   - android/app/build.gradle → defaultConfig.versionCode
 *   - ios/SureRide/Info.plist → CFBundleVersion
 *
 * The dashboard admin can then set the Minimum Supported Build Code in
 * Platform Settings → App & Web Settings to gate older versions.
 *
 * If these get out of sync, the splash gate will either let stale builds
 * through (under-shipped) or block fresh builds (over-shipped).
 */
export const CURRENT_VERSION_NAME = "1.1.0";
export const CURRENT_BUILD_CODE = 2;
