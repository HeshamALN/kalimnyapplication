import { Injectable } from '@angular/core';
import {NativeAudio} from '@ionic-native/native-audio/ngx';
import {Platform} from '@ionic/angular';
import {ChatService} from './chat.service';
import {AssistantName} from '../../assets/lib/assistant-name';

@Injectable({
  providedIn: 'root'
})
export class AssistantService {
  private assistantName = AssistantName;
  private profanityCounter = 0;

  public speechOptions;

  constructor(
      private nativeAudio: NativeAudio,
      private platform: Platform,
      private _chat: ChatService
  ) {
    this.setSpeechOptions();
    this.platform.ready().then(async () => {
    //  load assistant voice files into nativeAudio
    });
  }

  public getAssistantName(): string {
    return this.assistantName;
  }

  public setAssistantName(newName: string) {
    this.assistantName = newName;
  }

  public setSpeechOptions(language?: string) {
    switch (language) {
      case 'en': {
        if (this.platform.is('android')) {
          this.speechOptions = {
            language: 'en-US',
            showPopup: false,
          };
        } else {
          this.speechOptions = {
            language: 'en-US'
          };
        }
        break;
      }
      default: {
        if (this.platform.is('android')) {
          this.speechOptions = {
            language: 'ar-KW',
            showPopup: false,
          };
        } else {
          this.speechOptions = {
            language: 'ar-SA'
          };
        }
      }
    }
  }

  private getRandom(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }


  //  `==================================== PLAY ASSISTANT ANSWERS ========================================
  public playIntro(callback?: Function): Promise<any> {
    const id = this.getRandom(0, 4).toString();
    this._chat.writePhrase(id);
    return this.nativeAudio.play(id, callback);
  }

  public playProcessing(callback?: Function): Promise<any> {
    const id = this.getRandom(100, 103).toString();
    this._chat.writePhrase(id);
    return this.nativeAudio.play(id, callback);
  }

  public playSuccess(callback?: Function): Promise<any> {
    const id = this.getRandom(200, 202).toString();
    this._chat.writePhrase(id);
    return this.nativeAudio.play(id, callback);
  }

  public playRejection(callback?: Function): Promise<any> {
    const id = this.getRandom(300, 301).toString();
    this._chat.writePhrase(id);
    return this.nativeAudio.play(id, callback);
  }

  public playRepeatedRejection(callback?: Function): Promise<any> {
    const id = this.getRandom(380, 382).toString();
    this._chat.writePhrase(id);
    return this.nativeAudio.play(id, callback);
  }

  public playProfanity(callback?: Function): Promise<any> {
    this.profanityCounter++;
    const id = this.getRandom(400, 402).toString();
    this._chat.writePhrase(id);
    return this.nativeAudio.play(id, callback);
  }

  public playWhatsTheName(callback?: Function) {
    return this.nativeAudio.play('whatsTheName', callback);
  }

  public playCalenderTitle(callback?: Function) {
    this._chat.writePhrase('calenderTitle');
    return this.nativeAudio.play('calenderTitle', callback);
  }

  public playListening(callback?: Function) {
    this._chat.writePhrase('listening');
    return this.nativeAudio.play('listening', callback);
  }
}
