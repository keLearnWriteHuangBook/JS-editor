import kJSEditor from '../index'

var dom = document.getElementById('editor')

window.editor = new kJSEditor(dom, {
    initText: 
`function () {
  var a = 1
}`
})
