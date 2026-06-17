import * as Contacts from 'expo-contacts';
import { Alert, Linking, Platform } from 'react-native';
import { t } from '@/utils/i18n';

export interface PickedContact {
  name: string;
  phone: string;
}

/**
 * Opens the device contact picker and returns the selected contact's name and phone number.
 * @returns {Promise<PickedContact | null>} - The selected contact or null if cancelled/failed.
 */
export const pickContact = async (): Promise<PickedContact | null> => {
  try {
    let { status } = await Contacts.getPermissionsAsync();
    
    if (status !== 'granted') {
      status = (await Contacts.requestPermissionsAsync()).status;
    }
    
    if (status !== 'granted') {
      Alert.alert(
        t('Permission Required'),
        t('We need access to your contacts to add them as emergency contacts.'),
        [
          { text: t('Cancel'), style: 'cancel' },
          { text: t('Settings'), onPress: () => Linking.openSettings() },
        ]
      );
      return null;
    }

    // presentContactPickerAsync is the modern way to pick a single contact and return to the app
    const contact = await Contacts.presentContactPickerAsync();

    if (contact && contact.phoneNumbers && contact.phoneNumbers.length > 0) {
      // Return the first phone number and the display name
      return {
        name: contact.name,
        phone: contact.phoneNumbers[0].number || '',
      };
    } else if (contact) {
      Alert.alert(t('No Phone Number'), t('The selected contact does not have a phone number.'));
    }

    return null;
  } catch (error) {
    console.error('Error picking contact:', error);
    return null;
  }
};
