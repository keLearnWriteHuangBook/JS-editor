import { css } from './utils'
import Cursor from './cursor'
import Textarea from './textarea'
import Content from './content'

export default class kEditor {
  constructor (that, target) {
    const me = this

    me.createEditor.apply(me, [that, target])
  }

  createEditor (that, target) {
    const me = this

    const KJSEditor = document.createElement('div')
    that.KJSEditor = KJSEditor
    KJSEditor.className = 'KJSEditor'

    css(KJSEditor, {
      fontSize: that.fontSize + 'px',
      background: that.theme.background,
      color: that.theme.color
    })

    target.appendChild(KJSEditor)

    that.textarea = new Textarea(that)
    that.cursor = new Cursor(that)
    that.content = new Content(that)
  }
}