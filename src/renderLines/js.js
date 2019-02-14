import { css, getPosInStr } from '../utils'
import { keyword, declaration, splitSymbol } from '../config/jsConfig'

//每行最后是否处于模板字符串
let TQLastStatusPerLine = []
//每行最后是否处于多行注释
let MNLastStatusPerLine = []

export function renderJSLine(Editor, textPerLine, startIndex, endIndex) {
  const fragment = document.createDocumentFragment()
  const { lineHeight } = Editor

  let squareBrackets = 0
  let braces = 0
  let parentheses = 0
  let quotesType = null
  let annotationType = null

  textPerLine.forEach((it, index) => {
    if (index < startIndex || index >= endIndex) {
      return
    }

    quotesType = TQLastStatusPerLine[index - 1] ? 'templateQuotes' : null
    annotationType = MNLastStatusPerLine[index - 1] ? 'more' : null

    const JSLine = document.createElement('div')
    JSLine.className = 'JSLine'
    css(JSLine, {
      top: index * lineHeight + 'px'
    })
    const JSLineSpan = document.createElement('span')
    JSLineSpan.className = 'JSLineSpan'

    let currentStr = ''
    for (let i = 0; i < it.length; i++) {
      if (quotesType) {
        let quotesIsEnd
        currentStr += it[i]

        switch (quotesType) {
          case 'templateQuotes':
            it[i] === '`' ? (quotesIsEnd = true) : (quotesIsEnd = false)
            break
          case 'singleQuotes':
            it[i] === "'" ? (quotesIsEnd = true) : (quotesIsEnd = false)
            break
          case 'doubleQuotes':
            it[i] === '"' ? (quotesIsEnd = true) : (quotesIsEnd = false)
            break
        }

        if (quotesIsEnd) {
          createSpan(JSLineSpan, 'kTextString', currentStr)
          quotesType = null
          currentStr = ''
        }

        jugdeLastCharacter(i, it.length, JSLineSpan, currentStr, index, quotesType, annotationType)
        continue
      }

      //单行注释不会有，只需考虑多行注释
      if (annotationType) {
        currentStr += it[i]
        if (it[i] === '/' && it[i - 1] === '*') {
          createSpan(JSLineSpan, 'kTextAnnotation', currentStr)
          annotationType = null
          currentStr = ''
        }

        jugdeLastCharacter(i, it.length, JSLineSpan, currentStr, index, quotesType, annotationType)
        continue
      }

      if (splitSymbol[it[i]]) {
        if (currentStr !== '') {
          if (isNaN(currentStr)) {
            if (keyword[currentStr]) {
              createSpan(JSLineSpan, `kText${keyword[currentStr]}`, currentStr)
            } else {
              createSpan(JSLineSpan, 'kTextVariable', currentStr)
            }
          } else {
            createSpan(JSLineSpan, 'kTextNumber', currentStr)
          }
        }

        if (it[i] === '/' && (it[i + 1] === '/' || it[i + 1] === '*')) {
          //为单行注释时，当前行后续全为注释
          if (it[i + 1] === '/') {
            annotationType = 'single'
            currentStr = it.slice(i)
            i = it.length - 1
          } else if (it[i + 1] === '*') {
            annotationType = 'more'
            currentStr = it[i] + it[i + 1]
            i++
          }

          jugdeLastCharacter(i, it.length, JSLineSpan, currentStr, index, quotesType, annotationType)
        } else if (it[i] === '"' || it[i] === '`' || it[i] === "'") {
          switch (it[i]) {
            case '"':
              quotesType = 'doubleQuotes'
              break
            case '`':
              quotesType = 'templateQuotes'
              break
            case "'":
              quotesType = 'singleQuotes'
              break
          }
          currentStr = it[i]
          jugdeLastCharacter(i, it.length, JSLineSpan, currentStr, index, quotesType, annotationType)
        } else {
          createSpan(JSLineSpan, 'kTextOther', it[i])
          currentStr = ''
          jugdeLastCharacter(i, it.length, JSLineSpan, currentStr, index, quotesType, annotationType)
        }
        continue
      }

      currentStr += it[i]
      jugdeLastCharacter(i, it.length, JSLineSpan, currentStr, index, quotesType, annotationType)
    }

    if (it.length === 0) {
      TQLastStatusPerLine[index] = TQLastStatusPerLine[index - 1]
      MNLastStatusPerLine[index] = MNLastStatusPerLine[index - 1]
    }
  
    JSLine.appendChild(JSLineSpan)
    fragment.appendChild(JSLine)
  })

  return fragment
}

function createSpan(JSLineSpan, cls, text) {
  const dom = document.createElement('span')
  dom.className = cls
  text = text
    .replace(/ /g, '&nbsp;')
    .replace(/</g, '&lt;')
    .replace(/>/, '&gt;')
  dom.innerHTML = text
  JSLineSpan.appendChild(dom)
}

function jugdeLastCharacter(curIndex, length, JSLineSpan, text, currentLine, quotesType, annotationType) {
  if (curIndex === length - 1) {
    if (quotesType) {
      createSpan(JSLineSpan, 'kTextString', text)
    } else if (annotationType) {
      createSpan(JSLineSpan, 'kTextAnnotation', text)
    } else if (keyword[text]) {
      createSpan(JSLineSpan, `kText${keyword[text]}`, text)
    } else if (isNaN(text)) {
      createSpan(JSLineSpan, 'kTextVariable', text)
    } else if (!isNaN(text)) {
      createSpan(JSLineSpan, 'kTextNumber', text)
    }

    if (quotesType === 'templateQuotes') {
      TQLastStatusPerLine[currentLine] = true
    } else {
      TQLastStatusPerLine[currentLine] = false
    }
    if (annotationType === 'more') {
      MNLastStatusPerLine[currentLine] = true
    } else {
      MNLastStatusPerLine[currentLine] = false
    }
  }
}
