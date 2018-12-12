import Editor from './editor'
import './index.scss'
console.log(312312)
const kJSEditor = class JSEditor {
  constructor(target) {
    const me = this

    me.fontSize = 14
    me.lineHeight = 20
    me.theme = {
      background: 'rgba(0, 0, 0, 0.9)',
      color: '#fff'
    }
    me.KJSEditor = null
    me.textPerLine = [
      '4反倒是===23423 423 432423',
      '大叔大婶<span>==----=呵呵</span><span>呵呵</span><span>呵呵</span><span>呵呵</span><span>呵呵</span><span>呵呵</span>',
      '可',
      'ᄀ',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a',
      'a'
    ]

    me.init.apply(me, [target])
  }

  init(target, a) {
    const me = this

    me.Editor = new Editor(me, target)
  }
}

export default kJSEditor
