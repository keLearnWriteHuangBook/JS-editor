import { css } from './utils'
import { fromEvent, empty } from 'rxjs'
import { takeUntil, map, concatAll, take } from 'rxjs/operators'
import './content.scss'

export default class JSContent {
  constructor(Editor) {
    const me = this
    me.Editor = Editor

    me.createContent.apply(me)
  }

  createContent() {
    const me = this
    const Editor = me.Editor

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
            css(Editor.JSCursor, {
              display: 'block'
            })
            moveCursor(e)
            return mousemove.pipe(takeUntil(mouseup))
          } else {
            css(Editor.JSCursor, {
              display: 'none'
            })
            return mousemove.pipe(take(0))
          }
        }),
        concatAll()
      )
      .subscribe(moveCursor)

    mouseup.subscribe(e => {
      moveCursor(e)
    })

    function moveCursor(e) {
      const curLine = Math.max(Math.floor(
        (e.clientY - Editor.editorTop) / Editor.lineHeight
      ), 0)
      const clientY = curLine * Editor.lineHeight + Editor.lineHeight / 2
      const simulationInfo = document.caretRangeFromPoint(
        e.clientX,
        clientY + Editor.editorTop
      )
      const endContainer = simulationInfo.endContainer
     
      if (Editor.JSEditor.contains(e.target)) {
        if (endContainer.nodeType === 3) {
          const parentNode = endContainer.parentNode

          if (parentNode.className === 'JSGutter') {
            Editor.cursor.moveCursor(
              Editor.gutterWidth,
              curLine * Editor.lineHeight
            )
          } else {
            //包裹一层防止多个内敛标签导致标签正好换行的宽度错误
            const widthWrapperDom = document.createElement('p')
            css(widthWrapperDom, {
              position: 'absolute',
              visibility: 'hidden'
            })
         
            const widthDom = document.createElement('span')
            widthDom.innerText = parentNode.innerText.slice(
              0,
              simulationInfo.endOffset
            )
            widthWrapperDom.appendChild(widthDom)

            Editor.JSEditor.appendChild(widthWrapperDom)
            const width = widthDom.getBoundingClientRect().width

            Editor.cursor.moveCursor(
              width + Editor.gutterWidth + parentNode.offsetLeft,
              curLine * Editor.lineHeight
            )
          }
        } else {
          
        }
      } else {
        Editor.cursor.moveCursor(
          Editor.gutterWidth,
          curLine * Editor.lineHeight
        )
      }
    }

    const mousewheel = fromEvent(JSContent, 'mousewheel')

    mousewheel.subscribe(e => {
      Editor.scrollBar.scrollWheel(e)
      e.preventDefault()
      e.stopPropagation()
    })

    Editor.JSEditor.appendChild(JSContent)
    me.contentChange.apply(me)
  }

  contentChange() {
    const me = this
    const Editor = me.Editor
    const fragment = document.createDocumentFragment()
    const JSGutterWrapper = document.createElement('div')
    JSGutterWrapper.className = 'JSGutterWrapper'

    const JSLineWrapperHidden = document.createElement('div')
    JSLineWrapperHidden.className = 'JSLineWrapperHidden'

    const JSLineWrapper = document.createElement('div')
    JSLineWrapper.className = 'JSLineWrapper'
    JSLineWrapperHidden.appendChild(JSLineWrapper)
    
    Editor.textPerLine.forEach((it, index) => {
      const JSGutter = document.createElement('div')
      JSGutter.className = 'JSGutter'
      css(JSGutter, {
        width: Editor.gutterWidth + 'px'
      })
      JSGutter.innerText = index
      JSGutterWrapper.appendChild(JSGutter)

      const JSLine = document.createElement('div')
      JSLine.className = 'JSLine'
      const JSLineSpan = document.createElement('span')
      JSLineSpan.className = 'JSLineSpan'

      const test2 = document.createElement('span')
      test2.innerText = it
      JSLineSpan.appendChild(test2)

      const test = document.createElement('span')
      test.innerHTML = '试试'
      JSLineSpan.appendChild(test)

      const test1 = document.createElement('span')
      test1.innerHTML = '试试大叔大婶'
      test.appendChild(test1)

      JSLine.appendChild(JSLineSpan)

      JSLineWrapper.appendChild(JSLine)
    })

    fragment.appendChild(JSGutterWrapper)
    fragment.appendChild(JSLineWrapperHidden)

    Editor.JSContent.appendChild(fragment)
    Editor.scrollBar.setScrollWidth()
  }
}
