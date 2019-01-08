import { css } from '../utils'

export function renderJSLine(Editor, textPerLine, startIndex, endIndex) {
  const fragment = document.createDocumentFragment()
  const { lineHeight } = Editor
  let singleQuotes = false
  let doubleQuotes = false
  let templateQuotes = false

  textPerLine.forEach((it, index) => {
    if (index < startIndex || index >= endIndex) {
      return
    }
    const JSLine = document.createElement('div')
    JSLine.className = 'JSLine'
    css(JSLine, {
      top: index * lineHeight + 'px'
    })
    const JSLineSpan = document.createElement('span')
    JSLineSpan.className = 'JSLineSpan'

    for (let i = 0; i < it.length; i++) {
        
    }

    JSLine.appendChild(JSLineSpan)
    fragment.appendChild(JSLine)
  })
}
