import { NodeComponent } from 'substance'

export default class TableComponent extends NodeComponent {

  render($$) {
    let node = this.props.node
    let el = $$('div').addClass('sc-table')
    node.childNodes.forEach(child => {
      let doc = this.context.doc
      let childNode = doc.get(child)
      let comp = this.getComponent(childNode.type)
      if(comp) {
        el.append($$(comp, {node: childNode}))
      }
    })

    return el
  }
}
