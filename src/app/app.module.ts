import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { IonicStorageModule } from '@ionic/storage';
import {AppLauncher} from '@ionic-native/app-launcher/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { SpeechRecognition } from '@ionic-native/speech-recognition/ngx';
import { TextToSpeech } from '@ionic-native/text-to-speech/ngx';
import { HTTP } from '@ionic-native/http/ngx';
import { HttpClientModule } from '@angular/common/http';
import {OpenNativeSettings} from '@ionic-native/open-native-settings/ngx';
import {NativeAudio} from '@ionic-native/native-audio/ngx';
import {Contacts} from '@ionic-native/contacts/ngx';
import {LaunchNavigator} from '@ionic-native/launch-navigator/ngx';
import {CallNumber} from '@ionic-native/call-number/ngx';
import {Calendar} from '@ionic-native/calendar/ngx';
import {IonBottomDrawerModule} from 'ion-bottom-drawer';
import {LocalNotifications} from '@ionic-native/local-notifications/ngx';
import {Toast} from '@ionic-native/toast/ngx';

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    IonBottomDrawerModule,
    AppRoutingModule,
    HttpClientModule,
    IonicStorageModule.forRoot()
  ],
  providers: [
    StatusBar,
    SplashScreen,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    SpeechRecognition,
    TextToSpeech,
    AppLauncher,
    OpenNativeSettings,
    NativeAudio,
    HTTP,
    Contacts,
    LaunchNavigator,
    CallNumber,
    Calendar,
    LocalNotifications,
    Toast,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
