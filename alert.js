import { Alert as RNAlert, Platform } from 'react-native';

/**
 * React Native's Alert.alert does nothing on the web, which would silently
 * break the "Cancel booking" confirmations. This keeps the same API and
 * falls back to the browser's confirm/alert dialogs on web.
 */
const Alert = {
  alert(title, message, buttons) {
    if (Platform.OS !== 'web') {
      return RNAlert.alert(title, message, buttons);
    }

    const text = message ? `${title}\n\n${message}` : title;

    // Single-button (or no-button) alert
    if (!buttons || buttons.length < 2) {
      window.alert(text);
      if (buttons && buttons[0] && buttons[0].onPress) buttons[0].onPress();
      return undefined;
    }

    // Confirm dialog: OK runs the action button, Cancel runs the cancel button
    const cancel = buttons.find((b) => b.style === 'cancel');
    const action = buttons.find((b) => b !== cancel);
    if (window.confirm(text)) {
      if (action && action.onPress) action.onPress();
    } else if (cancel && cancel.onPress) {
      cancel.onPress();
    }
    return undefined;
  },
};

export default Alert;
