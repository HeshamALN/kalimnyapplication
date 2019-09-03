import {Injectable, NgZone, OnInit} from '@angular/core';
import {NavController, Platform} from '@ionic/angular';
import {Storage} from '@ionic/storage';
import {AssistantService} from './assistant.service';
import {LocalNotifications} from '@ionic-native/local-notifications/ngx';
import {Toast} from '@ionic-native/toast/ngx';

declare const FirebasePlugin: any;

@Injectable({
  providedIn: 'root'
})
export class NotificationsService implements OnInit {

  constructor(
      private platform: Platform,
      private storage: Storage,
      private _assistant: AssistantService,
      private ngZone: NgZone,
      private navCtrl: NavController,
      private localNotifications: LocalNotifications,
      private toast: Toast,
  ) {
    if (this.platform.is('cordova')) {
      this.platform.ready().then(() => {
        localNotifications.setDefaults({
          color: '#516395',
        });
        localNotifications.on('stop').subscribe(res => {
          console.log(res);
          localNotifications.cancel(1);
        });
      });
    }
  }

  ngOnInit() {}

  public displayToast(message: string) {
    return this.toast.show(message, '6000', 'center');
  }

  public getNotificationsPermission() {
    return FirebasePlugin.hasPermission(async hasPermission => {
      if (hasPermission) {
        FirebasePlugin.onTokenRefresh(async token => {
          await this._db.setNotificationToken(token);
          this.listenToNotifications();
        });
      } else {
        await FirebasePlugin.grantPermission();
        this.getNotificationsPermission();
      }
    });
  }

  public listenToNotifications() {
    FirebasePlugin.onMessageReceived(notification => {
      const message = notification.title;
      const action = this.platform.is('ios')
        ? notification.aps.click_action
        : notification.click_action;
      if (notification.tap) {
        console.log(notification);
      }
    });
  }

  updateNotificationStatus(status: boolean): Promise<void> {
    status ? this.enableNotification() : this.localNotifications.cancel(1);
    return this.storage.set('notification', status);
  }

  enableNotification() {
    this.localNotifications.schedule({
      id: 1,
      sound: null,
      vibrate: false,
      badge: 0,
      icon: 'file://assets/icon.png',
      title: this._assistant.getAssistantName() + ' مستعدة! ',
      sticky: true,
    });
  }
}
