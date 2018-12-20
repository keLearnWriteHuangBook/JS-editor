import { css } from './utils'
import { fromEvent } from 'rxjs'
import { takeUntil, map, concatAll, take } from 'rxjs/operators'
import './content.scss'

export default class JSContent {
  constructor(Editor) {
    this.Editor = Editor

    this.createContent()
  }

  createContent() {
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
            Editor.cursor.moveToClickPoint(e)
            // 必须阻止默认事件，否则输入框无法聚焦
            e.preventDefault()
            Editor.JSTextarea.focus()
            return mousemove.pipe(takeUntil(mouseup))
          } else {
            Editor.cursor.hideCursor()
            return mousemove.pipe(take(0))
          }
        }),
        concatAll()
      )
      .subscribe(Editor.cursor.moveToClickPoint.bind(Editor.cursor))

    mouseup.subscribe(e => {
      Editor.cursor.moveToClickPoint(e)
    })

    const mousewheel = fromEvent(JSContent, 'mousewheel')

    mousewheel.subscribe(e => {
      Editor.scrollBar.scrollWheel(e)
    })

    Editor.JSEditor.appendChild(JSContent)
    this.initContent()
  }
  initContent() {
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
