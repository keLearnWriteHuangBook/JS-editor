export default class kTextarea {
  constructor (Editor) {
    const me = this
    me.Editor = Editor

    me.createTextarea.apply(me)
  }

  createTextarea () {
    const me = this

    const KJSTextareaWrap = document.createElement('div')
    me.Editor.KJSTextareaWrap = KJSTextareaWrap
    KJSTextareaWrap.className = 'KJSTextareaWrap'

    const KJSTextarea = document.createElement('textarea')
    me.Editor.KJSTextarea = KJSTextarea
    KJSTextarea.className = 'KJSTextarea'

    KJSTextarea.addEventListener('input', function() {
      console.log(this)
      console.log(this.value)
    })

    KJSTextareaWrap.appendChild(KJSTextarea)

    me.Editor.KJSEditor.appendChild(KJSTextareaWrap)
  }
}