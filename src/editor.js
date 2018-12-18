import { css } from './utils'
import Cursor from './cursor'
import Textarea from './textarea'
import Content from './content'
import ScrollBar from './scrollBar'
import editorDefaultConfig from './config/editorDefault'
import './editor.scss'

export default class Editor {
  constructor(target) {
    for (let key in editorDefaultConfig) {
      this[key] = editorDefaultConfig[key]
    }
    this.createEditor(target)
  }

  createEditor(target) {
    const JSEditor = document.createElement('div')
    this.JSEditor = JSEditor
    JSEditor.className = 'JSEditor'

    css(JSEditor, {
      fontSize: this.fontSize + 'px',
      background: this.theme.background,
      color: this.theme.color
    })

    target.appendChild(JSEditor)

    const JSEditorInfo = JSEditor.getBoundingClientRect()
    this.editorTop = JSEditorInfo.top
    this.editorLeft = JSEditorInfo.left
    this.editorWidth = JSEditorInfo.width
    this.editorHeight = JSEditorInfo.height

    this.textarea = new Textarea(this)
    this.cursor = new Cursor(this)
    this.scrollBar = new ScrollBar(this)
    this.content = new Content(this)
  }
}
