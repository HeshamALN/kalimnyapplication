import {AfterViewChecked, ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {ActionSheetController, MenuController, Platform} from '@ionic/angular';
import {SpeechRecognition} from '@ionic-native/speech-recognition/ngx';
import {TextToSpeech} from '@ionic-native/text-to-speech/ngx';
import {ItemModel} from '../../models/item.model';
import {TranslationModel} from '../../models/translation.model';
import {ResultModel} from '../../models/result.model';
import {SearchService} from '../../services/search.service';
import {InstantTranslationService} from '../../services/instant-translation.service';
import {Camera} from '@ionic-native/camera/ngx';

import {Subscription} from 'rxjs';
import {Storage} from '@ionic/storage';
import {ImageResultModel} from '../../models/imageResult.model';

import {NotificationsService} from '../../services/notifications.service';

import Artyom from 'resources/my_plugins/Artyom.js/artyom.js';
import {AppLauncherService} from '../../services/app-launcher.service';
import {AssistantService} from '../../services/assistant.service';
import {LaunchNavigator} from '@ionic-native/launch-navigator/ngx';
import {ContactsService} from '../../services/contacts.service';
import {Calendar} from '@ionic-native/calendar/ngx';
import {DrawerState} from 'ion-bottom-drawer';

import {Suggestions} from '../../../assets/lib/suggestions';
import {ChatService} from '../../services/chat.service';
import {Router} from '@angular/router';
import {KuwaitiUserCommands} from '../../../assets/lib/kuwaitiUserCommands';

const artyom = new Artyom();

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy, AfterViewChecked {
  drawerState: DrawerState;
  minimumHeight: number;
  dockedHeight: number;
  shouldBounce: boolean;
  distanceTop: number;
  disableDrag: boolean;
  transition: string;
  fivePercentHeight: number;

  public items: ItemModel[];
  public images;

  progress;

  translation: string;

  suggestions: string[] = [];

  private googleListeningSubscription: Subscription;
  private searchSubscription: Subscription;
  private translationSubscription: Subscription;

  isListening: boolean;
  isProcessing: boolean;

  constructor(
      private platform: Platform,
      private cd: ChangeDetectorRef,
      private speechReco: SpeechRecognition,
      private tts: TextToSpeech,
      private zone: NgZone,
      private storage: Storage,
      private menu: MenuController,
      private camera: Camera,
      private actionSheetCtrl: ActionSheetController,
      private _instantTranslation: InstantTranslationService,
      private _notification: NotificationsService,
      private _search: SearchService,
      private _appLauncher: AppLauncherService,
      public _assistant: AssistantService,
      private launchNav: LaunchNavigator,
      private _contacts: ContactsService,
      private calendar: Calendar,
      private router: Router,
      public _chat: ChatService,
  ) {
    this.fivePercentHeight = (platform.height() - 80) * 0.05;
    this.drawerState = DrawerState.Docked;
    this.minimumHeight = this.fivePercentHeight;
    this.dockedHeight = 200;
    this.shouldBounce = true;
    this.distanceTop = 56;
    this.disableDrag = false;
  }

  ngAfterViewChecked(): void {}

  ngOnInit() {
    this.platform.ready().then(() => {
      if (this.platform.is('cordova')) {
        this._assistant.playIntro();
        this.writeRandomSuggestion();
        this.backbuttonLogic();
        this.isListening = false;
        this.isProcessing = false;
        try {
          this.initializeCommands();
        } catch (e) {
          console.error(e);
        }
      }
      this.suggestions = this.shuffle(Suggestions);
    });
  }

  private initializeCommands() {
    artyom.addCommands([
      {
        description: 'statement.profanity',
        indexes: KuwaitiUserCommands.statements.profanity,
        action: (i, wildcard) => {
          this.setIsProcessing(false);
          this._assistant.playProfanity();
        }
      },
      {
        description: 'question.personal',
        indexes: KuwaitiUserCommands.questions.personal.howAreYou,
        action: (i, wildcard) => {
          this.setIsProcessing(false);
          this._assistant.playIntro().then(() => {
            this.listenWithGoogle();
          });
        }
      },
      {
        description: 'command.exit',
        indexes: KuwaitiUserCommands.commands.exit,
        action: (i, wildcard) => {
          this.setIsProcessing(false);
          this.exit();
        }
      },
      {
        description: 'command.whatsapp.contact',
        indexes: KuwaitiUserCommands.commands.whatsapp.contact,
        smart: true,
        action: (i, wildcard) => {
          const words = wildcard.split(' ');
          this._contacts.sendWhatsappMessage(words)
            .then((res: any) => {
              if (res) {
                wildcard = this.clearText(wildcard);
                wildcard = wildcard.toLowerCase().replace(res.name.toLowerCase(), '');
                this.openLink('https://api.whatsapp.com/send?phone=' + res.phoneNumber + '&text=' + wildcard);
              }
            }).catch(err => {
            this._assistant.playRejection();
            this.writeToChat('لا توجد جهة مسجلة بهذا الإسم', true);
          }).finally(() => {
            this.setIsProcessing(false);
          });
        }
      },
      {
        description: 'command.call.contact',
        indexes: KuwaitiUserCommands.commands.call,
        smart: true,
        action: (i, wildcard) => {
          this._contacts.makeCall(wildcard).then(() => {
            this.setIsProcessing(false);
          }).catch(() => {
            this.setIsProcessing(false);
            this._assistant.playRejection();
            this.writeToChat('الرجاء إضافة جهات إتصال', true);
          });
        }
      },
      {
        description: 'command.scheduleAppointment',
        indexes: KuwaitiUserCommands.commands.scheduleAppointment,
        action: async (i, wildcard) => {
          // TODO: fix this bitch
          await this.createEvent();
          this.setIsProcessing(false);
        }
      },
      {
        description: 'command.whatsapp.general',
        indexes: KuwaitiUserCommands.commands.whatsapp.general,
        smart: true,
        action: (i, wildcard) => {
          wildcard = this.clearText(wildcard);
          this.setIsProcessing(false);
          this.openLink('https://api.whatsapp.com/send?text=' + wildcard);
        }
      },
      {
        description: 'command.translate',
        indexes: KuwaitiUserCommands.commands.translate,
        smart: true,
        action: (i, wildcard) => {
          wildcard = this.clearText(wildcard);
          this.translationSubscription = this._instantTranslation.arToEn(wildcard)
            .subscribe((translation: TranslationModel) => {
              this.tts.speak(translation.outputs[0].output);
              this.writeToChat(translation.outputs[0].output, true, true);
              this.setIsProcessing(false);
            }, err => {
              this._assistant.playRejection();
              this.setIsProcessing(false);
              console.error(err);
            });
        }
      },
      {
        description: 'command.tweet',
        indexes: KuwaitiUserCommands.commands.tweet,
        smart: true,
        action: (i, wildcard) => {
          wildcard = this.clearText(wildcard);
          this.setIsProcessing(false);
          this.openLink('https://twitter.com/intent/tweet?text=' + wildcard);
        }
      },
      {
        description: 'command.launchApp',
        indexes: KuwaitiUserCommands.commands.launchApp,
        smart: true,
        action: (i, wildcard) => {
          wildcard = this.clearText(wildcard);
          wildcard = wildcard.replace(' ', '');
          this.setIsProcessing(false);
          this._appLauncher.openExtApp(wildcard);
        }
      },
      {
        description: 'command.navigateTo',
        indexes: KuwaitiUserCommands.commands.navigateTo,
        smart: true,
        action: (i, wildcard) => {
          wildcard = this.clearText(wildcard);
          this.setIsProcessing(false);
          this.navigate(wildcard);
        }
      },
      {
        description: 'command.search.images',
        indexes: KuwaitiUserCommands.commands.search.images,
        smart: true,
        action: (i, wildcard) => {
          wildcard = this.clearText(wildcard);
          this.searchImages(wildcard);
        }
      },
      {
        description: 'command.search.text',
        indexes: KuwaitiUserCommands.commands.search.text,
        smart: true,
        action: (i, wildcard) => {
          wildcard = this.clearText(wildcard);
          this.search(wildcard);
        }
      },
      {
        description: 'statement.addressing',
        indexes: KuwaitiUserCommands.statements.addressing,
        action: (i, wildcard) => {
          this.setIsProcessing(false);
          this._assistant.playIntro();
        }
      },
    ]);
  }

  public listenWithGoogle() {
    this.speechReco.hasPermission().then((hasPermission: boolean) => {
      if (hasPermission) {
        this.setIsListening(true);
        this.googleListeningSubscription = this.speechReco.startListening(this._assistant.speechOptions).subscribe(
          (successes: string[]) => {
            this.setIsListening(false);
            this.setIsProcessing(true);
            this.writeToChat(successes[0], false);
            this._assistant.playProcessing(async () => {
              if (!artyom.simulateInstruction(successes[0])) {
                // TODO: show user some suggestions
                if (successes[0]) {
                  const wildcard = this.clearText(successes[0]);
                  this.search(wildcard);
                }
                this.setIsProcessing(false);
              }
            }).catch(err => {
              this.setIsListening(false);
              this.setIsProcessing(false);
              console.error(err);
            });
          },
          async (err) => {
            if (err === 'RecognitionService busy') {
              await this._assistant.playListening();
            } else {
              this.setIsListening(false);
              this.setIsProcessing(false);
              this._assistant.playRejection();
              if (err === 'No match') {
                this._chat.writeRandomSuggestion();
              }
            }
            this.zone.run(() => this.cd.detectChanges());
          });
      } else {
        this.speechReco.requestPermission().then(res => {
          this.listenWithGoogle();
        }).catch(err => {
          this.writeToChat('الرجاء السماح بإستخدام المايكروفون', true);
        });
      }
    });
  }

  async stopListeningWithGoogle() {
    this.isIOS()
      ? await this.speechReco.stopListening()
      : null;
    this.setIsListening(false);
  }

  navigate(destination: string) {
    this.launchNav.isAppAvailable(this.launchNav.APP.GOOGLE_MAPS).then(isAvailable => {
      let app;
      if (isAvailable) {
        app = this.launchNav.APP.GOOGLE_MAPS;
      } else {
        console.warn('Google Maps not available - falling back to user selection');
        app = this.launchNav.APP.USER_SELECT;
      }
      this.launchNav.navigate(destination, {
        app: app
      });
    });
  }

  clearText(wildcard: string): string {
    if (wildcard.startsWith('حبيبي ')) {
      wildcard = wildcard.replace('حبيبي', '');
    } else if (wildcard.startsWith('حبيب ')) {
      wildcard = wildcard.replace('حبيب', '');
    } else if (wildcard.startsWith('حبيبتي ')) {
      wildcard = wildcard.replace('حبيبتي', '');
    }
    return wildcard;
  }

  public search(query: string) {
    this.images = [];
    this.searchSubscription = this._search.textSearchWithGoogle(query).subscribe(
      async (result: ResultModel) => {
        if (result.items.length < 1) {
          this.setIsProcessing(false);
          this._assistant.playRejection();
          return;
        } else {
          this._assistant.playSuccess();
        }
        this.items = result.items;
        this.drawerState = DrawerState.Docked;
        this.setIsProcessing(false);
      },
      error => {
        this.setIsProcessing(false);
        this._assistant.playRejection();
        console.error(error);
      });
  }

  searchImages(entry: string) {
    this.items = [];
      this._instantTranslation.arToEn(entry).subscribe((res: TranslationModel) => {
        this.searchSubscription = this._search.imageSearch(res.outputs[0].output).subscribe(
          (images: ImageResultModel) => {
            if (images.value.length < 1) {
              this.setIsProcessing(false);
              this._assistant.playRejection();
              return;

            } else {
              this._assistant.playSuccess();
            }
            this.images = images.value;
            this.drawerState = DrawerState.Docked;
            this.setIsProcessing(false);
          },
          error => {
            this._assistant.playRejection();
            this.setIsProcessing(false);
            console.error(error);
          }
        );
      }, err => {
        this.setIsProcessing(false);
        console.error(err);
      });
  }

  setIsListening(status: boolean) {
    this.isListening = status;
    this.zone.run(() => this.cd.detectChanges());
  }

  setIsProcessing(status: boolean) {
    this.isProcessing = status;
    this.zone.run(() => this.cd.detectChanges());
  }

  createEvent() {
    return this._assistant.playCalenderTitle(async () => {
      const hasPermission = await this.speechReco.hasPermission();
      if (hasPermission) {
        this.setIsListening(true);
        this.googleListeningSubscription = this.speechReco.startListening(this._assistant.speechOptions).subscribe(
          async (successes: string[]) => {
            this.setIsListening(false);
            const title = successes[0];
            await this.calendar.createEventInteractivelyWithOptions(title, null, null,
              new Date(Date.now()), null);
          },
          (error) => {
            this._assistant.playRejection();
            this.setIsListening(false);
          }
        );
      } else {
        this.speechReco.requestPermission()
          .then(this.createEvent)
          .catch(err => {
            this.writeToChat('الرجاء السماح بإستخدام المايكروفون', true);
          });
      }
    }).catch(console.error);
  }

  public openLink(link: string, i?: number) {
    if (i) {
      const element = document.getElementById(`card${i}`);
      element.classList.add('zoomOut');
    }
    window.location.href = link;
    if (i) {
      const element = document.getElementById(`card${i}`);
      element.classList.add('zoomIn');
    }
  }

  private writeRandomSuggestion() {
    this._chat.writeRandomSuggestion();
    this.zone.run(() => this.cd.detectChanges());
  }

  private writeToChat(text: string, byAssistant: boolean, translation?: boolean) {
    this._chat.writeToChat(text, byAssistant, translation);
    this.zone.run(() => this.cd.detectChanges());
  }

  private shuffle(array) {
    let currentIndex = array.length, temporaryValue, randomIndex;
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  }

  private exit() {
    navigator['app'].exitApp();
  }

  backbuttonLogic() {
    this.platform.backButton.subscribe(async () => {
      if (this.router.url === '/home') {
        if (this.drawerState !== DrawerState.Bottom) {
          this.drawerState = DrawerState.Bottom;
        } else {
          this.exit();
        }
      }
    });
  }

  private isAndroid() {
    return this.platform.is('android');
  }

  private isIOS() {
    return this.platform.is('ios');
  }

  onPause() {
    console.log('paused!');
  }

  onResume() {
    console.log('resumed!');
    // this.listenWithGoogle();
  }

  onMenuKeyDown() {
    console.log('menu key downed!');
  }

  ngOnDestroy(): void {
    if (this.googleListeningSubscription) {
      this.googleListeningSubscription.unsubscribe();
    }
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
    if (this.translationSubscription) {
      this.translationSubscription.unsubscribe();
    }
    this.platform.backButton.unsubscribe();
  }
}
