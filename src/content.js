import { css } from './utils'
import { fromEvent, of } from 'rxjs'
import { takeUntil, map, concatAll, take, filter, tap } from 'rxjs/operators'
import { keyword } from './config/jsConfig'
import { renderJSLine } from './renderLines/js'
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
    console.log(endContainer)
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
      // this.moveToLineStart(curLine)
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
      editorHeight,
      editorWidth
    } = Editor
    const { horizonScrollLeft, horizonRate, verticalScrollTop, verticalRate } = scrollBarInfo

    let cursorStrIndex = cursorInfo.cursorStrIndex
    let cursorLineIndex = cursorInfo.cursorLineIndex
    console.log(cursorStrIndex)
    console.log(cursorLineIndex)
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
          console.log('cursorLineIndex=' + cursorLineIndex)
          console.log('cursorStrIndex=' + cursorStrIndex)
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
          if (cursorInfo.top >= verticalScrollTop * verticalRate + editorHeight) {
            scrollBar.moveVertical(((cursorLineIndex + 1) * lineHeight - editorHeight) / verticalRate)
          }
          if (cursorInfo.left - gutterWidth - 20 < horizonScrollLeft * horizonRate) {
            scrollBar.moveHorizon(Math.max((cursorInfo.left - gutterWidth - 20) / horizonRate, 0))
          }
        } else if (e.keyCode === 37) {
          if (cursorInfo.left - gutterWidth - 20 < horizonScrollLeft * horizonRate) {
            scrollBar.moveHorizon(Math.max((cursorInfo.left - gutterWidth - 20) / horizonRate, 0))
          } else if (cursorInfo.left > horizonScrollLeft * horizonRate + editorWidth) {
            scrollBar.moveHorizon((cursorInfo.left - editorWidth + 20) / horizonRate)
          }

          if (cursorInfo.top < verticalScrollTop * verticalRate) {
            scrollBar.moveVertical(cursorInfo.top / verticalRate)
          }
        } else if (e.keyCode === 39) {
          if (cursorInfo.left > horizonScrollLeft * horizonRate + editorWidth - 20) {
            scrollBar.moveHorizon((cursorInfo.left - editorWidth + 20) / horizonRate)
          } else if (cursorInfo.left - gutterWidth < horizonScrollLeft * horizonRate) {
            scrollBar.moveHorizon((cursorInfo.left - gutterWidth) / horizonRate)
          }

          if (cursorInfo.top >= verticalScrollTop * verticalRate + editorHeight) {
            scrollBar.moveVertical(((cursorLineIndex + 1) * lineHeight - editorHeight) / verticalRate)
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
    const { scrollBarInfo, editorHeight, lineHeight, textPerLine } = Editor
    const { verticalScrollTop, verticalRate } = scrollBarInfo
    const contentScrollTop = verticalScrollTop * verticalRate

    const fragment = document.createDocumentFragment()
    const startIndex = Math.floor(contentScrollTop / lineHeight)
    const endIndex = Math.ceil((contentScrollTop + editorHeight) / lineHeight)
    // renderJSLine(Editor, textPerLine, startIndex, endIndex)
    // textPerLine.forEach((it, index) => {
    //   if (index < startIndex || index >= endIndex) {
    //     return
    //   }
    //   const JSLine = document.createElement('div')
    //   JSLine.className = 'JSLine'
    //   css(JSLine, {
    //     top: index * lineHeight + 'px'
    //   })
    //   const JSLineSpan = document.createElement('span')
    //   JSLineSpan.className = 'JSLineSpan'
    //   renderJSLine(Editor, textPerLine, startIndex, endIndex)
    //   let loopIndex = 0
    //   let isLineStart = true //主要用来判断是否属于声明符（因此排除开头的空格以及“;”后也算行头）
    //   let isDeclaration = false
    //   let squareBrackets = 0
    //   let braces = 0
    //   let parenthese = 0
    //   let equal = false
    //   let singleQuotes = false
    //   let doubleQuotes = false
    //   let templateQuotes = false
    //   const startSpace = it.match(/^\s+/)

    //   if (startSpace) {
    //     let spaceStr = ''
    //     loopIndex = startSpace[0].length
    //     const kTextSpace = document.createElement('span')
    //     kTextSpace.className = 'kTextSpace'
    //     for (let i = 0; i < loopIndex; i++) {
    //       spaceStr += '&nbsp;'
    //     }
    //     kTextSpace.innerHTML = spaceStr
    //     JSLineSpan.appendChild(kTextSpace)
    //   }

    //   let currentStr = ''

    //   for (let i = loopIndex; i < it.length; i++) {
    //     if (it[i] === `'`) {
    //       currentStr += it[i]
    //       if (singleQuotes) {
    //         const kTextString = document.createElement('span')
    //         kTextString.className = 'kTextString'
    //         kTextString.innerHTML = currentStr
    //         JSLineSpan.appendChild(kTextString)
    //         singleQuotes = false
    //         currentStr = ''
    //       } else {
    //         singleQuotes = true
    //       }
    //     } else if (keyword[currentStr] && it[i] === ' ') {
    //       const kTextKeyword = document.createElement('span')
    //       kTextKeyword.className = `kText${keyword[currentStr]}`
    //       kTextKeyword.innerHTML = currentStr
    //       JSLineSpan.appendChild(kTextKeyword)

    //       const kTextSpace = document.createElement('span')
    //       kTextSpace.className = 'kTextSpace'
    //       kTextSpace.innerHTML = '&nbsp;'
    //       JSLineSpan.appendChild(kTextSpace)
    //       isDeclaration = true
    //       currentStr = ''
    //       // i++
    //     } else if (isDeclaration) {
    //       console.log(it[i])
    //       switch (it[i]) {
    //         case '{':
    //           braces += 1
    //           let kTextBracket = document.createElement('span')
    //           kTextBracket.className = 'kTextBracket'
    //           kTextBracket.innerHTML = '{'
    //           JSLineSpan.appendChild(kTextBracket)
    //           equal = false
    //           currentStr = ''
    //           break
    //         case '}':
    //           braces -= 1
    //           if (currentStr) {
    //             let kTextVariable = document.createElement('span')
    //             kTextVariable.className = 'kTextVariable'
    //             kTextVariable.innerHTML = currentStr
    //             JSLineSpan.appendChild(kTextVariable)
    //             let kTextBracket = document.createElement('span')
    //             kTextBracket.className = 'kTextBracket'
    //             kTextBracket.innerHTML = '}'
    //             JSLineSpan.appendChild(kTextBracket)
    //           }
    //           currentStr = ''
    //           equal = false
    //           break
    //         case '[':
    //           squareBrackets += 1
    //           equal = false
    //           break
    //         case ']':
    //           squareBrackets -= 1
    //           equal = false
    //           break
    //         case '(':
    //           parenthese -= 1
    //           let kTextBracket1 = document.createElement('span')
    //           kTextBracket1.className = 'kTextBracket'
    //           kTextBracket1.innerHTML = '('
    //           JSLineSpan.appendChild(kTextBracket1)
    //           currentStr = ''
    //           equal = false
    //           break
    //         case ')':
    //           parenthese += 1
    //           console.log('currentStr', currentStr)
    //           if (currentStr) {
    //             let kTextVariable = document.createElement('span')
    //             kTextVariable.className = 'kTextVariable'
    //             kTextVariable.innerHTML = currentStr
    //             JSLineSpan.appendChild(kTextVariable)
    //             let kTextBracket = document.createElement('span')
    //             kTextBracket.className = 'kTextBracket'
    //             kTextBracket.innerHTML = ')'
    //             JSLineSpan.appendChild(kTextBracket)
    //           }
    //           currentStr = ''
    //           equal = false
    //           break
    //         case ',':
    //           if (equal) {
    //             console.log('currentStr = ', currentStr)
    //             if (/^\d*$/.test(currentStr.trim())) {
    //               let kTextNumber = document.createElement('span')
    //               kTextNumber.className = 'kTextNumber'
    //               kTextNumber.innerHTML = currentStr
    //               JSLineSpan.appendChild(kTextNumber)
    //             } else {
    //               let kTextVariable = document.createElement('span')
    //               kTextVariable.className = 'kTextVariable'
    //               kTextVariable.innerHTML = currentStr
    //               JSLineSpan.appendChild(kTextVariable)
    //             }
    //           } else {
    //             let kTextVariable = document.createElement('span')
    //             kTextVariable.className = 'kTextVariable'
    //             kTextVariable.innerHTML = currentStr
    //             JSLineSpan.appendChild(kTextVariable)
    //           }
    //           let kTextComma = document.createElement('span')
    //           kTextComma.className = 'kTextComma'
    //           kTextComma.innerHTML = ','
    //           JSLineSpan.appendChild(kTextComma)
    //           currentStr = ''
    //           equal = false
    //           break
    //         case '=':
    //           if (braces === 0 && squareBrackets === 0 && parenthese === 0) {
    //             isDeclaration = false
    //             if (currentStr) {
    //               let kTextVariable1 = document.createElement('span')
    //               kTextVariable1.className = 'kTextVariable'
    //               kTextVariable1.innerHTML = currentStr
    //               JSLineSpan.appendChild(kTextVariable1)
    //             }
    //           } else {
    //             let kTextVariable1 = document.createElement('span')
    //             kTextVariable1.className = 'kTextVariable'
    //             kTextVariable1.innerHTML = currentStr
    //             JSLineSpan.appendChild(kTextVariable1)
    //           }
    //           let kTextEqual = document.createElement('span')
    //           kTextEqual.className = 'kTextEqual'
    //           kTextEqual.innerHTML = '='
    //           JSLineSpan.appendChild(kTextEqual)
    //           equal = true
    //           currentStr = ''
    //           break
    //         default:
    //           currentStr += it[i]
    //       }
    //     } else {
    //       console.log('qq')
    //       currentStr += it[i]
    //     }

    //     if (currentStr) {
    //       if (i === it.length - 1) {
    //         const kTextVariable1 = document.createElement('span')
    //         kTextVariable1.className = ''
    //         kTextVariable1.innerHTML = currentStr
    //         JSLineSpan.appendChild(kTextVariable1)
    //       }
    //     }
    //   }
    //   // const test2 = document.createElement('span')
    //   // it = it
    //   //   .replace(/ /g, '&nbsp;')
    //   //   .replace(/</g, '&lt;')
    //   //   .replace(/>/, '&gt;')
    //   // test2.innerHTML = it
    //   // JSLineSpan.appendChild(test2)

    //   JSLine.appendChild(JSLineSpan)
    //   fragment.appendChild(JSLine)
    // })

    Editor.JSLineWrapper.innerHTML = ''
    Editor.JSLineWrapper.appendChild(renderJSLine(Editor, textPerLine, startIndex, endIndex))
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
