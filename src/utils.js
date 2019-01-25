import { from } from 'rxjs'

export function css(dom, obj) {
  for (let i in obj) {
    dom.style[i] = obj[i]
  }
}

export function removeDom(dom) {
  if (dom instanceof HTMLElement) {
    dom.parentNode.removeChild(dom)
  } else if (dom instanceof HTMLCollection) {
    dom = Array.from(dom)
    from(dom).subscribe(x => x.parentNode.removeChild(x))
  }
}
