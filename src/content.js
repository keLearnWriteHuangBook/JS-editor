import { css } from './utils'
import { fromEvent, of } from 'rxjs'
import { takeUntil, map, concatAll, take, filter, tap } from 'rxjs/operators'
import { keyword } from './config/jsConfig'
import { renderJSLine } from './renderLines/js'
import './content.scss'

//当鼠标处于右边自动滚动的定时器
let timer

export default class JSContent {
  constructor(Editor) {
    this.Editor = Editor

    this.createContent()
  }

  createContent() {
    const me = this
    const Editor = this.Editor

    const JSContent = document.createElement('div')
    Editor.JSContent = JSContent
    JSContent.className = 'JSContent'
    const mousedown = fromEvent(document, 'mousedown')
    const mousemove = fromEvent(document, 'mousemove')
    const mouseup = fromEvent(document, 'mouseup')

    mousedown
      .pipe(
        map(e => {
          //判断是否激活Editor
          if (Editor.JSEditor.contains(e.target)) {
            Editor.cursor.showCursor()
            const editorInfo = Editor.JSEditor.getBoundingClientRect()
            Editor.editorInfo.top = editorInfo.top
            Editor.editorInfo.left = editorInfo.left
            Editor.editorInfo.width = editorInfo.width
            Editor.editorInfo.height = editorInfo.height
            me.moveToClickPoint(e, 'down')
            // 必须阻止默认事件，否则输入框无法聚焦
            e.preventDefault()
            Editor.JSTextarea.focus()
            Editor.isActive = true
            return mousemove.pipe(takeUntil(mouseup))
          } else {
            Editor.cursor.hideCursor()
            Editor.isActive = false
            return mousemove.pipe(take(0))
          }
        }),
        concatAll()
      )
      .subscribe(e => me.moveToClickPoint(e, 'move'))

    mouseup.subscribe(e => {
      if (Editor.scrollBarInfo.mouseScroll) {
        Editor.scrollBarInfo.mouseScroll = false
        return
      }
      me.moveToClickPoint(e, 'up')
      if (timer) {
        clearInterval(timer)
        timer = null
      }
      console.log(Editor.cursorInfo)
    })

    const mousewheel = fromEvent(JSContent, 'mousewheel')

    mousewheel.subscribe(e => {
      Editor.scrollBar.scrollWheel(e)
    })

    const keydown = fromEvent(document, 'keydown')

    keydown
      .pipe(
        filter(e => (e.keyCode === 38 || e.keyCode === 40 || e.keyCode === 37 || e.keyCode === 39) && Editor.isActive)
      )
      .subscribe(e => me.directionKey(e))

    Editor.JSEditor.appendChild(JSContent)
    this.initFramework()
  }

  moveToClickPoint(e, way) {
    const Editor = this.Editor

    const {
      lineHeight,
      JSEditor,
      cursor,
      cursorInfo,
      scrollBar,
      gutterWidth,
      editorInfo,
      scrollBarInfo,
      textPerLine,
      JSHorizonScroll,
      scrollThickness,
      rollRange,
      contentInfo
    } = Editor
    const { verticalScrollTop, verticalRate, horizonScrollLeft, horizonRate } = scrollBarInfo

    const curLine = Math.max(
        Math.floor((e.clientY + verticalScrollTop * verticalRate - editorInfo.top) / lineHeight),
        0
      ),
      clientY = curLine * lineHeight + lineHeight / 2 - verticalScrollTop * verticalRate,
      range = document.caretRangeFromPoint(e.clientX, clientY + editorInfo.top)

    if (JSEditor.contains(e.target)) {
      const endContainer = range.endContainer
      const parentNode = endContainer.parentNode
      const relativeX = e.clientX - editorInfo.left
      const rollStart = editorInfo.width - rollRange - scrollThickness
      const rollEnd = editorInfo.width - scrollThickness
      console.log(e.clientX - editorInfo.left)
      console.log(editorInfo.width - rollRange - scrollThickness)
      console.log(editorInfo.width - scrollThickness)
      if (relativeX >= rollStart && relativeX < rollEnd) {
        const viewStart = scrollBarInfo.horizonScrollLeft * scrollBarInfo.horizonRate
        const viewEnd = scrollBarInfo.horizonScrollLeft * scrollBarInfo.horizonRate + editorInfo.width - gutterWidth
        console.log(viewStart, viewEnd)
        console.log(textPerLine[curLine])
        console.log(Editor.getTargetWidth(textPerLine[curLine]))
        console.log(editorInfo.width - gutterWidth - scrollBarInfo.horizonScrollLength)
        console.log(scrollBarInfo)
        if (Editor.getTargetWidth(textPerLine[curLine]) + contentInfo.rightGap + scrollThickness > viewEnd) {
          if (!timer) {
            const previousTextLength = this.Editor.getPreviousTextLength(parentNode)

            let cursorStrIndex = previousTextLength + range.endOffset

            const txt = textPerLine[curLine].slice(0, cursorStrIndex),
              width = this.Editor.getTargetWidth(txt)

            cursor.moveCursor(width + gutterWidth, curLine * lineHeight)
            timer = setInterval(function() {
              cursorStrIndex++
              cursor.setCursorStrIndex(cursorStrIndex)
              const txt = textPerLine[curLine].slice(0, cursorStrIndex)
              const width = Editor.getTargetWidth(txt)

              cursor.moveCursor(width + gutterWidth, curLine * lineHeight)
              scrollBar.moveHorizon((cursorInfo.left - editorInfo.width + 20) / horizonRate)
              if (cursorStrIndex === textPerLine[curLine].length) {
                clearInterval(timer)
                timer = null
              }
            }, 50)
          }

          return
        }
      }
      if (timer) {
        clearInterval(timer)
        timer = null
      }
      let cursorStrIndex = null
      if (endContainer.nodeType === endContainer.TEXT_NODE) {
        if (parentNode.className === 'JSGutter') {
          cursorStrIndex = 0
          cursor.moveToLineStart(curLine)
        } else {
          const previousTextLength = this.Editor.getPreviousTextLength(parentNode)

          cursorStrIndex = previousTextLength + range.endOffset

          const txt = textPerLine[curLine].slice(0, cursorStrIndex),
            width = this.Editor.getTargetWidth(txt)

          cursor.moveCursor(width + gutterWidth, curLine * lineHeight)
        }
      } else {
        if (curLine > textPerLine.length - 1) {
          cursorStrIndex = textPerLine[textPerLine.length - 1].length
          cursor.moveToLineEnd(textPerLine.length - 1)
        }

        if (endContainer.className === 'JSLine') {
          cursorStrIndex = 0
          cursor.moveToLineEnd(curLine)
        }
      }
      cursor.setCursorStrIndex(cursorStrIndex)
      if (
        horizonScrollLeft * horizonRate + gutterWidth > this.Editor.cursorInfo.left &&
        !JSHorizonScroll.contains(e.target) &&
        way === 'down'
      ) {
        scrollBar.moveHorizon(
          Math.max(
            (this.Editor.getTargetWidth(textPerLine[Math.min(curLine, textPerLine.length - 1)]) - 20) / horizonRate,
            0
          )
        )
      }
    } else {
      console.log(e.clientX)
      console.log()
      Editor.cursor.moveToLineStart(curLine)
    }
    Editor.textarea.preInputAction()
  }

