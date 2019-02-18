import { css } from './utils'
import Cursor from './cursor'
import Textarea from './textarea'
import Content from './content'
import ScrollBar from './scrollBar'
import editorDefaultConfig from './config/editorDefault'
import './editor.scss'

export default class Editor {
  constructor(target, options) {
    const { initText = '' } = options
    for (let key in editorDefaultConfig) {
      this[key] = editorDefaultConfig[key]
    }
    
    this.textPerLine = initText.split(/\r\n|\r|\n/)
    this.textSnapShot.push(this.textPerLine.concat([]))
    this.cursorSnapShot.push(Object.assign({}, this.cursorInfo))
    this.createEditor(target)
  }

  createEditor(target) {
    const JSEditor = document.createElement('div')
    this.JSEditor = JSEditor
    JSEditor.className = 'JSEditor'
    const userAgent = navigator.userAgent.toLowerCase()
    if (userAgent.indexOf('mac')) {
      this.userAgent = 'mac'
    } else if (userAgent.indexOf('win')) {
      this.userAgent.indexOf('windows')
    }

    css(JSEditor, {
      fontSize: this.fontSize + 'px',
      background: this.theme.background,
      color: this.theme.color
    })

    target.appendChild(JSEditor)

    const JSEditorInfo = JSEditor.getBoundingClientRect()
    this.editorInfo = {
      top:  JSEditorInfo.top,
      left:  JSEditorInfo.left,
      width:  JSEditorInfo.width,
      height:  JSEditorInfo.height,
    }
    this.editorTop = JSEditorInfo.top
    this.editorLeft = JSEditorInfo.left
    this.editorWidth = JSEditorInfo.width
    this.editorHeight = JSEditorInfo.height
    this.copyTextPerLine = this.textPerLine.concat([])
    this.copyCursorInfo = Object.assign({}, this.cursorInfo)
    this.initComWidthEl()
    this.textarea = new Textarea(this)
    this.cursor = new Cursor(this)
    this.scrollBar = new ScrollBar(this)
    this.content = new Content(this)
  }
  initComWidthEl() {
    const dom = document.createElement('div')
    const el = document.createElement('pre')
    el.style = `position:absolute;visibility:hidden;font-size:${this.fontSize}px`
    dom.appendChild(el)
    this.JSEditor.appendChild(dom)
    this.comWidthEl = el
  }
  getTargetWidth(target) {
    let txt = ''
    if (typeof target === 'object' && target instanceof HTMLElement) {
      txt = target.innerText
    } else {
      txt = String(target)
    }
    this.comWidthEl.innerText = txt
    return this.comWidthEl.getBoundingClientRect().width
  }
  getPreviousTextLength(target) {
    let length = 0
    let dom = target.previousSibling
    while(dom !== null) {
      length += dom.innerText.length
      dom = dom.previousSibling
    }

    return length
  }
  snapShot() {
    this.textSnapShot.push(this.copyTextPerLine.concat([]))
    this.cursorSnapShot.push(Object.assign({}, this.copyCursorInfo))
    console.log(this.copyCursorInfo)
    console.log(this.copyTextPerLine)
  }
}
