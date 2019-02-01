import { fromEvent } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { css, stringSplice } from './utils'
import './textarea.scss'

//主要用于判断后退按键是否处于按下状态
let downKeyCode = null

export default class Textarea {
  constructor(Editor) {
    this.Editor = Editor

    this.createTextarea()
  }

  createTextarea() {
    const me = this
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
    const keyupEvent = fromEvent(document, 'keyup')

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
        downKeyCode = e.keyCode
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
          me.preInputAction()
        }
        if (e.keyCode === 8) {
          const {
            gutterWidth,
            tabBlank,
            cursor,
            textPerLine,
            scrollBar,
            scrollBarInfo,
            editorInfo,
            lineHeight,
            rollRange
          } = Editor
          const { cursorStrIndex, cursorLineIndex, top } = Editor.cursorInfo
          const { horizonScrollLeft, horizonRate, horizonScrollLength, verticalRate, verticalScrollTop, verticalScrollLength } = scrollBarInfo

          let currentCursorStrIndex = cursorStrIndex
          if (currentCursorStrIndex === 0) {
            if (cursorLineIndex > 0) {
              let preUpLine = textPerLine[cursorLineIndex - 1]
              let preUpLineWidth = Editor.getTargetWidth(preUpLine)
              currentCursorStrIndex = preUpLine.length
          
              textPerLine[cursorLineIndex - 1] += textPerLine[cursorLineIndex]
              textPerLine.splice(cursorLineIndex, 1)
              Editor.cursor.setCursorStrIndex(preUpLine.length)
              Editor.cursor.setCursorLineIndex(cursorLineIndex - 1)
              Editor.content.renderLine()
              Editor.content.renderGutter()
              Editor.content.setLineWrapperWidth()
              //当滚动条处于最下方时
              if (verticalScrollTop * verticalRate >= (cursorLineIndex - 1) * lineHeight) {
                scrollBar.moveVertical(verticalScrollTop - (lineHeight / verticalRate))
              }
              scrollBar.setHorizonWidth()
              scrollBar.setVerticalWidth()
              //因为verticalRate的变化所以实际verticalScrollTop也发生变化
              scrollBar.moveVertical(scrollBarInfo.verticalScrollTop * verticalRate / scrollBarInfo.verticalRate)
              Editor.cursor.moveCursor(preUpLineWidth + gutterWidth, (cursorLineIndex - 1) * lineHeight)
              if (preUpLineWidth > editorInfo.width - gutterWidth) {
                scrollBar.moveHorizon((preUpLineWidth - (editorInfo.width - gutterWidth) + 20) / horizonRate)
              }
            }
          } else {
            const leftText = textPerLine[cursorLineIndex].slice(0, currentCursorStrIndex - 1)
            const rightText = textPerLine[cursorLineIndex].slice(currentCursorStrIndex)
           
            textPerLine[cursorLineIndex] = leftText + rightText
            Editor.cursor.moveCursor(Editor.getTargetWidth(leftText) + gutterWidth, cursorLineIndex * lineHeight)
            Editor.cursor.setCursorStrIndex(currentCursorStrIndex - 1)
            Editor.content.renderLine()
            Editor.content.setLineWrapperWidth()
            scrollBar.setHorizonWidth()
            scrollBar.setVerticalWidth()

            //当光标要移除可视区域时，移动滚动条
            if (horizonScrollLeft * horizonRate + gutterWidth > 60) {
              if (Editor.cursorInfo.left - rollRange < (horizonScrollLeft * horizonRate + gutterWidth)) {
                Editor.scrollBar.moveHorizon((Editor.cursorInfo.left - rollRange - gutterWidth) / horizonRate)
              }
            }
            //当变化后的滚动条，其右边距离超出可视区域时，移动滚动条
            if (horizonScrollLeft + horizonScrollLength > editorInfo.width - gutterWidth) {
              Editor.scrollBar.moveHorizon(editorInfo.width - gutterWidth - horizonScrollLength)
            }
          }

          e.preventDefault()
        }
      })
      keyupEvent.pipe(takeUntil(blurEvent)).subscribe(e => {
        if (e.keyCode === 8 && downKeyCode === 8) {
          me.preInputAction()
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
