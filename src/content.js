import { css } from './utils'
import { fromEvent, empty } from 'rxjs'
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
            css(Editor.JSCursor, {
              display: 'block'
            })
            Editor.cursor.moveToClickPoint(e)
            // 必须阻止默认事件，否则输入框无法聚焦
            e.preventDefault()
            Editor.JSTextarea.focus()
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
      .subscribe(Editor.cursor.moveToClickPoint.bind(Editor.cursor))

    mouseup.subscribe(e => {
      Editor.cursor.moveToClickPoint(e)
    })

    const mousewheel = fromEvent(JSContent, 'mousewheel')

    mousewheel.subscribe(e => {
      Editor.scrollBar.scrollWheel(e)
      e.preventDefault()
      e.stopPropagation()
    })

    Editor.JSEditor.appendChild(JSContent)
    this.initContent()
  }
  initContent() {
    const Editor = this.Editor,
      { gutterWidth, JSContent } = Editor

    const JSGutterWrapper = document.createElement('div')
    Editor.JSGutterWrapper = JSGutterWrapper
    JSGutterWrapper.className = 'JSGutterWrapper'
    JSGutterWrapper.style = `width:${gutterWidth}px;`

    const JSLineWrapperHidden = document.createElement('div')
    JSLineWrapperHidden.className = 'JSLineWrapperHidden'
    const contentWidth = JSContent.getBoundingClientRect().width
    JSLineWrapperHidden.style = `width:${contentWidth - gutterWidth}px`

    const JSLineWrapper = document.createElement('div')
    Editor.JSLineWrapper = JSLineWrapper
    JSLineWrapper.className = 'JSLineWrapper'
    JSLineWrapperHidden.appendChild(JSLineWrapper)

    let gutterHtml = '',
      contentHtml = ''
    Editor.textPerLine.forEach((item, index) => {
      gutterHtml += `<div class="JSGutter">${index}</div>`
      contentHtml += `<div class="JSLine">${item}</div>`
    })

    JSGutterWrapper.innerHTML = gutterHtml
    JSLineWrapper.innerHTML = contentHtml

    JSContent.appendChild(JSGutterWrapper)
    JSContent.appendChild(JSLineWrapperHidden)
  }
}
