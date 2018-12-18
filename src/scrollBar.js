import { css } from './utils'
import './scrollBar.scss'

export default class scrollBar {
  constructor(Editor) {
    this.Editor = Editor
    this.verticalScrollTop = 0
    this.verticalScrollLength = 0
    this.horizonScrollLeft = 0
    this.horizonScrollLength = 0

    this.createScroll()
  }

  createScroll() {
    this.createHorizonScroll()
    this.createVerticalScroll()
  }

  createHorizonScroll() {
    const Editor = this.Editor
    const JSHorizonScroll = document.createElement('div')
    Editor.JSHorizonScroll = JSHorizonScroll
    JSHorizonScroll.className = 'JSHorizonScroll'

    css(JSHorizonScroll, {
      width: `calc(100% - ${Editor.gutterWidth}px)`,
      left: Editor.gutterWidth + 'px'
    })

    const JSHorizonScrollSlider = document.createElement('div')
    Editor.JSHorizonScrollSlider = JSHorizonScrollSlider
    JSHorizonScrollSlider.className = 'JSHorizonScrollSlider'
    JSHorizonScroll.appendChild(JSHorizonScrollSlider)

    Editor.JSEditor.appendChild(JSHorizonScroll)
  }

  createVerticalScroll() {
    const Editor = this.Editor

    const JSVerticalScroll = document.createElement('div')
    Editor.JSVerticalScroll = JSVerticalScroll
    JSVerticalScroll.className = 'JSVerticalScroll'

    const JSVerticalScrollSlider = document.createElement('div')
    Editor.JSVerticalScrollSlider = JSVerticalScrollSlider
    JSVerticalScrollSlider.className = 'JSVerticalScrollSlider'
    JSVerticalScroll.appendChild(JSVerticalScrollSlider)

    Editor.JSEditor.appendChild(JSVerticalScroll)
  }

  setScrollWidth() {
    this.setHorizonWidth()
    this.setVerticalWidth()
  }

  setHorizonWidth() {
    const Editor = this.Editor
    const JSLine = document.querySelector('.JSLineWrapper .JSLine')
    const contentAllWidth = JSLine.getBoundingClientRect().width
    const contentViewWidth = Editor.editorWidth - Editor.gutterWidth

    css(Editor.JSHorizonScrollSlider, {
      width: (contentViewWidth / contentAllWidth) * 100 + '%'
    })

    this.horizonScrollLength = Editor.JSHorizonScrollSlider.getBoundingClientRect().width
  }

  setVerticalWidth() {
    const Editor = this.Editor
    const contentAllHeight = Editor.textPerLine.length * Editor.lineHeight + Editor.editorHeight - Editor.lineHeight
    const contentViewHeight = Editor.editorHeight

    css(Editor.JSVerticalScrollSlider, {
      height: (contentViewHeight / contentAllHeight) * 100 + '%'
    })

    this.verticalScrollLength = Editor.JSVerticalScrollSlider.getBoundingClientRect().height
  }

  scrollWheel(e) {
    const Editor = this.Editor
    const contentAllHeight = Editor.textPerLine.length * Editor.lineHeight + Editor.editorHeight - Editor.lineHeight
    const verticalRate = (contentAllHeight - Editor.editorHeight) / (Editor.editorHeight - this.verticalScrollLength)
    const JSLine = document.querySelector('.JSLineWrapper .JSLine')
    const contentAllWidth = JSLine.getBoundingClientRect().width
    const horizonRate = (contentAllWidth - Editor.editorWidth) / (Editor.editorWidth - Editor.gutterWidth - this.horizonScrollLength)
    if (e.deltaY !== 0) {
      const top = this.verticalScrollTop + e.deltaY * 0.8
      let nextTop = top
      if (top + this.verticalScrollLength > Editor.editorHeight) {
        nextTop = Editor.editorHeight - this.verticalScrollLength
      } else if (top < 0) {
        nextTop = 0
      }

      css(Editor.JSVerticalScrollSlider, {
        top: nextTop + 'px'
      })
      css(Editor.JSGutterWrapper, {
        top: -nextTop * verticalRate + 'px'
      })
      css(Editor.JSLineWrapper, {
        top: -nextTop * verticalRate + 'px'
      })
      this.verticalScrollTop = nextTop
    }
    console.log(e)
    if (e.deltaX !== 0) {
      const left = this.horizonScrollLeft + e.deltaX * 0.8
      let nextLeft = left

      if (left + this.horizonScrollLength > (Editor.editorWidth - Editor.gutterWidth)) {
        nextLeft = Editor.editorWidth - Editor.gutterWidth - this.horizonScrollLength
      } else if (left < 0) {
        nextLeft = 0
      }

      css(Editor.JSHorizonScrollSlider, {
        left: nextLeft + 'px'
      })
      css(Editor.JSLineWrapper, {
        left: -nextLeft * horizonRate + 'px'
      })
      this.horizonScrollLeft = nextLeft
    }
  }
}
