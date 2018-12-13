import { css } from './utils'

export default class Cursor {
  constructor (Editor) {
    const me = this
    me.Editor = Editor

    me.createCursor.apply(me)
  }

  createCursor () {
    const me = this

    const JSCursor = document.createElement('div')
    me.Editor.JSCursor = JSCursor
    JSCursor.className = 'JSCursor'

    me.Editor.JSEditor.appendChild(JSCursor)
  }

  moveCursor (left, top) {
    const me = this
    console.log(left)
    css(me.Editor.JSCursor, {
      left: left + 'px',
      top: top + 'px'
    })
  }
  
}