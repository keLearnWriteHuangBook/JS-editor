export default class kCursor {
  constructor (Editor) {
    const me = this
    me.Editor = Editor

    me.createCursor.apply(me)
  }

  createCursor () {
    const me = this

    const KJSCursor = document.createElement('div')
    me.Editor.KJSCursor = KJSCursor
    KJSCursor.className = 'KJSCursor'

    me.Editor.KJSEditor.appendChild(KJSCursor)
  }

  moveCursor (x, y) {

  }
  
}