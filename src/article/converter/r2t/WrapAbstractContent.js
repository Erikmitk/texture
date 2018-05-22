import { unwrapChildren } from '../util/domHelpers'

const ABSTRACT_META = ['object-id','sec-meta', 'label', 'title'].reduce((m, n) => { m[n] = true; return m}, {})
const ABSTRACT_BACK = ['notes','fn-group','glossary','ref-list'].reduce((m, n) => { m[n] = true; return m}, {})

export default class WrapAbstractContent {

  import(dom) {
    let abstracts = dom.findAll('abstract').concat(dom.findAll('trans-abstract'))
    abstracts.forEach( (abstract) => {
      // restructure child nodes
      const meta = []
      const content = []
      const back = []
      abstract.children.forEach((child) => {
        const tagName = child.tagName
        if (ABSTRACT_META[tagName]) {
          meta.push(child)
        } else if (ABSTRACT_BACK[tagName]) {
          back.push(child)
        } else {
          content.push(child)
        }
      })
      abstract.empty()
      abstract.append(meta)

      // Make sure that there is at least one paragraph inside the abstract
      if (content.length === 0) {
        content.push(dom.createElement('p'))
      }

      abstract.append(dom.createElement('abstract-content').append(content))
      abstract.append(back)
    })
  }

  export(dom) {
    let abstractContentEls = dom.findAll('abstract-content')
    abstractContentEls.forEach((abstractContent) => {
      // pull children of abstract-content up one layer
      unwrapChildren(abstractContent)
    })
  }
}
