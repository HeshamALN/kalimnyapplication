import {ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {AlertController, Platform} from '@ionic/angular';
import {Storage} from '@ionic/storage';
import {ContactModel} from '../../models/contact.model';
import {Contacts} from '@ionic-native/contacts/ngx';
import {SpeechRecognition} from '@ionic-native/speech-recognition/ngx';
import {Subscription} from 'rxjs';
import {SessionService} from '../../services/session.service';
import {AssistantService} from '../../services/assistant.service';

@Component({
  selector: 'app-contacts-modal',
  templateUrl: './contacts.page.html',
  styleUrls: ['./contacts.page.scss'],
})
export class ContactsPage implements OnInit, OnDestroy {
  private googleListeningSubscription: Subscription;
  contacts: ContactModel[];
  filteredContacts: ContactModel[];

  constructor(
    private storage: Storage,
    private ionContacts: Contacts,
    private alertCtrl: AlertController,
    private speechReco: SpeechRecognition,
    private platform: Platform,
    private _session: SessionService,
    private _assistant: AssistantService,
    private zone: NgZone,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.storage.get('contacts').then(contacts => {
      if (contacts) {
        this.contacts = contacts;
      } else {
        this.contacts = [];
      }
      this.filteredContacts = this.contacts;
    });
  }

  getContact() {
    this.ionContacts.pickContact().then(async contact => {
      if (contact) {
        let newContact: ContactModel;
        if (!contact.phoneNumbers) {
          return alert('يرجى إختيار جهة مع رقم هاتف');
        }
        let phone = contact.phoneNumbers.map(no => no.value)[0];
        phone = phone.replace(/\s/g, '');
        if (phone.length > 8
          && phone.substr(0, 2) !== '00'
          && phone.substr(0, 1) !== '+') {
          return alert('يرجى إختيار جهة مع رقم هاتف صحيح');
        }
        if (phone.length === 8) {
          phone = '+965' + phone;
        }
        const newName = await this.notifyToRecordName();
        if (newName) {
          newContact = {
            phoneNumber: phone,
            name: newName
          };
          await this.add(newContact);
        }
      }
    });
  }

  private notifyToRecordName(): Promise<string> {
    return new Promise<string>(async resolve => {
      this._assistant.playWhatsTheName().catch(console.error);
      const alert = await this.alertCtrl.create({
        header: 'الرجاء تسجيل إسم الجهة بصوتك',
        message: 'هل أنت مستعد؟',
        buttons: [
          {
            text: 'نعم',
            handler: () => {
              this.getNameByListening().then(name => {
                name ? resolve(name) : resolve(null);
              });
            }
          },
          {
            text: 'إلغاء',
            handler: () => {
              resolve(null);
            }
          }
        ]
      });
      await alert.present();
    });
  }

  getNameByListening(): Promise<string> {
    return new Promise<string>(resolve => {
      this.speechReco.hasPermission().then((hasPermission: boolean) => {
        if (hasPermission) {
          this.googleListeningSubscription = this.speechReco.startListening(this._assistant.speechOptions).subscribe(
            async (successes: string[]) => {
              if (await this.confirmName(successes[0])) {
                resolve(successes[0]);
              } else {
                // this.notifyToRecordName();
                resolve(null);
              }
            },
            error => resolve(null)
          );
        } else {
          this.speechReco.requestPermission().then(res => {
            this.notifyToRecordName();
          }).catch(err => {
            alert('الرجاء السماح لإستخدام المايكروفون');
          });
        }
      });
    });
  }

  private async confirmName(name: string): Promise<boolean> {
    return new Promise<boolean>(async resolve => {
      const alert = await this.alertCtrl.create({
        header: 'حفظ الإسم؟',
        message: name,
        buttons: [
          {
            text: 'نعم',
            handler: () => {
              resolve(true);
            }
          },
          {
            text: 'إلغاء',
            handler: () => {
              resolve(false);
            }
          }
        ]
      });
      await alert.present();
    });
  }

  private add(contact: ContactModel) {
    this.contacts.push(contact);
    this.zone.run(() => this.cd.detectChanges());
    return this.storage.set('contacts', this.contacts);
  }

  async delete(contact: ContactModel) {
    const i = this.contacts.indexOf(contact);
    this.contacts.splice(i, 1);
    await this.storage.set('contacts', this.contacts);
  }

  search(event: any) {
    const query = event.detail.value;
    if (query) {
      this.filteredContacts = this.contacts.filter(c => c.name.includes(query));
    } else {
      this.filteredContacts = this.contacts;
    }
  }

  ngOnDestroy(): void {
    if (this.googleListeningSubscription) {
      this.googleListeningSubscription.unsubscribe();
    }
  }
}
