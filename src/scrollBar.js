import { css } from './utils'
import './scrollBar.scss'

export default class scrollBar {
  constructor (Editor) {
    this.Editor = Editor

    this.createScroll()
  }

  createScroll () {
    this.createHorizonScroll()
    this.createVerticalScroll()
  } 

  createHorizonScroll () {
    const JSHorizonScroll = document.createElement('div')
    this.Editor.JSHorizonScroll = JSHorizonScroll
    JSHorizonScroll.className = 'JSHorizonScroll'

    const JSHorizonScrollSlider = document.createElement('div')
    this.Editor.JSHorizonScrollSlider = JSHorizonScrollSlider
    JSHorizonScrollSlider.className = 'JSHorizonScrollSlider'
    JSHorizonScroll.appendChild(JSHorizonScrollSlider)

    this.Editor.JSEditor.appendChild(JSHorizonScroll)
  }

  createVerticalScroll () {
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

  setScrollWidth () {
    this.setHorizonWidth()
    this.setVerticalWidth()
  }

  setHorizonWidth () {
    const Editor = this.Editor
    const JSLine = document.querySelector('.JSLineWrapper .JSLine')
    const contentAllWidth = JSLine.getBoundingClientRect().width
    const contentViewWidth = Editor.editorWidth - Editor.gutterWidth

    css(Editor.JSHorizonScrollSlider, {
        width: (contentViewWidth / contentAllWidth) * 100 + '%'
    })

  }

  setVerticalWidth () {
    const Editor = this.Editor
    const contentAllHeight = Editor.textPerLine.length * Editor.lineHeight
    const contentViewHeight = Editor.editorHeight

    css(Editor.JSVerticalScrollSlider, {
        height: (contentViewHeight / contentAllHeight) * 100 + '%'
    })
  }

  scrollWheel (e) {
    console.log(e)
  }
}