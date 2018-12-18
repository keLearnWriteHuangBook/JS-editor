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
  
  moveToLineStart(lineIndex) {
    const top = this.Editor.lineHeight * lineIndex
    this.moveCursor(this.Editor.gutterWidth, top)
  }

  moveToLineEnd(lineIndex) {
    const { textPerLine, gutterWidth, lineHeight } = this.Editor,
      lineTxt = textPerLine[lineIndex],
      top = lineHeight * lineIndex
    this.moveCursor(gutterWidth + this.Editor.getTargetWidth(lineTxt), top)
  }

  moveToClickPoint(e) {
    const Editor = this.Editor,
      curLine = Math.max(Math.floor((e.clientY - Editor.editorTop) / Editor.lineHeight), 0),
      clientY = curLine * Editor.lineHeight + Editor.lineHeight / 2,
      range = document.caretRangeFromPoint(e.clientX, clientY + Editor.editorTop),
      endContainer = range.endContainer
    if (Editor.JSEditor.contains(e.target)) {
      if (endContainer.nodeType === 3) {
        const parentNode = endContainer.parentNode
        if (parentNode.className === 'JSGutter') {
          this.moveToLineStart(curLine)
        } else {
          const txt = parentNode.innerText.slice(0, range.endOffset),
            width = Editor.getTargetWidth(txt)
          Editor.cursor.moveCursor(width + Editor.gutterWidth + parentNode.offsetLeft, curLine * Editor.lineHeight)
        }
      } else {
      }
    } else {
      this.moveToLineStart(curLine)
    }
  }
}