  directionKey(e) {
    const Editor = this.Editor

    const {
      cursorInfo,
      textPerLine,
      cursor,
      gutterWidth,
      lineHeight,
      scrollBarInfo,
      JSHorizonScroll,
      scrollBar,
      editorInfo
    } = Editor
    const { horizonScrollLeft, horizonRate, verticalScrollTop, verticalRate } = scrollBarInfo

    let cursorStrIndex = cursorInfo.cursorStrIndex
    let cursorLineIndex = cursorInfo.cursorLineIndex

    of(e)
      .pipe(
        filter(e => {
          if (e.keyCode === 38) {
            cursorLineIndex -= 1
            if (cursorLineIndex < 0) {
              return false
            }
          } else if (e.keyCode === 40) {
            cursorLineIndex += 1
            if (cursorLineIndex >= textPerLine.length) {
              return false
            }
          } else if (e.keyCode === 37) {
            cursorStrIndex -= 1

            if (cursorStrIndex < 0) {
              if (cursorLineIndex === 0) {
                return false
              } else {
                cursorLineIndex -= 1
                cursorStrIndex = textPerLine[cursorLineIndex].length
              }
            }
          } else if (e.keyCode === 39) {
            cursorStrIndex += 1
            //这里需使用cursorInfo.cursorLineIndex而不是使用cursorLineIndex
            if (cursorStrIndex > textPerLine[cursorInfo.cursorLineIndex].length) {
              if (cursorLineIndex >= textPerLine.length - 1) {
                return false
              } else {
                cursorLineIndex += 1
                cursorStrIndex = 0
              }
            }
          }

          return true
        }),
        tap(e => {
          const txt = textPerLine[cursorLineIndex].slice(0, cursorStrIndex)
          const width = Editor.getTargetWidth(txt)

          cursor.moveCursor(width + gutterWidth, cursorLineIndex * lineHeight)
          cursor.setCursorStrIndex(txt.length)
          cursor.setCursorLineIndex(cursorLineIndex)
        })
      )
      .subscribe(e => {
        if (e.keyCode === 38) {
          if (cursorInfo.top < verticalScrollTop * verticalRate) {
            scrollBar.moveVertical(cursorInfo.top / verticalRate)
          }
          if (cursorInfo.left - gutterWidth - 20 < horizonScrollLeft * horizonRate) {
            scrollBar.moveHorizon(Math.max((cursorInfo.left - gutterWidth - 20) / horizonRate, 0))
          }
        } else if (e.keyCode === 40) {
          if (cursorInfo.top >= verticalScrollTop * verticalRate + editorInfo.height) {
            scrollBar.moveVertical(((cursorLineIndex + 1) * lineHeight - editorInfo.height) / verticalRate)
          }
          if (cursorInfo.left - gutterWidth - 20 < horizonScrollLeft * horizonRate) {
            scrollBar.moveHorizon(Math.max((cursorInfo.left - gutterWidth - 20) / horizonRate, 0))
          }
        } else if (e.keyCode === 37) {
          if (cursorInfo.left - gutterWidth - 20 < horizonScrollLeft * horizonRate) {
            scrollBar.moveHorizon(Math.max((cursorInfo.left - gutterWidth - 20) / horizonRate, 0))
          } else if (cursorInfo.left > horizonScrollLeft * horizonRate + editorInfo.width) {
            scrollBar.moveHorizon((cursorInfo.left - editorInfo.width + 20) / horizonRate)
          }

          if (cursorInfo.top < verticalScrollTop * verticalRate) {
            scrollBar.moveVertical(cursorInfo.top / verticalRate)
          }
        } else if (e.keyCode === 39) {
          if (cursorInfo.left > horizonScrollLeft * horizonRate + editorInfo.width - 20) {
            scrollBar.moveHorizon((cursorInfo.left - editorInfo.width + 20) / horizonRate)
          } else if (cursorInfo.left - gutterWidth < horizonScrollLeft * horizonRate) {
            scrollBar.moveHorizon((cursorInfo.left - gutterWidth) / horizonRate)
          }

          if (cursorInfo.top >= verticalScrollTop * verticalRate + editorInfo.height) {
            scrollBar.moveVertical(((cursorLineIndex + 1) * lineHeight - editorInfo.height) / verticalRate)
          }
        }
      })
    Editor.textarea.preInputAction()
  }

