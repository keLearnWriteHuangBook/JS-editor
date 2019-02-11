import { css } from './utils'
import { interval } from 'rxjs'
import './cursor.scss'

export default class Cursor {
  constructor(Editor) {
    this.Editor = Editor

    this.createCursor()
  }

  createCursor() {
    const JSCursor = document.createElement('div')
    this.Editor.JSCursor = JSCursor
    JSCursor.className = 'JSCursor'
    this.Editor.JSEditor.appendChild(JSCursor)
  }

  moveCursor(left, top) {
    const { cursorInfo, scrollBarInfo, lineHeight, JSCursor, gutterWidth } = this.Editor
    !isNaN(left) || (left = cursorInfo.left)
    !isNaN(top) || (top = cursorInfo.top)
    // console.log(left)
    // console.log(top)
    let nextLeft = left - scrollBarInfo.horizonScrollLeft * scrollBarInfo.horizonRate
    let nextTop = top - scrollBarInfo.verticalScrollTop * scrollBarInfo.verticalRate
  
    // console.log(nextLeft)
    // console.log(nextTop)
    nextLeft < gutterWidth || nextTop + lineHeight < 0 ? this.hideCursor() : this.showCursor()
 
    css(JSCursor, {
      left: nextLeft + 'px',
      top: nextTop + 'px'
    })
    this.Editor.textarea.moveTextarea(nextLeft, nextTop)
    this.Editor.cursorInfo.left = left
    this.Editor.cursorInfo.top = top
    this.Editor.cursorInfo.cursorLineIndex = top / lineHeight
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

  showCursor() {
    const { JSCursor } = this.Editor
    css(JSCursor, {
      display: 'block'
    })

    this.clearTimer()
    this.timer = interval(500).subscribe(num => {
      if (num % 2 === 0) {
        css(JSCursor, {
          display: 'none'
        })
      } else {
        css(JSCursor, {
          display: 'block'
        })
      }
    })
  }

  hideCursor() {
    css(this.Editor.JSCursor, {
      display: 'none'
    })
    this.clearTimer()
  }

  clearTimer() {
    this.timer && this.timer.unsubscribe()
  }

  setCursorStrIndex(index) {
    this.Editor.cursorInfo.cursorStrIndex = index
  }
  setCursorLineIndex(index) {
    this.Editor.cursorInfo.cursorLineIndex = index
  }
}
