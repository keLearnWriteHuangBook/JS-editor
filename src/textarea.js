import { fromEvent } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { css, stringSplice } from './utils'
import './textarea.scss'

export default class Textarea {
  constructor(Editor) {
    this.Editor = Editor

    this.createTextarea()
  }

  createTextarea() {
    const Editor = this.Editor
    const JSTextareaWrap = document.createElement('div')
    Editor.JSTextareaWrap = JSTextareaWrap
    JSTextareaWrap.className = 'JSTextareaWrap'

    const JSTextarea = document.createElement('textarea')
    Editor.JSTextarea = JSTextarea
    JSTextarea.className = 'JSTextarea'

    const inputEvent = fromEvent(JSTextarea, 'input')
    const focusEvent = fromEvent(JSTextarea, 'focus')
    const blurEvent = fromEvent(JSTextarea, 'blur')
    const keydownEvent = fromEvent(document, 'keydown')

    inputEvent.subscribe(e => {
      const { textPerLine, copyTextPerLine, lineHeight, gutterWidth, cursor } = this.Editor
      const { cursorStrIndex, cursorLineIndex } = this.Editor.copyCursorInfo

      let cursorTop, cursorLeft

      const valueArr = e.target.value.split(/\r\n|\r|\n/)
      const cursorPreText = copyTextPerLine[cursorLineIndex].slice(0, cursorStrIndex)
      const cursorAfterText = copyTextPerLine[cursorLineIndex].slice(cursorStrIndex)

      if (valueArr.length === 1) {
        let text = cursorPreText + valueArr[0] + cursorAfterText
        textPerLine[cursorLineIndex] = text
        cursorTop = cursorLineIndex * lineHeight
        cursorLeft = gutterWidth + this.Editor.getTargetWidth(cursorPreText + valueArr[0])
        cursor.setCursorStrIndex(cursorStrIndex + valueArr[0].length)
      } else {
        valueArr.forEach((it, index) => {
          if (index === 0) {
            textPerLine[cursorLineIndex] = cursorPreText + it
          } else if (index === valueArr.length - 1) {
            textPerLine.splice(cursorLineIndex + index, 0, it + cursorAfterText)
          } else {
            textPerLine.splice(cursorLineIndex + index, 0, it)
          }
        })

        cursorTop = (cursorLineIndex + valueArr.length - 1) * lineHeight
        cursorLeft = gutterWidth
        cursor.setCursorLineIndex(cursorTop / lineHeight)
        cursor.setCursorStrIndex(0)

        this.preInputAction()
      }

      this.Editor.cursor.moveCursor(cursorLeft, cursorTop)

      this.Editor.content.renderGutter()
      this.Editor.content.renderLine()
      this.Editor.content.setLineWrapperWidth()
      this.Editor.scrollBar.setHorizonWidth()
    })

    focusEvent.subscribe(e => {
      keydownEvent.pipe(takeUntil(blurEvent)).subscribe(e => {
        if (e.keyCode === 9) {
          const { gutterWidth, tabBlank, cursor, textPerLine, scrollBar } = Editor
          const { cursorStrIndex, cursorLineIndex, top } = Editor.cursorInfo
          e.preventDefault()
          textPerLine[cursorLineIndex] = stringSplice(
            cursorStrIndex,
            textPerLine[cursorLineIndex],
            ' '.repeat(tabBlank)
          )
          cursor.setCursorStrIndex(cursorStrIndex + tabBlank)
          cursor.moveCursor(
            gutterWidth +
              Editor.getTargetWidth(textPerLine[cursorLineIndex].slice(0, Editor.cursorInfo.cursorStrIndex)),
            top
          )

          Editor.content.renderLine()
          Editor.content.setLineWrapperWidth()
          scrollBar.setHorizonWidth()
        }
        if (e.keyCode === 8) {
          const { gutterWidth, tabBlank, cursor, textPerLine, scrollBar } = Editor
          const { cursorStrIndex, cursorLineIndex, top } = Editor.cursorInfo
          e.preventDefault()
          console.log(cursorStrIndex);
          console.log(cursorLineIndex);
          console.log(textPerLine[cursorLineIndex]);
          console.log(textPerLine[cursorLineIndex].slice(0, cursorStrIndex));
        }
      })
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
