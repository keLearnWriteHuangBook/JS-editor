import { css } from './utils'
import { fromEvent, empty } from 'rxjs'
import { takeUntil, map, concatAll, take } from 'rxjs/operators'

export default class kContent {
  constructor(Editor) {
    const me = this
    me.Editor = Editor

    me.createContent.apply(me)
  }

  createContent() {
    const me = this

    const KJSContent = document.createElement('div')
    me.Editor.KJSContent = KJSContent
    KJSContent.className = 'KJSContent'
    const mousedown = fromEvent(document, 'mousedown')
    const mousemove = fromEvent(document, 'mousemove')
    const mouseup = fromEvent(document, 'mouseup')

    mousedown.pipe(
      map(e => {
        //判断是否激活Editor
        if (me.Editor.KJSEditor.contains(e.target)) {
          css(me.Editor.KJSCursor, {
            display: 'block'
          })
          return mousemove.pipe(takeUntil(mouseup))
        } else {
          css(me.Editor.KJSCursor, {
            display: 'none'
          })
          return mousemove.pipe(take(0))
        }
      }),
      concatAll()
    )
    .subscribe(e => console.log(e))


    
    me.Editor.KJSEditor.appendChild(KJSContent)
    me.contentChange.apply(me)
  }

  contentChange() {
    const me = this
    const fragment = document.createDocumentFragment()

    me.Editor.textPerLine.forEach((it, index) => {
      const KJSLineWrapper = document.createElement('div')
      KJSLineWrapper.className = 'KJSLineWrapper'

      const KJSGutter = document.createElement('span')
      KJSGutter.className = 'KJSGutter'
      KJSGutter.innerText = index
      KJSLineWrapper.appendChild(KJSGutter)

      const KJSLine = document.createElement('pre')
      KJSLine.className = 'KJSLine'
      KJSLine.innerText = it
      KJSLineWrapper.appendChild(KJSLine)

      fragment.appendChild(KJSLineWrapper)
    })

    me.Editor.KJSContent.appendChild(fragment)
  }
}
