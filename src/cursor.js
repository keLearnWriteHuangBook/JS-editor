import { css } from './utils'
import './cursor.scss'

export default class Cursor {
  constructor(Editor) {
    this.Editor = Editor
    Editor.cursorInfo = {
      left: 0,
      top: 0
    }

    this.createCursor()
  }

  createCursor() {
    const JSCursor = document.createElement('div')
    this.Editor.JSCursor = JSCursor
    JSCursor.className = 'JSCursor'
    this.Editor.JSEditor.appendChild(JSCursor)
  }

  moveCursor(left, top) {
    !isNaN(left) || (left = this.Editor.cursorInfo.left)
    !isNaN(top) || (top = this.Editor.cursorInfo.top)
    
    let nextLeft = left - this.Editor.scrollBarInfo.horizonScrollLeft * this.Editor.scrollBarInfo.horizonRate
    let nextTop = top - this.Editor.scrollBarInfo.verticalScrollTop * this.Editor.scrollBarInfo.verticalRate
 
    css(this.Editor.JSCursor, {
      left: nextLeft + 'px',
      top: nextTop + 'px'
    })
    this.Editor.cursorInfo = {
      left,
      top
    }
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
    const { editorTop, lineHeight, JSEditor, cursor, gutterWidth } = this.Editor
    const curLine = Math.max(Math.floor((e.clientY - editorTop) / lineHeight), 0),
      clientY = curLine * lineHeight + lineHeight / 2,
      range = document.caretRangeFromPoint(e.clientX, clientY + editorTop),
      endContainer = range.endContainer
   
    if (JSEditor.contains(e.target)) {
      if (endContainer.nodeType === 3) {
        const parentNode = endContainer.parentNode
        if (parentNode.className === 'JSGutter') {
          this.moveToLineStart(curLine)
        } else {
          const txt = parentNode.innerText.slice(0, range.endOffset),
            width = this.Editor.getTargetWidth(txt)
          cursor.moveCursor(width + gutterWidth + parentNode.offsetLeft, curLine * lineHeight)
        }
      } else {}
    } else {
      this.moveToLineStart(curLine)
    }
  }
}
