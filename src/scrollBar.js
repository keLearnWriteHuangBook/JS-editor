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
      horizonRate: 0
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
    const JSHorizonScroll = document.createElement('div')
    Editor.JSHorizonScroll = JSHorizonScroll
    JSHorizonScroll.className = 'JSHorizonScroll'

    css(JSHorizonScroll, {
      width: `calc(100% - ${Editor.gutterWidth}px)`,
      left: Editor.gutterWidth + 'px',
      height: Editor.scrollThickness + 'px'
    })

    const JSHorizonScrollSlider = document.createElement('div')
    Editor.JSHorizonScrollSlider = JSHorizonScrollSlider
    JSHorizonScrollSlider.className = 'JSHorizonScrollSlider'
    JSHorizonScroll.appendChild(JSHorizonScrollSlider)

    Editor.JSEditor.appendChild(JSHorizonScroll)

    const mousedown = fromEvent(JSHorizonScroll, 'mousedown')
    const mousemove = fromEvent(document, 'mousemove')
    const mouseup = fromEvent(document, 'mouseup')

    let startPos = {
      X: 0
    }
    mousedown
      .pipe(
        map(e => {
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

    const JSVerticalScroll = document.createElement('div')
    Editor.JSVerticalScroll = JSVerticalScroll
    JSVerticalScroll.className = 'JSVerticalScroll'

    css(JSVerticalScroll, {
      width: Editor.scrollThickness + 'px'
    })

    const JSVerticalScrollSlider = document.createElement('div')
    Editor.JSVerticalScrollSlider = JSVerticalScrollSlider
    JSVerticalScrollSlider.className = 'JSVerticalScrollSlider'
    JSVerticalScroll.appendChild(JSVerticalScrollSlider)

    Editor.JSEditor.appendChild(JSVerticalScroll)

    const mousedown = fromEvent(JSVerticalScroll, 'mousedown')
    const mousemove = fromEvent(document, 'mousemove')
    const mouseup = fromEvent(document, 'mouseup')

    let startPos = {
      Y: 0
    }
    mousedown
      .pipe(
        map(e => {
          startPos.Y = e.clientY
          me.scrollVerticalMouse(me, null, e)

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
    const Editor = this.Editor
    const JSLine = document.querySelector('.JSLineWrapper .JSLine')
    const contentAllWidth = JSLine.getBoundingClientRect().width + Editor.scrollThickness * 2
    const contentViewWidth = Editor.editorWidth - Editor.gutterWidth
    let length
    if (contentAllWidth > contentViewWidth) {
      length = (contentViewWidth / contentAllWidth) * 100 + '%'
    } else {
      length = 0
    }
    css(Editor.JSHorizonScrollSlider, {
      width: length
    })

    Editor.scrollBarInfo.horizonScrollLength = Editor.JSHorizonScrollSlider.getBoundingClientRect().width
    this.setHorizonRate()
  }

  setVerticalWidth() {
    const Editor = this.Editor
    const contentAllHeight = Editor.textPerLine.length * Editor.lineHeight + Editor.editorHeight - Editor.lineHeight
    const contentViewHeight = Editor.editorHeight
    let length
    if (contentAllHeight > contentViewHeight) {
      length = (contentViewHeight / contentAllHeight) * 100 + '%'
    } else {
      length = 0
    }

    css(Editor.JSVerticalScrollSlider, {
      height: length
    })

    Editor.scrollBarInfo.verticalScrollLength = Editor.JSVerticalScrollSlider.getBoundingClientRect().height
    this.setVerticalRate()
  }

  setHorizonRate() {
    const Editor = this.Editor
    const JSLine = document.querySelector('.JSLineWrapper .JSLine')
    const contentAllWidth = JSLine.getBoundingClientRect().width + Editor.scrollThickness * 2
    Editor.scrollBarInfo.horizonRate =
      (contentAllWidth - Editor.editorWidth + Editor.gutterWidth) / (Editor.editorWidth - Editor.gutterWidth - Editor.scrollBarInfo.horizonScrollLength)
  }

  setVerticalRate() {
    const Editor = this.Editor
    const contentAllHeight = Editor.textPerLine.length * Editor.lineHeight + Editor.editorHeight - Editor.lineHeight
    Editor.scrollBarInfo.verticalRate = (contentAllHeight - Editor.editorHeight) / (Editor.editorHeight - Editor.scrollBarInfo.verticalScrollLength)
  }

  scrollWheel(e) {
    const Editor = this.Editor

    if (e.deltaY !== 0 && Editor.scrollBarInfo.verticalScrollLength !== 0) {
      const top = Editor.scrollBarInfo.verticalScrollTop + e.deltaY * 0.8
      let nextTop = top
      if (top + Editor.scrollBarInfo.verticalScrollLength > Editor.editorHeight) {
        nextTop = Editor.editorHeight - Editor.scrollBarInfo.verticalScrollLength
      } else if (top < 0) {
        nextTop = 0
      } else {
        e.preventDefault()
        e.stopPropagation()
      }

      this.moveVertical(nextTop)
    }
    console.log(e)
    if (e.deltaX !== 0 && Editor.scrollBarInfo.horizonScrollLength !== 0) {
      const left = Editor.scrollBarInfo.horizonScrollLeft + e.deltaX * 0.8
      let nextLeft = left

      if (left + Editor.scrollBarInfo.horizonScrollLength > Editor.editorWidth - Editor.gutterWidth) {
        nextLeft = Editor.editorWidth - Editor.gutterWidth - Editor.scrollBarInfo.horizonScrollLength
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
    const Editor = me.Editor
    let mousePos = e.clientX - Editor.editorLeft - Editor.gutterWidth
    let nextLeft
  
    if (startPos === null) {
      if (e.target.className === 'JSHorizonScrollSlider') {
        nextLeft = Editor.scrollBarInfo.horizonScrollLeft
      } else {
        nextLeft = mousePos - Editor.scrollBarInfo.horizonScrollLength / 2

        if (nextLeft + Editor.scrollBarInfo.horizonScrollLength > Editor.editorWidth - Editor.gutterWidth) {
          nextLeft = Editor.editorWidth - Editor.gutterWidth - Editor.scrollBarInfo.horizonScrollLength
        } else if (nextLeft < 0) {
          nextLeft = 0
        }
      }
    } else {
      nextLeft = Editor.scrollBarInfo.horizonScrollLeft + e.clientX - startPos.X

      if (nextLeft + Editor.scrollBarInfo.horizonScrollLength > Editor.editorWidth - Editor.gutterWidth) {
        nextLeft = Editor.editorHeight - Editor.gutterWidth - Editor.scrollBarInfo.horizonScrollLength
      } else if (nextLeft < 0) {
        nextLeft = 0
      }
      startPos.X = e.clientX
    }

    me.moveHorizon(nextLeft)
  }

  scrollVerticalMouse(me, startPos, e) {
    const Editor = me.Editor
    let mousePos = e.clientY - Editor.editorTop
    let nextTop
  
    if (startPos === null) {
      if (e.target.className === 'JSVerticalScrollSlider') {
        nextTop = Editor.scrollBarInfo.verticalScrollTop
      } else {
        nextTop = mousePos - Editor.scrollBarInfo.verticalScrollLength / 2

        if (nextTop + Editor.scrollBarInfo.verticalScrollLength > Editor.editorHeight) {
          nextTop = Editor.editorHeight - Editor.scrollBarInfo.verticalScrollLength
        } else if (nextTop < 0) {
          nextTop = 0
        }
      }
    } else {
      nextTop = Editor.scrollBarInfo.verticalScrollTop + e.clientY - startPos.Y

      if (nextTop + Editor.scrollBarInfo.verticalScrollLength > Editor.editorHeight) {
        nextTop = Editor.editorHeight - Editor.scrollBarInfo.verticalScrollLength
      } else if (nextTop < 0) {
        nextTop = 0
      }
      startPos.Y = e.clientY
    }

    me.moveVertical(nextTop)
  }

  moveHorizon(left) {
    const Editor = this.Editor

    css(Editor.JSHorizonScrollSlider, {
      left: left + 'px'
    })
    css(Editor.JSLineWrapper, {
      left: -left * Editor.scrollBarInfo.horizonRate + 'px'
    })
    Editor.scrollBarInfo.horizonScrollLeft = left
  }

  moveVertical(top) {
    const Editor = this.Editor

    css(Editor.JSVerticalScrollSlider, {
      top: top + 'px'
    })
    css(Editor.JSGutterWrapper, {
      top: -top * Editor.scrollBarInfo.verticalRate + 'px'
    })
    css(Editor.JSLineWrapper, {
      top: -top * Editor.scrollBarInfo.verticalRate + 'px'
    })
    Editor.scrollBarInfo.verticalScrollTop = top
  }
}
