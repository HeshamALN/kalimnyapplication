import {ChangeDetectorRef, Component, NgZone, OnInit} from '@angular/core';
import {MenuController, Platform} from '@ionic/angular';
import {SplashScreen} from '@ionic-native/splash-screen/ngx';
import {StatusBar} from '@ionic-native/status-bar/ngx';
import {Router} from '@angular/router';
import {Storage} from '@ionic/storage';
import {NotificationsService} from './services/notifications.service';
import {AssistantService} from './services/assistant.service';
import {LocalNotifications} from '@ionic-native/local-notifications/ngx';
import {ChatService} from './services/chat.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent implements OnInit {
  notificationStatus: boolean;

  constructor(
      private platform: Platform,
      private splashScreen: SplashScreen,
      private statusBar: StatusBar,
      private router: Router,
      private storage: Storage,
      private menuCtrl: MenuController,
      public _notification: NotificationsService,
      public _assistant: AssistantService,
      private cd: ChangeDetectorRef,
      private zone: NgZone,
      public menu: MenuController,
      private localNotifications: LocalNotifications,
      private _chat: ChatService,
  ) {
    this.initializeApp();
  }

  ngOnInit() {
    this.platform.ready().then(async () => {
      this._chat.initializePhrases();
      await Promise.all([
        await this.getNotificationStatus(),
      ]);
    });
  }

  getNotificationStatus() {
    return this.storage.get('notification').then(async status => {
      if (status !== null) {
        if (status) {
          setTimeout(() => {
            this.notificationStatus = status;
          }, 5000);
        }
      } else {
        this.notificationStatus = false;
      }
    });
  }

  async changeNotificationStatus(event: any) {
    const status = event.detail.checked;
    this.notificationStatus = status;
    await this._notification.updateNotificationStatus(status);
  }

  exit() {
    this.localNotifications.cancel(1);
    navigator['app'].exitApp();
  }

  private initializeApp() {
    this.platform.ready().then(async () => {
      this.statusBar.hide();
      this.splashScreen.hide();
      this._notification.getNotificationsPermission();
    });
  }
}
