import './textarea.scss'

export default class Textarea {
  constructor(Editor) {
    this.Editor = Editor

    this.createTextarea()
  }

  createTextarea() {
    const JSTextareaWrap = document.createElement('div')
    this.Editor.JSTextareaWrap = JSTextareaWrap
    JSTextareaWrap.className = 'JSTextareaWrap'

    const JSTextarea = document.createElement('textarea')
    this.Editor.JSTextarea = JSTextarea
    JSTextarea.className = 'JSTextarea'

    const Editor = this.Editor

    JSTextarea.addEventListener('input', function() {
      let curLine = parseInt(Editor.JSCursor.style.getPropertyValue('top')) / Editor.lineHeight
      console.log(curLine)
    })

    JSTextareaWrap.appendChild(JSTextarea)

    this.Editor.JSEditor.appendChild(JSTextareaWrap)
  }
}
