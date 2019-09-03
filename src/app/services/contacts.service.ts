import {Injectable} from '@angular/core';
import {Contacts, IContactFindOptions} from '@ionic-native/contacts/ngx';
import {Storage} from '@ionic/storage';
import {CallNumber} from '@ionic-native/call-number/ngx';
import {ActionSheetController} from '@ionic/angular';
import {ActionSheetButton} from 'ionic-angular';

@Injectable({
  providedIn: 'root'
})
export class ContactsService {
  promptedContacts: Array<any>;
  contactsDrawer: boolean;

  constructor(
    private ionContacts: Contacts,
    private storage: Storage,
    private callNumber: CallNumber,
    private actionSheetController: ActionSheetController
  ) {
    this.promptedContacts = [];
    this.contactsDrawer = false;
  }

  makeCall(name: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const phoneNumber = await this.getContactNumberIfAvailable(name);
      if (phoneNumber) {
        if (phoneNumber !== 'cancelled') {
          await this.callNumber.callNumber(phoneNumber, false);
        }
        resolve();
      } else {
        reject();
      }
    });
  }

  sendWhatsappMessage(words: string[]): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const contact = await this.getContactNumberForWhatsappIfAvailable(words);
      if (contact) {
        if (contact !== 'cancelled') {
          resolve(contact);
        }
        resolve(null);
      } else {
        reject();
      }
    });
  }

  getContactNumberForWhatsappIfAvailable(words: string[]): Promise<any> {
    return new Promise(async (resolve) => {
      let deviceContacts;
      let name;
      if (words.length > 2) {
        words = words.slice(0, 2);
        name = words.join(' ');
        deviceContacts = await this.getDeviceContacts(name);
        if (!deviceContacts) {
          words = words.slice(0, 1);
          name = words.join(' ');
          deviceContacts = await this.getDeviceContacts(name);
          if (!deviceContacts) {
            name = words[0];
            deviceContacts = await this.getDeviceContacts(name);
            if (!deviceContacts) {
              resolve(null);
            }
          }
        }
      } else if (words.length === 2) {
        if (!deviceContacts) {
          words = words.slice(0, 1);
          name = words.join(' ');
          deviceContacts = await this.getDeviceContacts(name);
          if (!deviceContacts) {
            name = words[0];
            deviceContacts = await this.getDeviceContacts(name);
            if (!deviceContacts) {
              resolve(null);
            }
          }
        }
      } else if (words.length === 1) {
        name = words[0];
        deviceContacts = await this.getDeviceContacts(name);
        if (!deviceContacts) {
          resolve(null);
        }
      }
      if (deviceContacts.length > 0) {
        let phoneNumber;
        if (deviceContacts.length === 1) {
          phoneNumber = deviceContacts[0].phoneNumbers[0].value.replace(' ', '');
          resolve({
            name: deviceContacts[0].displayName,
            phoneNumber: phoneNumber
          });
        } else {
          const chosenContact = await this.askUserToChooseContact(deviceContacts);
          if (chosenContact) {
            if (chosenContact === 'cancelled') {
              resolve('cancelled');
            } else {
              phoneNumber = chosenContact.phoneNumbers[0].value.replace(' ', '');
              resolve({
                name: deviceContacts[0].displayName,
                phoneNumber: phoneNumber
              });            }
          } else {
            resolve(null);
          }
        }
      } else {
        resolve(null);
      }
    });
  }

  getContactNumberIfAvailable(name: string): Promise<any> {
    return new Promise(async (resolve) => {
      const deviceContacts = await this.getDeviceContacts(name);
      if (deviceContacts.length > 0) {
        let phoneNumber;
        if (deviceContacts.length === 1) {
          phoneNumber = deviceContacts[0].phoneNumbers[0].value.replace(' ', '');
          resolve(phoneNumber);
        } else {
          const chosenContact = await this.askUserToChooseContact(deviceContacts);
          if (chosenContact) {
            if (chosenContact === 'cancelled') {
              resolve('cancelled');
            } else {
              phoneNumber = chosenContact.phoneNumbers[0].value.replace(' ', '');
              resolve(phoneNumber);
            }
          } else {
            resolve(null);
          }
        }
      } else {
        resolve(null);
      }
    });
  }

  askUserToChooseContact(deviceContacts: Array<any>): Promise<any> {
    return new Promise<any>(async resolve => {
      const contactsButtons: Array<ActionSheetButton> = [];
      deviceContacts.forEach(dc => {
        if (dc.phoneNumbers.length > 0) {
          if (dc.phoneNumbers.length > 1) {
            dc.phoneNumbers.forEach(dcp => {
              contactsButtons.push({
                text: `${dc.displayName} ${dcp.value.replace(' ', '')}`,
                handler: () => {
                  resolve(dc);
                }
              });
            });
          } else {
            contactsButtons.push({
              text: dc.displayName,
              handler: () => {
                resolve(dc);
              }
            });
          }
        }
      });
      contactsButtons.push({
        text: 'إلغاء',
        handler: () => {
          resolve('cancelled');
        }
      });
      const actionSheet = await this.actionSheetController.create({
        animated: true,
        mode: 'ios',
        translucent: true,
        cssClass: 'contact-font-color',
        buttons: contactsButtons
      });
      await actionSheet.present();
    });
  }

  getDeviceContacts(name: string) {
    const options: IContactFindOptions = {
      filter: name,
      multiple: true,
      desiredFields: ['displayName', 'phoneNumbers']
    };
    return this.ionContacts.find(['displayName', 'name'], options);
  }
}
