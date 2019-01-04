import editorDefaultConfig from './config/editorDefault'
import { css } from './utils'
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

    // const Editor = this.Editor
    // let str = ''

    // editorDefaultConfig.textPerLine.forEach((it) => {
    //   str += it + '\r\n'
    // })

    // JSTextarea.value = str
  
    JSTextarea.addEventListener('input', (e) => {
      const { textPerLine, copyTextPerLine, lineHeight, gutterWidth } = this.Editor
      const { cursorStrIndex, cursorLineIndex } = this.Editor.cursorInfo
      console.log(this.Editor.cursorInfo)
      console.log(e.target.value)
      console.log(e.target.value.split(/\r\n|\r|\n/))
      const valueArr = e.target.value.split(/\r\n|\r|\n/)
      let text
      if (valueArr.length === 1) {
        text = copyTextPerLine[cursorLineIndex].slice(0, cursorStrIndex) + e.target.value + copyTextPerLine[cursorLineIndex].slice(cursorStrIndex)
        textPerLine[cursorLineIndex] = text
      } else {
        valueArr.forEach((it, index) => {
          if (index === 0) {
            textPerLine[cursorLineIndex] = copyTextPerLine[cursorLineIndex].slice(0, cursorStrIndex) + e.target.value
          } else if (index === valueArr.length - 1) {
            textPerLine.splice(cursorLineIndex + index, 0, it + copyTextPerLine[cursorLineIndex].slice(cursorStrIndex))
          } else {
            textPerLine.splice(cursorLineIndex + index, 0, it)
          }
        })
        this.preInputAction()
      }
      console.log(text)
      this.Editor.cursorInfo.cursorStrIndex = this.Editor.cursorInfo.cursorStrIndex + valueArr.pop().length
      this.Editor.cursor.moveCursor(gutterWidth + this.Editor.getTargetWidth(copyTextPerLine[cursorLineIndex].slice(0, cursorStrIndex) + e.target.value), cursorLineIndex * lineHeight)
      
      this.Editor.content.renderLine()
    })

    JSTextareaWrap.appendChild(JSTextarea)

    this.Editor.JSEditor.appendChild(JSTextareaWrap)
  }
  moveTextarea(left, top) {
    css(this.Editor.JSTextareaWrap, {
      left: left + 'px',
      top: top + 'px'
    })
  }
  preInputAction() {
    this.Editor.copyTextPerLine = this.Editor.textPerLine.concat([])
    this.Editor.copyCursorInfo = Object.assign({}, this.Editor.cursorInfo)
    this.Editor.JSTextarea.value = ''
  }
}