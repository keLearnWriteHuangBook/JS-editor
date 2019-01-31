import { css } from './utils'
import { fromEvent } from 'rxjs'
import { takeUntil, map, concatAll, take } from 'rxjs/operators'
import './scrollBar.scss'

export default class scrollBar {
  constructor(Editor) {
    this.Editor = Editor
    
    Editor.scrollBarInfo = {
      verticalScrollTop: 0,
      verticalScrollLength: 0,
      verticalRate: 0,
      horizonScrollLeft: 0,
      horizonScrollLength: 0,
      horizonRate: 0,
      scrollRate: 0.5,//mousewheel事件中 delta与实际的移动比例,
      mouseScroll: false //是否处于鼠标点击滚动中
    }

    this.createScroll()
  }

  createScroll() {
    this.createHorizonScroll()
    this.createVerticalScroll()
  }

  createHorizonScroll() {
    const me = this
    const Editor = this.Editor
    const { gutterWidth, scrollThickness, JSEditor } = Editor
    const JSHorizonScroll = document.createElement('div')
    Editor.JSHorizonScroll = JSHorizonScroll
    JSHorizonScroll.className = 'JSHorizonScroll KEditorScroll'

    css(JSHorizonScroll, {
      width: `calc(100% - ${gutterWidth}px)`,
      left: gutterWidth + 'px',
      height: scrollThickness + 'px'
    })

    const JSHorizonScrollSlider = document.createElement('div')
    Editor.JSHorizonScrollSlider = JSHorizonScrollSlider
    JSHorizonScrollSlider.className = 'JSHorizonScrollSlider KEditorScroll'
    JSHorizonScroll.appendChild(JSHorizonScrollSlider)

    JSEditor.appendChild(JSHorizonScroll)

    const mousedown = fromEvent(JSHorizonScroll, 'mousedown')
    const mousemove = fromEvent(document, 'mousemove')
    const mouseup = fromEvent(document, 'mouseup')

    let startPos = {
      X: 0
    }
    mousedown
      .pipe(
        map(e => {
          e.stopPropagation()
          startPos.X = e.clientX
          me.scrollHorizonMouse(me, null, e)
         
          return mousemove.pipe(takeUntil(mouseup))
        }),
        concatAll()
      )
      .subscribe(e => me.scrollHorizonMouse(me, startPos, e))
  }

  createVerticalScroll() {
    const me = this
    const Editor = this.Editor
    const { scrollThickness, JSEditor } = Editor

    const JSVerticalScroll = document.createElement('div')
    Editor.JSVerticalScroll = JSVerticalScroll
    JSVerticalScroll.className = 'JSVerticalScroll KEditorScroll'

    css(JSVerticalScroll, {
      width: scrollThickness + 'px'
    })

    const JSVerticalScrollSlider = document.createElement('div')
    Editor.JSVerticalScrollSlider = JSVerticalScrollSlider
    JSVerticalScrollSlider.className = 'JSVerticalScrollSlider KEditorScroll'
    JSVerticalScroll.appendChild(JSVerticalScrollSlider)

    JSEditor.appendChild(JSVerticalScroll)

    const mousedown = fromEvent(JSVerticalScroll, 'mousedown')
    const mousemove = fromEvent(document, 'mousemove')
    const mouseup = fromEvent(document, 'mouseup')

    let startPos = {
      Y: 0
    }
    mousedown
      .pipe(
        map(e => {
          e.stopPropagation()
          startPos.Y = e.clientY
          me.scrollVerticalMouse(me, null, e)
          Editor.scrollBarInfo.mouseScroll = true
          return mousemove.pipe(takeUntil(mouseup))
        }),
        concatAll()
      )
      .subscribe(e => me.scrollVerticalMouse(me, startPos, e))
  }

  setScrollWidth() {
    this.setHorizonWidth()
    this.setVerticalWidth()
  }

  setHorizonWidth() {
    const { editorInfo, gutterWidth, JSHorizonScrollSlider, scrollBarInfo } = this.Editor
    const JSLine = document.querySelector('.JSLineWrapper .JSLine')
    const contentAllWidth = JSLine.getBoundingClientRect().width
    const contentViewWidth = editorInfo.width - gutterWidth
    let length
    console.log(contentAllWidth)
    if (contentAllWidth > contentViewWidth) {
      length = (contentViewWidth / contentAllWidth) * 100 + '%'
    } else {
      length = 0
    }
    css(JSHorizonScrollSlider, {
      width: length
    })
    scrollBarInfo.horizonScrollLength = JSHorizonScrollSlider.getBoundingClientRect().width
    this.setHorizonRate()
  }

  setVerticalWidth() {
    const { textPerLine, lineHeight, editorInfo, JSVerticalScrollSlider, scrollBarInfo } = this.Editor
    const contentAllHeight = textPerLine.length * lineHeight + editorInfo.height - lineHeight
    const contentViewHeight = editorInfo.height
    let length
    if (contentAllHeight > contentViewHeight) {
      length = (contentViewHeight / contentAllHeight) * 100 + '%'
    } else {
      length = 0
    }

    css(JSVerticalScrollSlider, {
      height: length
    })

    scrollBarInfo.verticalScrollLength = JSVerticalScrollSlider.getBoundingClientRect().height
    this.setVerticalRate()
  }

