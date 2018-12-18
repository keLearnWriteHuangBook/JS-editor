import { css } from './utils'
import Cursor from './cursor'
import Textarea from './textarea'
import Content from './content'
import ScrollBar from './scrollBar'
import './editor.scss'

export default class Editor {
  constructor (that, target) {
    const me = this

    me.createEditor.apply(me, [that, target])
  }

  createEditor (that, target) {
    const me = this

    const JSEditor = document.createElement('div')
    that.JSEditor = JSEditor
    JSEditor.className = 'JSEditor'

    css(JSEditor, {
      fontSize: that.fontSize + 'px',
      background: that.theme.background,
      color: that.theme.color
    })

    target.appendChild(JSEditor)

    const JSEditorInfo = JSEditor.getBoundingClientRect()
    that.editorTop = JSEditorInfo.top
    that.editorLeft = JSEditorInfo.left
    that.editorWidth = JSEditorInfo.width
    that.editorHeight = JSEditorInfo.height

    that.textarea = new Textarea(that)
    that.cursor = new Cursor(that)
    that.scrollBar = new ScrollBar(that)
    that.content = new Content(that)
  }
}