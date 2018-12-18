import { css } from './utils'
import './scrollBar.scss'

export default class scrollBar {
  constructor (Editor) {
    const me = this
    me.Editor = Editor

    me.createScroll.apply(me)
    me.setScrollWidth = me.setScrollWidth.bind(me)
  }

  createScroll () {
    const me = this

    me.createHorizonScroll.apply(me)
    me.createVerticalScroll.apply(me)
  } 

  createHorizonScroll () {
    const me = this

    const JSHorizonScroll = document.createElement('div')
    me.Editor.JSHorizonScroll = JSHorizonScroll
    JSHorizonScroll.className = 'JSHorizonScroll'

    const JSHorizonScrollSlider = document.createElement('div')
    me.Editor.JSHorizonScrollSlider = JSHorizonScrollSlider
    JSHorizonScrollSlider.className = 'JSHorizonScrollSlider'
    JSHorizonScroll.appendChild(JSHorizonScrollSlider)

    me.Editor.JSEditor.appendChild(JSHorizonScroll)
  }

  createVerticalScroll () {
    const me = this
    const Editor = me.Editor

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
    const me = this
    
    me.setHorizonWidth.apply(me)
    me.setVerticalWidth.apply(me)
  }

  setHorizonWidth () {
    const me = this
    const Editor = me.Editor
    const JSLine = document.querySelector('.JSLineWrapper .JSLine')
    const contentAllWidth = JSLine.getBoundingClientRect().width
    const contentViewWidth = Editor.editorWidth - Editor.gutterWidth

    css(Editor.JSHorizonScrollSlider, {
        width: (contentViewWidth / contentAllWidth) * 100 + '%'
    })

  }

  setVerticalWidth () {
    const me = this
    const Editor = me.Editor
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