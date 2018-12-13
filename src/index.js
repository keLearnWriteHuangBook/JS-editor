import Editor from './editor'
import './index.scss'

const JSEditor = class JSEditor {
  constructor(target) {
    const me = this

    me.target = target
    me.fontSize = 14
    me.lineHeight = 20
    me.theme = {
      background: 'rgba(0, 0, 0, 0.9)',
      color: '#fff'
    }
    me.JSEditor = null
    me.textPerLine = [
      '4反倒是===23423 423 432423',
      '大叔大婶<span>==----=呵呵</span><span>呵呵</span><span>呵呵</span><span>呵呵</span><span>呵呵</span><span>呵呵</span>',
      '可d',
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
    me.gutterWidth = 60
    me.init.apply(me, [target])
  }

  init(target, a) {
    const me = this
    
    me.Editor = new Editor(me, target)
  }
}

export default JSEditor
