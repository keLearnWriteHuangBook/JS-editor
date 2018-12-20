import { css } from './utils'
import { interval } from 'rxjs'
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
    const { cursorInfo, scrollBarInfo, lineHeight, JSCursor } = this.Editor
    !isNaN(left) || (left = cursorInfo.left)
    !isNaN(top) || (top = cursorInfo.top)
    // console.log(left)
    // console.log(top)
    let nextLeft = left - scrollBarInfo.horizonScrollLeft * scrollBarInfo.horizonRate
    let nextTop = top - scrollBarInfo.verticalScrollTop * scrollBarInfo.verticalRate
    // console.log(nextLeft)
    // console.log(nextTop)
    nextLeft < 60 || nextTop + lineHeight < 0 ? this.hideCursor() : this.showCursor()

    css(JSCursor, {
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
    const { editorTop, lineHeight, JSEditor, cursor, gutterWidth, scrollBarInfo } = this.Editor
    const curLine = Math.max(
        Math.floor((e.clientY + scrollBarInfo.verticalScrollTop * scrollBarInfo.verticalRate - editorTop) / lineHeight),
        0
      ),
      clientY = curLine * lineHeight + lineHeight / 2,
      range = document.caretRangeFromPoint(e.clientX, clientY + editorTop),
      endContainer = range.endContainer
    console.log(endContainer.TEXT_NODE)
    console.log('curLine = ' + curLine)
    if (JSEditor.contains(e.target)) {
      if (endContainer.nodeType === endContainer.TEXT_NODE) {
        const parentNode = endContainer.parentNode
        if (parentNode.className === 'JSGutter') {
          this.moveToLineStart(curLine)
        } else {
          const txt = parentNode.innerText.slice(0, range.endOffset),
            width = this.Editor.getTargetWidth(txt)
          cursor.moveCursor(width + gutterWidth + parentNode.offsetLeft, curLine * lineHeight)
        }
      } else {
      }
    } else {
      this.moveToLineStart(curLine)
    }
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
}
