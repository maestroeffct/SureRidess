declare module '@sumsub/react-native-mobilesdk-module' {
  export type SNSMobileSDKStatus =
    | 'Ready'
    | 'Initial'
    | 'Failed'
    | 'Pending'
    | 'Actionable'
    | 'Approved'
    | 'Temporarilydeclined'
    | 'Finallyrejected';

  export type SNSMobileSDKResult = {
    success: boolean;
    status?: SNSMobileSDKStatus | string;
    errorType?: string;
    errorMsg?: string;
  };

  export type SNSMobileSDKStatusChangedEvent = {
    prevStatus: SNSMobileSDKStatus | string;
    newStatus: SNSMobileSDKStatus | string;
  };

  export type SNSMobileSDKEvent = {
    [key: string]: unknown;
  };

  type Handlers = {
    onStatusChanged?: (event: SNSMobileSDKStatusChangedEvent) => void;
    onLog?: (event: { message: string }) => void;
    onEvent?: (event: SNSMobileSDKEvent) => void;
  };

  interface SNSMobileSDKBuilder {
    withHandlers(handlers: Handlers): SNSMobileSDKBuilder;
    withDebug(debug: boolean): SNSMobileSDKBuilder;
    withLocale(locale: string): SNSMobileSDKBuilder;
    build(): SNSMobileSDKInstance;
  }

  interface SNSMobileSDKInstance {
    launch(): Promise<SNSMobileSDKResult>;
  }

  const SNSMobileSDK: {
    init(
      accessToken: string,
      tokenExpirationHandler: () => Promise<string>,
    ): SNSMobileSDKBuilder;
  };

  export default SNSMobileSDK;
}
