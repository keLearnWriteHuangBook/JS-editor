import { css } from './utils'
import './cursor.scss'

export default class Cursor {
  constructor(Editor) {
    this.Editor = Editor
    this.createCursor.apply(this)
  }

  createCursor() {
    const JSCursor = document.createElement('div')
    this.Editor.JSCursor = JSCursor
    JSCursor.className = 'JSCursor'
    this.Editor.JSEditor.appendChild(JSCursor)
  }

  moveCursor(left, top) {
    css(this.Editor.JSCursor, {
      left: left + 'px',
      top: top + 'px'
    })
  }
}
