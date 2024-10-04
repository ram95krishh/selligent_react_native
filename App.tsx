/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import Selligent from '@selligent-marketing-cloud/selligent-react-native';

import {
  Colors,
  Header,
} from 'react-native/Libraries/NewAppScreen';

import { useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';

let getDeviceIdPromise: Promise<string> | undefined;

export async function getDeviceId() {
  if (getDeviceIdPromise == null) {
    throw new Error('Selligent Device ID is not populated yet.');
  }
  return await getDeviceIdPromise;
}

enum SelligentBroadcastEventType {
  /** A button was clicked */
  BUTTON_CLICKED = 'ButtonClicked',
  /** An in-app message has been received */
  RECEIVED_IN_APP_MESSAGE = 'ReceivedInAppMessage',
  /** A notification will be displayed */
  WILL_DISPLAY_NOTIFICATION = 'WillDisplayNotification',
  /** A notification will be dismissed */
  WILL_DISMISS_NOTIFICATION = 'WillDismissNotification',
  /** A device id has been received */
  RECEIVED_DEVICE_ID = 'ReceivedDeviceId',
  /** Received GCM TOKEN */
  RECEIVED_GCM_TOKEN = 'ReceivedGCMToken',
  /** Received a remote notification */
  RECEIVED_REMOTE_NOTIFICATION = 'ReceivedRemoteNotification',
  /** Received an universal link execution */
  UNIVERSAL_LINK_EXECUTED = 'UniversalLinkExecuted',
  /** A custom event has been triggered */
  TRIGGERED_CUSTOM_EVENT = 'TriggeredCustomEvent',
  /** An IAM is about to be displayed (when `customInAppUi` is set to `true` in `selligent.json`) */
  DISPLAYING_IN_APP_MESSAGE = 'DisplayingInAppMessage'
}

export async function getDeviceIdFromSelligent() {
  return new Promise<string>((resolve, reject) => {
    console.log('getDeviceId start', performance.now());
    Selligent.getDeviceId((deviceId: string) => {
      if (deviceId !== '') {
        console.log('getDeviceId end', performance.now() + deviceId);
        resolve(deviceId);
      } else {
        Toast.show({ text1: 'Did not receive deviceID from getDeviceID'});
        reject(new Error('Selligent.getDeviceId() did not return deviceUID'));
      }
    });
  });
}

type TSelligentBroadcastEvent = {
  data: {
    deviceId: string
  },
  broadcastEventType: string
}

export const initializeDeviceId = () => {
  getDeviceIdPromise = Promise.any([
    getDeviceIdFromSelligent(),
    Promise.race([
      new Promise<string>((resolve) => {
        let deviceIdSubscriptionFulfilled = false;
        console.log('subscribeToEvent', performance.now());
        Selligent.subscribeToEvent((event: TSelligentBroadcastEvent) => {
          Toast.show({ text1: 'DeviceID came from subscription' + event.data.deviceId});
          console.log('received event from subscribeToEvent at', performance.now(), event.data.deviceId);
          const { deviceId } = event.data;
          if (deviceIdSubscriptionFulfilled) {return;}
          if (deviceId !== '' && typeof deviceId !== 'object') {
            resolve(deviceId);
            deviceIdSubscriptionFulfilled = true;
          }
        }, SelligentBroadcastEventType.RECEIVED_DEVICE_ID);
      }),
      new Promise<never>((_resolve, reject) => {
        setTimeout(() => {
          reject(new Error('Selligent Device ID resolution timed out.'));
        }, 65000);
      }),
    ]),
  ]).catch((err:any) => {
    console.log('Something went wrong during initialization of device ID', err.message);
    Toast.show({ text1: 'Something went wrong during initialization of device ID' + err.message});
    throw err;
  });
};




function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const [deviceId, setDeviceId] = useState<string | undefined>();

  useEffect(() => {
    initializeDeviceId();
    getDeviceIdPromise?.then(selligentDeviceId => {
      if (selligentDeviceId === '' || selligentDeviceId == null) {
        Toast.show({ type: 'error', text1: "Didn't receive a device ID from Selligent" });
      }
      console.log('selligentDeviceId', selligentDeviceId);
      setDeviceId(selligentDeviceId);
    });
  }, []);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <Header />
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>
          <Text>
            Retrieved device ID:: {deviceId}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default App;
