import { css } from './utils'
import { fromEvent, empty } from 'rxjs'
import { takeUntil, map, concatAll, take } from 'rxjs/operators'

export default class JSContent {
  constructor(Editor) {
    const me = this
    me.Editor = Editor

    me.createContent.apply(me)
  }

  createContent() {
    const me = this

    const JSContent = document.createElement('div')
    me.Editor.JSContent = JSContent
    JSContent.className = 'JSContent'
    const mousedown = fromEvent(document, 'mousedown')
    const mousemove = fromEvent(document, 'mousemove')
    const mouseup = fromEvent(document, 'mouseup')

    mousedown.pipe(
      map(e => {
        //判断是否激活Editor
        if (me.Editor.JSEditor.contains(e.target)) {
          css(me.Editor.JSCursor, {
            display: 'block'
          })
          return mousemove.pipe(takeUntil(mouseup))
        } else {
          css(me.Editor.JSCursor, {
            display: 'none'
          })
          return mousemove.pipe(take(0))
        }
      }),
      concatAll()
    )
    .subscribe(e => console.log(e))
    
    me.Editor.JSEditor.appendChild(JSContent)
    me.contentChange.apply(me)
  }

  contentChange() {
    const me = this
    const fragment = document.createDocumentFragment()

    me.Editor.textPerLine.forEach((it, index) => {
      const JSLineWrapper = document.createElement('div')
      JSLineWrapper.className = 'JSLineWrapper'

      const JSGutter = document.createElement('span')
      JSGutter.className = 'JSGutter'
      JSGutter.innerText = index
      JSLineWrapper.appendChild(JSGutter)

      const JSLine = document.createElement('pre')
      JSLine.className = 'JSLine'
      JSLine.innerText = it
      JSLineWrapper.appendChild(JSLine)

      fragment.appendChild(JSLineWrapper)
    })

    me.Editor.JSContent.appendChild(fragment)
  }
}