  setHorizonRate() {
    const { scrollBarInfo, editorInfo, gutterWidth } = this.Editor
    const JSLine = document.querySelector('.JSLineWrapper .JSLine')
    const contentAllWidth = JSLine.getBoundingClientRect().width
    scrollBarInfo.horizonRate =
      (contentAllWidth - editorInfo.width + gutterWidth) / (editorInfo.width - gutterWidth - scrollBarInfo.horizonScrollLength)
  }

  setVerticalRate() {
    const { textPerLine, lineHeight, editorInfo, scrollBarInfo } = this.Editor
    const contentAllHeight = textPerLine.length * lineHeight + editorInfo.height - lineHeight
    scrollBarInfo.verticalRate = (contentAllHeight - editorInfo.height) / (editorInfo.height - scrollBarInfo.verticalScrollLength)
  }

  scrollWheel(e) {
    const { scrollBarInfo, editorInfo, gutterWidth } = this.Editor

    if (e.deltaY !== 0 && scrollBarInfo.verticalScrollLength !== 0) {
      const top = scrollBarInfo.verticalScrollTop + e.deltaY * scrollBarInfo.scrollRate
      let nextTop = top
      if (top + scrollBarInfo.verticalScrollLength > editorInfo.height) {
        nextTop = editorInfo.height - scrollBarInfo.verticalScrollLength
      } else if (top < 0) {
        nextTop = 0
      } else {
        e.preventDefault()
        e.stopPropagation()
      }

      this.moveVertical(nextTop)
    }
 
    if (e.deltaX !== 0 && scrollBarInfo.horizonScrollLength !== 0) {
      const left = scrollBarInfo.horizonScrollLeft + e.deltaX * scrollBarInfo.scrollRate
      let nextLeft = left

      if (left + scrollBarInfo.horizonScrollLength > editorInfo.width - gutterWidth) {
        nextLeft = editorInfo.width - gutterWidth - scrollBarInfo.horizonScrollLength
      } else if (left < 0) {
        nextLeft = 0
      } else {
        e.preventDefault()
        e.stopPropagation()
      }

      this.moveHorizon(nextLeft)
    }
  }

  scrollHorizonMouse(me, startPos, e) {
    const { editorInfo, gutterWidth, scrollBarInfo } = me.Editor
    let mousePos = e.clientX - editorInfo.left - gutterWidth
    let nextLeft
  
    if (startPos === null) {
      if (e.target.className === 'JSHorizonScrollSlider') {
        nextLeft = scrollBarInfo.horizonScrollLeft
      } else {
        nextLeft = mousePos - scrollBarInfo.horizonScrollLength / 2
        console.log('nextLeft' + nextLeft)
        if (nextLeft + scrollBarInfo.horizonScrollLength > editorInfo.width - gutterWidth) {
          nextLeft = editorInfo.width - gutterWidth - scrollBarInfo.horizonScrollLength
        } else if (nextLeft < 0) {
          nextLeft = 0
        }
      }
    } else {
      nextLeft = scrollBarInfo.horizonScrollLeft + e.clientX - startPos.X
      console.log('nextLeft' + nextLeft)
      if (nextLeft + scrollBarInfo.horizonScrollLength > editorInfo.width - gutterWidth) {
        nextLeft = editorInfo.width - gutterWidth - scrollBarInfo.horizonScrollLength
      } else if (nextLeft < 0) {
        nextLeft = 0
      }
      startPos.X = e.clientX
    }
    console.log(nextLeft)
    me.moveHorizon(nextLeft)
  }

  scrollVerticalMouse(me, startPos, e) {
    const { editorInfo, scrollBarInfo } = me.Editor
    let mousePos = e.clientY - editorInfo.top
    let nextTop
  
    if (startPos === null) {
      if (e.target.className === 'JSVerticalScrollSlider') {
        nextTop = scrollBarInfo.verticalScrollTop
      } else {
        nextTop = mousePos - scrollBarInfo.verticalScrollLength / 2

        if (nextTop + scrollBarInfo.verticalScrollLength > editorInfo.height) {
          nextTop = editorInfo.height - scrollBarInfo.verticalScrollLength
        } else if (nextTop < 0) {
          nextTop = 0
        }
      }
    } else {
      nextTop = scrollBarInfo.verticalScrollTop + e.clientY - startPos.Y

      if (nextTop + scrollBarInfo.verticalScrollLength > editorInfo.height) {
        nextTop = editorInfo.height - scrollBarInfo.verticalScrollLength
      } else if (nextTop < 0) {
        nextTop = 0
      }
      startPos.Y = e.clientY
    }

    me.moveVertical(nextTop)
  }

  moveHorizon(left) {
    const { JSHorizonScrollSlider, JSLineWrapper, scrollBarInfo, cursor } = this.Editor
  
    css(JSHorizonScrollSlider, {
      left: left + 'px'
    })
    css(JSLineWrapper, {
      left: -left * scrollBarInfo.horizonRate + 'px'
    })
    scrollBarInfo.horizonScrollLeft = left
    cursor.moveCursor()
  }

  moveVertical(top) {
    const { JSVerticalScrollSlider, JSGutterWrapper, scrollBarInfo, JSLineWrapper, cursor, content } = this.Editor

    css(JSVerticalScrollSlider, {
      top: top + 'px'
    })
    css(JSGutterWrapper, {
      top: -top * scrollBarInfo.verticalRate + 'px'
    })
    css(JSLineWrapper, {
      top: -top * scrollBarInfo.verticalRate + 'px'
    })
    scrollBarInfo.verticalScrollTop = top
    cursor.moveCursor()
    content.renderLine()
  }
}
