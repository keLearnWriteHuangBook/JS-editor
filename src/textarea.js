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

    JSTextarea.addEventListener('input', function() {
      console.log(this)
      console.log(this.value)
    })

    JSTextareaWrap.appendChild(JSTextarea)

    this.Editor.JSEditor.appendChild(JSTextareaWrap)
  }
}
