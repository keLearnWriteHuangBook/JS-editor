import { css } from './utils'
import { fromEvent } from 'rxjs'
import { takeUntil, map, concatAll, take, filter } from 'rxjs/operators'
import './content.scss'

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
      editorTop,
      lineHeight,
      JSEditor,
      cursor,
      scrollBar,
      gutterWidth,
      scrollBarInfo,
      textPerLine,
      JSHorizonScroll
    } = Editor
    const { verticalScrollTop, verticalRate, horizonScrollLeft, horizonRate } = scrollBarInfo
    const curLine = Math.max(Math.floor((e.clientY + verticalScrollTop * verticalRate - editorTop) / lineHeight), 0),
      clientY = curLine * lineHeight + lineHeight / 2 - verticalScrollTop * verticalRate,
      range = document.caretRangeFromPoint(e.clientX, clientY + editorTop),
      endContainer = range.endContainer

    if (JSEditor.contains(e.target)) {
      let cursorStrIndex = null
      if (endContainer.nodeType === endContainer.TEXT_NODE) {
        const parentNode = endContainer.parentNode
        if (parentNode.className === 'JSGutter') {
          cursorStrIndex = 0
          cursor.moveToLineStart(curLine)
        } else {
          const previousTextLength = this.Editor.getPreviousTextLength(parentNode)
          cursorStrIndex = previousTextLength + range.endOffset

          const txt = textPerLine[curLine].slice(0, cursorStrIndex),
            width = this.Editor.getTargetWidth(txt)

          cursor.moveCursor(width + gutterWidth + parentNode.offsetLeft, curLine * lineHeight)
        }
      } else {
        if (curLine > textPerLine.length - 1) {
          cursorStrIndex = textPerLine[curLine].length
          cursor.moveToLineEnd(textPerLine.length - 1)
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
      // this.moveToLineStart(curLine)
    }
  }

  directionKey(e) {
    const Editor = this.Editor
    const { cursorInfo, textPerLine, cursor, gutterWidth, lineHeight } = Editor

    let cursorStrIndex = cursorInfo.cursorStrIndex
    let cursorLineIndex = cursorInfo.cursorLineIndex

    if (e.keyCode === 38) {
      cursorLineIndex -= 1
    } else if (e.keyCode === 40) {
      cursorLineIndex += 1
    } else if (e.keyCode === 37) {
      cursorStrIndex -= 1
    } else if (e.keyCode === 39) {
      cursorStrIndex += 1
    }
  
    if (
      cursorLineIndex < 0 ||
      cursorLineIndex >= textPerLine.length ||
      cursorStrIndex < 0 ||
      cursorStrIndex > textPerLine[cursorInfo.cursorLineIndex].length
    ) {
      return
    }
    const txt = textPerLine[cursorLineIndex].slice(0, cursorStrIndex)
    const width = Editor.getTargetWidth(txt)

    cursor.moveCursor(width + gutterWidth, cursorLineIndex * lineHeight)
    cursor.setCursorStrIndex(txt.length)
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

    Editor.textPerLine.forEach((it, index) => {
      const JSGutter = document.createElement('div')
      JSGutter.className = 'JSGutter'
      css(JSGutter, {
        width: Editor.gutterWidth + 'px'
      })
      JSGutter.innerText = index + 1
      JSGutterWrapper.appendChild(JSGutter)
    })
    this.setLineWrapperHeight()
    this.setLineWrapperWidth()
    this.renderLine()
    fragment.appendChild(JSGutterWrapper)
    fragment.appendChild(JSLineWrapperHidden)
    Editor.JSContent.appendChild(fragment)
    Editor.scrollBar.setScrollWidth()
  }

  renderLine() {
    const Editor = this.Editor
    const { scrollBarInfo, editorHeight, lineHeight, textPerLine } = Editor
    const { verticalScrollTop, verticalRate } = scrollBarInfo
    const contentScrollTop = verticalScrollTop * verticalRate

    const fragment = document.createDocumentFragment()
    const startIndex = Math.floor(contentScrollTop / lineHeight)
    const endIndex = Math.ceil((contentScrollTop + editorHeight) / lineHeight)

    textPerLine.forEach((it, index) => {
      if (index < startIndex || index >= endIndex) {
        return
      }
      const JSLine = document.createElement('div')
      JSLine.className = 'JSLine'
      css(JSLine, {
        top: index * lineHeight + 'px'
      })
      const JSLineSpan = document.createElement('span')
      JSLineSpan.className = 'JSLineSpan'

      const test2 = document.createElement('span')
      // it = it.replace(/ /g, '&nbsp;').replace(/</g, '\<').replace(/>/, '\>')
      test2.innerText = it
      JSLineSpan.appendChild(test2)

      // const test = document.createElement('span')
      // test.innerHTML = '试试'
      // JSLineSpan.appendChild(test)

      // const test1 = document.createElement('span')
      // test1.innerHTML = '试32试'
      // JSLineSpan.appendChild(test1)

      // const test1 = document.createElement('span')
      // test1.innerHTML = '试试大叔大婶'
      // test.appendChild(test1)

      JSLine.appendChild(JSLineSpan)
      fragment.appendChild(JSLine)
    })

    Editor.JSLineWrapper.innerHTML = ''
    Editor.JSLineWrapper.appendChild(fragment)
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
