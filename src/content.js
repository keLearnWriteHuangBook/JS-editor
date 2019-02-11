import { css, removeDom } from './utils'
import { fromEvent, of } from 'rxjs'
import { takeUntil, map, concatAll, take, filter, tap } from 'rxjs/operators'
import { keyword } from './config/jsConfig'
import { renderJSLine } from './renderLines/js'
import './content.scss'

//当鼠标处于右边自动滚动的定时器
let timer
let timerClient = {
  x: null,
  y: null
}
let timerLine = null

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
            Editor.down = true
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
      if (timer) {
        clearInterval(timer)
        timer = null
        timerLine = null
      }
      if (Editor.down) {
        me.moveToClickPoint(e, 'up')
      }
      Editor.down = false
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
    const {
      verticalScrollTop,
      verticalRate,
      verticalScrollLength,
      horizonScrollLeft,
      horizonRate,
      horizonScrollLength
    } = scrollBarInfo

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
      const rollRightStart = editorInfo.width - rollRange - scrollThickness
      const rollRightEnd = editorInfo.width - scrollThickness
      const rollLeftStart = gutterWidth
      const rollLeftEnd = gutterWidth + rollRange * 2
      const viewStart = horizonScrollLeft * horizonRate
      const viewEnd = horizonScrollLeft * horizonRate + editorInfo.width - gutterWidth
      //往右移
      if (
        relativeX >= rollRightStart &&
        relativeX < rollRightEnd &&
        (timerLine === curLine || timerLine === null) &&
        way !== 'up'
      ) {
        const maxScrollLeft = Math.min(
          editorInfo.width - gutterWidth - horizonScrollLength,
          (this.Editor.getTargetWidth(textPerLine[curLine]) - (editorInfo.width - gutterWidth) + 20) / horizonRate
        )

        if (
          Editor.getTargetWidth(textPerLine[curLine]) + contentInfo.rightGap + scrollThickness > viewEnd &&
          maxScrollLeft > horizonScrollLeft
        ) {
          timerClient = {
            x: e.clientX,
            y: e.clientY
          }
          if (!timer) {
            timerLine = curLine
            let currentScrollLeft = horizonScrollLeft

            const maxWidth = this.Editor.getTargetWidth(textPerLine[curLine]) + gutterWidth

            // cursor.moveCursor(width + gutterWidth, curLine * lineHeight)

            timer = setInterval(function() {
              currentScrollLeft += 5
              cursor.moveCursor(
                Math.min(timerClient.x - editorInfo.left + currentScrollLeft * horizonRate, maxWidth),
                curLine * lineHeight
              )
              scrollBar.moveHorizon(Math.min(maxScrollLeft, currentScrollLeft))
              if (currentScrollLeft >= maxScrollLeft) {
                clearInterval(timer)
                timer = null
                timerLine = null
                const range = document.caretRangeFromPoint(timerClient.x, clientY + editorInfo.top)
                const endContainer = range.endContainer
                const parentNode = endContainer.parentNode
                const previousTextLength = Editor.getPreviousTextLength(parentNode)

                let cursorStrIndex = previousTextLength + range.endOffset

                const txt = textPerLine[curLine].slice(0, cursorStrIndex),
                  width = Editor.getTargetWidth(txt)

                cursor.moveCursor(width + gutterWidth, curLine * lineHeight)
              }
            }, 15)
          }
          return
        }
      }

      //往左移
      if (
        relativeX >= rollLeftStart &&
        relativeX < rollLeftEnd &&
        (timerLine === curLine || timerLine === null) &&
        way !== 'up'
      ) {
        if (horizonScrollLeft > 0) {
          timerClient = {
            x: e.clientX,
            y: e.clientY
          }
          if (!timer) {
            timerLine = curLine
            let currentScrollLeft = horizonScrollLeft

            timer = setInterval(function() {
              currentScrollLeft -= 5

              cursor.moveCursor(
                Math.max(timerClient.x - editorInfo.left + currentScrollLeft * horizonRate, gutterWidth),
                curLine * lineHeight
              )
              scrollBar.moveHorizon(Math.max(currentScrollLeft, 0))

              if (currentScrollLeft <= 0) {
                clearInterval(timer)
                timer = null
                timerLine = null
                const range = document.caretRangeFromPoint(timerClient.x, clientY + editorInfo.top)
                const endContainer = range.endContainer
                const parentNode = endContainer.parentNode
                const previousTextLength = Editor.getPreviousTextLength(parentNode)

                let cursorStrIndex = previousTextLength + range.endOffset

                const txt = textPerLine[curLine].slice(0, cursorStrIndex),
                  width = Editor.getTargetWidth(txt)

                cursor.moveCursor(width + gutterWidth, curLine * lineHeight)
              }
            }, 15)
          }
          return
        }
      }
      if (timer) {
        clearInterval(timer)
        timer = null
        timerLine = null
      }
      let cursorStrIndex = null
      if (endContainer.nodeType === endContainer.TEXT_NODE) {
        if (parentNode.className === 'JSGutter') {
          cursorStrIndex = 0
          cursor.moveToLineStart(curLine)
          cursor.setCursorStrIndex(cursorStrIndex)
          scrollBar.moveHorizon(0)
          return
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

        if (endContainer.className.indexOf('KEditorVerticalScroll') > -1 && curLine <= textPerLine.length - 1) {
          cursorStrIndex = textPerLine[curLine].length
          cursor.moveToLineEnd(curLine)
        }

        if (endContainer.className === 'JSLine') {
          cursorStrIndex = 0
          cursor.moveToLineEnd(curLine)
        }
      }
      cursor.setCursorStrIndex(cursorStrIndex)
      if (
        horizonScrollLeft * horizonRate + gutterWidth > this.Editor.cursorInfo.left &&
        !JSHorizonScroll.contains(e.target)
      ) {
        scrollBar.moveHorizon(
          Math.max(
            (this.Editor.getTargetWidth(textPerLine[Math.min(curLine, textPerLine.length - 1)]) - 20) / horizonRate,
            0
          )
        )
      }

      if (horizonScrollLeft * horizonRate + gutterWidth + editorInfo.width < this.Editor.cursorInfo.left) {
        scrollBar.moveHorizon(
          (this.Editor.getTargetWidth(textPerLine[curLine]) - (editorInfo.width - gutterWidth) + 20) / horizonRate
        )
      }
    } else {
      const viewStart = scrollBarInfo.horizonScrollLeft * scrollBarInfo.horizonRate
      const viewEnd = scrollBarInfo.horizonScrollLeft * scrollBarInfo.horizonRate + editorInfo.width - gutterWidth
      const relativeX = e.clientX - editorInfo.left
      const relativeY = e.clientY - editorInfo.top
      //往上移
      if (relativeY < 0 && way !== 'up') {
        if (!timer) {
          let currentScrollTop = verticalScrollTop
          timer = setInterval(function() {
            currentScrollTop -= 5

            let calcScrollTop = Math.max(currentScrollTop, 0)

            scrollBar.moveVertical(calcScrollTop)
            let nextCursorTop = Math.floor((calcScrollTop * verticalRate) / lineHeight) * lineHeight
            cursor.moveCursor(gutterWidth, nextCursorTop)

            if (calcScrollTop <= 0) {
              clearInterval(timer)
              timer = null
              timerLine = null
            }
          }, 15)

          return
        }
      }
      //往下移
      if (relativeY >= editorInfo.height && way !== 'up') {
        if (!timer) {
          let currentScrollTop = verticalScrollTop
          timer = setInterval(function() {
            currentScrollTop += 5
            let calcScrollTop = Math.min(currentScrollTop, editorInfo.height - verticalScrollLength)
            scrollBar.moveVertical(calcScrollTop)

            let nextCursorLine = Math.min(
              Math.floor((calcScrollTop * verticalRate + editorInfo.height) / lineHeight),
              textPerLine.length - 1
            )
            let nextCursorTop = nextCursorLine * lineHeight

            cursor.moveCursor(Editor.getTargetWidth(textPerLine[nextCursorLine]) + gutterWidth, nextCursorTop)

            if (calcScrollTop <= 0) {
              clearInterval(timer)
              timer = null
              timerLine = null
            }
          }, 15)

          return
        }
      }
      if (relativeY > 0 && relativeY < editorInfo.height) {
        if (curLine <= textPerLine.length - 1) {
          if (relativeX < viewStart) {
            Editor.cursor.moveToLineStart(curLine)
            scrollBar.moveHorizon(0)
            cursor.setCursorStrIndex(0)
          } else {
            Editor.cursor.moveToLineEnd(curLine)
            if (this.Editor.getTargetWidth(textPerLine[curLine]) > editorInfo.width - gutterWidth) {
              scrollBar.moveHorizon(
                (this.Editor.getTargetWidth(textPerLine[curLine]) - (editorInfo.width - gutterWidth) + 20) / horizonRate
              )
            } else {
              scrollBar.moveHorizon(0)
            }
            cursor.setCursorStrIndex(textPerLine[curLine].length)
          }
        }
      }
    }
    if (way === 'down') {
      const cursorInfo = Editor.cursorInfo
      if (!e.shiftKey) {
        this.clearSelectedArea()
        Editor.startPos = {
          cursorLineIndex: cursorInfo.cursorLineIndex,
          cursorStrIndex: cursorInfo.cursorStrIndex,
          left: cursorInfo.left,
          top: cursorInfo.top
        }
      }
    } else if (way === 'up') {
      const cursorInfo = Editor.cursorInfo
      Editor.endPos = {
        cursorLineIndex: cursorInfo.cursorLineIndex,
        cursorStrIndex: cursorInfo.cursorStrIndex,
        left: cursorInfo.left,
        top: cursorInfo.top
      }
      this.renderSelectedArea()
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
    const JSLineSelectedWrapper = document.createElement('div')
    JSLineSelectedWrapper.className = 'JSLineSelectedWrapper'
    Editor.JSLineSelectedWrapper = JSLineSelectedWrapper
    Editor.JSLineWrapper.appendChild(JSLineSelectedWrapper)
  }

  renderSelectedArea() {
    const Editor = this.Editor
    const { startPos, endPos, scrollBarInfo, JSLineSelectedWrapper, textPerLine, lineHeight, gutterWidth } = Editor
    let realityStartPos, realityEndPos
    console.log(startPos)
    console.log(endPos)
    console.log(scrollBarInfo)
    if (startPos.top < endPos.top) {
      realityStartPos = startPos
      realityEndPos = endPos
    } else if (startPos.top > endPos.top) {
      realityStartPos = endPos
      realityEndPos = startPos
    } else if (startPos.top === endPos.top) {
      if (startPos.left < endPos.left) {
        realityStartPos = startPos
        realityEndPos = endPos
      } else if (startPos.left > endPos.left) {
        realityStartPos = endPos
        realityEndPos = startPos
      } else {
        return
      }
    }
    this.clearSelectedArea()
    const fragment = document.createDocumentFragment()

    console.log(scrollBarInfo.verticalScrollTop * scrollBarInfo.verticalRate)
    console.log(realityStartPos)
    let curTop = realityStartPos.top
    let curLine = realityStartPos.cursorLineIndex
    let first = true
    while (curTop <= realityEndPos.top) {
      const width = Editor.getTargetWidth(textPerLine[curLine])
      const JSLineSelected = document.createElement('div')
      JSLineSelected.className = 'JSLineSelected'
      console.log(width)
      let finallyWidth, finallyLeft
      if (first) {
        finallyLeft = realityStartPos.left - gutterWidth
        if (curTop + lineHeight > realityEndPos.top) {
          finallyWidth = Editor.getTargetWidth(
            textPerLine[curLine].slice(realityStartPos.cursorStrIndex, realityEndPos.cursorStrIndex)
          )
        } else {
          finallyWidth = width - realityStartPos.left + gutterWidth
        }
      } else {
        finallyLeft = 0
        if (curTop + lineHeight > realityEndPos.top) {
          finallyWidth = Editor.getTargetWidth(textPerLine[curLine].slice(0, realityEndPos.cursorStrIndex))
          console.log('finallyWidth = ', finallyWidth)
        } else {
          finallyWidth = width
        }
      }

      css(JSLineSelected, {
        height: lineHeight + 'px',
        width: finallyWidth + 'px',
        top: curTop + 'px',
        left: finallyLeft + 'px'
      })
      fragment.appendChild(JSLineSelected)
      curTop += lineHeight
      curLine += 1
      first = false
    }

    JSLineSelectedWrapper.appendChild(fragment)
  }

  clearSelectedArea() {
    const Editor = this.Editor
    Editor.JSLineSelectedWrapper.innerHTML = ''
    // Editor.JSLineSelectedWrapper && removeDom(Editor.JSLineSelectedWrapper)
    // Editor.startPos = null
    // Editor.endPos = null
  }

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