  initFramework() {
    const Editor = this.Editor,
      { gutterWidth, JSContent } = Editor

    const fragment = document.createDocumentFragment()
    const JSGutterWrapper = document.createElement('div')
    Editor.JSGutterWrapper = JSGutterWrapper
    JSGutterWrapper.className = 'JSGutterWrapper'
    JSGutterWrapper.style = `width:${gutterWidth}px;`

    const JSLineWrapperHidden = document.createElement('div')
    JSLineWrapperHidden.className = 'JSLineWrapperHidden'
    const contentWidth = JSContent.getBoundingClientRect().width
    JSLineWrapperHidden.style = `width:${contentWidth - gutterWidth}px`

    const JSLineWrapperBackground = document.createElement('div')
    JSLineWrapperBackground.className = 'JSLineWrapperBackground'
    JSLineWrapperHidden.appendChild(JSLineWrapperBackground)

    const JSLineWrapper = document.createElement('div')
    Editor.JSLineWrapper = JSLineWrapper
    JSLineWrapper.className = 'JSLineWrapper'
    JSLineWrapperBackground.appendChild(JSLineWrapper)

    this.renderGutter()
    this.setLineWrapperHeight()
    this.setLineWrapperWidth()
    this.renderLine()
    fragment.appendChild(JSGutterWrapper)
    fragment.appendChild(JSLineWrapperHidden)
    Editor.JSContent.appendChild(fragment)
    Editor.scrollBar.setScrollWidth()
  }

  renderGutter() {
    const Editor = this.Editor
    const fragment = document.createDocumentFragment()

    Editor.textPerLine.forEach((it, index) => {
      const JSGutter = document.createElement('div')
      JSGutter.className = 'JSGutter'

      JSGutter.innerText = index + 1
      fragment.appendChild(JSGutter)
    })

    Editor.JSGutterWrapper.innerHTML = ''
    Editor.JSGutterWrapper.appendChild(fragment)
  }

  renderLine() {
    const Editor = this.Editor
    const { scrollBarInfo, editorInfo, lineHeight, textPerLine } = Editor
    const { verticalScrollTop, verticalRate } = scrollBarInfo
    const contentScrollTop = verticalScrollTop * verticalRate

    const startIndex = Math.floor(contentScrollTop / lineHeight)
    const endIndex = Math.ceil((contentScrollTop + editorInfo.height) / lineHeight)

    Editor.JSLineWrapper.innerHTML = ''
    Editor.JSLineWrapper.appendChild(renderJSLine(Editor, textPerLine, startIndex, endIndex))
  }

  renderSelectedArea() {}

  setLineWrapperHeight() {
    const height = this.Editor.textPerLine.length * this.Editor.lineHeight
    css(this.Editor.JSLineWrapper, {
      height: height + 'px'
    })

    this.Editor.contentInfo.height = height
  }

  setLineWrapperWidth() {
    const { textPerLine, contentInfo } = this.Editor
    let maxWidth = 0,
      maxWidthLine = 0

    textPerLine.forEach((it, index) => {
      const width = this.Editor.getTargetWidth(it)
      if (maxWidth < width) {
        maxWidth = width
        maxWidthLine = index
      }
    })

    css(this.Editor.JSLineWrapper, {
      width: maxWidth + contentInfo.rightGap + 'px'
    })

    contentInfo.width = maxWidth + contentInfo.rightGap
    contentInfo.maxWidthLine = maxWidthLine
  }
}
