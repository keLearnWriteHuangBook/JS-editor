export default class Textarea {
  constructor (Editor) {
    const me = this
    me.Editor = Editor

    me.createTextarea.apply(me)
  }

  createTextarea () {
    const me = this

    const JSTextareaWrap = document.createElement('div')
    me.Editor.JSTextareaWrap = JSTextareaWrap
    JSTextareaWrap.className = 'JSTextareaWrap'

    const JSTextarea = document.createElement('textarea')
    me.Editor.JSTextarea = JSTextarea
    JSTextarea.className = 'JSTextarea'

    JSTextarea.addEventListener('input', function() {
      console.log(this)
      console.log(this.value)
    })

    JSTextareaWrap.appendChild(JSTextarea)

    me.Editor.JSEditor.appendChild(JSTextareaWrap)
  }
}