import {Injectable, OnInit} from '@angular/core';
import {MessageModel} from '../models/message.model';

import {Suggestions} from '../../assets/lib/suggestions';

@Injectable({
  providedIn: 'root'
})
export class ChatService implements OnInit {
  public chat: MessageModel[];
  private phrases: Map<string, string>;
  public lastRejectedCommand: string;

  constructor(
  ) {
    this.chat = [];
    this.phrases = new Map<string, string>();
    this.lastRejectedCommand = '';
  }

  ngOnInit(): void {
  }

  public writeToChat(text: string, byAssistant: boolean, translation?: boolean) {
    this.chat.push({
      text: text,
      byAssistant: byAssistant,
      translation: translation
    });
  }

  public writeRandomSuggestion() {
    this.chat.push({
      text: `جرب تضغط على المايك وتقول: ${this.shuffle(Suggestions)[0]}`,
      byAssistant: true
    });
  }

  public writePhrase(id: string) {
    const text = this.phrases.get(id);
    this.chat.push({
      text: text,
      byAssistant: true
    });
  }

  public initializePhrases() {
    // preload intro === 0 - 99
    this.phrases.set('0', 'انا حبيبة امرني');
    this.phrases.set('1', 'انا حبيبة شلون اقدر اساعدك');
    this.phrases.set('2', 'هلا يا بعد روحي');
    this.phrases.set('3', 'يا بعد ريحة هلي');
    this.phrases.set('4', 'انا حبيبة تفضل');
    // preload processing === 100 - 199
    this.phrases.set('100', 'انزين الحين اشوف لك');
    this.phrases.set('101', 'انزين لحظه');
    this.phrases.set('102', 'اوكي');
    this.phrases.set('103', 'لحظه');
    // preload successes === 200 - 299
    this.phrases.set('200', 'لقيت لك الي تبيه');
    this.phrases.set('201', 'كا اشتبي بعد');
    this.phrases.set('202', 'تفضل هذا الموجود');
    // preload rejections === 300 - 379
    this.phrases.set('300', 'اسفة ما لقيت شي');
    this.phrases.set('301', 'لا صعبه');
    // preload repeated-rejections === 380 - 399
    this.phrases.set('380', 'اقول لك ما ادري');
    this.phrases.set('381', 'اقول لك ما اعرف');
    this.phrases.set('382', 'مادري لا تحن');
    // preload profanity answers === 400 - 499
    this.phrases.set('400', 'عيب عليك');
    this.phrases.set('401', 'انت قليل ادب');
    this.phrases.set('402', 'لا لا لا هذا غلط');
    // preload services' answers
    this.phrases.set('calenderTitle', 'شعندك؟');
    this.phrases.set('listening', 'أسمعك!');

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

}
